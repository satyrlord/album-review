/**
 * theme.ts — selectable colour themes.
 *
 * The site ships several DaisyUI themes defined in album-analysis.css. This
 * module owns the runtime side: the theme registry, persistence in
 * localStorage, applying the stored theme to <html data-theme>, and the hero
 * theme-switcher control that every page mounts.
 *
 * `dark` is the default and the value baked into each HTML entry point, so a
 * first visit (or a cleared store) always renders the historical ALBANA look.
 */

import { escapeHtml } from "./shared/text.js";

export interface ThemeOption {
  /** DaisyUI theme name — the value written to <html data-theme>. */
  id: string;
  /** Human-readable label shown in the switcher. */
  label: string;
}

/** The selectable themes, in switcher order. `dark` leads as the default. */
export const THEMES: readonly ThemeOption[] = [
  { id: "dark", label: "Dark" },
  { id: "cosmic", label: "Cosmic" },
  { id: "retro", label: "Retro" },
  { id: "vintage", label: "Vintage" },
  { id: "sega", label: "Sega" },
  { id: "minimal", label: "Minimal" },
];

export const DEFAULT_THEME_ID = "dark";
const THEME_LS_KEY = "siteThemeId";

/** Is `id` one of the registered themes? */
export function isKnownTheme(id: string | null): id is string {
  return id !== null && THEMES.some(theme => theme.id === id);
}

/**
 * Resolve the stored theme id, falling back to the default when nothing is
 * stored or the stored value is not a registered theme.
 */
export function getStoredThemeId(): string {
  const stored = localStorage.getItem(THEME_LS_KEY);
  return isKnownTheme(stored) ? stored : DEFAULT_THEME_ID;
}

/** Apply the stored theme to the document root. Safe to call on every page. */
export function applyStoredTheme(): void {
  document.documentElement.dataset["theme"] = getStoredThemeId();
}

/**
 * Persist and apply a theme. Unknown ids fall back to the default so a stale
 * or hand-edited value can never leave the page without a theme.
 */
export function setTheme(id: string): void {
  const resolved = isKnownTheme(id) ? id : DEFAULT_THEME_ID;
  localStorage.setItem(THEME_LS_KEY, resolved);
  document.documentElement.dataset["theme"] = resolved;
}

/** Hero switcher markup — a labelled <select> listing every theme. */
export function renderThemeSwitcher(): string {
  const current = getStoredThemeId();
  const options = THEMES.map(theme => {
    const selected = theme.id === current ? " selected" : "";
    return `<option value="${escapeHtml(theme.id)}"${selected}>${escapeHtml(theme.label)}</option>`;
  }).join("");

  return (
    `<label class="theme-switcher" for="siteTheme">` +
    `<span class="theme-switcher-label">Theme</span>` +
    `<select class="theme-switcher-select select select-sm select-bordered border-base-300/60 bg-base-100/40 rounded-full" id="siteTheme" aria-label="Select colour theme">` +
    options +
    `</select>` +
    `</label>`
  );
}

/** Wire the switcher's change handler after its markup lands in the DOM. */
export function bindThemeControls(root: ParentNode = document): void {
  root.querySelector<HTMLSelectElement>(".theme-switcher-select")
    ?.addEventListener("change", event => {
      setTheme((event.target as HTMLSelectElement).value);
    });
}
