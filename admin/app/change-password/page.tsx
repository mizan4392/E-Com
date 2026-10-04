"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      await apiFetch("/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      setMessage("Password updated successfully");
      // The dashboard lives at "/", not "/admin".
      setTimeout(() => router.replace("/"), 600);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to update password",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Change password
        </h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Current password
            <input
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          {message ? (
            <p role="status" className="text-sm text-emerald-600">
              {message}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
