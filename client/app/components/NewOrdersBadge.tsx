type Props = {
  /** Un-actioned paid order count. Hidden entirely when zero. */
  count?: number;
  /** `solid` for the page header, `subtle` for a card corner. */
  variant?: "solid" | "subtle";
  /** Caps the visible number; the real total goes in the title/aria text. */
  max?: number;
  className?: string;
};

/**
 * Unread-orders pill.
 *
 * Renders nothing when `count` is 0 so callers can drop it into a corner
 * without an `&&` guard. The count is the number of PAID orders the seller has
 * not yet actioned — orders they have already handled are deliberately not
 * counted, which is what makes this a to-do signal rather than a total.
 */
export default function NewOrdersBadge({
  count = 0,
  variant = "solid",
  max = 99,
  className = "",
}: Props) {
  if (!count || count <= 0) return null;

  const shown = count > max ? `${max}+` : String(count);
  const label = count === 1 ? "1 new paid order" : `${count} new paid orders`;

  if (variant === "subtle") {
    return (
      <span
        title={label}
        aria-label={label}
        className={`inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm ${className}`}
      >
        {shown}
      </span>
    );
  }

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white/90" />
      {label}
    </span>
  );
}
