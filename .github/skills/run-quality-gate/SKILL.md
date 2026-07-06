---
name: run-quality-gate
description: >
  Quality-gate execution for repository hygiene and release readiness. Use when
  the user asks to run a quality gate, clean all Problems panel issues, fix
  lint/test/coverage failures, or verify the branch meets strict 80%+ coverage
  thresholds without suppression.
---

# Run Quality Gate

Run a deterministic gate in fixed order. The leading word is **gate**:
close each gate completely before moving on.

Do not suppress diagnostics unless the user explicitly approves suppression.
The default action is to fix root causes in code, config, tests, or tooling.

## Deep Reference

Use [REFERENCE.md](REFERENCE.md) for gate command fallbacks, discovery checks,
coverage policy details, final report template, and stop conditions.

## Gates

1. **Problems gate**
   - Collect diagnostics from the VS Code Problems pipeline for the whole
     workspace (`get_errors` without file filter).
   - Fix all valid errors and warnings.
   - Re-run diagnostics until either:
     - no problems remain, or
     - only proven false positives remain with evidence captured in the final
       report.
   - Completion criterion: Problems output is empty, or each remaining item is
     explicitly listed as a verified false positive.

2. **Markdown gate**
   - Run markdown linting across repository Markdown files.
   - Preferred command: `npx markdownlint-cli2 "**/*.md"`.
   - Fix every valid finding by editing Markdown.
   - Do not add ignores/rule disables without explicit user permission.
   - Completion criterion: markdownlint exits clean with zero findings.

3. **TypeCheck gate**
   - This project uses TypeScript compiler checks (`npm run typecheck`) and
     markdownlint for linting; there is no ESLint configuration.
   - Run `npm run typecheck` to verify TypeScript compilation.
   - Fix any type errors found.
   - Completion criterion: `npm run typecheck` exits clean.

4. **Dead-code gate**
   - Run `npx fallow dead-code --format json` for cleanup candidates.
   - Fix every valid issue (remove dead code, unused exports, orphan references,
     or update code paths).
   - Do not suppress findings without explicit user permission.
   - Completion criterion: `npx fallow dead-code` reports zero issues, or
     remaining issues are documented as verified false positives.

5. **Fallow gate**
   - Run `npx fallow --format json` for full codebase intelligence: dead code,
     duplication, complexity, dependency hygiene, and architecture.
   - Fix every valid issue identified.
   - Do not suppress findings without explicit user permission.
   - Completion criterion: `npx fallow` reports zero issues, or remaining
     issues are documented as verified false positives.

6. **Unit-test gate**
   - Discover and run unit tests using repository scripts (`npm test`,
     `npm run test:unit`, or project-specific equivalents).
   - If no unit-test target exists, record that explicitly and continue.
   - Fix failing tests and production code issues where feasible.
   - Completion criterion: all discovered unit tests pass, or no unit-test suite
     exists and that absence is reported.

7. **E2E gate**
   - Discover and run E2E tests (`npm run test:e2e`, Playwright targets, or
     project-specific equivalents).
   - If no E2E suite exists, record that explicitly and continue.
   - Fix failures where feasible.
   - Completion criterion: all discovered E2E tests pass, or no E2E suite exists
     and that absence is reported.

8. **Coverage gate**
   - Run coverage (`npm run test:coverage`).
   - This project uses Playwright browser tests with Vite + Istanbul
     instrumentation via `vite-plugin-istanbul`. Coverage is collected from
     browser-runtime TypeScript files and reported through nyc.
   - Fix low-coverage gaps by adding or improving tests, not by excluding code,
     unless the user explicitly approves exclusions.
   - **Threshold rule:** each reported cell in the unit coverage report must be
     at least 80%. Treat Statements, Branches, Functions, and Lines as separate
     cells wherever reported (global and per-file/module tables).
   - Completion criterion: coverage report shows >=80% in every reported cell,
     or blockers are explicitly documented with exact cells and values.

## Failure handling

If a gate cannot be closed in the current turn, stop at that gate and report:

- exact command run,
- exact failure output,
- attempted fixes,
- remaining blockers,
- smallest next change to close the gate.

Never claim the full quality gate passed when any gate remains open.

## Final report format

Return results in this order:

1. Gate status table (Problems, Markdown, TypeCheck, DeadCode, Fallow, Unit, E2E, Coverage).
2. Files changed.
3. Commands run.
4. Remaining blockers (if any).

## Completion Criterion

This skill run is complete only when:

- every gate has been executed in order,
- every valid issue was fixed or documented as a verified false positive,
- no suppression was introduced without explicit user permission,
- and the final report lists objective evidence for each gate outcome.
