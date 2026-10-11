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

  const releaseYear = parseReleaseYear(releaseDate?.trim() ?? "");
  return releaseYear > 0 ? releaseYear : fallbackYear;
}

/** Year of a well-formed `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` date; 0 otherwise. */
function parseReleaseYear(releaseDate: string): number {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(releaseDate);
  if (!match) return 0;

  const year = Number(match[1]);
  if (year < 1) return 0;
  if (match[2] === undefined) return year;

  const month = Number(match[2]);
  if (month < 1 || month > 12) return 0;
  if (match[3] === undefined) return year;

  const day = Number(match[3]);
  // Day 0 of the next month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth ? year : 0;
}
