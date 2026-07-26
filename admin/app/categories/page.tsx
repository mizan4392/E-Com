"use client";

import Link from "next/dist/client/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const token = localStorage.getItem("adminToken");
    const response = await fetch("http://localhost:4000/admin/categories", {
      headers: { Authorization: `Bearer ${token}` || "" },
    });
    const data = await response.json();

    setCategories(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const response = await fetch(
      editingId
        ? `http://localhost:4000/admin/categories/${editingId}`
        : "http://localhost:4000/admin/categories",
      {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` || "",
        },
        body: JSON.stringify(form),
      },
    );
    if (response.ok) {
      setForm({ name: "", slug: "", description: "" });
      setEditingId(null);
      load();
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
