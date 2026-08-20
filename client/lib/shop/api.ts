import { FetchShopsResponse, ICategory, Shop } from "../../types/shop";
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

export const updateShop = async (id: string, payload: any) => {
  return apiFetch(`/shop/${id}`, { method: "PUT", body: payload });
};

export const deleteShop = async (id: string) => {
  return apiFetch(`/shop/${id}`, { method: "DELETE" });
};

export const getUserShops = async (): Promise<Shop[]> => {
  return apiFetch<Shop[]>("/users/me/shops", { method: "GET" });
};

export const getCategories = async (): Promise<ICategory[]> => {
  return apiFetch<ICategory[]>("/users/categories", { method: "GET" });
};
