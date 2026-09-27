import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Shop } from '../admin/shop.entity';

/**
 * Fulfilment state of one line item **for one shop**.
 *
 * This is deliberately separate from `Order.status`, which tracks the
 * *payment* (Stripe). A paid order still has to be confirmed, prepared,
 * shipped and delivered, and that progression is owned by the seller, not by
 * the payment gateway.
 */
export enum DeliveryStatus {
  /** Paid, but the seller has not touched the order yet. */
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Ordered fulfilment stages. Used to aggregate a shop-level status out of many
 * line items: the order is only as advanced as its *least* advanced item, so a
 * partially-shipped order still reads as "processing" rather than "shipped".
 *
 * `CANCELLED` is intentionally absent — it is a terminal branch, not a rung on
 * the ladder, so it is handled separately in `aggregateDeliveryStatus`.
 */
export const DELIVERY_STAGE_ORDER: readonly DeliveryStatus[] = [
  DeliveryStatus.PENDING,
  DeliveryStatus.CONFIRMED,
  DeliveryStatus.PROCESSING,
  DeliveryStatus.SHIPPED,
  DeliveryStatus.DELIVERED,
];

export function aggregateDeliveryStatus(
  statuses: DeliveryStatus[],
): DeliveryStatus {
  if (statuses.length === 0) {
    return DeliveryStatus.PENDING;
  }

  const live = statuses.filter((status) => status !== DeliveryStatus.CANCELLED);
  if (live.length === 0) {
    return DeliveryStatus.CANCELLED;
  }

  let lowest = DELIVERY_STAGE_ORDER.length - 1;
  for (const status of live) {
    const index = DELIVERY_STAGE_ORDER.indexOf(status);
    if (index !== -1 && index < lowest) {
      lowest = index;
    }
  }
  return DELIVERY_STAGE_ORDER[lowest];
}

/**
 * Relational mirror of the `Order.items` JSON snapshot.
 *
 * The JSON column is the source of truth for what was bought and cannot be
 * changed, but Postgres cannot index or filter inside it. Every seller query
 * ("show me orders containing my products, newest first, not yet actioned")
 * needs exactly that, so the same snapshot is written to this table at order
 * creation time and enriched with the seller's mutable fulfilment state.
 *
 * One row per product per order. An order spanning three shops produces three
 * rows, each independently trackable by its own owner.
 */
@Entity({ name: 'order_items' })
@Index('IDX_order_items_order_shop', ['orderId', 'shopId'])
@Index('IDX_order_items_shop', ['shopId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'uuid' })
  orderId!: string;

  /**
   * The shop that must fulfil this line. Indexed because it is the only
   * selector the seller UI ever filters on.
   *
   * `SET NULL` (not CASCADE): a deleted shop must not erase financial history.
   * Null rows simply stop appearing in that shop's inbox.
   */
  @ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shopId' })
  shop?: Shop;

  @Column({ type: 'uuid', nullable: true })
  shopId?: string | null;

  // --- Immutable purchase-time snapshot (mirrors Order.items[i]) ---

  @Column({ type: 'uuid', nullable: true })
  productId?: string | null;

  @Column()
  name!: string;

  @Column({ type: 'float', default: 0 })
  price!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  // --- Seller-owned mutable fulfilment state ---

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  deliveryStatus!: DeliveryStatus;

  /**
   * Set the first time a seller changes `deliveryStatus` on this row.
   *
   * This is the "seller has seen it" marker that drives the unread-order badge
   * on My Shop / Shop cards. It is a timestamp rather than
   * `deliveryStatus !== PENDING` on purpose: if a seller moves an item back to
   * PENDING (a mistake correction), the order must stay acknowledged and not
   * reappear in the badge. Set once, never cleared.
   */
  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  deliveryUpdatedAt?: string | null;
}
