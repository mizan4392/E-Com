import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from '../users/user.entity';

/**
 * `userId` is indexed because every "my shops" lookup filters on it —
 * `GET /users/me/shops`, the dashboard's portfolio counts and the shop
 * ownership checks all do `WHERE "userId" = ?`. It was previously unindexed,
 * so the seller dashboard's portfolio query scanned the whole `shops` table.
 *
 * `@Index` resolves against **entity property names**, not database column
 * names. The `user` relation alone does not satisfy it — the explicit `userId`
 * property below is what makes this index legal.
 */
@Index('IDX_shops_user', ['userId'])
@Entity({ name: 'shops' })
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true, default: 0 })
  rating?: number;

  // Shop belongs to one Category
  @ManyToOne(() => Category, (category) => category.shops, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  // Shop belongs to one User.
  //
  // Declared as a relation + explicit FK column pair, matching `Product` and
  // `OrderItem`. Queries filter through the relation
  // (`where: { user: { id: userId } }`), which is what the dashboard and the
  // ownership checks use.
  @ManyToOne(() => User, (user) => user.shops, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
