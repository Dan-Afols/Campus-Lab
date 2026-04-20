import { expect, test } from "@playwright/test";

const PWA_URL = process.env.PWA_URL || "http://localhost:5174";

test.describe("Campus Lab PWA smoke flow", () => {
  test("public routes load and unauthenticated users are redirected", async ({ page }) => {
    await page.goto(`${PWA_URL}/login`);
    await expect(page).toHaveURL(/\/login$/);

    await page.goto(`${PWA_URL}/news`);
    await expect(page).toHaveURL(/\/login$/);

    await page.goto(`${PWA_URL}/`);
    await expect(page.locator("body")).toBeVisible();
  });
});