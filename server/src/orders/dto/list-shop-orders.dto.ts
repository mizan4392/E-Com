import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DeliveryStatus } from '../order-item.entity';

/**
 * Query parameters for `GET /shop-orders`.
 *
 * Deliberately has no `status` filter: the seller's work queue is driven by
 * `newOnly` + `deliveryStatus`, which are seller concepts, not payment
 * concepts. Payment status filtering is available on the buyer-side
 * `GET /orders` instead.
 */
export class ListShopOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /**
   * Restrict to a single fulfilment stage. Omit for "all".
   */
  @IsOptional()
  @IsEnum(DeliveryStatus, {
    message: `deliveryStatus must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  deliveryStatus?: DeliveryStatus;

  /**
   * Restrict to shop/order pairs with no seller action yet (`acknowledgedAt`
   * is null on every line). Query strings arrive as
   * `"true"`/`"false"`, so they are coerced before `@IsBoolean`.
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  newOnly?: boolean;
}
