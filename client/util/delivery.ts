import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
  type DeliveryStatusFilter,
} from "../types/order";

/**
 * Single source of truth for how a FULFILMENT status is presented.
 *
 * Mirrors the role of `ORDER_STATUS_META` in `util/order.ts` (which owns the
 * payment statuses) — keep the two separate, because they are separate
 * concerns: `OrderStatus` is Stripe's, `DeliveryStatus` is the seller's.
 */
export type DeliveryStatusMeta = {
  label: string;
  icon: string;
  /** Sentence shown on the seller's detail panel. */
  description: string;
  badgeClassName: string;
  dotClassName: string;
  /** Button/label classes for the "advance to this stage" control. */
  actionClassName: string;
};

export const DELIVERY_STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> =
  {
    PENDING: {
      label: "Pending",
      icon: "⏳",
      description: "Paid and awaiting a fulfilment update.",
      badgeClassName: "bg-amber-50 text-amber-700 border-amber-200",
      dotClassName: "bg-amber-500",
      actionClassName: "border-amber-200 bg-amber-50 text-amber-700",
    },
    CONFIRMED: {
      label: "Confirmed",
      icon: "✅",
      description: "You have confirmed the order and it is being prepared.",
      badgeClassName: "bg-sky-50 text-sky-700 border-sky-200",
      dotClassName: "bg-sky-500",
      actionClassName: "border-sky-200 bg-sky-50 text-sky-700",
    },
    PROCESSING: {
      label: "Processing",
      icon: "📦",
      description: "Your items are being packed and prepared for dispatch.",
      badgeClassName: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dotClassName: "bg-indigo-500",
      actionClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    SHIPPED: {
      label: "Shipped",
      icon: "🚚",
      description: "Your items are on the way to the customer.",
      badgeClassName: "bg-violet-50 text-violet-700 border-violet-200",
      dotClassName: "bg-violet-500",
      actionClassName: "border-violet-200 bg-violet-50 text-violet-700",
    },
    DELIVERED: {
      label: "Delivered",
      icon: "🎉",
      description: "This order has been delivered to the customer.",
      badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClassName: "bg-emerald-500",
      actionClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: "🚫",
      description: "This order was cancelled and will not be fulfilled.",
      badgeClassName: "bg-zinc-50 text-zinc-700 border-zinc-200",
      dotClassName: "bg-zinc-400",
      actionClassName: "border-zinc-200 bg-zinc-50 text-zinc-700",
    },
  };

/** Never throws — an unknown status from the API still renders sanely. */
export function getDeliveryStatusMeta(
  status: string | undefined,
): DeliveryStatusMeta {
  if (status && status in DELIVERY_STATUS_META) {
    return DELIVERY_STATUS_META[status as DeliveryStatus];
  }
  return DELIVERY_STATUS_META.PENDING;
}

/**
 * The fulfilment ladder, excluding CANCELLED.
 *
 * The seller can only move a line FORWARD along this list. A shipped order
 * can be corrected back (server allows it and the badge stays retired), but
 * the primary UI only offers the next step, which is what most sellers want
 * and keeps accidental regressions to a single deliberate click.
 */
export const DELIVERY_FLOW: DeliveryStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

/** The next stage after `status`, or null when the order is finished. */
export function getNextDeliveryStatus(
  status: DeliveryStatus,
): DeliveryStatus | null {
  const index = DELIVERY_FLOW.indexOf(status);
  if (index === -1 || index === DELIVERY_FLOW.length - 1) {
    return null;
  }
  return DELIVERY_FLOW[index + 1];
}

/**
 * Statuses the seller may still move. A delivered or cancelled order is
 * terminal, so no control is rendered for it.
 */
export function canUpdateDelivery(status: DeliveryStatus): boolean {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

/** Tabs for the seller list filter, in a sensible reading order. */
export const DELIVERY_FILTERS: DeliveryStatusFilter[] = [
  "ALL",
  ...DELIVERY_STATUSES,
];

/** Human label for a delivery filter value. */
export function getDeliveryFilterLabel(filter: DeliveryStatusFilter): string {
  return filter === "ALL" ? "All orders" : DELIVERY_STATUS_META[filter].label;
}
