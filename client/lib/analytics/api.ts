import { apiFetch } from "../apiClient";
import type {
  ShopAnalyticsCards,
  ShopAnalyticsDetails,
  ShopAnalyticsParams,
  ShopPortfolio,
} from "../../types/analytics";

/**
 * Builds the shared `?granularity=&from=&to=` query string.
 *
 * Both dashboard endpoints take the same range parameters, and they MUST be
 * sent identically to both — if the cards were fetched for one window and the
 * details for another, the chart would silently disagree with the numbers
 * above it. Sharing the builder is what makes that impossible.
 */
function buildRangeQuery({
  granularity,
  from,
  to,
}: ShopAnalyticsParams): string {
  const searchParams = new URLSearchParams();

  if (granularity) searchParams.set("granularity", granularity);
  if (from) searchParams.set("from", from);
  if (to) searchParams.set("to", to);

  return searchParams.toString();
}

/**
 * Fetches the CARD data for one shop: the four KPI tiles and their totals.
 *
 * One flat aggregate, no grouping, no `date_trunc`. This is the request that
 * must be fast — it is what a seller waits for when they switch shops.
 */
export const getShopAnalyticsCards = async (
  params: ShopAnalyticsParams,
): Promise<ShopAnalyticsCards> => {
  const queryString = buildRangeQuery(params);
  const path = queryString
    ? `/shop/${params.shopId}/analytics/cards?${queryString}`
    : `/shop/${params.shopId}/analytics/cards`;

  return apiFetch<ShopAnalyticsCards>(path, { method: "GET" });
};

/**
 * Fetches the DETAIL data for one shop: the chart series and best sellers.
 *
 * The expensive half — two grouped scans. Fetched in parallel with
 * {@link getShopAnalyticsCards} so it never delays the tiles.
 */
export const getShopAnalyticsDetails = async (
  params: ShopAnalyticsParams,
): Promise<ShopAnalyticsDetails> => {
  const queryString = buildRangeQuery(params);
  const path = queryString
    ? `/shop/${params.shopId}/analytics/details?${queryString}`
    : `/shop/${params.shopId}/analytics/details`;

  return apiFetch<ShopAnalyticsDetails>(path, { method: "GET" });
};

/**
 * Fetches lifetime totals across every shop the signed-in seller owns.
 *
 * Takes no shop id on purpose: the result is identical regardless of which
 * shop is selected, so it is cached under its own key and survives shop
 * switching untouched.
 */
export const getShopPortfolio = async (): Promise<ShopPortfolio> => {
  return apiFetch<ShopPortfolio>("/shop/analytics/portfolio", {
    method: "GET",
  });
};
