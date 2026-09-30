"use client";

import type { Shop } from "../../../types/shop";

/**
 * Shop picker for the seller dashboard.
 *
 * The dashboard always shows ONE shop's data, so when an owner runs more than
 * one shop this is how they switch. Defaults to the first shop once the list
 * arrives (handled by the parent), and falls back to a non-interactive
 * message when the owner has no shops at all.
 *
 * A native `<select>` is used deliberately: it is keyboard-accessible, works
 * on mobile with the platform picker, and needs no custom listbox keyboard
 * handling. Styling it consistently is not worth the accessibility cost here.
 */
export type ShopSelectorProps = {
  shops: Shop[];
  value: string;
  onChange: (shopId: string) => void;
  isLoading?: boolean;
  className?: string;
};

export default function ShopSelector({
  shops,
  value,
  onChange,
  isLoading = false,
  className = "",
}: ShopSelectorProps) {
  if (isLoading) {
    return (
      <div
        className={`h-11 w-full animate-pulse rounded-xl bg-zinc-200 sm:w-64 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (shops.length === 0) {
    return (
      <p
        className={`rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 ${className}`}
      >
        You do not own a shop yet. Create one to unlock your dashboard.
      </p>
    );
  }

  return (
    <label className={`block w-full sm:w-64 ${className}`}>
      <span className="sr-only">Select a shop</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
    </label>
  );
}
