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
}

export interface CreateShopPayload {
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  categoryId: string;
}
