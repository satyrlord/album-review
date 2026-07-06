import { describe, expect, it } from "vitest";

import type { AlbumIndexEntry } from "../../src/shared/schema.js";
import { canonicaliseGenreTags, getDisplayGenre, getGenreTags } from "../../src/shared/tags.js";

function entry(id: string, genreTags: string[]): AlbumIndexEntry {
  return { id, artist: "A", title: id, year: 2000, tracks: 1, genre: genreTags.join(" / "), genreTags };
}

describe("getDisplayGenre", () => {
  it("trims the genre display string", () => {
    expect(getDisplayGenre(" Electronic / Ambient ")).toBe("Electronic / Ambient");
  });

  it("treats blank and comment-only placeholders as missing", () => {
    expect(getDisplayGenre("")).toBe("");
    expect(getDisplayGenre("   ")).toBe("");
    expect(getDisplayGenre("<!-- TODO: add genre -->")).toBe("");
  });
});

describe("getGenreTags", () => {
  it("splits on '/' and trims each tag", () => {
    expect(getGenreTags(" Electronic / Ambient / Berlin School ")).toEqual([
      "Electronic",
      "Ambient",
      "Berlin School",
    ]);
  });

  it("keeps a single genre as one tag", () => {
    expect(getGenreTags(" Ambient ")).toEqual(["Ambient"]);
  });

  it("drops empty segments and returns [] for missing genres", () => {
    expect(getGenreTags("Ambient //")).toEqual(["Ambient"]);
    expect(getGenreTags("")).toEqual([]);
    expect(getGenreTags("<!-- TODO -->")).toEqual([]);
  });
});

describe("canonicaliseGenreTags", () => {
  it("collapses spelling variants to the most-used display form", () => {
    const result = canonicaliseGenreTags([
      entry("a", ["New Age"]),
      entry("b", ["New Age"]),
      entry("c", ["New-Age"]),
    ]);

    expect(result.map(e => e.genreTags)).toEqual([["New Age"], ["New Age"], ["New Age"]]);
  });

  it("breaks count ties alphabetically", () => {
    const result = canonicaliseGenreTags([
      entry("a", ["Trip-Hop"]),
      entry("b", ["Trip Hop"]),
    ]);

    expect(result.map(e => e.genreTags)).toEqual([["Trip Hop"], ["Trip Hop"]]);
  });

  it("dedupes tags that collapse to the same canonical form", () => {
    const result = canonicaliseGenreTags([
      entry("a", ["New Age", "New-Age", "Ambient"]),
    ]);

    expect(result[0].genreTags).toEqual(["New Age", "Ambient"]);
  });
});
