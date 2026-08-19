"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import ShopCard from "../components/ShopCard";
import { apiFetch } from "../../lib/apiClient";
import { FetchShopsResponse } from "../../types/shop";
import { useShops } from "../../lib/shop/queries";

type Shop = {
  id: string;
  image: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  createdAt: string;
};

// const shops: Shop[] = [
//   {
//     id: "1",
//     image:
//       "https://images.unsplash.com/photo-1495576775845-6b1b31f7aa15?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Willow Home",
//     location: "San Francisco, CA",
//     category: "Home",
//     rating: 4.7,
//     createdAt: "2026-06-18T09:23:00Z",
//   },
//   {
//     id: "2",
//     image:
//       "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Gear & Co",
//     location: "Austin, TX",
//     category: "Outdoor",
//     rating: 4.5,
//     createdAt: "2026-06-12T13:45:00Z",
//   },
//   {
//     id: "3",
//     image:
//       "https://images.unsplash.com/photo-1495121605193-b116b5b9c79b?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Urban Threads",
//     location: "New York, NY",
//     category: "Fashion",
//     rating: 4.9,
//     createdAt: "2026-05-27T16:20:00Z",
//   },
//   {
//     id: "4",
//     image:
//       "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Cafe Craft",
//     location: "Portland, OR",
//     category: "Cafe",
//     rating: 4.6,
//     createdAt: "2026-04-05T11:10:00Z",
//   },
//   {
//     id: "5",
//     image:
//       "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Paper & Ink",
//     location: "Seattle, WA",
//     category: "Stationery",
//     rating: 4.8,
//     createdAt: "2026-03-18T14:55:00Z",
//   },
//   {
//     id: "6",
//     image:
//       "https://images.unsplash.com/photo-1445039267685-5f6d4b4e9c6f?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "The Green Shelf",
//     location: "Chicago, IL",
//     category: "Garden",
//     rating: 4.4,
//     createdAt: "2026-02-25T10:05:00Z",
//   },
//   {
//     id: "7",
//     image:
//       "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "North & Nest",
//     location: "Denver, CO",
//     category: "Home",
//     rating: 4.6,
//     createdAt: "2026-01-30T09:50:00Z",
//   },
//   {
//     id: "8",
//     image:
//       "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Bright Goods",
//     location: "Los Angeles, CA",
//     category: "Gifts",
//     rating: 4.7,
//     createdAt: "2026-01-07T15:30:00Z",
//   },
//   {
//     id: "9",
//     image:
//       "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Foundry Furnishings",
//     location: "Boston, MA",
//     category: "Furniture",
//     rating: 4.3,
//     createdAt: "2025-12-21T12:15:00Z",
//   },
//   {
//     id: "10",
//     image:
//       "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
//     name: "Atlas Outfitters",
//     location: "Nashville, TN",
//     category: "Outdoor",
//     rating: 4.5,
//     createdAt: "2025-11-30T08:40:00Z",
//   },
// ];

const shops: Shop[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&auto=format&fit=crop&q=80",
    name: "Willow Home",
    location: "San Francisco, CA",
    category: "Home",
    rating: 4.7,
    createdAt: "2026-06-18T09:23:00Z",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&auto=format&fit=crop&q=80",
    name: "Gear & Co",
    location: "Austin, TX",
    category: "Outdoor",
    rating: 4.5,
    createdAt: "2026-06-12T13:45:00Z",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&auto=format&fit=crop&q=80",
    name: "Urban Threads",
    location: "New York, NY",
    category: "Fashion",
    rating: 4.9,
    createdAt: "2026-05-27T16:20:00Z",
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1400&auto=format&fit=crop&q=80",
    name: "Cafe Craft",
    location: "Portland, OR",
    category: "Cafe",
    rating: 4.6,
    createdAt: "2026-04-05T11:10:00Z",
  },
  {
    id: "5",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1400&auto=format&fit=crop&q=80",
    name: "Paper & Ink",
    location: "Seattle, WA",
    category: "Stationery",
    rating: 4.8,
    createdAt: "2026-03-18T14:55:00Z",
  },
  {
    id: "6",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&auto=format&fit=crop&q=80",
    name: "The Green Shelf",
    location: "Chicago, IL",
    category: "Garden",
    rating: 4.4,
    createdAt: "2026-02-25T10:05:00Z",
  },
  {
    id: "7",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&auto=format&fit=crop&q=80",
    name: "North & Nest",
    location: "Denver, CO",
    category: "Home",
    rating: 4.6,
    createdAt: "2026-01-30T09:50:00Z",
  },
  {
    id: "8",
    image:
      "https://images.unsplash.com/photo-1513884923967-4b182ef167ab?w=1400&auto=format&fit=crop&q=80",
    name: "Bright Goods",
    location: "Los Angeles, CA",
    category: "Gifts",
    rating: 4.7,
    createdAt: "2026-01-07T15:30:00Z",
  },
  {
    id: "9",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&auto=format&fit=crop&q=80",
    name: "Foundry Furnishings",
    location: "Boston, MA",
    category: "Furniture",
    rating: 4.3,
    createdAt: "2025-12-21T12:15:00Z",
  },
  {
    id: "10",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&auto=format&fit=crop&q=80",
    name: "Atlas Outfitters",
    location: "Nashville, TN",
    category: "Outdoor",
    rating: 4.5,
    createdAt: "2025-11-30T08:40:00Z",
  },
];
const categoryOptions = [
  "All",
  "Home",
  "Outdoor",
  "Fashion",
  "Cafe",
  "Stationery",
  "Garden",
  "Gifts",
  "Furniture",
];

const sortOptions = [
  { value: "newest", label: "Newest created" },
  { value: "oldest", label: "Oldest created" },
];

export default function ShopPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useShops(currentPage);

  const shops = data?.data ?? [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-center text-lg font-semibold text-zinc-900">
            Loading shops...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
              Shops
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Browse all shops
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Search, filter by category, or sort shops by creation date to find
              the perfect place to shop.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
            <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Search shops
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, location, or category"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </label>

            <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Category
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full bg-transparent text-sm text-zinc-900 outline-none"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full bg-transparent text-sm text-zinc-900 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {shops.length > 0 ? (
            shops.map((shop) => <ShopCard key={shop.id} {...shop} />)
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-zinc-600 shadow-sm">
              <p className="text-lg font-semibold text-zinc-900">
                No shops found
              </p>
              <p className="mt-2 text-sm">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}
        </div>

        {/* {shops.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-zinc-600">
              Showing {shops.length} of {shops.length} shops
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null} */}
      </div>
    </main>
  );
}
