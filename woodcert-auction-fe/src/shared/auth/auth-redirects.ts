/**
 * Quy tắc điều hướng sau khi phiên đăng nhập đã được xác thực.
 */
import { tokenHasPermission, tokenHasRole } from "@/shared/auth/decode-token";
import { ADMIN_PATHS, APPRAISER_PATHS } from "@/shared/constants/routes";

import { hasAppraiserAuthority } from "./appraiser-authority";

function isAppraiserPath(path: string) {
  return path === "/appraiser" || path.startsWith("/appraiser/");
}

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

function hasAdminAuthority(accessToken: string | null) {
  return tokenHasRole(accessToken, "ROLE_ADMIN") || tokenHasPermission(accessToken, "ADMIN_ACCESS");
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

  const isAdmin = hasAdminAuthority(accessToken);

  if (from) {
    if (isAdminPath(from)) {
      return isAdmin ? from : "/";
    }
    if (!isAppraiserPath(from)) {
      return from;
    }
  }

  if (isAdmin) return ADMIN_PATHS.dashboard;
  return "/";
}
