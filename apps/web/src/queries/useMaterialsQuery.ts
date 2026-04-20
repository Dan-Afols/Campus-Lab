import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export function useMaterialsQuery(filter = "all") {
  return useQuery({
    queryKey: ["materials", filter],
    queryFn: async () => {
      const rows = (await api.get("/materials/mine")).data ?? [];
      if (!Array.isArray(rows)) {
        return [];
      }

      if (filter === "all") {
        return rows;
      }

      if (filter === "bookmarked") {
        return rows.filter((item: any) => Boolean(item?.isBookmarked));
      }

      const filterType = filter.toUpperCase();
      return rows.filter((item: any) => String(item?.type || "").toUpperCase() === filterType);
    }
  });
}
