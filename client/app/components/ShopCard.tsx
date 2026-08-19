"use client";

import Link from "next/link";

import { Shop } from "../../types/shop";

export default function ShopCard({
  id,
  imageUrl,
  name,
  address,
  category,
  rating = 5,
  createdAt,
  user,
}: Shop) {
  return (
    <Link href={`/shop/${id}`} className="block">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-zinc-100 sm:h-56">
          <img
            src={
              imageUrl?.startsWith("http")
                ? imageUrl
                : `${process.env.NEXT_PUBLIC_ASSET_API}/${imageUrl}`
            }
            alt={name}
            className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold leading-tight text-zinc-900">
              {name}
            </h3>
            <span className="ml-2 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              {category?.name}
            </span>
          </div>

          <p className="text-sm text-zinc-600">{address}</p>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-sm">
                    {i < Math.round(rating) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-xs text-zinc-500">{rating.toFixed(1)}</span>
            </div>
            {createdAt ? (
              <p className="text-xs text-zinc-500">
                Opened {createdAt.slice(0, 10)}
              </p>
            ) : null}
            {user ? (
              <p className="text-xs text-zinc-500">
                Owned by : {user.firstName} {user.lastName}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
