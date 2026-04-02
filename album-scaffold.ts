import type { AlbumData, AlbumTrack } from './album-schema.js';

export interface Track {
  num: number;
  title: string;
  lengthMs: number;
}

const COMMENT_ONLY = /^\s*<!--[\s\S]*?-->\s*$/;

function stripCombiningMarks(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(text: string): string {
  let value = text.toLowerCase();

  value = value
    .replace(/[\u2019\u2018']/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00df/g, "ss")
    .replace(/\u2026/g, "");

  value = stripCombiningMarks(value);
  value = value.replace(/[^a-z0-9\s-]/g, "");
  value = value.replace(/[\s_]+/g, "-").trim();
  value = value.replace(/-{2,}/g, "-");
  return value.replace(/^-|-$/g, "");
}

export function msToMmss(ms: number): string {
  const total = Math.floor(ms / 1000);
  const secs  = total % 60;
  return `${Math.floor(total / 60)}:${String(secs).padStart(2, "0")}`;
}

export function htmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getDisplayGenre(genre: string): string {
  const value = genre.trim();
  return value && !COMMENT_ONLY.test(value) ? value : "";
}

export function buildTrackBlock(track: Track, idx: number): string {
  const num      = String(idx).padStart(2, "0");
  const duration = track.lengthMs ? msToMmss(track.lengthMs) : "?:??";
  const title    = htmlEscape(track.title);

  return `\
  <!-- TRACK ${num} -->
  <div class="track">
    <div class="track-header">
      <span class="track-num">${num}</span>
      <span class="track-title">${title}</span>
      <span class="track-duration">${duration}</span>
    </div>
    <div class="track-tags">
      <span class="tag energy-mid">Energy: Mid</span>
    </div>
    <div class="track-role">Initial scaffold only. Narrative role pending detailed listen.</div>
    <div class="timeline">
      <div class="event intro-ev">
        <span class="event-time">0:00</span>
        <span class="event-desc"><strong>Opening section</strong> &mdash; Detailed timestamp notes pending.</span>
      </div>
    </div>
  </div>
`;
}

export function buildHtml(
  artist: string,
  title: string,
  year: number,
  genre: string,
  tracks: Track[],
  releaseDate: string,
): string {
  const safeArtist   = htmlEscape(artist);
  const safeTitle    = htmlEscape(title);
  const displayGenre = getDisplayGenre(genre);
  const safeGenre    = displayGenre ? htmlEscape(displayGenre) : "";
  const totalMs      = tracks.reduce((sum, track) => sum + track.lengthMs, 0);
  const totalDur     = totalMs ? msToMmss(totalMs) : "?:??";

  const parts     = safeTitle.split(" ");
  const last      = parts.pop()!;
  const h1Content = parts.length ? `${parts.join(" ")} <span>${last}</span>` : `<span>${safeTitle}</span>`;
  const genreRow  = safeGenre ? `\n      <div><strong>Genre:</strong> ${safeGenre}</div>` : "";

  const tracksHtml = tracks.map((track, index) => buildTrackBlock(track, index + 1)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Structural Analysis — ${safeArtist} · ${safeTitle} (${year})</title>
<link rel="stylesheet" href="album-analysis.css">
</head>
<body>

<div class="hero">
  <div class="container">
    <a class="home-btn" href="index.html">&#8592; All Albums</a>
    <div class="subtitle">Timestamp-Based Structural Analysis</div>
    <h1>${h1Content}</h1>
    <div class="meta">
      <div><strong>Artist:</strong> ${safeArtist}</div>
      <div><strong>Released:</strong> ${releaseDate || year}</div>
      <div><strong>Total Length:</strong> ${totalDur}</div>
      <div><strong>Tracks:</strong> ${tracks.length}</div>${genreRow}
    </div>
  </div>
</div>

<div class="container">

  <div class="preamble">
    <h2>Overview</h2>
    <p>Initial scaffold generated from MusicBrainz metadata. Detailed structural analysis pending.</p>
    <p>Timestamps are approximate to ±3 seconds. BPM values are estimated from listen analysis.</p>
  </div>

${tracksHtml}
</div>

<div class="footer">
  <div class="container">
    Scaffold generated from MusicBrainz data — timestamps and analysis require manual completion.
  </div>
</div>

</body>
</html>
`;
}

export function buildJson(
  id: string,
  artist: string,
  title: string,
  year: number,
  genre: string,
  tracks: Track[],
  releaseDate: string,
  coverUrl = "",
): AlbumData {
  const totalMs   = tracks.reduce((sum, t) => sum + t.lengthMs, 0);
  const totalDur  = totalMs ? msToMmss(totalMs) : '?:??';
  const cleanCoverUrl = coverUrl.trim();

  const albumTracks: AlbumTrack[] = tracks.map(t => ({
    num:      t.num,
    title:    t.title,
    duration: t.lengthMs ? msToMmss(t.lengthMs) : '?:??',
    energy:   'mid',
    tags:     [],
    role:     'Initial scaffold only. Narrative role pending detailed listen.',
    events: [{
      timestamp:   '0:00',
      section:     'Opening section',
      description: 'Detailed timestamp notes pending.',
    }],
  }));

  return {
    id,
    artist,
    title,
    year,
    label:    '',
    producer: '',
    genre:    getDisplayGenre(genre),
    runtime:  totalDur,
    ...(cleanCoverUrl ? { coverUrl: cleanCoverUrl } : {}),
    overview: 'Initial scaffold generated from MusicBrainz metadata. Detailed structural analysis pending.\n\nTimestamps are approximate to ±3 seconds. BPM values are estimated from listen analysis.',
    tracks:   albumTracks,
  };
}