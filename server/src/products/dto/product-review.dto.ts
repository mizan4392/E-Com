import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListProductReviewsQueryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page = 1;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit = 10;
}

export class UpsertProductReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message!: string;
}
