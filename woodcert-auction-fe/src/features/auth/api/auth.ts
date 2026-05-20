import { apiClient } from "@/shared/api/client";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import type { ApiResponse } from "@/shared/api/types";
import type { LoginCredentials, LoginResponse, RegisterCredentials } from "../types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", credentials, {
      skipAuthRefresh: true,
      withCredentials: true,
    });
    return unwrapApiResponse(response);
  },

  register: async (credentials: RegisterCredentials): Promise<void> => {
    const payload = {
      email: credentials.email,
      password: credentials.password,
      fullName: credentials.fullName,
      phoneNumber: credentials.phoneNumber,
    };
    const response = await apiClient.post<ApiResponse<unknown>>("/auth/register", payload, {
      skipAuthRefresh: true,
    });
    unwrapApiResponse(response);
  },

  verifyEmail: async (token: string): Promise<void> => {
    const query = new URLSearchParams({ token });
    const response = await apiClient.get<ApiResponse<void>>(
      `/auth/verify-email?${query.toString()}`,
      { skipAuthRefresh: true },
    );
    return unwrapApiResponse(response);
  },

  resendVerificationEmail: async (email: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/resend-verification",
      { email },
      { skipAuthRefresh: true },
    );
    return unwrapApiResponse(response);
  },

  logout: async (): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>("/auth/logout", undefined, {
      withCredentials: true,
    });
    return unwrapApiResponse(response);
  },

  forgotPassword: async (email: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/forgot-password",
      { email },
      { skipAuthRefresh: true },
    );
    return unwrapApiResponse(response);
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/reset-password",
      { token, newPassword },
      { skipAuthRefresh: true },
    );
    return unwrapApiResponse(response);
  },
};
