import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../admin/product.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'product_reviews' })
@Index('UQ_product_reviews_order_item', ['orderItemId'], { unique: true })
@Index('IDX_product_reviews_product_created', ['productId', 'createdAt'])
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => OrderItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem!: OrderItem;

  @Column({ type: 'uuid' })
  orderItemId!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer?: User | null;

  @Column({ type: 'uuid', nullable: true })
  reviewerId?: string | null;

  @Column({ type: 'varchar', length: 80 })
  reviewerName!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
