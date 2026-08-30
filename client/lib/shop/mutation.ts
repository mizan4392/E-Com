import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteShop, updateShop } from "./api";

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

export function useDeleteShop() {
  return useMutation({
    mutationFn: deleteShop,
  });
}
