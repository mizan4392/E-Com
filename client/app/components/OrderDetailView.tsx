"use client";

import Link from "next/link";
import OrderItemRow from "./OrderItemRow";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatPrice } from "../../util/functions";
import {
  formatOrderDate,
  formatOrderId,
  getOrderStatusMeta,
} from "../../util/order";
import type { Order } from "../../types/order";

type Props = {
  order: Order;
  /** Rendered under the summary, e.g. a "Retry payment" action. */
  action?: React.ReactNode;
};

/**
 * Full order breakdown: header, status, items and totals. Reused by the order
 * detail route and the payment status page so both show identical details.
 */
export default function OrderDetailView({ order, action }: Props) {
  const meta = getOrderStatusMeta(order.status);
  const items = order.items ?? [];
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              {formatOrderId(order.id)}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              Order details
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Placed on {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <OrderStatusBadge status={order.status} />
            <p className="max-w-xs text-xs text-zinc-500 sm:text-right">
              {meta.description}
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 sm:px-6">
              <h2 className="text-sm font-semibold text-zinc-900">
                {items.length} {items.length === 1 ? "product" : "products"}
              </h2>
              <p className="text-xs text-zinc-500">
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in
                total
              </p>
            </div>

            <ul className="divide-y divide-zinc-100">
              {items.map((item, index) => (
                <li key={`${item.productId}-${index}`}>
                  <OrderItemRow item={item} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-zinc-500">
            This order has no items.
          </p>
        )}

        {/* Totals */}
        <dl className="space-y-3 border-t border-zinc-100 p-5 text-sm sm:p-6">
          <div className="flex items-center justify-between text-zinc-600">
            <dt>Subtotal</dt>
            <dd className="font-medium text-zinc-900">
              {formatPrice(order.amountTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-zinc-600">
            <dt>Shipping</dt>
            <dd className="font-medium text-zinc-900">Free</dd>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900">
            <dt>Total</dt>
            <dd>{formatPrice(order.amountTotal)}</dd>
          </div>
        </dl>

        {action ? (
          <div className="border-t border-zinc-100 p-5 sm:p-6">{action}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/user/orders"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          ← Back to orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
