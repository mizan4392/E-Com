"use client";

/**
 * Titled wrapper for one of the dashboard's independent data sections.
 *
 * The seller dashboard is deliberately split into sections that refetch on
 * different triggers:
 *
 *  - **All shops** — lifetime totals across every shop the seller owns. These
 *    are the same no matter which shop is selected, so they are cached under
 *    their own query key and are NOT invalidated by a shop switch.
 *  - **This shop** — range-filtered analytics for the selected shop. These DO
 *    change on every shop switch and every filter change.
 *
 * Rendering each as a labelled `<section>` makes that split legible in the
 * DOM and lets the heading own its panel via `aria-labelledby`, so a screen
 * reader can jump between the two rather than hearing one undifferentiated
 * wall of numbers.
 *
 * `action` sits in the heading row — that is where the shop picker belongs, so
 * the control is visibly attached to the data it changes and cannot be
 * mistaken for a global filter.
 */
export type DashboardSectionProps = {
  /** Eyebrow above the title, e.g. "All shops". */
  eyebrow: string;
  title: string;
  description?: string;
  /** Rendered right-aligned in the heading row, e.g. the shop selector. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
}: DashboardSectionProps) {
  return (
    <section
      aria-label={title}
      className={`rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
