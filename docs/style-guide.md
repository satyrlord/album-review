# Style Guide

The source of truth is the shipped code in
[src/album-analysis.css](../src/album-analysis.css),
[src/site.ts](../src/site.ts), [src/index.ts](../src/index.ts),
[src/album.ts](../src/album.ts), and [src/segment.ts](../src/segment.ts).
If this guide and the code disagree, update this guide to match the code.

## Related Files

- [Workspace instructions](../.github/copilot-instructions.md)
- [Architecture notes](architecture-notes.md)
- [Shared stylesheet](../src/album-analysis.css)
- [Shared site chrome helpers](../src/site.ts)
- [Collection renderer](../src/index.ts)
- [Album renderer](../src/album.ts)
- [Segment chart renderer](../src/segment.ts)

## Core Rules

- All runtime CSS lives in [src/album-analysis.css](../src/album-analysis.css). Do not add page-local `<style>` blocks or extra stylesheets.
- The stylesheet starts with Tailwind CSS and DaisyUI configuration.
  Treat it as three layers in one file: Tailwind import, DaisyUI theme
  definition, and custom CSS for the bespoke pieces DaisyUI does not cover
  directly.
- Every HTML entry point sets `data-theme="dark"` on the root `<html>` element. The site is dark-theme only.
- Prefer DaisyUI component classes in renderer output: `card`, `btn`, `badge`, `input`, and `alert` are the default primitives.
- Keep the hook classes that the runtime and tests rely on: `site-nav`, `site-nav-link`, `site-footer`, `ix-card`, `track`, `timeline`, and the `segment-*` chart classes.
- When a per-instance accent is needed on collection cards, use the `style="--card-accent:..."` hook from [src/index.ts](../src/index.ts).
- Use custom CSS only for shared atmosphere or genuinely custom UI: page background treatment, track-event timeline rails, artist accent handling, and the segment chart.

## Theme System

The app customizes DaisyUI's `dark` theme directly inside [src/album-analysis.css](../src/album-analysis.css). Primary tokens are exposed to the rest of the code through custom-property aliases:

| Variable | Source | Use |
| --- | --- | --- |
| `--accent` | `--color-primary` | Primary green accents, active highlights |
| `--accent2` | `--color-secondary` | Secondary red accents, emphasis, warning contrast |
| `--accent3` | `--color-accent` | Tertiary violet glow, genre pills, atmospheric accents |
| `--time` | `--color-warning` | Duration badges, counts, timestamps |
| `--warn` | `--color-error` | Error or hot-warning accents |
| `--bg` | `--color-base-100` | Global page background |
| `--surface` | `--color-base-200` | Card surfaces |
| `--surface2` | `--color-base-300` | Nested surfaces and chart backplates |

Functional colors are reserved: `--time` amber means timestamps/counts,
`--warn` orange means errors. Artist identity colors on collection cards
come from a dedicated identity palette in [src/index.ts](../src/index.ts)
(green, pink, sky blue, lime, violet) and must never reuse the functional
hues. Every identity hue must pass WCAG AA (4.5:1) on the card surface at
the 12px artist-label size.

Design direction:

- Surfaces are translucent dark panels with blurred backdrops and strong shadows.
- Backgrounds use radial glows and a faint grid overlay rather than flat fill.
- Accent color should feel technical and luminous, not pastel or muted.
- `prefers-reduced-motion` disables hover transforms and transitions; `prefers-reduced-data` skips the backdrop image download entirely.

### Page backdrops

The 40 decorative backdrops are WebP files
(`public/images/header_NN.webp`, ~70 KB each) rendered at 10% opacity.
The active index is stored in `localStorage` (`siteBgIndex`). Users can
re-roll it with the "◱ Backdrop" button in the footer
(`.site-footer-shuffle-bg`, bound by `bindFooterControls()` in
[src/site.ts](../src/site.ts)); the Back to Home links on album and credits
pages also pick a fresh random backdrop.

## Typography

Web fonts are loaded through `<link rel="preconnect">` +
`<link rel="stylesheet">` tags in each HTML entry point (not a CSS
`@import`), with trimmed weight sets: DM Sans 400/500/700, JetBrains Mono
400/600, Orbitron 700, Space Grotesk 400–700. Tailwind theme variables in
[src/album-analysis.css](../src/album-analysis.css) map them to utilities:

| Utility | Font |
| --- | --- |
| `font-sans` | `DM Sans` |
| `font-mono` | `JetBrains Mono` |
| `font-display` | `Space Grotesk` |

In addition, `Orbitron` is applied directly (not through a Tailwind utility) to `.ix-brand-title` as the brand wordmark face, falling back to `--font-display`.

Current usage:

- `Orbitron` is the brand wordmark face for the ALBANA title.
- `Space Grotesk` is the display face for collection card titles and the credits h1.
- `JetBrains Mono` is the album-page h1 face (applied via the `font-mono`
  utility in the renderer — there is deliberately no blanket `.hero h1`
  font rule, so other pages can request `font-display`) and is used for
  navigation, labels, metadata, timestamps, pills, badges, and footer
  chrome.
- `DM Sans` is the default body copy face for long-form overview and note text.

Album and credits h1s accent one word with `--accent`: always the **last** word of the title.

## Shared Chrome

Shared navigation and footer are rendered by [src/site.ts](../src/site.ts).

### Navigation

- The nav shell is `.site-nav`.
- Links are `.site-nav-link`, styled as DaisyUI `btn` variants.
- Collection pages center the nav; album heroes left-align it through shared CSS.
- Active page state is expressed with `aria-current="page"`.

### Footer

- The footer root is `.site-footer`.
- The version badge is `.site-footer-version` and links to the GitHub repository.
- The backdrop shuffle control is `.site-footer-shuffle-bg`; pages that render the footer as a string must call `bindFooterControls()` after mounting.
- Optional context text uses `.site-footer-context`.
- Optional action links use `.site-footer-link`, styled as DaisyUI ghost buttons.

### Accessibility chrome

- Every HTML entry point starts with a `.skip-link` anchor targeting `#main`; each page renderer must give its main content region `id="main"`.
- Album pages render a `.back-to-top` button (bound by `bindBackToTop()` in [src/album.ts](../src/album.ts)) that appears after ~600px of scroll.
- Each page links `public/favicon.svg` and carries basic Open Graph / Twitter meta tags.

## Collection Pages

Home page uses [src/index.ts](../src/index.ts).

Structure:

- Static HTML provides the hero shell, search input, pill container, results bar (count plus the `#ixActiveFilters` chip container), grid root, and footer mount point.
- The hero search shell is rendered by [src/site.ts](../src/site.ts) as a
  pill input with auto height plus a minimum height override so the
  `sm:text-lg` search text and placeholder do not clip.
- The tag cloud renders two labelled groups (`.ix-tag-group-label`:
  "Artists", "Genres"). Genre pills beyond the top 10 by count collapse
  behind a `.ix-tag-expander` button; active tags always stay visible.
- Genre filters are AND-ed. A genre pill whose selection would produce
  zero results is `disabled` with `aria-disabled` instead of leading the
  user into an empty grid.
- Active filters render as removable `.ix-filter-chip` badges next to the count, with a `.ix-clear-filters` button that also resets the search. The no-results empty state repeats the clear action.
- `.ix-grid` is the card grid and hosts `.ix-card` anchors.

Collection card rules:

- `.ix-card` is a DaisyUI `card` with the `--card-accent` hook. Because
  the whole card is an anchor, nothing interactive may be nested inside
  it.
- `.ix-card-media` always renders. When an album has no cached cover,
  or its referenced file fails to load, the shared
  `public/covers/fallback-cd-case.svg` artwork is shown instead.
- Card and hero covers default to `object-position: top center`; if a
  specific sleeve needs a different focal point, scope that override
  with the image `data-album-id` hook instead of changing the shared
  default.
- `.ix-card-title` is the primary album title element and is an `h2` heading.
- Card body order is title → artist → year/tracks → genre tags. `.ix-card-genre-tag` elements are decorative `span`s with `pointer-events: none` — filtering happens only in the hero tag cloud.
- `.ix-card-artist` inherits the per-artist identity color; `.ix-card-footer` stays dim (`--text-dim`) and only takes the accent on card hover/focus.
- Empty and error states render as `.ix-empty` and `.ix-error`, using DaisyUI `alert` styling.
- The grid caps at 7 columns on 2xl viewports.

## Album Pages

Album detail pages are rendered dynamically by [src/album.ts](../src/album.ts).

Hero rules:

- The hero shell uses `.hero` and `.hero-layout`; rendered album pages always use `has-cover`, because missing or broken art falls back to the shared CD-case SVG.
- The subtitle is a DaisyUI badge (`badge-accent`, not the alarm-red
  secondary); the hook class is `.subtitle`. Shared CSS lets long badge
  text wrap inside the pill instead of overflowing on small screens.
- Metadata lives in `.meta` as a responsive grid of `.meta-item` panels (`minmax(7.5rem, 1fr)` so phones keep two columns).
- The visible label format includes a trailing colon, for example `Artist:` and `Label:`.
- Streaming links are `.hero-link hero-link--spotify` / `.hero-link--audio-stream` / `.hero-link--youtube`, styled as DaisyUI buttons.
- **Both `.hero-link--spotify` and `.hero-link--audio-stream` require the
  explicit `color: var(--color-primary-content)` rule in
  [src/album-analysis.css](../src/album-analysis.css).** DaisyUI's
  `btn-primary` class does not reliably propagate
  `--color-primary-content` to the computed text colour on custom-classed
  elements, leaving it as the default `base-content` off-white (invisible
  on the bright green fill). The Playwright tests `"Spotify button has
  dark text on bright primary background"` and `"audio-stream button has
  dark text on bright primary background"` assert the exact computed
  values (`background: rgb(0,255,136)`, `color: rgb(3,27,16)`) to catch
  regressions. Any new solid-primary hero button variant must be added to
  this selector list and get the same test.

Track rules:

- Each track is a `.track` card (DaisyUI `card`) and carries `id="track-<num>"` so the segment chart can deep-link to it.
- The header exposes `.track-num`, `.track-title` (an `h2` heading), and `.track-duration`.
- Tags live in `.track-tags` as `.tag` elements. The first tag is the energy tag.
- Timeline entries use `.timeline`, `.event`, `.event-time`, `.event-desc`, and `.detail`.
- The event rail and dots are custom CSS, not DaisyUI components.

## Segment Chart

The track timeline chart is a bespoke component rendered by [src/segment.ts](../src/segment.ts).

Rules:

- Keep `buildSegmentChart()` zero-dependency and DOM-safe.
- Build the chart with `createElement()` and `textContent` only.
- The chart root is `.segment-chart` with `role="list"` and a descriptive `aria-label`; each `.segment-row` is a `listitem`.
- Every `.segment-bar` spans the full width. Segments inside a bar are
  proportional to their section span, so each bar reads as a percentage
  breakdown of that one track's runtime — not the track's length
  relative to other tracks.
- Section colors are stable per section name across the whole chart, so
  "Peak" is the same color in every row *and* in the legend.
  `resolveSectionColors()` assigns one color per distinct name (keyed by
  `foldKey`), resolving hash collisions from `sectionColorIndex()` once
  globally instead of shifting colors per row.
- A `.segment-legend` (aria-hidden decorative key) follows the rows,
  mapping each section swatch to its name. It is hidden from assistive
  tech because every row already names its sections in the `sr-only`
  summary, keeping the `role="list"` container free of non-`listitem`
  children.
- When a row has an `href`, the `.segment-row-label` renders an anchor
  whose `aria-label` is a plain-language summary (label, duration,
  section list). Rows without links carry the same summary in an
  `sr-only` span. Bars and duration cells are `aria-hidden`.
- `.segment-item-title` labels are hidden below 640px — the color blocks still show structure and full names live in the track timelines.
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
