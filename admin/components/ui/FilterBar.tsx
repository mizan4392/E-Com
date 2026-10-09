import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COMPACT_BUTTON_CLASS } from "@/components/layout/Form";

/**
 * Filter bar shell: a labelled group of controls.
 *
 * Two layout behaviours, both of which exist because of the 360px case:
 *
 * - **Collapses on mobile.** Six controls side by side cannot fit a phone, so
 *   below `md` they sit behind a "Filters" toggle. The toggle reports how many
 *   filters are active, so a user who scrolled past a collapsed bar can still
 *   see that something is narrowing the list.
 * - **Search is full width on mobile** and takes the remaining space on
 *   desktop, because it is the control that grows as you type.
 *
 * A `<fieldset>`/`<legend>` is used rather than a plain div so the group is
 * announced as a group in a screen reader and the legend becomes the
 * accessible name of every control inside it.
 */
export default function FilterBar({
  children,
  activeCount = 0,
  onClear,
  className,
  /** Always expanded, e.g. where vertical space is not a constraint. */
  alwaysOpen = false,
}: {
  children: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  className?: string;
  alwaysOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const expanded = alwaysOpen || open;

  return (
    <fieldset
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <legend className="sr-only">Filter orders</legend>

      {/* Header row: only interactive below md, where the panel is hidden. */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:border-b-0">
        <p className="text-sm font-semibold text-slate-900">Filters</p>

        <div className="flex items-center gap-2">
          {activeCount > 0 && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className={cn(COMPACT_BUTTON_CLASS, "px-3 text-xs")}
            >
              Clear ({activeCount})
            </button>
          ) : null}

          {!alwaysOpen ? (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className={cn(COMPACT_BUTTON_CLASS, "px-3 text-xs md:hidden")}
            >
              {expanded ? "Hide" : "Show"}
              {activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
          ) : null}
        </div>
      </div>

      {/* Controls. `sr-only` rather than `hidden` below md keeps them in the
          accessibility tree — a `display:none` filter that is still submitted
          is invisible to a screen-reader user with no way to change it. */}
      <div
        id={panelId}
        className={cn(
          "px-4 pb-4",
          expanded ? "block" : "hidden md:block",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
}

/**
 * Grid wrapper for the filter controls, so they line up at every width.
 *
 * ## Why an explicit track list, and why it starts at `xl`
 *
 * Equal tracks (`grid-cols-6`) looked tidy in the markup and wrong on screen:
 * the search box and the two selects all got one sixth of the row, so at a
 * 1024px laptop the shop select was 98px — too narrow for a name like
 * "North & Nest" — while search was twice the width of everything else. The
 * row read as lopsided rather than aligned.
 *
 * The tracks below follow how much room each control actually needs:
 *
 *     search (1.5fr) · shop (1fr) · from (0.75fr) · to (0.75fr) · sort (1fr)
 *
 * That single row only works from `xl` (1280px) and up. `<input type="date">`
 * has an intrinsic minimum width of ~141px that no `fr` track can shrink
 * below, and the shop select needs ~174px for its longest option, so together
 * they need roughly 700px before the row stops being cramped. Between `sm` and
 * `xl` the controls therefore stack as **three rows** — search on its own full
 * width, then Shop beside Sort, then the date pair side by side — which keeps
 * every field legible instead of one cramped row where the dates clamp and the
 * selects are too narrow to read.
 *
 * The children must be written in that same order: search, Shop, Sort, then
 * the date group. Auto-placement fills each row left to right, so a child with
 * no column span sits wherever the cursor is — reordering the markup changes
 * the layout, and a full-width child in the middle splits the pairs around it.
 */
export function FilterBarGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // `items-end` aligns a short cell to the bottom of the row rather than
        // stretching it, which matters when one cell's content is shorter than
        // its neighbour's.
        "grid grid-cols-1 items-end gap-3",
        // Two even columns from `sm`, which is what carries the `md`–`xl`
        // laptop range described above.
        "sm:grid-cols-2",
        // One proportional row once there is genuinely room for it.
        "xl:grid-cols-[1.5fr_1fr_0.75fr_0.75fr_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}