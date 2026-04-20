import api from "@/services/api";

export const newsService = {
  list: () => api.get("/news"),
  bookmark: (id: string) => api.post(`/news/${id}/bookmark`)
};
