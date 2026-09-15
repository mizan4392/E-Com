import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getOrder, listOrders, retryPayment } from "./api";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: listOrders,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useRetryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryPayment,
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}
