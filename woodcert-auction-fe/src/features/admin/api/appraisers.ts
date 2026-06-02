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

export const adminAppraiserApi = {
  getUsers: async (params?: {
    query?: string;
    page?: number;
    size?: number;
  }): Promise<PaginationResponse<AdminUser>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<AdminUser>>>(
      "/admin/appraisers",
      { params },
    );
    return unwrapApiResponse(response);
  },
  promote: async (userId: string): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/appraisers/${userId}/promote`,
    );
    return unwrapApiResponse(response);
  },
  demote: async (userId: string): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/appraisers/${userId}/demote`,
    );
    return unwrapApiResponse(response);
  },
};
