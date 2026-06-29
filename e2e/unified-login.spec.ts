import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  const emailField = page.getByLabel("Email address");
  const passwordField = page.getByLabel("Password");
  await expect(emailField).toBeEnabled();
  await emailField.fill(email);
  await passwordField.fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
}

async function openClientControlSection(page: Page, label: string, value: string) {
  const mobileSelector = page.getByLabel("Client control section", { exact: true });
  if (await mobileSelector.isVisible()) {
    await mobileSelector.selectOption(value);
    return;
  }
  await page.getByRole("button", { name: label, exact: true }).click();
}

async function expectOnboardingStepList(page: Page) {
  const fullStepLabels = [
    /PG Structure/,
    /Rooms & Beds/,
    /People Import/,
    /Role Assignment/,
    /Account Generation/,
    /Feature Access/,
    /Branding & Billing/,
    /Review & Activate/,
  ];
  const fullLabelsVisible = await page.getByRole("button", { name: fullStepLabels[0] }).isVisible().catch(() => false);
  if (fullLabelsVisible) {
    for (const label of fullStepLabels) await expect(page.getByRole("button", { name: label })).toBeVisible();
    return;
  }
  await expect(page.locator(".wizardSteps button")).toHaveCount(9);
}

test("tenant account routes directly to its private profile", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeEnabled();
  await page.getByRole("button", { name: "Use Tenant demo account" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue("tenant@city-complex.hostin.local");
  await expect(page.getByLabel("Password")).toHaveValue("city-complex@123");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/city-complex\/tenant\/aarav-mehta$/);
  await expect(page.getByRole("button", { name: "Gate Passes" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Rooms" })).toHaveCount(0);
});

test("1Forge account can use the complete control-center journey", async ({ page }) => {
  await signIn(page, "admin@1forge.com", "PlatformAdminPassword123");
  await expect(page).toHaveURL(/\/1forge\/platform$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Monthly recurring revenue", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending payments", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subscription & billing" })).toHaveCount(0);

  await page.getByRole("link", { name: "+ Add client", exact: true }).click();
  await expect(page).toHaveURL(/\/1forge\/platform\/new$/);
  await expect(page.getByRole("heading", { name: "Client Details" })).toBeVisible();
  await expect(page.getByText("Step 1 of 9", { exact: false })).toBeVisible();
  await expect(page.getByLabel("PG / Hostel name")).toBeVisible();
  await expectOnboardingStepList(page);
  await page.getByRole("link", { name: "Back to clients", exact: false }).click();
  await expect(page).toHaveURL(/\/1forge\/platform$/);

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

  await openClientControlSection(page, "Setup", "setup");
  await expect(page.getByRole("heading", { name: "Setup checklist" })).toBeVisible();

  await openClientControlSection(page, "People", "people");
  await expect(page.getByRole("heading", { name: "People directory" })).toBeVisible();

  await openClientControlSection(page, "Accounts", "accounts");
  await expect(page.getByRole("heading", { name: "Accounts & credentials" })).toBeVisible();

  await openClientControlSection(page, "Rooms", "rooms");
  await expect(page.getByRole("heading", { name: "Property structure" })).toBeVisible();

  await openClientControlSection(page, "Apps & Roles", "apps & roles");
  await expect(page.getByRole("heading", { name: "Owner App" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tenant App" })).toBeVisible();

  await openClientControlSection(page, "Features", "features");
  await expect(page.getByRole("heading", { name: "Feature access" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Role feature permissions" })).toBeVisible();

  await openClientControlSection(page, "Access Overrides", "access overrides");
  await expect(page.getByRole("heading", { name: "Add access override" })).toBeVisible();

  await openClientControlSection(page, "Theme & Branding", "theme & branding");
  await expect(page.getByRole("heading", { name: "Client theme" })).toBeVisible();
  await expect(page.getByText("Applies across all role apps", { exact: true })).toBeVisible();

  await openClientControlSection(page, "Billing", "billing");
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
