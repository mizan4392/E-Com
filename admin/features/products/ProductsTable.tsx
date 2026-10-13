import { Eye, Pause } from "lucide-react";
import Link from "next/link";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AdminProductListItem } from "./products.types";
import ProductCard from "./ProductCard";

/**
 * The products table: `DataTable` configured with the columns the list page
 * needs, plus a client-specific mobile card.
 *
 * Each column width is a fraction of the table so the layout stays stable as
 * counts and prices change — a column that grew to fit its content would push
 * neighbours around on every filter change.
 */
export default function ProductsTable({
  products,
  onPause,
}: {
  products: readonly AdminProductListItem[];
  /** Opens the pause dialog for the given product. */
  onPause: (product: AdminProductListItem) => void;
}) {
  const columns: readonly DataTableColumn<AdminProductListItem>[] = [
    {
      key: "name",
      header: "Product",
      className: "w-[28%]",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl?.[0] ? (
            <img
              src={p.imageUrl[0]}
              alt={p.name}
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <span className="sr-only">No image</span>—
            </span>
          )}
          <span className="truncate font-medium text-slate-900">{p.name}</span>
        </div>
      ),
    },
    {
      key: "shop",
      header: "Shop",
      className: "w-[16%]",
      render: (p) => (
        <span className="truncate text-slate-700">{p.shop?.name ?? "—"}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "w-[14%]",
      render: (p) => (
        <span className="truncate text-slate-700">
          {p.category?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      numeric: true,
      className: "w-[10%]",
      render: (p) => (
        <span className="text-black">{formatCurrency(p.price)}</span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      numeric: true,
      className: "w-[8%] text-black-600",
      render: (p) => (
        <span className={p.stock === 0 ? "text-rose-600" : "text-slate-700"}>
          {p.stock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[12%]",
      render: (p) => (
        <StatusBadge
          tone={p.status === "PAUSED" ? "warning" : "success"}
          label={p.status === "PAUSED" ? "Paused" : "Active"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      className: "w-[12%]",
      render: (p) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(p.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-[5%]",
      render: (p) => (
        <div className="flex items-center gap-1 justify-end">
          {p.status !== "PAUSED" && (
            <button
              type="button"
              onClick={() => onPause(p)}
              aria-label={`Pause ${p.name}`}
              className="inline-flex rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              title="Pause product"
            >
              <Pause aria-hidden="true" className="size-4" />
            </button>
          )}
          <Link
            href={`/products/${p.id}`}
            aria-label={`View ${p.name}`}
            className="inline-flex rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="View product"
          >
            <Eye aria-hidden="true" className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      caption="Products list"
      columns={columns}
      rows={products}
      renderMobileCard={(product) => (
        <ProductCard product={product} onPause={onPause} />
      )}
    />
  );
}
