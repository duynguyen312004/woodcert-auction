/**
 * Test kiểm tra route khu seller.
 *
 * Test này đảm bảo hằng số điều hướng và route thật không bị lệch nhau.
 */
import type { RouteObject } from "react-router";
import { describe, expect, it } from "vitest";

import { routes } from "@/app/router/routes";

function collectPaths(routeObjects: RouteObject[], paths = new Set<string>()) {
  for (const route of routeObjects) {
    if (route.path) paths.add(route.path);
    if (route.children) collectPaths(route.children, paths);
  }

  return paths;
}

describe("seller routes", () => {
  it("declares every seller URL linked from the seller UI", () => {
    const paths = collectPaths(routes);

    expect([...paths]).toEqual(
      expect.arrayContaining([
        "seller/dashboard",
        "seller/profile",
        "seller/products",
        "seller/products/new",
        "seller/products/:productId",
        "seller/products/:productId/edit",
        "seller/orders",
        "seller/orders/:orderId",
        "seller/orders/:orderId/disputes/:disputeId",
        "seller/revenue",
        "seller/auctions",
        "seller/auctions/:auctionId",
        "seller/auctions/new",
        "seller/register",
      ]),
    );
    expect([...paths]).not.toContain("seller/appraisals");
  });

  it("declares post-auction, admin, certificate, and address routes", () => {
    const paths = collectPaths(routes);

    expect([...paths]).toEqual(
      expect.arrayContaining([
        "orders",
        "orders/:orderId/disputes/:disputeId",
        "account/addresses",
        "certificates",
        "certificates/:certificateCode",
        "admin",
        "admin/revenue",
        "admin/disputes",
        "admin/disputes/:id",
        "admin/categories",
        "admin/users",
        "admin/audit-logs",
      ]),
    );
    expect([...paths]).not.toContain("admin/appraisers");
  });

  it("declares a not-found route for every portal", () => {
    const paths = collectPaths(routes);

    expect([...paths]).toEqual(expect.arrayContaining(["*", "seller/*", "appraiser/*", "admin/*"]));
  });
});
