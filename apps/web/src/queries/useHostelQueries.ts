import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { queryClient } from "@/queries/queryClient";

export function useHostelsQuery() {
  return useQuery({
    queryKey: ["hostels"],
    queryFn: async () => (await api.get("/hostel/hostels")).data ?? []
  });
}

export function useHostelLayoutQuery(hostelId?: string) {
  return useQuery({
    queryKey: ["hostel-layout", hostelId],
    enabled: Boolean(hostelId),
    queryFn: async () => (await api.get(`/hostel/hostels/${hostelId}/layout`)).data
  });
}

export function useMyBookingQuery() {
  return useQuery({
    queryKey: ["hostel-my-booking"],
    queryFn: async () => (await api.get("/hostel/my-booking")).data
  });
}

export function useBookBedMutation() {
  return useMutation({
    mutationFn: async (payload: { bedId: string; moveInDate: string }) => (await api.post(`/hostel/beds/${payload.bedId}/book`, { moveInDate: payload.moveInDate })).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hostels"] });
      await queryClient.invalidateQueries({ queryKey: ["hostel-layout"] });
      await queryClient.invalidateQueries({ queryKey: ["hostel-my-booking"] });
    }
  });
}
