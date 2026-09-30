"use client";

import StatCard from "./StatCard";
import type { StatCardProps } from "./StatCard";

/**
 * Responsive grid of `StatCard` tiles.
 *
 * Exists so every KPI surface on the dashboard shares one breakpoint scheme
 * instead of each section hand-rolling its grid. 1 column on phones, 2 from
 * `sm`, 4 from `lg` — which is the point at which four tiles still fit without
 * the value truncating.
 */
export default function StatCardGrid({
  stats,
  className = "",
}: {
  stats: StatCardProps[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 ${className}`}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
