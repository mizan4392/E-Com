// features/shops/queries.ts

import { useQuery } from "@tanstack/react-query";
import { getShopById, getShopProducts, getShops } from "./api";
import { PaginatedResult } from "../../types/common";
import { Product, Shop } from "../../types/shop";

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

export const useShopDetails = (
  id: string,
): { data: Shop | undefined; isLoading: boolean } => {
  return useQuery({
    queryKey: ["shopDetails", id],
    queryFn: () => getShopById(id),
    enabled: !!id,
  });
};

export const useShopProducts = (
  id: string,
  page: number = 1,
): { data: PaginatedResult<Product> | undefined; isLoading: boolean } => {
  return useQuery({
    queryKey: ["shopProducts", id, page],
    queryFn: () => getShopProducts(id, page),
    enabled: !!id,
  });
};
