/**
 * Token store for the admin session.
 *
 * The token lives in `localStorage`, which is neither readable during SSR nor
 * reactive on its own. Wrapping it in a tiny store lets components subscribe via
 * `useSyncExternalStore`, so signing in, signing out, or a 401 clearing the
 * token all re-render the shell without any `setState`-inside-an-effect.
 */

export const TOKEN_KEY = "adminToken";

const listeners = new Set<() => void>();

/** Must be a pure read: called on every render, so no side effects here. */
export function getTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/** Server render has no session, so hydration starts from "signed out". */
export function getServerTokenSnapshot(): string | null {
  return null;
}

export function subscribeToToken(listener: () => void): () => void {
  listeners.add(listener);
  // The `storage` event covers other tabs; `notifyTokenChanged` covers this one.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notifyTokenChanged(): void {
  for (const listener of listeners) listener();
}

export function getToken(): string | null {
  return getTokenSnapshot();
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyTokenChanged();
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  notifyTokenChanged();
}
