"use client";

import type { ICategory, ShopSortOption } from "../../types/shop";

type Props = {
  /** Debounced search text that is actually sent to the API. */
  search: string;
  onSearchChange: (value: string) => void;
  /** Empty string means "all categories". */
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: ICategory[];
  sortBy: ShopSortOption;
  onSortChange: (value: ShopSortOption) => void;
  isFetching?: boolean;
};

const ALL_CATEGORIES = "__all__";

const sortOptions: { value: ShopSortOption; label: string }[] = [
  { value: "newest", label: "Newest created" },
  { value: "oldest", label: "Oldest created" },
];

export default function ShopFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  isFetching = false,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
      <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Search shops
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, location, or category"
          className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
      </label>

      <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Category
          {isFetching ? (
            <span className="text-[10px] font-medium normal-case tracking-normal text-amber-600">
              Updating…
            </span>
          ) : null}
        </span>
        <select
          value={categoryId || ALL_CATEGORIES}
          onChange={(event) =>
            onCategoryChange(
              event.target.value === ALL_CATEGORIES ? "" : event.target.value,
            )
          }
          className="w-full bg-transparent text-sm text-zinc-900 outline-none"
        >
          <option value={ALL_CATEGORIES}>All</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Sort by
        </span>
        <select
          value={sortBy}
          onChange={(event) =>
            onSortChange(event.target.value as ShopSortOption)
          }
          className="w-full bg-transparent text-sm text-zinc-900 outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
