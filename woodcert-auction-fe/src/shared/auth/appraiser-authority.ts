/**
 * Nhận diện quyền appraiser từ JWT hoặc dữ liệu role trả về sau đăng nhập.
 */
import { tokenHasPermission, tokenHasRole } from "@/shared/auth/decode-token";

export const APPRAISER_ROLE = "ROLE_APPRAISER";
export const APPRAISER_PERMISSION = "APPROVE_PRODUCT";

export function hasAppraiserAuthority(
  accessToken: string | null,
  roles?: readonly string[],
): boolean {
  return (
    (roles?.includes(APPRAISER_ROLE) ?? false) ||
    tokenHasRole(accessToken, APPRAISER_ROLE) ||
    tokenHasPermission(accessToken, APPRAISER_PERMISSION)
  );
}
