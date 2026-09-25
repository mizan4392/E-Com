import { getOrderStatusMeta } from "../../util/order";

type Props = {
  status?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Status pill for an order. Reads all copy/colour from `ORDER_STATUS_META`
 * so the same status always renders identically across list, detail and
 * payment-status surfaces.
 */
export default function OrderStatusBadge({
  status,
  size = "md",
  className = "",
}: Props) {
  const meta = getOrderStatusMeta(status);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold ${
        meta.badgeClassName
      } ${size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"} ${className}`}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
