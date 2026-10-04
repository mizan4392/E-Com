"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  price?: number;
  stock?: number;
  category?: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    price: "0",
    stock: "0",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiFetch<Product[]>("/admin/products");
      // Guard the shape so a non-array body can never crash the table.
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load products");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await apiFetch(
        editingId ? `/admin/products/${editingId}` : "/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        },
      );
      setForm({
        name: "",
        slug: "",
        description: "",
        category: "",
        price: "0",
        stock: "0",
      });
      setEditingId(null);
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save product");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Products
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Create and review products
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
            Category
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Price
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
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
              {editingId ? "Save changes" : "Create product"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    slug: "",
                    description: "",
                    category: "",
                    price: "0",
                    stock: "0",
                  });
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
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {product.name}
                  </td>
                  <td className="px-3 py-3">{product.category}</td>
                  <td className="px-3 py-3">{product.price}</td>
                  <td className="px-3 py-3">{product.stock}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(product.id);
                        setForm({
                          name: product.name,
                          slug: "",
                          description: product.description || "",
                          category: product.category || "",
                          price: String(product.price || 0),
                          stock: String(product.stock || 0),
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
