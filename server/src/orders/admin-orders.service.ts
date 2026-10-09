import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminOrdersRepository,
  type AdminOrderFilters,
  type RawAdminOrderDetailRow,
  type RawAdminOrderItem,
  type RawAdminOrderRow,
} from './admin-orders.repository';
import {
  buildPaginatedResponse,
  normalizePagination,
  type PaginatedResponse,
} from '../common/pagination-query.dto';
import {
  AdminOrderSortField,
  SortOrder,
  type AdminOrderDetailDto,
  type AdminOrderItemDto,
  type AdminOrderListItemDto,
  type AdminOrderShopRef,
  type AdminOrderUserRef,
  type ListAdminOrdersQueryDto,
  type OrderStatusCountsDto,
  type OrderStatusCountsQueryDto,
} from './dto/admin-orders.dto';
import { ORDER_STATUS_DISPLAY_ORDER, OrderStatus } from './order.entity';
import { DeliveryStatus } from './order-item.entity';

/**
 * Read-only admin view over orders.
 *
 * All querying lives in {@link AdminOrdersRepository}; this layer owns the
 * HTTP-shaped concerns — pagination arithmetic, the status-count envelope and
 * mapping raw SQL rows into the DTOs the client contract promises. Keeping the
 * mapping here is what guarantees a column can never leak into the response by
 * accident: nothing is spread through from the entity.
 */
@Injectable()
export class AdminOrdersService {
  constructor(private readonly repository: AdminOrdersRepository) {}

  /**
   * Paginated order list for the admin panel.
   *
   * The page query and the count query are issued **concurrently**. They are
   * independent, and running them in parallel halves the latency of the
   * endpoint against the single round trip that a repository `getManyAndCount`
   * would cost. (TypeORM issues those two sequentially inside one call, so it
   * is a real saving, not a stylistic one.)
   */
  async listOrders(
    query: ListAdminOrdersQueryDto,
  ): Promise<PaginatedResponse<AdminOrderListItemDto>> {
    const filters = toFilters(query);
    const paging = normalizePagination(query);

    const [rows, total] = await Promise.all([
      this.repository.findPage(filters, paging, query.sortBy, query.sortOrder),
      this.repository.countOrders(filters),
    ]);

    return buildPaginatedResponse(rows.map(toListItemDto), total, paging);
  }

  /**
   * Per-status tallies for the list's status tabs.
   *
   * `ALL` is the ungrouped total under the same filters, so the badge on the
   * "All" tab and the badge on "Paid" always describe one consistent result
   * set. Every status key is present even at zero, so the tab UI can read
   * `counts[status]` without a null check.
   *
   * The `status` filter is intentionally not applied here — a breakdown of a
   * single status is a tautology — but `shopId`, the date range and `search`
   * are, so the badges follow whatever the admin has narrowed to.
   */
  async getStatusCounts(
    query: OrderStatusCountsQueryDto,
  ): Promise<OrderStatusCountsDto> {
    const filters: AdminOrderFilters = {
      shopId: query.shopId,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    const [buckets, all] = await Promise.all([
      this.repository.countByStatus(filters),
      this.repository.countOrders(filters),
    ]);

    const counts: OrderStatusCountsDto = {
      ALL: all,
      PENDING: 0,
      PAID: 0,
      PAYMENT_FAILED: 0,
      CANCELLED: 0,
    };

    for (const bucket of buckets) {
      // Guards against a status the DTO enum does not know about (e.g. a row
      // written by a newer deploy) instead of writing an arbitrary key.
      if (bucket.status in counts) {
        counts[bucket.status] = toCount(bucket.count);
      }
    }

    return counts;
  }

  /**
   * Full detail for one order.
   *
   * @throws NotFoundException when no order has this id — including when the
   * id is well-formed but belongs to nothing, which returns 404 rather than an
   * empty body so the client can distinguish "gone" from "empty".
   */
  async getOrderDetail(id: string): Promise<AdminOrderDetailDto> {
    const row = await this.repository.findDetailById(id);

    if (!row) {
      throw new NotFoundException('Order not found');
    }

    return toDetailDto(row);
  }
}

/** Projects the DTO-accepted query onto the repository's filter shape. */
function toFilters(query: ListAdminOrdersQueryDto): AdminOrderFilters {
  return {
    status: query.status,
    shopId: query.shopId,
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
}

/**
 * Postgres returns `bigint`/numeric aggregates as strings to avoid precision
 * loss. Coerces at the boundary so the DTO contract is genuinely numeric and
 * the client never has to know about the driver's representation.
 */
function toCount(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** `"Ada  Lovelace"` → `"Ada Lovelace"`; `""` → `"Unknown customer"`. */
export function formatCustomerName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const full = `${firstName ?? ''} ${lastName ?? ''}`
    .trim()
    .replace(/\s+/g, ' ');
  return full || 'Unknown customer';
}

function toShopRef(row: {
  shopId: string | null;
  shopName: string | null;
}): AdminOrderShopRef | null {
  if (!row.shopId) return null;
  return { id: row.shopId, name: row.shopName || 'Deleted shop' };
}

function toUserRef(row: {
  userId: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
}): AdminOrderUserRef | null {
  if (!row.userId) return null;
  return {
    id: row.userId,
    name: formatCustomerName(row.userFirstName, row.userLastName),
    email: row.userEmail || '',
  };
}

/** Maps one projected row to the lean list DTO. */
export function toListItemDto(row: RawAdminOrderRow): AdminOrderListItemDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalAmount: Number(row.amountTotal ?? 0),
    currency: row.currency || 'usd',
    itemCount: toCount(row.itemCount),
    createdAt: new Date(row.createdAt).toISOString(),
    shop: toShopRef(row),
    shopCount: toCount(row.shopCount),
    user: toUserRef(row),
  };
}

function toItemDto(raw: RawAdminOrderItem): AdminOrderItemDto {
  return {
    id: raw.id,
    productId: raw.productId ?? null,
    productName: raw.name,
    imageUrl: raw.imageUrl ?? null,
    unitPrice: Number(raw.price ?? 0),
    quantity: toCount(raw.quantity),
    lineTotal: Number(raw.lineTotal ?? 0),
    shopId: raw.shopId ?? null,
    shopName: raw.shopName ?? null,
    deliveryStatus: raw.deliveryStatus ?? DeliveryStatus.PENDING,
  };
}

/** Maps the single-row detail projection to the detail DTO. */
export function toDetailDto(row: RawAdminOrderDetailRow): AdminOrderDetailDto {
  const items = Array.isArray(row.items) ? row.items.map(toItemDto) : [];

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalAmount: Number(row.amountTotal ?? 0),
    currency: row.currency || 'usd',
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    shopCount: toCount(row.shopCount),
    shop: toShopRef(row),
    user: row.userId
      ? {
          id: row.userId,
          name: formatCustomerName(row.userFirstName, row.userLastName),
          email: row.userEmail || '',
          // Profile phone, falling back to the phone captured on the order.
          // The delivery contact can differ from the account holder's, and the
          // detail view is exactly where an admin needs to reach them.
          phone: row.userPhone || row.deliveryPhone || null,
        }
      : null,
    items,
    itemCount: items.length > 0 ? items.length : toCount(row.itemCount),
    totalQuantity: toCount(row.totalQuantity),
    deliveryAddress: row.deliveryAddress ?? null,
    deliveryPhone: row.deliveryPhone ?? null,
    buyerConfirmedAt: row.buyerConfirmedAt
      ? new Date(row.buyerConfirmedAt).toISOString()
      : null,
  };
}

/**
 * Status keys guaranteed to exist on a {@link OrderStatusCountsDto}.
 *
 * Exported so the seeder and tests can assert against the same list the UI
 * renders tabs for.
 */
export const ADMIN_ORDER_STATUS_KEYS: readonly OrderStatus[] =
  ORDER_STATUS_DISPLAY_ORDER;

/** Re-exported so callers do not need to reach into the entity module. */
export { AdminOrderSortField, SortOrder, OrderStatus };
