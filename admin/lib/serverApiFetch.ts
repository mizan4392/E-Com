import { cookies } from "next/headers";
import { API_BASE, UnauthorizedError } from "./apiClient";
import { TOKEN_COOKIE } from "./authStore";

/**
 * `apiFetch` for Server Components.
 *
 * ## Why this exists
 *
 * `apiFetch` reads the token from `localStorage`, which is only available in the
 * browser. A Server Component runs on the server, so `getToken()` returns
 * `null`, no `Authorization` header is sent, and every request comes back 401 —
 * the page then renders its own error boundary. Any admin page that fetches in
 * a Server Component hits this; the pages that predate the orders feature all
 * fetch on the client, which is why it never surfaced before.
 *
 * This variant reads the token from the cookie mirror that `setToken` writes
 * (see `lib/authStore`), keeping the request and the client's session in step.
 *
 * ## What is deliberately not here
 *
 * - **No `cache`/`revalidate` options.** The orders list is different for every
 *   filter combination and every admin, so caching a response would be a
 *   correctness bug. Next.js does not cache a bare `fetch` anyway.
 * - **No `redirectToLogin()`.** That helper pokes `window.location` and is a
 *   no-op on the server. An expired session is turned into
 *   {@link UnauthorizedError} and handled by the route's `error.tsx`, which
 *   runs on the client and *can* redirect.
 * - **No `clearToken()`.** A cookie cannot be cleared from a Server Component —
 *   only from a Server Action or a Route Handler. The client-side `error.tsx`
 *   already redirects on `UnauthorizedError`, and `apiFetch`'s 401 path clears
 *   the `localStorage` half on the next client-side call.
 *
 * `server-only` is not imported: it is not a dependency of this app, and
 * calling `cookies()` from a Client Component already fails at runtime in
 * Next.js with an error naming this function.
 */
export async function serverApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401) {
    throw new UnauthorizedError(await readMessage(response));
  }

  if (!response.ok) {
    throw new Error(
      (await readMessage(response)) || `Request failed (${response.status})`,
    );
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
