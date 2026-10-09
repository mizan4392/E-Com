import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../admin/product.entity';
import { Shop } from '../admin/shop.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ShopOrdersService } from './shop-orders.service';
import { ShopOrdersController } from './shop-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersController } from './admin-orders.controller';
import { User } from '../users/user.entity';
import { ProductReview } from '../products/product-review.entity';

@Module({
  imports: [
    // Needed for `AdminGuard`: it is declared in AdminModule and depends on
    // that module's JwtModule registration and User repository token.
    AdminModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      ProductReview,
      Shop,
      User,
    ]),
  ],
  controllers: [OrdersController, ShopOrdersController, AdminOrdersController],
  providers: [
    OrdersService,
    ShopOrdersService,
    AdminOrdersService,
    AdminOrdersRepository,
  ],
  exports: [OrdersService, ShopOrdersService],
})
export class OrdersModule {}
