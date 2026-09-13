"use client";

import ProductCard from "./ProductCard";
import { useGetPopularProducts } from "../../lib/product/queries";
import { Spinner } from "./Spinner";

export default function ProductsList() {
  const { data: products, isLoading } = useGetPopularProducts();

  if (isLoading) {
    return <Spinner />;
  }
  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Popular products
          </h2>
          <p className="text-sm text-zinc-600">Top picks this week</p>
        </div>

        <div className="grid gap-4 px-4 sm:px-6 lg:px-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              images={p?.imageUrl ? p?.imageUrl : ["/placeholder-product.jpg"]}
              name={p.name}
              shopName={p.shop?.name}
              rating={p.shop?.rating ?? 5}
              sold={0}
              onDelete={() => {}}
              isDeleting={false}
              productUser={p?.shop?.user}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
