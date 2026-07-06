---
name: improve-codebase-architecture
description: Surface architectural friction in a codebase and apply deepening improvements.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

Use this shared design vocabulary — stay on these terms, don't drift into
"component," "service," "API," or "boundary":

- **module** — a unit of code with a single responsibility
- **interface** — what a module exposes; the surface callers depend on
- **depth** — how much complexity a module hides behind its interface;
  a **deep** module has a small interface hiding a large implementation
- **seam** — the place where two modules meet; their shared contract
- **adapter** — a module whose sole job is to translate between two seams
- **leverage** — how much work a module does relative to what a caller
  must understand to use it
- **locality** — how close related code lives; code that changes together
  should live together

Principles:

- **Deletion test** — would deleting this module concentrate complexity
  (good, it's deep), or just move it (bad, it's shallow)?
- **The interface is the test surface** — if a module is hard to test,
  its interface is wrong
- **One adapter = hypothetical seam, two = real** — the first adapter on a
  seam is scaffolding; the second proves the seam is right

The domain language in `docs/architecture-notes.md` and `docs/business-rules.md`
names good seams. Create `docs/glossary.md` lazily when shared terminology
is needed across docs.

## Process

### 1. Explore

Read the project's architecture docs (`docs/architecture-notes.md`,
`docs/business-rules.md`) first.

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Summarize the candidates directly in conversation. For each candidate, describe:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and how tests would improve
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`

End the summary with a **Top recommendation**: which candidate you'd tackle first and why.

**Use the domain vocabulary from `docs/architecture-notes.md`,
`docs/business-rules.md`, and the terms defined above.** If
`docs/glossary.md` exists, use its terms — don't drift into "component,"
"service," "API," or "boundary."

**Existing decision conflicts**: if a candidate contradicts a decision recorded in an existing doc, only surface it when the friction is
real enough to warrant revisiting that decision. Mark it clearly. Don't list every theoretical refactor a past decision forbids.

Ask the user: "Which of these would you like me to implement?"

### 3. Apply improvements

Once the user picks a candidate, apply the deepening improvement to the best of your ability. This means:

- **Read the relevant code thoroughly** before making changes. Understand
  the current interface, implementation, and callers.
- **Design the deepened module**: shrink the interface, expand the
  implementation behind it. Apply the deletion test — after the refactor,
  would deleting this module concentrate complexity or just move it?
- **Implement the change**: restructure files, extract and consolidate
  logic, tighten seams. Prefer locality — code that changes together
  should live together.
- **Preserve existing tests** and add new ones for the deepened interface. If a test was hard to write before and easy now, that's the signal you got it right.
- **Run the full build and test suite** (`npm run build`, `npm run test:coverage`). Fix any regressions. Maintain the minimum 80% coverage threshold in every reported Istanbul cell.
- **Update relevant docs** under `docs/` when the change introduces a new concept, sharpens a fuzzy term, or alters a documented decision.

Record durable decisions as you go:

- **Naming a deepened module after a concept not yet documented?** Add the term to the relevant doc under `docs/`. Create `docs/glossary.md` lazily if a cross-cutting glossary is needed.
- **Sharpening a fuzzy term during the conversation?** Update the relevant doc right there.
- **Want to explore alternative interfaces for the deepened module?** Design two competing interfaces in parallel, compare them against the deletion test and leverage, and record the winner.

## Completion Criterion

The architecture review is complete when:

- the candidates and trade-offs are clearly communicated and the top recommendation is explicit,
- the chosen deepening improvement is implemented, the build passes, and the test suite meets the 80% coverage threshold,
- and any durable architecture decisions that emerge are recorded in the relevant docs.
