
import { defineConfig } from "@playwright/test";

const PORT = 3100;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const coverageEnabled = process.env.VITE_COVERAGE === "true";
const retries = 1;
const workers = 10;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries,
  reporter: [["list"], ["html", { open: "never" }]],
  workers,
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    headless: true,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `npx vite --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    env: {
      ...process.env,
      VITE_COVERAGE: coverageEnabled ? "true" : "false",
    },
    reuseExistingServer: false,
    timeout: 30000,
  },
});