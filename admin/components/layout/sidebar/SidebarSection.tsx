import type { NavItem, NavSection } from "@/config/admin-nav";
import SidebarItem from "./SidebarItem";

/**
 * One labelled group of nav items.
 *
 * Rendered as a real `<section>` + `<ul>` so screen readers can navigate by
 * group, with the heading wired to the list via `aria-labelledby`. The heading
 * lives here rather than in `Sidebar` so that adding a section to `ADMIN_NAV`
 * requires no layout change anywhere else.
 *
 * @param section     Entry from `ADMIN_NAV`.
 * @param onNavigate  Forwarded to each item; the drawer closes itself with it.
 */
export default function SidebarSection({
  section,
  onNavigate,
}: {
  section: NavSection;
  onNavigate?: () => void;
}) {
  const headingId = `nav-section-${section.id}`;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        {section.title}
      </h2>
      <ul className="mt-2 space-y-1">
        {section.items.map((item: NavItem) => (
          <li key={item.label}>
            <SidebarItem item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </section>
  );
}
