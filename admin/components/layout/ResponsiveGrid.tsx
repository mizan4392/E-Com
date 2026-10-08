import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * Responsive grid whose column count is decided by one prop.
 *
 * The dashboard stat cards and the shortcut tiles both need "one on mobile,
 * more when there is room", and both were hand-writing the same breakpoint
 * ladder. Naming the intent (`cols="stat"`) keeps the decision in one place:
 *
 * - `stat`   1 → 2 (`sm`) → 3 (`lg`)
 * - `tiles`  1 → 2 (`sm`) → 3 (`lg`)
 * - `wide`   1 → 2 (`md`) → 3 (`xl`)
 */
export function ResponsiveGrid({
  cols = "stat",
  children,
  className,
}: {
  cols?: "stat" | "tiles" | "wide";
  children: ReactNode;
  className?: string;
}) {
  const ladders = {
    stat: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    tiles: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    wide: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  } as const;

  return (
    <div className={cn("grid gap-4", ladders[cols], className)}>{children}</div>
  );
}

/** Single stat tile for the dashboard. */
export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}
