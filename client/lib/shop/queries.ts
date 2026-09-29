// features/shops/queries.ts

import { useQuery } from "@tanstack/react-query";
import {
  getProductDetails,
  getShopById,
  getShopProducts,
  getShops,
  getUserShops,
  getCategories,
} from "./api";
import { PaginatedResult } from "../../types/common";
import {
  FetchShopsParams,
  FetchShopsResponse,
  ICategory,
  Product,
  Shop,
} from "../../types/shop";

export const shopKeys = {
  all: ["shops"] as const,

  list: (params: FetchShopsParams) => [...shopKeys.all, "list", params] as const,

  categories: () => [...shopKeys.all, "categories"] as const,
};

export const useShops = (
  params: FetchShopsParams = { page: 1 },
): {
  data: FetchShopsResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
} => {
  const { page = 1, search, categoryId, sortBy } = params;

  return useQuery({
    queryKey: shopKeys.list({ page, search, categoryId, sortBy }),
    queryFn: () => getShops({ page, search, categoryId, sortBy }),
    placeholderData: (previousData) => previousData,
  });
};

export const useShopCategories = (): {
  data: ICategory[] | undefined;
  isLoading: boolean;
} => {
  return useQuery({
    queryKey: shopKeys.categories(),
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
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

export const useGetUserShop = (
  enabled = true,
): {
  data: Shop[] | undefined;
  isLoading: boolean;
} => {
  return useQuery({
    queryKey: ["userShop"],
    queryFn: () => getUserShops(),
    enabled,
  });
};

export const useProductDetails = (
  productId: string,
): {
  data: Product | undefined;
  isLoading: boolean;
} => {
  return useQuery({
    queryKey: ["productDetails", productId],
    queryFn: () => getProductDetails(productId),
  });
};
