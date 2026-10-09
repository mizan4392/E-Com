"use client";

import { useCallback } from "react";
import OrderFilters from "./OrderFilters";
import OrderStatusTabs, { type OrderStatusTabValue } from "./OrderStatusTabs";
import Pagination from "@/components/ui/Pagination";
import { useOrderFilters } from "./useOrderFilters";
import type {
  AdminOrderShopRef,
  OrderStatusCounts,
  PaginatedMeta,
} from "./orders.types";

/**
 * Everything on the orders list that reacts to a change: the tabs, the filter
 * bar and the pagination footer.
 *
 * Split out from the page so the page itself can stay a **Server Component**.
 * The initial data arrives from the server; this boundary only owns the
 * transitions between pages. The props it needs are plain data, so the
 * server/client boundary costs one serialisable payload and no extra request.
 *
 * Each control builds its own href from the *current* query string, so the
 * status tabs and the back button share one mechanism: the URL.
 */
export default function OrdersControls({
  meta,
  counts,
  shops,
}: {
  meta: PaginatedMeta;
  /** Tab badges from `GET /admin/orders/status-counts`. */
  counts: OrderStatusCounts | undefined;
  shops: readonly AdminOrderShopRef[];
}) {
  const controller = useOrderFilters();
  const { filters, setFilters } = controller;

  /**
   * Builds a URL with `status` replaced, preserving every other filter.
   *
   * Built by hand rather than by calling `setFilters`, because the tabs are
   * `<a href>`s: the href must be correct in the markup, for middle-click and
   * for "copy link address", not only correct after a click handler runs.
   */
  const hrefForStatus = useCallback(
    (status: OrderStatusTabValue) => {
      const params = new URLSearchParams();

      // Reuse the server-rendered query so nothing is lost, then override.
      for (const [key, value] of Object.entries({
        search: filters.search,
        shopId: filters.shopId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: filters.limit,
      })) {
        if (value) params.set(key, String(value));
      }

      if (status !== "ALL") params.set("status", status);
      params.set("page", "1");

      return `/orders?${params.toString()}`;
    },
    [filters],
  );

  return (
    <>
      <OrderStatusTabs
        counts={counts}
        activeStatus={filters.status}
        hrefFor={hrefForStatus}
        className="mb-4"
      />

      <OrderFilters controller={controller} shops={shops} />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={(page) => setFilters({ page }, { keepPage: true })}
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
 * reader user has no idea the result set changed or how many rows came back.
 */
function activeFilterSummary(filters: ReturnType<typeof useOrderFilters>["filters"]): string {
  const parts: string[] = [];
  if (filters.status) parts.push(`status ${filters.status.toLowerCase()}`);
  if (filters.search) parts.push(`search "${filters.search}"`);
  if (filters.shopId) parts.push("one shop");
  if (filters.dateFrom || filters.dateTo) parts.push("a date range");

  return parts.length ? `Filtered by ${parts.join(", ")}.` : "";
}
