import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "../lib/apiClient";

export type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  [key: string]: string | undefined;
};

interface UserState {
  user: User | null;
  setUser: (u: User | null) => void;
  fetchMe: (token?: string | null | undefined) => Promise<void>;
  clearUser: () => void;
  setIsOwner: (isOwner: boolean) => boolean;
  isOwner: boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isOwner: false,
      setUser: (u) => set({ user: u }),
      clearUser: () => set({ user: null }),
      fetchMe: async (token?: string | null | undefined) => {
        try {
          const data = await apiFetch<User | null>("/users/me", {
            method: "GET",
            token,
          });
          set({ user: data });
        } catch (e) {
          // on error, clear user
          set({ user: null });
          // keep errors silent for now - callers can re-fetch and handle if needed
          console.debug("fetchMe failed", e);
        }
      },
      setIsOwner: (isOwner: boolean) => {
        set({ isOwner });
        return isOwner;
      },
    }),
    {
      name: "user-storage",
    },
  ),
);

export default useUserStore;
