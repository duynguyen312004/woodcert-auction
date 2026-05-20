import { apiRequest } from "@/shared/api/client";

import type { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>({
    method: "GET",
    url: "/categories",
  });
}
