import { expect, test } from "@playwright/test";

test("landing, plans, and demo entry form one complete public journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Run your PG like a real business." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try live demo" })).toHaveAttribute("href", "/login#demo-accounts");
  await expect(page.getByRole("navigation", { name: "Public navigation" }).getByRole("link", { name: "Plans" })).toHaveAttribute("href", "/plans");
  await expect(page.getByRole("heading", { name: "Custom pricing" })).toHaveCount(0);

  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: "A plan shaped around your property." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Custom pricing" })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Try every role" })).toHaveAttribute("href", "/login#demo-accounts");

  await page.goto("/login#demo-accounts");
  await expect(page.getByRole("heading", { name: "Try every Hostin role." })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeEnabled();

  const ownerAccount = page.getByRole("button", { name: "Use Owner demo account" });
  await expect(ownerAccount).toContainText("owner@city-complex.hostin.local");
  await expect(ownerAccount).toContainText("city-complex@123");
  await ownerAccount.click();
  await expect(page.getByLabel("Email address")).toHaveValue("owner@city-complex.hostin.local");
  await expect(page.getByLabel("Password")).toHaveValue("city-complex@123");
});

test("client-facing pages do not expose theme preferences", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Dashboard colour theme")).toHaveCount(0);
  await expect(page.getByLabel("Custom theme colour")).toHaveCount(0);
  await expect(page.getByText("Theme managed by 1Forge")).toBeVisible();

  await page.goto("/");
  const landingAccent = await page
    .locator(".marketingPage")
    .evaluate((element) => getComputedStyle(element).getPropertyValue("--accent").trim());
  expect(landingAccent).toBe("#0f766e");
});

test("public aliases resolve and unknown routes show the branded recovery page", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/plans$/);
  await expect(page.getByRole("heading", { name: "A plan shaped around your property." })).toBeVisible();

  await page.goto("/a-page-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "Oops. This room doesn't exist." })).toBeVisible();
  await expect(page.getByRole("link", { name: "View plans" })).toHaveAttribute("href", "/plans");

  await page.goto("/city-complex/not-a-real-role");
  await expect(page.getByRole("heading", { name: "Oops. This room doesn't exist." })).toBeVisible();
});
