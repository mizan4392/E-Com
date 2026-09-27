import { apiFetch } from "../apiClient";
import type {
  DeliveryStatus,
  DeliveryStatusFilter,
  ShopOrder,
  ShopOrderListResponse,
  ShopOrderSummary,
  ShopOrderSummaryMap,
  UpdateDeliveryStatusPayload,
} from "../../types/order";

/**
 * Seller-facing order endpoints (`/shop-orders`).
 *
 * Every call is shop-scoped by the server, which verifies the caller owns the
 * shop before returning or mutating anything.
 */

/** `shopId` is optional: omit it for the "all my shops" inbox. */
export const listShopOrders = async (
  params: {
    shopId?: string;
    page?: number;
    limit?: number;
    deliveryStatus?: DeliveryStatusFilter;
    newOnly?: boolean;
  } = {},
): Promise<ShopOrderListResponse> => {
  const search = new URLSearchParams();

  if (params.shopId) search.set("shopId", params.shopId);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  // Omitted when "ALL" so the server adds no redundant filter clause.
  if (params.deliveryStatus && params.deliveryStatus !== "ALL") {
    search.set("deliveryStatus", params.deliveryStatus);
  }
  if (params.newOnly) search.set("newOnly", "true");

  const query = search.toString();
  return apiFetch<ShopOrderListResponse>(
    `/shop-orders${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
};

/** Badge counters. Omit `shopId` for the aggregate across all shops. */
export const getShopOrderSummary = async (shopId?: string) => {
  const query = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<ShopOrderSummary>(`/shop-orders/summary${query}`, {
    method: "GET",
  });
};

/**
 * Per-shop counters for every shop the caller owns, in a single request.
 * Used by the My Shop page to badge N shop cards without an N+1.
 */
export const getShopOrderSummaryMap =
  async (): Promise<ShopOrderSummaryMap> => {
    return apiFetch<ShopOrderSummaryMap>(`/shop-orders/summary/by-shop`, {
      method: "GET",
    });
  };

export const getShopOrder = async (
  orderId: string,
  shopId: string,
): Promise<ShopOrder> => {
  return apiFetch<ShopOrder>(
    `/shop-orders/${orderId}?shopId=${encodeURIComponent(shopId)}`,
    { method: "GET" },
  );
};

/** Bulk-advance every line of this shop in the order to one stage. */
export const updateOrderDeliveryStatus = async (
  orderId: string,
  payload: UpdateDeliveryStatusPayload,
): Promise<ShopOrder> => {
  return apiFetch<ShopOrder>(
    `/shop-orders/${orderId}/delivery-status?shopId=${encodeURIComponent(payload.shopId)}`,
    { method: "PATCH", body: { deliveryStatus: payload.deliveryStatus } },
  );
};

/** Advance a single line, for orders that ship in parts. */
export const updateItemDeliveryStatus = async (
  orderId: string,
  itemId: string,
  payload: UpdateDeliveryStatusPayload,
): Promise<ShopOrder> => {
  return apiFetch<ShopOrder>(
    `/shop-orders/${orderId}/items/${itemId}/delivery-status?shopId=${encodeURIComponent(payload.shopId)}`,
    { method: "PATCH", body: { deliveryStatus: payload.deliveryStatus } },
  );
};

export type { DeliveryStatus };
