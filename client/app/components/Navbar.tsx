"use client";

import Link from "next/link";
import { useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useAuthSync } from "../../hooks/useAuthSync";
import { useCartStore } from "../../stores/cartStore";
import { useGetUserShop } from "../../lib/shop/queries";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "#deals" },
];

const signedInNavLinks = [
  {
    label: "Profile",
    href: "/user/profile",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <circle cx="12" cy="8" r="3.25" />
        <path strokeLinecap="round" d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    label: "My Orders",
    href: "/user/orders",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 4.75h10a1.5 1.5 0 0 1 1.5 1.5v13H5.5v-13A1.5 1.5 0 0 1 7 4.75Z"
        />
        <path strokeLinecap="round" d="M8.5 9h7m-7 4h7m-7 4h4" />
      </svg>
    ),
  },
  {
    label: "Shop orders",
    href: "/user/shop-orders",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4 8 8-4 8 4v9l-8 4-8-4V8Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 8.25 7.5 4 7.5-4M12 12.25V21M8 6l8 4"
        />
      </svg>
    ),
  },
  {
    label: "My Shop",
    href: "/user/user-shop",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 10h16l-1.4-5H5.4L4 10Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 10v9h13v-9M9 19v-5h6v5M4 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"
        />
      </svg>
    ),
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const cartCount = useCartStore((state) => state.items.length);
  const { data: userShops } = useGetUserShop(Boolean(isSignedIn));

  useAuthSync();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
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
            href="/cart"
            className="relative hidden rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 sm:inline-flex"
          >
            Cart
            {cartCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {!isSignedIn ? (
            <SignInButton>
              <button className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 sm:inline-flex">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div className="inline-flex">
              <UserButton>
                <UserButton.MenuItems>
                  {signedInNavLinks
                    .filter(
                      (link) =>
                        link.label !== "Shop orders" ||
                        (userShops?.length ?? 0) > 0,
                    )
                    .map((link) => (
                      <UserButton.Link
                        key={link.label}
                        label={link.label}
                        labelIcon={link.icon}
                        href={link.href}
                      />
                    ))}
                </UserButton.MenuItems>
              </UserButton>
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
              href="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="relative rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              Cart
              {cartCount > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            {!isSignedIn ? (
              <div onClick={() => setIsMenuOpen(false)}>
                <SignInButton>
                  <button className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
