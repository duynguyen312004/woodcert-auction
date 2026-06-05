import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  status: string;
  roles: string[];
  createdAt: string;
}

export const adminUserApi = {
  getUsers: async (params?: {
    role?: string;
    status?: string;
    query?: string;
    page?: number;
    size?: number;
  }): Promise<PaginationResponse<AdminUser>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<AdminUser>>>(
      "/admin/users",
      { params },
    );
    return unwrapApiResponse(response);
  },

  ban: async (userId: string): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/ban`);
    return unwrapApiResponse(response);
  },

  unban: async (userId: string): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/unban`);
    return unwrapApiResponse(response);
  },
};
