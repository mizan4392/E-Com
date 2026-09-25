import type { OrderItemSnapshot, OrderStatus } from "../types/order";

/**
 * Single source of truth for how an order status is presented in the UI.
 * Every order surface (list, detail, payment status) renders from this map,
 * so a status can never look different on two pages.
 */
export type OrderStatusMeta = {
  label: string;
  icon: string;
  /** Short headline used on the payment status hero. */
  title: string;
  /** Description shown on detail/status surfaces. */
  description: string;
  /** Border + text + background classes for the badge. */
  badgeClassName: string;
  /** Full-panel classes for the payment status hero. */
  panelClassName: string;
  /** Inline tailwind bg/border/text classes for a thin dot marker. */
  dotClassName: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  PAID: {
    label: "Paid",
    icon: "✅",
    title: "Payment successful!",
    description: "Your order has been confirmed and is being processed.",
    badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200",
    panelClassName: "bg-emerald-50 border-emerald-200 text-emerald-800",
    dotClassName: "bg-emerald-500",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    icon: "⚠️",
    title: "Payment failed",
    description:
      "We couldn't process your payment. You can try again with a different payment method.",
    badgeClassName: "bg-red-50 text-red-700 border-red-200",
    panelClassName: "bg-red-50 border-red-200 text-red-800",
    dotClassName: "bg-red-500",
  },
  PENDING: {
    label: "Pending",
    icon: "⏳",
    title: "Payment pending",
    description:
      "Your payment is being processed. This should only take a moment.",
    badgeClassName: "bg-amber-50 text-amber-700 border-amber-200",
    panelClassName: "bg-amber-50 border-amber-200 text-amber-800",
    dotClassName: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: "🚫",
    title: "Payment cancelled",
    description: "This payment was cancelled. No charges were made.",
    badgeClassName: "bg-zinc-50 text-zinc-700 border-zinc-200",
    panelClassName: "bg-zinc-50 border-zinc-200 text-zinc-700",
    dotClassName: "bg-zinc-400",
  },
};

/** Never throws — an unknown status from the API still renders sanely. */
export function getOrderStatusMeta(
  status: string | undefined,
): OrderStatusMeta {
  if (status && status in ORDER_STATUS_META) {
    return ORDER_STATUS_META[status as OrderStatus];
  }
  return ORDER_STATUS_META.PENDING;
}

/**
 * Statuses where the buyer can still (re)start a Stripe Checkout session.
 * Mirrors the guard in `OrdersService.retryPayment`.
 */
export function canRetryPayment(status: string | undefined): boolean {
  return status === "PENDING" || status === "PAYMENT_FAILED";
}

/** Absolute URL for an asset path, or null when there is nothing to show. */
export function getAssetUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  const base = process.env.NEXT_PUBLIC_ASSET_API?.replace(/\/$/, "") ?? "";
  return base ? `${base}/${imageUrl}` : null;
}

/** Number of distinct products in an order snapshot. */
export function getItemCount(items?: OrderItemSnapshot[] | null): number {
  return items?.length ?? 0;
}

/** Sum of quantities across all items. */
export function getTotalQuantity(items?: OrderItemSnapshot[] | null): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

/** First available image across the snapshot, used as a list thumbnail. */
export function getPreviewImage(
  items?: OrderItemSnapshot[] | null,
): string | null {
  if (!items?.length) return null;
  for (const item of items) {
    const url = getAssetUrl(item.imageUrl);
    if (url) return url;
  }
  return null;
}

/** Human label for an order id, e.g. `#A1B2C3D4`. */
export function formatOrderId(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Formats an ISO timestamp for display. Guarded because `createdAt` can be
 * missing on partially-populated rows.
 */
export function formatOrderDate(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
