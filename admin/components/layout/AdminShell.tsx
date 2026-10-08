"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useIsAuthenticated } from "@/app/hooks/useAdminAuth";
import { SIDEBAR_WIDTH_CLASS } from "@/config/admin-nav";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarToggle from "@/components/layout/sidebar/SidebarToggle";
import MobileSidebar from "@/components/layout/sidebar/MobileSidebar";

/**
 * Admin application shell: navigation plus the page content area.
 *
 * One breakpoint, `lg` (1024px):
 * - at/above it, a fixed 280px sidebar sits beside scrolling content
 * - below it, the sidebar becomes a drawer behind {@link SidebarToggle}
 *
 * The drawer is the only piece of state here. Route changes close it via the
 * render-time derivation below, which React documents as the sanctioned way to
 * reset state from props; doing it in an effect would render the new route
 * once with the drawer still open.
 *
 * The auth guard is unchanged in behaviour from the previous shell: an
 * unauthenticated visitor is redirected from an effect and the protected page
 * is withheld until the client-side token check resolves, so nothing flashes.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Redirect for side effects only. Rendering is guarded below, so the
  // protected page never flashes before the navigation completes.
  useEffect(() => {
    if (isLoginPage || isAuthenticated) return;
    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isLoginPage, isAuthenticated, pathname, router]);

  // Close the drawer on navigation — otherwise it stays open over the page the
  // user just asked for. React discards this render and retries immediately
  // without committing it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  // The login screen is a full-page form; a sidebar would only distract from
  // it, and it previously made a failed sign-in look like a broken panel.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // Hold the route until the client-side token check finishes.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---------- Fixed desktop sidebar (lg and up) ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 lg:block ${SIDEBAR_WIDTH_CLASS}`}
      >
        <Sidebar id="admin-desktop-nav" />
      </aside>

      {/* ---------- Mobile drawer (below lg) ---------- */}
      <MobileSidebar open={drawerOpen} onClose={closeDrawer} />

      {/* ---------- Content column, offset by the sidebar on desktop ---------- */}
      <div className={`lg:pl-[280px]`}>
        {/* Sticky top bar, mobile only: hamburger + title. */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <SidebarToggle
              open={drawerOpen}
              onClick={() => setDrawerOpen((current) => !current)}
            />
            <span className="text-base font-bold tracking-tight text-[#050A18]">
              Admin panel
            </span>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
