import { cn } from "@/lib/cn";

/**
 * Loading placeholder shaped like the table it replaces.
 *
 * The shapes mirror `DataTable`'s real layout — same column widths, same row
 * height — because a generic centred spinner makes the page jump when the
 * data lands. Anything that does not occupy roughly the final height also
 * causes a scroll-position jump, since the footer appears late.
 *
 * `aria-hidden` plus a `role="status"` wrapper: a screen reader should be told
 * the table is loading once, not read fifteen placeholder cells.
 */
export default function TableSkeleton({
  rows = 6,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div
        aria-hidden="true"
        className={cn("hidden overflow-hidden md:block", className)}
      >
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} scope="col" className="px-4 py-3">
                  <span className="block h-3 w-20 animate-pulse rounded bg-slate-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className="border-t border-slate-200">
                {Array.from({ length: columns }, (_, c) => (
                  <td key={c} className="px-4 py-3">
                    <span className="block h-4 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card-shaped skeletons below md, matching the mobile presentation. */}
      <div aria-hidden="true" className={cn("space-y-3 md:hidden", className)}>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="block h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              <span className="block h-3 w-full animate-pulse rounded bg-slate-100" />
              <span className="block h-3 w-4/5 animate-pulse rounded bg-slate-100" />
              <span className="block h-3 w-3/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}