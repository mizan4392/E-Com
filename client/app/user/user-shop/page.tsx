"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import CreateShopModal from "../../components/CreateShopModal";
import ProtectedRoute from "../../components/ProtectedRoute";

import type { Category, CreateShopPayload, Shop } from "../../../types/shop";
import { apiFetch, apiFormData } from "../../../lib/apiClient";

export default function UserShopPage() {
  const { getToken } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopData, categoryData] = await Promise.all([
          apiFetch<Shop[]>("/users/me/shops", { method: "GET" }),
          apiFetch<Category[]>("/users/categories", { method: "GET" }),
        ]);
        setShops(shopData);
        setCategories(categoryData);
      } catch {
        setError("Unable to load your shops right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [getToken]);

  const handleSubmit = async (payload: CreateShopPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", payload.file as Blob);
      Object.keys(payload).forEach((key) => {
        if (key !== "file") {
          formData.append(key, (payload as any)[key]);
        }
      });
      console.log("Submitting form data:", formData);

      const created = await apiFormData<Shop>("/users/me/shops", formData);
      console.log("Created shop:", created);
      setShops((prev) => [created, ...prev]);
      setIsModalOpen(false);
    } catch {
      setError("Unable to create your shop right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
                My Shop
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                Manage your shops
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Create a new shop and keep track of the places you own.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Create new shop
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm">
              Loading your shops...
            </div>
          ) : shops.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 shadow-sm">
              <p className="text-lg font-semibold text-zinc-900">
                No shops yet
              </p>
              <p className="mt-2 text-sm">
                Start by creating your first shop with a banner image and
                category.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {shops.map((shop) => (
                <article
                  key={shop.id}
                  className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                >
                  {shop.imageUrl ? (
                    <img
                      src={
                        shop.imageUrl.startsWith("http")
                          ? shop.imageUrl
                          : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.imageUrl}`
                      }
                      alt={shop.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    // <Image
                    // src={
                    //   shop.imageUrl.startsWith("http")
                    //     ? shop.imageUrl
                    //     : `${process.env.NEXT_PUBLIC_ASSET_API}/${shop.imageUrl}`
                    // }
                    //   alt={shop.name}
                    //   width={800}
                    //   height={320}
                    //   className="h-44 w-full object-cover"
                    // />
                    <div className="flex h-44 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                      No banner image
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                          {shop.name}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600">
                          {shop.description || "No description yet"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-zinc-600">
                      {shop.address ? <p>Address: {shop.address}</p> : null}
                      {shop.category ? (
                        <p>Category: {shop.category.name}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <CreateShopModal
          isOpen={isModalOpen}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </main>
    </ProtectedRoute>
  );
}
