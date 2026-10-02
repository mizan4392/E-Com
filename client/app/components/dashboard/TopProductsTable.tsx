"use client";

import Link from "next/link";

import type { AnalyticsTopProduct } from "../../../types/analytics";
import { formatCount, formatCurrency } from "../../../util/analytics";

/**
 * "Best sellers in period" table.
 *
 * The trailing columns drop to a single stacked block under `sm` because a
 * 4-column table cannot fit a 360px phone without horizontal scrolling, and a
 * scrolling table inside a scrolling page is a poor experience on mobile.
 */
export type TopProductsTableProps = {
  products: AnalyticsTopProduct[];
  currency: string;
  isLoading?: boolean;
  /** Max bars drawn, relative to the best performer. */
  max?: number;
};

export default function TopProductsTable({
  products,
  currency,
  isLoading = false,
  max = 5,
}: TopProductsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-12 w-full animate-pulse rounded-xl bg-zinc-100"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
        No products sold in this period yet.
      </p>
    );
  }

  const leaderRevenue = Math.max(
    ...products.slice(0, max).map((product) => product.revenue),
    0,
  );

  return (
    <ul className="space-y-3">
      {products.slice(0, max).map((product) => {
        // A zero-revenue leader would make every ratio NaN; clamp the
        // denominator so the bar simply renders empty.
        const share = leaderRevenue > 0 ? product.revenue / leaderRevenue : 0;
        const title = product.productId ? (
          <Link
            href={`/product/${product.productId}`}
            className="truncate font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            {product.name}
          </Link>
        ) : (
          <span className="truncate font-medium text-zinc-900">
            {product.name}
            <span className="ml-2 text-xs text-zinc-400">(delisted)</span>
          </span>
        );

        return (
          <li key={product.productId ?? product.name}>
            <div className="flex items-baseline justify-between gap-3">
              {title}
              <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                {formatCurrency(product.revenue, currency)}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${Math.max(share * 100, product.revenue > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                {formatCount(product.unitsSold)} sold
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
