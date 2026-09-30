import { Module, forwardRef } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { Shop } from '../admin/shop.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { User } from '../users/user.entity';
import { ShopAuthorizationService } from './shopAuthorization.service';
import { ShopAnalyticsService } from './shopAnalytics.service';
import { Product } from '../admin/product.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, User, Product, OrderItem, Order]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [ShopController],
  providers: [ShopService, ShopAuthorizationService, ShopAnalyticsService],
  exports: [ShopService, ShopAuthorizationService, ShopAnalyticsService],
})
export class ShopModule {}
