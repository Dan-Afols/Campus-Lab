import api from "@/services/api";

export const notificationsService = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`)
};
