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

export type CreateOrderPayload = {
  items: Array<{ productId: string; quantity: number }>;
};

export type OrderCheckoutResult = {
  orderId: string;
  sessionId: string;
  url: string | null;
};
