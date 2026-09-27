import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "./api";

export const userProfileKey = ["user-profile"] as const;

export function useUserProfile(enabled: boolean) {
  return useQuery({
    queryKey: userProfileKey,
    queryFn: getUserProfile,
    enabled,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(userProfileKey, profile);
    },
  });
}
