"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const cards = [
  { label: "Total sales today", value: "0" },
  { label: "New products", value: "0" },
  { label: "New shops", value: "0" },
  { label: "Total shops", value: "0" },
  { label: "Total products", value: "0" },
  { label: "Total categories", value: "0" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(cards);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    fetch("http://localhost:4000/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats([
          { label: "Total sales today", value: data.totalSalesToday ?? 0 },
          { label: "New products", value: data.totalNewProducts ?? 0 },
          { label: "New shops", value: data.totalNewShops ?? 0 },
          { label: "Total shops", value: data.totalShops ?? 0 },
          { label: "Total products", value: data.totalProducts ?? 0 },
          { label: "Total categories", value: data.totalCategories ?? 0 },
        ]);
      })
      .catch(() => (window.location.href = "/login"));
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Your daily operations at a glance
          </h1>
        </div>
        <Link
          href="/admin/change-password"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Change password
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/categories"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create, review, and update product categories.
          </p>
        </Link>
        <Link
          href="/products"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage inventory, pricing, and product visibility.
          </p>
        </Link>
        <Link
          href="/shops"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold">Shops</h2>
          <p className="mt-2 text-sm text-slate-500">
            Add stores and manage the shop catalog.
          </p>
        </Link>
      </div>
    </div>
  );
}
