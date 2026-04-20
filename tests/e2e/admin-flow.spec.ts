import { expect, test } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5173";

test.describe("Campus Lab admin smoke flow", () => {
  test("dashboard route redirects to login when unauthenticated", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login$/);

    await page.goto(`${ADMIN_URL}/login`);
    await expect(page.locator("body")).toBeVisible();
  });
});