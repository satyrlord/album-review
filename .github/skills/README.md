# Agent Skills

This directory contains modular skills that extend the AI agent's capabilities
for the ALBANA album-review project. Each skill lives in its own subfolder with
a `SKILL.md` file that defines the skill's behavior and invocation rules.

- **Model-invoked** — triggered automatically by the agent when it detects a
  matching task.
- **User-invoked** — requires the user to explicitly call the skill (e.g., via
  a slash command or direct request).

---

## Development Workflow

| Skill | Invocation | What It Does |
|---|---|---|
| [`album-analysis`](./album-analysis/SKILL.md) | Model-invoked | Scaffolds a new album analysis entry. Uses MusicBrainz and Wikipedia to research track listings, durations, structural notes, and cover art, then creates `data/<id>.json` and regenerates `data/index.json`. |
| [`run-quality-gate`](./run-quality-gate/SKILL.md) | Model-invoked | Runs the full quality pipeline: clears Problems, runs markdownlint and type-checking, audits for dead code, executes unit and E2E tests, and enforces ≥80% coverage in every Istanbul cell. |

## Design & Architecture

| Skill | Invocation | What It Does |
|---|---|---|
| [`bar-chart`](./bar-chart/SKILL.md) | Model-invoked | Renders segmented horizontal bar charts using vanilla TypeScript and CSS. Zero dependencies, accessible, and palette-aware. |
| [`improve-codebase-architecture`](./improve-codebase-architecture/SKILL.md) | User-invoked | Scans the codebase for architectural friction points, generates a visual HTML report, and walks through candidate improvements. |

## Code Review

| Skill | Invocation | What It Does |
|---|---|---|
| [`full-code-review`](./full-code-review/SKILL.md) | User-invoked | Comprehensive code quality review covering structural refactoring opportunities, file-length discipline, spaghetti-growth detection, abstraction quality, and maintainability scoring. |

## Productivity & Meta

| Skill | Invocation | What It Does |
|---|---|---|
| [`grill-me`](./grill-me/SKILL.md) | Model-invoked | Relentlessly interviews the user about a plan or design before any code is written, surfacing hidden assumptions and risks. |
| [`handoff`](./handoff/SKILL.md) | User-invoked | Compacts the current conversation into a handoff document so another agent can pick up where this one left off. Includes a self-critique pass that flags uninvestigated gaps, skipped work, and unstated assumptions. |
| [`writing-great-skills`](./writing-great-skills/SKILL.md) | Model-invoked | Reference guide for authoring effective agent skills: structure, invocation patterns, and best practices. |
