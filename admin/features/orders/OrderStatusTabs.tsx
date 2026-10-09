"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatusCounts,
} from "./orders.types";

/**
 * Status filter tabs, each showing its count from `status-counts`.
 *
 * ## Counts describe the *other* filters, not the tab
 *
 * `status-counts` is called with the shop/date filters but **not** `status`, so
 * `PENDING: 12` next to a search box means "12 pending orders match your
 * search", not "12 pending orders exist". Tallying the selected status into its
 * own badge would leave every unselected tab reading `0`.
 *
 * ## Keyboard behaviour
 *
 * Rendered as a `role="tablist"`. The tabs are real links (`<a href>`) rather
 * than buttons, because each one is a distinct URL: middle-click, open in new
 * tab and "copy link address" all do the obvious thing, and no `onClick` is
 * needed to keep them in sync with the URL. `ArrowLeft`/`ArrowRight` move
 * between them, which is the expected interaction for a tablist.
 */
export default function OrderStatusTabs({
  counts,
  activeStatus,
  hrefFor,
  className,
}: {
  counts: OrderStatusCounts | undefined;
  activeStatus: string | undefined;
  /** Builds the href for a given status; the caller owns URL construction. */
  hrefFor: (status: OrderStatusTabValue) => string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const tabs: OrderStatusTabValue[] = ["ALL", ...ORDER_STATUSES];

  /** Roving focus: arrows move and activate, matching native tab semantics. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    const current = tabs.indexOf(
      (event.target as HTMLElement).getAttribute("data-status") as OrderStatusTabValue,
    );
    if (current === -1) return;

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(current + offset + tabs.length) % tabs.length];

    listRef.current
      ?.querySelector<HTMLAnchorElement>(`[data-status="${next}"]`)
      ?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter orders by status"
      ref={listRef}
      onKeyDown={onKeyDown}
      className={cn(
        // The tabs never wrap: wrapping makes the row jump to a new height
        // whenever a count changes digit width. Scrolling keeps the bar a
        // stable, predictable strip on a phone.
        "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1",
        " [scrollbar-width:thin]",
        className,
      )}
    >
      {tabs.map((status) => {
        const isActive = status === (activeStatus ?? "ALL");
        const count = counts?.[status];

        return (
          <a
            key={status}
            href={hrefFor(status)}
            // `aria-current="page"` rather than `aria-selected`: these are
            // links to different URLs, so "current page" is the honest
            // description of the active one.
            aria-current={isActive ? "page" : undefined}
            data-status={status}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span>{status === "ALL" ? "All" : ORDER_STATUS_LABELS[status]}</span>

            {/* The badge is `aria-hidden` because the tab's accessible name is
                already the status label; announcing "Pending, 12" then again
                as a separate node is noise. */}
            <span
              aria-hidden="true"
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {/* `counts` is undefined while loading; a dash is a clearer
                  placeholder than a `0` that reads as "none exist". */}
              {count === undefined ? "–" : count}
            </span>
          </a>
        );
      })}
    </div>
  );
}

export type OrderStatusTabValue = (typeof ORDER_STATUSES)[number] | "ALL";
