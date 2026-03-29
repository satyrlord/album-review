#!/usr/bin/env tsx
/**
 * scripts/build.ts — full project quality gate.
 *
 * Steps:
 *   1. TypeScript typecheck (tsc --noEmit)
 *   2. Markdownlint across all .md files
 *   3. Album consistency — every file in albums.js exists on disk,
 *      and every *-structural-analysis.html on disk is declared in albums.js
 *
 * Run: npm run build
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = false;

function step(label: string, fn: () => void): void {
  process.stdout.write(`  ${label.padEnd(30, ".")} `);
  try {
    fn();
    console.log("ok");
  } catch (e: unknown) {
    console.log("FAILED");
    const raw = (
      e instanceof Error ? e.message :
      (e && typeof e === "object" && "stderr" in e)
        ? (e as { stderr: Buffer }).stderr.toString()
        : String(e)
    );
    raw.split("\n").filter(Boolean).slice(0, 20).forEach(l => console.error(`      ${l}`));
    failed = true;
  }
}

console.log("\n── album-review build ──────────────────────────────────────\n");

// ── 0. Browser script ─────────────────────────────────────────────
step("Compile index.ts → index.js", () => {
  execSync("npx tsc -p tsconfig.browser.json", { cwd: ROOT, stdio: "pipe" });
});

// ── 1. TypeScript ──────────────────────────────────────────────────
step("TypeScript typecheck", () => {
  execSync("npx tsc", { cwd: ROOT, stdio: "pipe" });
});

// ── 2. Markdownlint ───────────────────────────────────────────────
step("Markdownlint", () => {
  try {
    execSync(`npx markdownlint-cli2 "**/*.md" "#node_modules"`, {
      cwd: ROOT,
      stdio: "pipe",
    });
  } catch (e: unknown) {
    // markdownlint exits 1 and writes errors to stdout
    if (e && typeof e === "object" && "stdout" in e) {
      throw new Error((e as { stdout: Buffer }).stdout.toString());
    }
    throw e;
  }
});

// ── 3. Album consistency ──────────────────────────────────────────
step("Albums consistency", () => {
  const albumsJs = readFileSync(join(ROOT, "albums.js"), "utf-8");

  const declared = [...albumsJs.matchAll(/file:\s*'([^']+\.html)'/g)].map(m => m[1]);
  const onDisk   = readdirSync(ROOT).filter(f => f.endsWith("-structural-analysis.html"));

  const missingOnDisk = declared.filter(f => !existsSync(join(ROOT, f)));
  const undeclared    = onDisk.filter(f => !declared.includes(f));

  const issues: string[] = [];
  if (missingOnDisk.length)
    issues.push(`Declared in albums.js but file missing:\n      ${missingOnDisk.join("\n      ")}`);
  if (undeclared.length)
    issues.push(`HTML files not listed in albums.js:\n      ${undeclared.join("\n      ")}`);

  if (issues.length) throw new Error(issues.join("\n  "));
});

// ── Result ────────────────────────────────────────────────────────
console.log(`\n────────────────────────────────────────────────────────────`);
console.log(failed ? "Build FAILED.\n" : "Build OK.\n");
process.exit(failed ? 1 : 0);
