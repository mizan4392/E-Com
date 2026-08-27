"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";

export type ProductCategoryOption = {
  id: string;
  name: string;
};

type CategorySelectProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  categories: ProductCategoryOption[];
};

function CategorySelect({ value, onChange, categories }: CategorySelectProps) {
  return (
    <label className="block text-sm font-medium text-zinc-700 sm:col-span-2">
      Category
      <select
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl: string[];
  removedImageUrls?: string[];
};

export type ProductModalMode = "create" | "update";

type ProductModalProps = {
  open: boolean;
  mode?: ProductModalMode;
  title?: string;
  description?: string;
  categories?: ProductCategoryOption[];
  initialValues?: Partial<ProductFormValues>;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (
    values: ProductFormValues & { files: File[] },
  ) => Promise<void> | void;
};

const EMPTY_FORM: ProductFormValues = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  categoryId: "",
  imageUrl: [],
};

const getEmptyValues = (
  initialValues?: Partial<ProductFormValues>,
): ProductFormValues => ({
  ...EMPTY_FORM,
  ...initialValues,
  name: initialValues?.name ?? "",
  description: initialValues?.description ?? "",
  price: initialValues?.price ?? 0,
  stock: initialValues?.stock ?? 0,
  categoryId: initialValues?.categoryId ?? "",
  imageUrl: initialValues?.imageUrl ?? [],
});

export default function ProductModal({
  open,
  mode = "create",
  title,
  description,
  categories = [],
  initialValues,
  submitting = false,
  onClose,
  onSubmit,
}: ProductModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ProductModalContent
      key={`${mode}-${JSON.stringify(initialValues ?? {})}`}
      mode={mode}
      title={title}
      description={description}
      categories={categories}
      initialValues={initialValues}
      submitting={submitting}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function ProductModalContent({
  mode,
  title,
  description,
  categories,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}: Omit<ProductModalProps, "open">) {
  console.log("initial values", initialValues);
  const [form, setForm] = useState<ProductFormValues>(() =>
    getEmptyValues(initialValues),
  );
  const [existingImages, setExistingImages] = useState<string[]>(
    initialValues?.imageUrl ?? [],
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [removedImages, setRemoveImages] = useState<string[]>([]);

  const allImages = useMemo(
    () => [...existingImages, ...uploadedImages],
    [existingImages, uploadedImages],
  );

  const isUpdateMode = mode === "update";
  const modalTitle =
    title ?? (isUpdateMode ? "Update product" : "Add a new product");
  const helperText =
    description ??
    (isUpdateMode
      ? "Update the product information and gallery below."
      : "Create a clean product listing with clear details and images.");

  const handleFieldChange =
    (field: keyof ProductFormValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value = event.target.value;
      setForm((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const imagePreviews = files.map((file) => URL.createObjectURL(file));

    setUploadedFiles((previous) => [...previous, ...files]);
    setUploadedImages((previous) => [...previous, ...imagePreviews]);
    event.target.value = "";
  };

  const removeImage = (index: number, img: string) => {
    setRemoveImages([...removedImages, img]);
    if (index < existingImages.length) {
      setExistingImages((previous) =>
        previous.filter((_, imageIndex) => imageIndex !== index),
      );
      return;
    }

    const uploadedIndex = index - existingImages.length;
    setUploadedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== uploadedIndex),
    );
    setUploadedFiles((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== uploadedIndex),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: ProductFormValues & { files: File[] } = {
      ...form,
      // imageUrl: [...existingImages, ...uploadedImages],
      files: uploadedFiles,
      removedImageUrls: removedImages,
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close product modal"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
              {isUpdateMode ? "Product update" : "Product creation"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl">
              {modalTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[85vh] overflow-y-auto p-4 sm:p-6"
        >
          <div className="space-y-5">
            <div>
              <p className="text-sm text-zinc-600">{helperText}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 sm:col-span-2">
                Product name
                <input
                  required
                  value={form.name}
                  onChange={handleFieldChange("name")}
                  placeholder="e.g. Artisan Coffee Table"
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700 sm:col-span-2">
                Description
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={handleFieldChange("description")}
                  placeholder="Describe the product, materials, size, and style."
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700">
                Price
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleFieldChange("price")}
                  placeholder="49.99"
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700">
                Stock
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleFieldChange("stock")}
                  placeholder="25"
                  className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              {categories.length > 0 ? (
                <CategorySelect
                  value={form.categoryId}
                  onChange={handleFieldChange("categoryId")}
                  categories={categories}
                />
              ) : null}
            </div>
            <div>{/* {initialValues?.imageUrl?.} */}</div>
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Product images
                  </p>
                  <p className="text-xs text-zinc-500">
                    Add 1 to 5 clear images for the listing.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800">
                  Upload images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {allImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {allImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <div className="relative h-28 w-full overflow-hidden rounded-xl ring-1 ring-zinc-200">
                        <Image
                          src={
                            image?.includes("htt")
                              ? image
                              : `${process.env.NEXT_PUBLIC_ASSET_API}/${image}`
                          }
                          alt={`Product preview ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index, image)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-1.5 py-1 text-[10px] font-medium text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-6 text-center text-sm text-zinc-500">
                  No images uploaded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? isUpdateMode
                  ? "Updating product..."
                  : "Creating product..."
                : isUpdateMode
                  ? "Update product"
                  : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
