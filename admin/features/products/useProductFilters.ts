"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_SIZE_OPTIONS } from "@/components/ui/Pagination";
import type {
  ProductStatus,
  ProductStatusTabValue,
  SortOrder,
  ProductSortField,
} from "./products.types";

/** How long typing must pause before the search is committed to the URL. */
export const SEARCH_DEBOUNCE_MS = 400;

/** Server default; also the only limit not written into the URL. */
const DEFAULT_LIMIT = 20;

const STATUS_VALUES = [
  "ACTIVE",
  "PAUSED",
] as const satisfies readonly ProductStatus[];
const SORT_BY_VALUES = [
  "createdAt",
  "price",
  "name",
] as const satisfies readonly ProductSortField[];
const SORT_ORDER_VALUES = [
  "asc",
  "desc",
] as const satisfies readonly SortOrder[];

/**
 * Everything the admin product list can filter by, flattened from the URL.
 *
 * The URL is the single source of truth — nothing here holds applied state
 * that the server component hasn't already seen.
 */
export interface ProductFilterState {
  readonly status?: ProductStatus;
  readonly shopId?: string;
  readonly categoryId?: string;
  readonly search?: string;
  readonly sortBy?: ProductSortField;
  readonly sortOrder?: SortOrder;
  readonly page: number;
  readonly limit: number;
}

function readEnum<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = params.get(key);
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function readText(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

/** Parses the raw query string into a validated {@link ProductFilterState}. */
export function parseProductFilters(
  params: URLSearchParams,
): ProductFilterState {
  const status = readEnum(params, "status", STATUS_VALUES);
  const sortBy = readEnum(params, "sortBy", SORT_BY_VALUES);
  const sortOrder = readEnum(params, "sortOrder", SORT_ORDER_VALUES);
  const shopId = readText(params, "shopId");
  const categoryId = readText(params, "categoryId");
  const search = readText(params, "search");

  const rawPage = Number(params.get("page"));
  const rawLimit = Number(params.get("limit"));

  return {
    ...(status ? { status } : {}),
    ...(shopId ? { shopId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { search } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(sortOrder ? { sortOrder } : {}),
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
    limit: (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawLimit)
      ? rawLimit
      : DEFAULT_LIMIT,
  };
}

/** How many filters are currently narrowing the list. */
export function countActiveFilters(filters: ProductFilterState): number {
  return [
    filters.status,
    filters.shopId,
    filters.categoryId,
    filters.search,
  ].filter(Boolean).length;
}

/**
 * Read/write access to the product list filters, URL as the only store.
 *
 * Mirrors {@link useOrderFilters}: `router.push` (not `replace`) so each change
 * is a history entry and the back button undoes one filter at a time.
 * `scroll: false` keeps the list's scroll position during pagination, since the
 * previous page stays mounted under `<Suspense>`.
 */
export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseProductFilters(searchParams),
    [searchParams],
  );

  const buildQuery = useCallback(
    (patch: Partial<ProductFilterState>, opts?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (!opts?.keepPage) next.set("page", "1");

      return next;
    },
    [searchParams],
  );

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setFilters = useCallback(
    (patch: Partial<ProductFilterState>, opts?: { keepPage?: boolean }) => {
      navigate(buildQuery(patch, opts));
    },
    [navigate, buildQuery],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (filters.limit !== DEFAULT_LIMIT) {
      next.set("limit", String(filters.limit));
    }
    navigate(next);
  }, [navigate, filters.limit]);

  // ---------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------

  const committedSearch = filters.search ?? "";
  const [searchDraft, setSearchDraft] = useState(committedSearch);

  const [syncedSearch, setSyncedSearch] = useState(committedSearch);
  if (committedSearch !== syncedSearch) {
    setSyncedSearch(committedSearch);
    setSearchDraft(committedSearch);
  }

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingSearch = useCallback(() => {
    if (searchTimer.current !== null) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
  }, []);

  const onSearchDraftChange = useCallback(
    (value: string) => {
      setSearchDraft(value);

      cancelPendingSearch();
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null;
        setFilters({ search: value.trim() || undefined });
      }, SEARCH_DEBOUNCE_MS);
    },
    [setFilters, cancelPendingSearch],
  );

  useEffect(() => cancelPendingSearch, [cancelPendingSearch]);

  const commitSearch = useCallback(() => {
    cancelPendingSearch();
    const trimmed = searchDraft.trim();
    if (trimmed === committedSearch) return;
    setFilters({ search: trimmed || undefined });
  }, [cancelPendingSearch, searchDraft, committedSearch, setFilters]);

  /** Switches the status tab without a full reload. */
  const setStatus = useCallback(
    (status: ProductStatusTabValue) => {
      setFilters({ status: status === "ALL" ? undefined : status });
    },
    [setFilters],
  );

  return {
    filters,
    searchDraft,
    onSearchDraftChange,
    commitSearch,
    setFilters,
    clearFilters,
    setStatus,
    activeFilterCount: countActiveFilters(filters),
  };
}

export type ProductFiltersController = ReturnType<typeof useProductFilters>;

/** Sort options: a default "no explicit sort" plus explicit choices. */
export const SORT_OPTIONS = [
  {
    value: "",
    label: "Default order",
    sortBy: undefined,
    sortOrder: undefined,
  },
  {
    value: "createdAt:desc",
    label: "Newest first",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt:asc",
    label: "Oldest first",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "price:desc",
    label: "Highest price",
    sortBy: "price",
    sortOrder: "desc",
  },
  {
    value: "price:asc",
    label: "Lowest price",
    sortBy: "price",
    sortOrder: "asc",
  },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  sortBy: ProductSortField | undefined;
  sortOrder: SortOrder | undefined;
}>;

/** Encodes the two sort params into the single select's value. */
export function toSortValue(
  sortBy: ProductSortField | undefined,
  sortOrder: SortOrder | undefined,
): string {
  if (!sortBy || !sortOrder) return "";
  return `${sortBy}:${sortOrder}`;
}
