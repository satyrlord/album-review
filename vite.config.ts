import { execSync } from "child_process";
import { cpSync, existsSync } from "fs";
import { resolve } from "path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import vitePluginIstanbul from "vite-plugin-istanbul";

import type { SiteBuildMeta } from "./src/shared/schema.js";

interface RunGitOptions {
  logFailure?: boolean;
}

function logGitFailure(command: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    console.warn(`[vite.config] Git command failed: ${command}. Falling back to default build metadata.`);
    return;
  }

  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`[vite.config] Git command failed: ${command}\n${detail}`);
}

function runGit(command: string, options: RunGitOptions = {}): string | null {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch (error: unknown) {
    if (options.logFailure) {
      logGitFailure(command, error);
    }
    return null;
  }
}

function resolvePushedRef(): string {
  const upstream = runGit('git rev-parse --abbrev-ref --symbolic-full-name "@{u}"');
  if (upstream) return upstream;

  const hasOriginMain = runGit("git rev-parse --verify origin/main");
  if (hasOriginMain) return "origin/main";

  return "HEAD";
}

function readBuildMeta(): SiteBuildMeta {
  const sourceRef = resolvePushedRef();
  const rawCount = runGit(`git rev-list --count ${sourceRef}`, { logFailure: true });
  const pushedCommitCount = Number(rawCount);

  return {
    pushedCommitCount: Number.isFinite(pushedCommitCount) && pushedCommitCount >= 0
      ? Math.floor(pushedCommitCount)
      : 0,
    sourceRef,
    generatedAt: new Date().toISOString(),
  };
}

function copyDataDirectory(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "copy-album-data",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    closeBundle() {
      const sourceDir = resolve(config.root, "data");
      const targetDir = resolve(config.root, config.build.outDir, "data");

      if (existsSync(sourceDir)) {
        cpSync(sourceDir, targetDir, { recursive: true, force: true });
      }
    },
  };
}

const buildMeta = readBuildMeta();

export default defineConfig({
  appType: "mpa",
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), "index.html"),
        album: resolve(process.cwd(), "album.html"),
        credits: resolve(process.cwd(), "credits.html"),
      },
    },
  },
  define: {
    __ALBUM_REVIEW_BUILD__: JSON.stringify(buildMeta),
  },
  plugins: [
    tailwindcss(),
    copyDataDirectory(),
    ...(process.env.VITE_COVERAGE === "true"
      ? [vitePluginIstanbul({
          // Browser page modules only — src/shared/** has its own
          // independent Vitest coverage gate (no merged streams).
          include: ["src/**/*.ts"],
          exclude: ["node_modules", "src/shared/**"],
          extension: [".ts", ".js"],
          requireEnv: true,
        })]
      : []),
  ],
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
  },
});