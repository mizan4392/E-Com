import { FetchShopsResponse, Shop } from "../../types/shop";
import { apiFetch } from "../apiClient";

export const getShops = async (page: number): Promise<FetchShopsResponse> => {
  return apiFetch<FetchShopsResponse>(`/shop?page=${page}`);
};

export const getShopById = async (id: string) => {
  return apiFetch<Shop>(`/shop/${id}`);
};

export const getShopProducts = async (id: string, page: number = 1) => {
  return apiFetch(`/shop/${id}/products?page=${page}`);
};
