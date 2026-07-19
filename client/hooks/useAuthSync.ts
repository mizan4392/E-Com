import { useEffect, useRef } from "react";
import { useAuth, useSession } from "@clerk/nextjs";
import useUserStore from "../stores/userStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function syncUserProfile(
  userId: string,
  token: string | null,
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  imageUrl?: string | null,
) {
  try {
    await fetch(`${API_URL}/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId,
        firstName,
        lastName,
        email,
        imageUrl,
      }),
    });

    await useUserStore.getState().fetchMe(token);
  } catch (error) {
    console.error("Sync error", error);
  }
}

export function useAuthSync() {
  const { isSignedIn, userId, getToken } = useAuth();
  const { session } = useSession();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      if (syncedUserIdRef.current) {
        useUserStore.getState().clearUser();
      }
      syncedUserIdRef.current = null;
      return;
    }

    if (syncedUserIdRef.current === userId) {
      return;
    }

    syncedUserIdRef.current = userId;

    let cancelled = false;

    void (async () => {
      const token = (await getToken?.()) ?? null;

      if (cancelled) {
        return;
      }

      await syncUserProfile(
        userId,
        token,
        session?.user?.firstName,
        session?.user?.lastName,
        session?.user?.emailAddresses?.[0]?.emailAddress,
        session?.user?.imageUrl,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId, getToken, session?.user?.id]);
}
