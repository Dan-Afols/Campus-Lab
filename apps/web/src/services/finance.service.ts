import api from "@/services/api";

export const financeService = {
  dashboard: () => api.get("/finance/dashboard"),
  logExpense: (payload: Record<string, unknown>) => api.post("/finance/expenses", payload)
};
