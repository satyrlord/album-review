---
name: album-analysis
description: 'Generate a new album analysis entry for this workspace. Use when asked to analyse an album, create analysis for an album, add a new album, write notes for an album, or populate the app with a new album. Researches track listing, durations, structural notes, and the album cover on Wikipedia, then creates data/<id>.json and refreshes the generated data/index.json summary when needed.'
---

# Album Analysis Skill

Produces a complete new album entry for the current app, not a standalone HTML file.

## When to Use This Skill

- "Analyse [album] by [artist]"
- "Create a structural analysis for [album]"
- "Add a new album to the app"
- "Write notes for [album]"
- Any request to create a new album entry that should appear on `index.html`

When the user asks for multiple albums in one request, fan the work out in parallel using multiple sub-agents. Give each album to its own sub-agent whenever feasible, then merge the results in the main agent and run one shared validation pass after all album files are in place.

## Repo-Specific Output Model

This workspace is app-driven.

- Album analysis content lives in `data/<id>.json`
- Album index cards read generated summaries from `data/index.json`
- The index card summary is derived from each album JSON, not edited separately
- The album JSON can include an optional `coverUrl` field for the thumbnail and hero image
- The album detail page is rendered dynamically by `album.html` / `album.ts`

Do not generate a per-album standalone HTML page unless the user explicitly asks for that old format.

---

## Workflow

### Step 0 — Parallelize Multi-Album Requests

If the request includes more than one album:

1. Launch multiple sub-agents in parallel when feasible.
2. Assign each sub-agent exactly one album so research, drafting, and schema population stay isolated.
3. Have the main agent review and integrate the returned album JSON changes.
4. Run the build and any required tests once after all album entries are added or updated.

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

### Step 2 — Resolve External Listening Links

When populating listening links for the album detail page, include platform URLs according to business rules.

Rules:

- Include valid Spotify and YouTube links where possible
- If Spotify is unavailable for the album, provide an audio streaming alternative
- If YouTube is unavailable for the album, provide a video streaming alternative
- Prefer official artist, label, or platform-hosted releases over user-uploaded mirrors
- Do not leave both audio and video listening paths unresolved

### Step 3 — Resolve Album Cover from Wikipedia

Search Wikipedia for the album page and prefer the page summary thumbnail or equivalent Wikimedia-hosted image.

Rules:

- Prefer a `upload.wikimedia.org` thumbnail URL when available
- Add that URL to the album's `coverUrl` field in `data/<id>.json`
- If no reliable Wikipedia cover is found, omit `coverUrl` rather than inventing one
- Do not add binary image files to the repo unless the user explicitly asks for local assets

### Step 4 — Build the Analysis Data

Populate `data/<id>.json` using the schema in `album-schema.ts`.

Required top-level fields:

- `id`
- `artist`
- `title`
- `year`
- `label`
- `producer`
- `genre`
- `runtime`
- `overview`
- `tracks`

For each track, derive:

| Field | How to determine |
| --- | --- |
| `energy` | Map to `low` / `mid` / `high` / `peak` |
| `tags` | 2–5 concise descriptors, excluding the energy tag |
| `role` | One-sentence narrative function in the album arc |
| `events` | 4–8 timestamped structural moments |

Energy mapping guide:

| `low` | `mid` | `high` | `peak` |
| --- | --- | --- | --- |
| Ambient, interlude, drone, spoken word, slow build | Mid-tempo groove, funk, trip-hop, measured progression | Rave, punk, metal, breakbeat, big beat | Major climax, maximum intensity, summit track |

Timeline guidance:

- Use real timestamps where known; estimate proportionally when needed
- Format timestamps as `M:SS` or `MM:SS`
- `section` should be a concise musical label like `Intro`, `Drop`, `Bridge`, `Breakdown`, `Outro`
- `description` should stay technical and concise

### Step 5 — Update the App Entry

Refresh the derived app index after writing `data/<id>.json`.

Derived summary fields:

```json
{
  "id": "artist-album-slug",
  "artist": "Artist Name",
  "title": "Album Title",
  "year": 2024,
  "tracks": 10,
  "genre": "Genre / Subgenre",
  "coverUrl": "https://upload.wikimedia.org/..."
}
```

Notes:

- `id` must match `data/<id>.json`
- Regenerate `data/index.json` via `npm run build` or the scaffolder after the JSON is updated
- The album must appear correctly on `index.html` after regeneration

### Step 5 — Prefer the Existing Scaffolder When Practical

When creating a brand-new entry, prefer the repo script first:

```bash
npx tsx scripts/add-album.ts "Artist Name" "Album Title" YEAR --genre "Genre / Subgenre"
```

Then enrich the generated JSON with full structural analysis if the scaffold is only partial.

### Step 6 — Validate

Run:

```bash
npm run build
npm test
```

Then verify locally:

- `http://127.0.0.1:3000/index.html`
- `http://127.0.0.1:3000/album.html?id=<id>`

---

## Quality Checklist

Before finishing, verify:

- [ ] `data/<id>.json` matches `album-schema.ts`
- [ ] Every track has exactly one energy level
- [ ] All timestamps use `M:SS` or `MM:SS`
- [ ] `data/index.json` was regenerated from the album JSON files
- [ ] `coverUrl` was added to `data/<id>.json` when a reliable Wikipedia thumbnail exists
- [ ] No invented or unverifiable cover URL was used
- [ ] Spotify and YouTube links are present when available
- [ ] Missing Spotify has a valid audio streaming alternative
- [ ] Missing YouTube has a valid video streaming alternative
- [ ] `npm run build` passes
- [ ] `npm test` passes if the change affects app rendering
