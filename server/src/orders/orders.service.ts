import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../admin/product.entity';
import { User } from '../users/user.entity';

export interface OrderCheckoutResult {
  orderId: string;
  sessionId: string;
  url: string | null;
}

/** Order row returned by `listOrders`: the order plus derived summary fields. */
export type OrderListItem = Order & {
  itemCount: number;
  totalQuantity: number;
  previewImageUrl: string | null;
};

export type OrderListResult = {
  data: OrderListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
};

/** Default page size when the client does not send `limit`. */
const ORDERS_DEFAULT_LIMIT = 10;
/** Hard ceiling so a malicious client cannot request an unbounded page. */
const ORDERS_MAX_LIMIT = 50;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  private get stripe(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('Stripe is not configured');
    }
    return new Stripe(secretKey, {
      apiVersion: '2026-08-26.dahlia',
    });
  }

  private getClientBaseUrl(): string {
    return (process.env.CLIENT_BASE_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
  }

  async createOrder(
    dto: CreateOrderDto,
    user: User,
  ): Promise<OrderCheckoutResult> {
    if (!dto.items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Load products to validate + snapshot details
    const productIds = dto.items.map((i) => i.productId);
    const loaded = await this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.shop', 'shop')
      .where('product.id IN (:...ids)', { ids: productIds })
      .getMany();

    if (loaded.length !== productIds.length) {
      throw new BadRequestException('One or more products were not found');
    }

    const priceById = new Map(loaded.map((p) => [p.id, p]));
    const snapshot = dto.items.map((item) => {
      const product = priceById.get(item.productId);
      return {
        productId: item.productId,
        name: product?.name ?? 'Product',
        price: product?.price ?? 0,
        quantity: item.quantity,
        imageUrl: product?.imageUrl?.[0] ?? null,
        shopId: product?.shop?.id ?? null,
        shopName: product?.shop?.name ?? null,
      };
    });

    const amountTotal = snapshot.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (amountTotal <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    const order = this.ordersRepo.create({
      // `userId` is the denormalized FK column that the composite index uses;
      // `user` is set so TypeORM can persist the relation.
      userId: user.id,
      user: { id: user.id },
      amountTotal,
      currency: 'usd',
      status: OrderStatus.PENDING,
      items: snapshot,
    });
    const saved = await this.ordersRepo.save(order);

    // Create Stripe Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: snapshot.map((item) => ({
        price_data: {
          currency: item.price ? 'usd' : 'usd',
          product_data: {
            name: item.name,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      client_reference_id: saved.id,
      customer_email: user.email,
      metadata: {
        orderId: saved.id,
        userId: user.id,
      },
      payment_intent_data: {
        metadata: {
          orderId: saved.id,
          userId: user.id,
        },
      },
      success_url: `${this.getClientBaseUrl()}/payment/status?order_id=${saved.id}&status=success`,
      cancel_url: `${this.getClientBaseUrl()}/payment/status?order_id=${saved.id}&status=cancelled`,
    });

    saved.stripeSessionId = session.id;
    await this.ordersRepo.save(saved);

    return {
      orderId: saved.id,
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Loads a single order scoped to its owner.
   *
   * The ownership check is done in the WHERE clause instead of fetching first
   * and comparing afterwards, so an order owned by someone else is reported
   * as "not found" in a single query rather than a full row read plus a check.
   */
  async getOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Paginated, optionally status-filtered order history for one user.
   *
   * Uses `findAndCount` so the page of rows and the total come back in a
   * single round trip, and computes the per-order summary server-side to keep
   * the client from re-reducing the item snapshots on every render.
   *
   * NOTE: `userId` must be the internal `users.id` UUID, not the Clerk id.
   */
  async listOrders(
    userId: string,
    options: { page?: number; limit?: number; status?: OrderStatus } = {},
  ): Promise<OrderListResult> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(
      ORDERS_MAX_LIMIT,
      Math.max(1, options.limit ?? ORDERS_DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Order> = { user: { id: userId } };
    if (options.status) {
      where.status = options.status;
    }

    const [orders, total] = await this.ordersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data: orders.map((order) => this.toListItem(order)),
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /** Derives the summary fields the order list renders. */
  private toListItem(order: Order): OrderListItem {
    const items = order.items ?? [];
    const totalQuantity = items.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0,
    );

    // The snapshot is a JSON column, so the preview image is only available
    // here on the server — find the first usable one for the list thumbnail.
    const previewImageUrl =
      items.find((item) => !!item.imageUrl)?.imageUrl ?? null;

    return {
      ...order,
      itemCount: items.length,
      totalQuantity,
      previewImageUrl,
    };
  }

  /** Create a new Stripe session for an existing (failed) order. */
  async retryPayment(
    orderId: string,
    userId: string,
  ): Promise<OrderCheckoutResult> {
    const order = await this.getOrder(orderId, userId);

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('This order has already been paid');
    }

    if (!order.items?.length) {
      throw new BadRequestException('Order has no items to retry');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        userId,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          userId,
        },
      },
      success_url: `${this.getClientBaseUrl()}/payment/status?order_id=${order.id}&status=success`,
      cancel_url: `${this.getClientBaseUrl()}/payment/status?order_id=${order.id}&status=cancelled`,
    });

    order.stripeSessionId = session.id;
    // Reset status so webhook can flip it back to PAID on success
    order.status = OrderStatus.PENDING;
    await this.ordersRepo.save(order);

    return { orderId: order.id, sessionId: session.id, url: session.url };
  }

  async updateStatusBySession(
    sessionId: string,
    status: OrderStatus,
    paymentIntentId?: string,
    amountTotal?: number,
  ): Promise<Order | null> {
    const order = await this.ordersRepo.findOne({
      where: { stripeSessionId: sessionId },
    });
    if (!order) return null;

    order.status = status;
    if (paymentIntentId) order.stripePaymentIntentId = paymentIntentId;
    if (amountTotal) order.amountTotal = amountTotal;
    return this.ordersRepo.save(order);
  }

  async getOrderBySession(sessionId: string): Promise<Order | null> {
    return this.ordersRepo.findOne({ where: { stripeSessionId: sessionId } });
  }

  async markPaidByOrderId(
    orderId: string,
    paymentIntentId?: string,
    amountTotal?: number,
  ): Promise<Order | null> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order) return null;

    order.status = OrderStatus.PAID;
    if (paymentIntentId) order.stripePaymentIntentId = paymentIntentId;
    if (amountTotal) order.amountTotal = amountTotal;
    return this.ordersRepo.save(order);
  }

  async markFailedByOrderId(orderId: string): Promise<Order | null> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order) return null;

    order.status = OrderStatus.PAYMENT_FAILED;
    return this.ordersRepo.save(order);
  }
}
