"use client";
import ProductCard from "./ProductCard";
import { Product } from "../../types/shop";
import { PaginatedResult } from "../../types/common";
import Pagination from "./Pagination";

type Props = {
  products?: PaginatedResult<Product>;
  loading?: boolean;
  page: number;
  onPageChange: (p: number) => void;
};

export default function ProductGrid({
  products,
  loading,
  page,
  onPageChange,
}: Props) {
  const items = products?.data ?? [];
  const totalPages = products?.totalPages ?? 1;

  return (
    <div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-48 w-full animate-pulse rounded-2xl bg-white"
              />
            ))
          : items.map((p) => (
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

      <Pagination page={page} totalPages={totalPages} onPage={onPageChange} />
    </div>
  );
}
