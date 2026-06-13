import { decodeAccessTokenClaims } from "@/shared/auth/decode-token";

const ROLE = {
  admin: "ROLE_ADMIN",
  appraiser: "ROLE_APPRAISER",
  bidder: "ROLE_BIDDER",
  seller: "ROLE_SELLER",
} as const;

const PERMISSION = {
  admin: ["ADMIN_ACCESS"],
  appraiser: ["APPROVE_PRODUCT"],
  bidder: ["CREATE_BID", "REGISTER_AUCTION"],
  seller: ["CREATE_PRODUCT"],
} as const;

const DESCRIPTION = {
  admin: "Phiên quản trị đã sẵn sàng. Bạn sẽ được chuyển đến bảng điều khiển quản trị.",
  appraiser: "Phiên kiểm định đã sẵn sàng. Bạn sẽ được chuyển đến hàng chờ sản phẩm cần duyệt.",
  bidder: "Phiên đấu giá đã sẵn sàng. Bạn có thể tham gia đấu giá và quản lý tài khoản.",
  seller:
    "Phiên bán hàng đã sẵn sàng. Bạn có thể quản lý sản phẩm, phiên đấu giá và đơn hàng của gian hàng.",
  fallback: "Phiên làm việc đã sẵn sàng. Bạn có thể tiếp tục sử dụng WoodCert Auction.",
} as const;

function toStringSet(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((item): item is string => typeof item === "string"));
}

function hasAny(values: Set<string>, candidates: readonly string[]) {
  return candidates.some((candidate) => values.has(candidate));
}

export function getLoginSuccessDescription(
  accessToken: string | null,
  responseRoles?: readonly string[],
) {
  const claims = decodeAccessTokenClaims(accessToken);
  const tokenRoles = toStringSet(claims?.roles);
  const roles = new Set([...(responseRoles ?? []), ...tokenRoles]);
  const permissions = toStringSet(claims?.permissions);

  if (roles.has(ROLE.appraiser) || hasAny(permissions, PERMISSION.appraiser)) {
    return DESCRIPTION.appraiser;
  }
  if (roles.has(ROLE.admin) || hasAny(permissions, PERMISSION.admin)) {
    return DESCRIPTION.admin;
  }
  if (roles.has(ROLE.seller) || hasAny(permissions, PERMISSION.seller)) {
    return DESCRIPTION.seller;
  }
  if (roles.has(ROLE.bidder) || hasAny(permissions, PERMISSION.bidder)) {
    return DESCRIPTION.bidder;
  }

  return DESCRIPTION.fallback;
}
