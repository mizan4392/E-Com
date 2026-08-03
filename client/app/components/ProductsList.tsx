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

// const products: Product[] = Array.from({ length: 8 }).map((_, i) => ({
//   id: String(i + 1),
//   images: [
//     `https://images.unsplash.com/photo-15${i + 10}00?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=a`,
//     `https://images.unsplash.com/photo-15${i + 11}00?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=b`,
//   ],
//   name: [
//     `Classic Lamp`,
//     `Outdoor Chair`,
//     `Minimal Tee`,
//     `Espresso Maker`,
//     `Notebook Set`,
//     `Garden Tools`,
//     `Side Table`,
//     `Hiking Pack`,
//   ][i % 8],
//   shopName: [
//     `Willow Home`,
//     `Gear & Co`,
//     `Urban Threads`,
//     `Cafe Craft`,
//     `Paper & Ink`,
//     `The Green Shelf`,
//     `Foundry Furnishings`,
//     `Atlas Outfitters`,
//   ][i % 8],
//   rating: +(4 + (i % 5) * 0.1).toFixed(1),
//   sold: 120 + i * 15,
// }));
const productImages = [
  [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80&sat=-20",
  ],
  [
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&auto=format&fit=crop&q=80&brightness=5",
  ],
  [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80&sat=20",
  ],
  [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80&contrast=10",
  ],
  [
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80&sat=-15",
  ],
  [
    "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&auto=format&fit=crop&q=80&brightness=10",
  ],
  [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80&hue=10",
  ],
  [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=80&sat=15",
  ],
];

const products: Product[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  images: productImages[i],
  name: [
    "Classic Lamp",
    "Outdoor Chair",
    "Minimal Tee",
    "Espresso Maker",
    "Notebook Set",
    "Garden Tools",
    "Side Table",
    "Hiking Pack",
  ][i],
  shopName: [
    "Willow Home",
    "Gear & Co",
    "Urban Threads",
    "Cafe Craft",
    "Paper & Ink",
    "The Green Shelf",
    "Foundry Furnishings",
    "Atlas Outfitters",
  ][i],
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
