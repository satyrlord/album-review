/**
 * album-schema.ts — shared TypeScript types for album analysis JSON data.
 *
 * AlbumData is the canonical shape stored in data/<id>.json.
 * All other tooling (renderer, scaffold, build checker) imports from here.
 */

/** Energy level for a track — maps to CSS class `energy-<level>` */
export type EnergyLevel = 'low' | 'mid' | 'high' | 'peak';

/** A single timestamped structural event within a track's timeline */
export interface TimelineEvent {
  /** Timestamp in M:SS or MM:SS format, e.g. "0:00" or "12:34" */
  timestamp: string;
  /** Section label, e.g. "Intro", "Drop", "Breakdown", "Outro" */
  section: string;
  /** One-sentence description of what happens structurally / musically */
  description: string;
  /** Optional deeper annotation — shown as sub-detail beneath description */
  detail?: string;
}

/** Full analysis data for a single track */
export interface AlbumTrack {
  /** 1-based track number */
  num: number;
  title: string;
  /** Duration in M:SS or MM:SS format, e.g. "5:23" */
  duration: string;
  /** Overall energy classification for the track */
  energy: EnergyLevel;
  /** 2–5 descriptive tags (genre, technique, mood, etc.) — no energy modifier */
  tags: string[];
  /** 1–3 sentence narrative role of the track in the album arc, prefixed "Album role:" */
  role: string;
  /** 2–14 timestamped structural moments, scaled to track length */
  events: TimelineEvent[];
}

/** Top-level album analysis document — stored as data/<id>.json */
export interface AlbumData {
  /**
   * Stable slug identifier, e.g. "vangelis-voices".
   * Must match the filename: data/<id>.json
   */
  id: string;
  artist: string;
  title: string;
  year: number;
  label: string;
  producer: string;
  genre: string;
  /** 1–9 individual genre/subgenre tags derived from genre by splitting "/" and trimming whitespace; must include at least one non-empty tag */
  genreTags: string[];
  /** Total runtime in M:SS or H:MM:SS format */
  runtime: string;
  /** Optional remote or local album-cover image path */
  coverUrl?: string;
  /** Presence-only flag for soundtrack albums; omit when false */
  isSoundtrack?: boolean;
  /** Spotify album URL */
  spotifyUrl?: string;
  /** YouTube album URL */
  youtubeUrl?: string;
  /** Alternative audio streaming URL — used when Spotify is unavailable (e.g. Apple Music, Deezer) */
  audioStreamUrl?: string;
  /** 3–8 sentence analytical overview, one or two paragraphs */
  overview: string;
  tracks: AlbumTrack[];
}

/** Shape of a single entry in data/index.json */
export interface AlbumIndexEntry {
  /** Stable slug — must match data/<id>.json */
  id: string;
  artist: string;
  title: string;
  year: number;
  tracks: number;
  genre: string;
  /** 1–9 individual genre/subgenre tags derived from genre by splitting "/" and trimming whitespace */
  genreTags: string[];
  /** Optional remote or local thumbnail URL for the album cover */
  coverUrl?: string;
  /** Presence-only flag copied into the index only when the source album sets true */
  isSoundtrack?: boolean;
}
