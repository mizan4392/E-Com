import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import {
  aggregateDeliveryStatus,
  DeliveryStatus,
  OrderItem,
} from './order-item.entity';
import { Shop } from '../admin/shop.entity';
import { User } from '../users/user.entity';
import { ProductReview } from '../products/product-review.entity';

export type ShopOrderItemReview = {
  rating: number;
  message: string;
  reviewerName: string;
  createdAt: string;
};

/** One line of an order, as the owning shop sees it. */
export type ShopOrderItemView = {
  id: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  /**
   * The shop fulfilling this line. A single order can span several of the
   * seller's shops, so the card groups by order and labels each product with
   * the shop that owes the seller money for it.
   */
  shopId: string | null;
  shopName: string;
  review: ShopOrderItemReview | null;
};

/**
 * One order in a seller's inbox — ONE row per ORDER, never one per product and
 * never one per shop.
 *
 * The grain used to be (order, shop), which meant a basket spanning two of the
 * same seller's shops rendered as two identical-looking cards with the same
 * order number. The seller ships one parcel, gets one payout and sets one
 * stage, so the order is the only grain the UI can present honestly. Shop
 * identity is preserved on each item instead of splitting the order.
 */
export type ShopOrderListItem = {
  orderId: string;
  status: OrderStatus;
  /** The ONE fulfilment stage for this order. */
  deliveryStatus: DeliveryStatus;
  currency: string;
  items: ShopOrderItemView[];
  itemCount: number;
  totalQuantity: number;
  /** Revenue across the seller's lines only, never the buyer's whole basket. */
  shopAmount: number;
  /** Distinct shops contributing to this order, for the "N shops" hint. */
  shopCount: number;
  previewImageUrl: string | null;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  createdAt: string;
  buyerConfirmedAt: string | null;
  /** Newest acknowledgement timestamp across the order's lines, or null. */
  acknowledgedAt: string | null;
  /** True until the seller first acts on any line of this order. */
  isNew: boolean;
};

export type ShopOrderListResult = {
  data: ShopOrderListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
};

export type ShopOrderSummary = {
  /** Distinct paid orders containing this shop's products. */
  total: number;
  /** Paid orders with no seller action yet in the selected shop scope. */
  newPaid: number;
  /** Paid orders with at least one seller action in the selected scope. */
  actioned: number;
};

const SHOP_ORDERS_DEFAULT_LIMIT = 10;
const SHOP_ORDERS_MAX_LIMIT = 50;

@Injectable()
export class ShopOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Shop)
    private readonly shopsRepo: Repository<Shop>,
    @InjectRepository(ProductReview)
    private readonly reviewsRepo: Repository<ProductReview>,
  ) {}

  /**
   * Proves the caller owns `shopId` and returns the row.
   *
   * The seller's own UI needs to tell "not yours" (403) from "doesn't exist"
   * (404) apart, so both are thrown rather than being collapsed.
   */
  private async assertShopOwner(userId: string, shopId: string): Promise<Shop> {
    const shop = await this.shopsRepo.findOne({
      where: { id: shopId },
      relations: { user: true },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage orders for this shop',
      );
    }

    return shop;
  }

  /**
   * Resolves which shops a request may read.
   *
   * With an explicit `shopId` it is ownership-checked first, so a non-owner
   * gets 403 instead of silently falling back to their own shops. Without one
   * the caller gets their entire inbox, which is what "My Shop" renders.
   */
  private async resolveShopScope(
    userId: string,
    shopId?: string,
  ): Promise<{ shopIds: string[]; shopsById: Map<string, Shop> }> {
    if (shopId) {
      const shop = await this.assertShopOwner(userId, shopId);
      return { shopIds: [shop.id], shopsById: new Map([[shop.id, shop]]) };
    }

    const shops = await this.shopsRepo.find({
      where: { user: { id: userId } },
    });
    return {
      shopIds: shops.map((s) => s.id),
      shopsById: new Map(shops.map((s) => [s.id, s])),
    };
  }

  /**
   * Base query over the shop-scoped line items, joined to the paid order.
   *
   * Everything filters off `order_items` because that is the only table that
   * can answer "which orders involve my products" without reading the `items`
   * JSON blob. `synchronize: true` means `IDX_order_items_shop` exists on boot
   * without a migration.
   */
  private scopedItemsQb(shopIds: string[]) {
    return this.orderItemsRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('item."shopId" IN (:...shopIds)', { shopIds })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID });
  }

  /**
   * Paginated seller inbox, at (order, shop) grain.
   *
   * Three cheap indexed queries rather than one clever one:
   *   1. count distinct (order, shop) pairs -> `total`
   *   2. one page of pairs, newest first
   *   3. hydrate the items + buyer for just those pairs
   *
   * Paging happens on the (order, shop) grain in step 2. The same basket can
   * legitimately create one seller row per owned shop; paging by order alone
   * would let one order span pages and return more rows than the page size.
   */
  async listShopOrders(
    userId: string,
    options: {
      shopId?: string;
      page?: number;
      limit?: number;
      deliveryStatus?: DeliveryStatus;
      newOnly?: boolean;
    } = {},
  ): Promise<ShopOrderListResult> {
    const { shopIds, shopsById } = await this.resolveShopScope(
      userId,
      options.shopId,
    );

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(
      SHOP_ORDERS_MAX_LIMIT,
      Math.max(1, options.limit ?? SHOP_ORDERS_DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;

    // A seller with no shops has an empty inbox, not every order in the app.
    if (shopIds.length === 0) {
      return { data: [], total: 0, currentPage: page, totalPages: 1 };
    }

    const applyFilters = (qb: ReturnType<typeof this.scopedItemsQb>) => {
      if (options.deliveryStatus) {
        // Matches an order when ANY of this shop's lines is in that stage.
        qb.andWhere('item."deliveryStatus" = :deliveryStatus', {
          deliveryStatus: options.deliveryStatus,
        });
      }
      if (options.newOnly) {
        // Scoped to the caller's shops, not to one shop: an order is new until
        // the seller acts on any of the lines they own.
        qb.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM order_items acknowledged
            WHERE acknowledged."orderId" = item."orderId"
              AND acknowledged."shopId" IN (:...shopIds)
              AND acknowledged."acknowledgedAt" IS NOT NULL
          )`,
        );
      }
      return qb;
    };

    const [totalRaw] = await applyFilters(this.scopedItemsQb(shopIds))
      .select('COUNT(DISTINCT item."orderId")', 'total')
      .getRawMany<{ total: string }>();

    const total = Number(totalRaw?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (total === 0) {
      return { data: [], total: 0, currentPage: page, totalPages };
    }

    const pageRows = await applyFilters(this.scopedItemsQb(shopIds))
      .select('item."orderId"', 'orderId')
      .addSelect('MAX("order"."createdAt")', 'createdAt')
      .groupBy('item."orderId"')
      .orderBy('"createdAt"', 'DESC')
      .addOrderBy('item."orderId"', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{ orderId: string; createdAt: string }>();

    if (pageRows.length === 0) {
      return { data: [], total, currentPage: page, totalPages };
    }

    const orderIds = [...new Set(pageRows.map((r) => r.orderId))];

    // Every line the SELLER owns on this page of orders — not only the line
    // that satisfied the status filter, because the card shows the whole order.
    const rowsQuery = this.orderItemsRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.order', 'order')
      .leftJoinAndSelect('order.user', 'customer')
      .where('item."shopId" IN (:...shopIds)', { shopIds })
      .andWhere('item."orderId" IN (:...orderIds)', { orderIds })
      .orderBy('item.id', 'ASC');
    const rows = await rowsQuery.getMany();
    const reviewsByItemId = await this.getReviewsByItemIds(
      rows.map((row) => row.id),
    );

    const createdAtByOrder = new Map(
      pageRows.map((r) => [r.orderId, r.createdAt]),
    );
    const orderSequence = new Map(
      pageRows.map((r, index) => [r.orderId, index]),
    );

    // Group by ORDER. One card per order, whatever the basket contained.
    //
    // `statuses` is kept alongside the item views rather than on them: the
    // response exposes ONE status per order, but the order's status is derived
    // from its lines, so the values have to survive the grouping step.
    const grouped = new Map<
      string,
      ShopOrderListItem & {
        acknowledged: boolean[];
        statuses: DeliveryStatus[];
      }
    >();

    for (const row of rows) {
      const order = row.order;
      if (!order) continue;

      const key = order.id;
      let entry = grouped.get(key);

      if (!entry) {
        entry = {
          orderId: order.id,
          status: order.status,
          deliveryStatus: DeliveryStatus.PENDING,
          currency: order.currency,
          items: [],
          itemCount: 0,
          totalQuantity: 0,
          shopAmount: 0,
          shopCount: 0,
          previewImageUrl: null,
          customerName: buildCustomerName(order.user),
          customerEmail: order.user?.email ?? '',
          deliveryAddress: order.deliveryAddress ?? null,
          deliveryPhone: order.deliveryPhone ?? null,
          createdAt: createdAtByOrder.get(key) ?? order.createdAt,
          buyerConfirmedAt: order.buyerConfirmedAt ?? null,
          acknowledgedAt: null,
          isNew: true,
          acknowledged: [],
          statuses: [],
        };
        grouped.set(key, entry);
      }

      entry.items.push({
        id: row.id,
        productId: row.productId ?? null,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        imageUrl: row.imageUrl ?? null,
        shopId: row.shopId ?? null,
        shopName: shopsById.get(row.shopId ?? '')?.name ?? 'Shop',
        review: reviewsByItemId.get(row.id) ?? null,
      });
      entry.acknowledged.push(!!row.acknowledgedAt);
      entry.statuses.push(row.deliveryStatus);
      entry.shopAmount += row.price * row.quantity;
      entry.totalQuantity += row.quantity ?? 0;

      if (!entry.acknowledgedAt && row.acknowledgedAt) {
        entry.acknowledgedAt = row.acknowledgedAt;
      }
    }

    const data = [...grouped.values()]
      .map(({ acknowledged, statuses, ...entry }) => ({
        ...entry,
        itemCount: entry.items.length,
        shopCount: new Set(entry.items.map((i) => i.shopId)).size,
        previewImageUrl:
          entry.items.find((i) => !!i.imageUrl)?.imageUrl ?? null,
        shopAmount: round2(entry.shopAmount),
        // Fulfilment is tracked per ORDER, but it is still STORED per line —
        // the only writable path moves every line of the order together, so
        // these are always equal in practice. Deriving it keeps the response
        // correct even for rows written before that rule was enforced.
        deliveryStatus: aggregateDeliveryStatus(statuses),
        // One seller action on any line acknowledges the order.
        isNew: !acknowledged.some(Boolean),
      }))
      .sort(
        (a, b) =>
          (orderSequence.get(a.orderId) ?? 0) -
          (orderSequence.get(b.orderId) ?? 0),
      );

    return { data, total, currentPage: page, totalPages };
  }

  /**
   * Headline counters behind the unread badge.
   *
   * One grouped aggregate instead of loading the list, so the My Shop badge
   * stays a single indexed scan no matter how many orders exist.
   */
  async getShopOrderSummary(
    userId: string,
    shopId?: string,
  ): Promise<ShopOrderSummary> {
    const { shopIds } = await this.resolveShopScope(userId, shopId);

    if (shopIds.length === 0) {
      return { total: 0, newPaid: 0, actioned: 0 };
    }

    const rows = await this.scopedItemsQb(shopIds)
      .select('COUNT(DISTINCT item."orderId")', 'total')
      // The first action on any line acknowledges the order for this scope.
      // This counts each paid order once even if it spans multiple shops.
      .addSelect(
        `COUNT(DISTINCT item."orderId") FILTER (
           WHERE EXISTS (
             SELECT 1 FROM order_items oi
             WHERE oi."orderId" = item."orderId"
               AND oi."shopId" IN (:...shopIds)
               AND oi."acknowledgedAt" IS NOT NULL
           )
         )`,
        'actioned',
      )
      .getRawMany<{ total: string; actioned: string }>();

    const total = Number(rows[0]?.total ?? 0);
    const actioned = Number(rows[0]?.actioned ?? 0);

    return { total, actioned, newPaid: Math.max(0, total - actioned) };
  }

  /**
   * Per-shop counters for every shop the caller owns, in one query.
   *
   * The My Shop page renders a badge on each shop card. Asking the summary
   * endpoint once per shop would be an N+1 on first paint, so this returns the
   * whole map in a single grouped aggregate. Shops with no orders are still
   * present, mapped to zeros, so the client never has to null-check.
   */
  async getShopOrderSummaryMap(
    userId: string,
  ): Promise<Record<string, ShopOrderSummary>> {
    const shops = await this.shopsRepo.find({
      where: { user: { id: userId } },
    });

    const result: Record<string, ShopOrderSummary> = {};
    for (const shop of shops) {
      result[shop.id] = { total: 0, newPaid: 0, actioned: 0 };
    }

    if (shops.length === 0) {
      return result;
    }

    const shopIds = shops.map((s) => s.id);

    const rows = await this.orderItemsRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item."shopId"', 'shopId')
      .addSelect('COUNT(DISTINCT item."orderId")', 'total')
      .addSelect(
        `COUNT(DISTINCT item."orderId") FILTER (
           WHERE EXISTS (
             SELECT 1 FROM order_items oi
             WHERE oi."orderId" = item."orderId"
               AND oi."shopId" = item."shopId"
               AND oi."acknowledgedAt" IS NOT NULL
           )
         )`,
        'actioned',
      )
      .where('item."shopId" IN (:...shopIds)', { shopIds })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
      .groupBy('item."shopId"')
      .getRawMany<{ shopId: string; total: string; actioned: string }>();

    for (const row of rows) {
      const total = Number(row.total ?? 0);
      const actioned = Number(row.actioned ?? 0);
      result[row.shopId] = {
        total,
        actioned,
        newPaid: Math.max(0, total - actioned),
      };
    }

    return result;
  }

  /**
   * Moves every line the seller owns in this order to a new fulfilment stage.
   *
   * This is the action that retires the unread badge: `acknowledgedAt` is
   * stamped on first touch and never cleared, so an order cannot reappear as
   * "new" after a seller corrects a mistake.
   *
   * `shopId` is an optional SCOPE filter, not the identity of the order. It
   * narrows the write to one of the caller's shops when they are looking at
   * that shop's filtered view; omitting it moves all of the caller's lines.
   */
  async updateOrderDeliveryStatus(
    userId: string,
    orderId: string,
    shopId: string | undefined,
    deliveryStatus: DeliveryStatus,
  ): Promise<ShopOrderListItem> {
    const { shopIds } = await this.resolveShopScope(userId, shopId);
    if (shopIds.length === 0) {
      throw new ForbiddenException('You do not own any shop');
    }

    const order = await this.assertPaidOrder(orderId);
    this.assertNotBuyerConfirmed(order);

    const items = await this.orderItemsRepo
      .createQueryBuilder('item')
      .where('item."orderId" = :orderId', { orderId })
      .andWhere('item."shopId" IN (:...shopIds)', { shopIds })
      .getMany();
    if (items.length === 0) {
      throw new NotFoundException('This order has no items from your shops');
    }

    const now = new Date().toISOString();
    for (const item of items) {
      item.deliveryStatus = deliveryStatus;
      item.acknowledgedAt = item.acknowledgedAt ?? now;
      item.deliveryUpdatedAt = now;
    }
    await this.orderItemsRepo.save(items);

    return this.buildShopOrder(userId, orderId, shopIds, order);
  }

  /**
   * Single order detail for a seller.
   *
   * `shopId` is optional: pass it to view the order as scoped to one shop,
   * omit it for the order across every shop the caller owns — which is what the
   * list links to, since a card there is no longer tied to one shop.
   */
  async getShopOrder(
    userId: string,
    orderId: string,
    shopId?: string,
  ): Promise<ShopOrderListItem> {
    const { shopIds } = await this.resolveShopScope(userId, shopId);
    if (shopIds.length === 0) {
      throw new ForbiddenException('You do not own any shop');
    }

    const order = await this.assertPaidOrder(orderId);
    return this.buildShopOrder(userId, orderId, shopIds, order);
  }

  private assertNotBuyerConfirmed(order: Order): void {
    if (order.buyerConfirmedAt) {
      throw new BadRequestException(
        'Delivery status cannot change after the buyer confirms receipt',
      );
    }
  }

  /**
   * A seller may only fulfil what has actually been charged. Loading it here
   * keeps the same rule on the read path and on both write paths.
   */
  private async assertPaidOrder(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: { user: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Delivery status can only be updated for paid orders',
      );
    }
    return order;
  }

  /**
   * Assembles the seller-facing order view.
   *
   * Shared by the detail route and the update route, so a seller always gets
   * the same shape after a mutation as before it — the client can drop the
   * response straight into its cache.
   */
  private async buildShopOrder(
    userId: string,
    orderId: string,
    shopIds: string[],
    preloadedOrder?: Order,
  ): Promise<ShopOrderListItem> {
    const order =
      preloadedOrder ??
      (await this.ordersRepo.findOne({
        where: { id: orderId },
        relations: { user: true },
      }));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.orderItemsRepo
      .createQueryBuilder('item')
      .where('item."orderId" = :orderId', { orderId })
      .andWhere('item."shopId" IN (:...shopIds)', { shopIds })
      .orderBy('item.id', 'ASC')
      .getMany();
    if (items.length === 0) {
      throw new NotFoundException('This order has no items from your shops');
    }

    const shopIdsInOrder = [
      ...new Set(items.map((i) => i.shopId).filter((v): v is string => !!v)),
    ];
    const shopsInOrder = shopIdsInOrder.length
      ? await this.shopsRepo.find({ where: { id: In(shopIdsInOrder) } })
      : [];
    const shopNameById = new Map(shopsInOrder.map((s) => [s.id, s.name]));

    const reviewsByItemId = await this.getReviewsByItemIds(
      items.map((item) => item.id),
    );
    const acknowledgedAt = items
      .map((i) => i.acknowledgedAt)
      .filter((v): v is string => !!v)
      .sort()
      .pop();

    return {
      orderId: order.id,
      status: order.status,
      deliveryStatus: aggregateDeliveryStatus(
        items.map((i) => i.deliveryStatus),
      ),
      currency: order.currency,
      shopAmount: round2(
        items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      ),
      shopCount: shopIdsInOrder.length,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId ?? null,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl ?? null,
        shopId: i.shopId ?? null,
        shopName: shopNameById.get(i.shopId ?? '') ?? 'Shop',
        review: reviewsByItemId.get(i.id) ?? null,
      })),
      itemCount: items.length,
      totalQuantity: items.reduce((s, i) => s + (i.quantity ?? 0), 0),
      previewImageUrl: items.find((i) => !!i.imageUrl)?.imageUrl ?? null,
      customerName: buildCustomerName(order.user),
      customerEmail: order.user?.email ?? '',
      deliveryAddress: order.deliveryAddress ?? null,
      deliveryPhone: order.deliveryPhone ?? null,
      createdAt: order.createdAt,
      buyerConfirmedAt: order.buyerConfirmedAt ?? null,
      acknowledgedAt: acknowledgedAt ?? null,
      isNew: items.every((i) => !i.acknowledgedAt),
    };
  }

  private async getReviewsByItemIds(
    orderItemIds: string[],
  ): Promise<Map<string, ShopOrderItemReview>> {
    if (orderItemIds.length === 0) {
      return new Map();
    }

    const reviews = await this.reviewsRepo.find({
      where: { orderItemId: In(orderItemIds) },
      select: {
        orderItemId: true,
        rating: true,
        message: true,
        reviewerName: true,
        createdAt: true,
      },
    });
    return new Map(
      reviews.map((review) => [
        review.orderItemId,
        {
          rating: review.rating,
          message: review.message,
          reviewerName: review.reviewerName,
          createdAt: review.createdAt,
        },
      ]),
    );
  }

  /**
   * Rehydrates `order_items` from the JSON snapshot for orders that predate
   * the table. Idempotent — it only touches orders with no rows yet.
   *
   * Run once after deploying the entity; new orders write the table inline.
   */
  async backfillOrderItems(): Promise<number> {
    const orphans = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin(OrderItem, 'item', 'item."orderId" = order.id')
      .where('item.id IS NULL')
      .andWhere('order.items IS NOT NULL')
      .getMany();

    if (orphans.length === 0) {
      return 0;
    }

    const rows: Array<Partial<OrderItem>> = [];
    for (const order of orphans) {
      for (const s of (order.items ?? []) as Array<{
        productId?: string;
        name?: string;
        price?: number;
        quantity?: number;
        imageUrl?: string | null;
        shopId?: string | null;
      }>) {
        rows.push({
          orderId: order.id,
          shopId: s.shopId ?? null,
          productId: s.productId ?? null,
          name: s.name ?? 'Product',
          price: s.price ?? 0,
          quantity: s.quantity ?? 1,
          imageUrl: s.imageUrl ?? null,
          deliveryStatus: DeliveryStatus.PENDING,
        });
      }
    }

    if (rows.length === 0) {
      return 0;
    }

    await this.orderItemsRepo.save(rows);
    return rows.length;
  }
}

/**
 * Rolls many per-line states up to one order-level state.
 *
 * An order sits at its *earliest* outstanding stage, because until every line
 * has moved past a stage the shop has not finished that part. Two lines at
 * SHIPPED and one at PENDING therefore read as PENDING, not SHIPPED — that is
 * what keeps the aggregate honest about a partially-fulfilled order.
 *
 * All lines CANCELLED collapses to CANCELLED; a mix of cancelled and live
 * lines ignores the cancelled ones.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildCustomerName(user?: User | null): string {
  if (!user) return 'Customer';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || 'Customer';
}
