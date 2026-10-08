"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, redirectToLogin, UnauthorizedError } from "@/lib/apiClient";
import {
  Card,
  ErrorMessage,
  PageContainer,
} from "@/components/layout/PageHeader";
import { PRIMARY_BUTTON_CLASS, TextField } from "@/components/layout/Form";

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
    <PageContainer className="max-w-md">
      <Card>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Change password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a new password for your admin account.
        </p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <TextField
            id="old-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <TextField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {message ? (
            <p role="status" className="text-sm text-emerald-600">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={PRIMARY_BUTTON_CLASS}
          >
            {submitting ? "Saving…" : "Save password"}
          </button>
        </form>
      </Card>
    </PageContainer>
  );
}
