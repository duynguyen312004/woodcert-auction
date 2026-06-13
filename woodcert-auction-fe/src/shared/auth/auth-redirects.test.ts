import { describe, expect, it } from "vitest";

import { resolveAuthenticatedRedirect } from "@/shared/auth/auth-redirects";

function createToken(claims: Record<string, unknown>) {
  const payload = window
    .btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

describe("resolveAuthenticatedRedirect", () => {
  it("does not send non-appraisers back to appraiser routes from login state", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: null,
        from: "/appraiser/products",
        roles: ["ROLE_BIDDER"],
      }),
    ).toBe("/");
  });

  it("keeps normal return paths for non-appraisers", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: null,
        from: "/auctions",
        roles: ["ROLE_BIDDER"],
      }),
    ).toBe("/auctions");
  });

  it("sends appraisers to their portal when the return path is public", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: null,
        from: "/auctions",
        roles: ["ROLE_APPRAISER"],
      }),
    ).toBe("/appraiser/products");
  });

  it("keeps appraiser return paths for appraisers", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: null,
        from: "/appraiser/products/12",
        roles: ["ROLE_APPRAISER"],
      }),
    ).toBe("/appraiser/products/12");
  });

  it("sends ADMIN_ACCESS users to the admin dashboard when there is no return path", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: createToken({ permissions: ["ADMIN_ACCESS"] }),
      }),
    ).toBe("/admin");
  });

  it("keeps admin return paths for users with ROLE_ADMIN", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: createToken({ roles: ["ROLE_ADMIN"] }),
        from: "/admin/revenue",
      }),
    ).toBe("/admin/revenue");
  });

  it("does not send non-admin users back to admin routes", () => {
    expect(
      resolveAuthenticatedRedirect({
        accessToken: createToken({ roles: ["ROLE_BIDDER"], permissions: ["REGISTER_AUCTION"] }),
        from: "/admin/revenue",
        roles: ["ROLE_BIDDER"],
      }),
    ).toBe("/");
  });
});
