import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { User } from '../users/user.entity';

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

  // Shop belongs to one Category
  @ManyToOne(() => Category, (category) => category.shops, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  // Shop belongs to one User
  @ManyToOne(() => User, (user) => user.shops, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user?: User;

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
