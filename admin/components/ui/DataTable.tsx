import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** One column of a {@link DataTable}. */
export interface DataTableColumn<Row> {
  /** Stable key; also the `key` on the `<th>`/`<td>`. */
  readonly key: string;
  /**
   * Column heading. `ReactNode` rather than `string` so a column can render a
   * visually-hidden label — an icon-only "Actions" column still needs real text
   * for a screen reader, and `sr-only` is the standard way to supply it.
   */
  readonly header: ReactNode;
  readonly render: (row: Row) => ReactNode;
  /** Right-aligns the column and switches cells to tabular figures. */
  readonly numeric?: boolean;
  /**
   * Extra classes on every `<th>`/`<td>` in the column — for width constraints
   * such as `w-[10%]`, which cannot be expressed with alignment utilities.
   */
  readonly className?: string;
}

/**
 * Generic responsive data table: real `<table>` on `md` and up, cards below.
 *
 * Extends the idea in `components/layout/ResponsiveTable` with the piece that
 * page needed and it lacked: `renderMobileCard`. Label/value stacking is the
 * right default for a simple catalogue, but an order row has an awkward shape
 * (a name **and** an email under one "Customer" heading, a badge next to a
 * total, a primary action) that no amount of generic label/value pairing
 * renders well. Handing the caller the whole card lets them design it.
 *
 * Both presentations stay in the DOM at all widths — the table is hidden with
 * `hidden md:table`, not unmounted — so the markup stays semantic for screen
 * readers and for the desktop layout.
 *
 * @param renderMobileCard Omit to fall back to label/value stacking.
 */
export default function DataTable<Row extends { id: string }>({
  caption,
  columns,
  rows,
  renderMobileCard,
  className,
}: {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  renderMobileCard?: (row: Row) => ReactNode;
  className?: string;
}) {
  return (
    <>
      {/* ---------- Desktop: real table (md and up) ---------- */}
      {/*
       * `relative` is load-bearing, not decoration. A column header may be an
       * `sr-only` span, which Tailwind positions absolutely. Without a
       * positioned ancestor here, such a span resolves against the viewport
       * rather than this box, so `overflow-x-auto` no longer clips it: it
       * lands past the page edge and the whole document scrolls sideways.
       * Making this the containing block puts the span back inside the scroll
       * container, where the table's own overflow handles it.
       */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className={cn("w-full min-w-[46rem] text-left text-sm", className)}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-medium",
                    column.numeric && "text-right",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-200 transition-colors hover:bg-slate-50/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      column.numeric && "text-right tabular-nums",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: cards (below md) ---------- */}
      <div className={cn("space-y-3 md:hidden")}>
        {rows.map((row) =>
          renderMobileCard ? (
            <div key={row.id}>{renderMobileCard(row)}</div>
          ) : (
            <MobileFallbackCard key={row.id} columns={columns} row={row} />
          ),
        )}
      </div>
    </>
  );
}

/** Default label/value stack, used when no `renderMobileCard` is supplied. */
function MobileFallbackCard<Row extends { id: string }>({
  columns,
  row,
}: {
  columns: readonly DataTableColumn<Row>[];
  row: Row;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dl className="space-y-2">
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {column.header}
            </dt>
            <dd
              className={cn(
                "min-w-0 break-words text-right text-sm text-slate-700",
                column.numeric && "tabular-nums",
              )}
            >
              {column.render(row)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}