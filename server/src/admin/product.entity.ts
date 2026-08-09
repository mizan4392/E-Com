import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Shop } from './shop.entity';

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

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'float', default: 0 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
  shop?: Shop;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;
}
