"use client";

import type { OrderStatus, OrderStatusFilter } from "../../types/order";
import { getOrderStatusMeta } from "../../util/order";

type Props = {
  value: OrderStatusFilter;
  onChange: (value: OrderStatusFilter) => void;
  /** Optional counts keyed by status, rendered as superscript badges. */
  counts?: Partial<Record<OrderStatusFilter, number>>;
};

const FILTERS: OrderStatusFilter[] = [
  "ALL",
  "PENDING",
  "PAID",
  "PAYMENT_FAILED",
  "CANCELLED",
];

export default function OrderStatusFilterTabs({
  value,
  onChange,
  counts,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Filter orders by status"
    >
      {FILTERS.map((filter) => {
        const isActive = filter === value;
        const meta = filter === "ALL" ? null : getOrderStatusMeta(filter);
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
            {filter === "ALL"
              ? "All orders"
              : getOrderStatusMeta(filter as OrderStatus).label}
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
