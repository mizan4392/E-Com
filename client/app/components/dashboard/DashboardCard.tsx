"use client";

/**
 * Titled panel for a dashboard section.
 *
 * Every block on the dashboard is this same card, which is what keeps the page
 * looking like one surface instead of a stack of differently-styled boxes.
 * The heading is a real `h2` with an `id` so each panel is a named landmark
 * rather than a decorative div.
 */
export type DashboardCardProps = {
  title: string;
  description?: string;
  /** Controls rendered on the right of the header row. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Denser padding, for panels that only wrap a list. */
  compact?: boolean;
};

export default function DashboardCard({
  title,
  description,
  action,
  children,
  className = "",
  compact = false,
}: DashboardCardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      <header
        className={`flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 ${
          compact ? "px-4 py-3" : "px-4 py-4 sm:px-5 sm:py-4"
        }`}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div className={compact ? "p-4" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}
