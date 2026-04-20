import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useTimetableQuery(day?: string) {
  return useQuery({
    queryKey: ["timetable", day],
    queryFn: async () => {
      const response = await api.get("/timetable", { params: day ? { day } : undefined });
      return response.data?.data ?? [];
    }
  });
}
