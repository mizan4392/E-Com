import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProductReviewsService } from './product-reviews.service';
import { ListProductReviewsQueryDto } from './dto/product-review.dto';

@Controller('products/:productId/reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @Get()
  listReviews(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query() query: ListProductReviewsQueryDto,
  ) {
    return this.reviewsService.listProductReviews(
      productId,
      query.page,
      query.limit,
    );
  }
}
