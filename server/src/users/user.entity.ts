import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  imageUrl?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: string;

  @Column({ type: 'json', nullable: true })
  raw?: RawType;
}
