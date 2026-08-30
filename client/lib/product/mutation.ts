import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProductToShop, deleteProduct, updateProduct } from "./api";

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

export function useDeleteProduct() {
  return useMutation({
    mutationFn: deleteProduct,
  });
}

export function useAddProductToShop() {
  return useMutation({
    mutationFn: addProductToShop,
  });
}
