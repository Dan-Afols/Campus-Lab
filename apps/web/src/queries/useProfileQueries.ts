import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/stores/authStore";

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await usersService.me()).data
  });
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await usersService.sessions()).data ?? []
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => usersService.revokeSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  });
}

export function usePrivacyMutation() {
  return useMutation({
    mutationFn: async (enabled: boolean) => usersService.setCoursemateLocator(enabled)
  });
}

export function useNotificationPrefsMutation() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => usersService.setNotificationPrefs(payload)
  });
}

export function useHealthGoalsMutation() {
  return useMutation({
    mutationFn: async (payload: { waterGoalCups: number; stepGoal: number; bodyWeightKg?: number }) =>
      usersService.setHealthGoals(payload)
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: FormData) => usersService.updateProfile(payload),
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.setQueryData(["me"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });
}
