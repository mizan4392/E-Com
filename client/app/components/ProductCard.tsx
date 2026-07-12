"use client";

import { useState } from "react";
import Link from "next/link";

type ProductCardProps = {
  id: string;
  images: string[];
  name: string;
  shopName: string;
  rating: number;
  sold: number;
};

export default function ProductCard({
  id,
  images,
  name,
  shopName,
  rating,
  sold,
}: ProductCardProps) {
  const [index, setIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  return (
    <Link href={`/product/${id}`} className="block">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-44 w-full overflow-hidden bg-zinc-100 sm:h-56">
          <img
            src={images[index]}
            alt={name}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 flex items-center justify-between px-2">
            <button
              onClick={prev}
              aria-label="Previous image"
              className="hidden rounded-full bg-black/30 p-1 text-white transition hover:bg-black/40 sm:block"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="hidden rounded-full bg-black/30 p-1 text-white transition hover:bg-black/40 sm:block"
            >
              ›
            </button>
          </div>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-6 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-sm font-semibold text-zinc-900">{name}</h3>
          <p className="text-xs text-zinc-600">{shopName}</p>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="text-xs text-zinc-500">{rating.toFixed(1)}</span>
            </div>

            <span className="text-xs text-zinc-500">Sold: {sold}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
