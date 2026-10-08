"use client";

import { useEffect, useState } from "react";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";
import PageHeader, {
  Card,
  ErrorMessage,
  PageContainer,
} from "@/components/layout/PageHeader";
import ResponsiveTable, {
  type TableColumn,
} from "@/components/layout/ResponsiveTable";
import {
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TextField,
} from "@/components/layout/Form";

interface Product {
  id: string;
  name: string;
  price?: number;
  stock?: number;
  category?: string;
  description?: string;
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  category: "",
  price: "0",
  stock: "0",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
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

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: "",
      description: product.description || "",
      category: product.category || "",
      price: String(product.price || 0),
      stock: String(product.stock || 0),
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
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
      resetForm();
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save product");
    }
  }

  const columns: TableColumn<Product>[] = [
    { key: "name", header: "Name", primary: true, render: (p) => p.name },
    { key: "category", header: "Category", render: (p) => p.category || "—" },
    {
      key: "price",
      header: "Price",
      numeric: true,
      render: (p) => p.price ?? 0,
    },
    {
      key: "stock",
      header: "Stock",
      numeric: true,
      render: (p) => p.stock ?? 0,
    },
  ];

  return (
    <PageContainer>
      <Card>
        <PageHeader
          eyebrow="Products"
          title="Create and review products"
          description="Add a product to the catalog, or edit an existing one."
        />

        <ErrorMessage message={error} />

        <form
          onSubmit={handleSubmit}
          className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
        >
          <TextField
            id="product-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            id="product-slug"
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <TextField
            id="product-category"
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <TextField
            id="product-price"
            label="Price"
            type="number"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <TextField
            id="product-stock"
            label="Stock"
            type="number"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <TextField
            id="product-description"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {/* Stacked full-width on mobile, inline from `sm` up. */}
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" className={PRIMARY_BUTTON_CLASS}>
              {editingId ? "Save changes" : "Create product"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className={SECONDARY_BUTTON_CLASS}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <ResponsiveTable
          caption="Products"
          columns={columns}
          rows={products}
          emptyState="No products yet. Create the first one above."
          rowActions={(product) => (
            <button
              type="button"
              onClick={() => startEdit(product)}
              className="cursor-pointer rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Edit
            </button>
          )}
        />
      </Card>
    </PageContainer>
  );
}
