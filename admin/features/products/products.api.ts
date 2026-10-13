/**
 * Typed wrappers around the admin products endpoints.
 *
 * Every call goes through `serverApiFetch`, which reads the admin bearer token
 * from the session cookie — these are used from Server Components, where the
 * `localStorage`-based `apiFetch` cannot see the token.
 */

import { serverApiFetch } from "@/lib/serverApiFetch";
import { toQueryString } from "../orders/orders.api";
import type {
  AdminProductListItem,
  ProductStatusCounts,
  PaginatedResponse,
  ProductListParams,
} from "./products.types";

/** Params accepted by `GET /admin/products/status-counts`. */
export interface ProductStatusCountsParams {
  shopId?: string | undefined;
  categoryId?: string | undefined;
  search?: string | undefined;
}

/**
 * Shops available in the filter dropdown.
 *
 * `GET /admin/products/shops` returns `{ id, name }` summaries. Narrowed here
 * so the dropdown prop type stays honest rather than "whatever the endpoint
 * happens to return".
 */
export async function fetchProductShops(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = await serverApiFetch<Array<{ id: string; name: string }> | null>(
    "/admin/products/shops",
  );
  if (!Array.isArray(data)) return [];

  return data
    .filter((shop): shop is { id: string; name: string } =>
      Boolean(
        shop && typeof shop.id === "string" && typeof shop.name === "string",
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Categories available in the filter dropdown. */
export async function fetchProductCategories(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = await serverApiFetch<Array<{ id: string; name: string }> | null>(
    "/admin/products/categories",
  );
  if (!Array.isArray(data)) return [];

  return data
    .filter((cat): cat is { id: string; name: string } =>
      Boolean(
        cat && typeof cat.id === "string" && typeof cat.name === "string",
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** `GET /admin/products` — one page of the lean product projection. */
export function fetchProducts(
  params: ProductListParams = {},
): Promise<PaginatedResponse<AdminProductListItem>> {
  return serverApiFetch<PaginatedResponse<AdminProductListItem>>(
    `/admin/products${toQueryString({ ...params })}`,
  );
}

/** `PATCH /admin/products/:id/pause` — set a product to PAUSED with a note. */
export function pauseProduct(
  id: string,
  pauseNote: string,
): Promise<AdminProductListItem> {
  return serverApiFetch<AdminProductListItem>(
    `/admin/products/${encodeURIComponent(id)}/pause`,
    {
      method: "PATCH",
      body: JSON.stringify({ pauseNote }),
    },
  );
}

/**
 * `GET /admin/products/status-counts` — per-status tab badges.
 *
 * Deliberately does not send `status`: the point of the endpoint is to count
 * every bucket so the admin can see how many products sit in the others.
 */
export function fetchProductStatusCounts(
  params: ProductStatusCountsParams = {},
): Promise<ProductStatusCounts> {
  return serverApiFetch<ProductStatusCounts>(
    `/admin/products/status-counts${toQueryString({ ...params })}`,
  );
}
