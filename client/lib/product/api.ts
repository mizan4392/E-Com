import { IProductUpdate } from "../../types/product";
import { apiFormData } from "../apiClient";

export const updateProduct = async (payload: IProductUpdate): Promise<any> => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    if (key === "files") {
      payload[key].map((f) => {
        formData.append(key, (f as any)[key]);
      });
    } else {
      formData.append(key, payload[key]);
    }
  });
  return apiFormData<IProductUpdate>(`/products/${payload?.id}`, formData, {
    method: "PATCH",
  });
};
