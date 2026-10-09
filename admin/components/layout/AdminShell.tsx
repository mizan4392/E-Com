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
 * ## Why the session check lives here, and why it renders a placeholder
 *
 * The admin token lives in `localStorage`, which the server cannot read, so
 * `useIsAuthenticated` is necessarily `false` during the server render and only
 * becomes `true` once the client store has been read. Without a placeholder the
 * shell would render one frame of the signed-out state and then the page, so a
 * signed-in admin saw the login screen flash on every full page load.
 *
 * Rendering a neutral "Checking your session…" panel until the answer is known
 * removes the flash: only one of the two states is ever painted, and which one
 * is decided before anything is committed.
 *
 * ## What this deliberately does not do
 *
 * It does not repair an expired cookie, and it does not arbitrate a 401. Those
 * belong to the route's `error.tsx` — the only place that actually knows the
 * server rejected the token. A shell that tried to pre-empt that would have to
 * guess: it would either re-mirror a token the server has genuinely rejected, or
 * bounce a visitor whose page is about to load perfectly well. Keeping one owner
 * for "the server said no" is what stops the two from fighting and re-creating
 * the redirect loop this replaced.
 *
 * The effect below navigates for its side effect only — it cannot prevent a
 * flash on its own, since the frame is already painted by the time it runs. The
 * placeholder is what hides the flash; the navigation only makes sure the
 * address bar ends up matching what is on screen.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (isLoginPage || isAuthenticated) return;
    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isLoginPage, isAuthenticated, pathname, router]);

  // Close the drawer on navigation — otherwise it stays open over the page the
  // visitor just asked for. React discards this render and retries immediately
  // without committing it, which is the documented way to reset state from
  // props; an effect here would show the new route once with the drawer open.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  // The login screen is a full-page form; a sidebar would only distract from it,
  // and it used to make a failed sign-in look like a broken panel.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
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
