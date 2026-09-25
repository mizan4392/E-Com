import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
}

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
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * The internal `users.id` UUID that owns this order.
   *
   * This is denormalized on purpose: the order history list filters by owner
   * and sorts by date on every request, so a composite index on
   * (userId, createdAt) keeps that query an index scan instead of a sort over
   * the whole table.
   */
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
