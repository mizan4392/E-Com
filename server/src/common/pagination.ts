export function getPaginationParams(
  page?: number | string,
  limit?: number | string,
): { page: number; limit: number; skip: number } {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(10, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;
  return { page: pageNumber, limit: limitNumber, skip: skip };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
}
