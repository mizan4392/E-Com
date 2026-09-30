import type { AnalyticsGranularity } from "../types/analytics";

/**
 * Formatting and range-preset helpers for the seller dashboard.
 *
 * Kept out of the components so the same money/date rules apply to the KPI
 * cards, the chart tooltip, the axis and the top-products table. When a new
 * dashboard surface is added it should import from here rather than
 * re-deriving formatting.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * A named reporting window.
 *
 * The label is user-facing copy; `days` drives the window the server is asked
 * for. Granularity is bundled in because a "last 7 days" view is always daily
 * and a "last 12 months" view is always monthly — pairing them freely would
 * allow a chart with a single bucket.
 *
 * `days` is OPTIONAL and its absence is meaningful: a preset without it is
 * unbounded and starts at the shop's own `createdAt`. That is how "All time"
 * is expressed without hardcoding a "5 years" guess.
 */
export type AnalyticsRangePreset = {
  id: string;
  label: string;
  /** How many days back the window starts, inclusive of today. Omit for "all time". */
  days?: number;
  granularity: AnalyticsGranularity;
};

/**
 * Preset windows offered in the dashboard's range filter.
 *
 * Each one is a sensible (range, granularity) pair — see the note above.
 */
export const ANALYTICS_RANGE_PRESETS: readonly AnalyticsRangePreset[] = [
  { id: "7d", label: "Last 7 days", days: 7, granularity: "day" },
  { id: "30d", label: "Last 30 days", days: 30, granularity: "day" },
  { id: "90d", label: "Last 90 days", days: 90, granularity: "day" },
  { id: "12m", label: "Last 12 months", days: 365, granularity: "month" },
  { id: "all", label: "All time", granularity: "month" },
];

export const DEFAULT_RANGE_PRESET_ID = "30d";

/**
 * Day granularity is capped at 90 days by the presets above; monthly is
 * naturally bounded by the shop's age. The server additionally rejects any
 * window that would exceed `MAX_ANALYTICS_BUCKETS` so a hand-crafted
 * `?from=1970-01-01&granularity=day` cannot be used to pull a huge response.
 */
export const MAX_ANALYTICS_BUCKETS = 400;

export function getRangePreset(presetId: string): AnalyticsRangePreset {
  return (
    ANALYTICS_RANGE_PRESETS.find((preset) => preset.id === presetId) ??
    ANALYTICS_RANGE_PRESETS[2]
  );
}

/** `YYYY-MM-DD` for a date, using UTC so it never slips a day. */
export function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

/**
 * Resolves a preset to the `from`/`to` pair to request.
 *
 * `today` is injectable so tests and server-rendered callers can pin it; the
 * dashboard passes nothing and gets the current day.
 *
 * Both bounds are UTC calendar days. Using UTC on both sides means the window
 * matches the server's `date_trunc(..., 'UTC')` bucketing exactly, so a sale
 * at 23:30 local time cannot land in the wrong bucket.
 *
 * Returns `from: undefined` for an unbounded ("All time") preset — the server
 * then starts the window at the shop's `createdAt`, which is the only place
 * that knows when selling began.
 */
export function resolvePresetRange(
  preset: AnalyticsRangePreset,
  today: Date = new Date(),
): { from?: string; to: string } {
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  if (preset.days === undefined) {
    return { to: toIsoDate(end) };
  }

  const start = new Date(end.getTime() - (preset.days - 1) * MS_PER_DAY);

  return { from: toIsoDate(start), to: toIsoDate(end) };
}

/**
 * Formats money for display.
 *
 * Deliberately NOT `formatPrice` from `util/functions.ts`: that one rounds to
 * whole units for catalogue display, but earnings need cents to be credible.
 * Whole-unit rounding would make a $0.50 sale read as "$1" on the dashboard.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "usd",
): string {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Compact money for chart axes, where a full `$1,234,567.89` label would
 * collide with its neighbours.
 */
export function formatCompactCurrency(
  amount: number | null | undefined,
  currency: string = "usd",
): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return formatCurrency(0, currency);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Plain number with thousands separators; used for units and order counts. */
export function formatCount(value: number | null | undefined): string {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(parsed) ? parsed : 0,
  );
}

/**
 * Percentage change, or `null` when there is no prior period to compare to.
 *
 * Returns `null` (rather than 0 or Infinity) when the previous value is 0 —
 * "up from nothing" is not a meaningful growth rate, and the UI renders it as
 * a neutral "no comparison" instead of a misleading +100%.
 */
export function percentageChange(
  current: number,
  previous: number,
): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;

  return ((current - previous) / previous) * 100;
}

/** `+12.4%` / `-3.1%`, with a neutral dash when there is no comparison. */
export function formatPercentage(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";

  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

/** Picks the trend colour class from a signed change value. */
export function getTrendClass(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value === 0) {
    return "text-zinc-500";
  }
  return value > 0 ? "text-emerald-600" : "text-red-600";
}

/** Inclusive human range label, e.g. `Mar 5 – Apr 3, 2026`. */
export function formatRangeLabel(from: string, to: string): string {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return `${from} – ${to}`;

  const startLabel = `${MONTH_LABELS[start.getUTCMonth()]} ${start.getUTCDate()}`;
  const endLabel = `${MONTH_LABELS[end.getUTCMonth()]} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;

  return `${startLabel} – ${endLabel}`;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
