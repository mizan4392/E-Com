import { X } from "lucide-react";
import { ADMIN_NAV, NAV_ICON_SIZE } from "@/config/admin-nav";
import SidebarFooter from "./SidebarFooter";
import SidebarSection from "./SidebarSection";

/**
 * The sidebar's visual body: brand header, scrollable nav, pinned footer.
 *
 * Deliberately a Server Component — it holds no state and reads no context, so
 * it can be rendered from a Server Component parent. Only the leaves
 * (`SidebarItem` via `usePathname`, `SidebarFooter` via `useRouter`) are
 * clients, which keeps the client boundary as small as the design allows.
 *
 * Both the fixed desktop bar and the mobile drawer render *this* component
 * rather than each assembling their own `<aside>`, so the two can never drift
 * in padding, heading size or nav spacing.
 *
 * @param id            Id for the `<nav>`, used by the toggle's `aria-controls`.
 * @param onNavigate    Forwarded to each item; the drawer closes itself with it.
 * @param onClose       Renders the header close button (drawer only).
 * @param ariaLabel     Label for the `<nav>` landmark.
 */
export default function Sidebar({
  id,
  onNavigate,
  onClose,
  ariaLabel = "Admin navigation",
}: {
  id: string;
  onNavigate?: () => void;
  onClose?: () => void;
  ariaLabel?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* ---------- Brand header ---------- */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
            E-Commerce
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#050A18]">
            Admin panel
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-1 shrink-0 cursor-pointer rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <X size={NAV_ICON_SIZE} aria-hidden="true" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {/* ---------- Scrollable nav ---------- */}
      <nav
        id={id}
        aria-label={ariaLabel}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        {ADMIN_NAV.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* ---------- Pinned footer ---------- */}
      <SidebarFooter />
    </div>
  );
}
