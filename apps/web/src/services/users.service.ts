import api from "@/services/api";

export const usersService = {
  me: () => api.get("/users/me"),
  sessions: () => api.get("/users/sessions"),
  revokeSession: (id: string) => api.delete(`/users/sessions/${id}`),
  setCoursemateLocator: (enabled: boolean) => api.patch("/users/privacy/coursemate-locator", { enabled }),
  setNotificationPrefs: (payload: Record<string, unknown>) => api.patch("/users/notifications/preferences", payload),
  setHealthGoals: (payload: { waterGoalCups: number; stepGoal: number; bodyWeightKg?: number }) =>
    api.patch("/users/health-goals", payload),
  updateProfile: async (payload: FormData) => {
    const response = await api.patch("/users/me", payload);
    return response.data;
  }
};
