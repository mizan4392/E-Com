import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProductToShop, deleteProduct, updateProduct } from "./api";
import { analyticsKeys, portfolioKeys } from "../analytics/queries";

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["productDetails", variables?.id],
      });
    },
  });
}

/**
 * Adding or removing a product changes the seller's catalogue size, which is
 * one of the four portfolio totals.
 *
 * The portfolio query's long `staleTime` means sales can never refresh it, so
 * this explicit invalidation is what keeps "Total products" honest.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      // A removed product can drop out of the best-seller table, so every
      // cached shop/range combination is stale.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

export function useAddProductToShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProductToShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      // Catalogue size feeds the "Products in shop" tile.
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}
