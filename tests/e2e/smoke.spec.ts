import { test, expect } from "@playwright/test";

test("landing loads and is RTL", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: /بیمه.*دامپزشکی/ })).toBeVisible();
  await expect(page.getByText("نسخهٔ دمو")).toBeVisible();
});

test("login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /ورود/ })).toBeVisible();
});

test("plans page shows illustrative badge", async ({ page }) => {
  await page.goto("/plans");
  await expect(page.getByText("نمونهٔ آموزشی")).toBeVisible();
});

test("clinics search", async ({ page }) => {
  await page.goto("/clinics");
  await expect(page.getByRole("heading", { name: /کلینیک/ })).toBeVisible();
  const input = page.locator('input[name="q"]');
  await expect(input).toBeVisible();
});

test.describe("vertical slice (requires seeded DB)", () => {
  test.skip("clinic creates request -> reviewer approves -> owner sees shares", async ({ page }) => {
    // full flow would use API via page.request
  });
});
