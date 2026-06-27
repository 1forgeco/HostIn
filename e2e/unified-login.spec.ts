import { expect, test } from "@playwright/test";

test("tenant account routes directly to its private profile", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("tenant@city-complex.hostin.local");
  await page.getByLabel("Password").fill("city-complex@123");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/city-complex\/tenant\/aarav-mehta$/);
  await expect(page.getByRole("button", { name: "Gate Passes" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Rooms" })).toHaveCount(0);
});

test("1Forge account routes to platform controls", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@1forge.com");
  await page.getByLabel("Password").fill("PlatformAdminPassword123");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/1forge\/platform$/);
  await expect(page.getByRole("heading", { name: "Subscription & billing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suspend workspace" })).toBeVisible();
});
