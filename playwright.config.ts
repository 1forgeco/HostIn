import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "NODE_ENV=development CLIENT_ORIGIN=http://127.0.0.1:3000 npm --prefix server run dev", url: "http://127.0.0.1:5001/health", reuseExistingServer: !process.env.CI, timeout: 120000 },
    { command: "npm --prefix client run dev -- -H 0.0.0.0", url: "http://127.0.0.1:3000/login", reuseExistingServer: !process.env.CI, timeout: 120000 },
  ],
});
