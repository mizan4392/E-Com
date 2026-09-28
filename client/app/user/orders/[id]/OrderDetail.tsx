"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  useConfirmOrderReceived,
  useOrder,
  useRetryPayment,
  useUpdateDeliveryAddress,
} from "../../../../lib/order/queries";
import { redirectToCheckout } from "../../../../lib/order/stripe";
import { canRetryPayment, formatOrderDate } from "../../../../util/order";
import OrderDetailView from "../../../components/OrderDetailView";
import ProtectedRoute from "../../../components/ProtectedRoute";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function OrderDetail({ orderId }: { orderId: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const { data: order, isLoading, isError } = useOrder(orderId);
  const retryMutation = useRetryPayment();
  const updateAddressMutation = useUpdateDeliveryAddress();
  const confirmReceiptMutation = useConfirmOrderReceived();

  const handleAddressUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryAddress?.trim()) {
      toast.error("Enter a delivery address");
      return;
    }

    try {
      await updateAddressMutation.mutateAsync({
        orderId,
        deliveryAddress: deliveryAddress.trim(),
      });
      setIsEditingAddress(false);
      toast.success("Delivery address updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update delivery address",
      );
    }
  };

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

  const handleConfirmReceipt = async () => {
    try {
      await confirmReceiptMutation.mutateAsync(orderId);
      toast.success("Receipt confirmed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not confirm receipt",
      );
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
            deliveryAddressAction={
              order.deliveryAddressEditable === false ? (
                <p className="text-xs text-zinc-500">
                  This address is locked because the order has shipped.
                </p>
              ) : isEditingAddress ? (
                <form onSubmit={handleAddressUpdate} className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-800">
                    Update delivery address
                    <textarea
                      value={deliveryAddress ?? order.deliveryAddress ?? ""}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      required
                      className="mt-2 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={updateAddressMutation.isPending}
                      className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      {updateAddressMutation.isPending
                        ? "Saving…"
                        : "Save address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryAddress(null);
                        setIsEditingAddress(false);
                      }}
                      className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                >
                  Change delivery address for this order
                </button>
              )
            }
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
              ) : order.status === "PAID" && order.buyerConfirmedAt ? (
                <p className="text-sm font-medium text-emerald-700">
                  Receipt confirmed on {formatOrderDate(order.buyerConfirmedAt)}
                  .
                </p>
              ) : order.status === "PAID" &&
                (order.deliveryStatus === "SHIPPED" ||
                  order.deliveryStatus === "DELIVERED") ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600">
                    Confirm that you have received all items in this order.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmReceipt}
                    disabled={confirmReceiptMutation.isPending}
                    className="h-12 w-full cursor-pointer rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {confirmReceiptMutation.isPending
                      ? "Confirming receipt…"
                      : "Confirm receipt"}
                  </button>
                </div>
              ) : null
            }
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
