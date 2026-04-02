#!/usr/bin/env tsx
/**
 * scripts/build.ts — full project quality gate.
 *
 * Steps:
 *   1. TypeScript typecheck (tsc --noEmit)
 *   2. Markdownlint across all .md files
 *   3. Data consistency — every data/*.json file is self-consistent,
 *      and data/index.json is regenerated from those files
 *
 * Run: npm run build
 */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { expectedAlbumId, readAlbumDataDir, writeAlbumIndexFile } from "../album-index.js";

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

// ── 3. Data consistency ───────────────────────────────────────────
step("Data folder consistency", () => {
  const dataDir = join(ROOT, "data");
  const records = readAlbumDataDir(dataDir);
  const seenIds = new Set<string>();
  const issues: string[] = [];

  for (const record of records) {
    const expectedId = expectedAlbumId(record.fileName);
    const album = record.album;

    if (album.id !== expectedId) {
      issues.push(`${record.fileName}: id must be \"${expectedId}\", got \"${album.id}\"`);
    }

    if (seenIds.has(album.id)) {
      issues.push(`${record.fileName}: duplicate album id \"${album.id}\"`);
    }
    seenIds.add(album.id);

    if (!String(album.artist || "").trim()) issues.push(`${record.fileName}: artist is required`);
    if (!String(album.title || "").trim()) issues.push(`${record.fileName}: title is required`);
    if (!Array.isArray(album.tracks) || album.tracks.length === 0) {
      issues.push(`${record.fileName}: tracks must be a non-empty array`);
    }
  }

  if (issues.length) throw new Error(issues.join("\n      "));

  writeAlbumIndexFile(dataDir);
});

// ── Result ────────────────────────────────────────────────────────
console.log(`\n────────────────────────────────────────────────────────────`);
console.log(failed ? "Build FAILED.\n" : "Build OK.\n");
process.exit(failed ? 1 : 0);
