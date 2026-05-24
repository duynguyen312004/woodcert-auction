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
        "seller/products/:productId/edit",
        "seller/auctions",
        "seller/auctions/new",
        "seller/appraisals",
        "seller/register",
      ]),
    );
  });
});
