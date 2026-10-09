import Link from "next/link";
import { ChevronRight } from "lucide-react";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { formatCurrency, formatRelative } from "@/lib/format";
import { ORDER_STATUS_LABELS, type AdminOrderListItem } from "./orders.types";

/**
 * Mobile presentation of one order row (`md:hidden`).
 *
 * A card, not a shrunken table. A seven-column table on a 360px screen either
 * scrolls horizontally — which drags the whole page sideways when the user
 * swipes, breaking the "no horizontal page overflow" requirement — or squeezes
 * columns to the point where the order number and the total are both
 * unreadable. Stacking costs vertical space but keeps every field legible and
 * the tap target large.
 *
 * The whole card is not one big link: the title and the chevron are the link,
 * and the rest is plain text. A full-card `<a>` swallows the text-selection a
 * reader might want to do on an order number, and gives no accessible name for
 * the link beyond the entire card's contents.
 */
export default function OrderCard({ order }: { order: AdminOrderListItem }) {
  const shopLabel =
    order.shopCount > 1
      ? `${order.shop?.name ?? "Unknown shop"} +${order.shopCount - 1}`
      : (order.shop?.name ?? "No shop");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Title: order number + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1 rounded text-sm font-semibold text-slate-900 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {order.orderNumber ?? "Order"}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {formatRelative(order.createdAt)}
          </p>
        </div>

        <StatusBadge
          tone={toneForStatus(order.status)}
          label={ORDER_STATUS_LABELS[order.status]}
          className="shrink-0"
        />
      </div>

      {/* Facts */}
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-slate-500">Customer</dt>
          <dd className="min-w-0 text-right">
            <span className="block truncate font-medium text-slate-800">
              {order.user?.name ?? "Guest"}
            </span>
            {order.user?.email ? (
              <span className="block truncate text-xs text-slate-500">
                {order.user.email}
              </span>
            ) : null}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-slate-500">Shop</dt>
          <dd className="min-w-0 truncate text-right text-slate-700">{shopLabel}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-slate-500">Items</dt>
          <dd className="shrink-0 text-slate-700 tabular-nums">{order.itemCount}</dd>
        </div>
      </dl>

      {/* Total */}
      <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
        <span className="text-sm font-medium text-slate-500">Total</span>
        <span className="text-base font-semibold tabular-nums text-slate-900">
          {formatCurrency(order.totalAmount, order.currency)}
        </span>
      </div>
    </article>
  );
}

/**
 * Maps a status to a badge colour.
 *
 * Lives here rather than in `orders.types.ts` because it returns the *UI*
 * tone, not a domain value — the type file should stay free of styling.
 */
export function toneForStatus(status: AdminOrderListItem["status"]): BadgeTone {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
      return "warning";
    case "PAYMENT_FAILED":
      return "danger";
    case "CANCELLED":
      return "neutral";
  }
}
