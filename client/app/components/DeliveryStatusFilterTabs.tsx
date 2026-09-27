"use client";

import type { DeliveryStatusFilter } from "../../types/order";
import {
  DELIVERY_FILTERS,
  getDeliveryFilterLabel,
  getDeliveryStatusMeta,
} from "../../util/delivery";

type Props = {
  value: DeliveryStatusFilter;
  onChange: (value: DeliveryStatusFilter) => void;
  /** Optional counts keyed by status, rendered as superscript badges. */
  counts?: Partial<Record<DeliveryStatusFilter, number>>;
  /** Optional "New only" toggle value. */
  newOnly?: boolean;
  onNewOnlyChange?: (value: boolean) => void;
};

const FILTERS = DELIVERY_FILTERS;

/**
 * Fulfils the same role as the buyer-facing `OrderStatusFilterTabs` but over
 * the seller's `DeliveryStatus` ladder, plus a "New only" toggle for the
 * unread subset.
 */
export default function DeliveryStatusFilterTabs({
  value,
  onChange,
  counts,
  newOnly = false,
  onNewOnlyChange,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Filter orders by delivery status"
    >
      {onNewOnlyChange ? (
        <button
          type="button"
          aria-pressed={newOnly}
          onClick={() => onNewOnlyChange(!newOnly)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
            newOnly
              ? "border-red-500 bg-red-500 text-white"
              : "border-red-200 bg-red-50 text-red-600 hover:border-red-300"
          }`}
        >
          <span aria-hidden>🆕</span>
          New only
        </button>
      ) : null}

      {FILTERS.map((filter) => {
        const isActive = filter === value;
        const meta = filter === "ALL" ? null : getDeliveryStatusMeta(filter);
        const count = counts?.[filter];

        return (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {meta ? <span aria-hidden>{meta.icon}</span> : null}
            {getDeliveryFilterLabel(filter as DeliveryStatusFilter)}
            {typeof count === "number" ? (
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  isActive ? "bg-white/20" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
