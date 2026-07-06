/**
 * format.ts — shared duration formatting for the browser runtime and the
 * scripts/ tooling. All M:SS conversions live here.
 */

/** Parse a M:SS or MM:SS duration string to total seconds. */
export function parseDuration(dur: string): number {
  const parts = dur.split(':').map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
}

/** Format total seconds to a M:SS display string. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format milliseconds to a M:SS display string. */
export function msToMmss(ms: number): string {
  return formatDuration(Math.floor(ms / 1000));
}
