/**
 * Typed wrappers around the admin orders endpoints.
 *
 * Every call goes through `serverApiFetch`, which reads the admin bearer token
 * from the session cookie and converts a 401 into `UnauthorizedError` — so a
 * caller never has to inspect status codes.
 *
 * These are used from **Server Components** (`app/orders/**`), so they must use
 * the cookie-reading variant rather than the `localStorage`-based `apiFetch`:
 * on the server `getToken()` returns `null`, the request goes out without an
 * `Authorization` header and comes back 401. See `lib/serverApiFetch`.
 *
 * Query parameters are serialised by {@link toQueryString}, which **drops
 * empty values** rather than sending `status=&page=`. That matters: the
 * server's `ValidationPipe` validates the DTO after coercion, and an empty
 * string for `sortBy` or `status` is a 400, not a no-op. Filtering empty
 * values here keeps "the user cleared the search box" from becoming an error.
 */

import { serverApiFetch } from "@/lib/serverApiFetch";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  OrderListParams,
  OrderStatusCounts,
  OrderStatusCountsParams,
  PaginatedResponse,
} from "./orders.types";

/** Anything a `URLSearchParams` value may be — all optional, so `undefined`. */
type ParamValue = string | number | undefined;

/**
 * Builds a query string from defined, non-empty values.
 *
 * `0` is a meaningful value for `page`, so it is kept; only `undefined`, `null`
 * and `''` are dropped. Numbers are stringified by `URLSearchParams`.
 */
export function toQueryString(params: Record<string, ParamValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const asString = String(value);
    if (asString.trim() === "") continue;
    search.set(key, asString);
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/** `GET /admin/orders` — one page of the lean list projection. */
export function fetchOrders(
  params: OrderListParams = {},
): Promise<PaginatedResponse<AdminOrderListItem>> {
  return serverApiFetch<PaginatedResponse<AdminOrderListItem>>(
    `/admin/orders${toQueryString({ ...params })}`,
  );
}

/**
 * `GET /admin/orders/status-counts` — tab badges in a single aggregation.
 *
 * Deliberately does **not** send `status`: the point of the endpoint is to
 * count every bucket so the admin can see how many orders sit in the other
 * states. Filtering it would make the tab you are looking at the only one
 * with a number.
 */
export function fetchOrderStatusCounts(
  params: OrderStatusCountsParams = {},
): Promise<OrderStatusCounts> {
  return serverApiFetch<OrderStatusCounts>(
    `/admin/orders/status-counts${toQueryString({ ...params })}`,
  );
}

/** `GET /admin/orders/:id` — full order including its line items. */
export function fetchOrderDetail(id: string): Promise<AdminOrderDetail> {
  return serverApiFetch<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(id)}`,
  );
}

/**
 * Shops available in the filter dropdown.
 *
 * `GET /admin/shops` returns the full `Shop` entity list (a bare array), which
 * is more than this dropdown needs, so the response is narrowed to
 * `{ id, name }` here — that keeps the filter's prop type honest instead of
 * declaring it as "whatever the shop endpoint happens to return".
 *
 * Called with `Promise.allSettled` by the list page: if the shops request
 * fails, the page still renders and simply omits the shop filter, which beats
 * an error boundary replacing the whole table over one dropdown.
 */
export async function fetchFilterShops(): Promise<
  Array<{ id: string; name: string }>
> {
  interface ShopSummary {
    id: string;
    name: string;
  }

  const data = await serverApiFetch<ShopSummary[] | null>("/admin/shops");
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (shop): shop is ShopSummary =>
        Boolean(shop && typeof shop.id === "string" && typeof shop.name === "string"),
    )
    .map((shop) => ({ id: shop.id, name: shop.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}