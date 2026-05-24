import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isApiError, normalizeApiError } from "@/shared/api/errors";
import { uploadToCloudinary } from "@/shared/lib/cloudinaryUpload";
import { useNotification } from "@/shared/ui/notification";
import { accountApi } from "../api/account";
import type { AvatarUploadIntentPayload } from "../types";
import { PROFILE_QUERY_KEY } from "./useProfile";

export const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateAvatarFile(file: File) {
  if (!ALLOWED_AVATAR_CONTENT_TYPES.has(file.type)) {
    throw new Error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    throw new Error("Ảnh đại diện không được vượt quá 5MB.");
  }
}

export function createAvatarUploadIntentPayload(file: File): AvatarUploadIntentPayload {
  return {
    originalFileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  };
}

function getErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return error.message;
  }

  return normalizeApiError(error).message;
}

export function useAvatarUpload() {
  const queryClient = useQueryClient();
  const notification = useNotification();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      validateAvatarFile(file);

      const intent = await accountApi.requestAvatarUploadIntent(
        createAvatarUploadIntentPayload(file),
      );
      const assetId = await uploadToCloudinary(intent, file);

      return accountApi.confirmAvatarUpload(intent.mediaId, assetId);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      notification.success("Đã cập nhật ảnh đại diện", {
        description: "Ảnh đại diện mới đã được đồng bộ với hồ sơ của bạn.",
      });
    },
    onError: (error: unknown) => {
      notification.error("Không thể cập nhật ảnh đại diện", {
        description: getErrorMessage(error),
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: accountApi.deleteAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      notification.success("Đã gỡ ảnh đại diện", {
        description: "Hồ sơ của bạn đang hiển thị ảnh mặc định.",
      });
    },
    onError: (error: unknown) => {
      notification.error("Không thể gỡ ảnh đại diện", {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    uploadAvatar: uploadMutation.mutateAsync,
    removeAvatar: removeMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
    isPending: uploadMutation.isPending || removeMutation.isPending,
  };
}
