/**
 * Resolve the scaffold year from the explicit CLI value or MusicBrainz data.
 *
 * MusicBrainz can return a complete date (for example, `1984-09-01`) or only
 * the year. A malformed or missing date falls back to the caller-provided
 * current year so this function remains deterministic and easy to test.
 */
export function resolveAlbumYear(
  providedYear: number,
  releaseDate: string | undefined,
  fallbackYear: number,
): number {
  if (Number.isInteger(providedYear) && providedYear > 0) return providedYear;

  const yearMatch = /^(\d{4})(?:-|$)/.exec(releaseDate?.trim() ?? "");
  const releaseYear = yearMatch ? Number(yearMatch[1]) : 0;
  return releaseYear > 0 ? releaseYear : fallbackYear;
}
