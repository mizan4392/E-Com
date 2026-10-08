"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken } from "@/lib/authStore";
import { NAV_ICON_SIZE, SIGN_OUT_ICON } from "@/config/admin-nav";

/**
 * Pinned sidebar footer holding the sign-out button.
 *
 * Signing out is a local token delete plus a redirect, so there is no request
 * to await — but the button still shows a busy state for the tick between the
 * click and the navigation landing, which stops a double-click from queueing
 * two redirects. `signingOut` also drives `aria-busy` so the state is not
 * purely visual.
 *
 * `useEffect` + `setState` is used only to reset the flag if the redirect is
 * intercepted (e.g. a client-side back navigation), never on the happy path.
 */
export default function SidebarFooter() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If the navigation is cancelled the component stays mounted, and without
  // this the button would stay permanently disabled.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    clearToken();
    router.replace("/login");
    // Safety net: if the redirect is blocked, re-enable the button.
    timerRef.current = setTimeout(() => setSigningOut(false), 2000);
  }

  return (
    <div className="border-t border-slate-200 p-3">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-busy={signingOut}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        <SIGN_OUT_ICON
          size={NAV_ICON_SIZE}
          aria-hidden="true"
          strokeWidth={1.75}
        />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
