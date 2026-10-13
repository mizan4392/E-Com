import { Card } from "@/components/layout/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";

/**
 * Products-page placeholder: status tabs, filter bar and table.
 *
 * Sized to 8 rows: enough to fill a typical viewport at 20/page, and not so
 * tall that the skeleton is taller than the real table on a phone.
 */
export function ProductsBodySkeleton() {
  return (
    <>
      {/* Stands in for the status tabs and the filter bar. */}
      <div className="mb-4 space-y-4" aria-hidden="true">
        <div className="flex gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              className="h-9 w-20 animate-pulse rounded-lg bg-slate-200"
            />
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

/** Whole-route placeholder for `loading.tsx`. */
export default function ProductsPageSkeleton() {
  return (
    <>
      <div className="mb-6" aria-hidden="true">
        <div className="h-3 w-20 animate-pulse rounded bg-indigo-100" />
        <div className="mt-2 h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <ProductsBodySkeleton />

      <p role="status" aria-live="polite" className="sr-only">
        Loading products…
      </p>
    </>
  );
}
