import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

import type { AdminUser } from "./users";

export type { AdminUser } from "./users";

export type CreateAdminAppraiserPayload = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
};

export const adminAppraiserApi = {
  create: async (payload: CreateAdminAppraiserPayload): Promise<AdminUser> => {
    const response = await apiClient.post<ApiResponse<AdminUser>>("/admin/appraisers", payload);
    return unwrapApiResponse(response);
  },

  demote: async (userId: string): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/appraisers/${userId}/demote`,
    );
    return unwrapApiResponse(response);
  },
};
