"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_SIZE_OPTIONS } from "@/components/ui/Pagination";
import type { OrderSortField, OrderStatus, SortOrder } from "./orders.types";

/** How long typing must pause before the search is committed to the URL. */
export const SEARCH_DEBOUNCE_MS = 400;

/** Server default; also the only limit not written into the URL. */
const DEFAULT_LIMIT = 20;

const STATUS_VALUES = ["PENDING", "PAID", "PAYMENT_FAILED", "CANCELLED"] as const satisfies readonly OrderStatus[];
const SORT_BY_VALUES = ["createdAt", "totalAmount"] as const satisfies readonly OrderSortField[];
const SORT_ORDER_VALUES = ["asc", "desc"] as const satisfies readonly SortOrder[];

/**
 * Everything the list page can filter by, flattened out of the URL.
 *
 * The URL is the single source of truth. Nothing lives in React state that is
 * not derived from it, which is what makes a shared link reproduce exactly
 * what the sender was looking at and makes the back button work.
 *
 * Unrecognised or malformed values are dropped rather than forwarded to the
 * API. The server validates with `class-validator` and answers a bad
 * `limit=abc` or `status=NOPE` with a 400 — and because the list and the error
 * boundary are the same render, that blanks the entire page instead of just
 * the offending control.
 */
export interface OrderFilterState {
  readonly status?: OrderStatus;
  readonly shopId?: string;
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly sortBy?: OrderSortField;
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

/** Reads a param, trimming and discarding empty strings. */
function readText(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

/** Parses the raw query string into a validated {@link OrderFilterState}. */
export function parseOrderFilters(params: URLSearchParams): OrderFilterState {
  const status = readEnum(params, "status", STATUS_VALUES);
  const sortBy = readEnum(params, "sortBy", SORT_BY_VALUES);
  const sortOrder = readEnum(params, "sortOrder", SORT_ORDER_VALUES);
  const shopId = readText(params, "shopId");
  const search = readText(params, "search");
  const dateFrom = readText(params, "dateFrom");
  const dateTo = readText(params, "dateTo");

  const rawPage = Number(params.get("page"));
  const rawLimit = Number(params.get("limit"));

  return {
    ...(status ? { status } : {}),
    ...(shopId ? { shopId } : {}),
    ...(search ? { search } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(sortOrder ? { sortOrder } : {}),
    // Defaults mirror the server's own, so the first request the server makes
    // and the URL agree before anything has been written back.
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
    limit: (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawLimit)
      ? rawLimit
      : DEFAULT_LIMIT,
  };
}

/** How many filters are currently narrowing the list. */
export function countActiveFilters(filters: OrderFilterState): number {
  return [filters.status, filters.shopId, filters.search, filters.dateFrom, filters.dateTo].filter(
    Boolean,
  ).length;
}

/**
 * Read/write access to the list filters, with the URL as the only store.
 *
 * ## Why `push` rather than `replace`
 *
 * Every committed change is a history entry, so the back button undoes one
 * filter at a time. Replacing instead would make the first press of back leave
 * the page entirely, which is the usual complaint about lists that are "not
 * back-button friendly". The one exception is the debounced search: a single
 * search can be many keystrokes, but committing it as one entry is what keeps
 * back from stepping through `"a"`, `"ap"`, `"app"` — so the search is pushed
 * only once, on commit.
 *
 * ## Why `scroll: false`
 *
 * Pushing a new `searchParams` re-renders the server component. Default
 * Next.js behaviour would scroll to the top, which throws away the reader's
 * position in a long list every time they turn a page. The server component is
 * wrapped in `<Suspense>`, so the previous list stays mounted and visible while
 * the new page streams in.
 */
export function useOrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseOrderFilters(searchParams), [searchParams]);

  /** Builds the next query string from a patch, dropping empty values. */
  const buildQuery = useCallback(
    (patch: Partial<OrderFilterState>, opts?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      // Any filter change invalidates the page number: page 7 of the unfiltered
      // list means nothing against page 2 of the filtered one.
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
    (patch: Partial<OrderFilterState>, opts?: { keepPage?: boolean }) => {
      navigate(buildQuery(patch, opts));
    },
    [navigate, buildQuery],
  );

  /**
   * Clears filters but keeps the chosen page size.
   *
   * Page size is a viewing preference rather than a filter — clearing a status
   * tab should not throw away someone who always works in 50-row pages.
   */
  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (filters.limit !== DEFAULT_LIMIT) next.set("limit", String(filters.limit));
    navigate(next);
  }, [navigate, filters.limit]);

  // ---------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------

  // The box is controlled by local state while typing so it never lags behind
  // the keystroke, and is committed to the URL only after the pause.
  const committedSearch = filters.search ?? "";
  const [searchDraft, setSearchDraft] = useState(committedSearch);

  // Re-sync when the URL changes from outside (back button, "clear filters", a
  // pasted link) so the box never displays a value that is not in effect.
  //
  // Done during render rather than in an effect, which is React's documented
  // "adjusting state when a prop changes" pattern: `searchDraft` is derived
  // from `committedSearch` whenever the latter moves underneath it. An effect
  // here would render once with the stale value first — a visible flash of the
  // old query — and then re-render, and it is explicitly discouraged for
  // exactly this reason.
  const [syncedSearch, setSyncedSearch] = useState(committedSearch);
  if (committedSearch !== syncedSearch) {
    setSyncedSearch(committedSearch);
    setSearchDraft(committedSearch);
  }

  // The pending timer handle. A ref rather than state because changing it must
  // not re-render, and because a stale-closure timer is exactly the kind of bug
  // that re-pushes a URL from a component that has already moved on.
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

  // Cancel on unmount so a pending debounce cannot fire after the component is
  // gone and navigate from a dead component.
  useEffect(() => cancelPendingSearch, [cancelPendingSearch]);

  /**
   * Commits immediately, for the Enter key and for the clear button.
   *
   * The effect is skipped when the draft already matches the URL, so pressing
   * Enter twice (or Enter on an unchanged value) does not stack up duplicate
   * history entries pointing at the same query.
   */
  const commitSearch = useCallback(() => {
    cancelPendingSearch();
    const trimmed = searchDraft.trim();
    if (trimmed === committedSearch) return;
    setFilters({ search: trimmed || undefined });
  }, [cancelPendingSearch, searchDraft, committedSearch, setFilters]);

  return {
    filters,
    searchDraft,
    onSearchDraftChange,
    commitSearch,
    setFilters,
    clearFilters,
    activeFilterCount: countActiveFilters(filters),
  };
}

export type OrderFiltersController = ReturnType<typeof useOrderFilters>;

/**
 * Select options for the sort control.
 *
 * The first entry is the empty value — a label plus an explicit "default"
 * option, so the control reads as a labelled dropdown rather than silently
 * having a hidden default. Its `sortBy`/`sortOrder` are `undefined`, which
 * `buildQuery` deletes from the URL, leaving it to the server's own default.
 */
export const SORT_OPTIONS = [
  { value: "", label: "Default order", sortBy: undefined, sortOrder: undefined },
  { value: "createdAt:desc", label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  { value: "createdAt:asc", label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
  { value: "totalAmount:desc", label: "Highest total", sortBy: "totalAmount", sortOrder: "desc" },
  { value: "totalAmount:asc", label: "Lowest total", sortBy: "totalAmount", sortOrder: "asc" },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  sortBy: OrderSortField | undefined;
  sortOrder: SortOrder | undefined;
}>;

/** Encodes the two sort params into the single select's value. */
export function toSortValue(
  sortBy: OrderSortField | undefined,
  sortOrder: SortOrder | undefined,
): string {
  if (!sortBy || !sortOrder) return "";
  return `${sortBy}:${sortOrder}`;
}
