import {
  FetchShopsResponse,
  ICategory,
  Shop,
  UpdateShopPayload,
} from "../../types/shop";
import { apiFetch, apiFormData } from "../apiClient";

export const getShops = async (page: number): Promise<FetchShopsResponse> => {
  return apiFetch<FetchShopsResponse>(`/shop?page=${page}`);
};

export const getShopById = async (id: string) => {
  return apiFetch<Shop>(`/shop/${id}`);
};

export const getShopProducts = async (id: string, page: number = 1) => {
  return apiFetch(`/shop/${id}/products?page=${page}`);
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

export const updateShop = async (payload): Promise<any> => {
  const formData = new FormData();
  formData.append("file", payload.file as Blob);
  Object.keys(payload).forEach((key) => {
    if (key !== "file") {
      formData.append(key, (payload as any)[key]);
    }
  });
  return apiFormData<UpdateShopPayload>("/shop", formData, {
    method: "PATCH",
  });
};
