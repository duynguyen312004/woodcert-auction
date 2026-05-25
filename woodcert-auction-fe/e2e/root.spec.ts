import { expect, test } from "@playwright/test";

test("loads the root page", async ({ page }) => {
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

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WoodCert Auction" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Khám phá đấu giá/i })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
