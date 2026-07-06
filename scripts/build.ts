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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = false;

function step(label: string, fn: () => void): void {
  process.stdout.write(`  ${label.padEnd(30, ".")} `);
  try {
    fn();
    console.log("ok");
  } catch (e: unknown) {
    console.log("FAILED");
    const failureText = (
      e instanceof Error ? e.message :
      (e && typeof e === "object" && "stderr" in e)
        ? (e as { stderr: Buffer }).stderr.toString()
        : String(e)
    );
    failureText.split("\n").filter(Boolean).slice(0, 20).forEach(line => console.error(`      ${line}`));
    failed = true;
  }
}

console.log("\n── album-review build ──────────────────────────────────────\n");

step("Data folder consistency", () => {
  // Per-record validation lives in src/shared/validate.ts; cross-file
  // checks live in scripts/albums/album-index.ts. Both run inside
  // writeAlbumIndexFile — this step is a plain caller.
  writeAlbumIndexFile(join(ROOT, "data"));
});

step("Vite build", () => {
  execSync("npx vite build", { cwd: ROOT, stdio: "pipe" });
});

step("TypeScript typecheck", () => {
  execSync("npx tsc -p tsconfig.json", { cwd: ROOT, stdio: "pipe" });
  execSync("npx tsc -p tsconfig.browser.json", { cwd: ROOT, stdio: "pipe" });
});

step("Markdownlint", () => {
  try {
    execSync('npx markdownlint-cli2 "**/*.md" "#node_modules" "#.github/skills/**" "#.claude/**" "#coverage/**" "#.nyc_output/**" "#tmp/**" "#playwright-report/**" "#test-results/**" "#.playwright-mcp/**"', {
      cwd: ROOT,
      stdio: "pipe",
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "stdout" in e) {
      throw new Error((e as { stdout: Buffer }).stdout.toString());
    }
    throw e;
  }
});

step("Unit tests (Vitest)", () => {
  execSync("npx vitest run --coverage", { cwd: ROOT, stdio: "pipe" });
});

step("Test coverage", () => {
  execSync("npx tsx scripts/test-coverage.ts", { cwd: ROOT, stdio: "pipe" });
});

console.log("\n────────────────────────────────────────────────────────────");
console.log(failed ? "Build FAILED.\n" : "Build OK.\n");
process.exit(failed ? 1 : 0);
