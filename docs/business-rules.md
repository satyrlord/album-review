# Business Rules

This document defines non-technical product requirements for ALBANA.

It consolidates current expectations from existing project documentation and live product behavior.

## Brand Identity

- The official brand name of this application shall be "ALBANA".

## Product Purpose

- The product provides deep-listening album analysis with timestamp-based structural notes.
- The audience-facing value is analytical clarity: users should understand album arc, track function, and production context quickly.
- The app is content-first, with design and interaction supporting discovery and reading rather than social or transactional features.

## Information Architecture

- The site must expose three user-facing destinations:
  - Home/Collection page: browse and filter all analyses.
  - Album detail page: full analysis for a single album.
  - Credits page: sources and acknowledgements.
- Navigation must always provide a clear route back to the collection.

## Collection Experience Requirements

- Users must be able to discover albums by:
  - Free-text search (title, artist, and genre tags).
  - Artist tag filtering.
  - Genre tag filtering.
- Search must be accent-insensitive (for example, searching "oxygene" should match "Oxygene" and "Oxygene" variants with diacritics).
- Genre filters must be additive intersection logic:
  - Selecting multiple genre tags narrows results to albums containing all selected tags.
- Artist and genre filters must be toggleable without page reload.
- The UI must always display result count in the form "visible / total albums".
- Empty states must be explicit:
  - No catalog data: "No albums available."
  - No match for active filters/search: "No results."

## Album Detail Experience Requirements

- Album detail must be addressable by album id in the URL query string.
- Invalid or missing album id must produce a user-readable error state with a route back to the collection.
- Album detail must present, at minimum:
  - Album title and artist identity.
  - Core metadata (release year, total length, track count; plus label/producer/genre when available).
  - Analytical overview text.
  - Per-track structural analysis.
  - Timeline/segment visualization of track structure.
- External listening links must include valid Spotify and YouTube links where possible.
- If an album is not available on Spotify, an audio streaming alternative must be provided.
- If an album is not available on YouTube, a video streaming alternative must be provided.
- Album cover image should be shown whenever possible; when unavailable, a consistent fallback image must be used so the page remains visually complete.

## Content Model Requirements

- Each album analysis is a structured editorial record, not an informal note.
- Required analysis depth per album:
  - Overview paragraph(s) with recording/production context and historical framing.
  - Track-by-track entries with role, energy classification, tags, and timestamped structural events.
- Track event granularity expectations:
  - Standard tracks: 4-8 timestamp events.
  - Extended tracks: up to 12 timestamp events.
- Energy must use one canonical value per track: low, mid, high, or peak.

## Editorial and Writing Rules

- Tone must remain analytical, concise, and specific.
- Use third-person voice; avoid first-person perspective.
- Avoid promotional or hype language.
- Prefer concrete musical/production terminology over generic descriptors.
- Name specific instruments/models when known.
- Every claim should be self-contained and unambiguous (no unresolved references).

## Metadata and Data Governance Rules

- Album JSON entries are the source of truth for album content.
- The generated index is a derived summary and should reflect album records consistently.
- Album identifier, filename, and public link identity must remain aligned.
- Label and producer values should not be left blank; use "Unknown" when genuinely unavailable.

## Visual and Accessibility Expectations

- The product remains dark-theme presentation across all pages.
- Responsive behavior is required for mobile and desktop reading.
- Key interactive controls (search, tags, navigation links) must remain visible and understandable across breakpoints.
- Timeline visualizations must preserve readable labels and meaningful textual context.

## Attribution and Rights Requirements

- The credits page must acknowledge:
  - Musical metadata sources.
  - Cover art sources.
  - Research/discovery sources.
  - Technology/tooling sources.
- Cover art usage must be clearly framed as identification/fair-use context, with rights retained by original copyright holders.
- External source links should open safely in a separate tab/window where applicable.

## Consistency and Trust Rules

- Shared header and footer identity (including project version marker and repository link) must be consistent across collection and album pages.
- User-facing copy for states and labels should be stable and predictable over time.
- Product behavior should prioritize graceful fallback over broken or blank UI regions.
