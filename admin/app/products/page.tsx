import { Suspense } from "react";
import Link from "next/link";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import ProductsListView from "./ProductsListView";
import { ProductsBodySkeleton } from "@/features/products/ProductsPageSkeleton";
import {
  fetchProducts,
  fetchProductStatusCounts,
  fetchProductShops,
  fetchProductCategories,
} from "@/features/products/products.api";
import type {
  ProductListParams,
  ProductSortField,
  ProductStatus,
  SortOrder,
} from "@/features/products/products.types";

/** The Promise Next.js 16 hands to a page for its query string. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Admin products list — a Server Component.
 *
 * Data is fetched here, on the server, through `serverApiFetch` (cookie-based),
 * so no admin token crosses into the page bundle. The result streams to the
 * browser; the interactive controls (tabs, filters, pause modal) live in
 * {@link ProductsListView}, a client component that only swaps the URL query
 * string and re-renders this Server Component via soft navigation — no full
 * reload, no re-issued auth, no login flash.
 */
export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Browse every product across your shops. Pause a product to hide it from the storefront."
      />

      <Suspense fallback={<ProductsBodySkeleton />}>
        <ProductsData searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

/**
 * The data-dependent region: tabs, filters, table and pagination.
 *
 * Split from the shell so `Suspense` has a real boundary to suspend on; the
 * header renders immediately while fresh rows stream in.
 */
async function ProductsData({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = toProductListParams(params);

  // `allSettled` rather than `all`: the shops and categories lists only
  // populate dropdowns, so a failure there should cost the admin that filter
  // rather than the whole table. The products request is the one that must
  // succeed, and it is checked explicitly below.
  const [productsResult, countsResult, shopsResult, categoriesResult] =
    await Promise.allSettled([
      fetchProducts(query),
      fetchProductStatusCounts({
        shopId: query.shopId,
        categoryId: query.categoryId,
        search: query.search,
      }),
      fetchProductShops(),
      fetchProductCategories(),
    ]);

  if (productsResult.status === "rejected") {
    throw productsResult.reason;
  }

  const { data: products, meta } = productsResult.value;
  const counts =
    countsResult.status === "fulfilled" ? countsResult.value : undefined;
  const shops = shopsResult.status === "fulfilled" ? shopsResult.value : [];
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  return (
    <ProductsListView
      products={products}
      meta={meta}
      counts={counts}
      shops={shops}
      categories={categories}
      query={query}
    />
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

/**
 * Flattens `searchParams` into the list query.
 *
 * Each key is read individually rather than spread, because a repeated
 * `?status=ACTIVE&status=PAUSED` arrives as an array; forwarding that straight
 * would serialise as a comma-joined string and 400. Taking the first value
 * turns a malformed link into a working one.
 *
 * Enum values are forwarded without re-checking — `useProductFilters` owns
 * parsing for the interactive controls, and a hand-edited or stale link is
 * caught by the server's DTO validation and surfaced through `error.tsx`.
 */
function toProductListParams(
  params: Record<string, string | string[] | undefined>,
): ProductListParams {
  const first = (key: string): string | undefined => {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    const trimmed = single?.trim();
    return trimmed ? trimmed : undefined;
  };

  const page = Number(first("page"));
  const limit = Number(first("limit"));

  return {
    ...(first("status") ? { status: first("status") as ProductStatus } : {}),
    ...(first("shopId") ? { shopId: first("shopId") } : {}),
    ...(first("categoryId") ? { categoryId: first("categoryId") } : {}),
    ...(first("search") ? { search: first("search") } : {}),
    ...(first("sortBy") ? { sortBy: first("sortBy") as ProductSortField } : {}),
    ...(first("sortOrder")
      ? { sortOrder: first("sortOrder") as SortOrder }
      : {}),
    ...(Number.isInteger(page) && page >= 1 ? { page } : {}),
    ...(Number.isInteger(limit) && limit > 0 ? { limit } : {}),
  };
}

export { ClearFiltersLink };
