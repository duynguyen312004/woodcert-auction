import { describe, expect, it } from "vitest";

import { resolveAuthenticatedRedirect } from "@/shared/auth/auth-redirects";

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
});
