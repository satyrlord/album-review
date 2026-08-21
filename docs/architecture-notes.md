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
src/site.ts                ← shared page chrome: footer, hero, cover fallbacks, build metadata, mountPage seam
src/index.ts               ← collection renderer for index.html
src/album.ts               ← album detail renderer driven by data/<id>.json
src/credits.ts             ← credits page renderer listing musical, graphical, and technology sources

src/shared/schema.ts       ← canonical AlbumData/AlbumIndexEntry/EnergyLevel/SiteBuildMeta types
src/shared/text.ts         ← escapeHtml, normaliseText, foldKey — one dialect of each
src/shared/tags.ts         ← genre-tag derivation and canonicalisation
src/shared/format.ts       ← parseDuration, formatDuration, msToMmss
src/shared/validate.ts     ← per-record AlbumData validation (beside the schema)

public/covers/             ← versioned local cover-art cache served directly by Vite

scripts/build.ts           ← full quality gate: data validation, Vite build, typecheck, markdownlint, coverage
scripts/quality-gate-steps.ts ← fail-fast, testable quality-gate step runner
scripts/test-coverage.ts   ← Playwright + nyc coverage runner and threshold enforcement
scripts/add-album.ts       ← MusicBrainz/Wikipedia album JSON scaffolder
scripts/cache-cover-art.ts ← downloads remote cover sources into public/covers/ and rewrites data/*.json to local paths
scripts/albums/*.ts        ← album data indexing, release-year resolution, cross-file checks, and scaffold helpers

vitest.config.ts           ← Vitest unit-test config with the src/shared coverage gate
tests/baseFixtures.ts      ← Playwright fixtures, including Istanbul coverage capture
tests/regression.spec.ts   ← browser regression coverage for collection and detail pages
tests/unit/*.test.ts       ← Vitest unit tests for shared core and exported page helpers

data/<id>.json             ← source of truth for each album
data/index.json            ← generated summary index derived from album JSON files (do not edit manually)

dist/                      ← generated production build output published to GitHub Pages
coverage/                  ← generated Istanbul HTML/LCOV coverage report (browser gate)
coverage-unit/             ← generated Vitest coverage output (shared-core gate)
playwright-report/         ← generated Playwright HTML report
test-results/              ← generated Playwright artifacts
.nyc_output/               ← generated raw Istanbul coverage JSON
tmp/                       ← temporary/generated workspace files
```

The root is intentionally narrow: browser runtime code lives in `src/`,
album tooling lives in `scripts/albums/`, and the remaining root-level
source files are either public HTML entry points or toolchain config.

Vite serves each HTML file as an application entry point and bundles the
browser code into `dist/assets/` for production. The frontend styling
pipeline runs through the Vite Tailwind plugin plus DaisyUI, and build
metadata is injected at bundle time via `vite.config.ts`.
The `data/` directory is copied into `dist/data/` during the build.

## Root-Level Contract

- **The HTML entry files are part of the runtime contract**:
  `index.html`, `album.html`, and `credits.html` are referenced by
  `vite.config.ts`, shared navigation in `src/site.ts`, renderer links
  in `src/index.ts` and `src/album.ts`, Playwright tests, and the
  scaffolder output. Moving or renaming them is a route change, not a
  cosmetic cleanup.
- **Toolchain configs belong at the root**: `package.json`,
  `vite.config.ts`, `playwright.config.ts`, `tsconfig.json`,
  `tsconfig.browser.json`, and `.nycrc.json` are loaded from the
  workspace root by their respective tools.
- **Generated artifact folders are not source architecture**: `dist/`,
  `coverage/`, `playwright-report/`, `test-results/`, `.nyc_output/`,
  and `tmp/` are disposable outputs. If the next cleanup step is to move
  root clutter, these are the first candidates.
- **Generated artifact locations are currently hard-coded**: moving the
  coverage/report/temp directories would require coordinated edits in
  `.gitignore`, `.nycrc.json`, `playwright.config.ts`,
  `scripts/test-coverage.ts`, and `tests/baseFixtures.ts`.

## Build and Runtime Flow

`npm run build` executes `scripts/build.ts`, which does the following in order:

1. Validates `data/*.json` album records and regenerates `data/index.json`.
2. Runs the multi-page Vite production build.
3. Type-checks the Node/tooling and browser-runtime TypeScript projects separately.
4. Runs markdownlint across the workspace.
5. Runs the Vitest unit suite with the `src/shared/**` coverage gate.
6. Runs the browser coverage gate through Playwright and nyc.

The runner stops at the first failed step. Later steps never run against an
invalid data set or a failed build.

`npm run serve` and the Playwright web server both use Vite directly rather than a custom local server script.

## Architecture Decisions

- **Shared core module at `src/shared/`**: one home for code needed by
  both the browser runtime and `scripts/` tooling. Dependency direction
  is one-way: `scripts/` imports from `src/shared/`, never the reverse.
  Layout is themed files: `schema.ts` (AlbumData, AlbumIndexEntry,
  EnergyLevel, SiteBuildMeta), `text.ts` (escapeHtml, normaliseText,
  foldKey), `tags.ts` (genre-tag helpers), `format.ts` (duration
  formatting). Each transform has exactly one dialect; page modules and
  scaffolding must not re-implement them. `escapeHtml` escapes `&`,
  `<`, `>`, and `"`.
- **Shared files satisfy both module-resolution modes**:
  `tsconfig.json` uses NodeNext, `tsconfig.browser.json` uses Bundler —
  relative imports across `src/` use explicit `.js` extensions, which
  both modes (and Vite, tsx, and Vitest) accept.
- **Browser file lists are globs**: `vite.config.ts` (istanbul
  include), `tsconfig.browser.json`, and `.nycrc.json` all use
  `src/**/*.ts` instead of a hand-synced file list. New browser modules
  are picked up with zero config edits. The istanbul/nyc configs
  additionally exclude `src/shared/**`, because the shared core has its
  own gate (see below).
- **Page-specific pure functions stay in their page modules**: helpers
  with a single caller (e.g. `matchesFilters`, `resolveStreamName`) are
  exported for direct testing but not moved to `src/shared/` — shared is
  only for code both sides of the seam need.
- **Unit tests run on Vitest** (`npm run test:unit`, `tests/unit/`):
  pure-logic tests import their targets directly. Playwright
  (`tests/*.spec.ts`) keeps real page flows, plus a small number of
  dynamic-import tests that exercise DOM-coupled `src/site.ts` branches
  the real flows cannot reach — those keep the browser per-file gate
  honest.
- **Two separate coverage gates**: the browser-only nyc gate (80% per
  file) covers the page modules; Vitest enforces its own independent
  80% threshold scoped to `src/shared/**` (report in `coverage-unit/`).
  No merging of coverage streams.
- **Validation split by concern**: recursive per-record checks live in
  `src/shared/validate.ts` (pure, beside the schema type, unit-gated by
  Vitest); cross-file checks (id↔filename, duplicate ids) live in
  `scripts/albums/album-index.ts` and run inside `readAlbumDataDir`;
  `scripts/build.ts` is a plain caller with no inline re-checks.
- **The browser keeps trusting build-validated data**: `src/album.ts`
  does not validate fetched JSON at runtime — everything in `dist/data/`
  has passed the build gate, and the fetch-error fallback covers real
  failure modes.
- **Pages mount through one seam**: `mountPage(rootId, html)` in
  `src/site.ts` replaces the placeholder root and binds the shared
  chrome (footer controls, cover fallbacks, random-backdrop link) in
  one place. Album and credits pages use it for both success and error
  states.

## Language Constraints

- **Only TypeScript and JavaScript** — all scripting, tooling, and browser runtime code must be written in `.ts` or `.js`/`.mjs`.
- **No Python** — Python has no role in this project. Do not create `.py` files or suggest Python-based solutions.

## UI and Style Documentation

See [style-guide.md](style-guide.md) for the current DaisyUI theme tokens,
typography, component anatomy, layout rules, and responsive behavior.

The live source of truth is the code in `src/album-analysis.css`,
`src/site.ts`, `src/album.ts`, `src/index.ts`, and `src/segment.ts`.
If documentation drifts, the code wins and the style guide should be
updated.

## Editing Guidelines

- **Album data lives in `data/<id>.json` only**: do not duplicate album metadata elsewhere.
- **Cover art should be cached locally**: store versioned cover files under `public/covers/` and point `coverUrl` at the local `covers/<id>.<ext>` path.
- **`data/index.json` is generated**: never hand-edit it; regenerate it via `npm run build` or the scaffolder.
- **Generated report/temp directories are disposable**: do not treat `coverage/`, `playwright-report/`, `test-results/`, `.nyc_output/`, `dist/`, or `tmp/` as hand-maintained source folders.
- **New browser runtime files need no config edits**: `vite.config.ts`,
  `.nycrc.json`, and `tsconfig.browser.json` all glob `src/**/*.ts`, so
  instrumentation, reporting, and browser type-checking pick new files
  up automatically. New files under `src/shared/` are gated by the
  Vitest threshold instead — give them unit tests.
- **Analytical writing style**: precise, concise, technical music terminology. Avoid fluff. Third-person or noun-phrase constructions preferred.

## Extending the Project

### Steps to create a new analysis

1. Create or update `data/<id>.json`, or scaffold it with `npx tsx scripts/add-album.ts "Artist" "Album" YEAR --genre "..."`.
2. Keep `id` equal to the filename slug, cache cover art under `public/covers/`, and store the local `covers/<id>.<ext>` path in `coverUrl`.
3. Populate all tracks, roles, tags, and timeline events in the JSON structure defined by `src/shared/schema.ts`.
4. Run `npm run build` to regenerate `data/index.json`, rebuild `dist/`, and validate the current test/coverage gate.
