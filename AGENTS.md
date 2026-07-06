# Project ALBANA - Agent instructions

## Project Purpose

This workspace contains AI-assisted structural analysis notes for albums, rendered as a lightweight static web app backed by JSON data files and a single shared stylesheet.

Consult `docs/architecture-notes.md` before changing the application structure, UI conventions, data layout, or project-specific editing rules.

Consult `docs/business-rules.md` before changing business logic, business rules, product behavior, or non-technical specifications.

Consult `docs/style-guide.md` for the current theme tokens, typography, component anatomy, responsive rules, and markup conventions.

Consult `docs/writing-guide.md` for rules on writing album overviews, track roles, timeline events, tags, and analytical style.

---

## What's Here

| File | Purpose |
| ------ | --------- |
| `index.html` | Album index — filterable card grid, fetches `data/index.json` |
| `album.html` | Dynamic album detail page, fetches `data/<id>.json` |
| `src/site.ts` | Shared site utilities, including the footer renderer and version display logic |
| `src/segment.ts` | Bespoke segment chart renderer for track timeline visualisation |
| `src/credits.ts` | Credits page renderer listing musical, graphical, and technology sources |
| `vite.config.ts` | Multi-page Vite config, build metadata injection, and Istanbul coverage setup |
| `data/<id>.json` | Source of truth for each album analysis |
| `data/index.json` | Generated album summary index derived from `data/*.json` |
| `src/album-analysis.css` | Shared stylesheet — single source of truth for all design tokens and components |
| `scripts/add-album.ts` | MusicBrainz/Wikipedia scaffolder for new album JSON files |
| `docs/writing-guide.md` | Rules for writing album overviews, track roles, timeline events, and analytical style |

---

## Adding a New Album

1. Create a new album JSON directly, or use the scaffold with `npx tsx scripts/add-album.ts "Artist Name" "Album Title" YEAR --genre "Genre / Subgenre"`.

   When a request covers multiple albums, split the work by album and run the album-analysis workflow in parallel using multiple sub-agents whenever feasible. Assign one sub-agent per album, then reconcile the outputs in the main agent before the final build and validation pass.

2. Ensure the JSON includes the album metadata, overview, track analysis, and optional `coverUrl`.

3. Run the quality gate with `npm run build` to regenerate `data/index.json` and the production `dist/` build.

4. Verify locally with `npm run serve`.

- `http://127.0.0.1:3000/index.html`
- `http://127.0.0.1:3000/album.html?id=<id>`

---

## Design System

Update the style guide whenever `src/album-analysis.css` or the page renderers change.

---

## Testing and Coverage

Use VSCode simple browser for visual inspection. Avoid opening external browsers.

When running `npm run test:coverage`, maintain a minimum of 80% in every reported Istanbul coverage table cell. This applies to the overall summary and to each reported file across statements, branches, functions, and lines.

When adding a new browser runtime TypeScript file, update the browser-file include lists in `vite.config.ts`, `.nycrc.json`, and `tsconfig.browser.json` so instrumentation, reporting, and browser type-checking stay aligned.

If any coverage cell drops below 80%, add or update tests before considering the work complete.

---

## Deployment

The site deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

GitHub Actions now builds the site with Vite and publishes `dist/`, so local pushes only need the source files plus a clean `npm run build` result.
