"use client";

import { useEffect, useRef, useState } from "react";
import type { DeliveryStatus } from "../../types/order";
import { canUpdateDelivery, getDeliveryStatusMeta } from "../../util/delivery";

const STATUS_OPTIONS: DeliveryStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "PENDING",
];

type Props = {
  /** Current stage; drives which button is primary. */
  status: DeliveryStatus;
  /** Called with the stage the seller picked. */
  onChange: (status: DeliveryStatus) => void;
  /** Disables the control (e.g. mutation in flight). */
  isPending?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/**
 * The seller's fulfilment control: a primary "Advance to <next stage>" button
 * plus a dropdown for jumping straight to any stage.
 *
 * Advancing one stage is the common case and gets a single obvious button.
 * The dropdown exists for the real-world exceptions — a shop that ships and
 * delivers in one step, or a correction back to an earlier stage.
 *
 * Built from buttons rather than a `<select>` so each stage can carry its own
 * colour and icon, matching `DeliveryStatusBadge`.
 */
export default function DeliveryStatusSelect({
  status,
  onChange,
  isPending = false,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const meta = getDeliveryStatusMeta(status);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !detailsRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        detailsRef.current?.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  // Delivered and cancelled are terminal: nothing left to advance to.
  if (!canUpdateDelivery(status)) {
    return (
      <p className={`text-xs text-zinc-500 ${className}`}>{meta.description}</p>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs text-zinc-500">
        Current:{" "}
        <span className="font-semibold text-zinc-700">{meta.label}</span>
      </span>

      <details
        ref={detailsRef}
        open={isOpen}
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
        className="group relative"
      >
        <summary
          className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 ${
            isPending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          Set status…
          <span aria-hidden className="transition group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {STATUS_OPTIONS.map((option) => {
            const optionMeta = getDeliveryStatusMeta(option);
            const isCurrent = option === status;

            return (
              <button
                key={option}
                type="button"
                disabled={isCurrent || isPending}
                onClick={() => {
                  setIsOpen(false);
                  onChange(option);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                  isCurrent
                    ? "cursor-default bg-zinc-50 font-semibold text-zinc-900"
                    : "cursor-pointer text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span aria-hidden>{optionMeta.icon}</span>
                {optionMeta.label}
              </button>
            );
          })}

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setIsOpen(false);
              onChange("CANCELLED");
            }}
            className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>🚫</span>
            Cancelled
          </button>
        </div>
      </details>
    </div>
  );
}
