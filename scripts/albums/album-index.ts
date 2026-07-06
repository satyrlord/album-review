import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

import type { AlbumData, AlbumIndexEntry } from "../../src/shared/schema.js";
import { canonicaliseGenreTags } from "../../src/shared/tags.js";
import { getAlbumDataIssues } from "../../src/shared/validate.js";

export interface AlbumFileRecord {
  fileName: string;
  album: AlbumData;
}

const GENERATED_ALBUM_INDEX_FILE = "index.json";

export function expectedAlbumId(fileName: string): string {
  return basename(fileName, ".json");
}

/**
 * Cross-file consistency checks over the whole data/ directory:
 * every id must match its filename, and ids must be unique.
 * Per-record checks live in src/shared/validate.ts, beside the schema.
 */
function getAlbumCollectionIssues(records: AlbumFileRecord[]): string[] {
  const issues: string[] = [];
  const seenIds = new Set<string>();

  for (const record of records) {
    const expectedId = expectedAlbumId(record.fileName);
    const album = record.album;

    if (album.id !== expectedId) {
      issues.push(`data/${record.fileName}: id must be "${expectedId}", got "${album.id}"`);
    }

    if (seenIds.has(album.id)) {
      issues.push(`data/${record.fileName}: duplicate album id "${album.id}"`);
    }
    seenIds.add(album.id);
  }

  return issues;
}

export function readAlbumDataDir(dataDir: string): AlbumFileRecord[] {
  const issues: string[] = [];
  const records: AlbumFileRecord[] = [];

  for (const fileName of readdirSync(dataDir)
    .filter(fileName => fileName.endsWith(".json") && fileName !== GENERATED_ALBUM_INDEX_FILE)
    .sort()) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(readFileSync(join(dataDir, fileName), "utf-8")) as unknown;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`data/${fileName}: invalid JSON (${message})`);
      continue;
    }

    const albumIssues = getAlbumDataIssues(parsed);
    if (albumIssues.length > 0) {
      issues.push(`data/${fileName}: ${albumIssues.join("; ")}`);
      continue;
    }

    records.push({ fileName, album: parsed as AlbumData });
  }

  issues.push(...getAlbumCollectionIssues(records));

  if (issues.length > 0) {
    throw new Error(issues.map(issue => `[album-index] ${issue}`).join("\n"));
  }

  return records;
}

export function toAlbumIndexEntry(album: AlbumData): AlbumIndexEntry {
  return {
    id: album.id,
    artist: album.artist,
    title: album.title,
    year: album.year,
    tracks: album.tracks.length,
    genre: album.genre,
    genreTags: album.genreTags,
    ...(album.coverUrl ? { coverUrl: album.coverUrl } : {}),
    ...(album.isSoundtrack === true ? { isSoundtrack: true } : {}),
  };
}

export function buildAlbumIndex(records: AlbumFileRecord[]): AlbumIndexEntry[] {
  return canonicaliseGenreTags(records.map(record => toAlbumIndexEntry(record.album)))
    .sort((left, right) =>
      left.artist.localeCompare(right.artist)
      || left.year - right.year
      || left.title.localeCompare(right.title)
    );
}

export function writeAlbumIndexFile(dataDir: string): AlbumIndexEntry[] {
  const records = readAlbumDataDir(dataDir);
  const index = buildAlbumIndex(records);

  writeFileSync(join(dataDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf-8");
  return index;
}
