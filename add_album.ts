#!/usr/bin/env tsx
/**
 * add_album.ts — scaffold a new album analysis page from MusicBrainz data.
 *
 * Usage:
 *   npx tsx add_album.ts "Artist Name" "Album Title" YEAR [OPTIONS]
 *   npm run add-album -- "Artist Name" "Album Title" YEAR [OPTIONS]
 *
 * Options:
 *   --genre "Genre / Sub-genre"   Genre string for the card
 *   --mbid  <release-id>          Skip search, use a known MusicBrainz release ID directly
 *   --dry-run                     Print what would be generated without writing any files
 *
 * Examples:
 *   npx tsx add_album.ts "Aphex Twin" "Selected Ambient Works 85-92" 1992
 *   npx tsx add_album.ts "Boards of Canada" "Music Has the Right to Children" 1998 --genre "Electronic / Ambient"
 *   npx tsx add_album.ts "Massive Attack" "Mezzanine" 1998 --mbid 9c5a764d-be29-4b16-9c35-e7e58b5d4f66
 *   npx tsx add_album.ts "Autechre" "Tri Repetae" 1995 --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Track, slugify, msToMmss, buildHtml, buildEntry } from "./album-scaffold.js";

// ── Constants ──────────────────────────────────────────────────────────────────

const ROOT      = dirname(fileURLToPath(import.meta.url));
const ALBUMS_JS = join(ROOT, "albums.js");
const MB_BASE   = "https://musicbrainz.org/ws/2";
const MB_AGENT  = "AlbumAnalysisScaffolder/1.0 (https://github.com/satyrlord/album-review)";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MbRelease {
  id: string;
  title: string;
  date?: string;
  status?: string;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// ── albums.js Patching ─────────────────────────────────────────────────────────

function appendToAlbumsJs(file: string, artist: string, title: string, year: number, trackCount: number, genre: string): void {
  let content = readFileSync(ALBUMS_JS, "utf-8");
  const entry = buildEntry(file, artist, title, year, trackCount, genre);

  // Try to find an existing artist comment block and insert after its last entry
  const commentPat = new RegExp(`/\\* ── ${artist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} .*?──`, "i");
  const m = commentPat.exec(content);
  if (m) {
    const after         = content.slice(m.index + m[0].length);
    const nextBoundary  = /\/\* ──|\];/.exec(after);
    if (nextBoundary) {
      const region   = after.slice(0, nextBoundary.index);
      const lastBrace = region.lastIndexOf("  }");
      if (lastBrace !== -1) {
        const insertAt = m.index + m[0].length + lastBrace + 3;
        content = content.slice(0, insertAt) + ",\n" + entry + "\n" + content.slice(insertAt);
        writeFileSync(ALBUMS_JS, content, "utf-8");
        return;
      }
    }
  }

  // Fallback: insert before `];`
  const close = content.lastIndexOf("];");
  if (close === -1) { console.error("ERROR: Could not find `];` in albums.js."); return; }
  const lastBrace = content.lastIndexOf("}", close);
  content = lastBrace !== -1
    ? content.slice(0, lastBrace + 1) + ",\n" + entry + "\n\n" + content.slice(close)
    : content.slice(0, close) + entry + "\n" + content.slice(close);
  writeFileSync(ALBUMS_JS, content, "utf-8");
}

// ── CLI ────────────────────────────────────────────────────────────────────────

function parseArgs(): {
  artist: string; title: string; year: number;
  genre: string; mbid: string; dryRun: boolean;
} {
  const args = process.argv.slice(2);
  if (args.length < 2 || args[0].startsWith("--")) {
    console.error(
      "Usage: npx tsx add_album.ts \"Artist\" \"Album Title\" [YEAR] [--genre \"...\"] [--mbid ID] [--dry-run]\n" +
      "  or:  npm run add-album -- \"Artist\" \"Album Title\" [YEAR] [OPTIONS]"
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

  const artistSlug   = slugify(artist);
  const titleSlug    = slugify(title);
  const outFilename  = `${artistSlug}-${titleSlug}-structural-analysis.html`;
  const outPath      = join(ROOT, outFilename);

  if (!dryRun && existsSync(outPath)) {
    console.error(`ERROR: ${outFilename} already exists. Remove it first or use --dry-run.`);
    process.exit(1);
  }

  // 1. Resolve MBID
  let mbid = mbidArg;
  let resolvedYear = year;
  let releaseDate = year ? String(year) : "";

  if (!mbid) {
    const yearLabel = year ? ` (${year})` : "";
    console.log(`[1/3] Searching MusicBrainz for '${title}' by ${artist}${yearLabel}…`);
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
    console.log(`[1/3] Using provided MBID: ${mbid}`);
    if (!resolvedYear) resolvedYear = new Date().getFullYear();
  }

  // 2. Fetch tracks
  console.log("[2/3] Fetching track listing…");
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

  // 3. Generate and write
  console.log("[3/3] Generating scaffold…");
  const html = buildHtml(artist, title, resolvedYear, genre, tracks, releaseDate || String(resolvedYear));

  if (dryRun) {
    console.log("\n─── HTML preview (first 2 000 chars) ─────────────────────────────");
    console.log(html.slice(0, 2000), "\n…");
    console.log("\n─── albums.js entry ───────────────────────────────────────────────");
    console.log(buildEntry(outFilename, artist, title, resolvedYear, tracks.length, genre));
    console.log("\n(dry-run: no files written)");
    return;
  }

  writeFileSync(outPath, html, "utf-8");
  console.log(`      Created : ${outFilename}`);

  appendToAlbumsJs(outFilename, artist, title, resolvedYear, tracks.length, genre);
  console.log(`      Updated : albums.js`);

  console.log(`\nDone.\n  File  → ${outPath}\n  Open  → http://127.0.0.1:3000/${outFilename}`);
}

main().catch(err => { console.error(err); process.exit(1); });
