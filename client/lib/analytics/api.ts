import { apiFetch } from "../apiClient";
import type {
  ShopAnalytics,
  ShopAnalyticsParams,
  ShopPortfolio,
} from "../../types/analytics";

/**
 * Fetches the seller dashboard payload for one shop.
 *
 * `shopId` is the ONLY path segment — the reporting window travels as query
 * params so the React Query cache key can vary independently of the URL.
 *
 * Scoped to a single shop on purpose. Portfolio-wide figures come from
 * {@link getShopPortfolio} so that switching shops in the dashboard does not
 * re-request totals that did not change.
 */
export const getShopAnalytics = async ({
  shopId,
  granularity,
  from,
  to,
}: ShopAnalyticsParams): Promise<ShopAnalytics> => {
  const searchParams = new URLSearchParams();

  if (granularity) searchParams.set("granularity", granularity);
  if (from) searchParams.set("from", from);
  if (to) searchParams.set("to", to);

  const queryString = searchParams.toString();
  const path = queryString
    ? `/shop/${shopId}/analytics?${queryString}`
    : `/shop/${shopId}/analytics`;

  return apiFetch<ShopAnalytics>(path, { method: "GET" });
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
