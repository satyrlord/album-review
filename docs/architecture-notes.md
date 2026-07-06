# Architecture Notes

## File Structure

```text
index.html / album.html / credits.html
                           ← public Vite HTML entry points; current page URLs depend on these filenames
package.json               ← npm scripts for dev, build, serve, test, typecheck, markdown linting, and frontend dependencies
vite.config.ts             ← multi-page Vite config, build metadata injection, Tailwind/DaisyUI integration, Istanbul instrumentation, data copy
playwright.config.ts       ← Playwright regression config using a Vite web server
tsconfig.json              ← Node/tooling TypeScript project
tsconfig.browser.json      ← browser-runtime TypeScript project
.nycrc.json                ← nyc coverage reporting config

src/album-analysis.css     ← shared stylesheet (Tailwind import, DaisyUI theme layer, and bespoke component CSS)
src/site.ts                ← shared nav, footer, and build-metadata helpers
src/index.ts               ← collection renderer for index.html
src/album.ts               ← album detail renderer driven by data/<id>.json
src/credits.ts             ← credits page renderer listing musical, graphical, and technology sources

public/covers/             ← versioned local cover-art cache served directly by Vite

scripts/build.ts           ← full quality gate: data validation, Vite build, typecheck, markdownlint, coverage
scripts/test-coverage.ts   ← Playwright + nyc coverage runner and threshold enforcement
scripts/add-album.ts       ← MusicBrainz/Wikipedia album JSON scaffolder
scripts/cache-cover-art.ts ← downloads remote cover sources into public/covers/ and rewrites data/*.json to local paths
scripts/albums/*.ts        ← album data indexing, schema, and scaffold helpers

tests/baseFixtures.ts      ← Playwright fixtures, including Istanbul coverage capture
tests/regression.spec.ts   ← browser regression coverage for collection and detail pages

data/<id>.json             ← source of truth for each album
data/index.json            ← generated summary index derived from album JSON files (do not edit manually)

dist/                      ← generated production build output published to GitHub Pages
coverage/                  ← generated Istanbul HTML/LCOV coverage report
playwright-report/         ← generated Playwright HTML report
test-results/              ← generated Playwright artifacts
.nyc_output/               ← generated raw Istanbul coverage JSON
tmp/                       ← temporary/generated workspace files
```

The current root is intentionally narrower than before: browser runtime code now lives in `src/`, album tooling lives in `scripts/albums/`, and the remaining root-level source files are either public HTML entry points or toolchain config.

Vite serves each HTML file as an application entry point and bundles the browser code into `dist/assets/` for production. The frontend styling pipeline now runs through the Vite Tailwind plugin plus DaisyUI, while build metadata is still injected at bundle time via `vite.config.ts`. The `data/` directory is copied into `dist/data/` during the build.

## Root-Level Contract

- **The HTML entry files are part of the runtime contract**: `index.html`, `album.html`, and `credits.html` are referenced by `vite.config.ts`, shared navigation in `src/site.ts`, renderer links in `src/index.ts` and `src/album.ts`, Playwright tests, and the scaffolder output. Moving or renaming them is a route change, not a cosmetic cleanup.
- **Toolchain configs belong at the root**: `package.json`, `vite.config.ts`, `playwright.config.ts`, `tsconfig.json`, `tsconfig.browser.json`, and `.nycrc.json` are loaded from the workspace root by their respective tools.
- **Generated artifact folders are not source architecture**: `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.nyc_output/`, and `tmp/` are disposable outputs. If the next cleanup step is to move root clutter, these are the first candidates.
- **Generated artifact locations are currently hard-coded**: moving the coverage/report/temp directories would require coordinated edits in `.gitignore`, `.nycrc.json`, `playwright.config.ts`, `scripts/test-coverage.ts`, and `tests/baseFixtures.ts`.

## Build and Runtime Flow

`npm run build` executes `scripts/build.ts`, which does the following in order:

1. Validates `data/*.json` album records and regenerates `data/index.json`.
2. Runs the multi-page Vite production build.
3. Type-checks the Node/tooling and browser-runtime TypeScript projects separately.
4. Runs markdownlint across the workspace.
5. Runs the browser coverage gate through Playwright and nyc.

`npm run serve` and the Playwright web server both use Vite directly rather than a custom local server script.

## Agreed Architecture Decisions (2026-07-06 review — not yet implemented)

- **Shared core module at `src/shared/`**: one home for code needed by both the browser runtime and `scripts/` tooling. Dependency direction is one-way: `scripts/` may import from `src/shared/`, never the reverse. Layout is themed files: `schema.ts` (AlbumData, AlbumIndexEntry, EnergyLevel), `text.ts` (escapeHtml, normaliseText, fold-key), `tags.ts` (genre-tag helpers), `format.ts` (duration and version formatting). The duplicated copies in `src/album.ts`, `src/index.ts`, and `scripts/albums/` are deleted, not deprecated. The `escapeHtml` that survives is the `src/site.ts` dialect (escapes `"`).
- **Shared files must satisfy both module-resolution modes**: `tsconfig.json` uses NodeNext, `tsconfig.browser.json` uses Bundler — relative imports in `src/shared/` use explicit `.js` extensions, which both accept.
- **Browser file lists become globs**: `vite.config.ts` (istanbul include), `tsconfig.browser.json`, and `.nycrc.json` all switch from the hand-synced five-file list to `src/**/*.ts`. New browser modules are picked up with zero config edits; stray files become visible in typecheck and coverage rather than silently excluded.
- **Page-specific pure functions stay in their page modules**: helpers with a single caller (e.g. `matchesFilters`, `resolveStreamName`) are exported for direct testing but not moved to `src/shared/` — shared is only for code both sides of the seam need.
- **Unit tests run on Vitest**: pure-logic tests migrate from Playwright round-trips to a Vitest suite with direct imports. Playwright keeps only real page flows. The `window.AlbumReviewSite` global in `src/site.ts` is deleted once no test consumes it.
- **Two separate coverage gates**: the existing browser-only nyc gate (80% per file) stays unchanged; Vitest gets its own independent 80% coverage threshold scoped to `src/shared/**`. No merging of coverage streams.

## Language Constraints

- **Only TypeScript and JavaScript** — all scripting, tooling, and browser runtime code must be written in `.ts` or `.js`/`.mjs`.
- **No Python** — Python has no role in this project. Do not create `.py` files or suggest Python-based solutions.

## UI and Style Documentation

See [style-guide.md](style-guide.md) for the current DaisyUI theme tokens, typography, component anatomy, layout rules, and responsive behavior.

The live source of truth is the code in `src/album-analysis.css`, `src/site.ts`, `src/album.ts`, `src/index.ts`, and `src/segment.ts`. If documentation drifts, the code wins and the style guide should be updated.

## Editing Guidelines

- **Album data lives in `data/<id>.json` only**: do not duplicate album metadata elsewhere.
- **Cover art should be cached locally**: store versioned cover files under `public/covers/` and point `coverUrl` at the local `covers/<id>.<ext>` path.
- **`data/index.json` is generated**: never hand-edit it; regenerate it via `npm run build` or the scaffolder.
- **Generated report/temp directories are disposable**: do not treat `coverage/`, `playwright-report/`, `test-results/`, `.nyc_output/`, `dist/`, or `tmp/` as hand-maintained source folders.
- **When adding a new browser runtime file**, update the browser file lists in `vite.config.ts`, `.nycrc.json`, and `tsconfig.browser.json` so instrumentation, reporting, and browser type-checking remain aligned.
- **Analytical writing style**: precise, concise, technical music terminology. Avoid fluff. Third-person or noun-phrase constructions preferred.

## Extending the Project

### Steps to create a new analysis

1. Create or update `data/<id>.json`, or scaffold it with `npx tsx scripts/add-album.ts "Artist" "Album" YEAR --genre "..."`.
2. Keep `id` equal to the filename slug, cache cover art under `public/covers/`, and store the local `covers/<id>.<ext>` path in `coverUrl`.
3. Populate all tracks, roles, tags, and timeline events in the JSON structure defined by `scripts/albums/album-schema.ts`.
4. Run `npm run build` to regenerate `data/index.json`, rebuild `dist/`, and validate the current test/coverage gate.
