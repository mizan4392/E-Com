/**
 * Single source of truth for talking to the Nest API from the admin app.
 *
 * Two bugs lived here before this file existed:
 * 1. Every page hand-wrote `http://localhost:4000/admin/...`, but the server
 *    sets `app.setGlobalPrefix('api')` (server/src/main.ts), so the real paths
 *    are `/api/admin/...`. Those calls 404'd and the pages rendered garbage.
 * 2. `Authorization: \`Bearer ${token}\` || ""` is a no-op: the template string
 *    is always truthy, so an unauthenticated request still sent
 *    `Bearer null`. A 401 therefore looked like a crash rather than an expired
 *    session, which is what bounced admins back to the login page forever.
 */

import { clearToken, getToken } from "@/lib/authStore";

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Normalised API root, always ending in `/api` and never with a trailing slash.
 * `NEXT_PUBLIC_API_URL` may be set with or without the prefix, so we add it
 * only when it is missing — a doubled `/api/api` is just as broken as a 404.
 */
export const API_BASE = (() => {
  const trimmed = RAW_BASE.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

export const LOGIN_PATH = "/login";

export { getToken };

/** Thrown when the API rejects our token, so callers can bounce to login. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Whether an error reaching an `error.tsx` boundary is an auth failure.
 *
 * `error instanceof UnauthorizedError` looks like the obvious way to ask this and
 * it is wrong. The error is thrown inside a Server Component, so it crosses the
 * React Server Components wire format before `error.tsx` ever sees it. That
 * format carries only plain fields — `message` and `digest`, plus `name` when
 * set — and reconstructs a *native* `Error` on the client. The prototype is not
 * preserved, so `instanceof UnauthorizedError` is always `false` here and the
 * boundary quietly treats every expired session as an ordinary failure: it shows
 * "Could not load orders" and offers "Try again", and retrying re-runs the same
 * rejected fetch.
 *
 * Matching on the serialised shape instead survives the boundary. Both fields are
 * set explicitly by {@link UnauthorizedError}, so this cannot collide with an
 * unrelated error that happens to mention authorisation.
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof UnauthorizedError) return true;
  if (!error || typeof error !== "object") return false;

  const { name, message } = error as { name?: unknown; message?: unknown };

  return (
    name === "UnauthorizedError" ||
    (typeof message === "string" && /admin access required|^unauthorized$/i.test(message))
  );
}

export interface ApiFetchOptions extends RequestInit {
  /**
   * Set to `false` for the login call so a 401 surfaces Nest's own message
   * ("Invalid admin credentials") instead of being treated as an expired
   * session. Defaults to `true`.
   */
  requireAuth?: boolean;
}

/**
 * Sends the admin token (when present) and normalises auth failures into
 * `UnauthorizedError` so every page can react the same way.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...init } = options;
  const token = getToken();
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders ?? {}),
    },
  });

  if (response.status === 401 && requireAuth) {
    // The token is missing, expired or revoked: drop it so the guard sends
    // the visitor to the login screen instead of looping on a stale value.
    //
    // `requireAuth: false` is how the login call opts out. A wrong password
    // also returns 401, and clearing the session or reporting "Unauthorized"
    // there would replace Nest's helpful "Invalid admin credentials" message.
    clearToken();
    throw new UnauthorizedError(await readMessage(response));
  }

  if (!response.ok) {
    const message = await readMessage(response);
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Nest returns `message` as a string or an array of validation errors. */
async function readMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
  } catch {
    // Body was not JSON; fall through to the generic status text.
  }
  return "";
}

/** Sends the visitor to the login page, remembering where they were headed. */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.replace(
    next && next !== LOGIN_PATH
      ? `${LOGIN_PATH}?next=${encodeURIComponent(next)}`
      : LOGIN_PATH,
  );
}

/**
 * Reads an absolute same-origin path from `?next=` and falls back to `/`.
 * Rejects protocol-relative URLs (`//evil.com`) so the query string cannot be
 * used to bounce an admin to another host after signing in.
 */
export function safeNextPath(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
