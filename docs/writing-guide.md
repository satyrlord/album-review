# Writing Guide

Rules for writing album analysis content in `data/<id>.json` — overviews,
track roles, tags, energy levels, and timeline events. This guide covers
the prose; the end-to-end process for adding an album (metadata sources,
streaming links, index refresh, validation) lives in the [album-analysis
skill](../.github/skills/album-analysis/SKILL.md), and UI rules live in the
[style guide](style-guide.md).

The source of truth is the existing high-quality entries in the `data/` directory. If this guide and the data disagree, update the guide to match the data.

## Related Files

- [Architecture notes](architecture-notes.md)
- [Album schema](../src/shared/schema.ts)
- [Example: Oxygène](../data/jean-michel-jarre-oxygene.json) — benchmark for instrument-level detail
- [Example: Voices](../data/vangelis-voices.json) — benchmark for vocal/choral analysis
- [Example: The Fat of the Land](../data/the-prodigy-fat-of-the-land.json) — benchmark for electronic/rave albums
- [Example: MCMXC a.D.](../data/enigma-mcmxc-a-d.json) — benchmark for sample-based albums and multi-part suites

---

## Global Style Rules

These apply to every prose field: `overview`, `role`, event `description`, and `detail`.

- **Third person or noun-phrase.** No first person anywhere.
- **No promotional inflation.** "Iconic" and "legendary" are acceptable
  when historically warranted; "amazing", "incredible", "stunning" are
  not. Use precise nouns and verbs instead of adjectives.
- **No hedging.** Avoid "it seems like", "possibly", "might be". State
  the analysis directly.
- **Technical vocabulary preferred.** Use `arpeggiated`,
  `polyrhythmic`, `resonant low-pass filter`, `four-on-the-floor`,
  `tritone`, etc. Do not explain basic terms.
- **No loose ends.** Every claim must be self-contained. If you name a
  series, trilogy, or grouping, list all members. If you reference a
  prior or subsequent album, name it. A reader should never finish a
  sentence with an unanswered "which one?" or "what was the third?"
- **Punctuation.** Em dash (`—`) for parenthetical expansion. Comma for subordinate clauses. Colon to introduce a list or example.
- **Numbers.** Timestamps in `M:SS` format. Chart positions as `UK No. 1`, `France No. 4`. Years as four-digit numerals inline.

---

## Overview Field

An analytical statement of 3–8 sentences, not a promotional blurb.
Roughly half the existing entries use a single paragraph; the rest split
into two paragraphs (a literal `\n\n` in the JSON string), typically
separating recording context from commercial reception.

**Required coverage:**

1. Recording context — where, when, under what constraints (studio, home,
   budget, timeline).
2. Notable equipment or methodology — name specific instruments, samplers,
   or software.
3. Commercial and critical context — chart positions, certifications,
   awards, cultural significance.
4. Structural design — how the album's arc works at the macro level
   (suites, sides, interludes, continuous flow). Most entries include
   this; omit it only when the album has no notable structure.

**Timestamp caveat:** when event timestamps are proportionally estimated,
close the overview with a short standalone paragraph stating the margin —
e.g. `Timestamps are approximate to ±5 seconds.` Omit it entirely when
timestamps are exact.

**Good example (Oxygène):**

> Recorded in Jarre's Paris apartment kitchen on Rue de la Trémoille — no
> studio time, no recording budget, no label commission. Six continuous
> parts that function as a single atmospheric statement about air, breath,
> and the texture of space. Key equipment: ARP 2600, EMS Synthi AKS, EMS
> VCS 3, Farfisa Professional Organ, Eminent 310 Unique (the atmospheric
> string sound), Korg Mini-Pops 7 drum machine…

**Avoid:**

> This is a landmark album that changed the face of electronic music forever.

---

## Track `role` Field

One to three sentences identifying the track's function within the album arc. Lead with the structural function; add historical or musical context only when the track carries enough weight to earn it.

- Prefix convention: `Album role: …` — required for new entries. A few
  entries (e.g. `vangelis-cosmos`, `gustav-holst-the-planets`) lack the
  prefix; do not copy that.
- State *what the track does structurally*, not how it sounds.
- Noun-phrase or subordinate-clause constructions preferred over full predicate sentences.
- Mention chart position, single release, or guest vocalist only when directly relevant to the track's structural role on the album.

**Good examples:**

> Album role: The album's defining statement — the most recognised synthesizer melody of the 1970s.
> Album role: The dramatic gear shift. After 10 tracks of escalating intensity, the album drops into a hazy, downtempo world.
> Album role: Side Two's climax and the album's second single — released as "Part 4 Remix" in November 1981.

---

## Track `tags` Field

2–5 concise descriptors in Title Case. No energy tag — the renderer prepends `Energy: <level>` from the `energy` field as the first visible tag, so an energy tag here would duplicate it.

- Tags are noun phrases, not sentences.
- Acceptable tag types: instrument names (`ARP 2600`, `Mellotron`),
  structural description (`Cumulative Build`, `Side One Centrepiece`,
  `Three-Part Suite`), genre label (`Jungle`, `Big Beat`), contextual
  fact (`Lead Single`, `Arthur C. Clarke Ref.`), technique (`Sample
  Collage`, `Vocoder`, `Gregorian Chant Sample`).
- Avoid generic adjectives like "energetic" or "beautiful" as standalone
  tags.

---

## Energy Field

Map to exactly one of `low`, `mid`, `high`, or `peak`.

| Value | Apply when |
| --- | --- |
| `low` | Ambient, interlude, drone, spoken word, slow build, downtempo, field recording |
| `mid` | Mid-tempo groove, funk, trip-hop, measured progression, moderate breakbeat |
| `high` | Rave, punk, metal, breakbeat, big beat, assertive electronic |
| `peak` | Major climax, maximum intensity, summit track, final assault |

One track holds one energy value — choose the ceiling, not the average. `peak` is rare by design: reserve it for genuine summit moments (about 1 in 14 tracks across the existing data).

---

## Timeline Event Fields

Scale the event count to the track length:

| Track length | Events |
| --- | --- |
| Interlude or short track (under ~3 min) | 2–4 |
| Standard track (3–10 min) | 4–8 |
| Extended track (over 10 min) | 8–12; the longest suite-form epics reach 14 |

### `timestamp`

Format: `M:SS` or `MM:SS`. Never seconds-only or hours format. Proportionally estimated values are acceptable — state the margin in the overview's caveat paragraph.

### `section`

A concise label for the structural moment — a few words, not a sentence, no terminal punctuation. Two styles are in use, both valid:

- **Structural label** — the dominant style: `Intro`, `Build`, `Drop`,
  `Breakdown`, `Peak`, `Outro`, `Bridge`, `Chorus`, `Verse`,
  `Crossfade`, and compounds such as `Final Drop`, `Extended Peak`,
  `Vocal Hook`, `Beat entry`, `Choir Entry`.
- **Named-event label** — for instrument-level analysis in the Oxygène
  mould: `Eminent 310 string pad`, `Mellotron enters`, `Gregorian chant`.

Casing is mixed across existing data (`Beat entry` vs `Choir Entry`);
pick one convention within an album and stay consistent.

### `description`

One sentence or clause describing *what happens structurally or musically* at this timestamp. A second short fragment for emphasis is acceptable.

- Present tense. Active or noun-phrase.
- Technical and specific: name the instrument, describe the rhythmic or harmonic change.
- May start lowercase when it reads as a continuation of the section
  label (`section: "Intro"` → `description: "sub-tonal drone and distant
  chord cluster…"`). About a third of existing events use this
  continuation style; either casing is fine, but do not mix arbitrarily
  within one track.

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

## Instrument and Sample Naming

Name specific instruments and models when known. This is a defining feature of the analysis style.

- Use exact commercial names: `ARP 2600`, `EMS Synthi AKS`, `Yamaha CS-80`, `Roland TR-808`, `Akai S1000`, `Fairlight CMI`.
- For samplers or DAWs, name the platform and version if relevant:
  `Akai MPC 3000`, `Ableton Live`.
- For sampled material, name the source — performer, work, and year where
  known: `groove closely modelled on Soul II Soul's 'Keep On Movin''
  (1989)`, `sampled Capella Antiqua München vocal — taken from 'Procedamus
  in Pace'`.
- When the instrument is primary to the track's character, explain *why* it sounds the way it does — filter character, oscillator type, historical context.
- Do not use generic terms when a specific instrument is known: write `Eminent 310 Unique`, not "string synthesizer".

---

## Metadata Fields

- `label` — the primary original release label. For joint releases, separate labels with ` · ` (space, middle dot, space): `"Disques Motors · Polydor"`.
- `producer` — same format for co-producers: `"Trevor Horn · Tom Newman · Mike Oldfield"`.
- Do not leave either field as an empty string `""`. If the value is genuinely unknown, use `"Unknown"`.
- `genre` — the compact display string, with primary subgenres separated
  by ` / `: `"Electronic / Ambient"`.
- `genreTags` — 1–9 curated filter tags. Include the primary values from
  `genre` when they are useful filters, and add broader or more specific
  categories when they improve discovery. The scaffolder initializes this
  array from `genre`; editors can then refine it.
