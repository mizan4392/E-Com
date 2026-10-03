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
  deliveryStatus?: DeliveryStatus | null;
  deliveryAddress?: string | null;
  deliveryPhone?: string | null;
  deliveryAddressEditable?: boolean;
  buyerConfirmedAt?: string | null;
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

/* -------------------------------------------------------------------------- */
/* Seller (shop owner) order management                                        */
/* -------------------------------------------------------------------------- */

/**
 * Fulfilment stage of a line item, owned by the SELLER.
 *
 * Deliberately separate from `OrderStatus`, which is the *payment* state owned
 * by Stripe. A seller only ever sees orders whose payment succeeded, then
 * moves them along this ladder.
 */
export type DeliveryStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/** The stages a seller can filter by, in ladder order. */
export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** One line of an order, as seen by the shop that must fulfil it. */
export type ShopOrderItem = {
  id: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  /** Shop responsible for this line. Set when the basket spans shops. */
  shopId: string | null;
  shopName: string;
  review: {
    rating: number;
    message: string;
    reviewerName: string;
    createdAt: string;
  } | null;
};

/**
 * ONE order in the seller's inbox — one row per order, never one per product
 * and never one per shop.
 *
 * A basket spanning two of the seller's shops used to render as two cards with
 * the same order number. The order is now the single unit: one status, one
 * payout, one shipment. Shop identity lives on each item instead.
 */
export type ShopOrder = {
  orderId: string;
  /** Always PAID; the server filters out unpaid orders entirely. */
  status: OrderStatus;
  /**
   * The ONE fulfilment stage for this order.
   *
   * Lines cannot hold different stages, so this is not an aggregate the UI has
   * to interpret — it is the order's actual state. Every product under it moves
   * together when the seller changes it.
   */
  deliveryStatus: DeliveryStatus;
  currency: string;
  /** Revenue across the seller's lines only, not the buyer's whole basket. */
  shopAmount: number;
  /** How many of the seller's shops this order touches (>1 = split basket). */
  shopCount: number;
  /** The products in this order, revealed on expand. */
  items: ShopOrderItem[];
  itemCount: number;
  totalQuantity: number;
  previewImageUrl: string | null;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  createdAt: string;
  buyerConfirmedAt: string | null;
  /** Set the first time the seller acts; null while untouched. */
  acknowledgedAt: string | null;
  /** True until the seller first acts on any line of this order. */
  isNew: boolean;
};

/** Paginated response for `GET /shop-orders`. */
export type ShopOrderListResponse = {
  data: ShopOrder[];
  total: number;
  currentPage: number;
  totalPages: number;
};

/** Badge counters behind My Shop / Shop card. */
export type ShopOrderSummary = {
  total: number;
  /** Paid orders with no seller action in this scope yet. Drives the badge. */
  newPaid: number;
  /** Paid orders with at least one seller action in this scope. */
  actioned: number;
};

/** Per-shop counters, keyed by shop id. */
export type ShopOrderSummaryMap = Record<string, ShopOrderSummary>;

/** Status filter for the seller list. */
export type DeliveryStatusFilter = DeliveryStatus | "ALL";

export type UpdateDeliveryStatusPayload = {
  /**
   * Optional scope filter, NOT the order's identity. Omit it to update every
   * line the seller owns in the order; pass it when working inside one shop's
   * filtered view.
   */
  shopId?: string;
  deliveryStatus: DeliveryStatus;
};

export type CreateOrderPayload = {
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress?: string;
};

export type OrderCheckoutResult = {
  orderId: string;
  sessionId: string;
  url: string | null;
};
