import { expect, test, type Page } from "@playwright/test";

type PortalRole = "admin" | "appraiser" | "seller";

const profiles = {
  admin: {
    id: "admin-e2e",
    email: "admin@woodcert.local",
    fullName: "Admin E2E",
    phoneNumber: null,
    avatarUrl: null,
    status: "ACTIVE",
    roles: ["ADMIN"],
    createdAt: "2026-06-13T00:00:00Z",
    hasSellerProfile: false,
    capabilityStatuses: [],
  },
  appraiser: {
    id: "appraiser-e2e",
    email: "appraiser@woodcert.local",
    fullName: "Appraiser E2E",
    phoneNumber: null,
    avatarUrl: null,
    status: "ACTIVE",
    roles: ["APPRAISER"],
    createdAt: "2026-06-13T00:00:00Z",
    hasSellerProfile: false,
    capabilityStatuses: [
      {
        capability: "APPRAISER",
        status: "ACTIVE",
        reason: null,
        updatedAt: null,
      },
    ],
  },
  seller: {
    id: "seller-e2e",
    email: "seller@woodcert.local",
    fullName: "Seller E2E",
    phoneNumber: null,
    avatarUrl: null,
    status: "ACTIVE",
    roles: ["BIDDER", "SELLER"],
    createdAt: "2026-06-13T00:00:00Z",
    hasSellerProfile: true,
    capabilityStatuses: [
      {
        capability: "SELLER",
        status: "ACTIVE",
        reason: null,
        updatedAt: null,
      },
    ],
  },
} as const;

const claims = {
  admin: {
    sub: profiles.admin.id,
    roles: ["ROLE_ADMIN"],
    permissions: ["ADMIN_ACCESS"],
  },
  appraiser: {
    sub: profiles.appraiser.id,
    roles: ["ROLE_APPRAISER"],
    permissions: ["APPROVE_PRODUCT"],
  },
  seller: {
    sub: profiles.seller.id,
    roles: ["ROLE_BIDDER", "ROLE_SELLER"],
    permissions: ["CREATE_PRODUCT"],
  },
} as const;

function createAccessToken(role: PortalRole) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims[role])).toString("base64url");
  return `${header}.${payload}.e2e`;
}

function apiResponse(data: unknown) {
  return JSON.stringify({
    statusCode: 200,
    message: "OK",
    data,
    timestamp: "2026-06-13T00:00:00Z",
  });
}

async function mockPortalSession(page: Page, role: PortalRole) {
  await page.route("**/api/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith("/auth/csrf")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: apiResponse({ token: "csrf-e2e" }),
      });
      return;
    }

    if (pathname.endsWith("/auth/refresh")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: apiResponse({ accessToken: createAccessToken(role) }),
      });
      return;
    }

    if (pathname.endsWith("/users/me/seller-profile")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: apiResponse({
          userId: profiles.seller.id,
          storeName: "Xưởng gỗ E2E",
          identityCardNumber: "012345678901",
          taxCode: null,
          reputationScore: 100,
          createdAt: "2026-06-13T00:00:00Z",
          updatedAt: "2026-06-13T00:00:00Z",
        }),
      });
      return;
    }

    if (pathname.endsWith("/users/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: apiResponse(profiles[role]),
      });
      return;
    }

    if (pathname.endsWith("/wallets/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: apiResponse({
          id: 1,
          userId: profiles.seller.id,
          availableBalance: 0,
          frozenBalance: 0,
          appraisalFee: 500000,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 404,
        message: "Not found in E2E mock",
        data: null,
        timestamp: "2026-06-13T00:00:00Z",
      }),
    });
  });
}

test("keeps the admin sidebar on an unknown admin URL", async ({ page }) => {
  await mockPortalSession(page, "admin");
  await page.goto("/admin/duong-dan-khong-ton-tai");

  await expect(page.getByRole("heading", { name: "Admin Operations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về trang quản trị" })).toHaveAttribute(
    "href",
    "/admin",
  );
});

test("keeps the appraiser sidebar on an unknown appraiser URL", async ({ page }) => {
  await mockPortalSession(page, "appraiser");
  await page.goto("/appraiser/duong-dan-khong-ton-tai");

  await expect(page.getByText("Appraiser Portal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về hàng chờ kiểm định" })).toHaveAttribute(
    "href",
    "/appraiser/products",
  );
});

test("keeps the seller sidebar on an unknown seller URL", async ({ page }) => {
  await mockPortalSession(page, "seller");
  await page.goto("/seller/duong-dan-khong-ton-tai");

  await expect(page.getByText("Seller Portal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về bảng điều khiển" })).toHaveAttribute(
    "href",
    "/seller/dashboard",
  );
});
