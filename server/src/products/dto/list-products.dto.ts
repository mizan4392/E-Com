import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProductStatus } from '../product.entity';

/** Query parameters for `GET /admin/products`. Mirrors the orders list DTO. */
export class ListAdminProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Restrict to one product status. Omit for "all". */
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: `status must be one of: ${Object.values(ProductStatus).join(', ')}`,
  })
  status?: ProductStatus;

  /** Restrict to products in this shop. */
  @IsOptional()
  @IsUUID()
  shopId?: string;

  /** Restrict to products in this category (by its UUID). */
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Free-text search across name and category name. */
  @IsOptional()
  @IsString()
  search?: string;

  /** Sort key; defaults to `createdAt`. */
  @IsOptional()
  @IsEnum(['createdAt', 'price', 'name'], {
    message: 'sortBy must be one of: createdAt, price, name',
  })
  sortBy?: 'createdAt' | 'price' | 'name';

  /** Sort direction; defaults to `desc` (newest first). */
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
