"use client";

import {
  ANALYTICS_RANGE_PRESETS,
  type AnalyticsRangePreset,
} from "../../../util/analytics";
import type { AnalyticsMetric } from "../../../types/analytics";

/**
 * The dashboard's two filter controls, side by side.
 *
 * Both are grouped in a `<fieldset>` because they are a single conceptual unit
 * ("what slice of time am I looking at, and as what metric") and screen
 * readers benefit from the group label.
 *
 * The metric toggle only switches which series is plotted — it does NOT
 * refetch, because both metrics arrive in the same `series` payload. The range
 * does refetch, since it changes the query key.
 */
export type AnalyticsFilterBarProps = {
  presetId: string;
  onPresetChange: (preset: AnalyticsRangePreset) => void;
  metric: AnalyticsMetric;
  onMetricChange: (metric: AnalyticsMetric) => void;
  /** Echoes the range the server resolved, e.g. `Mar 5 – Apr 3, 2026`. */
  resolvedRangeLabel?: string;
  className?: string;
};

export default function AnalyticsFilterBar({
  presetId,
  onPresetChange,
  metric,
  onMetricChange,
  resolvedRangeLabel,
  className = "",
}: AnalyticsFilterBarProps) {
  return (
    <fieldset className={className}>
      <legend className="sr-only">Filter dashboard data</legend>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Range: horizontally scrollable on narrow screens rather than
            wrapping, so the control row keeps a predictable height. */}
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:flex-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {ANALYTICS_RANGE_PRESETS.map((preset) => {
            const isActive = preset.id === presetId;

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onPresetChange(preset)}
                className={`shrink-0 snap-start cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Metric toggle — presentational, no network cost. */}
        <div
          className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1"
          role="group"
          aria-label="Chart metric"
        >
          {(
            [
              { id: "revenue", label: "Earnings" },
              { id: "unitsSold", label: "Units sold" },
            ] as const
          ).map((option) => {
            const isActive = metric === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onMetricChange(option.id)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  isActive
                    ? "bg-amber-100 text-amber-800"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {resolvedRangeLabel ? (
        <p className="mt-2 text-xs text-zinc-500">
          Showing {resolvedRangeLabel}
        </p>
      ) : null}
    </fieldset>
  );
}
