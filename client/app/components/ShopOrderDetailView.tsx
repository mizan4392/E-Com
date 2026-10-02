"use client";

import Link from "next/link";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import ShopOrderProducts from "./ShopOrderProducts";
import { formatPrice } from "../../util/functions";
import { formatOrderDate, formatOrderId } from "../../util/order";
import { getDeliveryStatusMeta } from "../../util/delivery";
import type { ShopOrder } from "../../types/order";

type Props = {
  order: ShopOrder;
  /** Rendered under the totals, e.g. the order-level status control. */
  action?: React.ReactNode;
};

/**
 * Full order breakdown for the seller: header, buyer, delivery details, the
 * products behind an expand toggle, and the shop's own subtotal.
 *
 * Order-centric by design. The seller acts on the ORDER — one status, one
 * button — and the products are detail revealed on demand, so a two-product
 * order reads as one thing to fulfil rather than two competing obligations.
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

        <ShopOrderProducts
          items={items}
          shopName={order.shopName}
          totalQuantity={order.totalQuantity}
        />

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
