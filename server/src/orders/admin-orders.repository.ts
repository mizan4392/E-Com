import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { deriveOrderNumber } from './order-number.util';
import { AdminOrderSortField, SortOrder } from './dto/admin-orders.dto';

/** Filters shared by the list and the status-counts endpoint. */
export interface AdminOrderFilters {
  status?: OrderStatus;
  shopId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** One projected row, before mapping to the response DTO. */
export interface RawAdminOrderRow {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  amountTotal: string | number;
  currency: string;
  createdAt: Date | string;
  itemCount: string | number;
  shopId: string | null;
  shopName: string | null;
  userId: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  shopCount: string | number | null;
}

/** Query result for a single aggregated status bucket. */
export interface RawStatusBucket {
  status: OrderStatus;
  count: string | number;
}

/**
 * Row shape for the single-fetch order detail query.
 *
 * Items arrive pre-aggregated in JSON rather than as a second result set, so
 * details cost exactly one round trip regardless of how many lines the order
 * has.
 */
export interface RawAdminOrderDetailRow extends RawAdminOrderRow {
  updatedAt: Date | string;
  userPhone: string | null;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  buyerConfirmedAt: Date | string | null;
  items: RawAdminOrderItem[] | null;
  totalQuantity: string | number | null;
}

export interface RawAdminOrderItem {
  id: string;
  productId: string | null;
  name: string;
  imageUrl: string | null;
  price: string | number;
  quantity: string | number;
  lineTotal: string | number;
  shopId: string | null;
  shopName: string | null;
  deliveryStatus: string;
}

/**
 * All order reads for the admin panel.
 *
 * Every query here is a hand-written query builder rather than a
 * `repository.find()`, for one overriding reason: **the `items` JSON column
 * must never be hydrated for the list**. `Order.items` holds one object per
 * purchased product, so a 20-row page of 5-item orders carries 100 product
 * snapshots to render a column of counts. Projecting the count in SQL with
 * `$size` and selecting only the nine fields the table actually shows keeps
 * the page payload flat and the transfer size roughly proportional to the row
 * count.
 *
 * Secondary concerns this layer also handles:
 * - shop/user joins are single LEFT JOINs (never N+1 `find` per row),
 * - shop count comes from one correlated scalar subquery rather than loading
 *   the lines,
 * - the date range end is widened to end-of-day,
 * - sorting always carries an `id` tiebreaker for stable paging.
 */
@Injectable()
export class AdminOrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  /**
   * Builds the base query with joins and every applicable filter applied.
   *
   * Shared by the list, the count and the status-counts queries so the three
   * can never drift apart and disagree about what "filtered" means.
   *
   * @param alias Query alias for the order root.
   */
  private createFilteredBase(
    alias: string,
    filters: AdminOrderFilters,
  ): SelectQueryBuilder<Order> {
    const qb = this.ordersRepo
      .createQueryBuilder(alias)
      // LEFT JOIN, not INNER: a cancelled order whose shop was deleted must
      // still appear for an admin. An INNER JOIN would silently hide
      // financial history that needs auditing.
      .leftJoin(`${alias}.primaryShop`, 'shop', 'shop.id IS NOT NULL')
      .leftJoin(`${alias}.user`, 'buyer', 'buyer.id IS NOT NULL');

    if (filters.status) {
      qb.andWhere(`${alias}.status = :status`, { status: filters.status });
    }

    if (filters.shopId) {
      qb.andWhere(`${alias}.primaryShopId = :shopId`, {
        shopId: filters.shopId,
      });
    }

    const range = buildDateRange(filters);
    if (range) {
      // `>= from AND < to` rather than BETWEEN: BETWEEN is inclusive on both
      // ends, which double-counts the boundary second across pages.
      qb.andWhere(`${alias}.createdAt >= :dateFrom`, { dateFrom: range.from });
      qb.andWhere(`${alias}.createdAt < :dateTo`, { dateTo: range.to });
    }

    const search = filters.search?.trim();
    if (search) {
      this.applySearch(qb, alias, search);
    }

    return qb;
  }

  /**
   * Applies the free-text search.
   *
   * Two deliberate decisions:
   *
   * 1. **Anchored, not unanchored regex.** `%needle%` cannot use a btree index
   *    and degrades into a sequential scan. Every alternative here is either
   *    an index equality or a prefix match, which can stop at the index edge.
   *
   * 2. **An exact match on `orderNumber` always wins.** The admin's common
   *    case is pasting a full order number, which is a unique column — an
   *    index hit returning one row. A prefix match alone would also work, but
   *    pinning the exact case first keeps it O(1) even for a very short
   *    needle that would otherwise prefix-match thousands of rows.
   *
   * Email uses the `ILIKE 'prefix%'` form, which Postgres can satisfy with an
   * index when the database collation is case-insensitive (the common default)
   * and degrades to a scan otherwise. Name is intentionally not indexed:
   * free-text name search is out of scope for this panel, and the customer's
   * name is always reachable through the email address.
   */
  private applySearch(
    qb: SelectQueryBuilder<Order>,
    alias: string,
    term: string,
  ): void {
    const upper = term.toUpperCase();
    const like = `${escapeLike(term)}%`;

    qb.andWhere(
      new Brackets((w) => {
        w.where(`${alias}.orderNumber = :exactOrderNumber`, {
          exactOrderNumber: upper,
        })
          .orWhere(`${alias}.orderNumber ILIKE :orderNumberPrefix`, {
            orderNumberPrefix: `${escapeLike(upper)}%`,
          })
          .orWhere(`buyer.email ILIKE :emailPrefix`, {
            emailPrefix: like,
          })
          .orWhere(
            `TRIM(COALESCE(buyer."firstName", '') || ' ' || COALESCE(buyer."lastName", '')) ILIKE :namePrefix`,
            { namePrefix: like },
          );
      }),
    );
  }

  /** Selects exactly the fields the admin list table renders, plus deriveds. */
  private applyListProjection(qb: SelectQueryBuilder<Order>): void {
    const a = qb.alias;

    // Every entry uses the *pair* form `select(property, alias)`.
    // The array form `select(['order.createdAt', ...])` is the trap here: the
    // property is treated as a selection target, so it escapes to
    // `"order"."createdAt" AS "order_createdAt"` and the raw row key becomes
    // `order_createdAt`, not `createdAt`. The pair form is the only one that
    // guarantees the raw key equals the alias you asked for — which matters
    // because every mapper in the service reads plain `row.createdAt`.
    qb.select(`${a}.id`, 'id')
      .addSelect(`${a}.orderNumber`, 'orderNumber')
      .addSelect(`${a}.status`, 'status')
      .addSelect(`${a}.amountTotal`, 'amountTotal')
      .addSelect(`${a}.currency`, 'currency')
      .addSelect(`${a}.createdAt`, 'createdAt')
      .addSelect('shop.id', 'shopId')
      .addSelect('shop.name', 'shopName')
      .addSelect('buyer.id', 'userId')
      .addSelect('buyer.firstName', 'userFirstName')
      .addSelect('buyer.lastName', 'userLastName')
      .addSelect('buyer.email', 'userEmail')
      // Item count straight from the JSON snapshot — no item rows loaded.
      .addSelect(
        `CASE WHEN ${a}.items IS NULL THEN 0 ELSE JSON_ARRAY_LENGTH(${a}.items) END`,
        'itemCount',
      )
      // One correlated scalar subquery, so the shop count does not require
      // loading the lines to count them.
      .addSelect(
        `(
           SELECT COUNT(DISTINCT oi."shopId")
           FROM order_items oi
           WHERE oi."orderId" = ${a}.id AND oi."shopId" IS NOT NULL
         )`,
        'shopCount',
      );
  }

  /**
   * Stable sort: requested field first, then `id` as tiebreaker.
   *
   * Without the tiebreaker, rows sharing a sort value (two orders placed in the
   * same millisecond, or two £0 totals under `totalAmount ASC`) can swap
   * between queries and an order will be skipped or repeated while paging.
   * Appending `id` makes the ordering total, and therefore every page stable —
   * which is also the property cursor pagination later depends on.
   */
  private applySort(
    qb: SelectQueryBuilder<Order>,
    sortBy: AdminOrderSortField | undefined,
    sortOrder: SortOrder | undefined,
  ): void {
    const direction = sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
    const column =
      sortBy === AdminOrderSortField.TOTAL_AMOUNT
        ? `${qb.alias}.amountTotal`
        : `${qb.alias}.createdAt`;

    qb.orderBy(column, direction).addOrderBy(`${qb.alias}.id`, direction);
  }

  /**
   * Fetches one page of orders.
   *
   * Deliberately *not* given the count: the service runs this alongside
   * {@link countOrders} in a `Promise.all`, and combining them into one
   * `getManyAndCount` would serialise them into a single round trip that
   * cannot overlap.
   */
  async findPage(
    filters: AdminOrderFilters,
    pagination: { limit: number; skip: number },
    sortBy?: AdminOrderSortField,
    sortOrder?: SortOrder,
  ): Promise<RawAdminOrderRow[]> {
    const qb = this.createFilteredBase('order', filters);
    this.applyListProjection(qb);
    this.applySort(qb, sortBy, sortOrder);

    return qb
      .limit(pagination.limit)
      .offset(pagination.skip)
      .getRawMany<RawAdminOrderRow>();
  }

  /** Total rows matching the filters, ignoring page/limit/sort. */
  async countOrders(filters: AdminOrderFilters): Promise<number> {
    const qb = this.createFilteredBase('order', filters);
    return qb.getCount();
  }

  /**
   * Tallies orders by status in a single GROUP BY.
   *
   * One query for every tab badge rather than one `COUNT(*) WHERE status = ?`
   * per status — the naive version is a round trip per tab and a scan per tab.
   * `getRawMany` returns only the buckets that actually have rows, so the
   * service maps them over the full enum to guarantee every key exists and a
   * tab with zero orders renders `0` rather than `undefined`.
   */
  async countByStatus(filters: AdminOrderFilters): Promise<RawStatusBucket[]> {
    const qb = this.createFilteredBase('order', filters);

    // `select(alias, 'status')` + `addSelect(expr, 'count')` rather than an
    // inline `"alias" AS "status"` string: TypeORM parses select() arguments as
    // a property path plus a result alias and emits `syntax error at or near
    // "AS"` if you hand it raw SQL.
    return qb
      .select(`${qb.alias}.status`, 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`${qb.alias}.status`)
      .getRawMany<RawStatusBucket>();
  }

  /**
   * Loads one order in full, with its line items aggregated into JSON in the
   * same statement.
   *
   * The items arrive as a single JSON array via `json_agg`, so the detail page
   * costs exactly one query no matter how many lines the order has. The
   * sub-select is LEFT-joined, so an order whose lines have been pruned still
   * renders rather than vanishing.
   */
  async findDetailById(id: string): Promise<RawAdminOrderDetailRow | null> {
    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.primaryShop', 'shop', 'shop.id IS NOT NULL')
      .leftJoin('order.user', 'buyer', 'buyer.id IS NOT NULL')
      .leftJoin(
        (sub) =>
          sub
            .select('oi."orderId"', 'orderId')
            .addSelect(
              // ROUND(double precision, int) does not exist in Postgres — it
              // only has ROUND(numeric, int). Casting to numeric first is
              // required, and also keeps the result a JSON-safe number.
              `JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'id', oi.id,
                   'productId', oi."productId",
                   'name', oi.name,
                   'imageUrl', oi."imageUrl",
                   'price', oi.price,
                   'quantity', oi.quantity,
                   'lineTotal', ROUND(oi.price::numeric * oi.quantity::numeric, 2),
                   'shopId', oi."shopId",
                   'shopName', s.name,
                   'deliveryStatus', oi."deliveryStatus"
                 )
               )`,
              'items',
            )
            .addSelect('SUM(oi.quantity)', 'totalQuantity')
            .from(OrderItem, 'oi')
            .leftJoin('Shop', 's', 's.id = oi."shopId"')
            .groupBy('oi."orderId"'),
        'lines',
        'lines."orderId" = order.id',
      )
      .where('order.id = :id', { id })
      // Pair-form selects throughout, for the same raw-key reason documented on
      // `applyListProjection`.
      .select('order.id', 'id')
      .addSelect('order.orderNumber', 'orderNumber')
      .addSelect('order.status', 'status')
      .addSelect('order.amountTotal', 'amountTotal')
      .addSelect('order.currency', 'currency')
      .addSelect('order.createdAt', 'createdAt')
      .addSelect('order.updatedAt', 'updatedAt')
      .addSelect('order.deliveryAddress', 'deliveryAddress')
      .addSelect('order.deliveryPhone', 'deliveryPhone')
      .addSelect('order.buyerConfirmedAt', 'buyerConfirmedAt')
      .addSelect('shop.id', 'shopId')
      .addSelect('shop.name', 'shopName')
      .addSelect('buyer.id', 'userId')
      .addSelect('buyer.firstName', 'userFirstName')
      .addSelect('buyer.lastName', 'userLastName')
      .addSelect('buyer.email', 'userEmail')
      .addSelect('buyer.phone', 'userPhone')
      .addSelect('lines.items', 'items')
      // `lines` is a sub-query alias, not an entity, so TypeORM has no property
      // metadata for its columns and emits `lines.totalQuantity` unquoted —
      // which Postgres folds to `lines.totalquantity` and then rejects. The
      // inner double quotes keep the camelCase intact.
      .addSelect('lines."totalQuantity"', 'totalQuantity')
      .addSelect(
        `CASE WHEN order.items IS NULL THEN 0 ELSE JSON_ARRAY_LENGTH(order.items) END`,
        'itemCount',
      )
      .addSelect(
        `(
           SELECT COUNT(DISTINCT oi2."shopId")
           FROM order_items oi2
           WHERE oi2."orderId" = order.id AND oi2."shopId" IS NOT NULL
         )`,
        'shopCount',
      );

    const rows = await qb.limit(1).getRawMany<RawAdminOrderDetailRow>();
    return rows[0] ?? null;
  }

  /**
   * Assigns `orderNumber` / `primaryShopId` to orders that predate the columns.
   *
   * The columns are nullable purely so `synchronize: true` can add them to a
   * populated table; without this the 12 existing orders would show a blank
   * reference and be unsearchable, which is exactly the data an admin cares
   * about. Safe to run repeatedly — it only touches rows that are still null.
   */
  async backfillLegacyColumns(): Promise<number> {
    const missing = await this.ordersRepo
      .createQueryBuilder('order')
      .where('order.orderNumber IS NULL')
      .select(['order.id', 'order.createdAt'])
      .getMany();

    if (missing.length === 0) {
      return 0;
    }

    for (const order of missing) {
      const firstShop = await this.orderItemsRepo.findOne({
        where: { orderId: order.id },
        select: { shopId: true },
      });

      await this.ordersRepo.update(order.id, {
        orderNumber: deriveOrderNumber(order),
        primaryShopId: firstShop?.shopId ?? null,
      });
    }

    return missing.length;
  }
}

/**
 * Escapes the LIKE metacharacters so a user typing `%` searches for a literal
 * percent sign rather than matching every row.
 */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Normalises the optional date range.
 *
 * A bare `YYYY-MM-DD` upper bound is widened to `23:59:59.999` of that day.
 * Without this, filtering "to: 8 Oct" would silently exclude everything placed
 * on the 8th, because `createdAt < 2026-10-08T00:00:00` matches nothing from
 * that day. The upper bound stays **exclusive** so adjacent ranges
 * (1–8 Oct and 8–15 Oct) cannot double-count the boundary.
 */
function buildDateRange(filters: AdminOrderFilters): {
  from: string;
  to: string;
} | null {
  const { dateFrom, dateTo } = filters;
  if (!dateFrom && !dateTo) {
    return null;
  }

  const from = dateFrom ?? '1970-01-01T00:00:00.000Z';

  let to: string;
  if (!dateTo) {
    to = '9999-12-31T23:59:59.999Z';
  } else if (dateTo.length === 10) {
    to = `${dateTo}T23:59:59.999Z`;
  } else {
    to = dateTo;
  }

  return { from, to };
}
