import { defineConfig, devices } from "@playwright/test";

const productionRun = process.env.E2E_PRODUCTION === "1";
const isolatedLocalRun = !process.env.CI && !productionRun;
const clientPort = isolatedLocalRun ? 3100 : 3000;
const serverPort = isolatedLocalRun ? 5101 : 5001;
const clientOrigin = `http://localhost:${clientPort}`;
const apiOrigin = `http://localhost:${serverPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  workers: productionRun ? undefined : 1,
  use: { baseURL: clientOrigin, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: productionRun
        ? `NODE_ENV=production PORT=${serverPort} CLIENT_ORIGIN=${clientOrigin} npm --prefix server run start`
        : `NODE_ENV=development PORT=${serverPort} CLIENT_ORIGIN=${clientOrigin} npm --prefix server run dev`,
      url: `${apiOrigin}/ready`,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: productionRun
        ? `NODE_ENV=production npm --prefix client run start -- -H 0.0.0.0 -p ${clientPort}`
        : `NEXT_PUBLIC_API_URL=${apiOrigin}/api npm --prefix client run dev -- --webpack -H 0.0.0.0 -p ${clientPort}`,
      url: `${clientOrigin}/login`,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
