"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_SIZE, type NavItem } from "@/config/admin-nav";
import { cn } from "@/lib/cn";
import { isNavItemActive } from "@/lib/navActive";

/**
 * One row in the admin sidebar.
 *
 * Renders a Next `<Link>` when the item is enabled, and an inert `<span>` when
 * it is disabled. The disabled branch is deliberately not a link at all: a
 * disabled `<a href>` would still be focusable, still be announced as a link,
 * and still be middle-clickable into a 404 — three ways for "not ready yet" to
 * pretend it is ready.
 *
 * Active state is derived from `usePathname()` rather than passed down, so the
 * desktop sidebar and the mobile drawer can never disagree about which item is
 * lit up.
 *
 * @param item      Entry from `ADMIN_NAV`.
 * @param onNavigate Invoked after an enabled item is activated. The drawer uses
 *                   this to close itself; on desktop it is omitted.
 */
export default function SidebarItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;

  // A disabled item has no href, so there is nothing to compare against.
  const active =
    !item.disabled && item.href
      ? isNavItemActive(pathname, item.href, item.match)
      : false;

  const baseClasses = cn(
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
    "transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
    item.disabled && "cursor-not-allowed",
  );

  const label = (
    <>
      <span className="flex shrink-0 items-center justify-center">
        <Icon size={NAV_ICON_SIZE} aria-hidden="true" strokeWidth={1.75} />
      </span>
      <span className="flex-1 truncate text-left">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            "shrink-0 rounded-full bg-slate-100 px-2 py-0.5",
            "text-[10px] font-bold uppercase tracking-wide text-slate-500",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (item.disabled || !item.href) {
    return (
      <span
        className={cn(baseClasses, "text-slate-700 opacity-40")}
        aria-disabled="true"
        // A <span> is not focusable, so this row is unreachable by Tab and
        // announces as a disabled group. `title` gives a mouse user the reason.
        title={`${item.label} — coming soon`}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        baseClasses,
        active
          ? "bg-[#050A18] text-white focus-visible:ring-blue-500"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {label}
    </Link>
  );
}
