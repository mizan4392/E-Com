"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageContainer } from "@/components/layout/PageHeader";
import { PRIMARY_BUTTON_CLASS, COMPACT_BUTTON_CLASS } from "@/components/layout/Form";
import {
  apiFetch,
  redirectToLogin,
  isUnauthorizedError,
} from "@/lib/apiClient";
import { clearToken, repairTokenCookie } from "@/lib/authStore";

/**
 * Error boundary for `/orders`.
 *
 * `error.tsx` must be a Client Component — the framework requires it, and this
 * is where the retry affordance lives.
 *
 * ## Why there is a link back as well as a retry
 *
 * `reset()` re-renders the segment and re-runs the server component, which
 * re-fetches. That is the right fix for a transient failure, but it cannot help
 * when the *filter in the URL* is what the server is rejecting — retrying
 * re-sends the same bad query and fails identically. "Back to all orders" drops
 * the query string, so a bad link is always escapable without hand-editing the
 * address bar.
 */
export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // An expired session is not an error worth showing: the visitor needs to sign
  // in again. `instanceof` would always be false here — the error is rebuilt as
  // a native `Error` after crossing the Server Component boundary — so this
  // asks the shape-preserving predicate instead. See `isUnauthorizedError`.
  const isAuthError = isUnauthorizedError(error);

  /**
   * An auth failure here is ambiguous, so it gets resolved by asking the API
   * rather than by guessing.
   *
   * A Server Component authenticates from the cookie mirror of the token, and
   * that cookie has its own `Max-Age`. When it lapses — or holds a token the API
   * has since rotated away from — the server 401s while `localStorage` still has
   * a perfectly valid one. That is not an expired session, it is a broken
   * mirror, and treating it as one is what caused the original bug: the page
   * redirected to `/login`, and because that redirect is a full page load it
   * re-ran the same Server Component against the same missing cookie, so the
   * login form flashed up on every filter change and page turn.
   *
   * So: re-mirror the cookie, then ask the API whether the token is actually
   * good.
   *
   * - **No token in `localStorage`** — the session is genuinely over. Clear both
   *   halves and send the visitor to sign in, remembering where they were.
   * - **Token good (200)** — the cookie was the only problem. Reload so the
   *   server fetches again with the repaired cookie.
   * - **Token rejected (401)** — the session really is over. `apiFetch` has
   *   already cleared the token, so this only has to navigate.
   * - **Anything else** (network blip, 500) — say nothing about the token.
   *   Leave the visitor signed in and let them retry, rather than evicting them
   *   over a transient fault.
   *
   * Asking is cheap and exact, so there is no timeout anywhere in this path. An
   * earlier version armed a one-second timer and signed the visitor out when it
   * expired; that raced the request and locked people out for being on a slow
   * connection, which is strictly worse than waiting for the real answer.
   *
   * A reload rather than `reset()`. `reset` re-renders the segment but replays
   * the cached Server Component payload, so the request is never re-sent and the
   * identical 401 comes straight back. Reloading is the one path guaranteed to
   * issue a fresh request against the repaired cookie, and it is cheap here
   * because this branch is only ever reached after a full page load — the soft
   * navigation that filters and paging use never reaches it, so the repair path
   * and the common path stay entirely separate.
   */
  useEffect(() => {
    if (!isAuthError) return;

    let cancelled = false;

    // Nothing to re-mirror from, so there is nothing to repair either.
    if (!repairTokenCookie()) {
      clearToken();
      redirectToLogin();
      return;
    }

    apiFetch<unknown>("/admin/orders?limit=1")
      .then(() => {
        if (cancelled) return;
        // The token is fine, so the cookie was the only problem.
        window.location.reload();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorizedError(err)) {
          // `apiFetch` clears the token on a 401, so the two halves of the
          // store cannot drift apart on the way out.
          redirectToLogin();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [error, isAuthError]);

  useEffect(() => {
    if (isAuthError) return;
    console.error("Failed to load orders:", error);
  }, [error, isAuthError]);

  const title = isAuthError
    ? "Session expired"
    : "Could not load orders";

  const description = isAuthError
    ? "Redirecting you to the sign-in page…"
    : error.message ||
      "The orders API did not respond. Check that the server is running and try again.";

  return (
    <PageContainer>
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-14 text-center"
      >
        <div
          aria-hidden="true"
          className="mb-3 flex size-11 items-center justify-center rounded-full bg-rose-100 text-rose-600"
        >
          <AlertTriangle className="size-5" />
        </div>

        <h1 className="text-lg font-semibold text-rose-900">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-rose-700">{description}</p>

        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-rose-500">
            Reference: {error.digest}
          </p>
        ) : null}

        {!isAuthError ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {/*
             * `h-11` matches the link below. `PRIMARY_BUTTON_CLASS` sizes
             * itself with `py-2.5` and no explicit height, so it came out at
             * 40px against the link's 44px — the two actions sitting side by
             * side were visibly different sizes.
             */}
            <button
              type="button"
              onClick={() => reset()}
              className={cn(PRIMARY_BUTTON_CLASS, "h-11")}
            >
              <RotateCcw aria-hidden="true" className="mr-2 size-4" />
              Try again
            </button>

            <Link href="/orders" className={`${COMPACT_BUTTON_CLASS} px-4`}>
              Back to all orders
            </Link>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
