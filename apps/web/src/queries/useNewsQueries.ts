import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsService } from "@/services/news.service";

export function useNewsQuery() {
  return useQuery({
    queryKey: ["news"],
    queryFn: async () => (await newsService.list()).data ?? []
  });
}

export function useBookmarkNewsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => newsService.bookmark(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["news"] });
    }
  });
}
