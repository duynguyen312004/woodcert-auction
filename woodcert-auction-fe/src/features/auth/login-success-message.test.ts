import { describe, expect, it } from "vitest";

import { getLoginSuccessDescription } from "./login-success-message";

function createToken(claims: Record<string, unknown>) {
  const payload = window
    .btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

describe("getLoginSuccessDescription", () => {
  it.each([
    ["ROLE_ADMIN", "Phiên quản trị đã sẵn sàng. Bạn sẽ được chuyển đến bảng điều khiển quản trị."],
    [
      "ROLE_APPRAISER",
      "Phiên kiểm định đã sẵn sàng. Bạn sẽ được chuyển đến hàng chờ sản phẩm cần duyệt.",
    ],
    [
      "ROLE_SELLER",
      "Phiên bán hàng đã sẵn sàng. Bạn có thể quản lý sản phẩm, phiên đấu giá và đơn hàng của gian hàng.",
    ],
    ["ROLE_BIDDER", "Phiên đấu giá đã sẵn sàng. Bạn có thể tham gia đấu giá và quản lý tài khoản."],
  ])("returns the matching description for response role %s", (role, expected) => {
    expect(getLoginSuccessDescription(null, [role])).toBe(expected);
  });

  it.each([
    [
      "ADMIN_ACCESS",
      "Phiên quản trị đã sẵn sàng. Bạn sẽ được chuyển đến bảng điều khiển quản trị.",
    ],
    [
      "APPROVE_PRODUCT",
      "Phiên kiểm định đã sẵn sàng. Bạn sẽ được chuyển đến hàng chờ sản phẩm cần duyệt.",
    ],
    [
      "CREATE_PRODUCT",
      "Phiên bán hàng đã sẵn sàng. Bạn có thể quản lý sản phẩm, phiên đấu giá và đơn hàng của gian hàng.",
    ],
    ["CREATE_BID", "Phiên đấu giá đã sẵn sàng. Bạn có thể tham gia đấu giá và quản lý tài khoản."],
  ])("recognizes permission %s when response roles are absent", (permission, expected) => {
    expect(getLoginSuccessDescription(createToken({ permissions: [permission] }))).toBe(expected);
  });

  it("recognizes roles carried only by the access token", () => {
    expect(getLoginSuccessDescription(createToken({ roles: ["ROLE_SELLER"] }))).toBe(
      "Phiên bán hàng đã sẵn sàng. Bạn có thể quản lý sản phẩm, phiên đấu giá và đơn hàng của gian hàng.",
    );
  });

  it.each([
    [
      ["ROLE_ADMIN", "ROLE_APPRAISER"],
      "Phiên kiểm định đã sẵn sàng. Bạn sẽ được chuyển đến hàng chờ sản phẩm cần duyệt.",
    ],
    [
      ["ROLE_BIDDER", "ROLE_SELLER", "ROLE_ADMIN"],
      "Phiên quản trị đã sẵn sàng. Bạn sẽ được chuyển đến bảng điều khiển quản trị.",
    ],
    [
      ["ROLE_BIDDER", "ROLE_SELLER"],
      "Phiên bán hàng đã sẵn sàng. Bạn có thể quản lý sản phẩm, phiên đấu giá và đơn hàng của gian hàng.",
    ],
  ])("uses portal priority for multiple roles", (roles, expected) => {
    expect(getLoginSuccessDescription(null, roles)).toBe(expected);
  });

  it.each([null, "invalid-token", createToken({ roles: ["ROLE_UNKNOWN"] })])(
    "returns a neutral fallback for an unrecognized session",
    (accessToken) => {
      expect(getLoginSuccessDescription(accessToken)).toBe(
        "Phiên làm việc đã sẵn sàng. Bạn có thể tiếp tục sử dụng WoodCert Auction.",
      );
    },
  );
});
