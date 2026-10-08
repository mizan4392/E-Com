import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * Page-level header: eyebrow, title, optional description and actions.
 *
 * Replaces the hand-rolled `flex flex-col gap-3 md:flex-row …` header block
 * that was duplicated across every page. The action slot stacks below the
 * title on mobile and sits inline on `sm` and up, so an "Add product" button
 * never gets squeezed against a long heading.
 *
 * @param eyebrow   Small uppercase label, e.g. "Products".
 * @param title     Page heading.
 * @param description Optional supporting sentence.
 * @param actions   Buttons or links, right-aligned on larger screens.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Standard page container: fluid gutters, capped width, consistent rhythm. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl", className)}>{children}</div>
  );
}

/** Card surface used for every panel in the admin. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Inline error message. `role="alert"` so it is announced when it appears. */
export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {message}
    </p>
  );
}
