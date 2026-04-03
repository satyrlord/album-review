# Writing Guide

Rules for writing album analysis content in `data/<id>.json`.

The source of truth is the existing high-quality entries in the `data/` directory. If this guide and the data disagree, update the guide to match the data.

## Related Files

- [Architecture notes](architecture-notes.md)
- [Album schema](../scripts/albums/album-schema.ts)
- [Example: Oxygène](../data/jean-michel-jarre-oxygene.json) — benchmark for instrument-level detail
- [Example: Voices](../data/vangelis-voices.json) — benchmark for vocal/choral analysis
- [Example: The Fat of the Land](../data/the-prodigy-fat-of-the-land.json) — benchmark for electronic/rave albums

---

## Overview Field

The `overview` is a 2–4 sentence analytical paragraph, not a promotional blurb.

**Required coverage:**

1. Recording context — where, when, under what constraints (studio, home, budget, timeline).
2. Notable equipment or methodology — name specific instruments, samplers, or software where relevant.
3. Commercial and critical context — chart positions, awards, cultural significance in one sentence.
4. Optional: structural design note — how the album's arc works at the macro level.

**Style rules:**

- Third-person. No first-person.
- No promotional language ("groundbreaking", "masterpiece", "stunning"). Use precise nouns and verbs.
- Timestamps and BPM approximation caveats go at the end of the overview, separated by a blank line, only when applicable.

**Good example (Oxygène):**

> Recorded in Jarre's Paris apartment kitchen on Rue de la Trémoille — no studio time, no recording budget. Six continuous parts that function as a single atmospheric statement about air, breath, and the texture of space. Key equipment: ARP 2600, EMS Synthi AKS, EMS VCS 3, Eminent 310 Unique, Korg Mini-Pops 7 drum machine.

**Avoid:**

> This is a landmark album that changed the face of electronic music forever.

**No loose ends.** Every claim must be self-contained. If you name a series, trilogy, or grouping, list all members. If you reference a prior or subsequent album, name it. A reader should never finish the overview with an unanswered "which one?" or "what was the third?"

---

## Track `role` Field

One sentence identifying the track's narrative function within the album arc.

- Prefix convention: `Album role: …`
- State *what the track does structurally*, not how it sounds.
- Noun-phrase or subordinate-clause constructions preferred over full predicate sentences.
- Mention chart position, singles release, or guest vocalist only when directly relevant to the track's structural role on the album.

**Good examples:**

> Album role: The album's defining statement — the most recognised synthesizer melody of the 1970s.
> Album role: The dramatic gear shift. After 10 tracks of escalating intensity, the album drops into a hazy, downtempo world.
> Album role: Side Two's climax and the album's second single — released as "Part 4 Remix" in November 1981.

---

## Track `tags` Field

2–5 concise descriptors. No energy tag (that lives in the `energy` field).

- Tags are noun phrases, not sentences.
- Acceptable tag types: instrument names (`ARP 2600`, `Mellotron`), structural description (`Cumulative Build`, `Side One Centrepiece`), genre label (`Jungle`, `Big Beat`), contextual fact (`Lead Single`, `Arthur C. Clarke Ref.`), technique (`Sample Collage`, `Vocoder`).
- Avoid generic adjectives like "energetic" or "beautiful" as standalone tags.

---

## Energy Field

Map to exactly one of `low`, `mid`, `high`, or `peak`.

| Value | Apply when |
| --- | --- |
| `low` | Ambient, interlude, drone, spoken word, slow build, downtempo, field recording |
| `mid` | Mid-tempo groove, funk, trip-hop, measured progression, moderate breakbeat |
| `high` | Rave, punk, metal, breakbeat, big beat, assertive electronic |
| `peak` | Major climax, maximum intensity, summit track, final assault |

One track can only hold one energy value — choose the ceiling, not the average.

---

## Timeline Event Fields

Each track requires 4–8 timestamped events. Extended tracks (over 10 minutes) may use up to 12.

### `timestamp`

Format: `M:SS` or `MM:SS`. Never use seconds-only or hours format. Proportionally estimated values are acceptable; note the approximation margin in the album overview.

### `section`

A concise musical label for the structural moment. Capitalise the first word only.

- Preferred vocabulary: `Intro`, `Drop`, `Build`, `Breakdown`, `Peak`, `Outro`, `Bridge`, `Chorus`, `Verse`, `Crossfade`, `Deconstruction`.
- Compound labels for specificity: `Final Drop`, `Extended Peak`, `Crossfade Intro`, `Dark Breakdown`, `Vocal Hook`, `Bass Entry`, `Spoken Word`.
- Not a sentence. No punctuation.

### `description`

One sentence or clause describing *what happens structurally or musically* at this timestamp.

- Present tense. Active or noun-phrase.
- Technical and specific: name the instrument, describe the rhythmic or harmonic change.
- No hedging: avoid "it seems like", "possibly", "might be".

**Good:** `Eminent 310 string pad enters — the warm, sustained chord establishing the album's harmonic language.`

**Avoid:** `A really nice synth sound comes in here and it creates a great atmosphere.`

### `detail` (optional)

1–3 sentences providing context below the surface description. Use for:

- Equipment annotation: model name, provenance, why that instrument was chosen.
- Production technique: how the effect was achieved.
- Historical or cultural context: first use of a technology, cultural reception, live performance note.
- Structural function: why this moment matters in the larger arc.

If there is nothing to add beyond the description, omit the field entirely.

---

## Instrument Naming Convention

Name specific instruments and models when known. This is a defining feature of the analysis style.

- Use exact commercial names: `ARP 2600`, `EMS Synthi AKS`, `Yamaha CS-60`, `Roland TR-808`, `Akai S1000`, `Fairlight CMI`.
- For samplers or DAWs: name the platform and version if relevant: `Akai MPC 3000`, `Ableton Live`.
- When the instrument is primary to the track's character, explain *why* it sounds the way it does — filter character, oscillator type, historical context.
- Do not use generic terms when a specific instrument is known: write `Eminent 310 Unique`, not "string synthesizer".

---

## Writing Style

- **Precise and concise.** Every sentence should carry analytical weight.
- **Third-person or noun-phrase.** Avoid first person throughout.
- **No promotional inflation.** "Iconic" and "legendary" are acceptable when historically warranted; "amazing", "incredible", "stunning" are not.
- **Technical music vocabulary preferred.** Use `arpeggiated`, `polyrhythmic`, `resonant low-pass filter`, `four-on-the-floor`, `tritone`, etc. Do not explain basic terms.
- **Em dash** (`—`) for parenthetical expansion. Comma for subordinate clauses. Colon to introduce a list or example.
- **Numbers consistently.** Timestamps in `M:SS` format. Chart positions as `UK No. 1`, `France No. 4`. Years as four-digit numerals inline.

---

## `label` and `producer` Fields

- `label`: Use the primary original release label. For joint releases, separate labels with ` · ` (space, middle dot, space): `"Disques Dreyfus · Polydor"`.
- `producer`: Same format for co-producers: `"Trevor Horn · Tom Newman · Mike Oldfield"`.
- Do not leave either field as an empty string `""`. If the value is genuinely unknown, use `"Unknown"`.
