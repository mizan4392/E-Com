import { IsEnum, IsOptional, MaxLength } from 'class-validator';
import { DeliveryStatus } from '../order-item.entity';

/**
 * Body for `PATCH /shop-orders/:orderId/delivery-status`.
 *
 * Fulfilment is tracked per ORDER, not per line: the seller sets one stage and
 * every line of that shop in the order moves with it. A per-item variant used
 * to exist, but it let one order show products at mixed stages ("2 shipped, 1
 * still processing"), which is not a state a seller can actually ship from and
 * made the order's own badge ambiguous.
 */
export class UpdateOrderDeliveryStatusDto {
  @IsEnum(DeliveryStatus, {
    message: `deliveryStatus must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
  })
  deliveryStatus!: DeliveryStatus;

  @IsOptional()
  @MaxLength(280)
  note?: string;
}
