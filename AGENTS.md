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

   When a request covers multiple albums, split the work by album and run
   the album-analysis workflow in parallel using multiple sub-agents
   whenever feasible. Assign one sub-agent per album, then reconcile the
   outputs in the main agent before the final build and validation pass.

2. Ensure the JSON includes the album metadata, overview, track analysis, and optional `coverUrl`.

3. Run the quality gate with `npm run build` to regenerate `data/index.json` and the production `dist/` build.

4. Verify locally with `npm run serve`.

   - `http://127.0.0.1:3000/index.html`
   - `http://127.0.0.1:3000/album.html?id=<id>`

5. After the album JSON is committed, remove the corresponding entry from
   `docs/future-research.md` if it is still listed there. Check by matching
   the artist and album title against the table rows.

---

## Design System

Update the style guide whenever `src/album-analysis.css` or the page renderers change.

---

## Testing and Coverage

Use VSCode simple browser for visual inspection. Avoid opening external browsers.

When running `npm run test:coverage`, maintain a minimum of 80% in every
reported Istanbul coverage table cell. This applies to the overall summary
and to each reported file across statements, branches, functions, and
lines.

`vite.config.ts`, `.nycrc.json`, and `tsconfig.browser.json` glob
`src/**/*.ts`, so new browser runtime files are picked up automatically —
no config edits needed. New files under `src/shared/` are gated by the
Vitest unit-coverage threshold instead; give them unit tests.

If any coverage cell drops below 80%, add or update tests before considering the work complete.

Pull requests targeting `main` must pass the
`Pull Request Quality Gate / Validate, test, and build` check. The gate runs
`npm run validate`, `npm run test:unit`, the Playwright regression suite
with `npm test`, and `npm run build`. Do not merge dependency updates while
this check is missing, pending, or failing.

---

## Deployment

The site deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

GitHub Actions builds the site with Vite and publishes `dist/`, so local pushes only need the source files plus a clean `npm run build` result.
