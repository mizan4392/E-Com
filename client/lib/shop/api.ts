import {
  FetchShopsParams,
  FetchShopsResponse,
  ICategory,
  Product,
  Shop,
  UpdateShopPayload,
} from "../../types/shop";
import { apiFetch, apiFormData } from "../apiClient";

export const getShops = async (
  params: FetchShopsParams = {},
): Promise<FetchShopsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/shop?${queryString}` : "/shop";

  return apiFetch<FetchShopsResponse>(url);
};

export const getShopById = async (id: string) => {
  return apiFetch<Shop>(`/shop/${id}`);
};

export const getShopProducts = async (id: string, page: number = 1) => {
  return apiFetch(`/shop/${id}/products?page=${page}`);
};

export const deleteShop = async (shopId: string) => {
  return apiFetch(`/shop/${shopId}`, { method: "DELETE" });
};

export const getUserShops = async (): Promise<Shop[]> => {
  return apiFetch<Shop[]>("/users/me/shops", { method: "GET" });
};

export const getCategories = async (): Promise<ICategory[]> => {
  return apiFetch<ICategory[]>("/category", { method: "GET" });
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

export const createShop = async (payload): Promise<any> => {
  const formData = new FormData();
  formData.append("file", payload.file as Blob);
  Object.keys(payload).forEach((key) => {
    if (key !== "file") {
      formData.append(key, (payload as any)[key]);
    }
  });
  return apiFormData<Shop>("/users/me/shops", formData, {
    method: "POST",
  });
};

export const getProductDetails = async (productId: string) => {
  return apiFetch<Product>(`/products/${productId}`, { method: "GET" });
};
