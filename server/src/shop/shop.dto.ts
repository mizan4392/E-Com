export class GetAllShopsDto {
  page?: number;
  search?: string;
  categoryId?: string;
  sortBy?: 'newest' | 'oldest';
}

export class UpdateShopDto {
  id?: string;
  name?: string;
  description?: string;
  address?: string;
}
