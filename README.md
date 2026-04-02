# Album Structural Analysis

Deep-listening notes for albums — track-by-track timestamp breakdowns covering structure, production technique, energy arc, and musical function. Rendered as a static web app with a shared dark-theme design system.

**Live site →** <https://satyrlord.github.io/album-review/>

---

## What's Here

| File | Purpose |
| ------ | --------- |
| `index.html` | Album index — filterable card grid, fetches `data/index.json` |
| `album.html` | Dynamic album detail page, fetches `data/<id>.json` |
| `data/<id>.json` | Source of truth for each album analysis |
| `data/index.json` | Generated album summary index derived from `data/*.json` |
| `album-analysis.css` | Shared stylesheet — single source of truth for all design tokens and components |
| `add_album.ts` | MusicBrainz/Wikipedia scaffolder for new album JSON files |

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

The only source of truth is `data/<id>.json`.

1. Create a new album JSON directly, or use the scaffold with `npx tsx add_album.ts "Artist Name" "Album Title" YEAR --genre "Genre / Subgenre"`.

2. Ensure the JSON includes the album metadata, overview, track analysis, and optional `coverUrl`.

3. Run the quality gate with `npm run build` to regenerate browser artifacts and `data/index.json`.

4. Verify locally with `npm run serve`.

Then open:

- `http://127.0.0.1:3000/index.html`
- `http://127.0.0.1:3000/album.html?id=<id>`

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

The site deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

Because Pages serves committed static files directly, run `npm run build` before pushing so `index.js`, `album.js`, and `data/index.json` stay in sync with `data/*.json`.

To enable for a new fork:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the workflow handles the rest
