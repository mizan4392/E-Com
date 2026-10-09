import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';
import { OrderStatus } from '../order.entity';

/** Columns the admin list may be sorted by. */
export enum AdminOrderSortField {
  CREATED_AT = 'createdAt',
  TOTAL_AMOUNT = 'totalAmount',
}

/** Sort direction. */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Query parameters for `GET /admin/orders`.
 *
 * Extends the shared {@link PaginationQueryDto} so page/limit behave
 * identically here and on any future Products/Shops list.
 */
export class ListAdminOrdersQueryDto extends PaginationQueryDto {
  /** Restrict to one payment status. Omit for "all". */
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
  })
  status?: OrderStatus;

  /**
   * Restrict to orders whose primary shop is this one.
   *
   * Matches `primaryShopId`, the denormalised cache on the order — not a join
   * through `order_items`. That keeps it an index lookup on
   * `IDX_orders_shop_created` instead of a semi-join against the far larger
   * line-item table. See `Order.primaryShopId` for why that column exists.
   */
  @IsOptional()
  @IsUUID()
  shopId?: string;

  /**
   * Free-text search across the order number and the customer's name/email.
   *
   * Bounded in length because it is matched with `startsWith`-style predicates
   * on indexed columns; an unbounded string is rejected rather than turned
   * into a wide scan.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  /** Inclusive lower bound on `createdAt`, as an ISO-8601 date. */
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /**
   * Exclusive upper bound on `createdAt`, as an ISO-8601 date.
   *
   * The service widens a bare `YYYY-MM-DD` to the end of that day, so the
   * admin's "to: 8 Oct" filter includes orders placed on the 8th rather than
   * stopping at midnight.
   */
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(AdminOrderSortField, {
    message: `sortBy must be one of: ${Object.values(AdminOrderSortField).join(', ')}`,
  })
  sortBy?: AdminOrderSortField;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: `sortOrder must be one of: ${Object.values(SortOrder).join(', ')}`,
  })
  sortOrder?: SortOrder;
}

/**
 * Query parameters for `GET /admin/orders/status-counts`.
 *
 * Deliberately ignores `status` (a count broken down by the status you already
 * filtered to is always either that one number or zero) and ignores
 * page/limit/sort, which have no meaning for a tally.
 */
export class OrderStatusCountsQueryDto {
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /**
   * Also constrain by the free-text search.
   *
   * Accepted so the tab badges and the row list always describe the *same*
   * result set — otherwise searching "willow" would show 20 matching rows
   * under tab badges counting all 137 orders, which reads as a broken filter.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

/** Compact shop reference embedded in list and detail responses. */
export interface AdminOrderShopRef {
  id: string;
  name: string;
}

/** Compact customer reference embedded in list and detail responses. */
export interface AdminOrderUserRef {
  id: string;
  name: string;
  email: string;
  /** Only present on the detail endpoint; absent (not null) on the list. */
  phone?: string | null;
}

/**
 * One row of `GET /admin/orders`.
 *
 * A deliberate lean projection: the `items` JSON blob and the `order_items`
 * rows are *not* loaded for the list. Loading them would mean shipping every
 * product line of 20 orders to render a single count, which on a 5-item order
 * is roughly a hundred extra values per row.
 *
 * `itemCount` is computed in SQL (`$size` on the JSON snapshot) rather than by
 * hydrating items in JS, and `shopCount` comes from a single grouped subquery
 * rather than a per-row count.
 */
export interface AdminOrderListItemDto {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  shop: AdminOrderShopRef | null;
  /** > 1 means the basket spanned multiple sellers. */
  shopCount: number;
  user: AdminOrderUserRef | null;
}

/** Result of `GET /admin/orders/status-counts`. */
export interface OrderStatusCountsDto {
  /** Total matching orders, ignoring any status breakdown. */
  ALL: number;
  PENDING: number;
  PAID: number;
  PAYMENT_FAILED: number;
  CANCELLED: number;
}

/** One purchased line on the detail endpoint. */
export interface AdminOrderItemDto {
  id: string;
  productId: string | null;
  /** Snapshot of the product name at purchase time. */
  productName: string;
  imageUrl: string | null;
  /** Snapshot of the unit price at purchase time. */
  unitPrice: number;
  quantity: number;
  /** `unitPrice * quantity`, as stored. */
  lineTotal: number;
  /** The shop fulfilling this line — an order can span several. */
  shopId: string | null;
  shopName: string | null;
  deliveryStatus: string;
}

/** Full order returned by `GET /admin/orders/:id`. */
export interface AdminOrderDetailDto {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shopCount: number;
  shop: AdminOrderShopRef | null;
  user: AdminOrderUserRef | null;
  items: AdminOrderItemDto[];
  itemCount: number;
  totalQuantity: number;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  buyerConfirmedAt: string | null;
}
