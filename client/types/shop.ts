import { User } from "../stores/userStore";

export interface Category {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  categoryId?: string;
  createdAt?: string;
  category: Category;
  user: User;
}

export interface CreateShopPayload {
  name: string;
  description: string;
  address: string;

  categoryId: string;
  file?: File | undefined;
}
