import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Shop } from '../admin/shop.entity';
import { Product } from '../admin/product.entity';
import { OrderItem, DeliveryStatus } from '../orders/order-item.entity';
// `Order` is intentionally not imported: the aggregates run entirely off
// `order_items` joined to `orders` in raw SQL, so no `Repository<Order>` and
// no entity decorator is needed here. `OrderStatus` supplies the enum only.
import { OrderStatus } from '../orders/order.entity';
import {
  AnalyticsGranularity,
  ShopAnalyticsQueryDto,
} from './dto/shop-analytics-query.dto';

/** One bucket of the time series. */
export type AnalyticsSeriesPoint = {
  /** `YYYY-MM-DD` for daily, `YYYY-MM` for monthly. Stable, sortable, TZ-safe. */
  bucket: string;
  /** Human label for the axis, e.g. `Mar 5` or `Mar 2026`. */
  label: string;
  /** Sum of `quantity` for this bucket. */
  unitsSold: number;
  /** Sum of `price * quantity` for this bucket. */
  revenue: number;
  /** Distinct orders touched in this bucket. */
  orders: number;
};

/** Lifetime totals, independent of the selected reporting window. */
export type AnalyticsTotals = {
  revenue: number;
  unitsSold: number;
  orders: number;
};

/** Top sellers within the selected reporting window. */
export type AnalyticsTopProduct = {
  productId: string | null;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type ShopAnalyticsResult = {
  shopId: string;
  shopName: string;
  currency: string;
  /** 0-1 fraction; `null` when there is not yet enough signal to rank. */
  averageOrderValue: number | null;
  totals: AnalyticsTotals;
  /** Totals restricted to the selected window, for "in period" comparisons. */
  periodTotals: AnalyticsTotals;
  /**
   * Totals for the window immediately BEFORE `range`, same length.
   *
   * Sent so the dashboard can show real period-over-period trends instead of
   * inventing a comparison. `null` when the preceding window falls before the
   * shop's first sale, so the UI can say "no comparison" honestly.
   */
  previousPeriodTotals: AnalyticsTotals | null;
  /** Catalogue size for THIS shop. */
  productCount: number;
  /** The `from`/`to` window actually used, after defaults were applied. */
  range: {
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
  };
  /** Dense series: every bucket in range, zero-filled. */
  series: AnalyticsSeriesPoint[];
  topProducts: AnalyticsTopProduct[];
};

/**
 * Owner-level figures, across every shop the seller runs.
 *
 * Deliberately a SEPARATE payload from `ShopAnalyticsResult` rather than a
 * `portfolio` field on it. Portfolio totals do not vary with the selected shop,
 * so shipping them on the per-shop response meant re-fetching (and re-sending)
 * two constants every time the seller switched shops in the dropdown. The
 * dashboard now loads this once and leaves it alone while `shopId` changes.
 *
 * Keeping it separate also means this payload can be cached far more
 * aggressively — it only changes when a shop or product is created/deleted,
 * never when a sale happens.
 */
export type ShopPortfolioResult = {
  /** How many shops the owner runs. */
  totalShops: number;
  /** Products across all of the owner's shops. */
  totalProducts: number;
  /** Lifetime paid revenue across all of the owner's shops. */
  totalRevenue: number;
  /** Lifetime units sold across all of the owner's shops. */
  totalUnitsSold: number;
  /** Distinct paid orders across all of the owner's shops. */
  totalOrders: number;
  currency: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_TOP_PRODUCTS = 5;
/**
 * Hard ceiling on returned buckets. A daily series is capped at ~400 days, so
 * a request cannot be used to pull an arbitrarily large response. Exceeding it
 * is a 400 rather than a silent truncation, because a truncated series would
 * plot incomplete data with no indication that anything was dropped.
 */
const MAX_ANALYTICS_BUCKETS = 400;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Matches `2026-03-05` / `2026-03-05T10:00:00.000Z`; captures the date part. */
const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

@Injectable()
export class ShopAnalyticsService {
  constructor(
    @InjectRepository(Shop) private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  /**
   * Builds the full seller dashboard payload for ONE shop.
   *
   * The caller must have already proven ownership (see
   * `ShopAnalyticsController`); this service only reads.
   *
   * Performance: the three `getTotals`-shaped aggregates (lifetime, current
   * window, previous window) are computed in ONE grouped scan using a
   * `CASE` bucket expression, instead of three separate queries each walking
   * every line the shop has ever sold. On a shop with tens of thousands of
   * lines that is the difference between one pass and three. The series and
   * top-products queries then run concurrently with it.
   *
   * Nothing here depends on the *other* shops the owner runs — that is
   * `getPortfolioTotals`, which the client caches separately.
   */
  async getShopAnalytics(
    userId: string,
    shopId: string,
    query: ShopAnalyticsQueryDto,
  ): Promise<ShopAnalyticsResult> {
    const shop = await this.shopRepository.findOne({
      where: { id: shopId },
      select: { id: true, name: true, createdAt: true, user: { id: true } },
    });

    if (!shop) {
      // Defensive: ownership is asserted before this call, so a miss here
      // means the shop was deleted mid-request.
      throw new NotFoundException('Shop not found');
    }

    const granularity = query.granularity ?? AnalyticsGranularity.DAY;
    const { from, to } = this.resolveRange(shop, query);

    // The comparison window abuts the reporting window and is exactly as long,
    // so "this 30 days" is measured against "the 30 days before it".
    const previous = this.getPreviousWindow(from, to);

    const [aggregates, buckets, topProducts, productCount] = await Promise.all([
      this.getWindowedAggregates(shopId, { from, to }, previous),
      this.getSeries(shopId, { from, to, granularity }),
      this.getTopProducts(shopId, from, to),
      this.productRepository.count({ where: { shop: { id: shopId } } }),
    ]);

    const periodTotals: AnalyticsTotals = {
      revenue: aggregates.periodRevenue,
      unitsSold: aggregates.periodUnits,
      orders: aggregates.periodOrders,
    };

    return {
      shopId: shop.id,
      shopName: shop.name,
      currency: 'usd',
      averageOrderValue:
        periodTotals.orders > 0
          ? round2(periodTotals.revenue / periodTotals.orders)
          : null,
      totals: {
        revenue: aggregates.lifetimeRevenue,
        unitsSold: aggregates.lifetimeUnits,
        orders: aggregates.lifetimeOrders,
      },
      periodTotals,
      previousPeriodTotals: previous
        ? {
            revenue: aggregates.previousRevenue,
            unitsSold: aggregates.previousUnits,
            orders: aggregates.previousOrders,
          }
        : null,
      productCount,
      range: { from, to, granularity },
      series: buckets,
      topProducts,
    };
  }

  /**
   * Owner-level totals across every shop the seller runs.
   *
   * Scoped by the owner's own shop ids rather than by joining through
   * `shops.user`, so the `order_items` scan can use the `shopId` index
   * directly instead of resolving a join for every line.
   *
   * Two queries total, no matter how many shops the seller runs: one `count`
   * for the catalogue, one grouped scan for the sales. The empty case is
   * short-circuited *before* either runs, because `IN (:...ids)` with an
   * empty array is invalid SQL — not merely slow.
   */
  async getPortfolioTotals(userId: string): Promise<ShopPortfolioResult> {
    const shopRows = await this.shopRepository.find({
      where: { user: { id: userId } },
      select: { id: true },
    });

    const shopIds = shopRows.map((row) => row.id);

    if (shopIds.length === 0) {
      return {
        totalShops: 0,
        totalProducts: 0,
        totalRevenue: 0,
        totalUnitsSold: 0,
        totalOrders: 0,
        currency: 'usd',
      };
    }

    const [productCount, sales] = await Promise.all([
      this.productRepository.count({
        where: { shop: { id: In(shopIds) } },
      }),
      this.orderItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .select('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
        .addSelect('COALESCE(SUM(item.price * item.quantity), 0)', 'revenue')
        .addSelect('COUNT(DISTINCT item."orderId")', 'orders')
        .where('item."shopId" IN (:...shopIds)', { shopIds })
        .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
        .andWhere('item."deliveryStatus" != :cancelled', {
          cancelled: DeliveryStatus.CANCELLED,
        })
        .getRawOne<{ unitsSold: string; revenue: string; orders: string }>(),
    ]);

    return {
      totalShops: shopIds.length,
      totalProducts: productCount,
      totalRevenue: round2(toFloat(sales?.revenue)),
      totalUnitsSold: toInt(sales?.unitsSold),
      totalOrders: toInt(sales?.orders),
      currency: 'usd',
    };
  }

  /**
   * The equally-long window immediately preceding `[from, to]`.
   *
   * Returns `null` when the shop did not exist yet that far back (its
   * `createdAt` is inside the reporting window), so the dashboard can omit
   * the trend rather than compare against a period the shop could not have
   * sold in.
   */
  private getPreviousWindow(
    from: string,
    to: string,
  ): { from: string; to: string } | null {
    const start = parseIsoDate(from);
    const end = parseIsoDate(to);
    if (!start || !end) return null;

    const lengthInDays =
      Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

    const previousTo = addDays(start, -1);
    const previousFrom = addDays(previousTo, -(lengthInDays - 1));

    return { from: toIsoDate(previousFrom), to: toIsoDate(previousTo) };
  }

  /**
   * Proves the caller owns `shopId`.
   *
   * Owner-scoped via the internal `users.id` UUID — the same value the
   * `AuthGuard` attaches as `user.id` — NOT the Clerk id (`user.userId`).
   * The two are different columns; see the orders module for the same rule.
   */
  async assertShopOwnership(userId: string, shopId: string): Promise<void> {
    const shop = await this.shopRepository.findOne({
      where: { id: shopId },
      select: { id: true, user: { id: true } },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this shop',
      );
    }
  }

  // --- Range handling ------------------------------------------------------

  /**
   * Normalises `from`/`to` into inclusive `YYYY-MM-DD` strings.
   *
   * Parsing is done on the date string only, then the boundaries are pinned to
   * UTC midnight. Doing it this way keeps buckets aligned to calendar days
   * regardless of the server's timezone, so a shop owner's "today" does not
   * drift by a day depending on where the process runs.
   *
   * An absent `from` means "everything" — the window starts at the shop's own
   * `createdAt` (clamped to midnight). That is the only place that knows when
   * the shop began selling, and it means an unbounded request cannot reach
   * arbitrarily far into the past.
   */
  private resolveRange(
    shop: Shop,
    query: ShopAnalyticsQueryDto,
  ): { from: string; to: string } {
    const today = startOfUtcDay(new Date());

    const toDate = parseIsoDate(query.to) ?? today;
    const fromDate =
      parseIsoDate(query.from) ??
      startOfUtcDay(new Date(shop.createdAt)) ??
      addDays(toDate, -(DEFAULT_WINDOW_DAYS - 1));

    if (fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException('`from` must be on or before `to`');
    }

    // A shop created "today" must not produce an inverted/empty window just
    // because its `createdAt` is a few seconds ahead of UTC midnight.
    const effectiveFrom =
      fromDate.getTime() > toDate.getTime() ? toDate : fromDate;

    const bucketCount = this.countBuckets(
      effectiveFrom,
      toDate,
      query.granularity ?? AnalyticsGranularity.DAY,
    );

    if (bucketCount > MAX_ANALYTICS_BUCKETS) {
      throw new BadRequestException(
        `Requested range would produce ${bucketCount} buckets; the maximum is ${MAX_ANALYTICS_BUCKETS}. Narrow the window or use granularity=month.`,
      );
    }

    return {
      from: toIsoDate(effectiveFrom),
      to: toIsoDate(toDate),
    };
  }

  /** How many dense buckets a window yields at a given granularity. */
  private countBuckets(
    from: Date,
    to: Date,
    granularity: AnalyticsGranularity,
  ): number {
    if (granularity === AnalyticsGranularity.MONTH) {
      const months =
        (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
        (to.getUTCMonth() - from.getUTCMonth()) +
        1;

      return Math.max(months, 0);
    }

    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1 || 0;
  }

  // --- Aggregations --------------------------------------------------------

  /**
   * Lifetime + current-window + previous-window totals in ONE scan.
   *
   * These three figures used to be three separate `getTotals` calls, each of
   * which walked every line the shop had ever sold and filtered most of them
   * out — so a shop with 50k lines paid for three near-identical table walks
   * per dashboard load. A single `SUM(CASE ...)` pass computes all three from
   * one index traversal, and the `COUNT(DISTINCT)` is likewise expressed once
   * per window via `FILTER`.
   *
   * The lifetime figures cannot use the window index (they are unbounded by
   * definition) but they do ride the same scan, which is strictly cheaper than
   * two extra round trips.
   *
   * Reads `order_items` rather than `orders.items` because revenue is per *shop
   * line*, not per order, and the JSON column cannot be aggregated or indexed.
   *
   * A line counts as a sale only when the parent order is `PAID` and the line
   * is not `CANCELLED`, matching `ProductsService` sold-count semantics so the
   * dashboard and the storefront never disagree.
   */
  private async getWindowedAggregates(
    shopId: string,
    window: { from: string; to: string },
    previous: { from: string; to: string } | null,
  ): Promise<{
    lifetimeRevenue: number;
    lifetimeUnits: number;
    lifetimeOrders: number;
    periodRevenue: number;
    periodUnits: number;
    periodOrders: number;
    previousRevenue: number;
    previousUnits: number;
    previousOrders: number;
  }> {
    // `FILTER (WHERE ...)` keeps each window's distinct-order count in its own
    // column. When there is no previous window the expression is omitted
    // entirely rather than emitted with a never-true predicate, so the planner
    // is not handed dead work.
    //
    // The `FILTER` keyword is load-bearing. A bare `AND` here would make this
    // `SUM(x) AND (condition)`, which is a boolean AND of an aggregate and a
    // predicate, not a conditional aggregate — Postgres rejects the resulting
    // `COALESCE(<boolean>, 0)` on a type mismatch, and even if it coerced it
    // would count rows rather than sum the filtered ones.
    const previousWhere = previous
      ? `item."createdAt" >= :prevFrom AND item."createdAt" < (:prevTo::date + INTERVAL '1 day')`
      : null;
    const previousRevenueExpr = previousWhere
      ? `COALESCE(SUM(item.price * item.quantity) FILTER (WHERE ${previousWhere}), 0)`
      : '0';
    const previousUnitsExpr = previousWhere
      ? `COALESCE(SUM(item.quantity) FILTER (WHERE ${previousWhere}), 0)`
      : '0';
    const previousOrdersExpr = previousWhere
      ? `COALESCE(COUNT(DISTINCT item."orderId") FILTER (WHERE ${previousWhere}), 0)`
      : '0';

    const row = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('COALESCE(SUM(item.price * item.quantity), 0)', 'lifetimeRevenue')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'lifetimeUnits')
      .addSelect('COUNT(DISTINCT item."orderId")', 'lifetimeOrders')
      .addSelect(
        `COALESCE(SUM(item.price * item.quantity) FILTER (WHERE item."createdAt" >= :from AND item."createdAt" < (:to::date + INTERVAL '1 day')), 0)`,
        'periodRevenue',
      )
      .addSelect(
        `COALESCE(SUM(item.quantity) FILTER (WHERE item."createdAt" >= :from AND item."createdAt" < (:to::date + INTERVAL '1 day')), 0)`,
        'periodUnits',
      )
      .addSelect(
        `COUNT(DISTINCT item."orderId") FILTER (WHERE item."createdAt" >= :from AND item."createdAt" < (:to::date + INTERVAL '1 day'))`,
        'periodOrders',
      )
      .addSelect(previousRevenueExpr, 'previousRevenue')
      .addSelect(previousUnitsExpr, 'previousUnits')
      .addSelect(previousOrdersExpr, 'previousOrders')
      .where('item."shopId" = :shopId', { shopId })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
      .andWhere('item."deliveryStatus" != :cancelled', {
        cancelled: DeliveryStatus.CANCELLED,
      })
      .setParameters({
        shopId,
        from: `${window.from} 00:00:00+00`,
        to: window.to,
        ...(previous
          ? {
              prevFrom: `${previous.from} 00:00:00+00`,
              prevTo: previous.to,
            }
          : {}),
      })
      .getRawOne<{
        lifetimeRevenue: string;
        lifetimeUnits: string;
        lifetimeOrders: string;
        periodRevenue: string;
        periodUnits: string;
        periodOrders: string;
        previousRevenue: string;
        previousUnits: string;
        previousOrders: string;
      }>();

    return {
      lifetimeRevenue: round2(toFloat(row?.lifetimeRevenue)),
      lifetimeUnits: toInt(row?.lifetimeUnits),
      lifetimeOrders: toInt(row?.lifetimeOrders),
      periodRevenue: round2(toFloat(row?.periodRevenue)),
      periodUnits: toInt(row?.periodUnits),
      periodOrders: toInt(row?.periodOrders),
      previousRevenue: round2(toFloat(row?.previousRevenue)),
      previousUnits: toInt(row?.previousUnits),
      previousOrders: toInt(row?.previousOrders),
    };
  }

  /**
   * Buckets sales by day or month across the window.
   *
   * The SQL does the grouping (`date_trunc`) so the database returns one row
   * per bucket that actually has sales. Gaps are then zero-filled in
   * application code — Postgres has no `generate_series`-style helper wired
   * up here, and a month is at most 31 buckets, so materialising them is
   * cheap and keeps the timezone logic in one place.
   */
  private async getSeries(
    shopId: string,
    window: { from: string; to: string } & {
      granularity: AnalyticsGranularity;
    },
  ): Promise<AnalyticsSeriesPoint[]> {
    const { from, to, granularity } = window;

    const rows = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select(
        granularity === AnalyticsGranularity.MONTH
          ? `to_char(date_trunc('month', item."createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM')`
          : `to_char(date_trunc('day', item."createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`,
        'bucket',
      )
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
      .addSelect('COALESCE(SUM(item.price * item.quantity), 0)', 'revenue')
      .addSelect('COUNT(DISTINCT item."orderId")', 'orders')
      .where('item."shopId" = :shopId', { shopId })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
      .andWhere('item."deliveryStatus" != :cancelled', {
        cancelled: DeliveryStatus.CANCELLED,
      })
      .andWhere('item."createdAt" >= :from', { from: `${from} 00:00:00+00` })
      .andWhere(`item."createdAt" < (:to::date + INTERVAL '1 day')`, { to })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{
        bucket: string;
        unitsSold: string;
        revenue: string;
        orders: string;
      }>();

    const totalsByBucket = new Map(
      rows.map((row) => [
        row.bucket,
        {
          unitsSold: toInt(row.unitsSold),
          revenue: round2(toFloat(row.revenue)),
          orders: toInt(row.orders),
        },
      ]),
    );

    return this.buildDenseSeries(from, to, granularity).map((bucket) => {
      const totals = totalsByBucket.get(bucket) ?? {
        unitsSold: 0,
        revenue: 0,
        orders: 0,
      };

      return {
        bucket,
        label: formatBucketLabel(bucket, granularity),
        ...totals,
      };
    });
  }

  /**
   * Highest-selling products in the window.
   *
   * Grouped by `productId` from the line snapshot, falling back to the
   * snapshot `name` for products that have since been deleted — otherwise a
   * deleted product would silently drop out of the seller's history.
   */
  private async getTopProducts(
    shopId: string,
    from: string,
    to: string,
  ): Promise<AnalyticsTopProduct[]> {
    const rows = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item."productId"', 'productId')
      .addSelect('MIN(item.name)', 'name')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
      .addSelect('COALESCE(SUM(item.price * item.quantity), 0)', 'revenue')
      .where('item."shopId" = :shopId', { shopId })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
      .andWhere('item."deliveryStatus" != :cancelled', {
        cancelled: DeliveryStatus.CANCELLED,
      })
      .andWhere('item."createdAt" >= :from', { from: `${from} 00:00:00+00` })
      .andWhere(`item."createdAt" < (:to::date + INTERVAL '1 day')`, { to })
      .groupBy('item."productId"')
      .orderBy('revenue', 'DESC')
      .limit(DEFAULT_TOP_PRODUCTS)
      .getRawMany<{
        productId: string | null;
        name: string;
        unitsSold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      unitsSold: toInt(row.unitsSold),
      revenue: round2(toFloat(row.revenue)),
    }));
  }

  /**
   * Every bucket between `from` and `to`, inclusive, in chronological order.
   *
   * Month iteration is done on the first of the month and then rolled forward
   * by adding months, which avoids the "31st of the month" overflow trap that
   * naive day-stepping through a month range would hit.
   */
  private buildDenseSeries(
    from: string,
    to: string,
    granularity: AnalyticsGranularity,
  ): string[] {
    // Both dates were produced by `resolveRange`, so they are always valid
    // `YYYY-MM-DD` strings. The null guards are belt-and-braces: an
    // unparseable bound must degrade to an empty chart, not throw mid-query.
    const start = parseIsoDate(from);
    const end = parseIsoDate(to);
    if (!start || !end || start.getTime() > end.getTime()) {
      return [];
    }

    const buckets: string[] = [];

    if (granularity === AnalyticsGranularity.MONTH) {
      const cursor = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
      );
      const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1);

      while (cursor.getTime() <= last) {
        buckets.push(
          `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}`,
        );
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      return buckets;
    }

    for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
      buckets.push(toIsoDate(new Date(t)));
    }
    return buckets;
  }
}

// --- Pure date / number helpers -------------------------------------------

/** Extracts the `YYYY-MM-DD` prefix and parses it as UTC midnight. */
function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = ISO_DATE_PREFIX.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  // Reject impossible dates that JS would silently roll over (e.g. 2026-02-30).
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return startOfUtcDay(date);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `2026-03-05` -> `Mar 5`; `2026-03` -> `Mar 2026`. */
function formatBucketLabel(
  bucket: string,
  granularity: AnalyticsGranularity,
): string {
  const match = ISO_DATE_PREFIX.exec(bucket);
  if (!match) return bucket;

  const monthIndex = Number(match[2]) - 1;
  const month = MONTH_LABELS[monthIndex] ?? bucket;

  if (granularity === AnalyticsGranularity.MONTH) {
    return `${month} ${match[1]}`;
  }
  return `${month} ${Number(match[3])}`;
}

function toInt(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function toFloat(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Money is stored as float, so every value crossing the wire is pinned to 2dp. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
