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

test("1Forge account can use the complete control-center journey", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@1forge.com");
  await page.getByLabel("Password").fill("PlatformAdminPassword123");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/1forge\/platform$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Monthly recurring revenue", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending payments", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subscription & billing" })).toHaveCount(0);

  const clientCard = page.locator('a[href="/1forge/platform/city-complex"]');
  const search = page.getByRole("textbox", { name: "Search clients" });
  await expect(clientCard).toBeVisible();
  await search.fill("no matching client");
  await expect(clientCard).toHaveCount(0);
  await search.fill("City Complex");
  await expect(clientCard).toBeVisible();
  await page.getByRole("button", { name: "Trialing", exact: true }).click();
  await expect(clientCard).toBeVisible();

  await clientCard.click();
  await expect(page).toHaveURL(/\/1forge\/platform\/city-complex$/);
  await expect(page.getByRole("heading", { name: "City Complex" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suspend", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Client details" })).toBeVisible();

  await page.getByRole("button", { name: "Apps & Roles", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner App" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tenant App" })).toBeVisible();

  await page.getByRole("button", { name: "Features", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Feature access" })).toBeVisible();

  await page.getByRole("button", { name: "Theme & Branding", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Client theme" })).toBeVisible();
  await expect(page.getByText("Applies across all role apps", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Billing", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Subscription & billing" })).toBeVisible();

  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(page).toHaveURL(/\/1forge\/platform\/analytics$/);
  await expect(page.getByRole("heading", { name: "Financial analytics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Monthly recurring revenue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Client subscription ledger" })).toBeVisible();

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
});
