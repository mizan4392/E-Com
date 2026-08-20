"use client";

import { useRef } from "react";
import ShopCard from "./ShopCard";

import { Shop } from "../../types/shop";
import { useShops } from "../../lib/shop/queries";

export default function ShopsList() {
  const { data } = useShops(1);
  const shops = data?.data || [];
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
            {shops.map((shop: Shop) => (
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
