"use client";
import ProductCard from "./ProductCard";
import { Product } from "../../types/shop";
import { PaginatedResult } from "../../types/common";
import Pagination from "./Pagination";
import { useDeleteProduct } from "../../lib/product/mutation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const onDeleteProduct = (p: Product) => {
    deleteProduct.mutate(p?.id, {
      onSuccess: () => {
        toast.success("Product Deleted Successfully");
        queryClient.invalidateQueries({
          queryKey: ["shopProducts", p?.shop?.id, page],
        });
      },
    });
  };

  if (items?.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          No products found
        </h2>
        <p className="text-sm text-zinc-600">
          You have not added any products yet. Start by adding a new product to
          your shop.
        </p>
      </div>
    );
  }

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
                images={
                  p?.imageUrl ? p?.imageUrl : ["/placeholder-product.jpg"]
                }
                name={p.name}
                shopName={p.shop?.name}
                rating={p.shop?.rating ?? 5}
                sold={0}
                onDelete={() => onDeleteProduct(p)}
                isDeleting={deleteProduct?.isPending}
                productUser={p?.shop?.user}
              />
            ))}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPage={onPageChange} />
      )}
    </div>
  );
}
