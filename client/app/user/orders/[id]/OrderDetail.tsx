"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useOrder, useRetryPayment } from "../../../../lib/order/queries";
import { redirectToCheckout } from "../../../../lib/order/stripe";
import { canRetryPayment } from "../../../../util/order";
import OrderDetailView from "../../../components/OrderDetailView";
import ProtectedRoute from "../../../components/ProtectedRoute";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function OrderDetail({ orderId }: { orderId: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const { data: order, isLoading, isError } = useOrder(orderId);
  const retryMutation = useRetryPayment();

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await retryMutation.mutateAsync(orderId);
      await redirectToCheckout(result);
    } catch (error) {
      console.error("Retry payment error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start retry payment",
      );
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" color="dark" />
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              🔍
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Order not found
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              We couldn&apos;t find this order. It may not belong to your
              account.
            </p>
            <Link
              href="/user/orders"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Back to my orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-zinc-900">
              Home
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <Link
              href="/user/orders"
              className="transition hover:text-zinc-900"
            >
              Orders
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-900">{order.id.slice(0, 8)}</span>
          </nav>

          <OrderDetailView
            order={order}
            action={
              canRetryPayment(order.status) ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="h-12 w-full cursor-pointer rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRetrying ? "Starting payment…" : "Retry payment"}
                </button>
              ) : null
            }
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
