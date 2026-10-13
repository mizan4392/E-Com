/**
 * Types mirroring the admin products API (`server/src/admin/admin.controller.ts`).
 *
 * Hand-written mirror, matching the orders pattern: the admin app does not
 * import from `server/`, so each list endpoint's response shape is declared
 * here and kept in lock-step.
 */

import type { BadgeTone } from "@/components/ui/StatusBadge";

/** Payment/lifecycle state of a product. Mirrors the server `ProductStatus`. */
export type ProductStatus = "ACTIVE" | "PAUSED";

/** Tab order for the product status filter. Matches `PRODUCT_STATUS_DISPLAY_ORDER`. */
export const PRODUCT_STATUSES = [
  "ACTIVE",
  "PAUSED",
] as const satisfies readonly ProductStatus[];

/** Human labels for product status tabs. */
export const PRODUCT_STATUS_LABELS: Readonly<Record<ProductStatus, string>> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
};

/**
 * Tone for the status badge, derived from the status value so a single
 * switch can't drift from the label lookup.
 */
export function toneForProductStatus(status: ProductStatus): BadgeTone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PAUSED":
      return "warning";
  }
}

/** Sortable columns on the admin products list endpoint. */
export type ProductSortField = "createdAt" | "price" | "name";
export type SortOrder = "asc" | "desc";

/**
 * Compact shop/category reference embedded in product list responses.
 *
 * Re-exported from orders.types because the admin list embeds the same
 * `{ id, name }` shape for both.
 */
export type AdminShopRef = { id: string; name: string };

/** Minimal product row returned by `GET /admin/products`. */
export interface AdminProductListItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  pauseNote: string | null;
  imageUrl: string[];
  shop: AdminShopRef | null;
  category: AdminShopRef | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Everything the admin product list endpoint accepts. */
export interface ProductListParams {
  page?: number;
  limit?: number;
  status?: ProductStatus | undefined;
  shopId?: string | undefined;
  categoryId?: string | undefined;
  search?: string | undefined;
  sortBy?: ProductSortField | undefined;
  sortOrder?: SortOrder | undefined;
}

/** Pagination envelope, matching the server `PaginatedResponse`. */
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

/** The tab value passed to status-tab callbacks: status enums plus "ALL". */
export type ProductStatusTabValue = "ALL" | ProductStatus;

/** Tally per status tab: `{ ALL, ACTIVE, PAUSED }`. */
export type ProductStatusCounts = Record<ProductStatusTabValue, number>;
