export interface IProductUpdate {
  name?: string;
  categoryId?: string;
  description?: string;
  files?: File[];
  id?: string;
  price?: number;
  slug?: string;
  stock?: number;
}
