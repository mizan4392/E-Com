"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useOrder, useRetryPayment } from "../../../lib/order/queries";
import { formatPrice } from "../../../util/functions";
import { redirectToCheckout } from "../../../lib/order/stripe";
import { OrderStatus } from "../../../types/order";
import { Spinner } from "../../components/Spinner";
import useCartStore from "../../../stores/cartStore";

const STATUS_META: Record<
  OrderStatus,
  { icon: string; title: string; description: string; tone: string }
> = {
  PAID: {
    icon: "✅",
    title: "Payment successful!",
    description: "Your order has been confirmed and is being processed.",
    tone: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  PAYMENT_FAILED: {
    icon: "⚠️",
    title: "Payment failed",
    description:
      "We couldn't process your payment. You can try again with a different payment method.",
    tone: "bg-red-50 border-red-200 text-red-800",
  },
  PENDING: {
    icon: "⏳",
    title: "Payment pending",
    description:
      "Your payment is being processed. This should only take a moment.",
    tone: "bg-amber-50 border-amber-200 text-amber-800",
  },
  CANCELLED: {
    icon: "🚫",
    title: "Payment cancelled",
    description: "You cancelled the payment. No charges were made.",
    tone: "bg-zinc-50 border-zinc-200 text-zinc-700",
  },
};

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") ?? "";
  const { isSignedIn } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  const { data: order, isLoading, refetch } = useOrder(orderId as string);
  const retryMutation = useRetryPayment();

  // Once the order is confirmed as PAID, clear the cart so purchased
  // items don't linger after a successful checkout.
  const clearCart = useCartStore((state) => state.clearCart);
  const cartClearedForOrder = useRef<string | null>(null);
  useEffect(() => {
    if (order?.status === "PAID" && cartClearedForOrder.current !== order.id) {
      clearCart();
      cartClearedForOrder.current = order.id;
    }
  }, [order?.status, order?.id, clearCart]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await retryMutation.mutateAsync(orderId as string);
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

  if (!orderId) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-zinc-900">
          No order specified
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-zinc-900">Order not found</p>
        <p className="mt-2 text-sm text-zinc-500">
          {isSignedIn
            ? "We couldn't find this order. It may not belong to your account."
            : "Sign in to view your order."}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
  const isFailed = order.status === "PAYMENT_FAILED";
  const isPending = order.status === "PENDING";

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className={`rounded-3xl border p-8 text-center shadow-sm ${meta.tone}`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
          {meta.icon}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 opacity-80">
          {meta.description}
        </p>

        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-white/70 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              Order ID
            </p>
            <p className="mt-1 text-sm font-semibold break-all">
              {order.id.slice(0, 8)}
            </p>
          </div>
          <div className="rounded-xl bg-white/70 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatPrice(order.amountTotal)}
            </p>
          </div>
        </div>

        {(isFailed || isPending) && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="mt-6 h-12 w-full max-w-sm rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? "Starting payment…" : "Retry payment"}
          </button>
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-medium text-zinc-700 transition hover:text-zinc-900"
          >
            Refresh status
          </button>
        </div>
      </div>

      {/* Order items */}
      {order.items && order.items.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-100 px-6 py-4 text-sm font-semibold text-zinc-900">
            Order items
          </h2>
          <ul className="flex flex-col">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-4 border-b border-zinc-100 px-6 py-4 last:border-0"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-xl bg-zinc-100 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                    🛍️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.shopName ? `Sold by ${item.shopName} · ` : ""}
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <Suspense fallback={<Spinner />}>
          <PaymentStatusContent />
        </Suspense>
      </div>
    </main>
  );
}
