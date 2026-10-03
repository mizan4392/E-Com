"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import DeliveryStatusFilterTabs from "../../components/DeliveryStatusFilterTabs";
import NewOrdersBadge from "../../components/NewOrdersBadge";
import Pagination from "../../components/Pagination";
import ProtectedRoute from "../../components/ProtectedRoute";
import ShopOrderCard from "../../components/ShopOrderCard";
import { useGetUserShop } from "../../../lib/shop/queries";
import {
  useShopOrderSummary,
  useShopOrders,
  useUpdateOrderDeliveryStatus,
} from "../../../lib/shop-orders/queries";
import type {
  DeliveryStatus,
  DeliveryStatusFilter,
  ShopOrder,
} from "../../../types/order";

/**
 * The seller's order inbox.
 *
 * Split out of `page.tsx` so the route file can stay a server component and
 * read `?shopId=` there. Using `useSearchParams()` here instead would opt the
 * route out of static prerendering and fail the build without a `<Suspense>`
 * boundary.
 */
export default function ShopOrdersClient({
  initialShopId,
}: {
  initialShopId?: string;
}) {
  // `undefined` = the whole inbox across every shop the user owns.
  const [shopId, setShopId] = useState<string | undefined>(initialShopId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DeliveryStatusFilter>("ALL");
  const [newOnly, setNewOnly] = useState(false);
  const [pendingOrderKeys, setPendingOrderKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const { data: shops } = useGetUserShop();
  const summaryQuery = useShopOrderSummary(shopId);
  const ordersQuery = useShopOrders(shopId, page, status, newOnly);
  const updateStatus = useUpdateOrderDeliveryStatus();

  const summary = summaryQuery.data;

  /**
   * Handles a status change from a card's inline control.
   *
   * Memoised so the `memo` on `ShopOrderCard` actually pays off — an inline
   * arrow here would give every card a new prop identity on each render and
   * defeat the comparison.
   */
  const handleUpdate = useCallback(
    (order: ShopOrder, next: DeliveryStatus) => {
      // One card per order, so the order id alone identifies it.
      setPendingOrderKeys((current) => new Set(current).add(order.orderId));

      const clearPending = () => {
        setPendingOrderKeys((current) => {
          const next = new Set(current);
          next.delete(order.orderId);
          return next;
        });
      };

      void updateStatus
        .mutateAsync({
          orderId: order.orderId,
          // Scope the write to the shop filter the seller is looking at; omit
          // it on "All shops" so every line they own moves together.
          shopId,
          deliveryStatus: next,
        })
        .then(() => toast.success(`Order status set to ${next.toLowerCase()}`))
        .catch((error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Could not update order",
          ),
        )
        .finally(clearPending);
    },
    [updateStatus, setPendingOrderKeys, shopId],
  );

  /**
   * Changing the shop or the filter invalidates the current page number, so
   * reset to 1 — otherwise you can land on a page that does not exist for the
   * new result set.
   */
  const handleShopChange = (value: string) => {
    setShopId(value || undefined);
    setPage(1);
  };

  const handleStatusChange = (value: DeliveryStatusFilter) => {
    setStatus(value);
    setNewOnly(false);
    setPage(1);
  };

  const handleNewOnlyChange = (value: boolean) => {
    setNewOnly(value);
    setPage(1);
  };
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
                Sales
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                Shop orders
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Orders customers placed for the products in your shops.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {summary ? (
                <>
                  <NewOrdersBadge count={summary.newPaid} />
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                    {summary.total} paid{" "}
                    {summary.total === 1 ? "order" : "orders"}
                  </span>
                </>
              ) : null}
              <a
                href="/user/user-shop"
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
              >
                My shops
              </a>
            </div>
          </div>

          {/* Shop scope — "All shops" plus one entry per owned shop. */}
          {shops && shops.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleShopChange("")}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                  shopId === undefined
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                All shops
              </button>
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => handleShopChange(shop.id)}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                    shopId === shop.id
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {shop.name}
                </button>
              ))}
            </div>
          ) : null}

          <DeliveryStatusFilterTabs
            value={status}
            onChange={handleStatusChange}
            newOnly={newOnly}
            onNewOnlyChange={handleNewOnlyChange}
          />

          {ordersQuery.isLoading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm">
              Loading orders...
            </div>
          ) : (ordersQuery.data?.data.length ?? 0) === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 shadow-sm">
              <p className="text-lg font-semibold text-zinc-900">
                No orders here yet
              </p>
              <p className="mt-2 text-sm">
                {newOnly
                  ? "You have handled every new paid order. Nice work."
                  : "When a customer pays for one of your products, it will show up here."}
              </p>
            </div>
          ) : (
            <div
              className={`space-y-4 transition-opacity ${
                ordersQuery.isFetching ? "opacity-60" : ""
              }`}
            >
              {ordersQuery.data?.data.map((order) => (
                <ShopOrderCard
                  key={order.orderId}
                  order={order}
                  onUpdateStatus={handleUpdate}
                  isPending={pendingOrderKeys.has(order.orderId)}
                />
              ))}
            </div>
          )}

          {(ordersQuery.data?.totalPages ?? 1) > 1 ? (
            <Pagination
              page={ordersQuery.data?.currentPage ?? page}
              totalPages={ordersQuery.data?.totalPages ?? 1}
              onPage={setPage}
            />
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
