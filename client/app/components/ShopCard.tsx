"use client";

import Link from "next/link";

type ShopCardProps = {
  id: string;
  image: string;
  name: string;
  location: string;
  category: string;
  rating: number;
};

export default function ShopCard({
  id,
  image,
  name,
  location,
  category,
  rating,
}: ShopCardProps) {
  return (
    <Link href={`/shop/${id}`} className="block">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-44 w-full overflow-hidden bg-zinc-100 sm:h-56">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold leading-tight text-zinc-900">
              {name}
            </h3>
            <span className="ml-2 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              {category}
            </span>
          </div>

          <p className="text-sm text-zinc-600">{location}</p>

          <div className="mt-auto flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm">
                  {i < Math.round(rating) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className="text-xs text-zinc-500">{rating.toFixed(1)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
