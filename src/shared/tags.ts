/**
 * tags.ts — shared genre-tag model. Deriving tags from the genre display
 * string and collapsing spelling variants both live here; the browser
 * reads the derived `genreTags` arrays produced by this module via the
 * scaffolder and index generator.
 */

import type { AlbumIndexEntry } from './schema.js';
import { foldKey } from './text.js';

const COMMENT_ONLY = /^\s*<!--[\s\S]*?-->\s*$/;

/** The genre display string, or "" when blank or a placeholder comment. */
export function getDisplayGenre(genre: string): string {
  const value = genre.trim();
  return value && !COMMENT_ONLY.test(value) ? value : '';
}

/** Split the genre display string on "/" into trimmed, non-empty tags. */
export function getGenreTags(genre: string): string[] {
  const value = getDisplayGenre(genre);
  if (!value) return [];

  return value
    .split('/')
    .map(tag => tag.trim())
    .filter(Boolean);
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
      const key = foldKey(tag);
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
      const display = canonical.get(foldKey(tag)) ?? tag;
      if (!seen.has(display)) {
        seen.add(display);
        genreTags.push(display);
      }
    }
    return { ...entry, genreTags };
  });
}
