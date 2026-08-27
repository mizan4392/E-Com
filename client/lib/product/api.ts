import { IProductUpdate } from "../../types/product";
import { apiFormData } from "../apiClient";

export const updateProduct = async (payload: IProductUpdate): Promise<any> => {
  const formData = new FormData();
  const { files, id, deleteImageUrls, ...rest } = payload;
  Object.keys(rest).forEach((key) => {
    formData.append(key, payload[key]);
  });

  deleteImageUrls?.forEach((url) => {
    formData.append("deleteImageUrls", url);
  });

  files?.forEach((f) => {
    formData.append("file", f);
  });
  return apiFormData<IProductUpdate>(`/products/${id}`, formData, {
    method: "PATCH",
  });
};
