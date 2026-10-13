"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  type ProductStatusTabValue,
  type ProductStatusCounts,
} from "./products.types";

/**
 * Status filter tabs for the admin products list, each showing its count.
 *
 * Rendered as a `role="tablist"` of `<button>` elements. Each tab calls
 * `onStatusChange`, which the caller wires to a client-side `router.push` —
 * so switching tabs streams fresh rows into the already-painted table instead
 * of tearing the page down and re-running the Server Component, which is what
 * caused the login flash on the orders page.
 *
 * @param counts   `undefined` while loading, a `{ ALL, ACTIVE, PAUSED }` tally otherwise.
 * @param activeStatus  The currently selected status, or `undefined` for "all".
 * @param onStatusChange  Called with the clicked tab's value.
 */
export default function ProductStatusTabs({
  counts,
  activeStatus,
  onStatusChange,
  className,
}: {
  counts: ProductStatusCounts | undefined;
  activeStatus: string | undefined;
  onStatusChange: (status: ProductStatusTabValue) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const tabs: ProductStatusTabValue[] = ["ALL", ...PRODUCT_STATUSES];

  /** Roving focus: arrows move and activate, matching native tab semantics. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    const current = tabs.indexOf(
      (event.target as HTMLElement).getAttribute(
        "data-status",
      ) as ProductStatusTabValue,
    );
    if (current === -1) return;

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(current + offset + tabs.length) % tabs.length];

    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-status="${next}"]`)
      ?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter products by status"
      ref={listRef}
      onKeyDown={onKeyDown}
      className={cn(
        "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1",
        " [scrollbar-width:thin]",
        className,
      )}
    >
      {tabs.map((status) => {
        const isActive = status === (activeStatus ?? "ALL");
        const count = counts?.[status];

        return (
          <button
            key={status}
            type="button"
            data-status={status}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onStatusChange(status)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span>
              {status === "ALL" ? "All" : PRODUCT_STATUS_LABELS[status]}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {count === undefined ? "–" : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
