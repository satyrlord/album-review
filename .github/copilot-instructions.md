# Workspace Instructions — New Album AI Notes

## Project Purpose

This workspace contains AI-assisted structural analysis notes for albums, rendered as lightweight static HTML files sharing a single central stylesheet.

## File Structure

```
album-analysis.css                                                 ← shared styles (single source of truth)
<artist>-<album-slug>-structural-analysis.html  ← one file per album (data only)
```

No build system, no package manager. Open any HTML file directly in a browser.

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
- **Adding new shared styles**: if a new component or rule is needed across files, add it to `album-analysis.css` — never duplicate it per-file.
- **Dark theme is non-negotiable**: never add light-mode rules or override color variables.
- **Add tracks in sequence** using the established `.track` markup; increment `.track-num` in two-digit zero-padded format (01, 02 …).
- **Timestamps** in `.event` use `M:SS` or `MM:SS` format matching the `--time` color.
- **Analytical writing style**: precise, concise, technical music terminology. Avoid fluff. Third-person or noun-phrase constructions preferred.

## Extending the Project

### HTML boilerplate for a new album

Every HTML file must follow this `<head>` structure — no inline styles, just a single link to the shared stylesheet:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Structural Analysis — Artist · Album Title (Year)</title>
<link rel="stylesheet" href="album-analysis.css">
</head>
```

### Steps to create a new analysis

1. Create `<artist>-<album-slug>-structural-analysis.html` using the boilerplate `<head>` above.
2. Update `<title>`, `.hero h1`, and `.hero .subtitle`.
3. Populate all `.track` sections with the new album's tracks.
4. If the album warrants a distinct visual identity, override only the relevant CSS custom properties in a **single** `<style>` block scoped to that file — document the change here. This is the one exception to the no-inline-style rule.
