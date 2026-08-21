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

  it.each(["", "not-a-date", "198", "0000-00-00"]) (
    "falls back when the fetched release date is invalid or missing (%s)",
    releaseDate => {
      expect(resolveAlbumYear(0, releaseDate, fallbackYear)).toBe(fallbackYear);
    },
  );
});
