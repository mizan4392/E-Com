"use client";

import { useState } from "react";
import type { Category, CreateShopPayload } from "../../types/shop";
import Image from "next/image";
interface CreateShopModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: CreateShopPayload) => Promise<void>;
  submitting: boolean;
}

export default function CreateShopModal({
  isOpen,
  categories,
  onClose,
  onSubmit,
  submitting,
}: CreateShopModalProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    categoryId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setFile(file);

    const imgUrl = URL.createObjectURL(file);
    setImagePreview(imgUrl);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Submitting form:", form);
    if (!file) {
      alert("Please upload a banner image before submitting.");
      return;
    }
    await onSubmit({ ...form, file: file || undefined });
    setForm({
      name: "",
      description: "",
      address: "",
      categoryId: "",
    });
    setFile(null);
    setImagePreview(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Create shop</h2>
            <p className="text-sm text-zinc-600">
              Share your shop details and choose a category.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-zinc-500 cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Name
            </label>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Address
            </label>
            <input
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Banner image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
            />
            <p className="mt-2 text-xs text-zinc-500">
              You can upload a banner image and it will be stored as a data URL
              for this demo.
            </p>

            {imagePreview && (
              <div className="mt-2">
                <Image
                  width={800}
                  height={320}
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg border border-zinc-200 object-cover"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Category
            </label>
            <select
              required
              value={form.categoryId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
