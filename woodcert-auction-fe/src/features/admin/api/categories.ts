import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string | null;
}

export type CategoryPayload = {
  name: string;
  slug?: string;
  parentId?: number | null;
  description?: string | null;
};

export const adminCategoryApi = {
  getAll: async (): Promise<AdminCategory[]> => {
    const response = await apiClient.get<ApiResponse<AdminCategory[]>>("/admin/categories");
    return unwrapApiResponse(response);
  },
  create: async (payload: CategoryPayload): Promise<AdminCategory> => {
    const response = await apiClient.post<ApiResponse<AdminCategory>>("/admin/categories", payload);
    return unwrapApiResponse(response);
  },
  update: async ({
    id,
    payload,
  }: {
    id: number;
    payload: CategoryPayload;
  }): Promise<AdminCategory> => {
    const response = await apiClient.put<ApiResponse<AdminCategory>>(
      `/admin/categories/${id}`,
      payload,
    );
    return unwrapApiResponse(response);
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
