import { describe, expect, it } from "vitest";

import { buildColorMap, matchesFilters } from "../../src/index.js";
import type { AlbumIndexEntry } from "../../src/shared/schema.js";
import { normaliseText } from "../../src/shared/text.js";

function entry(overrides: Partial<AlbumIndexEntry>): AlbumIndexEntry {
  return {
    id: "a",
    artist: "Artist",
    title: "Title",
    year: 2000,
    tracks: 1,
    genre: "Ambient",
    genreTags: ["Ambient"],
    ...overrides,
  };
}

const NO_ARTISTS: ReadonlySet<string> = new Set();
const NO_GENRES: ReadonlySet<string> = new Set();

describe("matchesFilters", () => {
  it("matches everything when no filters are active", () => {
    expect(matchesFilters(entry({}), NO_ARTISTS, NO_GENRES, "")).toBe(true);
  });

  it("filters by artist", () => {
    const album = entry({ artist: "Vangelis" });
    expect(matchesFilters(album, new Set(["Vangelis"]), NO_GENRES, "")).toBe(true);
    expect(matchesFilters(album, new Set(["Mike Oldfield"]), NO_GENRES, "")).toBe(false);
  });

  it("intersects genre tags (AND logic)", () => {
    const album = entry({ genreTags: ["Ambient", "Electronic"] });
    expect(matchesFilters(album, NO_ARTISTS, new Set(["Ambient"]), "")).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, new Set(["Ambient", "Electronic"]), "")).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, new Set(["Ambient", "Rave"]), "")).toBe(false);
  });

  it("matches accent-insensitive search on title, artist, and tags", () => {
    const album = entry({ title: "Oxygène", artist: "Jean-Michel Jarre", genreTags: ["Électronique"] });
    expect(matchesFilters(album, NO_ARTISTS, NO_GENRES, normaliseText("oxygene"))).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, NO_GENRES, normaliseText("jarre"))).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, NO_GENRES, normaliseText("electronique"))).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, NO_GENRES, normaliseText("zzz"))).toBe(false);
  });

  it("tolerates entries without genreTags", () => {
    const album = { ...entry({}), genreTags: undefined } as unknown as AlbumIndexEntry;
    expect(matchesFilters(album, NO_ARTISTS, NO_GENRES, "")).toBe(true);
    expect(matchesFilters(album, NO_ARTISTS, new Set(["Ambient"]), "")).toBe(false);
  });
});

describe("buildColorMap", () => {
  it("assigns one colour per artist, sorted A-Z, cycling the palette", () => {
    const albums = ["C", "A", "B", "A"].map((artist, i) => entry({ id: `a${i}`, artist }));
    const map = buildColorMap(albums);

    expect(Object.keys(map).sort()).toEqual(["A", "B", "C"]);
    expect(map["A"]).not.toBe(map["B"]);
  });

  it("reuses the same colour for the same artist regardless of album count", () => {
    const map = buildColorMap([entry({ id: "x", artist: "Solo" }), entry({ id: "y", artist: "Solo" })]);
    expect(Object.keys(map)).toEqual(["Solo"]);
  });
});
