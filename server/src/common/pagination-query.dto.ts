import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Hard ceiling on how many rows one page may return.
 *
 * Capping server-side matters more than the client asking politely: an
 * unbounded `limit` lets a single request ask for the entire table, which
 * turns the list endpoint into a denial-of-service primitive as the orders
 * table grows.
 */
export const MAX_PAGE_SIZE = 100;

/** Default page size when the caller does not send `limit`. */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Reusable page/limit query parameters.
 *
 * Inherited by every paginated query DTO, so `Products`, `Shops` and `Orders`
 * all speak the same pagination language and a change to the cap (or to the
 * defaults) propagates everywhere at once.
 *
 * `page` is 1-based, matching what the UI shows the user ("Page 2 of 5").
 * Internally it becomes a SQL `OFFSET`, computed by {@link normalizePagination}.
 */
export class PaginationQueryDto {
  /** 1-based page number. Clamped to >= 1. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Rows per page. Validated to 1..{@link MAX_PAGE_SIZE}. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

/** Pagination envelope returned alongside every list payload. */
export interface PaginationMeta {
  /** Page actually returned (may exceed `totalPages` for a stale bookmark). */
  page: number;
  /** Rows per page after clamping. */
  limit: number;
  /** Total rows matching the filter, across every page. */
  total: number;
  /** Number of pages at this `limit`. Never below 1. */
  totalPages: number;
  /** Whether a further page exists. Lets the UI disable "Next". */
  hasNextPage: boolean;
  /** Whether a previous page exists. Lets the UI disable "Prev". */
  hasPrevPage: boolean;
}

/**
 * Standard list response shape: `{ data: T[], meta: PaginationMeta }`.
 *
 * `data` + `meta` (rather than Nest's default bare array) is what lets the
 * client render "Page 2 of 7 · 137 results" without a second counting call.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Offset arithmetic shared by every paginated query. */
export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Clamps caller-supplied page/limit into safe values and derives the SQL
 * `OFFSET`.
 *
 * Clamping rather than rejecting is deliberate. `page=999999` on a collection
 * with 7 pages is a stale bookmark, not an attack, and returning an empty page
 * alongside the true `totalPages` is more useful to the user than a 400. A
 * non-numeric or negative value falls back to the default, and `limit` is
 * hard-capped at {@link MAX_PAGE_SIZE} so it cannot be inflated past the
 * ceiling even if DTO validation is bypassed.
 */
export function normalizePagination(
  query: Pick<PaginationQueryDto, 'page' | 'limit'>,
): NormalizedPagination {
  const parsedLimit = Number(query.limit);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : DEFAULT_PAGE_SIZE),
  );

  const parsedPage = Number(query.page);
  const page = Math.max(1, Number.isFinite(parsedPage) ? parsedPage : 1);

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Builds the response envelope from a page of rows and the total match count.
 *
 * `totalPages` is `Math.ceil(total / limit)` but never below 1: an empty result
 * set still reports "page 1 of 1", so the UI never renders a nonsensical
 * "page 1 of 0" pagination footer.
 *
 * @param rows   The page of entities that was actually fetched.
 * @param total  Total rows matching the filter, across all pages.
 * @param paging Normalised page/limit, as returned by `normalizePagination`.
 */
export function buildPaginatedResponse<T>(
  rows: readonly T[],
  total: number,
  paging: NormalizedPagination,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / paging.limit));

  return {
    data: rows as T[],
    meta: {
      page: paging.page,
      limit: paging.limit,
      total,
      totalPages,
      hasNextPage: paging.page < totalPages,
      hasPrevPage: paging.page > 1,
    },
  };
}
