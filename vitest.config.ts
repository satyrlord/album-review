import { defineConfig } from "vitest/config";

export default defineConfig({
  // Stand-in for the Vite define; unit tests never call getBuildMeta with
  // real metadata, they only need the identifier to resolve.
  define: {
    __ALBUM_REVIEW_BUILD__: JSON.stringify({}),
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Independent gate for the shared core module; the browser page
      // modules keep their own Playwright + nyc gate. No merged streams.
      include: ["src/shared/**/*.ts"],
      reporter: ["text"],
      reportsDirectory: "coverage-unit",
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
