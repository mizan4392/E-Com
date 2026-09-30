import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Shop } from './shop.entity';

/**
 * `shopId` is indexed because every seller-scoped query filters on it — the
 * catalogue, the shop-order inbox and the dashboard analytics all do
 * `WHERE "shopId" = ?`. Without this the analytics "products in this shop"
 * count degrades into a full scan of `products`.
 *
 * `@Index` resolves against **entity property names**, not database column
 * names, so indexing `shopId` only works because `shopId` is declared as a
 * real property below. Indexing the relation property would be wrong — an
 * `@Index` on a relation name fails schema sync with
 * "Index ... contains column that is missing in the entity".
 */
@Index('IDX_products_shop', ['shopId'])
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Partial<Category>;

  @Column({ type: 'float', default: 0 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    default: [],
  })
  imageUrl?: string[];

  /**
   * The owning shop, and its explicit FK column.
   *
   * The relation and the scalar `shopId` are declared as a pair on purpose —
   * the same shape `OrderItem`, `Order` and `ProductReview` use. Reads and
   * writes go through the relation (`where: { shop: { id } }`,
   * `save({ shop: { id } })`), which is the ergonomic TypeORM API, while the
   * scalar column is what the `IDX_products_shop` index is declared against.
   */
  @ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shopId' })
  shop?: Shop;

  @Column({ type: 'uuid', nullable: true })
  shopId?: string | null;

  @Column({ type: 'float', default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
