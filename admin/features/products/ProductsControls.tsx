"use client";

import { useCallback } from "react";
import ProductStatusTabs from "./ProductStatusTabs";
import type { ProductStatusTabValue } from "./products.types";
import ProductFilters from "./ProductFilters";
import Pagination from "@/components/ui/Pagination";
import { useProductFilters } from "./useProductFilters";
import type {
  AdminShopRef,
  PaginatedMeta,
  ProductStatusCounts,
} from "./products.types";

/**
 * Everything on the products list that reacts to a change: the status tabs,
 * the filter bar and the pagination footer.
 *
 * Split from the page so the page itself stays a **Server Component**. The
 * initial data arrives from the server; this boundary only owns the transitions
 * between pages and filter values.
 */
export default function ProductsControls({
  meta,
  counts,
  shops,
  categories,
}: {
  meta: PaginatedMeta;
  counts: ProductStatusCounts | undefined;
  shops: readonly AdminShopRef[];
  categories: readonly AdminShopRef[];
}) {
  const controller = useProductFilters();
  const { filters, setFilters } = controller;

  /**
   * Switches the status tab without a full reload.
   *
   * `setFilters` wraps `router.push` for a soft navigation, so switching tabs
   * streams fresh rows into the already-painted table instead of tearing the
   * page down and re-running the Server Component — which is what caused the
   * login flash on the orders page.
   */
  const setStatus = useCallback(
    (status: ProductStatusTabValue) => {
      setFilters({ status: status === "ALL" ? undefined : status });
    },
    [setFilters],
  );

  return (
    <>
      <ProductStatusTabs
        counts={counts}
        activeStatus={filters.status}
        onStatusChange={setStatus}
        className="mb-4"
      />

      <ProductFilters
        controller={controller}
        shops={shops}
        categories={categories}
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={(page) => setFilters({ page })}
        onLimitChange={(limit) => setFilters({ limit })}
      />

      {activeFilterSummary(filters) ? (
        <p className="sr-only" role="status">
          {activeFilterSummary(filters)}
        </p>
      ) : null}
    </>
  );
}

/**
 * Spoken summary of the active filters, announced after each navigation.
 *
 * Without this, changing a filter silently re-renders the list and a screen
 * reader user has no idea the result set changed.
 */
function activeFilterSummary(
  filters: ReturnType<typeof useProductFilters>["filters"],
): string {
  const parts: string[] = [];
  if (filters.status) parts.push(`status ${filters.status.toLowerCase()}`);
  if (filters.shopId) parts.push("one shop");
  if (filters.categoryId) parts.push("one category");
  if (filters.search) parts.push(`search "${filters.search}"`);

  return parts.length ? `Filtered by ${parts.join(", ")}.` : "";
}
