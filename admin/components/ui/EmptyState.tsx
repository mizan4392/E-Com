import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SECONDARY_BUTTON_CLASS } from "@/components/layout/Form";

/**
 * Empty state for a list that has nothing to show.
 *
 * Always offers the way out. An empty table with no explanation is the most
 * common way a filtered list strands a user, so when there is something to
 * clear the action is rendered inline rather than leaving them to guess.
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          {icon}
        </div>
      ) : null}

      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/**
 * "Clear filters" button, styled as a secondary action.
 *
 * Exported because the empty state and the filter bar both need it and it
 * should look identical in both.
 */
export function ClearFiltersButton({
  onClick,
  children = "Clear filters",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(SECONDARY_BUTTON_CLASS, "px-3 py-1.5")}>
      {children}
    </button>
  );
}