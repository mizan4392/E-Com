import Link from "next/link";
import { Eye } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import OrderCard, { toneForStatus } from "./OrderCard";
import {
  ORDER_STATUS_LABELS,
  type AdminOrderListItem,
} from "./orders.types";

/**
 * The orders table: `DataTable` configured with the columns the list page
 * needs, and an order-specific mobile card.
 *
 * The column set is declared once and used for the `<thead>`, the `<td>`s and
 * the mobile card's label/value fallback, so adding a column cannot leave the
 * two presentations disagreeing about what the list contains.
 */
export default function OrdersTable({
  orders,
}: {
  orders: readonly AdminOrderListItem[];
}) {
  const columns: readonly DataTableColumn<AdminOrderListItem>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      className: "w-[13%]",
      render: (order) => (
        <Link
          href={`/orders/${order.id}`}
          className="rounded font-medium text-slate-900 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {order.orderNumber ?? "—"}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      className: "w-[20%]",
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">
            {order.user?.name ?? "Guest"}
          </p>
          {order.user?.email ? (
            <p className="truncate text-xs text-slate-500">{order.user.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "shop",
      header: "Shop",
      className: "w-[16%]",
      render: (order) => (
        <span className="text-slate-700">
          {order.shopCount > 1
            ? `${order.shop?.name ?? "Unknown"} +${order.shopCount - 1}`
            : (order.shop?.name ?? "—")}
        </span>
      ),
    },
    {
      key: "itemCount",
      header: "Items",
      numeric: true,
      className: "w-[8%]",
      render: (order) => order.itemCount,
    },
    {
      key: "totalAmount",
      header: "Total",
      numeric: true,
      className: "w-[12%]",
      render: (order) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(order.totalAmount, order.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[15%]",
      render: (order) => (
        <StatusBadge
          tone={toneForStatus(order.status)}
          label={ORDER_STATUS_LABELS[order.status]}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      className: "w-[11%]",
      render: (order) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-[5%]",
      render: (order) => (
        <Link
          href={`/orders/${order.id}`}
          aria-label={`View order ${order.orderNumber ?? order.id}`}
          className="inline-flex rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Eye aria-hidden="true" className="size-4" />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      caption="Orders list"
      columns={columns}
      rows={orders}
      renderMobileCard={(order) => <OrderCard order={order} />}
    />
  );
}
