import { apiFetch } from "../apiClient";

export type UserProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
};

export const getUserProfile = () => apiFetch<UserProfile>("/users/me");

export const updateUserProfile = (profile: {
  address: string;
  phone: string;
}) =>
  apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: profile,
  });
