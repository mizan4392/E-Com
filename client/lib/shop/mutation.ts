import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateShop } from "./api";

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
