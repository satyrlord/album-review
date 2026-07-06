import { describe, expect, it } from "vitest";

import { formatDuration, msToMmss, parseDuration } from "../../src/shared/format.js";

describe("parseDuration", () => {
  it("parses M:SS to seconds", () => {
    expect(parseDuration("4:33")).toBe(273);
    expect(parseDuration("0:00")).toBe(0);
  });

  it("parses MM:SS to seconds", () => {
    expect(parseDuration("12:05")).toBe(725);
  });

  it("returns 0 for strings that are not M:SS shaped", () => {
    expect(parseDuration("abc")).toBe(0);
    expect(parseDuration("1:2:3")).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats seconds as M:SS with padded seconds", () => {
    expect(formatDuration(273)).toBe("4:33");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(0)).toBe("0:00");
  });

  it("round-trips with parseDuration", () => {
    expect(parseDuration(formatDuration(725))).toBe(725);
  });
});

describe("msToMmss", () => {
  it("formats milliseconds as M:SS", () => {
    expect(msToMmss(422000)).toBe("7:02");
    expect(msToMmss(0)).toBe("0:00");
  });

  it("floors sub-second remainders", () => {
    expect(msToMmss(61999)).toBe("1:01");
  });
});
