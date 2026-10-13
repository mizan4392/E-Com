import { Pause } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatRelative } from "@/lib/format";
import type { AdminProductListItem } from "./products.types";

/**
 * Mobile presentation of one product row (`md:hidden`).
 *
 * A card, not a shrunken table. On a 360px screen a five-column table either
 * scrolls horizontally — breaking the "no horizontal page overflow" rule — or
 * squeezes columns so names and prices become unreadable. Stacking keeps
 * every value legible and the pause button a full touch target.
 */
export default function ProductCard({
  product,
  onPause,
}: {
  product: AdminProductListItem;
  onPause: (product: AdminProductListItem) => void;
}) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 truncate">{product.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {product.shop?.name ?? "No shop"} ·{" "}
          {product.category?.name ?? "No category"}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-600">
          <span className="tabular-nums text-black">
            {formatCurrency(product.price)}
          </span>
          <span>Stock: {product.stock}</span>
          <StatusBadge
            tone={product.status === "PAUSED" ? "warning" : "success"}
            label={product.status === "PAUSED" ? "Paused" : "Active"}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {formatRelative(product.createdAt)}
        </p>
      </div>

      {product.status !== "PAUSED" && (
        <button
          type="button"
          onClick={() => onPause(product)}
          aria-label={`Pause ${product.name}`}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          title="Pause product"
        >
          <Pause aria-hidden="true" className="size-5" />
        </button>
      )}
    </article>
  );
}
