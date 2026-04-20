import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useFinanceDashboardQuery() {
  return useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: async () => (await api.get("/finance/summary")).data
  });
}

export function useExpensesQuery() {
  return useQuery({
    queryKey: ["finance-expenses"],
    queryFn: async () => (await api.get("/finance/expenses")).data ?? []
  });
}

export function useLogExpenseMutation() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/finance/expenses", payload)).data
  });
}

export function useCreateSavingsGoalMutation() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/finance/savings-goals", payload)).data
  });
}
