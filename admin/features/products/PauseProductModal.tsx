"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  FIELD_CLASS,
} from "@/components/layout/Form";
import { cn } from "@/lib/cn";
import {
  apiFetch,
  isUnauthorizedError,
  redirectToLogin,
} from "@/lib/apiClient";
import type { AdminProductListItem } from "./products.types";

/**
 * Modal that pauses a product, requiring an admin note as the reason.
 *
 * Uses the client-side `apiFetch` (token read from `localStorage`) because this
 * action fires from an interactive click in the browser — no `serverApiFetch`
 * import, which would pull server-only `cookies()` into a Client Component and
 * break the build. On success the parent soft-refreshes the list.
 */
export default function PauseProductModal({
  product,
  onClose,
  onPaused,
}: {
  product: AdminProductListItem;
  onClose: () => void;
  onPaused: () => void;
}) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A note is required so the reason for pausing is recorded.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch<unknown>(`/admin/products/${product.id}/pause`, {
        method: "PATCH",
        body: JSON.stringify({ pauseNote: trimmed }),
      });
      onPaused();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToLogin();
        return;
      }
      setError(err instanceof Error ? err.message : "Could not pause product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="pause-modal-title"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="pause-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            Pause {product.name}?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          A paused product is hidden from the storefront. Choose a reason so the
          team knows why it is not visible.
        </p>

        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

        <label
          htmlFor="pause-note"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Pause note
        </label>
        <textarea
          id="pause-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="e.g. Out of stock until Nov 2025"
          className={cn(FIELD_CLASS, "min-h-[7rem] resize-y")}
          required
          disabled={isSubmitting}
        />

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(SECONDARY_BUTTON_CLASS, "w-full sm:w-auto")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(PRIMARY_BUTTON_CLASS, "w-full sm:w-auto")}
          >
            {isSubmitting ? "Pausing…" : "Pause product"}
          </button>
        </div>
      </form>
    </div>
  );
}
