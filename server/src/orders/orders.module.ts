import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../admin/product.entity';
import { Shop } from '../admin/shop.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ShopOrdersService } from './shop-orders.service';
import { ShopOrdersController } from './shop-orders.controller';
import { User } from '../users/user.entity';
import { ProductReview } from '../products/product-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      ProductReview,
      Shop,
      User,
    ]),
  ],
  controllers: [OrdersController, ShopOrdersController],
  providers: [OrdersService, ShopOrdersService],
  exports: [OrdersService, ShopOrdersService],
})
export class OrdersModule {}
