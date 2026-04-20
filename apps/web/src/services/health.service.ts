import api from "@/services/api";

export const healthService = {
  dashboard: () => api.get("/health/dashboard"),
  water: (payload: { cups: number }) => api.post("/health/water", payload),
  sleep: (payload: Record<string, unknown>) => api.post("/health/sleep", payload)
};
