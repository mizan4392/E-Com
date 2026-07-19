"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "#deals" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn, userId, getToken } = useAuth();

  useEffect(() => {
    // when the user signs in, attempt to sync their profile to the backend
    if (!isSignedIn || !userId) return;

    async function sync() {
      try {
        const token = getToken ? await getToken() : null;
        console.log("Syncing user with token:", token);
        await fetch(
          process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") + "/users/sync" ||
            "http://localhost:3000/users/sync",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ userId }),
          },
        );
      } catch (e) {
        console.error("Sync error", e);
        // ignore network errors here — sync is best-effort
        // console.error('sync error', e);
      }
    }

    sync();
  }, [isSignedIn, userId, getToken]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="#home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
            E
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-900">
              E-Commerce
            </p>
            <p className="text-xs text-zinc-500">Fresh picks every day</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 lg:flex">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search"
              className="w-28 bg-transparent outline-none placeholder:text-zinc-400"
              aria-label="Search"
            />
          </label>

          <Link
            href="#cart"
            className="hidden rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 sm:inline-flex"
          >
            Cart (2)
          </Link>

          {!isSignedIn ? (
            <SignInButton>
              <button className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 sm:inline-flex">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div className="hidden sm:inline-flex">
              <UserButton />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <div className="flex flex-col gap-1.5">
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  isMenuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-zinc-200 bg-white/95 transition-all duration-300 md:hidden ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}

          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3">
            <Link
              href="#cart"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              Cart (2)
            </Link>
            {!isSignedIn ? (
              <div onClick={() => setIsMenuOpen(false)}>
                <SignInButton>
                  <button className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div
                className="rounded-xl px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
