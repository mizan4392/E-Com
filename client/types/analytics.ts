/**
 * Client mirror of the seller-dashboard contract served by
 * `GET /api/shop/:shopId/analytics`.
 *
 * There is no shared codegen between `server/` and `client/` — these types are
 * maintained by hand alongside `server/src/shop/shopAnalytics.service.ts`.
 * Keep both sides in sync.
 */

/** Bucket size for the time series. */
export type AnalyticsGranularity = "day" | "month";

/** One bucket of the time series, as returned by the server. */
export type AnalyticsSeriesPoint = {
  /** `YYYY-MM-DD` for daily buckets, `YYYY-MM` for monthly. */
  bucket: string;
  /** Pre-formatted axis label, e.g. `Mar 5` or `Mar 2026`. */
  label: string;
  unitsSold: number;
  revenue: number;
  orders: number;
};

/** Revenue / units / distinct orders, always money in the shop's currency. */
export type AnalyticsTotals = {
  revenue: number;
  unitsSold: number;
  orders: number;
};

export type AnalyticsTopProduct = {
  /** `null` when the product was deleted after the sale. */
  productId: string | null;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type ShopAnalytics = {
  shopId: string;
  shopName: string;
  currency: string;
  averageOrderValue: number | null;
  /** Lifetime totals across the shop's whole history. */
  totals: AnalyticsTotals;
  /** Totals restricted to the selected window. */
  periodTotals: AnalyticsTotals;
  /**
   * Totals for the equally-long window immediately before the selected one,
   * so the UI can show an honest period-over-period trend. `null` when the
   * shop could not have sold that far back.
   */
  previousPeriodTotals: AnalyticsTotals | null;
  /** Catalogue size for the selected shop. */
  productCount: number;
  /** The window the server actually used, after defaults were applied. */
  range: {
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
  };
  /** Dense series: every bucket in range is present, zero-filled. */
  series: AnalyticsSeriesPoint[];
  topProducts: AnalyticsTopProduct[];
};

export type ShopAnalyticsParams = {
  shopId: string;
  granularity?: AnalyticsGranularity;
  /** `YYYY-MM-DD`. Defaults server-side to a 30-day trailing window. */
  from?: string;
  /** `YYYY-MM-DD`. Defaults server-side to today. */
  to?: string;
};

/** Which metric the sales chart plots on the primary axis. */
export type AnalyticsMetric = "revenue" | "unitsSold";

/**
 * Lifetime totals across EVERY shop the seller owns.
 *
 * Served by `GET /api/shop/analytics/portfolio`, deliberately separate from
 * {@link ShopAnalytics}: these numbers are the same no matter which shop is
 * selected in the dashboard, so they must not be re-fetched (or re-keyed) on
 * shop change. They only move when a shop or product is created/deleted.
 */
export type ShopPortfolio = {
  totalShops: number;
  totalProducts: number;
  totalRevenue: number;
  totalUnitsSold: number;
  totalOrders: number;
  currency: string;
};
