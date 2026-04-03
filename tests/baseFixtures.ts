import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";

import { test as baseTest } from "@playwright/test";

const istanbulOutputDir = join(process.cwd(), ".nyc_output");

function generateCoverageFileId(): string {
  return randomBytes(16).toString("hex");
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const test = baseTest.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.addEventListener("beforeunload", () => {
        const coverage = (window as Window & { __coverage__?: unknown }).__coverage__;
        const collector = (window as Window & {
          collectIstanbulCoverage?: (coverageJSON?: string) => void;
        }).collectIstanbulCoverage;

        if (coverage && collector) {
          collector(JSON.stringify(coverage));
        }
      });
    });

    await fs.mkdir(istanbulOutputDir, { recursive: true });

    await context.exposeFunction("collectIstanbulCoverage", async (coverageJSON?: string) => {
      if (!coverageJSON) return;

      await fs.writeFile(
        join(istanbulOutputDir, `playwright_coverage_${generateCoverageFileId()}.json`),
        coverageJSON,
        "utf-8",
      );
    });

    await use(context);

    for (const page of context.pages()) {
      await page.evaluate(() => {
        const coverage = (window as Window & { __coverage__?: unknown }).__coverage__;
        const collector = (window as Window & {
          collectIstanbulCoverage?: (coverageJSON?: string) => void;
        }).collectIstanbulCoverage;

        if (coverage && collector) {
          collector(JSON.stringify(coverage));
        }
      }).catch((error: unknown) => {
        if (process.env.VITE_COVERAGE === "true") {
          console.warn(`Failed to collect Istanbul coverage during teardown: ${formatErrorMessage(error)}`);
        }
      });
    }
  },
});

export const expect = test.expect;