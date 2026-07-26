"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const response = await fetch(
      "http://localhost:4000/admin/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` || "",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Unable to update password");
      return;
    }

    setMessage("Password updated successfully");
    setTimeout(() => router.push("/admin"), 600);
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
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
          >
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}
