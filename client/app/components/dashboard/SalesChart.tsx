"use client";

import {
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AnalyticsMetric,
  AnalyticsSeriesPoint,
} from "../../../types/analytics";
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
} from "../../../util/analytics";

/**
 * Sales-over-time chart.
 *
 * Renders revenue as an area-ish line and units as bars on a second Y axis.
 * Two axes rather than one because the magnitudes are unrelated (dollars vs.
 * item counts) and a shared scale would flatten one of them to a flat line.
 *
 * A `"use client"` boundary is required because Recharts measures the DOM
 * (ResponsiveContainer uses ResizeObserver) and cannot render on the server.
 */
export type SalesChartProps = {
  data: AnalyticsSeriesPoint[];
  metric: AnalyticsMetric;
  currency: string;
  isLoading?: boolean;
  /** Shown instead of the chart when there is nothing to plot. */
  emptyMessage?: string;
};

const CHART_HEIGHT = 300;
const MOBILE_CHART_HEIGHT = 220;

export default function SalesChart({
  data,
  metric,
  currency,
  isLoading = false,
  emptyMessage = "No sales in this period yet.",
}: SalesChartProps) {
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white"
        style={{ height: CHART_HEIGHT }}
      >
        <div
          className="h-32 w-full animate-pulse rounded-xl bg-zinc-100"
          aria-hidden="true"
        />
      </div>
    );
  }

  // An empty series means either no sales at all, or a window the server
  // could not resolve. Either way an axis with no data is just a blank box,
  // so say why instead.
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center text-sm text-zinc-500"
        style={{ minHeight: CHART_HEIGHT }}
      >
        {emptyMessage}
      </div>
    );
  }

  const isRevenue = metric === "revenue";

  return (
    <div
      className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
      style={{ height: CHART_HEIGHT }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: CHART_HEIGHT }}
      >
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e4e7"
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            minTickGap={16}
            interval="preserveStartEnd"
          />

          <YAxis
            yAxisId="revenue"
            orientation="left"
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickFormatter={(value: number) =>
              formatCompactCurrency(value, currency)
            }
            tickLine={false}
            axisLine={false}
            width={58}
          />

          {/* Second axis: only mounted when a metric is active, so an
              unmounted axis never reserves width and squeezes the plot. */}
          {isRevenue ? null : (
            <YAxis
              yAxisId="units"
              orientation="right"
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickFormatter={(value: number) => formatCount(value)}
              tickLine={false}
              axisLine={false}
              width={44}
            />
          )}

          <Tooltip
            cursor={{ stroke: "#a1a1aa", strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              const point = payload[0].payload as AnalyticsSeriesPoint;

              return (
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-zinc-900">{label}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Earnings:{" "}
                    <span className="font-semibold text-zinc-900">
                      {formatCurrency(point.revenue, currency)}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-600">
                    Units sold:{" "}
                    <span className="font-semibold text-zinc-900">
                      {formatCount(point.unitsSold)}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-600">
                    Orders:{" "}
                    <span className="font-semibold text-zinc-900">
                      {formatCount(point.orders)}
                    </span>
                  </p>
                </div>
              );
            }}
          />

          {/* Always plotted, but the non-active series is faded so the
              selected metric stays visually dominant. */}
          <Bar
            yAxisId="units"
            dataKey="unitsSold"
            fill="#e4e4e7"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            hide={isRevenue}
          />

          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke={isRevenue ? "#f59e0b" : "#d4d4d8"}
            strokeWidth={2.5}
            fill="url(#salesLineFill)"
            dot={false}
            activeDot={{ r: 4 }}
            hide={!isRevenue}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
