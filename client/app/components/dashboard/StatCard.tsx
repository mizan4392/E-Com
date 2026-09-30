"use client";

/**
 * One KPI tile on the seller dashboard.
 *
 * Deliberately presentational and dependency-free: it takes a value, a label
 * and an optional trend, and knows nothing about where the data came from. That
 * keeps it reusable for any future metric and means the dashboard page only
 * has to describe *what* it wants shown, never *how*.
 *
 * `icon` accepts a pre-drawn node rather than a name so callers can pass
 * whatever SVG suits the metric instead of this file owning an icon set.
 */
export type StatCardProps = {
  label: string;
  value: string;
  /** Small print under the value — e.g. "Across 3 shops". */
  hint?: string;
  /** Signed percentage change; `null` renders a neutral "no comparison" row. */
  change?: number | null;
  /** Label for the trend, e.g. "vs last 30 days". */
  changeLabel?: string;
  icon?: React.ReactNode;
  /** `true` while the value is a placeholder, for the skeleton state. */
  isLoading?: boolean;
  /**
   * Tones the tile. `default` is neutral; `accent` marks the headline metric
   * (earnings) so it reads as primary without needing a different layout.
   */
  tone?: "default" | "accent";
  className?: string;
};

const toneClasses = {
  default: "border-zinc-200 bg-white",
  accent: "border-amber-200 bg-amber-50/60",
};

const iconClasses = {
  default: "bg-zinc-100 text-zinc-600",
  accent: "bg-amber-100 text-amber-700",
};

export default function StatCard({
  label,
  value,
  hint,
  change = null,
  changeLabel,
  icon,
  isLoading = false,
  tone = "default",
  className = "",
}: StatCardProps) {
  const isUp = change !== null && Number.isFinite(change) && change > 0;
  const isDown = change !== null && Number.isFinite(change) && change < 0;
  const trendClass = isUp
    ? "text-emerald-600"
    : isDown
      ? "text-red-600"
      : "text-zinc-500";

  const rounded = change === null ? null : Math.round(change * 10) / 10;
  const trendText =
    rounded === null ? "No comparison" : `${rounded > 0 ? "+" : ""}${rounded}%`;

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-sm transition sm:p-5 ${toneClasses[tone]} ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </p>

        {isLoading ? (
          <div
            className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-zinc-200"
            aria-hidden="true"
          />
        ) : (
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-3xl">
            {value}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${trendClass}`}
          >
            {rounded !== null ? (
              <>
                <span aria-hidden>{isUp ? "▲" : isDown ? "▼" : "•"}</span>
                {trendText}
              </>
            ) : (
              <span className="font-medium">{trendText}</span>
            )}
          </span>
          {changeLabel ? (
            <span className="text-xs text-zinc-500">{changeLabel}</span>
          ) : null}
        </div>

        {hint ? (
          <p className="mt-1 truncate text-xs text-zinc-500" title={hint}>
            {hint}
          </p>
        ) : null}
      </div>

      {icon ? (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4 ${iconClasses[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
    </div>
  );
}
