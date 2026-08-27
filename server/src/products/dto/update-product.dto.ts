import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  stock?: number;

  @IsOptional()
  deleteImageUrls?: string[] | string;
}
