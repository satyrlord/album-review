import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    headless: true,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:3100",
    env: {
      PORT: "3100",
      SERVE_DETACH: "false",
    },
    reuseExistingServer: false,
    timeout: 30000,
  },
});