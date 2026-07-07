import { describe, expect, it } from "vitest";

import { getEnergyTagClasses, overviewHtml, resolveStreamName, titleH1 } from "../../src/album.js";

describe("titleH1", () => {
  it("wraps the last word in a span", () => {
    expect(titleH1("Tubular Bells")).toBe("Tubular <span>Bells</span>");
  });

  it("wraps a single-word title entirely", () => {
    expect(titleH1("Voices")).toBe("<span>Voices</span>");
  });

  it("escapes HTML before splitting", () => {
    expect(titleH1("Q&A")).toBe("<span>Q&amp;A</span>");
  });
});

describe("overviewHtml", () => {
  it("converts double-newline paragraphs to <p> elements", () => {
    const html = overviewHtml("First paragraph.\n\nSecond paragraph.");
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html).toContain("First paragraph.");
    expect(html).toContain("Second paragraph.");
  });

  it("drops blank paragraphs and escapes content", () => {
    const html = overviewHtml("A & B\n\n   \n\nC");
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html).toContain("A &amp; B");
  });
});

describe("getEnergyTagClasses", () => {
  it("maps each canonical energy level to its CSS class", () => {
    expect(getEnergyTagClasses("low")).toBe("energy-low");
    expect(getEnergyTagClasses("mid")).toBe("energy-mid");
    expect(getEnergyTagClasses("high")).toBe("energy-high");
    expect(getEnergyTagClasses("peak")).toBe("energy-peak");
  });

  it("falls back to mid for unknown values", () => {
    expect(getEnergyTagClasses("unknown")).toBe("energy-mid");
  });
});

describe("resolveStreamName", () => {
  it("recognises Apple Music, Deezer, Tidal, and YouTube Music hosts", () => {
    expect(resolveStreamName("https://music.apple.com/album/1")).toBe("Apple Music");
    expect(resolveStreamName("https://geo.music.apple.com/album/1")).toBe("Apple Music");
    expect(resolveStreamName("https://www.deezer.com/album/1")).toBe("Deezer");
    expect(resolveStreamName("https://tidal.com/album/1")).toBe("Tidal");
    expect(resolveStreamName("https://music.youtube.com/watch?v=sAw_yllpSYQ")).toBe("YouTube Music");
  });

  it("falls back to Stream for other hosts and invalid URLs", () => {
    expect(resolveStreamName("https://example.com/album")).toBe("Stream");
    expect(resolveStreamName("not a url")).toBe("Stream");
  });
});
