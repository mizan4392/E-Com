import {
  Column,
  Entity,
  Index,
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
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // The user that placed the order (Clerk user id)

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

  @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
  user!: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
