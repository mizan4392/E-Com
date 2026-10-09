import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import OrderItemThumb from "./OrderItemThumb";
import {
  deliveryStatusLabel,
  type AdminOrderItem,
  type DeliveryStatus,
} from "./orders.types";

/**
 * Line items of one order.
 *
 * A real `<table>` on desktop and stacked rows below `md`. The mobile layout is
 * a grid rather than a label/value list because each line already reads like a
 * card: image, name, price, quantity, total. Re-labelling them per field on a
 * phone is noise when the values are self-evident.
 *
 * The item's **name and price come from the order's snapshot**, not from the
 * live product, so an order placed before a price rise still shows what the
 * customer actually paid.
 */
export default function OrderItemsList({ items }: { items: readonly AdminOrderItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-slate-500">
        This order has no line items.
      </p>
    );
  }

  // Constant across rows, so it is computed once rather than per `<tr>`.
  // A multi-shop basket shows a Shop column; a single-shop order does not, so
  // the header and every row must agree on whether it exists.
  const hasShopColumn = items.some((item) => item.shopName);

  return (
    <>
      {/* ---------- Desktop ---------- */}
      {/* `relative` keeps the absolutely-positioned `sr-only` caption inside this
          scroll container. Without it the caption resolves against the viewport
          and forces the whole page to scroll sideways. See DataTable. */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Items in this order</caption>
          <thead className="border-b border-slate-200 text-slate-600">
            <tr>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Product
              </th>
              {hasShopColumn ? (
                <th scope="col" className="px-2 py-2.5 font-medium">
                  Shop
                </th>
              ) : null}
              <th scope="col" className="px-2 py-2.5 font-medium">
                Delivery
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">
                Unit price
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">
                Qty
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="px-2 py-3 text-left font-normal">
                  <ProductCell item={item} />
                </th>
                {hasShopColumn ? (
                  <td className="px-2 py-3 text-slate-600">
                    {item.shopName ?? "—"}
                  </td>
                ) : null}
                <td className="px-2 py-3">
                  <StatusBadge
                    tone={toneForDelivery(item.deliveryStatus)}
                    label={deliveryStatusLabel(item.deliveryStatus)}
                  />
                </td>
                <td className="px-2 py-3 text-right tabular-nums text-slate-700">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-2 py-3 text-right tabular-nums text-slate-700">
                  {item.quantity}
                </td>
                <td className="px-2 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile ---------- */}
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 p-3"
          >
            <div className="flex gap-3">
              <OrderItemThumb src={item.imageUrl} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                {item.shopName ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{item.shopName}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    tone={toneForDelivery(item.deliveryStatus)}
                    label={deliveryStatusLabel(item.deliveryStatus)}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-3 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
              <div>
                <dt className="inline text-slate-500">Unit </dt>
                <dd className="inline tabular-nums text-slate-700">
                  {formatCurrency(item.unitPrice)}
                </dd>
                <dt className="ml-3 inline text-slate-500">Qty </dt>
                <dd className="inline tabular-nums text-slate-700">{item.quantity}</dd>
              </div>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(item.lineTotal)}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Image + name, shared by both layouts. */
function ProductCell({ item }: { item: AdminOrderItem }) {
  return (
    <div className="flex items-center gap-3">
      <OrderItemThumb src={item.imageUrl} />
      <span className="min-w-0 font-medium text-slate-900">{item.productName}</span>
    </div>
  );
}

/**
 * Delivery status → badge tone.
 *
 * Mirrors {@link toneForStatus} in `OrderCard`: the two are different concerns
 * (payment vs. fulfilment) but share one tone vocabulary, so both live in the
 * orders feature rather than leaking colour knowledge into the UI kit.
 *
 * Only the terminal states get the unambiguous tones; the in-flight stages are
 * all `info`/`purple`, because colouring five mid-states five different ways
 * would imply a distinction that is not there.
 */
export function toneForDelivery(status: DeliveryStatus): BadgeTone {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "PENDING":
      return "neutral";
    case "CONFIRMED":
      return "purple";
    case "PROCESSING":
    case "SHIPPED":
      return "info";
  }
}
