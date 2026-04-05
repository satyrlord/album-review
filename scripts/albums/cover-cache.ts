import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { extname, join } from "path";

const DEFAULT_COVER_EXTENSION = ".jpg";
const SUPPORTED_COVER_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const COVER_CACHE_USER_AGENT = "AlbumReviewCoverCache/1.0 (https://github.com/satyrlord/album-review)";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normaliseCoverExtension(extension: string): string {
  const value = extension.toLowerCase();
  return SUPPORTED_COVER_EXTENSIONS.has(value) ? value : DEFAULT_COVER_EXTENSION;
}

export function isRemoteCoverUrl(value: string | undefined): value is string {
  return /^https?:\/\//i.test(value ?? "");
}

export function getCoverCachePath(id: string, sourceUrl: string): string {
  const source = new URL(sourceUrl);
  const extension = normaliseCoverExtension(extname(source.pathname));
  return `covers/${id}${extension}`;
}

export function resolveCoverCacheFile(rootDir: string, relativePath: string): string {
  return join(rootDir, "public", relativePath);
}

function removeStaleCachedCovers(rootDir: string, id: string, keepRelativePath: string): void {
  const coversDir = join(rootDir, "public", "covers");
  if (!existsSync(coversDir)) return;

  const keepFileName = keepRelativePath.split("/").at(-1) ?? "";

  for (const fileName of readdirSync(coversDir)) {
    if (fileName.startsWith(`${id}.`) && fileName !== keepFileName) {
      unlinkSync(join(coversDir, fileName));
    }
  }
}

export async function cacheCover(rootDir: string, id: string, sourceUrl: string): Promise<string> {
  const relativePath = getCoverCachePath(id, sourceUrl);
  const targetFile = resolveCoverCacheFile(rootDir, relativePath);

  mkdirSync(join(rootDir, "public", "covers"), { recursive: true });

  let response: Response | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) {
      await sleep(1200 * attempt);
    }

    response = await fetch(sourceUrl, {
      headers: {
        "Accept": "image/*",
        "User-Agent": COVER_CACHE_USER_AGENT,
      },
    });

    if (response.ok) {
      break;
    }

    if (response.status !== 429) {
      throw new Error(`Could not download cover (${response.status}) from ${sourceUrl}`);
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Could not download cover (${response?.status ?? "unknown"}) from ${sourceUrl}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  writeFileSync(targetFile, body);
  removeStaleCachedCovers(rootDir, id, relativePath);

  return relativePath;
}