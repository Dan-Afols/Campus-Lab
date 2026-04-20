import api from "@/services/api";

export const hostelService = {
  list: () => api.get("/hostel"),
  one: (id: string) => api.get(`/hostel/${id}`),
  book: (payload: { bedId: string }) => api.post("/hostel/bookings", payload)
};
