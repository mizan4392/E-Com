"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/shops", label: "Shops" },
  { href: "/change-password", label: "Change password" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
            E-commerce
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Admin panel
          </h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
