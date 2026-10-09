import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Store, User } from "lucide-react";
import PageHeader, { PageContainer, Card } from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderItemsList from "@/features/orders/OrderItemsList";
import { toneForStatus } from "@/features/orders/OrderCard";
import { fetchOrderDetail } from "@/features/orders/orders.api";
import { formatCurrency, formatDateTime, pluralize } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/features/orders/orders.types";

/**
 * Admin order detail — a Server Component.
 *
 * The order is fetched on the server and only the resulting payload crosses to
 * the browser. Nothing here is interactive except the back link, so there is no
 * client boundary on this route at all.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await fetchOrderDetail(id);
  } catch (error) {
    // Only a genuine 404 becomes the framework's not-found page — a mistyped
    // or deleted order id is a routing outcome, not a failure. Everything else
    // (a 500, an unreachable API, an expired session) is rethrown so the
    // route's `error.tsx` takes over and can offer a retry.
    //
    // `apiFetch` throws a plain `Error` carrying Nest's message, so the status
    // is matched on that message. Adding an `ApiError` with a `status` field
    // would be cleaner, but that means changing shared code for one caller.
    if (error instanceof Error && isNotFound(error.message)) {
      notFound();
    }
    throw error;
  }

  return (
    <PageContainer>
      {/* Back link: a real `<a>`-back to the list, preserving nothing — the
          admin arrived from a filtered list and may want the unfiltered one. */}
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to orders
      </Link>

      <PageHeader
        eyebrow="Sales"
        title={order.orderNumber ?? "Order"}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <StatusBadge
            tone={toneForStatus(order.status)}
            label={ORDER_STATUS_LABELS[order.status]}
          />
        }
      />

      {/* ---------- Summary ---------- */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<User className="size-4" />}
          label="Customer"
          primary={order.user?.name ?? "Guest"}
          rows={[
            order.user?.email ? { label: "Email", value: order.user.email } : null,
            order.user?.phone ?? order.deliveryPhone
              ? {
                  label: "Phone",
                  value: (order.user?.phone ?? order.deliveryPhone) as string,
                }
              : null,
          ]}
        />

        <SummaryCard
          icon={<Store className="size-4" />}
          label="Shop"
          primary={
            order.shopCount > 1
              ? `${order.shop?.name ?? "Unknown"} +${order.shopCount - 1}`
              : (order.shop?.name ?? "No shop")
          }
          rows={[
            order.shopCount > 1
              ? { label: "Shops in basket", value: String(order.shopCount) }
              : null,
          ]}
        />

        <SummaryCard
          icon={<MapPin className="size-4" />}
          label="Delivery"
          primary={order.deliveryAddress ?? "No address on file"}
          rows={[]}
        />

        <SummaryCard
          icon={<Phone className="size-4" />}
          label="Dates"
          primary={`Placed ${formatDateTime(order.createdAt)}`}
          rows={[
            { label: "Updated", value: formatDateTime(order.updatedAt) },
            order.buyerConfirmedAt
              ? { label: "Confirmed", value: formatDateTime(order.buyerConfirmedAt) }
              : null,
          ]}
        />
      </div>

      {/* ---------- Items ---------- */}
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Items</h2>
          <p className="text-sm text-slate-500">
            {pluralize(order.itemCount, "line")} ·{" "}
            {pluralize(order.totalQuantity, "unit")}
          </p>
        </div>

        <OrderItemsList items={order.items} />

        {/* ---------- Totals ---------- */}
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="tabular-nums text-slate-700">
                {formatCurrency(
                  order.items.reduce((sum, item) => sum + item.lineTotal, 0),
                  order.currency,
                )}
              </dd>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">
                {formatCurrency(order.totalAmount, order.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </Card>
    </PageContainer>
  );
}

/**
 * Recognises the server's 404 for a missing order.
 *
 * Nest's `NotFoundException` body carries `statusCode: 404`, but `apiFetch`
 * flattens the body down to `message`, so the message is all that survives.
 * Matching on it keeps a genuine outage from masquerading as "order not found",
 * which would be actively misleading during an incident.
 */
function isNotFound(message: string): boolean {
  const normalised = message.toLowerCase();
  return normalised.includes("not found") || normalised.includes("404");
}

/** One summary tile: an icon, a label, a primary value and optional rows. */
function SummaryCard({
  icon,
  label,
  primary,
  rows,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  rows: ReadonlyArray<{ label: string; value: string } | null>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-slate-400">
          {icon}
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </h2>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-slate-900">{primary}</p>

      {rows.filter(Boolean).length > 0 ? (
        <dl className="mt-2 space-y-0.5 text-xs text-slate-500">
          {rows.map((row) =>
            row ? (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="shrink-0">{row.label}</dt>
                <dd className="min-w-0 truncate text-slate-600">{row.value}</dd>
              </div>
            ) : null,
          )}
        </dl>
      ) : null}
    </section>
  );
}
