import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { Shop } from '../admin/shop.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, User]), ProductsModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
