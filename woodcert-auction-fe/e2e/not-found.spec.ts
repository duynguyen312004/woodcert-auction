import { expect, test } from "@playwright/test";

test("renders the public not-found page inside the public layout", async ({ page }) => {
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

  await page.route("**/api/v1/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 200,
        message: "OK",
        data: { token: "csrf-e2e" },
        timestamp: "2026-06-13T00:00:00Z",
      }),
    });
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 401,
        message: "Unauthorized",
        data: null,
        timestamp: "2026-06-13T00:00:00Z",
      }),
    });
  });

  await page.goto("/duong-dan-khong-ton-tai");

  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "WoodCert" }).first()).toBeVisible();
  await expect(page.getByText(/© 2026 WoodCert Auction/i)).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
