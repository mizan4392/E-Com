"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";
import PageHeader, {
  Card,
  ErrorMessage,
  PageContainer,
} from "@/components/layout/PageHeader";
import { ResponsiveGrid, StatCard } from "@/components/layout/ResponsiveGrid";
import { SECONDARY_BUTTON_CLASS } from "@/components/layout/Form";

interface DashboardStats {
  totalSalesToday?: number;
  totalNewProducts?: number;
  totalNewShops?: number;
  totalShops?: number;
  totalProducts?: number;
  totalCategories?: number;
}

const EMPTY_CARDS = [
  { label: "Total sales today", value: 0 },
  { label: "New products", value: 0 },
  { label: "New shops", value: 0 },
  { label: "Total shops", value: 0 },
  { label: "Total products", value: 0 },
  { label: "Total categories", value: 0 },
];

const SHORTCUTS = [
  {
    href: "/categories",
    title: "Categories",
    body: "Create, review, and update product categories.",
  },
  {
    href: "/products",
    title: "Products",
    body: "Manage inventory, pricing, and product visibility.",
  },
  {
    href: "/shops",
    title: "Shops",
    body: "Add stores and manage the shop catalog.",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(EMPTY_CARDS);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<DashboardStats>("/admin/dashboard");
        if (cancelled) return;
        setStats([
          { label: "Total sales today", value: data.totalSalesToday ?? 0 },
          { label: "New products", value: data.totalNewProducts ?? 0 },
          { label: "New shops", value: data.totalNewShops ?? 0 },
          { label: "Total shops", value: data.totalShops ?? 0 },
          { label: "Total products", value: data.totalProducts ?? 0 },
          { label: "Total categories", value: data.totalCategories ?? 0 },
        ]);
      } catch (err) {
        if (cancelled) return;
        // An expired token is a routing problem, not an error to display.
        if (err instanceof UnauthorizedError) {
          redirectToLogin();
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load stats");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <Card>
        <PageHeader
          eyebrow="Admin dashboard"
          title="Your daily operations at a glance"
        />

        <ErrorMessage message={error} />

        <ResponsiveGrid cols="stat">
          {stats.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </ResponsiveGrid>
      </Card>

      <ResponsiveGrid cols="tiles" className="mt-4">
        {SHORTCUTS.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {shortcut.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{shortcut.body}</p>
          </Link>
        ))}
      </ResponsiveGrid>
    </PageContainer>
  );
}
