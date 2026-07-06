import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

import type { AlbumData, AlbumIndexEntry } from "./album-schema.js";

export interface AlbumFileRecord {
  fileName: string;
  album: AlbumData;
}

const GENERATED_ALBUM_INDEX_FILE = "index.json";

function getAlbumDataIssues(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["must be a JSON object matching AlbumData"];
  }

  const album = value as Partial<AlbumData>;
  const issues: string[] = [];

  if (typeof album.id !== "string" || !album.id.trim()) {
    issues.push("id is required");
  }
  if (typeof album.artist !== "string" || !album.artist.trim()) {
    issues.push("artist is required");
  }
  if (typeof album.title !== "string" || !album.title.trim()) {
    issues.push("title is required");
  }
  if (typeof album.year !== "number" || !Number.isFinite(album.year)) {
    issues.push("year must be a number");
  }
  if (typeof album.genre !== "string") {
    issues.push("genre must be a string");
  }

  if (!Array.isArray(album.genreTags)) {
    issues.push("genreTags must be a non-empty array of genre/subgenre tags");
  } else {
    const hasOnlyNonEmptyStrings = album.genreTags.every(tag => typeof tag === "string" && !!tag.trim());
    if (!hasOnlyNonEmptyStrings) {
      issues.push("genreTags entries must be non-empty strings");
    }
    if (album.genreTags.length < 1) {
      issues.push("genreTags must be a non-empty array of genre/subgenre tags");
    }
  }

  if (typeof album.runtime !== "string" || !album.runtime.trim()) {
    issues.push("runtime is required");
  }
  if (typeof album.overview !== "string" || !album.overview.trim()) {
    issues.push("overview is required");
  }
  if (!Array.isArray(album.tracks)) {
    issues.push("tracks must be an array");
  }

  return issues;
}

export function expectedAlbumId(fileName: string): string {
  return basename(fileName, ".json");
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

function genreTagFoldKey(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Collapse spelling variants of the same genre tag ("New Age" vs "New-Age")
 * to one canonical display form: the variant used by the most albums,
 * with alphabetical order as the tie-breaker.
 */
export function canonicaliseGenreTags(entries: AlbumIndexEntry[]): AlbumIndexEntry[] {
  const variantCounts = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    for (const tag of entry.genreTags) {
      const key = genreTagFoldKey(tag);
      const counts = variantCounts.get(key) ?? new Map<string, number>();
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      variantCounts.set(key, counts);
    }
  }

  const canonical = new Map<string, string>();
  for (const [key, counts] of variantCounts) {
    const winner = Array.from(counts.entries()).sort((a, b) =>
      b[1] - a[1] || a[0].localeCompare(b[0])
    )[0][0];
    canonical.set(key, winner);
  }

  return entries.map(entry => {
    const seen = new Set<string>();
    const genreTags: string[] = [];
    for (const tag of entry.genreTags) {
      const display = canonical.get(genreTagFoldKey(tag)) ?? tag;
      if (!seen.has(display)) {
        seen.add(display);
        genreTags.push(display);
      }
    }
    return { ...entry, genreTags };
  });
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