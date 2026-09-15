import { apiFetch } from "../apiClient";
import {
  CreateOrderPayload,
  Order,
  OrderCheckoutResult,
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
  console.log("getOrder orderId ", orderId);
  return apiFetch<Order>(`/orders/${orderId}`, { method: "GET" });
};

export const listOrders = async (): Promise<Order[]> => {
  return apiFetch<Order[]>("/orders", { method: "GET" });
};

export const retryPayment = async (
  orderId: string,
): Promise<OrderCheckoutResult> => {
  return apiFetch<OrderCheckoutResult>(`/orders/${orderId}/retry-payment`, {
    method: "POST",
  });
};
