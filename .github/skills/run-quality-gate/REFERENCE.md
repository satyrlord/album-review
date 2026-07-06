# Run Quality Gate Reference

Command resolution, fallback order, and reporting templates for the
run-quality-gate skill.

## Execution model

- Run gates strictly in order.
- Do not execute later gates if an earlier gate is still open.
- Prefer repository scripts first, then direct tool commands.
- Every gate must produce command evidence in the final report.

## Gate command matrix

Use the first command that exists and succeeds for each gate.

### Problems gate

1. Use VS Code diagnostics API via get_errors for whole workspace.

2. If scoped checks are needed while fixing, run get_errors on edited files.

3. Final check must be a whole-workspace get_errors call.

### Markdown gate

Preferred script order:

1. npm run lint:md

2. npm run markdownlint

3. npx markdownlint-cli2 "**/*.md"

Notes:

- Fix findings in files.

- No suppressions unless user explicitly approves.

### ESLint gate

This project uses TypeScript compiler checks and markdownlint; there is no
ESLint configuration. Run:

1. npm run typecheck

Notes:

- Fix all type errors found.
- No suppression of type errors without user permission.

### Fallow gate

This project uses Fallow for dead-code detection, duplication analysis,
complexity scoring, and dependency hygiene. Run:

1. `npm run fallow` — full combined analysis (dead-code + duplication + health)

2. `npx fallow dead-code` — cleanup candidates only

3. `npx fallow audit` — changed-code audit (for PRs)

Fallback order:

1. npx fallow
2. npm run fallow

Notes:

- Run `npx fallow` for the full analysis pass as the primary gate command.
- Fix all valid issues found; do not suppress without user permission.
- Use `--format json` for machine-readable output.

### Unit-test gate

Preferred script order:

1. npm run test:unit

2. npm run test

3. npx vitest run

If none exists:

- Mark gate as not-applicable and include discovery evidence.

### E2E gate

Preferred script order:

1. npm run test:e2e

2. npm run e2e

3. npx playwright test

If none exists:

- Mark gate as not-applicable and include discovery evidence.

### Coverage gate

Preferred script order:

1. npm run test:coverage (Playwright browser tests with Vite + Istanbul
   instrumentation via vite-plugin-istanbul)

Coverage policy:

- Minimum 80% for each reported cell (Statements, Branches, Functions, Lines).
- Apply threshold to coverage summary and per-file/module table rows
  when reported.

Allowed remediation:

- Add targeted tests.

- Fix production logic that blocks testability.

Not allowed by default:

- Lower thresholds.

- Add exclusions/ignore patterns to hide uncovered code.

- Mark files ignored for coverage.

Any of the above requires explicit user permission.

## Discovery checks

Before unit/e2e/coverage gates, inspect scripts once:

- Read package.json scripts.

- Prefer existing script names over raw npx commands.

## Final report template

1. Gate status:
   - Problems: PASS/FAIL/BLOCKED
   - Markdown: PASS/FAIL/BLOCKED/N-A
   - TypeCheck: PASS/FAIL/BLOCKED/N-A
   - DeadCode: PASS/FAIL/BLOCKED/N-A
   - Fallow: PASS/FAIL/BLOCKED/N-A
   - Unit: PASS/FAIL/BLOCKED/N-A
   - E2E: PASS/FAIL/BLOCKED/N-A
   - Coverage: PASS/FAIL/BLOCKED/N-A
2. Commands run in order.
3. Files changed.
4. Remaining blockers with exact failing output snippets.

## Stop conditions

Stop and report immediately when:

- a command requires secrets or manual login,

- a command hangs or requires interactive input that cannot be automated,

- or a gate requires suppression but user has not granted permission.

In all stop cases, include the smallest next action to close the gate.
