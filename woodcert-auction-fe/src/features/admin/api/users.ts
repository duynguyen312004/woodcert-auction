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
  capabilityStatuses: CapabilityStatus[];
}

export type UserCapability = "BUYER" | "SELLER" | "APPRAISER";
export type CapabilityState = "ACTIVE" | "BANNED";

export interface CapabilityStatus {
  capability: UserCapability;
  status: CapabilityState;
  reason: string | null;
  updatedByAdminId: string | null;
  updatedAt: string | null;
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

  ban: async ({ userId, reason }: { userId: string; reason: string }): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/ban`, {
      reason,
    });
    return unwrapApiResponse(response);
  },

  unban: async ({ userId, reason }: { userId: string; reason: string }): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/unban`, {
      reason,
    });
    return unwrapApiResponse(response);
  },

  banCapability: async ({
    userId,
    capability,
    reason,
  }: {
    userId: string;
    capability: UserCapability;
    reason: string;
  }): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${userId}/capabilities/${capability}/ban`,
      { reason },
    );
    return unwrapApiResponse(response);
  },

  unbanCapability: async ({
    userId,
    capability,
    reason,
  }: {
    userId: string;
    capability: UserCapability;
    reason: string;
  }): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${userId}/capabilities/${capability}/unban`,
      { reason },
    );
    return unwrapApiResponse(response);
  },
};
