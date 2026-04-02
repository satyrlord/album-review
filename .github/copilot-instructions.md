# Workspace Instructions — New Album AI Notes

## Project Purpose

This workspace contains AI-assisted structural analysis notes for albums, rendered as a lightweight static web app backed by JSON data files and a single shared stylesheet.

## File Structure

```text
album-analysis.css          ← shared styles (single source of truth)
index.html / index.ts       ← album index UI, driven by data/index.json
album.html / album.ts       ← album detail UI, driven by data/<id>.json
data/<id>.json              ← source of truth for each album
data/index.json             ← generated summary index derived from data/*.json (do not edit manually)
```

There is lightweight tooling in TypeScript. Run `npm run build` after changing album data so generated browser files and `data/index.json` stay in sync.

## Language Constraints

- **Only TypeScript and JavaScript** — all scripting (tooling, scaffolding, automation) must be written in `.ts` or `.js`/`.mjs`. TypeScript files should be run via `tsx` or compiled with `tsc`.
- **No Python** — Python is not executable in a browser and has no role in this project. Do not create `.py` files or suggest Python-based solutions.

## HTML Document Conventions

### CSS Custom Properties (theme tokens)

| Variable       | Value     | Usage                          |
|----------------|-----------|--------------------------------|
| `--bg`         | `#0a0a0c` | Page background                |
| `--surface`    | `#111115` | Card / component background    |
| `--surface2`   | `#18181e` | Nested surface                 |
| `--border`     | `#2a2a35` | Dividers, outlines             |
| `--text`       | `#e0ddd8` | Primary text                   |
| `--text-dim`   | `#777780` | Secondary / muted text         |
| `--accent`     | `#00ff88` | Green — headings, track nums   |
| `--accent2`    | `#ff3366` | Red — peaks, emphasis          |
| `--accent3`    | `#6644ff` | Purple — tertiary accent       |
| `--time`       | `#ffaa00` | Amber — timestamps, durations  |
| `--warn`       | `#ff6633` | Orange — warnings, transitions |

All tokens are defined in `album-analysis.css` `:root`. Always use these variables; never hardcode hex values inline.

### Typography

- **Body copy**: `DM Sans`, weight 300, line-height 1.7–1.8
- **Headings / labels / code**: `JetBrains Mono`, weight 300/400/600
- **Section titles**: `Space Grotesk`, weight 400/600/700

### Component Anatomy

**Track section** (`.track`):

```html
<section class="track">
  <div class="track-header">
    <span class="track-num">01</span>
    <span class="track-title">Track Name</span>
    <span class="track-duration">5:23</span>
  </div>
  <div class="track-tags">
    <span class="tag energy-low|energy-mid|energy-high|energy-peak">label</span>
    <!-- additional descriptive tags (no energy modifier) -->
  </div>
  <p class="track-role">Narrative role of the track in the album arc.</p>
  <div class="timeline">
    <!-- event entries -->
  </div>
</section>
```

**Timeline Event** (`.event`):

```html
<div class="event">
  <span class="timestamp">0:00</span>
  <div>
    <strong>Section Name</strong> — description of what happens musically / structurally.
  </div>
</div>
```

**Energy tags** — exactly one per track, placed first in `.track-tags`:

- `.energy-low` — calm, atmospheric, build
- `.energy-mid` — mid-tempo, groove
- `.energy-high` — high-energy, rave, breakbeat
- `.energy-peak` — maximum intensity, climax

Additional tags (no modifier class) describe genre, technique, mood, or significance.

### Sectioning / Layout

- `.hero` — page title, album meta, radial gradient background effects
- `.container` — `max-width: 900px; margin: 0 auto`
- `.preamble` — introductory analysis paragraph under a green mono heading
- `.track` sections are separated by `border-bottom: 1px solid var(--border)`

## Editing Guidelines

- **Central stylesheet only**: all CSS lives in `album-analysis.css`. Do not add `<style>` blocks or inline `style=` attributes to any HTML file; do not introduce additional external stylesheets or JS files.
- **Album data lives in `data/<id>.json` only**: do not add album metadata to root-level manifests or duplicate it outside `data/`.
- **`data/index.json` is generated**: never hand-edit it; regenerate it via `npm run build` or the scaffolder.
- **Adding new shared styles**: if a new component or rule is needed across files, add it to `album-analysis.css` — never duplicate it per-file.
- **Dark theme is non-negotiable**: never add light-mode rules or override color variables.
- **Add tracks in sequence** using the established `.track` markup; increment `.track-num` in two-digit zero-padded format (01, 02 …).
- **Timestamps** in `.event` use `M:SS` or `MM:SS` format matching the `--time` color.
- **Analytical writing style**: precise, concise, technical music terminology. Avoid fluff. Third-person or noun-phrase constructions preferred.

## Extending the Project

### Steps to create a new analysis

1. Create or update `data/<id>.json`, or scaffold it with `npx tsx add_album.ts "Artist" "Album" YEAR --genre "..."`.
2. Keep `id` equal to the filename slug and store optional cover art in `coverUrl` inside that JSON.
3. Populate all tracks, roles, tags, and timeline events in the JSON structure defined by `album-schema.ts`.
4. Run `npm run build` to regenerate `data/index.json`, `index.js`, and `album.js`.
