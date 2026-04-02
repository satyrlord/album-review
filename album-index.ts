import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

import type { AlbumData, AlbumIndexEntry } from "./album-schema.js";

export interface AlbumFileRecord {
  fileName: string;
  album: AlbumData;
}

export function expectedAlbumId(fileName: string): string {
  return basename(fileName, ".json");
}

export function readAlbumDataDir(dataDir: string): AlbumFileRecord[] {
  return readdirSync(dataDir)
    .filter(fileName => fileName.endsWith(".json") && fileName !== "index.json")
    .sort()
    .map(fileName => ({
      fileName,
      album: JSON.parse(readFileSync(join(dataDir, fileName), "utf-8")) as AlbumData,
    }));
}

export function toAlbumIndexEntry(album: AlbumData): AlbumIndexEntry {
  return {
    id: album.id,
    artist: album.artist,
    title: album.title,
    year: album.year,
    tracks: album.tracks.length,
    genre: album.genre,
    coverUrl: album.coverUrl,
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