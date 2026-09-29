export type UserType = "admin" | "user";
export interface Category {
  id: string;
  name: string;
}

export interface CreateShopPayload {
  name: string;
  description: string;
  address: string;

  categoryId: string;
  file?: File | undefined;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;

  raw: {
    userType: UserType;
  };
}

export type Shop = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  address: string;
  imageUrl: string;
  category: ICategory;
  user: IUser;
  createdAt: string;
  updatedAt?: string;
  rating?: number;
};

export type ShopSortOption = "newest" | "oldest";

export interface FetchShopsParams {
  page?: number;
  search?: string;
  categoryId?: string;
  sortBy?: ShopSortOption;
}

export interface FetchShopsResponse {
  data: Shop[];
  page: number;
  total: number;
  totalPages: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string[];
  shop: Shop;
  createdAt: string;
  updatedAt?: string;
  rating: number;
  reviewCount?: number;
  soldCount?: number;
  stock: number;
}

export interface UpdateShopPayload {
  name?: string;
  description?: string;
  address?: string;
  file?: File;
}
