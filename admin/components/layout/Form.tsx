import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Shared input styling: full width, comfortable touch target, focus ring.
 *
 * `h-11` is load-bearing for alignment. Without an explicit height, `<input>`
 * and `<select>` derive their box from their own metrics and land on
 * different heights — a 42px input beside a 40px select — so a row of mixed
 * controls never lines up along the bottom edge. Fixing the height here fixes
 * every form in the admin at once, rather than per page.
 */
export const FIELD_CLASS =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm " +
  "text-slate-900 placeholder:text-slate-400 transition-colors duration-200 " +
  "focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-blue-600 focus-visible:ring-offset-1";

const LABEL_CLASS = "block text-sm font-medium text-slate-700";

/**
 * A labelled form control.
 *
 * Every page was repeating the same `<label>…<input className="mt-2 w-full
 * rounded-2xl border …" /></label>` block; this keeps the spacing and focus
 * treatment identical everywhere and gives the input a real `id`, so clicking
 * the label focuses the field (it was previously only associated
 * implicitly, which broke for any control without a wrapping label).
 *
 * Pass `children` instead of `type` to render a `<select>`.
 *
 * ## `wrapperClassName`
 *
 * `className` lands on the `<label>`, which is *inside* the grid cell — a
 * `col-span-*` passed there therefore sizes the label, not the cell, and the
 * control lands on the wrong grid row. `wrapperClassName` exists for the
 * cases that genuinely need to address the cell (a column span, a width
 * cap). It is a separate prop precisely so the two do not get confused.
 */
export function Field({
  label,
  htmlFor,
  children,
  className,
  wrapperClassName,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      <label htmlFor={htmlFor} className={cn(LABEL_CLASS, className)}>
        {label}
        <div className="mt-1.5">{children}</div>
      </label>
    </div>
  );
}

export function TextField({
  label,
  id,
  className,
  wrapperClassName,
  ...rest
}: {
  label: string;
  id: string;
  className?: string;
  wrapperClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field
      label={label}
      htmlFor={id}
      className={className}
      wrapperClassName={wrapperClassName}
    >
      <input id={id} className={FIELD_CLASS} {...rest} />
    </Field>
  );
}

export function SelectField({
  label,
  id,
  className,
  wrapperClassName,
  children,
  ...rest
}: {
  label: string;
  id: string;
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field
      label={label}
      htmlFor={id}
      className={className}
      wrapperClassName={wrapperClassName}
    >
      <select id={id} className={FIELD_CLASS} {...rest}>
        {children}
      </select>
    </Field>
  );
}

/** Primary / secondary action buttons with consistent sizing. */
export const PRIMARY_BUTTON_CLASS =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl " +
  "bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors " +
  "duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY_BUTTON_CLASS =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl " +
  "border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 " +
  "transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto";

/**
 * Compact secondary button for toolbars and page footers.
 *
 * Separate from {@link SECONDARY_BUTTON_CLASS} rather than an override of it.
 * `cn` in this project is plain concatenation — there is no `tailwind-merge` —
 * so appending `w-auto py-1.5` to a class string that already carries
 * `w-full py-2.5` emits both utilities and lets the stylesheet's own ordering
 * decide the winner. Which one wins is an implementation detail of Tailwind,
 * not of the code, so the intended size was silently ignored: the footer
 * buttons stayed 42px tall instead of the requested size, and the filter bar's
 * controls stayed 38px.
 *
 * Authoring the compact size outright means there is nothing left to override.
 * The `h-11` is the 44px touch-target minimum, shared by every control in these
 * footers so they line up and can be relied on for height.
 */
export const COMPACT_BUTTON_CLASS =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-xl " +
  "border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 " +
  "transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";
