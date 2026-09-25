import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getOrder, listOrders, retryPayment } from "./api";
import type { OrderListResponse, OrderStatusFilter } from "../../types/order";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (page: number, status: OrderStatusFilter) =>
    [...orderKeys.lists(), { page, status }] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

/**
 * Paginated order history for the signed-in user.
 * `placeholderData` keeps the previous page on screen while the next one
 * loads, which avoids a layout jump when paginating.
 */
export function useOrders(page: number = 1, status: OrderStatusFilter = "ALL") {
  return useQuery({
    queryKey: orderKeys.list(page, status),
    queryFn: () => listOrders({ page, status }),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Retrying resets the order to PENDING, which changes both the detail view and
 * that row in the history list, so both caches are invalidated.
 */
export function useRetryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryPayment,
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export type { OrderListResponse };
