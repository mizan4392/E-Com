import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../admin/product.entity';

import { Shop } from '../admin/shop.entity';
import { User } from '../users/user.entity';
import { ShopModule } from '../shop/shop.module';
import { OrderItem } from '../orders/order-item.entity';
import { ProductReview } from './product-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductReview, OrderItem, Shop, User]),
    forwardRef(() => ShopModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
