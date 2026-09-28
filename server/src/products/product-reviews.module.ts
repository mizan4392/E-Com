import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../admin/product.entity';
import { User } from '../users/user.entity';
import { OrderReviewsController } from './order-reviews.controller';
import { ProductReview } from './product-review.entity';
import { ProductReviewsController } from './product-reviews.controller';
import { ProductReviewsService } from './product-reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductReview, Product, Order, OrderItem, User]),
  ],
  controllers: [ProductReviewsController, OrderReviewsController],
  providers: [ProductReviewsService],
})
export class ProductReviewsModule {}
