"use client";

import { useId, useState } from "react";
import StarRating from "./StarRating";
import { formatPrice } from "../../util/functions";
import { formatOrderDate, getAssetUrl } from "../../util/order";
import type { ShopOrderItem } from "../../types/order";

type Props = {
  /** The order's products. Status is deliberately NOT per item. */
  items: ShopOrderItem[];
  /**
   * How many of the seller's shops this order touches. Shown in the toggle so
   * a basket split across shops is obvious before expanding.
   */
  shopCount?: number;
  /** Total units, shown in the toggle. Passed in so it matches the list row. */
  totalQuantity: number;
  /**
   * Start expanded. The detail page opens expanded because the seller arrived
   * there to act on this order; the list uses a collapsed default.
   */
  defaultExpanded?: boolean;
};

/**
 * A product row inside the expand panel.
 *
 * Deliberately NOT a status control: fulfilment is tracked per order, so a
 * product cannot sit at a different stage from its siblings. Showing a badge
 * here would imply the seller can act on it individually, which the API no
 * longer allows.
 */
function ShopOrderProductRow({ item }: { item: ShopOrderItem }) {
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
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-5 sm:px-6">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20">
        {media}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
          {item.name}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {item.shopName ? (
            <>
              Sold by{" "}
              <span className="font-medium text-zinc-700">{item.shopName}</span>
              <span aria-hidden> · </span>
            </>
          ) : null}
          {formatPrice(item.price)} × {item.quantity} ={" "}
          <span className="font-medium text-zinc-700">
            {formatPrice(lineTotal)}
          </span>
        </p>

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
    </li>
  );
}

/**
 * The products inside one order, hidden behind a toggle.
 *
 * An order is the unit a seller thinks in — "ship this", "mark it delivered" —
 * so the order is the row, and the products are detail you reveal on demand.
 * Rendering them inline made a two-product order look like two separate
 * obligations, each demanding its own status update.
 *
 * Uses a real `<button>` with `aria-expanded`/`aria-controls` rather than
 * `<details>` so the toggle can be wired into the page's layout, and so the
 * chevron animation is controllable from React state.
 */
export default function ShopOrderProducts({
  items,
  shopCount = 1,
  totalQuantity,
  defaultExpanded = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const panelId = useId();

  if (items.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-zinc-500">
        This order has no items from your shop.
      </p>
    );
  }

  return (
    <div className="border-t border-zinc-100">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 sm:px-6"
      >
        <span className="text-sm font-semibold text-zinc-900">
          {items.length} {items.length === 1 ? "product" : "products"}
          {shopCount > 1 ? (
            <span className="font-normal text-zinc-500">
              {" "}
              across {shopCount} of your shops
            </span>
          ) : null}
          <span className="ml-2 font-normal text-zinc-500">
            {totalQuantity} {totalQuantity === 1 ? "unit" : "units"}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-500">
          {isExpanded ? "Hide" : "View"}
          <span
            aria-hidden
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </span>
      </button>

      {isExpanded ? (
        <ul
          id={panelId}
          className="divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/40"
        >
          {items.map((item) => (
            <ShopOrderProductRow key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
