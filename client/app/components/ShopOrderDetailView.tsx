"use client";

import Link from "next/link";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import { formatPrice } from "../../util/functions";
import { formatOrderDate, formatOrderId, getAssetUrl } from "../../util/order";
import { getDeliveryStatusMeta } from "../../util/delivery";
import type { ShopOrder, ShopOrderItem } from "../../types/order";
import StarRating from "./StarRating";

type Props = {
  order: ShopOrder;
  /** Rendered under the totals, e.g. the status controls. */
  action?: React.ReactNode;
};

/**
 * A single purchased line as the SELLER sees it: what was bought, how many,
 * and the per-line fulfilment stage.
 *
 * Deliberately separate from the buyer-facing `OrderItemRow`, which links to
 * the product page and shows "Sold by {shop}". Here the shop is the reader
 * and the line has mutable state, so it renders its own stage badge and a
 * per-line update control.
 */
function ShopOrderItemRow({
  item,
  action,
}: {
  item: ShopOrderItem;
  action?: React.ReactNode;
}) {
  const imageUrl = getAssetUrl(item.imageUrl);
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 0);

  const media = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={item.name}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-2xl">
      🛍️
    </div>
  );

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20">
        {media}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
          {item.name}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {formatPrice(item.price)} × {item.quantity} ={" "}
          <span className="font-medium text-zinc-700">
            {formatPrice(lineTotal)}
          </span>
        </p>
        <div className="mt-2">
          <DeliveryStatusBadge status={item.deliveryStatus} size="sm" />
        </div>
        {item.review ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StarRating value={item.review.rating} />
              <span className="text-xs font-semibold text-zinc-800">
                {item.review.reviewerName}
              </span>
              <time
                dateTime={item.review.createdAt}
                className="text-xs text-zinc-500"
              >
                {formatOrderDate(item.review.createdAt)}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-line wrap-break-word text-sm leading-5 text-zinc-700">
              {item.review.message}
            </p>
          </div>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
}

/**
 * Full order breakdown for the seller: header, buyer, items (with per-line
 * stages), the shop's own subtotal, and an action slot for the status control.
 */
export default function ShopOrderDetailView({ order, action }: Props) {
  const meta = getDeliveryStatusMeta(order.deliveryStatus);
  const items = order.items ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              {formatOrderId(order.orderId)}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              Order details
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Placed on {formatOrderDate(order.createdAt)} · {order.shopName}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <DeliveryStatusBadge status={order.deliveryStatus} />
            <p className="max-w-xs text-xs text-zinc-500 sm:text-right">
              {meta.description}
            </p>
          </div>
        </div>

        {/* Buyer block — the seller needs a way to reach the customer. */}
        <div className="flex flex-col gap-1 border-b border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Customer
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900">
              {order.customerName}
            </p>
            {order.buyerConfirmedAt && order.deliveryStatus === "DELIVERED" ? (
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Buyer confirmed receipt on{" "}
                {formatOrderDate(order.buyerConfirmedAt)}
              </p>
            ) : order.deliveryStatus === "SHIPPED" ||
              order.deliveryStatus === "DELIVERED" ? (
              <p className="mt-1 text-xs text-zinc-500">
                Awaiting buyer receipt confirmation
              </p>
            ) : null}
          </div>
          {order.customerEmail ? (
            <a
              href={`mailto:${order.customerEmail}`}
              className="text-sm text-amber-700 transition hover:text-amber-800"
            >
              {order.customerEmail}
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 border-b border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Delivery address
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
              {order.deliveryAddress || "No delivery address provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Delivery phone
            </p>
            {order.deliveryPhone ? (
              <a
                href={`tel:${order.deliveryPhone}`}
                className="mt-1 inline-flex text-sm text-amber-700 hover:text-amber-900"
              >
                {order.deliveryPhone}
              </a>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">Not provided</p>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 sm:px-6">
              <h2 className="text-sm font-semibold text-zinc-900">
                {items.length} {items.length === 1 ? "product" : "products"}{" "}
                from {order.shopName}
              </h2>
              <p className="text-xs text-zinc-500">
                {order.totalQuantity}{" "}
                {order.totalQuantity === 1 ? "unit" : "units"} in total
              </p>
            </div>

            <ul className="divide-y divide-zinc-100">
              {items.map((item) => (
                <ShopOrderItemRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-zinc-500">
            This order has no items from your shop.
          </p>
        )}

        {/* Totals — the shop's share only. */}
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">
              Your payout for this order
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatPrice(order.shopAmount)}
            </p>
          </div>
        </div>
      </div>

      {action ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          {action}
        </div>
      ) : null}

      <Link
        href={`/user/shop-orders${order.shopId ? `?shopId=${order.shopId}` : ""}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900"
      >
        ← Back to all orders
      </Link>
    </div>
  );
}
