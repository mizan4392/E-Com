import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  slug?: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  category?: string;

  @IsNotEmpty()
  price!: number;

  @IsNotEmpty()
  stock!: number;
}
