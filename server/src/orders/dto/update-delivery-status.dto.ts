import { IsEnum, IsOptional, MaxLength } from 'class-validator';
import { DeliveryStatus } from '../order-item.entity';

/** Body for `PATCH /shop-orders/:orderId/items/:itemId`. */
export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus, {
    message: `deliveryStatus must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  deliveryStatus!: DeliveryStatus;

  /** Optional free-text note from the seller (e.g. courier tracking ref). */
  @IsOptional()
  @MaxLength(280)
  note?: string;
}

/** Body for `PATCH /shop-orders/:orderId/delivery-status` (bulk). */
export class UpdateOrderDeliveryStatusDto {
  @IsEnum(DeliveryStatus, {
    message: `deliveryStatus must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  deliveryStatus!: DeliveryStatus;

  @IsOptional()
  @MaxLength(280)
  note?: string;
}
