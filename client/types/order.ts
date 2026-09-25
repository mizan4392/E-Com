export type OrderStatus = "PENDING" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";

export type OrderItemSnapshot = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  shopId?: string | null;
  shopName?: string | null;
};

export type Order = {
  id: string;
  userId: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amountTotal: number;
  currency: string;
  status: OrderStatus;
  items?: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Server-computed fields derived from `items`. The orders service returns
 * these alongside the raw columns so the client never has to re-reduce the
 * snapshot array on every render.
 */
export type OrderSummary = {
  /** Total number of distinct products in the order. */
  itemCount: number;
  /** Sum of all quantities (pieces). */
  totalQuantity: number;
  /** Image of the first item, used as the list thumbnail. */
  previewImageUrl: string | null;
};

/** A list row: full order plus server-computed summary fields. */
export type OrderListItem = Order & OrderSummary;

/** Paginated response for `GET /orders`, mirrors the shop/products endpoints. */
export type OrderListResponse = {
  data: OrderListItem[];
  total: number;
  currentPage: number;
  totalPages: number;
};

/** Status values that can be filtered server-side. */
export type OrderStatusFilter = OrderStatus | "ALL";

export type CreateOrderPayload = {
  items: Array<{ productId: string; quantity: number }>;
};

export type OrderCheckoutResult = {
  orderId: string;
  sessionId: string;
  url: string | null;
};
