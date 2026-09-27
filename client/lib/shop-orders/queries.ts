import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getShopOrder,
  getShopOrderSummary,
  getShopOrderSummaryMap,
  listShopOrders,
  updateItemDeliveryStatus,
  updateOrderDeliveryStatus,
} from "./api";
import type {
  DeliveryStatusFilter,
  UpdateDeliveryStatusPayload,
} from "../../types/order";

/**
 * Query keys for the seller order feature.
 *
 * Separate namespace from the buyer `orderKeys` in `lib/order/queries.ts` —
 * the two are different audiences over the same underlying table, and mixing
 * them would let a buyer's invalidation refetch seller data.
 */
export const shopOrderKeys = {
  all: ["shop-orders"] as const,
  lists: () => [...shopOrderKeys.all, "list"] as const,
  list: (
    shopId: string | undefined,
    page: number,
    status: DeliveryStatusFilter,
    newOnly: boolean,
  ) =>
    [
      ...shopOrderKeys.lists(),
      { shopId: shopId ?? null, page, status, newOnly },
    ] as const,
  details: () => [...shopOrderKeys.all, "detail"] as const,
  detail: (orderId: string, shopId: string) =>
    [...shopOrderKeys.details(), { orderId, shopId }] as const,
  summaries: () => [...shopOrderKeys.all, "summary"] as const,
  /** Aggregate across all the caller's shops. */
  summaryAll: () => [...shopOrderKeys.summaries(), "all"] as const,
  /** Per-shop counters, used by the badge on each shop card. */
  summaryByShop: (shopId: string) =>
    [...shopOrderKeys.summaries(), "shop", shopId] as const,
  /** All per-shop counters in one map. */
  summariesByShop: () => [...shopOrderKeys.summaries(), "by-shop"] as const,
};

/**
 * Paginated seller inbox. `placeholderData` keeps the previous page on screen
 * while the next loads, so paginating does not blank the list.
 */
export function useShopOrders(
  shopId?: string,
  page: number = 1,
  status: DeliveryStatusFilter = "ALL",
  newOnly: boolean = false,
  limit?: number,
) {
  return useQuery({
    queryKey: shopOrderKeys.list(shopId, page, status, newOnly),
    queryFn: () =>
      listShopOrders({
        shopId,
        page,
        limit,
        deliveryStatus: status,
        newOnly,
      }),
    placeholderData: (previousData) => previousData,
    enabled: typeof shopId === "string" ? shopId.length > 0 : true,
  });
}

export function useShopOrder(orderId: string, shopId: string) {
  return useQuery({
    queryKey: shopOrderKeys.detail(orderId, shopId),
    queryFn: () => getShopOrder(orderId, shopId),
    enabled: !!orderId && !!shopId,
  });
}

/**
 * Badge counters for the My Shop header.
 *
 * `staleTime` keeps this cheap: the badge does not need to be live to the
 * millisecond, and this query is shared by every card on the page, so a short
 * stale window collapses a burst of refetches into one.
 */
export function useShopOrderSummary(shopId?: string) {
  return useQuery({
    queryKey: shopId
      ? shopOrderKeys.summaryByShop(shopId)
      : shopOrderKeys.summaryAll(),
    queryFn: () => getShopOrderSummary(shopId),
    staleTime: 30_000,
  });
}

/**
 * Per-shop counters for every shop the caller owns, fetched once.
 *
 * The My Shop page renders a badge on each card; asking the summary endpoint
 * per shop would be an N+1 on first paint. The server groups them into a
 * single aggregate, and shops with no orders come back as zeros, so callers
 * can read `map[shopId]?.newPaid ?? 0` without guarding.
 */
export function useShopOrderSummaryMap() {
  return useQuery({
    queryKey: shopOrderKeys.summariesByShop(),
    queryFn: getShopOrderSummaryMap,
    staleTime: 30_000,
  });
}

/**
 * Invalidate everything a status change can affect.
 *
 * A mutation changes the list row, the detail view, the My Shop badge and the
 * per-shop card badge. Missing any one of them leaves a stale number on screen
 * — the badge in particular would keep counting an order the seller has
 * already actioned.
 */
function useInvalidateShopOrders() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: shopOrderKeys.lists() });
    queryClient.invalidateQueries({ queryKey: shopOrderKeys.details() });
    // Prefix match covers the aggregate, per-shop and by-shop map at once.
    queryClient.invalidateQueries({ queryKey: shopOrderKeys.summaries() });
  };
}

/** Bulk-advance every line of the order for one shop. */
export function useUpdateOrderDeliveryStatus() {
  const invalidate = useInvalidateShopOrders();

  return useMutation({
    mutationFn: ({
      orderId,
      shopId,
      deliveryStatus,
    }: UpdateDeliveryStatusPayload & { orderId: string }) =>
      updateOrderDeliveryStatus(orderId, { shopId, deliveryStatus }),
    onSuccess: () => invalidate(),
  });
}

/** Advance a single line, for split shipments. */
export function useUpdateItemDeliveryStatus() {
  const invalidate = useInvalidateShopOrders();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      shopId,
      deliveryStatus,
    }: UpdateDeliveryStatusPayload & { orderId: string; itemId: string }) =>
      updateItemDeliveryStatus(orderId, itemId, { shopId, deliveryStatus }),
    onSuccess: () => invalidate(),
  });
}
