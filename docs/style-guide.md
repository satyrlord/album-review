# Style Guide

This document describes the current UI system for the site after the DaisyUI migration.

The source of truth is the shipped code in [src/album-analysis.css](../src/album-analysis.css), [src/site.ts](../src/site.ts), [src/index.ts](../src/index.ts), [src/album.ts](../src/album.ts), and [src/segment.ts](../src/segment.ts). If this guide and the code disagree, update this guide to match the code.

## Related Files

- [Workspace instructions](../.github/copilot-instructions.md)
- [Architecture notes](architecture-notes.md)
- [Shared stylesheet](../src/album-analysis.css)
- [Shared site chrome helpers](../src/site.ts)
- [Collection renderer](../src/index.ts)
- [Album renderer](../src/album.ts)
- [Segment chart renderer](../src/segment.ts)

## Core Rules

- All runtime CSS still lives in [src/album-analysis.css](../src/album-analysis.css). Do not add page-local `<style>` blocks or extra stylesheets.
- The stylesheet now starts with Tailwind CSS and DaisyUI configuration. Treat it as three layers in one file: Tailwind import, DaisyUI theme definition, and custom CSS for the bespoke pieces DaisyUI does not cover directly.
- Every HTML entry point sets `data-theme="dark"` on the root `<html>` element. The site remains dark-theme only.
- Prefer DaisyUI component classes in renderer output: `card`, `btn`, `badge`, `input`, and `alert` are now the default primitives.
- Keep the existing hook classes that the runtime and tests rely on: `site-nav`, `site-nav-link`, `site-footer`, `ix-card`, `track`, `timeline`, and the `segment-*` chart classes.
- When a per-instance accent is needed on collection cards, continue using the existing `style="--card-accent:..."` hook from [src/index.ts](../src/index.ts).
- Use custom CSS only for shared atmosphere or genuinely custom UI: page background treatment, track-event timeline rails, artist accent handling, and the segment chart.

## Theme System

The app customizes DaisyUI's `dark` theme directly inside [src/album-analysis.css](../src/album-analysis.css). Primary tokens are still exposed to the rest of the code through the legacy custom properties:

| Variable | Source | Use |
| --- | --- | --- |
| `--accent` | `--color-primary` | Primary green accents, artist accents, active highlights |
| `--accent2` | `--color-secondary` | Secondary red accents, emphasis, warning contrast |
| `--accent3` | custom constant | Tertiary violet glow and atmospheric accents |
| `--time` | `--color-warning` | Duration badges, counts, timestamps |
| `--warn` | `--color-error` | Error or hot-warning accents |
| `--bg` | `--color-base-100` | Global page background |
| `--surface` | `--color-base-200` | Card surfaces |
| `--surface2` | `--color-base-300` | Nested surfaces and chart backplates |

Design direction:

- Surfaces are translucent dark panels with blurred backdrops and strong shadows.
- Backgrounds use radial glows and a faint grid overlay rather than flat fill.
- Accent color should feel technical and luminous, not pastel or muted.

## Typography

Typography is configured through Tailwind theme variables in [src/album-analysis.css](../src/album-analysis.css):

| Utility | Font |
| --- | --- |
| `font-sans` | `DM Sans` |
| `font-mono` | `JetBrains Mono` |
| `font-display` | `Space Grotesk` |

Current usage:

- `Space Grotesk` is the display face for collection titles.
- `JetBrains Mono` is used for navigation, labels, metadata, timestamps, pills, badges, and footer chrome.
- `DM Sans` remains the default body copy face for long-form overview and note text.

## Shared Chrome

Shared navigation and footer are rendered by [src/site.ts](../src/site.ts).

### Navigation

- The nav shell is still `.site-nav`.
- Links are still `.site-nav-link` but are now DaisyUI `btn` variants.
- Collection pages center the nav; album heroes left-align it through shared CSS.
- Active page state is still expressed with `aria-current="page"`.

### Footer

- The footer root is still `.site-footer`.
- The version badge remains `.site-footer-version` and links to the GitHub repository.
- Optional context text still uses `.site-footer-context`.
- Optional action links still use `.site-footer-link`, but they are now DaisyUI-styled ghost buttons.

## Collection Pages

Home page uses [src/index.ts](../src/index.ts).

Structure:

- Static HTML provides the hero shell, search input, pill container, results bar, grid root, and footer mount point.
- The hero search shell is rendered by [src/site.ts](../src/site.ts) as a pill input with auto height plus a minimum height override so the `sm:text-lg` search text and placeholder do not clip.
- `.ix-filters` contains DaisyUI `btn` pills rendered by the collection script.
- `.ix-grid` remains the card grid and still hosts `.ix-card` anchors.

Collection card rules:

- `.ix-card` is now a DaisyUI `card` with the existing `--card-accent` hook preserved.
- `.ix-card-media` now always renders. When an album has no cached cover, or its referenced file fails to load, the shared `public/covers/fallback-cd-case.svg` artwork is shown instead.
- `.ix-card-title` remains the primary album title element.
- `.ix-card-artist` and `.ix-card-footer` inherit the per-artist accent color.
- Empty and error states still render as `.ix-empty` and `.ix-error`, now using DaisyUI `alert` styling.

## Album Pages

Album detail pages are still rendered dynamically by [src/album.ts](../src/album.ts).

Hero rules:

- The hero shell still uses `.hero` and `.hero-layout`; rendered album pages now always use `has-cover`, because missing or broken art falls back to the shared CD-case SVG.
- The subtitle is now rendered as a DaisyUI badge, but the hook class remains `.subtitle`.
- Metadata still lives in `.meta`, now as a responsive grid of `.meta-item` panels.
- The visible label format still includes a trailing colon, for example `Artist:` and `Label:`.
- Streaming links remain `.hero-link hero-link--spotify` and `.hero-link hero-link--youtube`, but use DaisyUI buttons.
- **`.hero-link--spotify` requires an explicit `color: var(--color-primary-content)` rule in [src/album-analysis.css](../src/album-analysis.css).** DaisyUI's `btn-primary` class does not reliably propagate `--color-primary-content` to the computed text colour on custom-classed elements, leaving it as the default `base-content` off-white. Any refactor of the Spotify button markup must keep this explicit rule, and the Playwright test `"Spotify button has dark text on bright primary background"` asserts the exact computed values (`background: rgb(0,255,136)`, `color: rgb(3,27,16)`) to catch regressions.

Track rules:

- Each track is still `.track`, now styled as a DaisyUI card.
- The header still exposes `.track-num`, `.track-title`, and `.track-duration`.
- Tags still live in `.track-tags` and remain `.tag` elements. The first tag is still the energy tag.
- Timeline entries still use `.timeline`, `.event`, `.event-time`, `.event-desc`, and `.detail`.
- The event rail and dots are still custom CSS, not DaisyUI components.

## Segment Chart

The track timeline chart remains a bespoke component rendered by [src/segment.ts](../src/segment.ts).

Rules:

- Keep `buildSegmentChart()` zero-dependency and DOM-safe.
- Continue building the chart with `createElement()` and `textContent` only.
- The chart root remains `.segment-chart` with `role="img"` and a descriptive `aria-label`.
- Rows still use `.segment-row`, and segments still use `.segment-item-wrapper` plus `.segment-item-title`.
- Labels and duration cells now use `.segment-row-label` and `.segment-row-duration`.
- Do not add percentage label spans unless the tests and accessibility contract are updated together.

## Responsive Behavior

- Collection grids collapse naturally through CSS grid and card sizing rather than page-specific hardcoded columns.
- Album heroes collapse from a two-column layout to a single-column stack below the large-screen breakpoint.
- Track timelines collapse their two-column timestamp/content layout into a single column on small screens.
- Footer content collapses from a three-column layout to a stacked layout below the tablet breakpoint.
- Segment chart rows collapse from label-bar-duration to a vertical stack on narrower screens.

## Editing Guidance

- When changing markup, prefer adding DaisyUI classes in the renderer rather than re-implementing component visuals in custom CSS.
- When a visual rule is required across multiple pages, add it to [src/album-analysis.css](../src/album-analysis.css) instead of duplicating utility strings everywhere.
- If you remove or rename any of the stable hook classes mentioned in this guide, update the Playwright tests in [tests/regression.spec.ts](../tests/regression.spec.ts) in the same change.
