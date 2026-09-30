import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createShop, deleteShop, updateShop } from "./api";
import { portfolioKeys } from "../analytics/queries";
export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShop,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shopDetails", variables?.id],
      });
    },
  });
}

/**
 * Deleting a shop changes the seller's lifetime totals, so the portfolio
 * tiles are invalidated explicitly.
 *
 * The portfolio query has a deliberately long `staleTime` (a sale must never
 * invalidate it), which means these structural writes are the ONLY thing that
 * will refresh it. Without this, "Total shops" would keep counting a deleted
 * shop for up to five minutes.
 */
export function useDeleteShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}
