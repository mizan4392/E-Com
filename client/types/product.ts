export interface IProductUpdate {
  name?: string;
  categoryId?: string;
  description?: string;
  files?: File[];
  id?: string;
  price?: number;
  slug?: string;
  stock?: number;
  deleteImageUrls?: string[];
}

export interface IProductCreate {
  shopId: string;
  name: string;
  price: number;
  slug?: string;
  stock: number;
  category: string;
  description?: string;
  files: File[];
}
