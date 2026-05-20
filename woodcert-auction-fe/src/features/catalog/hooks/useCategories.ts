import { useQuery } from "@tanstack/react-query";

import { getCategories } from "../api/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 60,
  });
}
