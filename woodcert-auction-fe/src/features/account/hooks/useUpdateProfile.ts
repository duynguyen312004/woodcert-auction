import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isApiError } from "@/shared/api/errors";
import { useNotification } from "@/shared/ui/notification";
import { accountApi } from "../api/account";
import { PROFILE_QUERY_KEY } from "./useProfile";
import type { UpdateProfilePayload } from "../types";

/**
 * useUpdateProfile — Cập nhật thông tin cơ bản của người dùng (PUT /users/me).
 * Sau khi thành công, tự động invalidate cache profile.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const notification = useNotification();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => accountApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      notification.success("Cập nhật thành công", {
        description: "Thông tin hồ sơ của bạn đã được lưu.",
      });
    },
    onError: (error: unknown) => {
      const message = isApiError(error) ? error.message : "Cập nhật thất bại. Vui lòng thử lại.";
      notification.error("Cập nhật thất bại", { description: message });
    },
  });
}
