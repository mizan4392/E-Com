"use client";

import { useSyncExternalStore } from "react";
import {
  getServerTokenSnapshot,
  getTokenSnapshot,
  subscribeToToken,
} from "@/lib/authStore";

/**
 * Returns the admin token, or `null` when signed out.
 *
 * The token lives in `localStorage`, so it cannot be read during SSR. React's
 * `useSyncExternalStore` is the right tool here: it gives us a reactive
 * subscription (sign-in, sign-out and 401s all notify) without the
 * `setState`-inside-an-effect cascade a `useEffect` + `useState` pair would
 * produce — which React flags as a lint error and which also caused a
 * render-then-redirect flash on every page load.
 *
 * The server snapshot is always `null`, so the first client render matches the
 * server HTML and hydration stays clean.
 */
export function useAdminToken(): string | null {
  return useSyncExternalStore(
    subscribeToToken,
    getTokenSnapshot,
    getServerTokenSnapshot,
  );
}

/** Convenience wrapper for route guards. */
export function useIsAuthenticated(): boolean {
  return useAdminToken() !== null;
}
