"use client";

import { useEffect, useState } from "react";
import ShopCard from "../components/ShopCard";
import ShopFilters from "../components/ShopFilters";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { useShops, useShopCategories } from "../../lib/shop/queries";
import type { ShopSortOption } from "../../types/shop";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState<ShopSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useShopCategories();
  const categories = categoriesData ?? [];

  const { data, isLoading, isFetching, isError, refetch } = useShops({
    page: currentPage,
    search: debouncedSearch,
    categoryId,
    sortBy,
  });

  const shops = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Any change to the result set must reset pagination, otherwise the user can
  // land on a page that does not exist for the new filters. This is done in
  // the handlers below rather than an effect, which would cause a second
  // render pass for something we already know synchronously.
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: ShopSortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setCurrentPage(1);
  };

  // If filters shrink the result set below the current page, walk back to the
  // last page that actually has results. Adjusting state during render is the
  // documented React pattern for this; an effect would flash an empty list.
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
              Shops
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Browse all shops
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Search, filter by category, or sort shops by creation date to find
              the perfect place to shop.
            </p>
          </div>

          <ShopFilters
            search={search}
            onSearchChange={handleSearchChange}
            categoryId={categoryId}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            isFetching={isFetching}
          />
        </div>

        {isLoading || isCategoriesLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 shadow-sm">
            <LoadingSpinner size="lg" color="dark" />
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-base font-semibold text-red-800">
              Couldn&apos;t load shops
            </p>
            <p className="mt-2 text-sm text-red-700">
              Something went wrong while fetching shops. Please try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 cursor-pointer rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        ) : shops.length > 0 ? (
          <>
            <div
              className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {shops.map((shop) => (
                <ShopCard key={shop.id} {...shop} />
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500">
              {total} {total === 1 ? "shop" : "shops"}
              {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
            </p>

            {totalPages > 1 ? (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPage={setCurrentPage}
              />
            ) : null}
          </>
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-zinc-600 shadow-sm">
            <p className="text-lg font-semibold text-zinc-900">
              No shops found
            </p>
            <p className="mt-2 text-sm">
              Try adjusting your search or category filter.
            </p>
            {search || categoryId ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 cursor-pointer rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
