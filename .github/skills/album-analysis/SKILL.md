---
name: album-analysis
description: 'Generate a complete self-contained HTML structural analysis file for any album. Use when asked to "analyse an album", "create analysis for", "write notes for", "do a structural breakdown of", or "make a page for" any artist and album. Researches track listing, durations, musical structure, and production techniques, then renders a ready-to-open HTML file following the dark-theme template used in this workspace.'
---

# Album Analysis Skill

Produces a fully-formed `<artist>-<album-slug>-structural-analysis.html` file matching the workspace template from scratch. One command, one browser-ready file.

## When to Use This Skill

- "Analyse [album] by [artist]"
- "Create a structural analysis for [album]"
- "Add a new album file for [album]"
- "Write notes for [album]"
- Any request to generate a new album analysis HTML document

## Prerequisites

- Artist name and album title (ask if not provided)
- Internet access to fetch metadata (Wikipedia, rate/tracklist sources)

---

## Workflow

### Step 1 — Gather Metadata

Use `fetch_webpage` to retrieve:
1. The album's Wikipedia page (`https://en.wikipedia.org/wiki/<Album_Title_(%Artist)>`) for:
   - Official release date, label, producer(s)
   - Track listing with durations
   - Genre tags and production notes
2. Optionally a review source (Pitchfork, AllMusic, Rate Your Music) for critical context.

Extract and record:
- Full track list (number, title, duration)
- Total runtime
- Key collaborators / featured artists
- Primary genres (max 3)
- Year / era context

### Step 2 — Structural Analysis

For each track, derive:

| Field | How to determine |
|---|---|
| Energy tag | Map genre/description to `.energy-low` / `.energy-mid` / `.energy-high` / `.energy-peak` |
| Track role | One-sentence narrative function in the album arc (opener, build, centrepiece, closer, etc.) |
| Timeline events | 4–8 timestamped structural moments: intro, first drop, breakdown, climax, outro, notable techniques |
| Descriptive tags | Genre, technique, mood, notable feature (2–5 tags, no energy modifier) |

**Energy mapping guide:**

| `.energy-low` | `.energy-mid` | `.energy-high` | `.energy-peak` |
|---|---|---|---|
| Ambient, intro, drone, spoken word, slow build | Mid-tempo groove, funk, hip-hop, trip-hop | Rave, punk, metal, fast breakbeat, hard techno | Climax track, maximum BPM, peak moment |

**Timeline guidance:**
- Use real timestamps where known; estimate proportionally from duration where not.
- Format: `M:SS` (under 10 min) or `MM:SS` (10 min+).
- `<strong>` label should be a section name (Intro, Drop, Verse 1, Bridge, Breakdown, Outro, etc.).
- Description: one concise clause, technical music language, no filler.

### Step 3 — Determine Visual Identity

Default: use the standard CSS token set from the workspace instructions verbatim.

Override `:root` accent colors ONLY if the album has a genuinely distinct palette (e.g., a classical album might mute `--accent` toward silver; a jazz record might warm `--accent` toward amber). Document any override below in this file under **Per-Album Color Overrides**.

### Step 4 — Generate the HTML File

Output filename: `<artist-slug>-<album-slug>-structural-analysis.html`  
(e.g., `aphex-twin-selected-ambient-works-ii-structural-analysis.html`)

Use the scaffold below. Replace every `<!-- PLACEHOLDER -->` comment with real content. Do **not** add external `<script>` or `<link>` tags beyond the Google Fonts import already in the template.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Structural Analysis — <!-- ALBUM TITLE --></title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600&family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  /* ── PASTE THE FULL <style> BLOCK VERBATIM FROM jilted-generation-structural-analysis.html ── */
</style>
</head>
<body>

<div class="hero">
  <div class="container">
    <div class="hero-badge"><!-- ARTIST NAME --></div>
    <h1><span><!-- ALBUM TITLE --></span></h1>
    <p class="subtitle">structural analysis</p>
    <div class="meta">
      <div><strong>Artist</strong> <!-- ARTIST NAME --></div>
      <div><strong>Released</strong> <!-- YEAR --></div>
      <div><strong>Label</strong> <!-- LABEL --></div>
      <div><strong>Producer</strong> <!-- PRODUCER(S) --></div>
      <div><strong>Tracks</strong> <!-- COUNT --></div>
      <div><strong>Runtime</strong> <!-- TOTAL DURATION --></div>
    </div>
  </div>
</div>

<div class="container">
  <div class="preamble">
    <h2>// overview</h2>
    <p><!-- 3–4 sentence analytical overview: era, sonic palette, structural arc, significance. --></p>
  </div>

  <!-- REPEAT TRACK SECTION FOR EACH TRACK -->
  <section class="track">
    <div class="track-header">
      <span class="track-num">01</span>
      <span class="track-title"><!-- TRACK TITLE --></span>
      <span class="track-duration"><!-- DURATION --></span>
    </div>
    <div class="track-tags">
      <span class="tag energy-<!-- LEVEL -->"><!-- energy label --></span>
      <!-- 2–5 additional descriptive tags -->
    </div>
    <p class="track-role"><!-- Narrative role in album arc. --></p>
    <div class="timeline">
      <div class="event">
        <span class="timestamp">0:00</span>
        <div><strong>Intro</strong> — <!-- description --></div>
      </div>
      <!-- more events … -->
    </div>
  </section>

</div>
</body>
</html>
```

**CSS block**: copy the entire `<style>` tag from `jilted-generation-structural-analysis.html` verbatim. Never rewrite or abbreviate it.

### Step 5 — Write the File

Use `create_file` to write the completed HTML to the workspace root. Confirm the path matches the `<artist-slug>-<album-slug>-structural-analysis.html` convention.

---

## Quality Checklist

Before finishing, verify:

- [ ] Every track has exactly **one** energy tag (first in `.track-tags`)
- [ ] All timestamps use `M:SS` or `MM:SS` format
- [ ] `.track-num` values are zero-padded two-digit (01, 02 … 12)
- [ ] No hardcoded hex colors — only CSS variables (`var(--accent)` etc.)
- [ ] No external JS or additional CSS `<link>` tags added
- [ ] The `<style>` block is the exact copy from the reference file
- [ ] Preamble is 3–4 sentences, analytical, no fluff
- [ ] Track roles use third-person / noun-phrase style

---

## Per-Album Color Overrides

Document any `:root` overrides here when generating files for albums with a distinct visual identity.

| File | Variable | New Value | Rationale |
|---|---|---|---|
| *(none yet)* | | | |
