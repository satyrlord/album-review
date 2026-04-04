import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

import type { AlbumData, AlbumIndexEntry } from "./album-schema.js";

export interface AlbumFileRecord {
  fileName: string;
  album: AlbumData;
}

const GENERATED_ALBUM_INDEX_FILE = "index.json";

function isAlbumData(value: unknown): value is AlbumData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const album = value as Partial<AlbumData>;
  return typeof album.id === "string"
    && typeof album.artist === "string"
    && typeof album.title === "string"
    && typeof album.year === "number"
    && typeof album.genre === "string"
    && typeof album.runtime === "string"
    && typeof album.overview === "string"
    && Array.isArray(album.tracks);
}

export function expectedAlbumId(fileName: string): string {
  return basename(fileName, ".json");
}

export function readAlbumDataDir(dataDir: string): AlbumFileRecord[] {
  return readdirSync(dataDir)
    .filter(fileName => fileName.endsWith(".json") && fileName !== GENERATED_ALBUM_INDEX_FILE)
    .sort()
    .flatMap(fileName => {
      const parsed = JSON.parse(readFileSync(join(dataDir, fileName), "utf-8")) as unknown;
      // Metadata catalogs such as the generated index.json are array documents, not album records.
      if (Array.isArray(parsed)) {
        return [];
      }
      if (!isAlbumData(parsed)) {
        console.warn(`[album-index] Skipping data/${fileName}: JSON did not match the AlbumData shape.`);
        return [];
      }
      return [{ fileName, album: parsed }];
    });
}

export function toAlbumIndexEntry(album: AlbumData): AlbumIndexEntry {
  return {
    id: album.id,
    artist: album.artist,
    title: album.title,
    year: album.year,
    tracks: album.tracks.length,
    genre: album.genre,
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