---
name: album-analysis
description: 'Produce a new album entry for the app. Use when asked to add, analyse, or create an album entry.'
---

# Album Analysis

Produces a complete new album entry for the current app, not a standalone HTML file.

Leading word: **entry** — every run produces one finished `data/<id>.json` entry, validated end-to-end.

When the user asks for multiple albums in one request, fan the work out in parallel using multiple sub-agents. Give each album to its own sub-agent whenever feasible, then merge the results in the main agent and run one shared validation pass after all album files are in place.

## Deep Reference

Use [REFERENCE.md](REFERENCE.md) for the repo output model, schema fields,
energy mapping guide, timeline guidance, index refresh rules, scaffolder
preference, and the quality checklist.

## Workflow

### Step 1 — Gather Metadata

Use:

1. MusicBrainz for the canonical track list and durations
2. Wikipedia for:
   - release date / year
   - label and producer(s)
   - genre cues
   - notable context and production notes
   - the album cover thumbnail

Extract and record:

- Full track list (number, title, duration)
- Total runtime
- Year / label / producer(s)
- Primary genre string for the app card
- 2–4 sentences of album overview

**Completion criterion:** all metadata fields listed above are populated with
verifiable sources.

### Step 2 — Resolve External Listening Links

When populating listening links for the album detail page, include platform URLs according to business rules.

Rules:

- Include valid Spotify and YouTube links where possible
- If Spotify is unavailable for the album, provide an audio streaming alternative
- If YouTube is unavailable for the album, provide a video streaming alternative
- Prefer official artist, label, or platform-hosted releases over user-uploaded mirrors
- Do not leave both audio and video listening paths unresolved

**Completion criterion:** at least one audio and one video listening link is
resolved and recorded.

### Step 3 — Resolve Album Cover from Wikipedia

Search Wikipedia for the album page and prefer the page summary thumbnail or equivalent Wikimedia-hosted image.

Rules:

- Prefer a `upload.wikimedia.org` thumbnail URL when available
- Add that URL to the album's `coverUrl` field in `data/<id>.json`
- If no reliable Wikipedia cover is found, omit `coverUrl` rather than inventing one
- Do not add binary image files to the repo unless the user explicitly asks for local assets

**Completion criterion:** `coverUrl` is populated with a verified Wikimedia URL,
or explicitly omitted.

### Step 4 — Build the Analysis Data

Populate `data/<id>.json` using the schema and energy mapping in [REFERENCE.md](REFERENCE.md).

For each track, derive `energy`, `tags`, `role`, and `events` per the reference guidance.

**Completion criterion:** every track has all derived fields populated, every
timestamp uses `M:SS` or `MM:SS` format, and the JSON validates against
`album-schema.ts`.

### Step 5 — Refresh the App Index

Regenerate `data/index.json` after writing `data/<id>.json`, using the scaffolder or `npm run build`. See [REFERENCE.md](REFERENCE.md) for the derived summary shape and scaffolder invocation.

**Completion criterion:** the new entry appears correctly on `index.html` after
regeneration.

### Step 6 — Validate

Run:

```bash
npm run build
npm test
```

Then verify locally:

- `http://127.0.0.1:3000/index.html`
- `http://127.0.0.1:3000/album.html?id=<id>`

**Completion criterion:** `npm run build` and `npm test` both pass, and the
entry renders correctly on both pages. Every item on the quality checklist in
[REFERENCE.md](REFERENCE.md) is satisfied.
