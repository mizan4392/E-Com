"use client";

import Link from "next/link";

type Category = {
  id: string;
  name: string;
  image: string;
  description: string;
};

const categories: Category[] = [
  {
    id: "home",
    name: "Home",
    image:
      "https://images.unsplash.com/photo-1505692794405-03f9b4f4d9d2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1",
    description: "Furniture, decor, and everyday essentials for your home.",
  },
  {
    id: "fashion",
    name: "Fashion",
    image:
      "https://images.unsplash.com/photo-1520975698519-0f3c6f6cc1b9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=2",
    description: "Trendy clothing, accessories, and seasonal style picks.",
  },
  {
    id: "outdoor",
    name: "Outdoor",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=3",
    description: "Adventure gear, camping essentials, and outdoor living.",
  },
  {
    id: "cafe",
    name: "Cafe",
    image:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4",
    description: "Coffee, kitchen staples, and charming cafe-inspired finds.",
  },
  {
    id: "stationery",
    name: "Stationery",
    image:
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=5",
    description: "Writing tools, planners, and creative studio essentials.",
  },
  {
    id: "garden",
    name: "Garden",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=6",
    description: "Plants, pots, and gardening gear for every green thumb.",
  },
  {
    id: "furniture",
    name: "Furniture",
    image:
      "https://images.unsplash.com/photo-1505691723518-36a1fb0b1d8a?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7",
    description: "Stylish furniture built for comfort and modern interiors.",
  },
  {
    id: "gifts",
    name: "Gifts",
    image:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=8",
    description: "Thoughtful gift ideas for birthdays, weddings, and more.",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
            Categories
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Discover all categories
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Browse curated collections across home, fashion, outdoor, and more.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {category.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
