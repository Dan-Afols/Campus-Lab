import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { queryClient } from "@/queries/queryClient";

export function useHealthDashboardQuery() {
  return useQuery({
    queryKey: ["health-dashboard"],
    queryFn: async () => (await api.get("/health/summary")).data
  });
}

export function useWaterMutation() {
  return useMutation({
    mutationFn: async (payload: { cups: number; loggedAt?: string }) => (await api.post("/health/hydration", payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["health-dashboard"] });
    }
  });
}

export function useSleepMutation() {
  return useMutation({
    mutationFn: async (payload: { sleptAt: string; wokeAt: string; qualityRating: number }) => (await api.post("/health/sleep", payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["health-dashboard"] });
    }
  });
}

export function useStepMutation() {
  return useMutation({
    mutationFn: async (payload: { steps: number; weightKg?: number; loggedAt?: string }) => (await api.post("/health/steps", payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["health-dashboard"] });
    }
  });
}
