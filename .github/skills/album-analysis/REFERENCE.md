# Album Analysis — Reference

Disclosed reference for the `album-analysis` skill. Contains the repo output model,
schema guidance, energy mapping, and quality checklist.

## Repo-Specific Output Model

This workspace is app-driven.

- Album analysis content lives in `data/<id>.json`
- Album index cards read generated summaries from `data/index.json`
- The index card summary is derived from each album JSON, not edited separately
- The album JSON can include an optional `coverUrl` field for the thumbnail and hero image
- The album detail page is rendered dynamically by `album.html` / `album.ts`

Do not generate a per-album standalone HTML page unless the user explicitly asks for that old format.

## Schema Fields

Required top-level fields when populating `data/<id>.json`:

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

## Energy Mapping Guide

| `low` | `mid` | `high` | `peak` |
| --- | --- | --- | --- |
| Ambient, interlude, drone, spoken word, slow build | Mid-tempo groove, funk, trip-hop, measured progression | Rave, punk, metal, breakbeat, big beat | Major climax, maximum intensity, summit track |

## Timeline Guidance

- Use real timestamps where known; estimate proportionally when needed
- Format timestamps as `M:SS` or `MM:SS`
- `section` should be a concise musical label like `Intro`, `Drop`, `Bridge`, `Breakdown`, `Outro`
- `description` should stay technical and concise

## Index Refresh

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

## Prefer the Existing Scaffolder When Practical

When creating a brand-new entry, prefer the repo script first:

```bash
npx tsx scripts/add-album.ts "Artist Name" "Album Title" YEAR --genre "Genre / Subgenre"
```

Then enrich the generated JSON with full structural analysis if the scaffold is only partial.

## Quality Checklist

Before declaring the entry done, verify:

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
