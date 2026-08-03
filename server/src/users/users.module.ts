import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Category } from '../admin/category.entity';
import { Shop } from '../admin/shop.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Shop]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'admin-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
