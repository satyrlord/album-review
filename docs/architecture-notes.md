# Architecture Notes

## File Structure

```text
index.html / soundtracks.html / album.html / top-10.html / top-20.html / credits.html
                           ← public Vite HTML entry points; current page URLs depend on these filenames
package.json               ← npm scripts for dev, build, serve, test, typecheck, markdown linting, and frontend dependencies
vite.config.ts             ← multi-page Vite config, build metadata injection, Tailwind/DaisyUI integration, Istanbul instrumentation, data copy
playwright.config.ts       ← Playwright regression config using a Vite web server
tsconfig.json              ← Node/tooling TypeScript project
tsconfig.browser.json      ← browser-runtime TypeScript project
.nycrc.json                ← nyc coverage reporting config

src/album-analysis.css     ← shared stylesheet (Tailwind import, DaisyUI theme layer, and bespoke component CSS)
src/site.ts                ← shared nav, footer, and build-metadata helpers
src/index.ts               ← shared renderer for index.html and soundtracks.html
src/album.ts               ← album detail renderer driven by data/<id>.json
src/rankings.ts            ← shared renderer for top-10.html and top-20.html
src/credits.ts             ← credits page renderer listing musical, graphical, and technology sources

scripts/build.ts           ← full quality gate: data validation, Vite build, typecheck, markdownlint, coverage
scripts/test-coverage.ts   ← Playwright + nyc coverage runner and threshold enforcement
scripts/add-album.ts       ← MusicBrainz/Wikipedia album JSON scaffolder
scripts/albums/*.ts        ← album data indexing, schema, and scaffold helpers

tests/baseFixtures.ts      ← Playwright fixtures, including Istanbul coverage capture
tests/regression.spec.ts   ← browser regression coverage for collection, detail, and ranking pages

data/<id>.json             ← source of truth for each album
data/index.json            ← generated summary index derived from album JSON files (do not edit manually)
data/rankings.json         ← ranked catalog consumed by the ranking pages

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

- **The HTML entry files are part of the runtime contract**: `index.html`, `soundtracks.html`, `album.html`, `top-10.html`, `top-20.html`, and `credits.html` are referenced by `vite.config.ts`, shared navigation in `src/site.ts`, renderer links in `src/index.ts` and `src/album.ts`, Playwright tests, and the scaffolder output. Moving or renaming them is a route change, not a cosmetic cleanup.
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

## Language Constraints

- **Only TypeScript and JavaScript** — all scripting, tooling, and browser runtime code must be written in `.ts` or `.js`/`.mjs`.
- **No Python** — Python has no role in this project. Do not create `.py` files or suggest Python-based solutions.

## UI and Style Documentation

See [style-guide.md](style-guide.md) for the current DaisyUI theme tokens, typography, component anatomy, layout rules, and responsive behavior.

The live source of truth is the code in `src/album-analysis.css`, `src/site.ts`, `src/album.ts`, `src/index.ts`, and `src/rankings.ts`. If documentation drifts, the code wins and the style guide should be updated.

## Editing Guidelines

- **Album data lives in `data/<id>.json` only**: do not duplicate album metadata elsewhere.
- **Ranking data lives in `data/rankings.json`**: do not inline the ranked catalog in browser code.
- **`src/index.ts` serves two pages**: `index.html` and `soundtracks.html` share one renderer, differentiated by `body[data-collection]`.
- **`src/rankings.ts` serves two pages**: `top-10.html` and `top-20.html` share one renderer, differentiated by `body[data-ranking]`.
- **Soundtrack inclusion is data-driven**: set `isSoundtrack: true` in `data/<id>.json` when an album should appear on `soundtracks.html`; the generated `data/index.json` entry carries the flag forward.
- **`data/index.json` is generated**: never hand-edit it; regenerate it via `npm run build` or the scaffolder.
- **Generated report/temp directories are disposable**: do not treat `coverage/`, `playwright-report/`, `test-results/`, `.nyc_output/`, `dist/`, or `tmp/` as hand-maintained source folders.
- **When adding a new browser runtime file**, update the browser file lists in `vite.config.ts`, `.nycrc.json`, and `tsconfig.browser.json` so instrumentation, reporting, and browser type-checking remain aligned.
- **Analytical writing style**: precise, concise, technical music terminology. Avoid fluff. Third-person or noun-phrase constructions preferred.

## Extending the Project

### Steps to create a new analysis

1. Create or update `data/<id>.json`, or scaffold it with `npx tsx scripts/add-album.ts "Artist" "Album" YEAR --genre "..."`.
2. Keep `id` equal to the filename slug and store optional cover art in `coverUrl` inside that JSON.
3. Set `isSoundtrack: true` when the album belongs on the chronology-based Soundtracks page.
4. Populate all tracks, roles, tags, and timeline events in the JSON structure defined by `scripts/albums/album-schema.ts`.
5. Run `npm run build` to regenerate `data/index.json`, rebuild `dist/`, and validate the current test/coverage gate.
