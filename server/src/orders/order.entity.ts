import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Shop } from '../admin/shop.entity';

/**
 * Payment state of an order. **Single source of truth** for order status —
 * the admin list tabs, the buyer history filter and the Postgres enum all
 * read from here.
 *
 * Kept to the four states Stripe actually produces. Fulfilment stages
 * (confirmed → shipped → delivered) live separately on `OrderItem` as
 * `DeliveryStatus`, because those are per-shop, per-line seller concerns and
 * a single order can be half-shipped from two different sellers at once.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Status values in the order the admin UI should present them.
 *
 * Postgres has no inherent enum ordering, so tab order has to be stated
 * somewhere; deriving it from `Object.values(OrderStatus)` would work today but
 * silently depends on declaration order. Spelling it out makes the tab order a
 * deliberate product decision instead of an accident of code layout.
 */
export const ORDER_STATUS_DISPLAY_ORDER: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.CANCELLED,
];

export type OrderItemSnapshot = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  shopId?: string | null;
  shopName?: string | null;
};

@Entity({ name: 'orders' })
@Index('IDX_orders_user_created', ['userId', 'createdAt'])
/**
 * Default admin list sort is `createdAt DESC`, and the status tabs slice that
 * same list by status. Without this composite index Postgres either sorts
 * every matching row or scans the table, which is the difference between an
 * index scan of `limit` rows and a full pass over the orders table.
 */
@Index('IDX_orders_status_created', ['status', 'createdAt'])
/**
 * Supports the admin's "filter by shop" and the per-shop date range scan.
 * Same shape as the status index because both are equality-then-range.
 */
@Index('IDX_orders_shop_created', ['primaryShopId', 'createdAt'])
/**
 * Bare `createdAt DESC` index for the unfiltered, unsorted-by-status list —
 * the highest-traffic query on the page. The two composite indexes above
 * cannot serve it: their leading column (`status` / `primaryShopId`) is only
 * useful when that filter is present.
 */
@Index('IDX_orders_created', ['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /**
   * Human-readable reference, e.g. `ORD-2026-00042`.
   *
   * This is what support reads out to a customer and what the admin types into
   * the search box; a raw UUID is neither. Unique + indexed so the search
   * prefix match is an index lookup rather than a scan.
   *
   * Nullable purely for `synchronize: true` to be able to add the column to a
   * table that already has rows — a `NOT NULL` addition would fail on the
   * existing data. `backfillOrderNumbers()` fills every gap before the feature
   * reads it, and `OrdersService.createOrder` always sets it.
   */
  @Column({ type: 'varchar', nullable: true, unique: true })
  orderNumber?: string | null;

  /**
   * The shop an order is filed under in the admin list.
   *
   * An order is NOT owned by a single shop — a basket spanning three shops
   * becomes three `order_items` rows and must be fulfilled by all three
   * sellers. So this is deliberately "the *primary* shop", denormalised from
   * the first line item at creation time, used only to give the admin list a
   * single shop column and a fast `shopId` filter.
   *
   * It is a cache, never the source of truth: the per-line `order_items.shopId`
   * is what settlement and seller analytics use. If a shop is later deleted,
   * this points at nothing and the admin list shows "Multiple shops" /
   * "Deleted shop" rather than hiding the order — financial history must
   * survive its shop.
   */
  @ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primaryShopId' })
  primaryShop?: Shop;

  @Column({ type: 'uuid', nullable: true })
  primaryShopId?: string | null;

  @Index()
  @Column({ nullable: true, unique: true })
  stripeSessionId?: string;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'float', default: 0 })
  amountTotal!: number;

  @Column({ default: 'usd' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // Snapshot of the items at purchase time (product name/price/shop)
  @Column({ type: 'json', nullable: true })
  items?: OrderItemSnapshot[];

  @Column({ type: 'text', nullable: true })
  deliveryAddress?: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryPhone?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  buyerConfirmedAt?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
