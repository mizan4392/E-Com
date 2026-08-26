"use client";

import Link from "next/link";
import { useState } from "react";
import ProductActionSection from "./ProductActionSection";
import ProductGallery from "./ProductGallery";
import ProductMeta from "./ProductMeta";
import ProductSummary from "./ProductSummary";
import { useProductDetails } from "../../lib/shop/queries";
import useUserStore from "../../stores/userStore";
import { formatPrice } from "../../util/functions";
import ProductModal from "./ProductModal";
import { useCommonStore } from "../../stores/commonStore";
import { IProductUpdate } from "../../types/product";
import { useUpdateProduct } from "../../lib/product/mutation";
import { toast } from "sonner";

export default function ProductDetails({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [editProduct, setEditProduct] = useState<boolean>(false);
  const { data: product, isLoading } = useProductDetails(productId);
  const { categories } = useCommonStore();
  const { isOwner } = useUserStore();

  const price = product?.price ?? 0;

  const productUpdate = useUpdateProduct();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-8">
            <div className="h-6 w-28 rounded bg-zinc-200" />
            <div className="mt-6 h-10 w-2/3 rounded bg-zinc-200" />
            <div className="mt-6 h-80 w-full rounded-2xl bg-zinc-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-zinc-900">
              Product not found
            </p>
          </div>
        </div>
      </main>
    );
  }

  const onEditProduct = (values: IProductUpdate) => {
    const updatedPayload: IProductUpdate = {
      name: values?.name,
      categoryId: values?.categoryId,
      description: values.description,
      files: values.files,
      id: values.id,
      price: values.price,
      slug: values.slug,
      stock: values.stock,
    };

    productUpdate.mutate(
      {
        ...updatedPayload,
      },
      {
        onSuccess: () => {
          toast.success("Product updated successfully");
          setEditProduct(false);
        },
        onError: () => {
          toast.error("Failed to update shop");
        },
      },
    );
    console.log("values", updatedPayload);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <nav className="mb-8 text-sm text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-zinc-900">
            Home
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <Link href="/shop" className="transition hover:text-zinc-900">
            Shop
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-zinc-900">{product?.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-16">
          <ProductGallery name={product.name} imageUrl={product.imageUrl} />

          <section className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  {product.shop?.category?.name}
                </p>
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product.name}
                </h1>
                <Link
                  href="/shop"
                  className="mt-3 inline-block text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
                >
                  Sold by {product.shop?.name}
                </Link>
              </div>
            </div>

            <ProductSummary
              rating={product.rating}
              reviewsCount={5}
              soldCount={5}
            />

            <p className="mt-6 text-3xl font-semibold tracking-tight">
              {formatPrice(price)}
            </p>
            <p className="mt-5 max-w-lg leading-7 text-zinc-600">
              {product.description}
            </p>

            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="font-semibold">In stock.</span> Ships within 2 to
              4 business days.
            </div>

            <ProductActionSection
              isOwner={isOwner}
              quantity={quantity}
              price={price}
              added={added}
              onQuantityChange={(nextValue) =>
                setQuantity(Math.max(1, nextValue))
              }
              onAddToCart={() => setAdded(true)}
              onEditProduct={() => setEditProduct(true)}
            />

            <p className="mt-3 text-center text-xs text-zinc-500 sm:text-left">
              {5} pieces available
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <ProductMeta
                label="Category"
                value={product.shop?.category?.name}
              />
              <ProductMeta
                label="Status"
                value={5 > 0 ? "In stock" : "Sold out"}
              />
              <ProductMeta label="Price" value={formatPrice(price)} />
            </div>
          </section>
        </div>
      </div>
      <ProductModal
        open={editProduct}
        mode="update"
        initialValues={{ ...product, categoryId: product?.shop?.category?.id }}
        categories={categories}
        title="Update Product"
        description=""
        onClose={() => setEditProduct(false)}
        onSubmit={onEditProduct}
      />
    </main>
  );
}
