"use client";

import type { FormEvent } from "react";
import { Search, X } from "lucide-react";
import FilterBar, { FilterBarGrid } from "@/components/ui/FilterBar";
import { TextField, SelectField, FIELD_CLASS } from "@/components/layout/Form";
import { cn } from "@/lib/cn";
import {
  SORT_OPTIONS,
  toSortValue,
  type OrderFiltersController,
} from "./useOrderFilters";
import type { AdminOrderShopRef } from "./orders.types";

/**
 * Search, shop, date range and sort.
 *
 * Every control writes to the URL through {@link OrderFiltersController}; none
 * of them holds its own applied value. That is what lets the server component
 * re-read `searchParams` and refetch, and it is why this component needs no
 * loading state or `useEffect` of its own.
 *
 * ## The search box is the exception, briefly
 *
 * `search` is the only control that cannot write on every keystroke without a
 * request per character, so it keeps a local draft and commits after
 * {@link SEARCH_DEBOUNCE_MS}. Every other control commits immediately, because
 * a `<select>` or a date input has no intermediate states worth persisting.
 */
export default function OrderFilters({
  controller,
  shops,
}: {
  controller: OrderFiltersController;
  shops: readonly AdminOrderShopRef[];
}) {
  const { filters, searchDraft, onSearchDraftChange, commitSearch, setFilters, clearFilters, activeFilterCount } =
    controller;

  /** Enter commits straight away instead of waiting out the debounce. */
  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commitSearch();
  };

  return (
    <FilterBar activeCount={activeFilterCount} onClear={clearFilters} className="mb-4">
      <FilterBarGrid>
        {/* ---------- Search ---------- */}
        {/*
         * The visible label is what keeps this row aligned. The other controls
         * get their height from a real label above the input; with an `sr-only`
         * label the search box started at the label line and sat ~26px higher
         * than its neighbours. A visible label also beats a placeholder as the
         * accessible name, since a placeholder disappears once you type.
         *
         * Spans the full width from `sm` so the search box gets a usable line
         * of its own on the two-column layouts; `xl` sizes it with the
         * fractional tracks instead, where it needs no span.
         */}
        <form onSubmit={onSearchSubmit} role="search" className="sm:col-span-2 xl:col-span-1">
          <label
            htmlFor="orders-search"
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
              id="orders-search"
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Order # or email"
              autoComplete="off"
              className={cn(
                FIELD_CLASS,
                "pl-9",
                // Room for the clear button, and for the native `type="search"`
                // decoration, which would otherwise sit under the icon.
                searchDraft ? "pr-9" : "pr-3",
              )}
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
        {/*
         * No span: in the two-column layouts Shop and Sort sit side by side on
         * their own row, and from `xl` the fractional tracks size them. Giving
         * either a `col-span-2` made it claim the whole row on its own, which
         * is what turned a two-row bar into four.
         */}
        <SelectField
          label="Shop"
          id="orders-shop"
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

        {/* ---------- Sort ---------- */}
        {/*
         * Placed directly after Shop so the two-column layouts pair them on one
         * row. Between Shop and the date group they were separated by a cell
         * that claimed a full row of its own.
         */}
        <SelectField
          label="Sort"
          id="orders-sort"
          value={toSortValue(filters.sortBy, filters.sortOrder)}
          onChange={(event) => {
            const option = SORT_OPTIONS.find(
              (candidate) => candidate.value === event.target.value,
            );
            if (!option) return;

            // Assigning both at once: two separate writes would push two
            // history entries, so the back button would step through
            // "sort by date, descending" before undoing the sort at all.
            setFilters({
              sortBy: option.sortBy,
              sortOrder: option.sortOrder,
            });
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {/* ---------- Date range ---------- */}
        {/*
         * The two dates stay wrapped in one group so they remain a pair on
         * every layout. Left as two loose grid children they interleaved with
         * the other controls — From landed beside Shop and To beside Sort — so
         * the range read as two unrelated fields and nothing lined up. As one
         * full-width cell the pair holds together and the inner split keeps
         * each input half the group.
         *
         * `max`/`min` on the sibling is what stops a range being entered
         * backwards, and it is unaffected by the grouping.
         *
         * The group is last in the markup, which is what makes the two-column
         * layouts come out as three tidy rows — search, then Shop beside Sort,
         * then the pair. Sitting between the two selects instead, the pair
         * claimed a row of its own and split Shop and Sort apart.
         */}
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 xl:col-span-2">
          <TextField
            label="From"
            id="orders-date-from"
            type="date"
            value={filters.dateFrom ?? ""}
            max={filters.dateTo ?? undefined}
            onChange={(event) =>
              setFilters({ dateFrom: event.target.value || undefined })
            }
          />
          <TextField
            label="To"
            id="orders-date-to"
            type="date"
            value={filters.dateTo ?? ""}
            min={filters.dateFrom ?? undefined}
            onChange={(event) =>
              setFilters({ dateTo: event.target.value || undefined })
            }
          />
        </div>
      </FilterBarGrid>
    </FilterBar>
  );
}
