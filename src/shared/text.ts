/**
 * text.ts — shared text transforms used by both the browser runtime and
 * the scripts/ tooling. One dialect of each transform lives here; page
 * modules and scaffolding must not re-implement them.
 */

/** Escape a value for interpolation into HTML (escapes `&`, `<`, `>`, `"`). */
export function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Accent-insensitive fold: strip combining marks and lowercase. */
export function normaliseText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Reduce a label to a stable comparison key: lowercase with everything but
 * `a-z0-9` removed. Used to collapse spelling variants of the same label
 * ("New Age" vs "New-Age") and to hash section names to palette slots.
 */
export function foldKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
