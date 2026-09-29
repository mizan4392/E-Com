import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrderReviews,
  getPopularProducts,
  getProductReviews,
  upsertOrderItemReview,
} from "./api";
import { Product } from "../../types/shop";
import type {
  UpsertProductReviewPayload,
  OrderReviewItem,
} from "../../types/review";

export const productReviewKeys = {
  all: ["product-reviews"] as const,
  list: (productId: string, page: number) =>
    [...productReviewKeys.all, productId, page] as const,
  order: (orderId: string) => ["order-reviews", orderId] as const,
};

export const useGetPopularProducts = (): {
  data: Product[] | undefined;
  isLoading: boolean;
} => {
  return useQuery({
    queryKey: ["popularProducts"],
    queryFn: () => getPopularProducts(),
  });
};

export function useProductReviews(productId: string, page: number) {
  return useQuery({
    queryKey: productReviewKeys.list(productId, page),
    queryFn: () => getProductReviews(productId, page),
    enabled: !!productId,
    placeholderData: (previousData) => previousData,
  });
}

export function useOrderReviews(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: productReviewKeys.order(orderId),
    queryFn: () => getOrderReviews(orderId),
    enabled: !!orderId && enabled,
  });
}

export function useUpsertOrderItemReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      orderItemId,
      ...payload
    }: UpsertProductReviewPayload & {
      orderId: string;
      orderItemId: string;
    }) => upsertOrderItemReview(orderId, orderItemId, payload),
    onSuccess: (review, variables) => {
      queryClient.setQueryData<OrderReviewItem[]>(
        productReviewKeys.order(variables.orderId),
        (current) =>
          current?.map((item) =>
            item.orderItemId === review.orderItemId
              ? { ...item, ...review }
              : item,
          ),
      );
      queryClient.invalidateQueries({
        queryKey: ["productDetails", review.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["popularProducts"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      queryClient.invalidateQueries({
        queryKey: [...productReviewKeys.all, review.productId],
      });
    },
  });
}
