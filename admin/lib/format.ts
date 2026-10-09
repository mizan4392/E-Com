/**
 * Shared `Intl` formatters for the admin app.
 *
 * Prices and dates were previously inlined per page (`$${amount}`, `.toLocaleDateString()`),
 * which meant the same order total could render two different ways on two
 * screens and that every call site silently picked up the browser's locale.
 *
 * The formatters are constructed **once** at module scope. `Intl.DateTimeFormat`
 * and `Intl.NumberFormat` are expensive to build relative to how often a list
 * page formats dozens of rows, and reusing the instance is the documented
 * pattern. Constructing them per call is the single most common performance
 * mistake with `Intl`.
 */

/**
 * Currency codes we actually store. Anything else falls back to a neutral
 * numeric format rather than throwing on an unknown code.
 */
const CURRENCY_DEFAULT = "USD";

/**
 * Uppercase ISO code (the DB stores `usd`), used as the `Intl` currency.
 * Unknown codes would make `Intl.NumberFormat` throw, so they degrade to
 * `undefined`, which formats the amount without a symbol.
 */
function toCurrencyCode(currency: string | null | undefined): string | undefined {
  if (!currency) return CURRENCY_DEFAULT;
  const upper = currency.toUpperCase();
  if (upper.length !== 3) return undefined;
  return upper;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats a monetary amount, e.g. `formatCurrency(1234.5, "usd")` → `$1,234.50`.
 *
 * Amounts arrive from the API as numbers (`decimal` columns are coerced in the
 * service mapper), so there is no string-parsing to defend against here.
 */
export function formatCurrency(
  amount: number,
  currency?: string | null,
): string {
  const code = toCurrencyCode(currency);
  const key = code ?? "none";

  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", {
      style: code ? "currency" : "decimal",
      ...(code ? { currency: code } : {}),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatterCache.set(key, formatter);
  }

  // Guard against a non-finite value reaching `Intl`, which throws a
  // RangeError on NaN/Infinity and would take the whole page down.
  return formatter.format(Number.isFinite(amount) ? amount : 0);
}

/** `en-GB` + explicit `UTC` so a server render and a client render agree. */
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const DATE_ONLY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Parses an API timestamp into a `Date`, or `null` when it is unusable.
 *
 * `new Date(string)` returns an Invalid Date rather than throwing for garbage,
 * and every `Intl` formatter then throws `RangeError: Invalid time value` —
 * which is how one bad row turns into a blank page. Checking explicitly keeps
 * a single malformed value local.
 */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `10 Jan 2026` — used where the time of day is noise. */
export function formatDate(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_ONLY_FORMAT.format(date) : "—";
}

/** `10 Jan 2026, 14:30` — used in order detail and tooltips. */
export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_TIME_FORMAT.format(date) : "—";
}

/**
 * `today` / `3 days ago` / `2 months ago`.
 *
 * Built on `Intl.RelativeTimeFormat`. Returns an absolute date for anything
 * older than a year, because "11 months ago" is less useful than the date when
 * reviewing order history.
 */
const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en-GB", {
  numeric: "auto",
});

export function formatRelative(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";

  const delta = date.getTime() - Date.now();
  const absolute = Math.abs(delta);

  // Past a year the relative form stops helping; show the date instead.
  if (absolute > RELATIVE_UNITS[0][1]) return DATE_ONLY_FORMAT.format(date);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (absolute >= ms) {
      return RELATIVE_FORMAT.format(Math.round(delta / ms), unit);
    }
  }

  return "just now";
}

/** `3 items` / `1 item` — avoids shipping the plural `s` into components. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}