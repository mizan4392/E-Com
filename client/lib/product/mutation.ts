import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "./api";

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
