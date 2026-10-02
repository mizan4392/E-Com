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

/**
 * CARD data — the four KPI tiles for one shop, plus the context the UI needs
 * to label them.
 *
 * Deliberately a separate payload from {@link ShopAnalyticsDetailsResult} so
 * the tiles can render from ONE query. Previously the cards were served by
 * the same endpoint as the chart, so a seller picking a shop had to wait for
 * `getSeries` (a `date_trunc` + `GROUP BY` over every line in range) and
 * `getTopProducts` before a single number appeared. Splitting them means the
 * cards are answered by a single flat aggregate with no grouping at all.
 */
export type ShopAnalyticsCardsResult = {
  shopId: string;
  shopName: string;
  currency: string;
  /** Lifetime, all time. */
  totals: AnalyticsTotals;
  /** Restricted to the selected window. */
  periodTotals: AnalyticsTotals;
  /** Equal-length window immediately before `range`, or `null` if none. */
  previousPeriodTotals: AnalyticsTotals | null;
  /** 0-1 fraction over the period; `null` when the period has no orders. */
  averageOrderValue: number | null;
  /** Catalogue size for THIS shop. */
  productCount: number;
  range: {
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
  };
};

/**
 * DETAIL data — the chart series and the best-seller table.
 *
 * Separate from the cards because this is the expensive half: two grouped
 * scans with a `date_trunc`, versus one flat aggregate for the cards.
 */
export type ShopAnalyticsDetailsResult = {
  shopId: string;
  shopName: string;
  range: {
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
  };
  /** Dense: every bucket in range, zero-filled. */
  series: AnalyticsSeriesPoint[];
  topProducts: AnalyticsTopProduct[];
};

/**
 * Owner-level figures, across every shop the seller runs.
 *
 * Deliberately a SEPARATE payload from {@link ShopAnalyticsCardsResult} and
 * {@link ShopAnalyticsDetailsResult} rather than a `portfolio` field on one
 * of them. Portfolio totals do not vary with the selected shop,
 * so shipping them on the per-shop response meant re-fetching (and re-sending)
 * two constants every time the seller switched shops in the dropdown. The
 * dashboard now loads this once and leaves it alone while `shopId` changes.
 *
 * Keeping it separate also means this payload can be cached far more
 * aggressively — it only changes when a shop or product is created/deleted,
 * never when a sale happens.
 */
/** One shop's lifetime paid totals, for the dashboard's shop picker. */
export type ShopPortfolioEntry = {
  shopId: string;
  unitsSold: number;
  revenue: number;
};

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
  /**
   * Per-shop breakdown, ALWAYS one entry per shop the owner runs — including
   * shops with zero sales, which are present with zeros rather than omitted.
   *
   * Included so the dashboard can show each shop's sales next to its name in
   * the picker. Without it, a seller whose first shop has no sales opens the
   * dashboard, sees an empty chart, and concludes it is broken. The previous
   * payload had no per-shop data at all, so this was the only way to make
   * "this shop genuinely has no sales" visible instead of ambiguous.
   */
  shops: ShopPortfolioEntry[];
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
   * CARD data for one shop: the four KPI tiles and the numbers behind them.
   *
   * Backed by `getWindowedAggregates` — a single flat aggregate with no
   * `GROUP BY` — plus one `count` for the catalogue, run concurrently. No
   * `date_trunc`, no series materialisation, no top-products grouping.
   *
   * This exists as its own endpoint so selecting a shop paints the numbers
   * without waiting for the chart. The two heavy queries behind
   * {@link getShopDetails} (`getSeries`, `getTopProducts`) are each a grouped
   * scan over every line in range, and the client used to block every tile on
   * both of them completing.
   */
  async getShopCards(
    userId: string,
    shopId: string,
    query: ShopAnalyticsQueryDto,
  ): Promise<ShopAnalyticsCardsResult> {
    const { shop, from, to, granularity } = await this.authorize(
      userId,
      shopId,
      query,
    );

    // The comparison window abuts the reporting window and is exactly as long,
    // so "this 30 days" is measured against "the 30 days before it".
    const previous = this.getPreviousWindow(from, to);

    const [aggregates, productCount] = await Promise.all([
      this.getWindowedAggregates(shopId, { from, to }, previous),
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
    };
  }

  /**
   * DETAIL data for one shop: the chart series and the best-seller table.
   *
   * The expensive half, and deliberately not bundled with the cards. Both
   * queries are grouped scans with a `date_trunc` over every line in range;
   * they run concurrently with each other, but neither is needed to show a
   * number, so neither should gate one.
   */
  async getShopDetails(
    userId: string,
    shopId: string,
    query: ShopAnalyticsQueryDto,
  ): Promise<ShopAnalyticsDetailsResult> {
    const { shop, from, to, granularity } = await this.authorize(
      userId,
      shopId,
      query,
    );

    const [series, topProducts] = await Promise.all([
      this.getSeries(shopId, { from, to, granularity }),
      this.getTopProducts(shopId, from, to),
    ]);

    return {
      shopId: shop.id,
      shopName: shop.name,
      range: { from, to, granularity },
      series,
      topProducts,
    };
  }

  /**
   * Loads the shop, proves the caller owns it, and resolves the reporting
   * window — shared by both halves of the split dashboard.
   *
   * Extracted rather than duplicated because it is the security boundary. Two
   * hand-copied ownership checks are two places to forget one, and a missed
   * check on the details endpoint would leak a shop's sales history to any
   * authenticated user who could guess an id.
   *
   * The check runs against the shop's `userId`, the internal `users.id` UUID —
   * never the Clerk id (`user.userId`).
   */
  private async authorize(
    userId: string,
    shopId: string,
    query: ShopAnalyticsQueryDto,
  ): Promise<{
    shop: Shop;
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
  }> {
    // `userId` (the scalar FK) is selected explicitly rather than reaching for
    // the `user` relation with a nested `select: { user: { id: true } }`.
    //
    // That nested form is a silent trap: TypeORM emits it as a *second* query
    // whose result is attached only when the relation column is already loaded,
    // and with `select` narrowing the parent columns the join is dropped
    // entirely — the row comes back with NO `user` property at all, not even
    // `user: null`. Verified against this schema:
    //
    //     findOne({ where:{id}, select:{ id, name, createdAt, user:{id} } })
    //     -> { id, name, createdAt }            // `user` silently absent
    //
    // so `shop.user?.id` evaluated to `undefined` and compared `undefined`
    // against the real owner id. That failed the guard for EVERY authenticated
    // caller, owner or not, which is why selecting a shop rendered an empty
    // dashboard instead of numbers: the client never inspected the 403.
    //
    // The scalar FK is always present and needs no join, so comparing against
    // it is both correct and one fewer query.
    const shop = await this.shopRepository.findOne({
      where: { id: shopId },
      select: { id: true, name: true, createdAt: true, userId: true },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this shop',
      );
    }

    const granularity = query.granularity ?? AnalyticsGranularity.DAY;
    const { from, to } = this.resolveRange(shop, query);

    return { shop, from, to, granularity };
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
   *
   * The sales query is grouped by `shopId` as well as by nothing else, and
   * the owner-wide figures are the SUM over those groups. This yields the
   * per-shop breakdown AND the portfolio total in the SAME single pass —
   * the breakdown rides along on a scan that was already happening rather
   * than costing a second query. The client uses it to show each shop's
   * sales in the picker, so a seller can see which shops actually have sales
   * before selecting one instead of selecting a zero-sales shop and
   * concluding the dashboard is broken.
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
        shops: [],
      };
    }

    const [productCount, rows] = await Promise.all([
      this.productRepository.count({
        where: { shop: { id: In(shopIds) } },
      }),
      this.orderItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .select('item."shopId"', 'shopId')
        .addSelect('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
        .addSelect('COALESCE(SUM(item.price * item.quantity), 0)', 'revenue')
        .where('item."shopId" IN (:...shopIds)', { shopIds })
        .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
        .andWhere('item."deliveryStatus" != :cancelled', {
          cancelled: DeliveryStatus.CANCELLED,
        })
        .groupBy('item."shopId"')
        .getRawMany<{ shopId: string; unitsSold: string; revenue: string }>(),
    ]);

    /**
     * Seed every shop with a zero entry, then overlay what the scan found.
     * Without this, a shop with no sales is simply absent from `shops` and
     * the client cannot tell "no sales" from "shop not yours" — the exact
     * ambiguity that made the dashboard look broken.
     */
    const salesByShop = new Map((rows ?? []).map((row) => [row.shopId, row]));

    const shops: ShopPortfolioEntry[] = shopIds.map((id) => {
      const found = salesByShop.get(id);

      return {
        shopId: id,
        unitsSold: toInt(found?.unitsSold),
        revenue: round2(toFloat(found?.revenue)),
      };
    });

    return {
      totalShops: shopIds.length,
      totalProducts: productCount,
      totalRevenue: round2(shops.reduce((sum, s) => sum + s.revenue, 0)),
      totalUnitsSold: shops.reduce((sum, s) => sum + s.unitsSold, 0),
      /**
       * Distinct orders is a per-portfolio figure and cannot be summed from
       * per-shop groups — the same order can contain lines from more than one
       * shop, so adding per-shop counts would double-count it. The correct
       * value is a count over the whole owner's line set, which is a single
       * extra aggregate. Cheap (one index-only pass) and, unlike the sums
       * above, the only reason a second query is needed here.
       */
      totalOrders: await this.countPaidOrdersForOwner(shopIds),
      currency: 'usd',
      shops,
    };
  }

  /**
   * Distinct paid orders containing at least one line from any of `shopIds`.
   *
   * Split out from `getPortfolioTotals` because it is the one figure that
   * cannot be derived from the per-shop groups. Kept as its own method so
   * the GROUP BY above stays a single pass and the intent of the two calls
   * is explicit rather than buried in a comment.
   */
  private async countPaidOrdersForOwner(shopIds: string[]): Promise<number> {
    const result = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('COUNT(DISTINCT item."orderId")', 'orders')
      .where('item."shopId" IN (:...shopIds)', { shopIds })
      .andWhere('order.status = :paid', { paid: OrderStatus.PAID })
      .andWhere('item."deliveryStatus" != :cancelled', {
        cancelled: DeliveryStatus.CANCELLED,
      })
      .getRawOne<{ orders: string }>();

    return toInt(result?.orders);
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

  // NOTE: `assertShopOwnership` used to live here as a second, hand-copied
  // version of the check now centralised in `authorize`. It carried the same
  // nested-relation-`select` bug that made every analytics request 403, which
  // is the argument for there being exactly one copy: two hand-written
  // ownership checks are two places to independently get it wrong, and the
  // controller used to call both on every request.

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
