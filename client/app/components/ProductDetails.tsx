"use client";

import Link from "next/link";
import { useState } from "react";
import { useProductDetails } from "../../lib/shop/queries";

type ProductDetailsData = {
  id: string;
  name: string;
  shopName: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  description: string;
  images: string[];
};

const catalog: ProductDetailsData[] = [
  {
    id: "1",
    name: "Classic Lamp",
    shopName: "Willow Home",
    category: "Home lighting",
    price: 89,
    rating: 4.8,
    reviews: 124,
    sold: 120,
    stock: 18,
    description:
      "A warm, sculptural table lamp with a linen shade and a solid oak base. Designed to bring a soft pool of light to reading corners, bedside tables, and quiet evenings.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1400&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1400&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1400&auto=format&fit=crop&q=85",
    ],
  },
  {
    id: "2",
    name: "Outdoor Chair",
    shopName: "Gear & Co",
    category: "Outdoor living",
    price: 149,
    rating: 4.6,
    reviews: 86,
    sold: 135,
    stock: 9,
    description:
      "A relaxed outdoor chair made for long lunches and slow mornings. Lightweight, durable, and easy to fold away when the weather turns.",
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=1400&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1400&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&auto=format&fit=crop&q=85",
    ],
  },
];

const fallbackProduct = catalog[0];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

type ProductGalleryProps = Pick<ProductDetailsData, "name" | "images">;

function ProductGallery({ name, images = [] }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-[76px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
        {images?.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setSelectedImage(index)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-100 transition sm:h-19 sm:w-19 ${
              selectedImage === index
                ? "border-amber-500"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`View image ${index + 1}`}
            aria-current={selectedImage === index}
          >
            <img src={image} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 min-w-0 sm:order-2">
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-zinc-100 text-left"
          aria-label="Zoom product image"
        >
          <img
            src={images[selectedImage]}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur">
            Click to zoom
          </span>
        </button>
      </div>

      {isZoomed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} enlarged image`}
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-zinc-900 shadow-lg"
            aria-label="Close enlarged image"
          >
            ×
          </button>
          <img
            src={images[selectedImage]}
            alt={name}
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ProductDetails({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [added, setAdded] = useState(false);

  console.log("productId", productId);

  const { data: product, isLoading } = useProductDetails(productId);

  console.log("->>>>>>>>>>>>", product);

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
          <ProductGallery name={product?.name} images={product?.imageUrl} />

          <section className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  {product?.shop?.category?.name}
                </p>
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product?.name}
                </h1>
                <Link
                  href="/shop"
                  className="mt-3 inline-block text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
                >
                  Sold by {product?.shop?.name}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setIsSaved((saved) => !saved)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-xl transition hover:border-zinc-900"
                aria-label={
                  isSaved ? "Remove from wishlist" : "Add to wishlist"
                }
                aria-pressed={isSaved}
              >
                {isSaved ? "♥" : "♡"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-zinc-200 py-5">
              <span className="text-amber-500">★★★★★</span>
              <span className="text-sm font-semibold">{product?.rating}</span>
              <span className="text-sm text-zinc-500">{5} reviews</span>
              <span className="h-4 w-px bg-zinc-300" />
              <span className="text-sm text-zinc-500">{5} sold</span>
            </div>

            <p className="mt-6 text-3xl font-semibold tracking-tight">
              {formatPrice(product?.price)}
            </p>
            <p className="mt-5 max-w-lg leading-7 text-zinc-600">
              {product?.description}
            </p>

            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="font-semibold">In stock.</span> Ships within 2 to
              4 business days.
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 items-center justify-between rounded-xl border border-zinc-300 bg-white px-3 sm:w-32">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="h-8 w-8 text-lg text-zinc-500 hover:text-zinc-900"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-8 w-8 text-lg text-zinc-500 hover:text-zinc-900"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAdded(true)}
                className="h-12 flex-1 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                {added
                  ? "Added to cart"
                  : `Add to cart · ${formatPrice(product?.price * quantity)}`}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500 sm:text-left">
              {5} pieces available
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
