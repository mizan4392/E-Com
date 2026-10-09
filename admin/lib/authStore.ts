/**
 * Token store for the admin session.
 *
 * The token lives in `localStorage`, which is neither readable during SSR nor
 * reactive on its own. Wrapping it in a tiny store lets components subscribe via
 * `useSyncExternalStore`, so signing in, signing out, or a 401 clearing the
 * token all re-render the shell without any `setState`-inside-an-effect.
 *
 * ## Why the token is also mirrored into a cookie
 *
 * `localStorage` is unreadable on the server. That is invisible while every page
 * fetches on the client, but it makes Server Components impossible: a
 * Server Component that calls the API has no way to attach the bearer token, so
 * every request 401s and the page renders its error boundary.
 *
 * Writing the same token to a cookie gives the server something to read
 * (`cookies()` in `serverApiFetch`). The cookie is not read by client code —
 * `getToken()` still returns the `localStorage` value, which keeps
 * `useSyncExternalStore` reactive and hydration clean. The two stores are
 * written and cleared together in {@link setToken} and {@link clearToken}, so
 * they cannot drift.
 */

export const TOKEN_KEY = "adminToken";

/** Cookie name read by Server Components. Not used for client-side reads. */
export const TOKEN_COOKIE = "adminToken";

/**
 * Cookie lifetime, in seconds.
 *
 * Matches how `localStorage` behaves for this app: there is no expiry, so the
 * admin stays signed in across restarts. A real expiry comes from the JWT
 * itself, and a rejected token clears both stores (see `apiFetch`).
 */
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

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
  writeTokenCookie(token);
  notifyTokenChanged();
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  writeTokenCookie("");
  notifyTokenChanged();
}

/**
 * Mirrors the token into a cookie Server Components can read.
 *
 * Exported so a client component can repair the mirror without going through
 * {@link setToken}, which would also rewrite `localStorage` for no reason.
 *
 * - `SameSite=Lax` — the API is called from the app's own origin, and Lax is
 *   what stops another site from driving authenticated requests through a
 *   visitor's browser.
 * - `path=/` — the cookie must be sent for `/orders`, `/products`, and every
 *   other route, not just the one that set it.
 * - `Secure` is deliberately omitted. The admin panel is served over plain
 *   HTTP on localhost in development, and a `Secure` cookie is silently
 *   dropped there, which would break the page in exactly the environment it is
 *   developed in. Terminate TLS at the proxy in any real deployment and set
 *   `Secure` there.
 */
export function writeTokenCookie(token: string): void {
  const encoded = encodeURIComponent(token);
  const maxAge = token ? `; Max-Age=${TOKEN_COOKIE_MAX_AGE}` : "; Max-Age=0";
  document.cookie = `${TOKEN_COOKIE}=${encoded}; Path=/; SameSite=Lax${maxAge}`;
}

/**
 * Unconditionally rewrites the cookie from `localStorage`.
 *
 * Used when the server has *already* rejected the cookie, as opposed to merely
 * arriving without one. A repair that skipped a cookie already present would
 * help nothing here: `document.cookie` is readable, but the value the server
 * rejected is precisely the one that is still sitting there, so the only useful
 * move is to overwrite it from `localStorage`.
 *
 * That matters because the two can genuinely disagree: the cookie may hold a
 * token the server has rotated away from, or one that was truncated by a copy
 * through another tool. `localStorage` is the authoritative store for this app,
 * so re-mirroring from it is the cheapest thing to try before evicting someone
 * from a session they are still entitled to.
 *
 * @returns `true` when a token was available to rewrite the cookie with. `false`
 * means `localStorage` is empty and the session really is over.
 */
export function repairTokenCookie(): boolean {
  if (typeof document === "undefined") return false;

  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (!stored) return false;

  writeTokenCookie(stored);
  return true;
}
