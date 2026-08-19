// features/shops/queries.ts

import { useQuery } from "@tanstack/react-query";
import { getShops } from "./api";

export const shopKeys = {
  all: ["shops"] as const,

  list: (page: number) => [...shopKeys.all, "list", page] as const,
};

export const useShops = (page: number) => {
  return useQuery({
    queryKey: shopKeys.list(page),
    queryFn: () => getShops(page),
    placeholderData: (previousData) => previousData,
  });
};
