import { cn } from "@/lib/cn";

/**
 * One badge, one config table.
 *
 * Order status and delivery status are rendered in three places (list, detail,
 * item rows) and each was previously re-deriving its own Tailwind classes. A
 * single lookup keeps the colours consistent and means a new status is one
 * entry rather than three edits that can drift apart.
 *
 * Colours are chosen to stay legible on the white card surface: a light
 * background with a dark text and a matching border, rather than a saturated
 * fill that fails contrast against white text.
 */
export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "purple";

const TONE_CLASS: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
};

const BADGE_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border " +
  "px-2.5 py-0.5 text-xs font-medium";

/**
 * Dot fill per tone. Module scope for the same reason as {@link TONE_CLASS} —
 * rebuilding this record inside the component allocates a new object on every
 * render of every badge, and there can be 50 badges on screen at once.
 */
const DOT_TONE: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  purple: "bg-violet-500",
};

/**
 * Status pill.
 *
 * @param tone  Colour family.
 * @param label Visible text. Pass `undefined` for no label (dot only).
 * @param dot   Prefix a filled dot — a redundant colour cue, which matters for
 *              the ~8% of men with a red-green colour vision deficiency who
 *              cannot rely on the pill colour alone.
 */
export default function StatusBadge({
  tone = "neutral",
  label,
  dot = true,
  className,
}: {
  tone?: BadgeTone;
  label: string | undefined;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(BADGE_BASE, TONE_CLASS[tone], className)}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[tone])}
        />
      ) : null}
      {label}
    </span>
  );
}