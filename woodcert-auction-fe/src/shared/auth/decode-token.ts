/**
 * Tiện ích decode JWT access token phía client.
 *
 * Chỉ dùng cho mục đích điều hướng UI — không thay thế xác thực bảo mật ở backend.
 * Token được decode từ base64url, không được verify signature.
 */

export type TokenClaims = {
  sub?: string;
  roles?: unknown;
  permissions?: unknown;
};

export function decodeAccessTokenClaims(accessToken: string | null): TokenClaims | null {
  if (!accessToken) return null;

  const [, payload] = accessToken.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as TokenClaims;
  } catch {
    return null;
  }
}

export function tokenHasRole(accessToken: string | null, role: string): boolean {
  const claims = decodeAccessTokenClaims(accessToken);
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  return roles.includes(role);
}

export function tokenHasPermission(accessToken: string | null, permission: string): boolean {
  const claims = decodeAccessTokenClaims(accessToken);
  const permissions = Array.isArray(claims?.permissions) ? claims.permissions : [];
  return permissions.includes(permission);
}

export function decodeCurrentUserId(accessToken: string | null): string | null {
  return decodeAccessTokenClaims(accessToken)?.sub ?? null;
}
