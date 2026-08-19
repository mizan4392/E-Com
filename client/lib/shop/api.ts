import { FetchShopsResponse } from "../../types/shop";
import { apiFetch } from "../apiClient";

export const getShops = async (page: number): Promise<FetchShopsResponse> => {
  return apiFetch<FetchShopsResponse>(`/shop?page=${page}`);
};
