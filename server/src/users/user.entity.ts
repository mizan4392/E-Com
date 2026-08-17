import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Shop } from '../admin/shop.entity';

export type RawType = {
  userType?: 'admin' | 'user';
};

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: false, unique: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @OneToMany(() => Shop, (shop) => shop.user, { nullable: true })
  shops?: Shop[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;

  @Column({ type: 'json', nullable: true })
  raw?: RawType;
}
