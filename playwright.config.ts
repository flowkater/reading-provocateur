import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview",
    port: 4173,
    reuseExistingServer: true,
    timeout: 10_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
