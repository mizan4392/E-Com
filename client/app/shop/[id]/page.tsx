"use client";
import { useState } from "react";
import { useShopDetails, useShopProducts } from "../../../lib/shop/queries";
import ProductCard from "../../components/ProductCard";
import { useParams } from "next/navigation";

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(1);

  const { data: shop, isLoading } = useShopDetails(id);
  const { data: products, isLoading: productsLoading } = useShopProducts(
    id,
    page,
  );

  const totalPages = products?.totalPages ?? 1;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-100">
          <div className="h-48 sm:h-72 lg:h-96 w-full">
            <img
              src={
                shop?.imageUrl
                  ? shop.imageUrl.startsWith("http")
                    ? shop.imageUrl
                    : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.imageUrl}`
                  : "/placeholder-shop.jpg"
              }
              alt={shop?.name || "shop banner"}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="absolute left-4 bottom-4 right-4 text-white">
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              {shop?.name ?? "Loading..."}
            </h1>
          </div>
        </div>

        {/* Shop info */}
        <section className="mt-4">
          <div className="w-full">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {shop?.name}
                    </h2>
                    {shop?.category ? (
                      <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                        {shop.category.name}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {shop?.description}
                  </p>
                  {shop?.address ? (
                    <p className="mt-2 text-sm text-zinc-500">{shop.address}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 ">
                  {shop?.user ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          shop.user.imageUrl
                            ? shop.user.imageUrl.startsWith("http")
                              ? shop.user.imageUrl
                              : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.user.imageUrl}`
                            : "/avatar-placeholder.png"
                        }
                        alt={`${shop.user.firstName} ${shop.user.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="text-sm text-zinc-600">
                        {shop.user.firstName} {shop.user.lastName}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Products</h3>
            <div className="text-sm text-zinc-600">
              Page {products?.currentPage ?? page} of {totalPages} •{" "}
              {products?.total ?? 0} items
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productsLoading || isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 w-full animate-pulse rounded-2xl bg-white"
                  />
                ))
              : products?.data?.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    images={[p.imageUrl || "/placeholder-product.jpg"]}
                    name={p.name}
                    shopName={p.shop?.name}
                    rating={p.shop?.rating ?? 5}
                    sold={0}
                  />
                ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((s) => Math.max(1, s - 1))}
              disabled={page <= 1}
              className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
            >
              Previous
            </button>

            <div className="text-sm text-zinc-700">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`mx-1 inline-flex items-center justify-center rounded-md px-3 py-1 text-sm ${
                      p === page ? "bg-zinc-900 text-white" : "bg-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
              disabled={page >= totalPages}
              className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
