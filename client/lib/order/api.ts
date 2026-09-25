import { apiFetch } from "../apiClient";
import {
  CreateOrderPayload,
  Order,
  OrderCheckoutResult,
  OrderListResponse,
  OrderStatusFilter,
} from "../../types/order";

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<OrderCheckoutResult> => {
  return apiFetch<OrderCheckoutResult>("/orders", {
    method: "POST",
    body: payload,
  });
};

export const getOrder = async (orderId: string): Promise<Order> => {
  return apiFetch<Order>(`/orders/${orderId}`, { method: "GET" });
};

/**
 * Paginated order history. `status` is omitted when "ALL" so the server does
 * not build a redundant filter clause.
 */
export const listOrders = async (
  params: {
    page?: number;
    limit?: number;
    status?: OrderStatusFilter;
  } = {},
): Promise<OrderListResponse> => {
  const search = new URLSearchParams();

  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status && params.status !== "ALL") {
    search.set("status", params.status);
  }

  const query = search.toString();
  return apiFetch<OrderListResponse>(`/orders${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

export const retryPayment = async (
  orderId: string,
): Promise<OrderCheckoutResult> => {
  return apiFetch<OrderCheckoutResult>(`/orders/${orderId}/retry-payment`, {
    method: "POST",
  });
};
