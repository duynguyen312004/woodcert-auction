/**
 * Quy tắc điều hướng sau khi phiên đăng nhập đã được xác thực.
 */
import { tokenHasRole } from "@/shared/auth/decode-token";
import { ADMIN_PATHS, APPRAISER_PATHS } from "@/shared/constants/routes";

import { hasAppraiserAuthority } from "./appraiser-authority";

function isAppraiserPath(path: string) {
  return path === "/appraiser" || path.startsWith("/appraiser/");
}

export function resolveAuthenticatedRedirect({
  accessToken,
  from,
  roles,
}: {
  accessToken: string | null;
  from?: string;
  roles?: readonly string[];
}) {
  if (hasAppraiserAuthority(accessToken, roles)) {
    return from && isAppraiserPath(from) ? from : APPRAISER_PATHS.products;
  }

  if (from && !isAppraiserPath(from)) return from;
  if (tokenHasRole(accessToken, "ROLE_ADMIN")) return ADMIN_PATHS.dashboard;
  return "/";
}
