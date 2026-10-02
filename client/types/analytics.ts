/**
 * Client mirror of the seller-dashboard contract served by
 * `GET /api/shop/:shopId/analytics/cards` and `.../analytics/details`.
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

/** The reporting window the server resolved, echoed back for labelling. */
export type AnalyticsRange = {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
};

/**
 * CARD data — everything the four KPI tiles need.
 *
 * Served by its own endpoint so the numbers paint without waiting for the
 * chart. Never add `series` or `topProducts` here: they are grouped scans and
 * would re-block the tiles, which is the exact coupling this split removed.
 */
export type ShopAnalyticsCards = {
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
  range: AnalyticsRange;
};

/**
 * DETAIL data — the chart series and the best-seller table.
 *
 * Served separately from the cards; the two requests run in parallel and
 * neither blocks the other.
 */
export type ShopAnalyticsDetails = {
  shopId: string;
  shopName: string;
  range: AnalyticsRange;
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
export type ShopPortfolioEntry = {
  shopId: string;
  unitsSold: number;
  revenue: number;
};

export type ShopPortfolio = {
  totalShops: number;
  totalProducts: number;
  totalRevenue: number;
  totalUnitsSold: number;
  totalOrders: number;
  currency: string;
  /**
   * One entry per shop the owner runs, INCLUDING zero-sales shops.
   *
   * The dashboard uses this to show each shop's sales in the picker, so a
   * seller can see at a glance which shops have sales before selecting one.
   * A shop with no sales is the single most common reason the dashboard
   * "looks broken" on first load, and showing `0 sold` next to the name makes
   * that explicit rather than a mystery.
   */
  shops: ShopPortfolioEntry[];
};
