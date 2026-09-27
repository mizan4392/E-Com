import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateDeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  deliveryAddress!: string;
}
