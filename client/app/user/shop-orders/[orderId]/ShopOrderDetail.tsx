"use client";

import Link from "next/link";
import { toast } from "sonner";

import DeliveryStatusSelect from "../../../components/DeliveryStatusSelect";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ProtectedRoute from "../../../components/ProtectedRoute";
import ShopOrderDetailView from "../../../components/ShopOrderDetailView";
import {
  useShopOrder,
  useUpdateOrderDeliveryStatus,
} from "../../../../lib/shop-orders/queries";
import type { DeliveryStatus } from "../../../../types/order";

/**
 * Single order from the seller's point of view.
 *
 * One status control for the whole order. The products underneath move with
 * it; there is no per-product control, because an order ships as one thing and
 * a list of competing per-product dropdowns made a single order look like
 * several separate obligations.
 */
export default function ShopOrderDetail({
  orderId,
  shopId,
}: {
  orderId: string;
  /** Optional scope. The list links here without one, since a card is one order. */
  shopId?: string;
}) {
  const { data: order, isLoading, isError } = useShopOrder(orderId, shopId);
  const updateOrderStatus = useUpdateOrderDeliveryStatus();

  const handleUpdate = (next: DeliveryStatus) => {
    if (!order) return;
    updateOrderStatus.mutate(
      { orderId: order.orderId, shopId, deliveryStatus: next },
      {
        onSuccess: () =>
          toast.success(`Order status set to ${next.toLowerCase()}`),
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Could not update order",
          ),
      },
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" color="dark" />
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              🔍
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Order not found
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              We couldn’t find this order. It may not belong to your shops.
            </p>
            <Link
              href="/user/shop-orders"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Back to shop orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-zinc-900">
              Home
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <Link
              href="/user/shop-orders"
              className="transition hover:text-zinc-900"
            >
              Shop orders
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-900">{order.orderId.slice(0, 8)}</span>
          </nav>

          <ShopOrderDetailView
            order={order}
            action={
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Update this order
                </p>
                <p className="text-xs text-zinc-500">
                  Applies to all {order.totalQuantity}{" "}
                  {order.totalQuantity === 1 ? "unit" : "units"} in this order.
                </p>
                <DeliveryStatusSelect
                  status={order.deliveryStatus}
                  onChange={handleUpdate}
                  isPending={updateOrderStatus.isPending}
                />
              </div>
            }
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
