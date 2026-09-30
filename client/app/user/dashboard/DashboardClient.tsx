"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  useShopAnalytics,
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
 * Seller dashboard.
 *
 * Split out of `page.tsx` so the route can stay a server component (matching
 * the `ShopOrdersClient` pattern) even though every interaction here — shop
 * switching, range filtering, metric toggling — is client state.
 *
 * The page is split into TWO independent data sections, because the two
 * change on completely different triggers:
 *
 *  1. **All shops** — lifetime totals across every shop the owner runs,
 *     served by `/shop/analytics/portfolio` under its own query key. These
 *     numbers are the same no matter which shop is selected, so switching
 *     shops must NOT re-request them.
 *  2. **This shop** — range-filtered analytics for the selected shop. These
 *     DO change on every shop switch and every filter change.
 *
 * Keeping them in separate sections (and separate queries) is what makes the
 * "shop related data" behave independently of the portfolio totals.
 */
export default function DashboardClient() {
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>();
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
  const analyticsQuery = useShopAnalytics(
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

  /**
   * Default to the first shop once the list resolves.
   *
   * Written as a derived-state effect rather than `useState(shops[0])` because
   * `shops` is undefined on first render — reading it during initialisation
   * would permanently pin `selectedShopId` to undefined.
   */
  useEffect(() => {
    if (selectedShopId || !shops?.length) return;

    setSelectedShopId(shops[0].id);
  }, [shops, selectedShopId]);

  const shopCount = shops?.length ?? 0;
  const analytics = analyticsQuery.data;
  const isLoading = analyticsQuery.isLoading;
  const portfolio = portfolioQuery.data;
  const isPortfolioLoading = portfolioQuery.isLoading;

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
   * Everything here is derived from `analyticsQuery`, the only query that
   * re-runs when the seller switches shop or changes the range filter.
   */
  const shopStats = useMemo(() => {
    const currency = analytics?.currency ?? "usd";
    const period = analytics?.periodTotals;
    const previous = analytics?.previousPeriodTotals;

    return [
      {
        label: "Shop earnings",
        value: formatCurrency(analytics?.totals.revenue, currency),
        hint: "Lifetime, this shop",
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
        value: formatCount(analytics?.totals.unitsSold),
        hint: "Items sold, this shop",
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
        hint: "Per order, this shop",
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
                      onChange={setSelectedShopId}
                      isLoading={areShopsLoading}
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
                      data={analytics?.series ?? []}
                      metric={metric}
                      currency={analytics?.currency ?? "usd"}
                      isLoading={isLoading}
                    />
                  </DashboardCard>

                  <div className="grid grid-cols-1 gap-4">
                    <DashboardCard
                      title="Best sellers"
                      description="Top products in period"
                      compact
                    >
                      <TopProductsTable
                        products={analytics?.topProducts ?? []}
                        currency={analytics?.currency ?? "usd"}
                        isLoading={isLoading}
                      />
                    </DashboardCard>

                    <DashboardCard title="At a glance" compact>
                      <dl className="space-y-3 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-zinc-500">Orders (period)</dt>
                          <dd className="font-semibold tabular-nums text-zinc-900">
                            {isLoading
                              ? "—"
                              : formatCount(analytics?.periodTotals.orders)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-zinc-500">Units (period)</dt>
                          <dd className="font-semibold tabular-nums text-zinc-900">
                            {isLoading
                              ? "—"
                              : formatCount(analytics?.periodTotals.unitsSold)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-zinc-500">Avg. order value</dt>
                          <dd className="font-semibold tabular-nums text-zinc-900">
                            {isLoading || !analytics?.averageOrderValue
                              ? "—"
                              : formatCurrency(
                                  analytics.averageOrderValue,
                                  analytics.currency,
                                )}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-zinc-500">Products in shop</dt>
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
              </DashboardSection>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
