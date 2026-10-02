"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import ProtectedRoute from "../../components/ProtectedRoute";
import StatCardGrid from "../../components/dashboard/StatCardGrid";
import DashboardCard from "../../components/dashboard/DashboardCard";
import DashboardSection from "../../components/dashboard/DashboardSection";
import ShopSelector from "../../components/dashboard/ShopSelector";
import AnalyticsFilterBar from "../../components/dashboard/AnalyticsFilterBar";
import SalesChart from "../../components/dashboard/SalesChart";
import TopProductsTable from "../../components/dashboard/TopProductsTable";

import { useGetUserShop } from "../../../lib/shop/queries";
import {
  useShopAnalyticsCards,
  useShopAnalyticsDetails,
  useShopPortfolio,
} from "../../../lib/analytics/queries";

import type { AnalyticsMetric } from "../../../types/analytics";
import {
  DEFAULT_RANGE_PRESET_ID,
  formatCount,
  formatCurrency,
  formatRangeLabel,
  getRangePreset,
  percentageChange,
  resolvePresetRange,
  type AnalyticsRangePreset,
} from "../../../util/analytics";

/**
 * Turns a failed request into a sentence a seller can act on.
 *
 * A bare "403" tells the user nothing about whether the problem is
 * temporary, a permissions issue, or a shop they no longer own. These are the
 * three that actually occur here, so they get distinct copy:
 *
 * - 401: the session expired — retrying alone will not help.
 * - 403: the shop is not theirs (or was deleted / ownership changed).
 * - network: the request never reached the server.
 */
function readableError(error: unknown): string {
  const status = (error as { status?: number })?.status;

  if (status === 401) {
    return "Your session has expired. Sign in again to see your analytics.";
  }

  if (status === 403) {
    return "You do not have access to this shop's analytics. If you just lost access to it, pick another shop from the list above.";
  }

  if ((error as { status?: number })?.status === undefined) {
    return "We could not reach the server. Check your connection and try again.";
  }

  return "Something went wrong loading your shop analytics. Please try again.";
}

export default function DashboardClient() {
  /**
   * `null` means "no explicit choice yet" — the seller has not touched the
   * picker. It is NOT a shop id, which is what lets the effective selection
   * below fall back to the first shop without needing an effect to push that
   * value into state.
   */
  const [chosenShopId, setChosenShopId] = useState<string | null>(null);
  const [presetId, setPresetId] = useState(DEFAULT_RANGE_PRESET_ID);
  const [metric, setMetric] = useState<AnalyticsMetric>("revenue");

  const { data: shops, isLoading: areShopsLoading } = useGetUserShop();
  const preset = useMemo(() => getRangePreset(presetId), [presetId]);

  /**
   * "Today" is resolved once per mount rather than on every render, so the
   * `from`/`to` pair — and therefore the React Query key — stays stable while
   * the page is open. Resolving per render would produce a new key at
   * midnight and silently refetch.
   */
  const [today] = useState(() => new Date());
  const range = useMemo(
    () => resolvePresetRange(preset, today),
    [preset, today],
  );

  /**
   * The shop actually shown, DERIVED rather than stored.
   *
   * This was previously an effect doing `setSelectedShopId(shops[0].id)` once
   * the list arrived. That cost an extra render pass on every dashboard load
   * and tripped the `react-hooks/set-state-in-effect` rule.
   *
   * Deriving it is also what makes the auto-select deterministic: the server
   * now returns the shop list with an explicit `ORDER BY createdAt DESC`, so
   * "the first shop" is a stable, meaningful choice (newest shop first)
   * instead of whatever order Postgres happened to produce.
   *
   * Guarded so a stale choice for a shop the owner no longer owns falls back
   * to the first shop rather than requesting analytics for a deleted id.
   */
  const selectedShopId = useMemo(() => {
    if (!shops?.length) return undefined;
    if (chosenShopId && shops.some((shop) => shop.id === chosenShopId)) {
      return chosenShopId;
    }

    return shops[0].id;
  }, [chosenShopId, shops]);

  /**
   * TWO independent requests, deliberately not one.
   *
   * `cards` is the fast one (a single flat aggregate) and backs the four KPI
   * tiles. `details` is the expensive one (two grouped scans with a
   * `date_trunc`) and backs the chart and best-seller table. Separate keys, so
   * selecting a shop paints the numbers as soon as the cards land and the
   * chart fills in when it arrives — instead of every tile waiting on a chart
   * it does not display.
   *
   * Both take the same `range`, so they always describe the same window.
   */
  const cardsQuery = useShopAnalyticsCards(
    selectedShopId,
    preset.granularity,
    range,
  );

  const detailsQuery = useShopAnalyticsDetails(
    selectedShopId,
    preset.granularity,
    range,
  );

  /**
   * Portfolio totals are fetched ONCE and keyed without the shop id, so
   * changing the selected shop below never re-triggers this request. The
   * server groups across every shop the owner runs in a single pass.
   */
  const portfolioQuery = useShopPortfolio();

  const shopCount = shops?.length ?? 0;

  /** Cards own every number on the page, so all of it reads from here. */
  const analytics = cardsQuery.data;
  const isLoading = cardsQuery.isLoading;

  /** Chart + best sellers, loaded independently of the numbers. */
  const details = detailsQuery.data;
  const isDetailsLoading = detailsQuery.isLoading;

  const portfolio = portfolioQuery.data;
  const isPortfolioLoading = portfolioQuery.isLoading;

  /**
   * Surface a FAILED request instead of an empty dashboard.
   *
   * This is not cosmetic. The dashboard previously read only `data`, so any
   * error — including the 403 the server returned when the ownership check
   * failed — rendered as the same zeroed tiles and blank chart as a genuinely
   * new shop. A seller could not tell "this shop has no sales" from "this
   * request failed", which is exactly the ambiguity that made the empty
   * dashboard look broken.
   *
   * Cards are checked first because they own every visible number: if they
   * failed, the page has nothing truthful to show. A details-only failure is
   * reported inline by the chart section, since the tiles are still valid.
   */
  const cardsError = cardsQuery.error;
  const detailsError = detailsQuery.error;

  /**
   * True when the selected shop has paid, non-cancelled sales over its whole
   * history but none inside the chosen range — OR none at all. Drives the
   * explanatory panel under the chart.
   *
   * Guarded on `!isLoading` and on the server data being present, so the panel
   * never flashes during a refetch that switches shops.
   */
  const hasNoSalesInPeriod =
    !isLoading &&
    !cardsError &&
    !!analytics &&
    (analytics.periodTotals?.unitsSold ?? 0) === 0;

  /**
   * Compares a metric in the selected window against the SAME metric in the
   * window immediately before it.
   *
   * The metric is passed explicitly rather than hardcoded: comparing units
   * sold against a dollar figure would produce a nonsense percentage, and
   * because `percentageChange` returns `null` for a zero baseline, the bug
   * would have shown up as "No comparison" on revenue cards while units
   * silently reported a fabricated trend.
   *
   * `null` when there is no previous window, so the UI can show a neutral
   * "no comparison" rather than a fake +100%.
   */
  const compare = useCallback(
    (current: number | undefined, previousValue: number | undefined) =>
      percentageChange(current ?? 0, previousValue ?? 0),
    [],
  );

  /**
   * PORTFOLIO stats — every shop the owner runs, lifetime.
   *
   * Deliberately built from `portfolioQuery` only. Nothing in here depends on
   * `selectedShopId`, `presetId` or the resolved range, which is what keeps
   * these tiles from changing when the seller switches shops or filters.
   *
   * No trend column: a period-over-period comparison is meaningless for
   * lifetime totals, and showing one would imply a window that isn't applied.
   */
  const portfolioStats = useMemo(() => {
    const currency = portfolio?.currency ?? "usd";
    const shopLabel = shopCount === 1 ? "1 shop" : `${shopCount} shops`;

    return [
      {
        label: "Total earnings",
        value: formatCurrency(portfolio?.totalRevenue, currency),
        hint: `Lifetime, across ${shopLabel}`,
        tone: "accent" as const,
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v18m4.5-14.5C16.5 5.5 14.5 4.5 12 4.5S7.5 5.5 7.5 8s2 3.2 4.5 3.5 4.5 1.3 4.5 3.5-2 3.5-4.5 3.5-4.5-1-4.5-2.5"
            />
          </svg>
        ),
      },
      {
        label: "Total sales",
        value: formatCount(portfolio?.totalUnitsSold),
        hint: "Items sold, all shops",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.3a1.5 1.5 0 0 0 1.5-1.2L20 8H6.2M9.5 20a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Zm8 0a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Z"
            />
          </svg>
        ),
      },
      {
        label: "Total shops",
        value: formatCount(portfolio?.totalShops ?? shopCount),
        hint: "Shops you own",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 10h16l-1.4-5H5.4L4 10Zm1.5 0v9h13v-9M9 19v-5h6v5M4 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"
            />
          </svg>
        ),
      },
      {
        label: "Total products",
        value: formatCount(portfolio?.totalProducts),
        hint: "Across all your shops",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Zm0 0v8.5m8-4.3-8 4.3m-8-4.3 8 4.3m0 8.2V11.5"
            />
          </svg>
        ),
      },
    ];
  }, [portfolio, shopCount]);

  /**
   * SHOP stats — the selected shop only, with period-over-period trend.
   *
   * Everything here is derived from `cardsQuery`, the only query that owns
   * these numbers and the only one that re-runs on a shop or range change.
   *
   * All four tiles are PERIOD-scoped (`periodTotals`), deliberately.
   *
   * These used to mix two windows side by side — "Shop earnings"/"Shop sales"
   * were labelled Lifetime while "Orders in period" was period-scoped. The
   * chart underneath is period-scoped too, so a shop with lifetime sales but
   * none inside the selected range rendered as a full-size lifetime number
   * above an empty chart. That reads as a bug, not as an empty period, and it
   * is the reason "my shop shows 14 sold but selecting a shop shows nothing".
   * Tiles and chart now always describe the SAME window. Lifetime figures
   * remain visible in the portfolio section and in the picker labels.
   */
  const shopStats = useMemo(() => {
    const currency = analytics?.currency ?? "usd";
    const period = analytics?.periodTotals;
    const previous = analytics?.previousPeriodTotals;

    return [
      {
        label: "Shop earnings",
        value: formatCurrency(period?.revenue, currency),
        hint: "In selected range",
        change: compare(period?.revenue, previous?.revenue),
        changeLabel: "vs previous period",
        tone: "accent" as const,
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v18m4.5-14.5C16.5 5.5 14.5 4.5 12 4.5S7.5 5.5 7.5 8s2 3.2 4.5 3.5 4.5 1.3 4.5 3.5-2 3.5-4.5 3.5-4.5-1-4.5-2.5"
            />
          </svg>
        ),
      },
      {
        label: "Shop sales",
        value: formatCount(period?.unitsSold),
        hint: "In selected range",
        change: compare(period?.unitsSold, previous?.unitsSold),
        changeLabel: "vs previous period",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.3a1.5 1.5 0 0 0 1.5-1.2L20 8H6.2M9.5 20a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Zm8 0a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Z"
            />
          </svg>
        ),
      },
      {
        label: "Orders in period",
        value: formatCount(period?.orders),
        hint: "Distinct paid orders",
        change: compare(period?.orders, previous?.orders),
        changeLabel: "vs previous period",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.5 3.5h11l1.5 4v13H5v-13l1.5-4Zm-1.5 4h14M9.5 8.5h5"
            />
          </svg>
        ),
      },
      {
        label: "Avg. order value",
        value: formatCurrency(analytics?.averageOrderValue, currency),
        hint: "Lifetime, this shop",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7.5h16M4 12h10M4 16.5h7M17.5 15.5h.01"
            />
          </svg>
        ),
      },
    ];
  }, [analytics, compare]);

  const handlePresetChange = (next: AnalyticsRangePreset) => {
    setPresetId(next.id);
  };

  const hasShops = shopCount > 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page header. No data picker here — the shop selector lives in the
              "This shop" section below, attached to the data it changes. */}
          <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
              Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {areShopsLoading
                ? "Loading your dashboard..."
                : "Your shop performance"}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Lifetime totals across all your shops, plus range-filtered
              analytics for the shop you select.
            </p>
          </div>

          {!hasShops && !areShopsLoading ? (
            <DashboardCard title="No shop yet">
              <p className="text-sm text-zinc-600">
                You do not own a shop, so there is nothing to chart yet. Create
                a shop and its analytics will appear here automatically.
              </p>
              <Link
                href="/user/user-shop"
                className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Create a shop
              </Link>
            </DashboardCard>
          ) : (
            <>
              {/*
                SECTION 1 — PORTFOLIO ("All shops").
                Fetched once, keyed without a shop id, and built purely from
                `portfolioQuery`. Changing the selected shop or the range
                filter below cannot re-trigger it, so these four tiles stay
                visually and numerically stable.
              */}
              <DashboardSection
                eyebrow="All shops"
                title="Everything at a glance"
                description="Lifetime totals across every shop you own. These don't change when you switch shops or filters."
              >
                <StatCardGrid
                  stats={portfolioStats.map((stat) => ({
                    ...stat,
                    isLoading: isPortfolioLoading,
                  }))}
                />
              </DashboardSection>

              {/* SECTION 2 — SELECTED SHOP. Everything below is scoped to the
                  shop chosen in the picker and is the only part that refetches
                  when the shop or the range filter changes. */}
              <DashboardSection
                eyebrow="This shop"
                title={analytics?.shopName ?? "Shop analytics"}
                description="Earnings, sales and best sellers for the selected shop, over the range you pick."
                className="mt-6"
                action={
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <ShopSelector
                      shops={shops ?? []}
                      value={selectedShopId ?? ""}
                      onChange={setChosenShopId}
                      isLoading={areShopsLoading}
                      salesByShop={portfolio?.shops}
                    />
                    <Link
                      href="/user/shop-orders"
                      className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                    >
                      Shop orders
                    </Link>
                  </div>
                }
              >
                {/*
                  Cards failed. Rendered INSTEAD of the tiles rather than above
                  them: the tile values are all derived from `cards`, so with
                  no successful response every one of them would show a zero
                  that is not a real measurement. Showing zeros next to an
                  error would still let "0 sold" be read as the answer.
                */}
                {cardsError ? (
                  <DashboardCard title="Could not load shop analytics">
                    <p className="text-sm text-zinc-600">
                      {readableError(cardsError)}
                    </p>
                    <button
                      type="button"
                      onClick={() => cardsQuery.refetch()}
                      className="mt-4 inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                    >
                      Try again
                    </button>
                  </DashboardCard>
                ) : (
                  <>
                    <StatCardGrid
                      stats={shopStats.map((stat) => ({ ...stat, isLoading }))}
                    />

                    <div className="mt-6">
                      <AnalyticsFilterBar
                        presetId={presetId}
                        onPresetChange={handlePresetChange}
                        metric={metric}
                        onMetricChange={setMetric}
                        resolvedRangeLabel={
                          analytics
                            ? formatRangeLabel(
                                analytics.range.from,
                                analytics.range.to,
                              )
                            : undefined
                        }
                        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <DashboardCard
                        title="Sales over time"
                        description={
                          metric === "revenue"
                            ? "Earnings per period"
                            : "Units sold per period"
                        }
                        className="lg:col-span-2"
                      >
                        <SalesChart
                          data={details?.series ?? []}
                          metric={metric}
                          currency={analytics?.currency ?? "usd"}
                          isLoading={isDetailsLoading}
                        />
                        {/*
                      Details failed while the cards succeeded. The tiles
                      above are still valid, so this is reported inline rather
                      than replacing the section — but it must be visible,
                      because an empty chart on its own is indistinguishable
                      from a shop with no sales in range.
                    */}
                        {detailsError ? (
                          <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
                            <p className="text-sm font-medium text-amber-900">
                              Could not load the sales chart
                            </p>
                            <p className="mt-1 text-sm text-amber-800">
                              {readableError(detailsError)}
                            </p>
                          </div>
                        ) : null}
                        {/*
                      Empty state.
                      Reached when the selected shop genuinely has no paid,
                      non-cancelled sales in the chosen range. The bare zeros
                      above it look like a failure, so state the cause plainly
                      and surface the LIFETIME total — otherwise a shop that
                      has sold in the past but not in this window looks
                      identical to a shop that has never sold at all.

                      Gated on BOTH queries: the cards alone prove there are
                      no period sales, but the lifetime figure it quotes and
                      the chart it annotates come from `details`, so showing it
                      before details land would flash the wrong number.
                    */}
                        {hasNoSalesInPeriod &&
                        !isDetailsLoading &&
                        !detailsError ? (
                          <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
                            <p className="text-sm font-medium text-amber-900">
                              No sales in this range
                            </p>
                            <p className="mt-1 text-sm text-amber-800">
                              {analytics && analytics.totals.unitsSold > 0 ? (
                                <>
                                  {analytics.shopName} has sold{" "}
                                  <strong className="font-semibold">
                                    {formatCount(analytics.totals.unitsSold)}
                                  </strong>{" "}
                                  items in total, but none between{" "}
                                  {formatRangeLabel(
                                    analytics.range.from,
                                    analytics.range.to,
                                  )}
                                  . Try a wider range, or another shop in the
                                  picker.
                                </>
                              ) : (
                                <>
                                  {analytics?.shopName ?? "This shop"} has no
                                  paid orders yet. Only paid orders count as
                                  sales — pending and cancelled ones are
                                  excluded.
                                </>
                              )}
                            </p>
                          </div>
                        ) : null}
                      </DashboardCard>

                      <div className="grid grid-cols-1 gap-4">
                        <DashboardCard
                          title="Best sellers"
                          description="Top products in period"
                          compact
                        >
                          <TopProductsTable
                            products={details?.topProducts ?? []}
                            currency={analytics?.currency ?? "usd"}
                            isLoading={isDetailsLoading}
                          />
                        </DashboardCard>

                        {/*
                      Lifetime context, deliberately NOT a repeat of the
                      tiles.

                      This used to list orders/units/AOV for the period —
                      figures already shown directly above in the KPI tiles,
                      which made the panel pure duplication. The tiles are all
                      period-scoped, so the lifetime numbers existed nowhere
                      on the page; that is the genuinely useful thing to put
                      here, and it is what a seller comparing "this period"
                      against "all time" actually wants.

                      Reads from `analytics` (cards), not `details` — these
                      are lifetime totals already resolved by the fast query,
                      so this panel never waits on the chart.
                    */}
                        <DashboardCard
                          title="Lifetime"
                          description="All time, this shop"
                          compact
                        >
                          <dl className="space-y-3 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-zinc-500">
                                Lifetime earnings
                              </dt>
                              <dd className="font-semibold tabular-nums text-zinc-900">
                                {isLoading
                                  ? "—"
                                  : formatCurrency(
                                      analytics?.totals.revenue,
                                      analytics?.currency,
                                    )}
                              </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-zinc-500">
                                Items sold (all time)
                              </dt>
                              <dd className="font-semibold tabular-nums text-zinc-900">
                                {isLoading
                                  ? "—"
                                  : formatCount(analytics?.totals.unitsSold)}
                              </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-zinc-500">
                                Orders (all time)
                              </dt>
                              <dd className="font-semibold tabular-nums text-zinc-900">
                                {isLoading
                                  ? "—"
                                  : formatCount(analytics?.totals.orders)}
                              </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-zinc-500">
                                Products in shop
                              </dt>
                              <dd className="font-semibold tabular-nums text-zinc-900">
                                {isLoading
                                  ? "—"
                                  : formatCount(analytics?.productCount)}
                              </dd>
                            </div>
                          </dl>
                        </DashboardCard>
                      </div>
                    </div>
                  </>
                )}
              </DashboardSection>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
