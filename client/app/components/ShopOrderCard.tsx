"use client";

import { memo } from "react";
import Link from "next/link";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import DeliveryStatusSelect from "./DeliveryStatusSelect";
import NewOrdersBadge from "./NewOrdersBadge";
import { formatPrice } from "../../util/functions";
import { formatOrderDate, formatOrderId, getAssetUrl } from "../../util/order";
import type { DeliveryStatus, ShopOrder } from "../../types/order";

type Props = {
  order: ShopOrder;
  /** Wired to the bulk status mutation on the list page. */
  onUpdateStatus?: (order: ShopOrder, status: DeliveryStatus) => void;
  isPending?: boolean;
};

/**
 * One order in the seller's inbox.
 *
 * Wrapped in `memo` because paginating re-renders the whole list but only a
 * few orders actually change, and the mutation callbacks are stable enough
 * (bound through `useCallback` in the page) to keep this comparison useful.
 *
 * Unlike the buyer-facing `OrderCard`, this shows the shop's OWN subtotal and
 * the buyer who placed it — the seller does not need the rest of the basket
 * and should not be shown another shop's revenue.
 */
function ShopOrderCard({ order, onUpdateStatus, isPending = false }: Props) {
  const preview = getAssetUrl(order.previewImageUrl);

  return (
    <article
      className={`rounded-2xl border bg-white shadow-sm transition ${
        order.isNew ? "border-red-200 ring-1 ring-red-100" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={order.items?.[0]?.name ?? "Order"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              🛍️
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">
              {formatOrderId(order.orderId)}
            </p>
            <DeliveryStatusBadge status={order.deliveryStatus} size="sm" />
            {order.isNew ? <NewOrdersBadge count={1} variant="subtle" /> : null}
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            {order.customerName} · {formatOrderDate(order.createdAt)}
          </p>

          <p className="mt-1.5 text-xs text-zinc-500">
            {order.itemCount} {order.itemCount === 1 ? "product" : "products"} ·{" "}
            {order.totalQuantity} {order.totalQuantity === 1 ? "unit" : "units"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-base font-semibold text-zinc-900">
            {formatPrice(order.shopAmount)}
          </p>
          <Link
            href={`/user/shop-orders/${order.orderId}?shopId=${order.shopId}`}
            className="text-xs font-semibold text-amber-700 transition hover:text-amber-800"
          >
            View details
          </Link>
        </div>
      </div>

      {onUpdateStatus ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:px-5">
          <p className="text-xs text-zinc-500">
            {order.isNew
              ? "New paid order — acknowledge it to clear the badge."
              : "Update how far this order has progressed."}
          </p>
          <DeliveryStatusSelect
            status={order.deliveryStatus}
            onChange={(next) => onUpdateStatus(order, next)}
            isPending={isPending}
            size="sm"
          />
        </div>
      ) : null}
    </article>
  );
}

export default memo(ShopOrderCard);
