/**
 * validate.ts — per-record validation for AlbumData documents. Lives
 * beside the schema type it validates. Cross-file checks (id↔filename,
 * duplicate ids) belong to scripts/albums/album-index.ts, which sees the
 * whole data/ directory.
 */

import type { AlbumData } from './schema.js';

/** Issues with a single parsed data/<id>.json document; [] when valid. */
export function getAlbumDataIssues(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['must be a JSON object matching AlbumData'];
  }

  const album = value as Partial<AlbumData>;
  const issues: string[] = [];

  if (typeof album.id !== 'string' || !album.id.trim()) {
    issues.push('id is required');
  }
  if (typeof album.artist !== 'string' || !album.artist.trim()) {
    issues.push('artist is required');
  }
  if (typeof album.title !== 'string' || !album.title.trim()) {
    issues.push('title is required');
  }
  if (typeof album.year !== 'number' || !Number.isFinite(album.year)) {
    issues.push('year must be a number');
  }
  if (typeof album.genre !== 'string') {
    issues.push('genre must be a string');
  }

  if (!Array.isArray(album.genreTags)) {
    issues.push('genreTags must be a non-empty array of genre/subgenre tags');
  } else {
    const hasOnlyNonEmptyStrings = album.genreTags.every(tag => typeof tag === 'string' && !!tag.trim());
    if (!hasOnlyNonEmptyStrings) {
      issues.push('genreTags entries must be non-empty strings');
    }
    if (album.genreTags.length < 1) {
      issues.push('genreTags must be a non-empty array of genre/subgenre tags');
    }
  }

  if (typeof album.runtime !== 'string' || !album.runtime.trim()) {
    issues.push('runtime is required');
  }
  if (typeof album.overview !== 'string' || !album.overview.trim()) {
    issues.push('overview is required');
  }
  if (!Array.isArray(album.tracks)) {
    issues.push('tracks must be an array');
  }

  return issues;
}
