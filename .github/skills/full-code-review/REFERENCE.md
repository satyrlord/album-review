# Full Code Review — Reference

Disclosed reference for the `full-code-review` skill. Contains extended
remedy patterns and a quick-reference checklist.

## Extended Remedy Patterns

When the body's "Preferred Remedies" list feels abstract, reach for these
patterns:

### Delete-a-layer

**Smell:** `HelperClass` wraps `UtilityFunction` which wraps
`NativeAPI.call()`. Three layers for one call.

**Move:** Delete `HelperClass`. Call `UtilityFunction` directly. If
`UtilityFunction` is also a pass-through, delete it too and call
`NativeAPI.call()`.

**Test:** After deletion, is anything harder to understand? No → keep the
deletion.

### Reframe-the-model

**Smell:** `if (isSolo) { ... } else if (isMuted) { ... } else { ... }` in
three different files.

**Move:** Replace booleans with a typed state:
`type LaneState = 'active' | 'muted' | 'soloed'`. One switch in one place.
Conditional branches collapse.

### Push-to-canonical-layer

**Smell:** Feature-specific logic in a general-purpose module. A new import
format parser condition in the shared file I/O layer.

**Move:** General layer exposes a registration point (e.g.
`registerFormatParser(ext, parser)`). Feature module registers itself. Shared
layer stays general.

### Collapse-branches

**Smell:**

```ts
if (a) { doX(); }
if (b) { doX(); }
```

Two branches, same action, different guards.

**Move:** Extract the guard: `if (shouldDoX(a, b)) { doX(); }`. Or better:
collapse the guards upstream so `a` and `b` don't diverge in the first place.

### Inline-the-wrapper

**Smell:**

```ts
function wrapFetch(url: string) { return fetch(url); }
```

An identity function with a different name.

**Move:** Delete it. Call `fetch()` directly. If the wrapper adds logging or
error handling, make that the function's name: `fetchWithTimeout`, not
`wrapFetch`.

## Quick-Reference Checklist

Before approving, confirm:

- [ ] No file crossed 1k lines without a strong reason
- [ ] No new ad-hoc conditionals bolted onto unrelated flows
- [ ] No architecture boundary leak (engine ↔ ui direct calls)
- [ ] No duplicate state (same fact in two stores/modules)
- [ ] No thin wrappers or identity abstractions
- [ ] No `any` casts used to bypass type-checking
- [ ] Logic lives in the canonical layer for its concept
- [ ] No obvious code-judo simplification was missed
