import { expect, test } from "@playwright/test";

test("public auction detail links anonymous buyers into protected bidding room", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    const isExpectedApiNoise =
      text.includes("Access to XMLHttpRequest") || text.includes("Failed to load resource");

    if (message.type() === "error" && !isExpectedApiNoise) {
      runtimeErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 401,
        message: "Unauthorized",
        data: null,
        timestamp: "2026-06-01T00:00:00Z",
      }),
    });
  });

  await page.route("**/api/v1/auctions/501", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 200,
        message: "OK",
        timestamp: "2026-06-01T00:00:00Z",
        data: {
          id: 501,
          status: "ACTIVE",
          startingPrice: "10000000",
          currentPrice: "12000000",
          stepPrice: "500000",
          depositAmount: "1000000",
          startTime: "2026-06-01T01:00:00Z",
          endTime: "2026-06-01T02:00:00Z",
          product: {
            id: 101,
            title: "Tượng gỗ trắc",
            material: "Gỗ trắc",
            description: "Tác phẩm đã được thẩm định.",
            dimensions: "40 x 30 x 80 cm",
            weight: "12.5",
            primaryImage: "https://picsum.photos/seed/woodcert-detail/1200/900",
            images: ["https://picsum.photos/seed/woodcert-detail/1200/900"],
            appraisal: {
              certificateCode: "CERT-501",
              verifiedMaterial: "Gỗ trắc",
              origin: "Việt Nam",
              ageEstimation: "20 năm",
              conditionGrade: "GOOD",
              estimatedValue: "15000000",
              isAuthentic: true,
            },
          },
          seller: {
            storeName: "WoodCert Studio",
            reputationScore: "4.8",
          },
          highestBidderMaskedAlias: "abcd****",
        },
      }),
    });
  });

  await page.goto("/auctions/501");

  await expect(page.getByRole("heading", { name: "Tượng gỗ trắc" })).toBeVisible();
  await expect(page.getByText("12.000.000 VNĐ")).toBeVisible();

  await page.getByRole("link", { name: /Đăng nhập để tham gia/i }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole("heading", { name: "Chào mừng trở lại" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
