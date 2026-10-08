import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** One column of a {@link ResponsiveTable}. */
export interface TableColumn<Row> {
  /** Stable key, also used for the mobile card's label. */
  readonly key: string;
  readonly header: string;
  readonly render: (row: Row) => ReactNode;
  /**
   * On mobile the first column with `primary` becomes the card's title line
   * and is not repeated in the labelled list beneath it. Without this the
   * name would appear twice in the same card.
   */
  readonly primary?: boolean;
  readonly numeric?: boolean;
}

/**
 * A table that becomes a stack of cards below `md`.
 *
 * Three options exist for small screens and this is the least brittle:
 *
 * 1. Horizontal scroll — keeps the table but hides data off-screen, and on a
 *    360px phone a five-column table means most of it is unreachable.
 * 2. Hiding columns — silently drops data the user came for.
 * 3. Stacking — every value stays visible, laid out as label/value pairs.
 *
 * This uses (3). The `<table>` itself stays in the DOM at all widths and is
 * hidden with `hidden md:table`, so the markup remains semantic for screen
 * readers and for the desktop layout; the card list is an additional mobile
 * presentation rather than a replacement.
 *
 * @param columns Column definitions; the row type is inferred from `rows`.
 * @param rows    Data. An empty array renders {@link emptyState}.
 */
export default function ResponsiveTable<Row extends { id: string }>({
  caption,
  columns,
  rows,
  emptyState = "Nothing to show yet.",
  rowActions,
}: {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  emptyState?: string;
  /** Rendered in the trailing actions cell / mobile card button. */
  rowActions?: (row: Row) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        {emptyState}
      </p>
    );
  }

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const secondary = columns.filter((column) => column !== primary);

  return (
    <>
      {/* ---------- Desktop: real table (md and up) ---------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-3 py-3 font-medium",
                    column.numeric && "text-right",
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? (
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-3 align-top",
                      column.primary && "font-medium text-slate-900",
                      column.numeric && "text-right tabular-nums",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-3 py-3 text-right">{rowActions(row)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: stacked cards (below md) ---------- */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-slate-900">{primary.render(row)}</p>
            <dl className="mt-3 space-y-2">
              {secondary.map((column) => (
                <div
                  key={column.key}
                  className="flex items-baseline justify-between gap-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm text-slate-700">
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
            {rowActions ? (
              <div className="mt-4 flex justify-end">{rowActions(row)}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
