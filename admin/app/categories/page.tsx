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

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

const EMPTY_FORM = { name: "", slug: "", description: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
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

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug || "",
      description: category.description || "",
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
        editingId ? `/admin/categories/${editingId}` : "/admin/categories",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      resetForm();
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save category");
    }
  }

  const columns: TableColumn<Category>[] = [
    { key: "name", header: "Name", primary: true, render: (c) => c.name },
    { key: "slug", header: "Slug", render: (c) => c.slug || "—" },
    {
      key: "description",
      header: "Description",
      render: (c) => c.description || "—",
    },
  ];

  return (
    <PageContainer>
      <Card>
        <PageHeader
          eyebrow="Categories"
          title="Create and review categories"
          description="Categories group products in the storefront catalog."
        />

        <ErrorMessage message={error} />

        <form
          onSubmit={handleSubmit}
          className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <TextField
            id="category-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            id="category-slug"
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <TextField
            id="category-description"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 lg:col-span-1"
          />

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row lg:col-span-3">
            <button type="submit" className={PRIMARY_BUTTON_CLASS}>
              {editingId ? "Save changes" : "Create category"}
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
          caption="Categories"
          columns={columns}
          rows={categories}
          emptyState="No categories yet. Create the first one above."
          rowActions={(category) => (
            <button
              type="button"
              onClick={() => startEdit(category)}
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
