"use client";

import { useEffect, useRef } from "react";
import ShopCard from "./ShopCard";
import { CategoryCardProps } from "./CategoryCard";
import { apiFetch } from "../../lib/apiClient";

type Shop = {
  id: string;
  imageUrl: string;
  name: string;
  address: string;
  category: CategoryCardProps;
  rating: number;
};
const imageUrls = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
];

const shops: Shop[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  imageUrl: imageUrls[i], // `https://images.unsplash.com/photo-15${(i + 1) * 11}...&q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3`,
  name: [
    "Willow Home",
    "Gear & Co",
    "Urban Threads",
    "Cafe Craft",
    "Paper & Ink",
    "The Green Shelf",
    "North & Nest",
    "Bright Goods",
    "Foundry Furnishings",
    "Atlas Outfitters",
  ][i % 10],
  address: [
    "San Francisco, CA",
    "Austin, TX",
    "New York, NY",
    "Portland, OR",
    "Seattle, WA",
    "Chicago, IL",
    "Denver, CO",
    "Los Angeles, CA",
    "Boston, MA",
    "Nashville, TN",
  ][i % 10],
  category: [
    { id: "1", name: "Home", image: "" },
    { id: "2", name: "Outdoor", image: "" },
    { id: "3", name: "Fashion", image: "" },
    { id: "4", name: "Cafe", image: "" },
    { id: "5", name: "Stationery", image: "" },
    { id: "6", name: "Garden", image: "" },
    { id: "7", name: "Home", image: "" },
    { id: "8", name: "Gifts", image: "" },
    { id: "9", name: "Furniture", image: "" },
    { id: "10", name: "Outdoor", image: "" },
  ][i % 10],
  rating: +(4 + (i % 5) * 0.2).toFixed(1),
}));

export default function ShopsList() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const fetchShops = async () => {
    // Fetch shops from API or database
    const response = await apiFetch(`/api/shop/?page=1`, {});
    const data = await response.json();
    console.log("Fetched shops:", data);
    // Update state with fetched shops
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Shops
          </h2>
          <p className="text-sm text-zinc-600">
            Discover local and curated shops
          </p>
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 hidden gap-2 sm:flex">
            <button
              aria-label="Previous shops"
              onClick={() => scrollBy("left")}
              className="rounded-full bg-white/80 p-2 text-zinc-800 shadow-sm backdrop-blur hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Next shops"
              onClick={() => scrollBy("right")}
              className="rounded-full bg-white/80 p-2 text-zinc-800 shadow-sm backdrop-blur hover:bg-white"
            >
              ›
            </button>
          </div>

          <div
            ref={scrollRef}
            className="-mx-2 flex w-full gap-4 overflow-x-auto scroll-pl-6 snap-x snap-mandatory px-2 py-2 scrollbar-hide"
          >
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="min-w-[80%] sm:min-w-[45%] md:min-w-[32%] lg:min-w-[22%] snap-start"
              >
                <ShopCard {...shop} />
              </div>
            ))}
          </div>

          <div className="mt-4 hidden sm:block">
            <p className="text-xs text-zinc-500">
              Swipe horizontally on mobile or use arrows on larger screens.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
