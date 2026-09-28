export type ProductReview = {
  id: string;
  rating: number;
  message: string;
  reviewerName: string;
  createdAt: string;
};

export type ProductReviewList = {
  data: ProductReview[];
  total: number;
  currentPage: number;
  totalPages: number;
};

export type OrderReviewItem = {
  orderItemId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  rating: number | null;
  message: string | null;
  updatedAt: string | null;
};

export type UpsertProductReviewPayload = {
  rating: number;
  message: string;
};
