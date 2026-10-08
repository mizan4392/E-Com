/**
 * Admin navigation, as data.
 *
 * This file is the single place to edit when adding, removing or reordering a
 * menu entry. Nothing else in the app hard-codes a route, a label or an icon —
 * `SidebarSection` / `SidebarItem` walk this array and render whatever they
 * find, so a new item is one object literal here and nothing more.
 *
 * ## Adding a new nav item
 *
 * 1. Append an entry to the relevant `NavItem[]` below:
 *
 *    ```ts
 *    { label: "Reports", href: "/reports", icon: FileBarChart }
 *    ```
 *
 * 2. For a route that does not exist yet, leave `href` off and pass
 *    `disabled: true, badge: "Soon"` instead. A disabled item renders as an
 *    inert `<span>`: it is `aria-disabled`, skipped by the tab order, and
 *    cannot be clicked into a 404. This is how every "coming soon" entry in
 *    the sidebar is expressed today.
 *
 * 3. Run `npm run dev` — the sidebar updates on save. If the route is new,
 *    create `app/<route>/page.tsx` too, otherwise the link will 404 once
 *    enabled.
 *
 * Icons come from `lucide-react`; any exported `LucideIcon` works. Prefer
 * `strokeWidth={1.75}`-era outline icons and keep them visually consistent —
 * mixing filled and outline glyphs reads as a mistake.
 */

import {
  ChartNoAxesColumn,
  Gauge,
  Key,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

/** A single row in the sidebar. */
export interface NavItem {
  /** Visible text. */
  readonly label: string;
  /**
   * Target route. Omit for a disabled item — `SidebarItem` renders a non
   * interactive element when `disabled` is set, so it never needs an href.
   */
  readonly href?: string;
  /** Lucide glyph shown to the left of the label. */
  readonly icon: LucideIcon;
  /** Renders the item faded and inert, with a trailing badge. */
  readonly disabled?: boolean;
  /** Text for the trailing pill, e.g. `"SOON"`. Only rendered when disabled. */
  readonly badge?: string;
  /**
   * Route matching strategy for `aria-current`.
   *
   * - `"exact"` — highlights only on this precise path (the dashboard, which
   *   is `/` and would otherwise be active on every route via `startsWith`).
   * - `"prefix"` — highlights on this path and anything nested beneath it,
   *   which is what a section index like `/products/42/edit` needs.
   *
   * Defaults to `"exact"`, which is the safer default: an item wrongly lit up
   * is confusing, an item wrongly dimmed is merely unhelpful.
   */
  readonly match?: "exact" | "prefix";
}

/** A labelled group of nav items. */
export interface NavSection {
  /** Stable key, also used for the section's heading `id`. */
  readonly id: string;
  /** Uppercase muted heading rendered above the items. */
  readonly title: string;
  readonly items: readonly NavItem[];
}

/** Shared geometry so the desktop bar and the drawer can never disagree. */
export const SIDEBAR_WIDTH_CLASS = "w-[280px]";

/** Icon size used consistently in both the brand header and the nav rows. */
export const NAV_ICON_SIZE = 20;

/**
 * The full admin nav tree.
 *
 * Grouping mirrors how the admin actually works: what is happening now
 * (overview, sales), what is being sold (catalog, marketplace), who is
 * involved (people), and what is configured (insights, system).
 */
export const ADMIN_NAV: readonly NavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: Gauge, match: "exact" }],
  },
  {
    id: "sales",
    title: "Sales",
    items: [
      { label: "Orders", icon: ShoppingCart, disabled: true, badge: "SOON" },
      { label: "Payments", icon: ShoppingCart, disabled: true, badge: "SOON" },
      { label: "Refunds", icon: ShoppingCart, disabled: true, badge: "SOON" },
    ],
  },
  {
    id: "catalog",
    title: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Tag, match: "prefix" },
      {
        label: "Categories",
        href: "/categories",
        icon: Package,
        match: "prefix",
      },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    items: [
      { label: "Shops", href: "/shops", icon: Store, match: "prefix" },
      { label: "Sellers", icon: Users, disabled: true, badge: "SOON" },
    ],
  },
  {
    id: "people",
    title: "People",
    items: [
      { label: "Users", icon: Users, disabled: true, badge: "SOON" },
      { label: "Reviews", icon: Star, disabled: true, badge: "SOON" },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [
      {
        label: "Analytics",
        icon: ChartNoAxesColumn,
        disabled: true,
        badge: "SOON",
      },
      {
        label: "Reports",
        icon: ChartNoAxesColumn,
        disabled: true,
        badge: "SOON",
      },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      { label: "Settings", icon: Settings, disabled: true, badge: "SOON" },
      {
        label: "Change password",
        href: "/change-password",
        icon: Key,
        match: "prefix",
      },
    ],
  },
];

/** The sign-out icon lives here so the footer and any future menu share it. */
export const SIGN_OUT_ICON: LucideIcon = LogOut;
