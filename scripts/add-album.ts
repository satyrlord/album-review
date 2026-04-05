#!/usr/bin/env tsx
/**
 * add-album.ts — scaffold a new album analysis entry from MusicBrainz data
 * and a Wikipedia album-cover thumbnail when available.
 *
 * Usage:
 *   npx tsx scripts/add-album.ts "Artist Name" "Album Title" YEAR --genre "Genre / Sub-genre" [OPTIONS]
 *   npm run add-album -- "Artist Name" "Album Title" YEAR --genre "Genre / Sub-genre" [OPTIONS]
 *
 * Options:
 *   --genre "Genre / Sub-genre"   Genre string for the card
 *   --mbid  <release-id>          Skip search, use a known MusicBrainz release ID directly
 *   --dry-run                     Print what would be generated without writing any files
 *
 * Examples:
 *   npx tsx scripts/add-album.ts "Boards of Canada" "Music Has the Right to Children" 1998 --genre "Electronic / Ambient"
 *   npx tsx scripts/add-album.ts "Massive Attack" "Mezzanine" 1998 --genre "Trip Hop / Alternative Dance" --mbid 9c5a764d-be29-4b16-9c35-e7e58b5d4f66
 *   npx tsx scripts/add-album.ts "Autechre" "Tri Repetae" 1995 --genre "IDM / Experimental Electronic" --dry-run
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { toAlbumIndexEntry, writeAlbumIndexFile } from "./albums/album-index.js";
import { cacheCover, getCoverCachePath } from "./albums/cover-cache.js";
import { Track, slugify, msToMmss, buildJson, getGenreTags } from "./albums/album-scaffold.js";

// ── Constants ──────────────────────────────────────────────────────────────────

const ROOT      = join(dirname(fileURLToPath(import.meta.url)), "..");
const MB_BASE   = "https://musicbrainz.org/ws/2";
const MB_AGENT  = "AlbumAnalysisScaffolder/1.0 (https://github.com/satyrlord/album-review)";
const WIKI_API  = "https://en.wikipedia.org/w/api.php";
const WIKI_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MbRelease {
  id: string;
  title: string;
  date?: string;
  status?: string;
}

interface WikiSearchResponse {
  query?: {
    search?: Array<{ title: string }>;
  };
}

interface WikiSummaryResponse {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normaliseLoose(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// ── MusicBrainz API ────────────────────────────────────────────────────────────

async function mbGet(path: string, params: Record<string, string>): Promise<unknown> {
  const qs  = new URLSearchParams({ ...params, fmt: "json" }).toString();
  const url = `${MB_BASE}/${path}?${qs}`;
  await sleep(1100); // MusicBrainz ToS: max 1 request/second
  const res = await fetch(url, {
    headers: { "User-Agent": MB_AGENT, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`MusicBrainz ${res.status}: ${url}`);
  return res.json();
}

async function searchRelease(artist: string, title: string, year: number): Promise<MbRelease | null> {
  const query = year
    ? `release:"${title}" AND artist:"${artist}" AND date:${year}`
    : `release:"${title}" AND artist:"${artist}"`;
  const data  = await mbGet("release", { query, limit: "8" }) as { releases: MbRelease[] };
  const releases = data.releases ?? [];
  if (!releases.length) return null;
  return releases.find(r => r.status?.toLowerCase() === "official") ?? releases[0];
}

async function fetchTracks(mbid: string): Promise<{ tracks: Track[]; releaseDate: string }> {
  const data = await mbGet(`release/${mbid}`, { inc: "recordings" }) as {
    media: Array<{ tracks: Array<{ title: string; length: number | null }> }>;
    date?: string;
  };
  const tracks: Track[] = [];
  for (const medium of data.media ?? []) {
    for (const t of medium.tracks ?? []) {
      tracks.push({ num: tracks.length + 1, title: t.title ?? "Unknown", lengthMs: t.length ?? 0 });
    }
  }
  return { tracks, releaseDate: data.date ?? "" };
}

// ── Wikipedia cover lookup ───────────────────────────────────────────────────

async function wikiSearch(query: string): Promise<string[]> {
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: query,
    srlimit: "5",
    srnamespace: "0",
  }).toString();

  const res = await fetch(`${WIKI_API}?${qs}`, {
    headers: { "User-Agent": MB_AGENT, "Accept": "application/json" },
  });

  if (!res.ok) return [];

  const data = await res.json() as WikiSearchResponse;
  return (data.query?.search ?? []).map(result => result.title).filter(Boolean);
}

async function wikiSummary(pageTitle: string): Promise<WikiSummaryResponse | null> {
  const res = await fetch(`${WIKI_SUMMARY_BASE}/${encodeURIComponent(pageTitle)}`, {
    headers: { "User-Agent": MB_AGENT, "Accept": "application/json" },
  });

  if (!res.ok) return null;
  return await res.json() as WikiSummaryResponse;
}

function scoreWikiPageTitle(pageTitle: string, albumTitle: string, artist: string): number {
  const page   = normaliseLoose(pageTitle);
  const album  = normaliseLoose(albumTitle);
  const artistName = normaliseLoose(artist);

  let score = 0;

  if (page === album) score += 10;
  if (page.includes(album)) score += 6;
  if (page.includes(artistName)) score += 4;
  if (page.includes("album")) score += 3;
  if (page.includes("song")) score -= 6;
  if (page.includes("disambiguation")) score -= 8;

  return score;
}

async function findWikipediaCoverUrl(artist: string, title: string): Promise<string> {
  const candidates = new Map<string, number>();

  const addCandidate = (pageTitle: string, bonus = 0): void => {
    const score = scoreWikiPageTitle(pageTitle, title, artist) + bonus;
    const prev  = candidates.get(pageTitle);
    if (prev === undefined || score > prev) candidates.set(pageTitle, score);
  };

  [
    title,
    `${title} (album)`,
    `${title} (${artist} album)`,
  ].forEach(pageTitle => addCandidate(pageTitle, 2));

  for (const query of [
    `${artist} ${title} album`,
    `"${artist}" "${title}" album`,
    `"${title}" album`,
    `${title} ${artist}`,
  ]) {
    const results = await wikiSearch(query);
    results.forEach(pageTitle => addCandidate(pageTitle));
  }

  const ordered = [...candidates.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([pageTitle]) => pageTitle)
    .slice(0, 8);

  for (const pageTitle of ordered) {
    const summary = await wikiSummary(pageTitle);
    const coverUrl = summary?.thumbnail?.source ?? summary?.originalimage?.source ?? "";
    if (coverUrl) return coverUrl;
  }

  return "";
}

// ── CLI ────────────────────────────────────────────────────────────────────────

function parseArgs(): {
  artist: string; title: string; year: number;
  genre: string; mbid: string; dryRun: boolean;
} {
  const args = process.argv.slice(2);
  if (args.length < 2 || args[0].startsWith("--")) {
    console.error(
      "Usage: npx tsx scripts/add-album.ts \"Artist\" \"Album Title\" [YEAR] --genre \"...\" [--mbid ID] [--dry-run]\n" +
      "  or:  npm run add-album -- \"Artist\" \"Album Title\" [YEAR] --genre \"...\" [--mbid ID] [--dry-run]"
    );
    process.exit(1);
  }
  const artist = args[0];
  const title  = args[1];
  const yearCandidate = args[2] && !args[2].startsWith("--") ? parseInt(args[2], 10) : 0;
  const year   = isNaN(yearCandidate) ? 0 : yearCandidate;

  let genre = "", mbid = "", dryRun = false;
  const optStart = year ? 3 : 2;
  for (let i = optStart; i < args.length; i++) {
    if (args[i] === "--genre" && args[i + 1]) { genre = args[++i]; }
    else if (args[i] === "--mbid" && args[i + 1]) { mbid = args[++i]; }
    else if (args[i] === "--dry-run") { dryRun = true; }
  }
  return { artist, title, year, genre, mbid, dryRun };
}

async function main(): Promise<void> {
  const { artist, title, year, genre, mbid: mbidArg, dryRun } = parseArgs();

  if (getGenreTags(genre).length === 0) {
    console.error('ERROR: --genre must include at least one non-empty genre tag, e.g. "Electronic / Ambient".');
    process.exit(1);
  }

  const id      = `${slugify(artist)}-${slugify(title)}`;
  const dataDir = join(ROOT, "data");
  const outPath = join(dataDir, `${id}.json`);

  if (!dryRun && existsSync(outPath)) {
    console.error(`ERROR: data/${id}.json already exists. Remove it first or use --dry-run.`);
    process.exit(1);
  }

  // 1. Resolve MBID
  let mbid = mbidArg;
  let resolvedYear = year;
  let releaseDate = year ? String(year) : "";

  if (!mbid) {
    const yearLabel = year ? ` (${year})` : "";
    console.log(`[1/4] Searching MusicBrainz for '${title}' by ${artist}${yearLabel}…`);
    const release = await searchRelease(artist, title, year);
    if (!release) {
      console.error("      No release found. Try --mbid <id> to specify one directly.");
      console.error("      Search at: https://musicbrainz.org/release/");
      process.exit(1);
    }
    mbid        = release.id;
    releaseDate = release.date ?? releaseDate;
    if (!resolvedYear && releaseDate) {
      resolvedYear = parseInt(releaseDate.slice(0, 4), 10) || new Date().getFullYear();
    }
    if (!resolvedYear) resolvedYear = new Date().getFullYear();
    console.log(`      Found: ${release.title} (${releaseDate})  MBID: ${mbid}`);
  } else {
    console.log(`[1/4] Using provided MBID: ${mbid}`);
    if (!resolvedYear) resolvedYear = new Date().getFullYear();
  }

  // 2. Fetch tracks
  console.log("[2/4] Fetching track listing…");
  const { tracks, releaseDate: mbDate } = await fetchTracks(mbid);
  if (mbDate && !mbidArg) releaseDate = mbDate;
  if (!tracks.length) {
    console.error("      No tracks returned. Check the MBID or try a different release.");
    process.exit(1);
  }
  const totalMs = tracks.reduce((s, t) => s + t.lengthMs, 0);
  console.log(`      ${tracks.length} tracks — ${msToMmss(totalMs)}`);
  for (const t of tracks) {
    const dur = t.lengthMs ? msToMmss(t.lengthMs) : "?:??";
    console.log(`        ${String(t.num).padStart(2)}. ${t.title}  [${dur}]`);
  }

  // 3. Resolve cover art
  console.log("[3/4] Searching Wikipedia for album cover…");
  const coverSourceUrl = await findWikipediaCoverUrl(artist, title);
  let cachedCoverUrl = "";
  if (coverSourceUrl) {
    console.log(`      Found cover: ${coverSourceUrl}`);
    cachedCoverUrl = getCoverCachePath(id, coverSourceUrl);
    if (dryRun) {
      console.log(`      Dry run: would cache to ${cachedCoverUrl}`);
    } else {
      await cacheCover(ROOT, id, coverSourceUrl);
      console.log(`      Cached to : ${cachedCoverUrl}`);
    }
  } else {
    console.log("      No Wikipedia thumbnail found. Continuing without coverUrl.");
  }

  // 4. Generate and write
  console.log("[4/4] Generating scaffold…");
  const jsonData = buildJson(id, artist, title, resolvedYear, genre, tracks, cachedCoverUrl);

  if (dryRun) {
    console.log("\n─── JSON preview (first 2 000 chars) ──────────────────────────────");
    console.log(JSON.stringify(jsonData, null, 2).slice(0, 2000), "\n…");
    console.log("\n─── data/index.json entry ────────────────────────────────────────");
    console.log(JSON.stringify(toAlbumIndexEntry(jsonData), null, 2));
    console.log("\n(dry-run: no files written)");
    return;
  }

  mkdirSync(dataDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(jsonData, null, 2)}\n`, "utf-8");
  console.log(`      Created : data/${id}.json`);

  writeAlbumIndexFile(dataDir);
  console.log("      Updated : data/index.json");

  console.log(`\nDone.\n  File  → ${outPath}\n  Open  → http://127.0.0.1:3000/album.html?id=${id}`);
}

main().catch(err => { console.error(err); process.exit(1); });
