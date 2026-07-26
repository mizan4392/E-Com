"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:4000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Unable to sign in");
      return;
    }

    localStorage.setItem("adminToken", data.token);
    router.push("/");
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
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            className="cursor-pointer w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
