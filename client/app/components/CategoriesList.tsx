"use client";

import { useRef } from "react";
import CategoryCard from "./CategoryCard";
import { useCommonStore } from "../../stores/commonStore";

export default function CategoriesList() {
  const { categories } = useCommonStore();

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
            Categories
          </h2>
          <p className="text-sm text-zinc-600">Browse by category</p>
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 hidden gap-2 sm:flex">
            <button
              aria-label="Previous categories"
              onClick={() => scrollBy("left")}
              className="rounded-full bg-white/80 p-2 text-zinc-800 shadow-sm backdrop-blur hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Next categories"
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
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="min-w-[45%] sm:min-w-[30%] md:min-w-[22%] lg:min-w-[18%] snap-start"
              >
                <CategoryCard {...cat} />
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
