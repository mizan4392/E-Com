"use client";

import { useEffect } from "react";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageContainer } from "@/components/layout/PageHeader";
import {
  COMPACT_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/layout/Form";
import {
  apiFetch,
  redirectToLogin,
  isUnauthorizedError,
} from "@/lib/apiClient";
import { clearToken, repairTokenCookie } from "@/lib/authStore";

/**
 * Error boundary for `/products`.
 *
 * Mirrors `/orders/error.tsx`: a Server Component 401 on load is ambiguous, so
 * it is resolved by re-mirroring the cookie and asking the API rather than
 * redirecting blindly — which is what produced the login flash the orders
 * page already fixed.
 *
 * After a successful pause (a client action), the list soft-refreshes and never
 * lands here; this boundary only handles genuine load failures.
 */
export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthError = isUnauthorizedError(error);

  useEffect(() => {
    if (!isAuthError) return;

    let cancelled = false;

    if (!repairTokenCookie()) {
      clearToken();
      redirectToLogin();
      return;
    }

    apiFetch<unknown>("/admin/products?limit=1")
      .then(() => {
        if (cancelled) return;
        window.location.reload();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorizedError(err)) {
          redirectToLogin();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [error, isAuthError]);

  useEffect(() => {
    if (isAuthError) return;
    console.error("Failed to load products:", error);
  }, [error, isAuthError]);

  const title = isAuthError ? "Session expired" : "Could not load products";
  const description = isAuthError
    ? "Redirecting you to the sign-in page…"
    : error.message ||
      "The products API did not respond. Check that the server is running and try again.";

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
          {isAuthError ? (
            <ShoppingCart className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
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
            <button
              type="button"
              onClick={reset}
              className={cn(PRIMARY_BUTTON_CLASS, "w-full sm:w-auto")}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/products")}
              className={cn(COMPACT_BUTTON_CLASS, "w-full sm:w-auto")}
            >
              Back to products
            </button>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
