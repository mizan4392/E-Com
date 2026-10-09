import { Suspense } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import PageHeader, { PageContainer, Card } from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import OrdersTable from "@/features/orders/OrdersTable";
import OrdersControls from "@/features/orders/OrdersControls";
import { OrdersBodySkeleton } from "@/features/orders/OrdersPageSkeleton";
import {
  fetchFilterShops,
  fetchOrderStatusCounts,
  fetchOrders,
} from "@/features/orders/orders.api";
import type { OrderListParams } from "@/features/orders/orders.types";

/** The Promise Next.js 16 hands to a page for its query string. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Admin orders list — a Server Component.
 *
 * The request happens here, on the server, and only the result crosses to the
 * browser: no client-side fetch, no request waterfall, and no admin token in the
 * page bundle.
 *
 * ## Why the data lives behind its own `Suspense`
 *
 * `searchParams` is a Promise, and awaiting it at the top of this component
 * would block the *whole* page — header included — until the query string
 * resolved and the requests came back. Turning a page would then replace the
 * entire route with a fallback and the rows the admin was reading would vanish.
 *
 * Instead only {@link OrdersData} awaits. The shell renders immediately and
 * React streams the fresh rows into the already-painted card while they load.
 * Combined with `OrdersTable`'s `isPending` dimming, turning a page fades the
 * old rows instead of clearing them, which is what "keep previous data visible"
 * actually requires — a `loading.tsx` fallback cannot do this, because a
 * navigation to the *same* route does not re-run the `loading` boundary.
 */
export default function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PageContainer>
      {/* Rendered outside the boundary: it depends on nothing, so the heading
          is on screen immediately instead of arriving with the data. */}
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Search, filter and review every order placed across your shops."
      />

      <Suspense fallback={<OrdersBodySkeleton />}>
        <OrdersData searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

/**
 * The data-dependent region: tabs, filters, table and pagination.
 *
 * Split from the shell purely to give `Suspense` something to suspend on.
 */
async function OrdersData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = toOrderListParams(params);

  // Counts respect the shop/date filters but deliberately not `status` — see
  // `fetchOrderStatusCounts`.
  const countParams = {
    shopId: query.shopId,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };

  // `allSettled` rather than `all`: the shops list only populates one dropdown,
  // so a failure there should cost the admin that filter rather than replacing
  // the whole table with an error boundary. The orders request is the one that
  // must succeed, and it is checked explicitly below.
  const [ordersResult, countsResult, shopsResult] = await Promise.allSettled([
    fetchOrders(query),
    fetchOrderStatusCounts(countParams),
    fetchFilterShops(),
  ]);

  if (ordersResult.status === "rejected") {
    // Rethrown so the route's `error.tsx` handles it: it owns the retry button,
    // and duplicating that UI here would give the admin two competing retries.
    throw ordersResult.reason;
  }

  const { data: orders, meta } = ordersResult.value;
  const counts = countsResult.status === "fulfilled" ? countsResult.value : undefined;
  const shops = shopsResult.status === "fulfilled" ? shopsResult.value : [];

  const isFiltered =
    Boolean(query.status) ||
    Boolean(query.shopId) ||
    Boolean(query.search) ||
    Boolean(query.dateFrom) ||
    Boolean(query.dateTo);

  return (
    <>
      <OrdersControls meta={meta} counts={counts} shops={shops} />

      <Card className="overflow-hidden p-0">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={
              isFiltered
                ? "No orders match the current filters. Try widening the date range or clearing them."
                : "Orders will appear here once customers start checking out."
            }
            icon={<Inbox className="size-5" />}
            // An `<a>` rather than the client `clearFilters`, so it works before
            // hydration and needs no client component imported into a server
            // component purely to call a router method.
            action={isFiltered ? <ClearFiltersLink /> : undefined}
            className="m-4 border-0"
          />
        ) : (
          <OrdersTable orders={orders} />
        )}
      </Card>
    </>
  );
}

/** Resets every filter and returns to the default view. */
function ClearFiltersLink() {
  return (
    <Link
      href="/orders"
      className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto"
    >
      Clear filters
    </Link>
  );
}

/**
 * Flattens `searchParams` into the list query.
 *
 * Each key is read individually rather than spread, because a repeated
 * `?status=PENDING&status=PAID` arrives as an array; forwarding that straight to
 * the API would serialise as a comma-joined string, which fails the server's
 * `@IsEnum` validation and 400s the whole page. Taking the first value turns a
 * malformed link into a working one.
 *
 * Enum values are forwarded without re-checking them. `useOrderFilters` owns
 * parsing for the interactive controls, and a hand-edited or stale link is
 * caught by the server's own validation and surfaced through `error.tsx`.
 */
function toOrderListParams(
  params: Record<string, string | string[] | undefined>,
): OrderListParams {
  const first = (key: string): string | undefined => {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    const trimmed = single?.trim();
    return trimmed ? trimmed : undefined;
  };

  const page = Number(first("page"));
  const limit = Number(first("limit"));

  return {
    ...(first("status") ? { status: first("status") as OrderListParams["status"] } : {}),
    ...(first("shopId") ? { shopId: first("shopId") } : {}),
    ...(first("search") ? { search: first("search") } : {}),
    ...(first("dateFrom") ? { dateFrom: first("dateFrom") } : {}),
    ...(first("dateTo") ? { dateTo: first("dateTo") } : {}),
    ...(first("sortBy") ? { sortBy: first("sortBy") as OrderListParams["sortBy"] } : {}),
    ...(first("sortOrder")
      ? { sortOrder: first("sortOrder") as OrderListParams["sortOrder"] }
      : {}),
    ...(Number.isInteger(page) && page >= 1 ? { page } : {}),
    ...(Number.isInteger(limit) && limit > 0 ? { limit } : {}),
  };
}
