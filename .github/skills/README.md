# Album Review — Agent Skills

Agent skills for the Album Review static web app. Organised by invocation type.

## Development Workflow

| Skill | Invocation | Purpose |
|---|---|---|
| [`album-analysis`](./album-analysis/SKILL.md) | Model-invoked | Generate a new album analysis entry: research track listing, durations, structural notes, and cover art via MusicBrainz/Wikipedia, then create `data/<id>.json` and refresh `data/index.json`. |
| [`diagnose`](./diagnose/SKILL.md) | Model-invoked | Structured debugging loop for hard bugs and performance regressions. Build a feedback loop, hypothesise, instrument, fix. |
| [`run-quality-gate`](./run-quality-gate/SKILL.md) | Model-invoked | Deterministic quality gate: clear Problems, markdownlint, typecheck, dead-code audit, unit/e2e tests, and enforce >=80% in every coverage cell without suppression by default. |

## Design & Architecture

| Skill | Invocation | Purpose |
|---|---|---|
| [`bar-chart`](./bar-chart/SKILL.md) | Model-invoked | Create segmented horizontal bar charts with vanilla TypeScript and CSS. Zero-dependency, accessible, palette-aware. |
| [`improve-codebase-architecture`](./improve-codebase-architecture/SKILL.md) | User-invoked | Scan for architectural friction, generate a visual HTML report, then grill through candidates. |

## Code Review

| Skill | Invocation | Purpose |
|---|---|---|
| [`full-code-review`](./full-code-review/SKILL.md) | User-invoked | Thermo-nuclear code quality review: code-judo restructurings, 1k-line rule, spaghetti-growth detection, abstraction quality, and maintainability. |

## Productivity & Meta

| Skill | Invocation | Purpose |
|---|---|---|
| [`grill-me`](./grill-me/SKILL.md) | Model-invoked | Interview the user relentlessly about a plan or design before building. |
| [`handoff`](./handoff/SKILL.md) | User-invoked | Compact the conversation into a handoff document for another agent to continue. Includes a self-critique phase that surfaces uninvestigated gaps, skipped work, and unstated assumptions. |
| [`teach`](./teach/SKILL.md) | User-invoked | Multi-session teaching of a new skill or concept. |
| [`writing-great-skills`](./writing-great-skills/SKILL.md) | User-invoked | Reference for authoring skills: vocabulary and principles. |

## Removed Skills

The following skills were originally imported from the MixJam Electron project and have been removed as they are not applicable to this static-web-app codebase:

- `ablation-test` — MJE-specific import/playback/UI bug ablation with IPC and SQLite context
- `add-feature` — References MJE-specific docs (Web Audio, SQLite, FTS5, data model)
- `dead-code-audit` — Scoped to Electron main/renderer processes, React components, IPC, and Fallow
- `design-critique` — Heavy MJE-specific conventions section (React windowing, Electron sandboxing, SQLite)
- `deslop` — Guardrails are Electron/IPC/React/SQLite-specific
- `goal` — References `better-sqlite3` and MJE-specific documentation
- `refactor` — Named MJE and contains IPC/React/Web Audio/SQLite hazard sections
