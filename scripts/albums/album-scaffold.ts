import { msToMmss } from '../../src/shared/format.js';
import type { AlbumData, AlbumTrack } from '../../src/shared/schema.js';
import { getDisplayGenre, getGenreTags } from '../../src/shared/tags.js';
import { normaliseText } from '../../src/shared/text.js';

export interface Track {
  num: number;
  title: string;
  lengthMs: number;
}

export function slugify(text: string): string {
  let value = text.toLowerCase();

  value = value
    .replace(/[’‘']/g, "")
    .replace(/[–—]/g, "-")
    .replace(/ß/g, "ss")
    .replace(/…/g, "");

  value = normaliseText(value);
  value = value.replace(/[^a-z0-9\s-]/g, "");
  value = value.replace(/[\s_]+/g, "-").trim();
  value = value.replace(/-{2,}/g, "-");
  return value.replace(/^-|-$/g, "");
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
