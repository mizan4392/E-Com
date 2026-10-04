"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, safeNextPath } from "@/lib/apiClient";
import { setToken } from "@/lib/authStore";
import { useIsAuthenticated } from "@/app/hooks/useAdminAuth";

interface LoginResponse {
  token: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already holding a token? Skip the form and go where we were headed.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeNextPath());
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await apiFetch<LoginResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        // A wrong password is a 401 too; let Nest's message through instead of
        // treating it as an expired session.
        requireAuth: false,
      });

      setToken(data.token);
      // Remember the intended destination, defaulting to the dashboard.
      router.replace(safeNextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Admin access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Use your administrator email and password to manage the store.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0"
            />
          </label>
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
