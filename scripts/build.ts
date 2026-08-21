#!/usr/bin/env tsx
/**
 * scripts/build.ts — full project quality gate.
 *
 * Steps:
 *   1. Validate data/*.json and regenerate data/index.json
 *   2. Build the multi-page app with Vite
 *   3. Type-check Node and browser TypeScript projects
 *   4. Markdownlint across all .md files
 *   5. Enforce browser test coverage thresholds
 *
 * Run: npm run build
 */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { writeAlbumIndexFile } from "./albums/album-index.js";
import { runQualityGateSteps } from "./quality-gate-steps.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n── album-review build ──────────────────────────────────────\n");

const result = runQualityGateSteps([
  {
    label: "Data folder consistency",
    run: () => {
      // Per-record validation lives in src/shared/validate.ts; cross-file
      // checks live in scripts/albums/album-index.ts. Both run inside
      // writeAlbumIndexFile — this step is a plain caller.
      writeAlbumIndexFile(join(ROOT, "data"));
    },
  },
  {
    label: "Vite build",
    run: () => {
      execSync("npx vite build", { cwd: ROOT, stdio: "pipe" });
    },
  },
  {
    label: "TypeScript typecheck",
    run: () => {
      execSync("npx tsc -p tsconfig.json", { cwd: ROOT, stdio: "pipe" });
      execSync("npx tsc -p tsconfig.browser.json", { cwd: ROOT, stdio: "pipe" });
    },
  },
  {
    label: "Markdownlint",
    run: () => {
      execSync('npx markdownlint-cli2 "**/*.md" "#node_modules" "#.github/skills/**" "#.claude/**" "#coverage/**" "#.nyc_output/**" "#tmp/**" "#playwright-report/**" "#test-results/**" "#.playwright-mcp/**"', {
        cwd: ROOT,
        stdio: "pipe",
      });
    },
  },
  {
    label: "Unit tests (Vitest)",
    run: () => {
      execSync("npx vitest run --coverage", { cwd: ROOT, stdio: "pipe" });
    },
  },
  {
    label: "Test coverage",
    run: () => {
      execSync("npx tsx scripts/test-coverage.ts", { cwd: ROOT, stdio: "pipe" });
    },
  },
]);

console.log("\n────────────────────────────────────────────────────────────");
console.log(result.status === "failed" ? `Build FAILED at ${result.failedStep}.\n` : "Build OK.\n");
process.exitCode = result.status === "failed" ? 1 : 0;
