#!/usr/bin/env tsx

import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NYC_OUTPUT_DIR = join(ROOT, ".nyc_output");
const COVERAGE_DIR = join(ROOT, "coverage");
const COVERAGE_SUMMARY_FILE = join(COVERAGE_DIR, "coverage-summary.json");
const MIN_COVERAGE_PCT = 80;

interface CoverageMetricSummary {
  pct: number;
}

interface CoverageSummaryEntry {
  statements: CoverageMetricSummary;
  branches: CoverageMetricSummary;
  functions: CoverageMetricSummary;
  lines: CoverageMetricSummary;
}

type CoverageSummary = Record<string, CoverageSummaryEntry>;

function cleanCoverageDirs(): void {
  rmSync(NYC_OUTPUT_DIR, { recursive: true, force: true });
  rmSync(COVERAGE_DIR, { recursive: true, force: true });
}

function ensureCoverageFiles(): void {
  if (!existsSync(NYC_OUTPUT_DIR)) {
    throw new Error("Coverage collection did not create .nyc_output.");
  }

  const files = readdirSync(NYC_OUTPUT_DIR).filter(fileName => fileName.endsWith(".json"));
  if (files.length === 0) {
    throw new Error("Coverage collection finished without writing any Istanbul JSON files.");
  }
}

function ensureCoverageThresholds(): void {
  if (!existsSync(COVERAGE_SUMMARY_FILE)) {
    throw new Error("Coverage reporting did not create coverage/coverage-summary.json.");
  }

  const summary = JSON.parse(readFileSync(COVERAGE_SUMMARY_FILE, "utf-8")) as CoverageSummary;
  const failures: string[] = [];
  const metricKeys: Array<keyof CoverageSummaryEntry> = ["statements", "branches", "functions", "lines"];

  Object.entries(summary).forEach(([name, metrics]) => {
    metricKeys.forEach(metricName => {
      const pct = metrics[metricName]?.pct;
      if (typeof pct === "number" && pct < MIN_COVERAGE_PCT) {
        failures.push(`${name} ${metricName}: ${pct.toFixed(2)}% < ${MIN_COVERAGE_PCT}%`);
      }
    });
  });

  if (failures.length) {
    throw new Error(
      [
        `Coverage threshold failure: every reported cell must be at least ${MIN_COVERAGE_PCT}%.`,
        ...failures.map(line => `- ${line}`),
      ].join("\n"),
    );
  }
}

console.log("\n── album-review test coverage ──────────────────────────────\n");

cleanCoverageDirs();

execSync("npx playwright test", {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    VITE_COVERAGE: "true",
  },
});

ensureCoverageFiles();

execSync("npx nyc report --reporter=text --reporter=html --reporter=lcov --reporter=json-summary", {
  cwd: ROOT,
  stdio: "inherit",
});

ensureCoverageThresholds();

console.log("\nCoverage report written to coverage/index.html\n");