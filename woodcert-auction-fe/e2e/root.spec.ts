import { expect, test } from "@playwright/test";

test("loads the root page", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WoodCert Auction" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Foundation Ready" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
