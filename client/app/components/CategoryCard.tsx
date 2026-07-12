"use client";

import Link from "next/link";

type CategoryCardProps = {
  id: string;
  name: string;
  image: string;
};

export default function CategoryCard({ id, name, image }: CategoryCardProps) {
  return (
    <Link href={`/category/${id}`} className="block">
      <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="h-36 w-full overflow-hidden bg-zinc-100 sm:h-44">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-zinc-900">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
