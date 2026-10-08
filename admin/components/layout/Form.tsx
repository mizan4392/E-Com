import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/** Shared input styling: full width, comfortable touch target, focus ring. */
export const FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm " +
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
 */
export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(LABEL_CLASS, className)}>
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function TextField({
  label,
  id,
  className,
  ...rest
}: {
  label: string;
  id: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} htmlFor={id} className={className}>
      <input id={id} className={FIELD_CLASS} {...rest} />
    </Field>
  );
}

export function SelectField({
  label,
  id,
  className,
  children,
  ...rest
}: {
  label: string;
  id: string;
  className?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} htmlFor={id} className={className}>
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
