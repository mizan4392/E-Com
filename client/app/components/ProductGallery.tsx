"use client";

import { useState } from "react";
import { Product } from "../../types/shop";

type ProductGalleryProps = Pick<Product, "name" | "imageUrl">;

export default function ProductGallery({
  name,
  imageUrl,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const selectedImageUrl = imageUrl?.[selectedImage];

  return (
    <div className="grid gap-4 sm:grid-cols-[76px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
        {imageUrl?.map((image, index) => (
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
            src={selectedImageUrl}
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
            src={selectedImageUrl}
            alt={name}
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
