"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ICON_SIZE } from "@/config/admin-nav";
import { MOBILE_NAV_ID } from "./MobileSidebar";

/**
 * Hamburger button that opens the mobile navigation drawer.
 *
 * Only rendered below `lg` by {@link AdminShell}, which also owns the open
 * state — this component is presentational so the drawer can stay mounted
 * without a redundant copy of the flag.
 *
 * Carries the full ARIA button contract: an `aria-label` that names the
 * action, `aria-expanded` reflecting the state, and `aria-controls` pointing at
 * the panel it toggles so assistive tech can relate the two.
 */
export default function SidebarToggle({
  open,
  onClick,
  className,
}: {
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls={MOBILE_NAV_ID}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2",
        "text-slate-700 transition-colors duration-200 hover:bg-slate-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        className,
      )}
    >
      <Menu size={NAV_ICON_SIZE} aria-hidden="true" strokeWidth={2} />
    </button>
  );
}
