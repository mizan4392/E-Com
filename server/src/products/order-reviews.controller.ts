import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { User } from '../users/user.entity';
import { UpsertProductReviewDto } from './dto/product-review.dto';
import { ProductReviewsService } from './product-reviews.service';

@Controller('orders/:orderId/reviews')
@UseGuards(AuthGuard)
export class OrderReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @Get()
  listOrderReviews(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.listOrderReviews(orderId, user.id);
  }

  @Put(':orderItemId')
  upsertOrderItemReview(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Param('orderItemId', new ParseUUIDPipe()) orderItemId: string,
    @Body() dto: UpsertProductReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.upsertOrderItemReview(
      orderId,
      orderItemId,
      user.id,
      dto,
    );
  }
}
