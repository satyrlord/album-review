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

export function buildAlbumIndex(records: AlbumFileRecord[]): AlbumIndexEntry[] {
  return records
    .map(record => toAlbumIndexEntry(record.album))
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