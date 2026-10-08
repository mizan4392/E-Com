"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { SIDEBAR_WIDTH_CLASS } from "@/config/admin-nav";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import Sidebar from "./Sidebar";

/** Matches the `aria-controls` on {@link SidebarToggle}. */
export const MOBILE_NAV_ID = "admin-mobile-nav";

/**
 * Slide-in navigation drawer for viewports below `lg` (1024px).
 *
 * Only mounted while open, so the closed state costs nothing and there is no
 * hidden-but-focusable nav for a screen reader to stumble into — which is the
 * usual failure mode of an `off-canvas` drawer that is merely translated off
 * screen.
 *
 * Closes on all four required triggers:
 * - backdrop click
 * - Escape
 * - route change (handled by the parent, which owns the state)
 * - nav item click (`onNavigate`)
 *
 * While open it locks body scroll and traps Tab focus — see
 * {@link useFocusTrap}. Uses `100dvh` rather than `100vh` so the Sign out
 * button in the footer stays reachable when mobile browser chrome is expanded;
 * `100vh` resolves to the *largest* viewport height and would push the footer
 * below the visible area.
 *
 * @param open    Whether the drawer is visible.
 * @param onClose Called for the backdrop, Escape and the close button.
 */
export default function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);

  // Escape to dismiss, plus body scroll lock for the duration.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden">
      {/* ---------- Backdrop ---------- */}
      <div
        className="motion-safe:animate-[fadeIn_200ms_ease-out] fixed inset-0 z-40 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---------- Panel ---------- */}
      <div
        ref={panelRef}
        id={MOBILE_NAV_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className={cn(
          "motion-safe:animate-[slideIn_200ms_ease-out] fixed inset-y-0 left-0 z-50",
          "h-[100dvh] border-r border-slate-200 shadow-xl outline-none",
          SIDEBAR_WIDTH_CLASS,
          // On a very narrow phone the sidebar is capped so a sliver of the
          // page stays visible, signalling there is something to tap behind it.
          "max-w-[85vw]",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600",
        )}
      >
        <Sidebar
          id="admin-mobile-nav-list"
          onNavigate={onClose}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
