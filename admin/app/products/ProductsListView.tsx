"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProductsTable from "@/features/products/ProductsTable";
import ProductsControls from "@/features/products/ProductsControls";
import PauseProductModal from "@/features/products/PauseProductModal";
import type {
  AdminProductListItem,
  AdminShopRef,
  PaginatedMeta,
  ProductListParams,
  ProductStatusCounts,
} from "@/features/products/products.types";

/**
 * Interactive wrapper around the products list.
 *
 * The server component `page` fetches the initial data; this client component
 * owns the transitions: status tabs, filters, pagination, and the pause action.
 * After a successful pause it re-pushes the current URL — a soft navigation
 * that re-runs the parent Server Component, refetching with the repaired
 * cookie, without a full reload or a login flash.
 */
export default function ProductsListView({
  products,
  meta,
  counts,
  shops,
  categories,
  query,
}: {
  products: readonly AdminProductListItem[];
  meta: PaginatedMeta;
  counts: ProductStatusCounts | undefined;
  shops: readonly AdminShopRef[];
  categories: readonly AdminShopRef[];
  query: ProductListParams;
}) {
  const router = useRouter();
  const [pauseTarget, setPauseTarget] = useState<AdminProductListItem | null>(
    null,
  );

  /** After a pause, refresh the list in-place via soft navigation. */
  const refresh = () => {
    const url = window.location.pathname + window.location.search;
    router.push(url, { scroll: false });
  };

  return (
    <>
      <ProductsControls
        meta={meta}
        counts={counts}
        shops={shops}
        categories={categories}
      />

      <Card className="overflow-hidden p-0">
        {products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="No products match the current filters."
            icon={<Inbox className="size-5" />}
            action={isProductFiltered(query) ? <ClearFiltersLink /> : undefined}
            className="m-4 border-0"
          />
        ) : (
          <ProductsTable products={products} onPause={setPauseTarget} />
        )}
      </Card>

      {pauseTarget ? (
        <PauseProductModal
          product={pauseTarget}
          onClose={() => setPauseTarget(null)}
          onPaused={refresh}
        />
      ) : null}
    </>
  );
}

/** `Clear filters` link — an `<a>` so it works before hydration. */
function ClearFiltersLink() {
  return (
    <Link
      href="/products"
      className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto"
    >
      Clear filters
    </Link>
  );
}

function isProductFiltered(query: ProductListParams): boolean {
  return Boolean(
    query.status || query.shopId || query.categoryId || query.search,
  );
}
