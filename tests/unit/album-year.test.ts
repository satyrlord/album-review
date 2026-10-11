import { describe, expect, it } from "vitest";

import { resolveAlbumYear } from "../../scripts/albums/album-year.js";

describe("resolveAlbumYear", () => {
  const fallbackYear = 2026;

  it("prefers an explicit year over the fetched release date", () => {
    expect(resolveAlbumYear(1998, "2001-04-05", fallbackYear)).toBe(1998);
  });

  it("uses the year from the fetched release date", () => {
    expect(resolveAlbumYear(0, "1984-09-01", fallbackYear)).toBe(1984);
  });

  it.each(["1984", "1984-09", " 1984-09-01 ", "2024-02-29"])(
    "accepts partial and complete MusicBrainz dates (%s)",
    releaseDate => {
      expect(resolveAlbumYear(0, releaseDate, fallbackYear)).toBe(Number(releaseDate.trim().slice(0, 4)));
    },
  );

  it("falls back when the release date is undefined", () => {
    expect(resolveAlbumYear(0, undefined, fallbackYear)).toBe(fallbackYear);
  });

  it.each([
    "", "not-a-date", "198", "0000-00-00", "0000", "1984-99-99", "1984-garbage",
    "1984-", "1984-00", "1984-13", "1984-09-00", "1984-09-31", "2023-02-29", "1984-9-1",
  ]) (
    "falls back when the fetched release date is invalid or missing (%s)",
    releaseDate => {
      expect(resolveAlbumYear(0, releaseDate, fallbackYear)).toBe(fallbackYear);
    },
  );
});
