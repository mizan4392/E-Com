import { useQuery } from "@tanstack/react-query";
import { getShopAnalytics, getShopPortfolio } from "./api";
import type {
  AnalyticsGranularity,
  ShopAnalytics,
  ShopPortfolio,
} from "../../types/analytics";

/**
 * Query keys for the seller dashboard.
 *
 * Own namespace, separate from `shopKeys` and `shopOrderKeys` — those are
 * catalogue and fulfilment data. The analytics payload is expensive (four
 * aggregate queries) and has different invalidation triggers, so it must not
 * be refetched when an unrelated shop list is invalidated.
 *
 * The reporting window is part of the key — NOT just the granularity. Several
 * presets ("Last 7 days", "Last 30 days", "Last 90 days") share the `day`
 * granularity, so keying on granularity alone would serve one window's data for
 * another and switching between them would not refetch at all.
 */
export type AnalyticsRange = {
  /** Omitted for an unbounded ("All time") window. */
  from?: string;
  to: string;
};

export const analyticsKeys = {
  all: ["shop-analytics"] as const,
  detail: (
    shopId: string,
    granularity: AnalyticsGranularity,
    range: AnalyticsRange,
  ) =>
    [
      ...analyticsKeys.all,
      shopId,
      granularity,
      range.from ?? "all",
      range.to,
    ] as const,
};

/**
 * Portfolio totals live under their OWN namespace, deliberately NOT under
 * `analyticsKeys`.
 *
 * They describe every shop the seller owns and are identical no matter which
 * shop is selected, so keying them alongside the per-shop detail would be
 * both wrong (a shop switch would invalidate them) and expensive (one cache
 * entry per shop holding the same numbers).
 */
export const portfolioKeys = {
  all: ["shop-portfolio"] as const,
  detail: () => [...portfolioKeys.all, "totals"] as const,
};

/**
 * Seller dashboard metrics for one shop, at one granularity, over one window.
 *
 * `placeholderData` keeps the previous chart on screen while a new range
 * loads — without it the chart unmounts to its empty state and the layout
 * jumps on every filter change.
 *
 * Disabled until both a shop and a resolved window exist, so the dashboard
 * never fires a request with an empty shop id or an unresolvable range.
 */
export function useShopAnalytics(
  shopId: string | undefined,
  granularity: AnalyticsGranularity = "day",
  range?: AnalyticsRange,
) {
  return useQuery({
    queryKey: analyticsKeys.detail(
      shopId ?? "",
      granularity,
      range ?? { from: undefined, to: "" },
    ),
    queryFn: () =>
      getShopAnalytics({
        shopId: shopId as string,
        granularity,
        from: range?.from,
        to: range?.to,
      }),
    enabled: Boolean(shopId && range?.to),
    placeholderData: (previousData) => previousData,
  });
}

export type { ShopAnalytics };

/**
 * Lifetime totals across every shop the seller owns.
 *
 * Takes no arguments on purpose — there is nothing shop-specific about it, so
 * switching the selected shop in the dashboard cannot invalidate it. That is
 * the whole point of the split: portfolio figures are fetched once and reused
 * across every shop.
 *
 * `staleTime` is raised well above the global default because these numbers
 * only change when a shop or product is created or deleted — never on a sale.
 * Those mutations explicitly invalidate `portfolioKeys` instead, so sellers
 * still see fresh figures immediately after they add a product.
 */
export function useShopPortfolio() {
  return useQuery({
    queryKey: portfolioKeys.detail(),
    queryFn: getShopPortfolio,
    // 5 minutes: a sale must not be able to invalidate this, and the only
    // writes that matter go through the explicit invalidation below.
    staleTime: 5 * 60 * 1000,
  });
}

export type { ShopPortfolio };
