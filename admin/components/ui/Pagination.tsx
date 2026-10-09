import { cn } from "@/lib/cn";
import { COMPACT_BUTTON_CLASS } from "@/components/layout/Form";
import { pluralize } from "@/lib/format";

/** Page sizes offered by the list pages. Mirrors the server's cap of 100. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/**
 * Pagination footer: page size, result count, Prev/Next.
 *
 * Built on `<nav>` with an `aria-label` so it is reachable by landmark
 * navigation, and each control is a real `<button>` rather than a styled div,
 * so it is keyboard-operable and announces its disabled state.
 *
 * Buttons are disabled rather than hidden at the boundaries: a control that
 * vanishes shifts everything left, which makes the footer feel jumpy and
 * leaves the user unsure whether the control exists.
 *
 * @param page      Current 1-based page.
 * @param totalPages Total pages; the server always reports at least 1.
 * @param total     Total matching rows, for the "N results" summary.
 * @param limit     Current page size.
 */
export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  className,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
  /** True while a page transition is in flight, to block double-clicks. */
  disabled?: boolean;
}) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Left: result count + page size */}
      {/*
       * `justify-between` below `sm` pushes the page-size control to the right
       * edge, so the count and the control sit at opposite ends of the line.
       * Left to default flow they bunched up against the count with a stray
       * gap between them, which read as a layout accident rather than a
       * deliberate pairing.
       */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-start">
        <p className="text-sm text-slate-600" aria-live="polite">
          {pluralize(total, "result")}
        </p>

        {onLimitChange ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Per page</span>
            {/*
             * `h-11` matches the Prev/Next buttons so every control in the
             * footer shares one height. It was `py-1` alone, which came out at
             * 28px — under the 44px touch-target minimum, and visibly shorter
             * than the buttons sitting beside it.
             */}
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              disabled={disabled}
              className="h-11 cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {/* Right: prev / page x of y / next */}
      {/*
       * Full width below `sm`, where the Prev / page / Next row is its own
       * line and the buttons split the row evenly between them. Letting the
       * buttons size to their content instead left the page label as the only
       * flexible item, so flex shrank it to roughly a third of its natural
       * width and wrapped "Page 1 of 11" onto two lines — which is what
       * doubled the height of the footer on a phone.
       *
       * `whitespace-nowrap` on the label is the other half: it pins the text to
       * one line, and the buttons absorb the leftover width instead.
       */}
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || disabled}
          aria-label="Previous page"
          className={cn(COMPACT_BUTTON_CLASS, "min-w-0 flex-1 sm:flex-none")}
        >
          Prev
        </button>

        <p className="whitespace-nowrap text-sm tabular-nums text-slate-600">
          Page <span className="font-medium text-slate-900">{page}</span> of{" "}
          <span className="font-medium text-slate-900">{totalPages}</span>
        </p>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || disabled}
          aria-label="Next page"
          className={cn(COMPACT_BUTTON_CLASS, "min-w-0 flex-1 sm:flex-none")}
        >
          Next
        </button>
      </div>
    </nav>
  );
}