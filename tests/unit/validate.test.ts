import { describe, expect, it } from "vitest";

import { getAlbumDataIssues } from "../../src/shared/validate.js";

const VALID_ALBUM = {
  id: "test-album",
  artist: "Test Artist",
  title: "Test Album",
  year: 2024,
  label: "",
  producer: "",
  genre: "Ambient",
  genreTags: ["Ambient"],
  runtime: "42:00",
  overview: "An overview.",
  tracks: [],
};

describe("getAlbumDataIssues", () => {
  it("accepts a valid album record", () => {
    expect(getAlbumDataIssues(VALID_ALBUM)).toEqual([]);
  });

  it("rejects non-object values", () => {
    expect(getAlbumDataIssues(null)).toEqual(["must be a JSON object matching AlbumData"]);
    expect(getAlbumDataIssues("x")).toEqual(["must be a JSON object matching AlbumData"]);
    expect(getAlbumDataIssues([])).toEqual(["must be a JSON object matching AlbumData"]);
  });

  it("requires id, artist, title, runtime, and overview to be non-blank strings", () => {
    const issues = getAlbumDataIssues({ ...VALID_ALBUM, id: " ", artist: 3, title: "", runtime: " ", overview: undefined });

    expect(issues).toContain("id is required");
    expect(issues).toContain("artist is required");
    expect(issues).toContain("title is required");
    expect(issues).toContain("runtime is required");
    expect(issues).toContain("overview is required");
  });

  it("requires year to be a finite number and genre a string", () => {
    const issues = getAlbumDataIssues({ ...VALID_ALBUM, year: "1978", genre: 4 });

    expect(issues).toContain("year must be a number");
    expect(issues).toContain("genre must be a string");
    expect(getAlbumDataIssues({ ...VALID_ALBUM, year: Infinity })).toContain("year must be a number");
  });

  it("requires genreTags to be a non-empty array of non-empty strings", () => {
    expect(getAlbumDataIssues({ ...VALID_ALBUM, genreTags: "Ambient" }))
      .toContain("genreTags must be a non-empty array of genre/subgenre tags");
    expect(getAlbumDataIssues({ ...VALID_ALBUM, genreTags: [] }))
      .toContain("genreTags must be a non-empty array of genre/subgenre tags");
    expect(getAlbumDataIssues({ ...VALID_ALBUM, genreTags: ["Ambient", " "] }))
      .toContain("genreTags entries must be non-empty strings");
    expect(getAlbumDataIssues({ ...VALID_ALBUM, genreTags: [42] }))
      .toContain("genreTags entries must be non-empty strings");
  });

  it("requires tracks to be an array", () => {
    expect(getAlbumDataIssues({ ...VALID_ALBUM, tracks: "none" })).toContain("tracks must be an array");
  });
});
