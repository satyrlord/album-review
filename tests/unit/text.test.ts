import { describe, expect, it } from "vitest";

import { escapeHtml, foldKey, normaliseText } from "../../src/shared/text.js";

describe("escapeHtml", () => {
  it("escapes ampersands, angle brackets, and double quotes", () => {
    expect(escapeHtml('<a href="x">Tom & Jerry</a>'))
      .toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;");
  });

  it("accepts numbers", () => {
    expect(escapeHtml(1978)).toBe("1978");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Oxygène")).toBe("Oxygène");
  });
});

describe("normaliseText", () => {
  it("strips accents and lowercases", () => {
    expect(normaliseText("Oxygène")).toBe("oxygene");
    expect(normaliseText("Für ELISE")).toBe("fur elise");
  });

  it("returns an empty string for empty input", () => {
    expect(normaliseText("")).toBe("");
  });
});

describe("foldKey", () => {
  it("collapses case, spaces, and punctuation to a stable key", () => {
    expect(foldKey("New Age")).toBe("newage");
    expect(foldKey("New-Age")).toBe("newage");
    expect(foldKey("NEW_AGE!")).toBe("newage");
  });

  it("keeps digits", () => {
    expect(foldKey("Part 2")).toBe("part2");
  });
});
