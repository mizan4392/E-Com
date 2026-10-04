"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { clearToken } from "@/lib/authStore";
import { useIsAuthenticated } from "@/app/hooks/useAdminAuth";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/shops", label: "Shops" },
  { href: "/change-password", label: "Change password" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  const isLoginPage = pathname === "/login";

  // Redirect for side effects only. Rendering is still guarded below, so the
  // protected page never flashes before the navigation completes.
  useEffect(() => {
    if (isLoginPage || isAuthenticated) return;
    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isLoginPage, isAuthenticated, pathname, router]);

  // The login screen is a full-page form; the sidebar would only distract from
  // it, and it previously made a failed sign-in look like a broken panel.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // Hold the route until the client-side token check finishes. Rendering the
    // protected page first would flash dashboard content before the redirect.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    );
  }

  function handleSignOut() {
    clearToken();
    router.replace("/login");
  }

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
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 w-full cursor-pointer rounded-2xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
