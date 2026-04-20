import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function usePastQuestionsQuery() {
  return useQuery({
    queryKey: ["pastQuestions"],
    queryFn: async () => (await api.get("/past-questions/mine")).data ?? []
  });
}
