# Album Structural Analysis

Deep-listening notes for albums — track-by-track timestamp breakdowns covering structure, production technique, energy arc, and musical function. Rendered as a static web app with a shared dark-theme design system.

**Live site →** <https://satyrlord.github.io/album-review/>

---

## What's Here

| File | Purpose |
| ------ | --------- |
| `index.html` | Album index — filterable card grid, reads `albums.js` |
| `albums.js` | Data manifest — the **only** file to edit when adding an album |
| `album-analysis.css` | Shared stylesheet — single source of truth for all design tokens and components |
| `<artist>-<album-slug>-structural-analysis.html` | One file per album — data only, no inline CSS |

## Albums Covered

| Artist | Album | Year |
| -------- | ------- | ------ |
| Jean-Michel Jarre | Oxygène | 1976 |
| Jean-Michel Jarre | Equinoxe | 1978 |
| Jean-Michel Jarre | Les Chants Magnétiques | 1981 |
| Jean-Michel Jarre | Oxygène 7–13 | 1997 |
| Jean-Michel Jarre | Oxygène 3 | 2016 |
| Mike Oldfield | Tubular Bells | 1973 |
| Mike Oldfield | Tubular Bells II | 1992 |
| Mike Oldfield | Tubular Bells III | 1998 |
| The Prodigy | Music for the Jilted Generation | 1994 |
| The Prodigy | The Fat of the Land | 1997 |

---

## Adding a New Album

**Step 1 — Create the HTML analysis file.**

Filename convention: `<artist-slug>-<album-slug>-structural-analysis.html`

Every file must start with this `<head>` — no inline styles:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Structural Analysis — Album Title</title>
<link rel="stylesheet" href="album-analysis.css">
</head>
```

**Step 2 — Register it in `albums.js`.**

Add one object to the `window.ALBUMS` array:

```js
{
  file:   'artist-album-structural-analysis.html',
  artist: 'Artist Name',
  title:  'Album Title',
  year:   2024,
  tracks: 10,
  genre:  'Genre / Subgenre'
}
```

That's it. `index.html` picks it up automatically — no other changes required.

---

## Design System

All styles live in `album-analysis.css`. Never add `<style>` blocks or inline `style=` attributes to HTML files.

### Color Tokens

| Variable | Value | Usage |
| ---------- | ------- | ------- |
| `--bg` | `#0a0a0c` | Page background |
| `--surface` | `#111115` | Card / component background |
| `--surface2` | `#18181e` | Nested surface |
| `--border` | `#2a2a35` | Dividers, outlines |
| `--text` | `#e0ddd8` | Primary text |
| `--text-dim` | `#777780` | Secondary / muted text |
| `--accent` | `#00ff88` | Green — headings, track numbers |
| `--accent2` | `#ff3366` | Red — peaks, emphasis |
| `--accent3` | `#6644ff` | Purple — tertiary accent |
| `--time` | `#ffaa00` | Amber — timestamps, durations |
| `--warn` | `#ff6633` | Orange — transitions |

### Energy Tags

Exactly one per track, placed first in `.track-tags`:

| Class | Meaning |
| ------- | --------- |
| `.energy-low` | Calm, atmospheric, slow build |
| `.energy-mid` | Mid-tempo, groove |
| `.energy-high` | High-energy, rave, fast breakbeat |
| `.energy-peak` | Maximum intensity, climax |

---

## Deployment

The site deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. No build step — static files are served directly from the repository root.

To enable for a new fork:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the workflow handles the rest
