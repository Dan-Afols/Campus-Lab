import api from "@/services/api";

export const materialsService = {
  list: (params?: Record<string, unknown>) => api.get("/materials", { params }),
  one: (id: string) => api.get(`/materials/${id}`)
};
