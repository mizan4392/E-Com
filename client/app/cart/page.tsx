"use client";

import Link from "next/link";
import { toast } from "sonner";
import useCartStore from "../../stores/cartStore";
import { formatPrice } from "../../util/functions";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotal());

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-4xl">
              🛒
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
              Looks like you haven&apos;t added anything yet. Explore our
              products and find something you love.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav className="mb-8 text-sm text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-zinc-900">
            Home
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-zinc-900">Cart</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Shopping Cart
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {items.length} {items.length === 1 ? "item" : "items"} ·{" "}
              {totalQuantity} {totalQuantity === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCart();
              toast.success("Cart cleared");
            }}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Clear cart
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Cart items */}
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <ul className="flex flex-col">
              {items.map((item, index) => (
                <li
                  key={item.product.id}
                  className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${
                    index !== 0 ? "border-t border-zinc-100" : ""
                  }`}
                >
                  {/* Product image */}
                  <Link
                    href={`/product/${item.product.id}`}
                    className="relative block h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:h-24 sm:w-24"
                  >
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">
                        🛍️
                      </div>
                    )}
                  </Link>

                  {/* Product info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="truncate text-base font-semibold text-zinc-900 transition hover:text-amber-700"
                    >
                      {item.product.name || "Product"}
                    </Link>
                    {item.product.shopName ? (
                      <p className="text-sm text-zinc-500">
                        Sold by{" "}
                        <span className="font-medium text-zinc-700">
                          {item.product.shopName}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity + remove */}
                  <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                    <div className="flex h-11 items-center rounded-xl border border-zinc-300 bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          updateQuantity(item.product.id, item.quantity - 1);
                          if (item.quantity - 1 <= 0) {
                            toast.success("Removed from cart");
                          }
                        }}
                        className="flex h-full w-10 items-center justify-center text-lg text-zinc-500 transition hover:text-zinc-900"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="flex h-full w-10 items-center justify-center text-lg text-zinc-500 transition hover:text-zinc-900"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.product.id);
                        toast.success("Removed from cart");
                      }}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-4">
              <p className="text-sm text-zinc-500">
                {items.length} {items.length === 1 ? "item" : "items"} in cart
              </p>
              <span className="text-sm font-semibold text-zinc-900">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold tracking-tight">
              Order Summary
            </h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <dt>Subtotal</dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <dt>Shipping</dt>
                <dd className="font-medium text-zinc-900">Free</dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="mt-6 h-12 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Checkout
            </button>
            <p className="mt-3 text-center text-xs text-zinc-400">
              Shipping & taxes calculated at checkout
            </p>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <Link
                href="/shop"
                className="flex w-full items-center justify-center gap-2 text-sm font-medium text-zinc-700 transition hover:text-zinc-900"
              >
                <span aria-hidden>←</span> Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
