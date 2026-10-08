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

interface Shop {
  id: string;
  name: string;
  address?: string;
  slug?: string;
  description?: string;
}

const EMPTY_FORM = { name: "", slug: "", description: "", address: "" };

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
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

  function startEdit(shop: Shop) {
    setEditingId(shop.id);
    setForm({
      name: shop.name,
      slug: shop.slug || "",
      description: shop.description || "",
      address: shop.address || "",
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
      await apiFetch(editingId ? `/admin/shops/${editingId}` : "/admin/shops", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      resetForm();
      load();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save shop");
    }
  }

  const columns: TableColumn<Shop>[] = [
    { key: "name", header: "Name", primary: true, render: (s) => s.name },
    { key: "address", header: "Address", render: (s) => s.address || "—" },
    {
      key: "description",
      header: "Description",
      render: (s) => s.description || "—",
    },
  ];

  return (
    <PageContainer>
      <Card>
        <PageHeader
          eyebrow="Shops"
          title="Create and review shops"
          description="Shops are the marketplace sellers that list their own catalog."
        />

        <ErrorMessage message={error} />

        <form
          onSubmit={handleSubmit}
          className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
        >
          <TextField
            id="shop-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            id="shop-slug"
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <TextField
            id="shop-address"
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextField
            id="shop-description"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" className={PRIMARY_BUTTON_CLASS}>
              {editingId ? "Save changes" : "Create shop"}
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
          caption="Shops"
          columns={columns}
          rows={shops}
          emptyState="No shops yet. Create the first one above."
          rowActions={(shop) => (
            <button
              type="button"
              onClick={() => startEdit(shop)}
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
