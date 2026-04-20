import api from "@/services/api";

export const authService = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: Record<string, unknown>) => api.post("/auth/register", payload),
  me: () => api.get("/auth/me")
};
