import { Card } from "@/components/layout/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";

/**
 * Orders-page placeholder: tabs, filter bar and table.
 *
 * Split into {@link OrdersBodySkeleton} and {@link OrdersPageSkeleton} because
 * the two consumers need different amounts of it. `loading.tsx` is the whole
 * route and must supply the header placeholder too; the `<Suspense>` fallback
 * inside `page.tsx` renders under a header that has *already painted*, so
 * drawing a second one would push the content down and then yank it back up.
 *
 * Sized to 8 rows: enough to fill a typical viewport at 20/page, and not so tall
 * that the skeleton is taller than the real table on a phone.
 */
export function OrdersBodySkeleton() {
  return (
    <>
      {/* Stands in for the status tabs and the filter bar. */}
      <div className="mb-4 space-y-4" aria-hidden="true">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <Card className="overflow-hidden p-0">
        <TableSkeleton rows={8} />
      </Card>
    </>
  );
}

/**
 * Whole-route placeholder for `loading.tsx`, including the page container and
 * a header shaped like `PageHeader`'s.
 */
export default function OrdersPageSkeleton() {
  return (
    <>
      {/* Header placeholder — mirrors `PageHeader`'s spacing so the content
          below does not shift when the real heading appears. */}
      <div className="mb-6" aria-hidden="true">
        <div className="h-3 w-16 animate-pulse rounded bg-indigo-100" />
        <div className="mt-2 h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <OrdersBodySkeleton />

      {/* One announcement, rather than fifteen placeholder cells. */}
      <p role="status" aria-live="polite" className="sr-only">
        Loading orders…
      </p>
    </>
  );
}
