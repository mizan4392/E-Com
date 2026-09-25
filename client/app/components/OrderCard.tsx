"use client";

import { memo } from "react";
import Link from "next/link";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatPrice } from "../../util/functions";
import { formatOrderDate, formatOrderId, getAssetUrl } from "../../util/order";
import type { OrderListItem } from "../../types/order";

type Props = {
  order: OrderListItem;
};

/**
 * Summary card for one order in the history list. Wrapped in `memo` because
 * paginating re-renders the whole list but only a few orders change.
 */
function OrderCard({ order }: Props) {
  const preview = getAssetUrl(order.previewImageUrl);
  const itemCount = order.itemCount ?? order.items?.length ?? 0;
  const totalQuantity = order.totalQuantity ?? 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/user/orders/${order.id}`}
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
      >
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20">
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
              {formatOrderId(order.id)}
            </p>
            <OrderStatusBadge status={order.status} size="sm" />
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            {formatOrderDate(order.createdAt)}
            {totalQuantity > 0 ? (
              <>
                <span className="mx-1.5 text-zinc-300">·</span>
                {itemCount} {itemCount === 1 ? "product" : "products"} ·{" "}
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
              </>
            ) : null}
          </p>

          {order.items?.[0] ? (
            <p className="mt-1 truncate text-xs text-zinc-600">
              {order.items[0].name}
              {itemCount > 1 ? ` and ${itemCount - 1} more` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <div className="sm:text-right">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-base font-semibold text-zinc-900">
              {formatPrice(order.amountTotal)}
            </p>
          </div>
          <span
            className="text-zinc-400 transition group-hover:text-zinc-900"
            aria-hidden
          >
            →
          </span>
        </div>
      </Link>
    </article>
  );
}

export default memo(OrderCard);
