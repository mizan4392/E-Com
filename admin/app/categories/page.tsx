"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiFetch<Category[]>("/admin/categories");
      // The endpoint returns an array; guard anyway so a stray error body can
      // never crash the table with "categories.map is not a function".
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to load categories",
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await apiFetch(
        editingId ? `/admin/categories/${editingId}` : "/admin/categories",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      setForm({ name: "", slug: "", description: "" });
      setEditingId(null);
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save category");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Categories
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Create and review categories
            </h1>
          </div>
          <Link
            href="/"
            className="bg-slate-900  cursor-pointer rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-white"
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
          className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
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
            Description
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="md:col-span-3 flex gap-3">
            <button
              type="submit"
              className=" cursor-pointer rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              {editingId ? "Save changes" : "Create category"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", slug: "", description: "" });
                }}
                className="bg-slate-900 cursor-pointer rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
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
                <th className="px-3 py-3">Slug</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {category.name}
                  </td>
                  <td className="px-3 py-3 text-slate-900">{category.slug}</td>
                  <td className="px-3 py-3 text-slate-900">
                    {category.description}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id);
                        setForm({
                          name: category.name,
                          slug: category.slug || "",
                          description: category.description || "",
                        });
                      }}
                      className="rounded-full border border-slate-900 px-3 py-1 text-sm text-slate-900 cursor-pointer"
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
