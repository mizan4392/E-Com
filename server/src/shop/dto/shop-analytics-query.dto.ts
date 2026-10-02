import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** Granularity of the time series returned by the analytics endpoint. */
export enum AnalyticsGranularity {
  /** One point per calendar day — the default. */
  DAY = 'day',
  /** One point per calendar month. */
  MONTH = 'month',
}

/**
 * Query parameters for `GET /shop/:shopId/analytics`.
 *
 * `granularity` and `from`/`to` are deliberately independent: the caller can
 * plot a daily series for the last 14 days, a monthly series for the last 12
 * months, or a daily series for a custom window. The service always returns a
 * **dense** series — every bucket in range is present, including ones with no
 * sales (zero-filled) — so the chart's x-axis is a continuous timeline and the
 * client never has to guess missing days.
 */
export class ShopAnalyticsQueryDto {
  /**
   * Bucket size for the time series. Defaults to `day`.
   */
  @IsOptional()
  @IsIn([AnalyticsGranularity.DAY, AnalyticsGranularity.MONTH], {
    message: `granularity must be one of: ${Object.values(AnalyticsGranularity).join(', ')}`,
  })
  granularity?: AnalyticsGranularity;

  /**
   * Inclusive start of the reporting window, as an ISO-8601 date or
   * timestamp (`YYYY-MM-DD` or a full ISO string). Defaults to a 30-day
   * trailing window.
   *
   * Only the `YYYY-MM-DD` prefix is used so that a timestamp sent in a local
   * timezone cannot shift a bucket boundary.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string | undefined),
  )
  from?: string;

  /** Inclusive end of the reporting window. Defaults to today. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string | undefined),
  )
  to?: string;

  /**
   * Optional advisory cap on the number of buckets requested.
   *
   * The authoritative limit is `MAX_ANALYTICS_BUCKETS` in the service, which
   * is computed from the resolved window and rejects with a 400 when exceeded.
   * This field exists so a caller can ask for a specific budget; the service
   * still enforces the hard ceiling regardless of what is passed here.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(400)
  buckets?: number;
}
