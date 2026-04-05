#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { readAlbumDataDir, writeAlbumIndexFile } from "./albums/album-index.js";
import { cacheCover, getCoverCachePath, isRemoteCoverUrl, resolveCoverCacheFile } from "./albums/cover-cache.js";
import type { AlbumData } from "./albums/album-schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");

// Keep one-off source overrides inline until there is enough churn to justify a config file.
// Use this map when a source record resolves to missing, unstable, or unsuitable artwork.
const COVER_SOURCE_OVERRIDES: Record<string, string> = {
  "nine-inch-nails-quake": "https://cdn-images.dzcdn.net/images/cover/b3e054ec5469dc296fead9f1c75cba85/0x1900-000000-80-0-0.jpg",
};

async function main(): Promise<void> {
  const records = readAlbumDataDir(DATA_DIR);

  let cachedCount = 0;
  let updatedCount = 0;

  for (const { fileName, album } of records) {
    const sourceUrl = COVER_SOURCE_OVERRIDES[album.id] ?? (isRemoteCoverUrl(album.coverUrl) ? album.coverUrl : "");
    if (!sourceUrl) continue;

    const cachedCoverUrl = getCoverCachePath(album.id, sourceUrl);
    const cachedCoverFile = resolveCoverCacheFile(ROOT, cachedCoverUrl);
    const alreadyCached = album.coverUrl === cachedCoverUrl && existsSync(cachedCoverFile);

    if (!alreadyCached) {
      await cacheCover(ROOT, album.id, sourceUrl);
      cachedCount += 1;
    }

    if (album.coverUrl !== cachedCoverUrl) {
      const filePath = join(DATA_DIR, fileName);
      const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as AlbumData;
      parsed.coverUrl = cachedCoverUrl;
      writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
      updatedCount += 1;
      console.log(`Updated data/${fileName} -> ${cachedCoverUrl}`);
    } else if (!alreadyCached) {
      console.log(`Refreshed cache for data/${fileName} -> ${cachedCoverUrl}`);
    }
  }

  writeAlbumIndexFile(DATA_DIR);
  console.log(`Cached ${cachedCount} cover file${cachedCount === 1 ? "" : "s"}.`);
  console.log(`Updated ${updatedCount} album JSON file${updatedCount === 1 ? "" : "s"}.`);
  console.log("Regenerated data/index.json.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});