"use client";

import ProductCard from "./ProductCard";

type Product = {
  id: string;
  images: string[];
  name: string;
  shopName: string;
  rating: number;
  sold: number;
};

const products: Product[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  images: [
    `https://images.unsplash.com/photo-15${i + 10}00?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=a`,
    `https://images.unsplash.com/photo-15${i + 11}00?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=b`,
  ],
  name: [
    `Classic Lamp`,
    `Outdoor Chair`,
    `Minimal Tee`,
    `Espresso Maker`,
    `Notebook Set`,
    `Garden Tools`,
    `Side Table`,
    `Hiking Pack`,
  ][i % 8],
  shopName: [
    `Willow Home`,
    `Gear & Co`,
    `Urban Threads`,
    `Cafe Craft`,
    `Paper & Ink`,
    `The Green Shelf`,
    `Foundry Furnishings`,
    `Atlas Outfitters`,
  ][i % 8],
  rating: +(4 + (i % 5) * 0.1).toFixed(1),
  sold: 120 + i * 15,
}));

export default function ProductsList() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Popular products
          </h2>
          <p className="text-sm text-zinc-600">Top picks this week</p>
        </div>

        <div className="grid gap-4 px-4 sm:px-6 lg:px-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
