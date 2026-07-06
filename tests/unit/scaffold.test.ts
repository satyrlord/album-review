import { describe, expect, it } from "vitest";

import { buildJson, slugify } from "../../scripts/albums/album-scaffold.js";

describe("slugify", () => {
  it("lowercases, strips accents, and hyphenates", () => {
    expect(slugify("Jean-Michel Jarre")).toBe("jean-michel-jarre");
    expect(slugify("Oxygène 3")).toBe("oxygene-3");
  });

  it("drops apostrophes and collapses repeated separators", () => {
    expect(slugify("Don't  Stop — Now")).toBe("dont-stop-now");
  });
});

describe("buildJson", () => {
  it("omits missing genre rows and raw TODO placeholders", () => {
    const scaffoldJson = buildJson(
      "generated-scaffold",
      "Vangelis",
      "Voices",
      1995,
      "",
      [{ num: 1, title: "Voices", lengthMs: 422000 }],
    );

    expect(scaffoldJson.genre).toBe("");
    expect(scaffoldJson.genreTags).toEqual([]);
    expect(scaffoldJson.runtime).toBe("7:02");
    expect(scaffoldJson.coverUrl).toBeUndefined();
  });

  it("trims slash-delimited genre tags", () => {
    const scaffoldJson = buildJson(
      "genre-tag-fixture",
      "Test Artist",
      "Tagged Album",
      2024,
      " Electronic / Ambient / Berlin School ",
      [{ num: 1, title: "Signal", lengthMs: 61000 }],
    );

    expect(scaffoldJson.genre).toBe("Electronic / Ambient / Berlin School");
    expect(scaffoldJson.genreTags).toEqual(["Electronic", "Ambient", "Berlin School"]);
  });

  it("keeps a single trimmed genre as one tag", () => {
    const scaffoldJson = buildJson(
      "single-genre-fixture",
      "Test Artist",
      "Single Genre Album",
      2024,
      " Ambient ",
      [{ num: 1, title: "Pulse", lengthMs: 61000 }],
    );

    expect(scaffoldJson.genre).toBe("Ambient");
    expect(scaffoldJson.genreTags).toEqual(["Ambient"]);
  });

  it("marks unknown track durations with a placeholder", () => {
    const scaffoldJson = buildJson(
      "no-length-fixture",
      "Test Artist",
      "Unknown Lengths",
      2024,
      "Ambient",
      [{ num: 1, title: "Mystery", lengthMs: 0 }],
    );

    expect(scaffoldJson.runtime).toBe("?:??");
    expect(scaffoldJson.tracks[0].duration).toBe("?:??");
  });
});
