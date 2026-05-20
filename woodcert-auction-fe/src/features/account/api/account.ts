import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import type {
  AvatarUploadIntentPayload,
  AvatarUploadIntent,
  SellerProfile,
  UpdateProfilePayload,
  UserProfile,
} from "../types";

export const accountApi = {
  /**
   * GET /users/me — Lấy thông tin profile hiện tại.
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>("/users/me");
    return unwrapApiResponse(response);
  },

  /**
   * PUT /users/me — Cập nhật thông tin cơ bản (fullName, phoneNumber).
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await apiClient.put<ApiResponse<UserProfile>>("/users/me", payload);
    return unwrapApiResponse(response);
  },

  /**
   * GET /users/me/seller-profile — Lấy hồ sơ người bán.
   */
  getSellerProfile: async (): Promise<SellerProfile> => {
    const response = await apiClient.get<ApiResponse<SellerProfile>>("/users/me/seller-profile");
    return unwrapApiResponse(response);
  },

  /**
   * POST /users/me/avatar/upload-intent — Yêu cầu URL upload avatar lên Cloudinary.
   */
  requestAvatarUploadIntent: async (
    payload: AvatarUploadIntentPayload,
  ): Promise<AvatarUploadIntent> => {
    const response = await apiClient.post<ApiResponse<AvatarUploadIntent>>(
      "/users/me/avatar/upload-intent",
      payload,
    );
    return unwrapApiResponse(response);
  },

  /**
   * PUT /users/me/avatar — Xác nhận avatar đã upload.
   */
  confirmAvatarUpload: async (mediaId: number, assetId: string): Promise<UserProfile> => {
    const response = await apiClient.put<ApiResponse<UserProfile>>("/users/me/avatar", {
      mediaId,
      assetId,
    });
    return unwrapApiResponse(response);
  },

  deleteAvatar: async (): Promise<UserProfile> => {
    const response = await apiClient.delete<ApiResponse<UserProfile>>("/users/me/avatar");
    return unwrapApiResponse(response);
  },
};
