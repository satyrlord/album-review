# Agent Team — ALBANA

This directory contains the agent team contracts. Each agent is a standalone
Markdown file with YAML frontmatter. Agents are dispatched by the
`chief-operator` or directly by the human via `runSubagent`.

## Roster

| Agent | Role | Dispatch when… |
|---|---|---|
| [`chief-operator`](./chief-operator.md) | Decision maker, orchestrator | Mission spans multiple agents |
| [`system-fixer`](./system-fixer.md) | Quick repairs | Agent/skill/config/tooling breaks |
| [`builder`](./builder.md) | Implementation | Code, files, refactors, data |
| [`qa-engineer`](./qa-engineer.md) | Verification | After implementation, before declaring done |
| [`adversarial-critic`](./adversarial-critic.md) | Skeptic, bloat detector | After integration, before final declaration |
| [`eval-designer`](./eval-designer.md) | Evaluation design | Recurring problems need measurement |
| [`improvement-analyst`](./improvement-analyst.md) | Pattern → fix | Same failure keeps happening |
| [`context-librarian`](./context-librarian.md) | Docs, memories, context | Drift, conflicts, stale references |
| [`research-scout`](./research-scout.md) | External facts | Need verifiable web-sourced information |

## How to Use

### Via Chief Operator

```
@chief-operator Add a new album analysis for Vangelis - Albedo 0.39
```

The chief operator decomposes the mission, dispatches builders and QA, and
returns an integration report with PASS/FAIL verdicts.

### Direct Dispatch

Any agent can be dispatched directly:

```
@builder Create data/vangelis-albedo-039.json with track listing from MusicBrainz
```

### Team Workflow

```text
Human → chief-operator → [builder, research-scout]  (parallel)
                       → qa-engineer                (verify)
                       → adversarial-critic          (challenge)
                       → Human                       (final report)
```

When the critic finds issues:

```text
chief-operator → system-fixer  (diagnose)
               → builder       (re-implement)
               → qa-engineer   (re-verify)
               → adversarial-critic (re-challenge)
               → Human         (final report)
```

When patterns emerge across sessions:

```text
Human → eval-designer        (design measurement)
      → improvement-analyst  (analyze failures)
      → chief-operator       (dispatch fixes)
```

## Agent Contract Structure

Every agent follows this contract:

1. **Mission** — one sentence, what the agent does.
2. **Scope** — what it WILL and WILL NOT do.
3. **Constraints** — hard boundaries, never-violate rules.
4. **Output Template** — the exact format for results.
5. **Rules** — numbered, checkable, deterministic.

## Related

- [Skills](../skills/README.md) — domain-specific workflows
- [Agent Instructions](../../AGENTS.md) — project-wide agent rules
- [Architecture Notes](../../docs/architecture-notes.md) — codebase structure
- [Business Rules](../../docs/business-rules.md) — product requirements
