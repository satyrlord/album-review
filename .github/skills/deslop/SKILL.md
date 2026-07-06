---
name: deslop
description: Remove AI slop from every file in the repo — code, docs, config, and data.
disable-model-invocation: true
---

# Deslop

Strip **slop** — the friction a human wouldn't add — from the entire
repo. The leading word is **slop**: anything in a file that the rest of
that file (or its siblings) doesn't do. Applies to code, docs, config,
and data files alike. Not scoped to a diff — this is a full-repo pass.

## What counts as slop

### In code

- Comments a human wouldn't write: inline explanations of self-documenting
  code, obvious JSDoc on internal helpers, narrative prose where the
  existing file uses terse or no comments. Watch especially for
  **narrative comments** that restate the adjacent code ("// This function
  processes the user data and returns the processed user data").
- Defensive checks or try/catch blocks abnormal for the call site —
  especially on codepaths already validated by a trusted caller.
  **Swallowed exceptions** (`catch { return []; }`, `catch { /* ignore */ }`)
  that treat distinct failure modes as the same event are slop.
- Casts to `any` or `as` assertions that work around a type the
  surrounding code handles properly.
- Style that clashes with the file: import style (default vs named,
  `.js` extension convention), IIFE wrappers vs top-level, quote
  character, indentation, blank-line rhythm, `;` presence.
- **Ghost artifacts** from multi-pass generation: unused imports, dead
  code from previous attempts, half-renamed variables where old names
  still appear in some call sites, commented-out blocks that should have
  been deleted.
- **Duplicate helpers**: a utility that already exists elsewhere in the
  codebase but was regenerated instead of imported.
- **Hallucinated imports**: importing a package that doesn't exist, isn't
  installed, or doesn't export the symbol.
- **Hardcoded values** that should live in config: URLs, magic numbers,
  secret-like strings, environment-specific IDs.
- **Over-verbose scaffolding**: oversized single-pass functions with no
  decomposition, re-declared types that duplicate existing types, broad
  catch blocks that hide real failures.
- **Console logs** left in production paths.

### In prose and docs

- **Throat-clearing openers**: "Here's the thing:", "It turns out",
  "The uncomfortable truth is", "Here's what [X]", "Let me be clear",
  "The truth is,", "I'm going to be honest". Cut them and state the point.
- **Emphasis crutches**: "Let that sink in.", "Full stop.", "Make no
  mistake", "This matters because". Delete — they add no meaning.
- **Binary contrasts**: "It's not about X, it's about Y", "The question
  isn't X. It's Y.", "It feels like X. It's actually Y.". State Y
  directly.
- **Negative listing**: "Not a X. Not a Y. A Z." — dramatic buildup
  through negation. State Z.
- **Rhetorical setups**: "What if [reframe]?", "Here's what I mean:",
  "Think about it:", "So how do we...?". Make the point directly.
- **Dramatic fragmentation**: staccato one-word sentences for manufactured
  profundity. Use complete sentences.
- **False agency**: inanimate things given human verbs — "the complaint
  becomes a fix", "the data tells us", "the market rewards", "the decision
  emerges", "the culture shifts". Name the person.
- **Narrator-from-a-distance**: "People often find themselves...",
  "Nobody designed this", "This happens because...". Put the reader in
  the room — "you" beats "people".
- **All adverbs**: no `-ly` words. No "really", "just", "literally",
  "genuinely", "honestly", "simply", "actually", "deeply", "truly",
  "fundamentally", "inherently", "inevitably".
- **Business jargon**: "navigate challenges", "unpack analysis", "lean
  into", "game-changer", "double down", "deep dive", "circle back",
  "moving forward", "on the same page". Replace with plain language.
- **Vague declaratives**: "The reasons are structural", "The implications
  are significant", "The stakes are high". Name the specific thing.
- **Pull-quote sentences**: "Technology is the tool. People are the core.",
  "True innovation begins with redefining the problem." — sentences that
  sound meaningful but contain no information.
- **Meta-commentary**: "Hint:", "Plot twist:", "But that's another post",
  "The rest of this essay explains...", "As we'll see...", "I want to
  explore...". Let the writing move without announcing itself.
- **Telling instead of showing**: "This is genuinely hard", "This is what
  X actually looks like".
- **Lazy extremes**: "every single person", "always", "never", "nobody",
  "everyone" — false authority. Use specifics.
- **Rhythm tells**: metronomic same-length sentences, three-item lists
  where two or one would do, every paragraph ending punchily, em-dash
  overuse. Vary patterns.
- **Passive voice**: "was created", "is believed that", "Mistakes were
  made", "the decision was reached". Find the actor.
- **Wh- sentence starters**: leading with What/When/Where/Which/Who/Why/How
  as a crutch. Restructure.
- **Hand-holding**: "You might be wondering...", "Before we dive in...".
  Give the information directly.
- **Signposting**: "this document describes…", "the following sections
  will cover…", throat-clearing intros where sibling docs jump straight
  in.
- **Filler transitions**: "Now that we've covered X, let's turn to Y…"
  when sibling docs use headings alone.
- **Tone mismatch**: chatty or effusive language in a terse codebase,
  sterile formality in a conversational one.
- **Archaeological notes**: historical context, "formerly was X", "before
  the refactor", "TODO remove after Y", migration-era commentary.
  Delete outright. If the note captures a still-relevant constraint,
  move it to a design doc or memory file.
- **Workslop**: content that looks polished but lacks substance — reports,
  summaries, or analysis that create more work for the next reader because
  they must reconstruct what was actually meant.
- **Trendslop**: buzzy ideas substituted for reasoned conclusions — invoking
  fashionable concepts ("AI-native", "paradigm shift", "disruption") in
  place of concrete reasoning.

### In data and config

- Boilerplate fields a human wouldn't include: placeholder values left
  from scaffolding, default descriptions that were never replaced,
  `TODO` markers in live data.
- Over-nested structures where siblings are flat.
- Duplicate or near-duplicate entries that differ by a single field —
  pick the canonical one.
- JSON keys that don't appear in any sibling file.
- Hallucinated paths, URLs, or identifiers that reference things that
  don't exist in the repo or the real world.

## Process

Work file by file. For each file:

1. Read the whole file plus one sibling for context.
2. Flag every line that reads as **slop** — anything the sibling or the
   rest of the file wouldn't produce.
3. Remove the slop. Preserve all behaviour and all genuine information.
4. Move to the next file.

After the pass, report a 1–3 sentence summary of what was removed and
from roughly how many files.

## Completion criterion

A second read of every file yields nothing to remove: no comment, check,
cast, doc filler, prose tell, data placeholder, or style quirk that the
rest of the file (or its sibling) wouldn't produce.
