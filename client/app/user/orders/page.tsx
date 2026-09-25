"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders } from "../../../lib/order/queries";
import OrderCard from "../../components/OrderCard";
import OrderStatusFilterTabs from "../../components/OrderStatusFilterTabs";
import Pagination from "../../components/Pagination";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { OrderStatusFilter } from "../../../types/order";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatusFilter>("ALL");

  const { data, isLoading, isFetching, isError, refetch } = useOrders(
    page,
    status,
  );

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Changing the filter must reset pagination, otherwise the user can land on
  // a page that does not exist for the new result set.
  const handleStatusChange = (next: OrderStatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-zinc-900">
              Home
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-900">Orders</span>
          </nav>

          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
              Order history
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Track the products you ordered and their payment status.
            </p>
          </header>

          <div className="mb-6">
            <OrderStatusFilterTabs
              value={status}
              onChange={handleStatusChange}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 shadow-sm">
              <LoadingSpinner size="lg" color="dark" />
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-base font-semibold text-red-800">
                Couldn&apos;t load your orders
              </p>
              <p className="mt-2 text-sm text-red-700">
                Something went wrong while fetching your order history.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-6 cursor-pointer rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-3xl">
                📦
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {status === "ALL"
                  ? "No orders yet"
                  : `No ${status.toLowerCase().replace("_", " ")} orders`}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                {status === "ALL"
                  ? "When you place an order it will appear here with its full details and payment status."
                  : "Try a different filter to see the rest of your orders."}
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <>
              <div
                className={`space-y-4 transition-opacity ${
                  isFetching ? "opacity-60" : "opacity-100"
                }`}
              >
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              <p className="mt-6 text-center text-sm text-zinc-500">
                {total} {total === 1 ? "order" : "orders"}
                {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
              </p>

              {totalPages > 1 ? (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                />
              ) : null}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
