"use client";

import type { FormEvent } from "react";
import { Search, X } from "lucide-react";
import FilterBar, { FilterBarGrid } from "@/components/ui/FilterBar";
import { SelectField, FIELD_CLASS } from "@/components/layout/Form";
import { cn } from "@/lib/cn";
import {
  SORT_OPTIONS,
  toSortValue,
  type ProductFiltersController,
} from "./useProductFilters";
import type { AdminShopRef } from "./products.types";

/**
 * Search, shop, category and sort for the admin product list.
 *
 * Every control writes to the URL through {@link ProductFiltersController};
 * none holds its own applied value, which is what lets the server component
 * re-read `searchParams` and refetch.
 *
 * The grid order matters — see `FilterBarGrid` docs: search, shop, category,
 * then sort.
 */
export default function ProductFilters({
  controller,
  shops,
  categories,
}: {
  controller: ProductFiltersController;
  shops: readonly AdminShopRef[];
  categories: readonly AdminShopRef[];
}) {
  const {
    filters,
    searchDraft,
    onSearchDraftChange,
    commitSearch,
    setFilters,
    clearFilters,
    activeFilterCount,
  } = controller;

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commitSearch();
  };

  return (
    <FilterBar
      legend="Filter products"
      activeCount={activeFilterCount}
      onClear={clearFilters}
      className="mb-4"
    >
      <FilterBarGrid>
        {/* ---------- Search ---------- */}
        <form
          onSubmit={onSearchSubmit}
          role="search"
          className="sm:col-span-2 xl:col-span-1"
        >
          <label
            htmlFor="products-search"
            className="block text-sm font-medium text-slate-700"
          >
            Search
          </label>

          <div className="relative max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 mt-1.5 size-4 -translate-y-1/2 text-slate-400"
            />

            <input
              id="products-search"
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Product name"
              autoComplete="off"
              className={cn(FIELD_CLASS, "pl-9", searchDraft ? "pr-9" : "pr-3")}
            />

            {searchDraft ? (
              <button
                type="button"
                onClick={() => onSearchDraftChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 mt-1.5 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </form>

        {/* ---------- Shop ---------- */}
        <SelectField
          label="Shop"
          id="products-shop"
          value={filters.shopId ?? ""}
          onChange={(event) =>
            setFilters({ shopId: event.target.value || undefined })
          }
        >
          <option value="">All shops</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </SelectField>

        {/* ---------- Category ---------- */}
        <SelectField
          label="Category"
          id="products-category"
          value={filters.categoryId ?? ""}
          onChange={(event) =>
            setFilters({ categoryId: event.target.value || undefined })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>

        {/* ---------- Sort ---------- */}
        <SelectField
          label="Sort"
          id="products-sort"
          value={toSortValue(filters.sortBy, filters.sortOrder)}
          onChange={(event) => {
            const option = SORT_OPTIONS.find(
              (candidate) => candidate.value === event.target.value,
            );
            setFilters({
              sortBy: option?.sortBy,
              sortOrder: option?.sortOrder,
            });
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </FilterBarGrid>
    </FilterBar>
  );
}
