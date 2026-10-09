/**
 * Types mirroring the admin orders API (`server/src/orders/dto/admin-orders.dto.ts`).
 *
 * Kept as a hand-written mirror rather than a generated client: the project has
 * no codegen step and the surface is three endpoints. The DTO names map 1:1 to
 * the backend so a rename on either side is easy to spot in review.
 *
 * The backend owns `OrderStatus`; this file re-declares it because the admin
 * app must not import from `server/`. `ORDER_STATUSES` below is the single
 * place the tab order is defined, matching `ORDER_STATUS_DISPLAY_ORDER` on the
 * server.
 */

/** Payment/lifecycle state of an order. Mirrors the server `OrderStatus`. */
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "CANCELLED";

/** Tab order for the status filter. All entries plus `ALL` are rendered. */
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PAYMENT_FAILED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

/** Human labels — the enum names are for machines, not for admins. */
export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  PENDING: "Pending",
  PAID: "Paid",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
};

/**
 * Per-line fulfilment state. Mirrors the server `DeliveryStatus`.
 *
 * Distinct from `OrderStatus`: that tracks **payment**, this tracks
 * **fulfilment**, so an order can be `PAID` while its items are still `PENDING`.
 */
export type DeliveryStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/** Display order follows `DELIVERY_STAGE_ORDER` on the server. */
export const DELIVERY_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly DeliveryStatus[];

export const DELIVERY_STATUS_LABELS: Readonly<Record<DeliveryStatus, string>> =
  {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

/**
 * Label for a delivery status, falling back to the raw value.
 *
 * The DTO types this field as `string` server-side, so a status added there
 * before this file is updated arrives at runtime but is absent from
 * `DELIVERY_STATUS_LABELS`. Indexing blindly would yield `undefined` and render
 * an empty badge; showing `DELIVERLED`-style raw text is dull but legible.
 */
export function deliveryStatusLabel(status: string): string {
  return DELIVERY_STATUS_LABELS[status as DeliveryStatus] ?? status;
}

/** Sortable columns on the list endpoint. */
export type OrderSortField = "createdAt" | "totalAmount";
export type SortOrder = "asc" | "desc";

/** The shop reference embedded in list and detail payloads. */
export interface AdminOrderShopRef {
  id: string;
  name: string;
}

/**
 * The customer reference.
 *
 * `phone` is present on the **detail** endpoint only — the list projection is
 * deliberately lean and must not carry it.
 */
export interface AdminOrderUserRef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

/** One row of `GET /admin/orders`. */
export interface AdminOrderListItem {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  shop: AdminOrderShopRef | null;
  /** Distinct shops in the basket; > 1 means a multi-shop order. */
  shopCount: number;
  user: AdminOrderUserRef | null;
}

/** One line of `GET /admin/orders/:id`. */
export interface AdminOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  shopId: string | null;
  shopName: string | null;
  deliveryStatus: DeliveryStatus;
}

/** Full order payload from `GET /admin/orders/:id`. */
export interface AdminOrderDetail {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shopCount: number;
  shop: AdminOrderShopRef | null;
  user: AdminOrderUserRef | null;
  items: AdminOrderItem[];
  itemCount: number;
  totalQuantity: number;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  buyerConfirmedAt: string | null;
}

/** Pagination envelope shared by every list endpoint. */
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

/**
 * Status tally from `GET /admin/orders/status-counts`.
 *
 * Always contains `ALL` and every member of {@link ORDER_STATUSES} so a tab
 * can render `0` rather than `undefined`.
 */
export type OrderStatusCounts = Record<OrderStatus | "ALL", number>;

/** Everything the list endpoint accepts, as a flat query object. */
export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | undefined;
  shopId?: string | undefined;
  search?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortBy?: OrderSortField | undefined;
  sortOrder?: SortOrder | undefined;
}

/** Filters accepted by `GET /admin/orders/status-counts`. */
export interface OrderStatusCountsParams {
  shopId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
}