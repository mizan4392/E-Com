import { getDeliveryStatusMeta } from "../../util/delivery";

type Props = {
  status?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Fulfilment-stage pill for the seller's order surfaces.
 *
 * Reads all copy/colour from `DELIVERY_STATUS_META` so a stage can never look
 * different on the list, the detail panel and the shop card.
 */
export default function DeliveryStatusBadge({
  status,
  size = "md",
  className = "",
}: Props) {
  const meta = getDeliveryStatusMeta(status);

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
