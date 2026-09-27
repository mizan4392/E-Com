"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState, type FormEvent } from "react";
import {
  useUserProfile,
  useUpdateUserProfile,
} from "../../../lib/user/queries";
import type { UserProfile } from "../../../lib/user/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingSpinner from "../../components/LoadingSpinner";

function ProfileForm({ profile }: { profile: UserProfile }) {
  const [address, setAddress] = useState(profile.address ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const updateProfile = useUpdateUserProfile();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({
        address: address.trim(),
        phone: phone.trim(),
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="text-sm font-medium text-zinc-800">
          Primary delivery address
        </span>
        <textarea
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          rows={3}
          maxLength={500}
          required
          className="mt-2 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
          autoComplete="street-address"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-800">Phone number</span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={32}
          required
          autoComplete="tel"
          className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
        />
      </label>

      <button
        type="submit"
        disabled={updateProfile.isPending}
        className="h-12 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {updateProfile.isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { isSignedIn } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useUserProfile(isSignedIn === true);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 text-zinc-900 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span className="mx-2 text-zinc-300">/</span>
            <span className="text-zinc-900">Profile</span>
          </nav>

          <header className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Profile & delivery details
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Your primary address is used by default at checkout. An address
              changed for an order won&apos;t change this profile.
            </p>
          </header>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner size="lg" color="dark" />
              </div>
            ) : isError || !profile ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-600">
                  Couldn&apos;t load your profile.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-900"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 border-b border-zinc-100 pb-5">
                  <p className="text-sm font-medium text-zinc-900">
                    {[profile.firstName, profile.lastName]
                      .filter(Boolean)
                      .join(" ") || "Your account"}
                  </p>
                  {profile.email ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      {profile.email}
                    </p>
                  ) : null}
                </div>
                <ProfileForm key={profile.id} profile={profile} />
              </>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
