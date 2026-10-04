"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";

interface Shop {
  id: string;
  name: string;
  address?: string;
  slug?: string;
  description?: string;
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiFetch<Shop[]>("/admin/shops");
      // Guard the shape so a non-array body can never crash the table.
      setShops(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load shops");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await apiFetch(editingId ? `/admin/shops/${editingId}` : "/admin/shops", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", slug: "", description: "", address: "" });
      setEditingId(null);
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save shop");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Shops
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Create and review shops
            </h1>
          </div>
          <Link
            href="/"
            className="bg-slate-900 text-white rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </div>

        {error ? (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
        >
          <label className="text-sm font-medium text-slate-700">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Address
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Description
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              {editingId ? "Save changes" : "Create shop"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", slug: "", description: "", address: "" });
                }}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {shop.name}
                  </td>
                  <td className="px-3 py-3">{shop.address}</td>
                  <td className="px-3 py-3">{shop.description}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(shop.id);
                        setForm({
                          name: shop.name,
                          slug: shop.slug || "",
                          description: shop.description || "",
                          address: shop.address || "",
                        });
                      }}
                      className="rounded-full border border-slate-300 px-3 py-1 text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
