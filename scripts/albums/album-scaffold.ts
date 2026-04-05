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

export function getGenreTags(genre: string): string[] {
  const value = getDisplayGenre(genre);
  if (!value) return [];

  return value
    .split("/")
    .map(tag => tag.trim())
    .filter(Boolean);
}

/**
 * Build a scaffold album JSON document from imported metadata.
 * Empty or whitespace-only cover URLs are treated as missing and omitted.
 */
export function buildJson(
  id: string,
  artist: string,
  title: string,
  year: number,
  genre: string,
  tracks: Track[],
  coverUrl?: string,
): AlbumData {
  const totalMs   = tracks.reduce((sum, t) => sum + t.lengthMs, 0);
  const totalDur  = totalMs ? msToMmss(totalMs) : '?:??';
  const cleanCoverUrl = coverUrl?.trim() ?? '';
  const displayGenre = getDisplayGenre(genre);

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
    genre:    displayGenre,
    genreTags: getGenreTags(genre),
    runtime:  totalDur,
    ...(cleanCoverUrl ? { coverUrl: cleanCoverUrl } : {}),
    overview: 'Initial scaffold generated from MusicBrainz metadata. Detailed structural analysis pending.\n\nTimestamps are approximate to ±3 seconds. BPM values are estimated from listen analysis.',
    tracks:   albumTracks,
  };
}