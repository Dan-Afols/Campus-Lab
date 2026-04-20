import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { setAccessToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      return login(payload.email, payload.password);
    },
    onSuccess: async (data) => {
      localStorage.setItem("campuslab_access_token", data.accessToken);
      localStorage.setItem("campuslab_refresh_token", data.refreshToken);
      setAccessToken(data.accessToken);
      const me = await getCurrentUser();
      setUser(me);
      await queryClient.prefetchQuery({
        queryKey: ["dashboard"],
        queryFn: async () => me
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });
}
