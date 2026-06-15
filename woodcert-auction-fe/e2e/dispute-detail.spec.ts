import { expect, test, type Page } from "@playwright/test";

const API_TIMESTAMP = "2026-06-15T03:00:00Z";
const imageUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23d6c2a1'/%3E%3Cpath d='M100 420L240 180l90 120 70-80 100 200z' fill='%237a5b35'/%3E%3C/svg%3E";

function apiResponse(data: unknown) {
  return JSON.stringify({
    statusCode: 200,
    message: "OK",
    data,
    timestamp: API_TIMESTAMP,
  });
}

function accessToken() {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "buyer-1",
      roles: ["ROLE_BIDDER"],
      permissions: [],
      exp: 2_000_000_000,
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

async function mockBuyerDispute(page: Page) {
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({ token: "csrf-e2e" }),
    }),
  );
  await page.route("**/api/v1/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({ accessToken: accessToken() }),
    }),
  );
  await page.route("**/api/v1/system/time", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({ serverTime: API_TIMESTAMP, epochMillis: 1_781_491_600_000 }),
    }),
  );
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({
        id: "buyer-1",
        email: "buyer@example.com",
        fullName: "Nguyễn Văn An",
        phoneNumber: "0911222333",
        avatarUrl: null,
        status: "ACTIVE",
        roles: ["BIDDER"],
        createdAt: API_TIMESTAMP,
        hasSellerProfile: false,
      }),
    }),
  );
  await page.route("**/api/v1/wallets/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({
        id: 1,
        userId: "buyer-1",
        availableBalance: 15_000_000,
        frozenBalance: 1_000_000,
      }),
    }),
  );
  await page.route("**/api/v1/orders/91", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({
        id: 91,
        sourceType: "AUCTION",
        sourceId: 501,
        productId: 801,
        buyerId: "buyer-1",
        sellerId: "seller-1",
        buyer: null,
        status: "DISPUTED",
        finalPrice: 18_400_000,
        depositAmount: 1_500_000,
        remainingAmount: 16_900_000,
        platformCommissionRate: null,
        platformCommissionAmount: null,
        sellerPayoutAmount: null,
        forfeitedDepositPlatformFeeAmount: null,
        forfeitedDepositSellerAmount: null,
        buyerRefundAmount: null,
        paymentDeadline: null,
        paidAt: API_TIMESTAMP,
        completedAt: null,
        canceledAt: null,
        refundedAt: null,
        cancelReason: null,
        product: {
          id: 801,
          title:
            "Tượng gỗ trắc thủ công với tên sản phẩm rất dài để kiểm tra khả năng xuống dòng trên màn hình nhỏ",
          imageUrl,
        },
        shippingAddress: null,
        fulfillment: null,
        createdAt: API_TIMESTAMP,
        updatedAt: API_TIMESTAMP,
      }),
    }),
  );
  await page.route("**/api/v1/orders/91/disputes/31", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: apiResponse({
        dispute: {
          id: 31,
          orderId: 91,
          fulfillmentId: 17,
          openedByUserId: "buyer-1",
          status: "UNDER_REVIEW",
          reason:
            "Sản phẩm bị nứt ở phần chân đế và màu sắc thực tế khác đáng kể so với hình ảnh công bố",
          description: "Nội dung mô tả dài được dùng để kiểm tra khả năng xuống dòng. ".repeat(8),
          openedAt: API_TIMESTAMP,
          resolvedAt: null,
          resolvedByAdminId: null,
          resolutionOutcome: null,
          resolutionNote: null,
          evidence: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            mediaId: 100 + index,
            url: imageUrl,
            originalFilename: `bang-chung-${index + 1}.jpg`,
            sortOrder: index,
          })),
        },
        messages: [
          {
            id: 41,
            authorRole: "SELLER",
            content: "Tôi gửi ảnh kiện hàng trước lúc bàn giao cho đơn vị vận chuyển.",
            createdAt: "2026-06-15T03:10:00Z",
            evidence: Array.from({ length: 10 }, (_, index) => ({
              id: 20 + index,
              mediaId: 200 + index,
              url: imageUrl,
              originalFilename: `kien-hang-${index + 1}.jpg`,
              sortOrder: index,
            })),
          },
          {
            id: 42,
            authorRole: "ADMIN",
            content:
              "Vui lòng hai bên bổ sung thông tin về thời điểm nhận hàng và tình trạng bao bì khi mở kiện.",
            createdAt: "2026-06-15T03:20:00Z",
            evidence: [],
          },
        ],
      }),
    }),
  );
}

test("dispute file stays readable without horizontal overflow on mobile and desktop", async ({
  page,
}) => {
  await mockBuyerDispute(page);

  for (const viewport of [
    { width: 390, height: 844, name: "mobile" },
    { width: 1440, height: 900, name: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/orders/91/disputes/31");

    await expect(page.getByText("Đang được xem xét").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tượng gỗ trắc thủ công/ })).toBeVisible();
    await expect(page.getByLabel("Thêm phản hồi")).toBeVisible();
    await expect(page.getByText("Quản trị viên", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mở bằng chứng/ })).toHaveCount(20);

    const hasOverflow = await page.getByTestId("dispute-detail-page").evaluate((element) => {
      const pageOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const detailOverflow = element.scrollWidth > element.clientWidth + 1;
      return pageOverflow || detailOverflow;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `test-results/dispute-detail-${viewport.name}.png`,
      fullPage: false,
    });
  }
});
