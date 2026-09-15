import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async getOrder(orderId: string, userId: string): Promise<Order> {
    console.log('OrderId ', orderId);
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: { user: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    // Only the owner can view the order
    if (order.user.id !== userId) {
      throw new UnauthorizedException('You do not have access to this order');
    }
    return order;
  }

  async listOrders(userId: string): Promise<Order[]> {
    return this.ordersRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
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
