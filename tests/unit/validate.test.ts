import { describe, expect, it } from "vitest";

import { getAlbumDataIssues } from "../../src/shared/validate.js";

const VALID_ALBUM = {
  id: "test-album",
  artist: "Test Artist",
  title: "Test Album",
  year: 2024,
  label: "Test Label",
  producer: "Test Producer",
  genre: "Ambient",
  genreTags: ["Ambient"],
  runtime: "42:00",
  overview: "An overview.",
  tracks: [{
    num: 1,
    title: "Opening",
    duration: "4:00",
    energy: "mid",
    tags: ["Ambient", "Synthesizer"],
    role: "Album role: Establishes the album's harmonic language.",
    events: [{
      timestamp: "0:00",
      section: "Intro",
      description: "A sustained tone establishes the opening texture.",
    }],
  }],
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

  it("requires label and producer to be non-blank strings", () => {
    const issues = getAlbumDataIssues({ ...VALID_ALBUM, label: " ", producer: undefined });

    expect(issues).toContain("label is required");
    expect(issues).toContain("producer is required");
  });

  it("validates optional URL fields and the presence-only soundtrack flag", () => {
    const issues = getAlbumDataIssues({
      ...VALID_ALBUM,
      coverUrl: 42,
      spotifyUrl: false,
      youtubeUrl: {},
      audioStreamUrl: ["https://example.com"],
      isSoundtrack: false,
    });

    expect(issues).toContain("coverUrl must be a string");
    expect(issues).toContain("spotifyUrl must be a string");
    expect(issues).toContain("youtubeUrl must be a string");
    expect(issues).toContain("audioStreamUrl must be a string");
    expect(issues).toContain("isSoundtrack must be true when provided");
    expect(getAlbumDataIssues({
      ...VALID_ALBUM,
      coverUrl: "covers/test-album.jpg",
      spotifyUrl: "https://open.spotify.com/album/example",
      youtubeUrl: "https://youtube.com/watch?v=example",
      audioStreamUrl: "https://music.apple.com/example",
      isSoundtrack: true,
    })).toEqual([]);
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

  it("limits genreTags to the documented maximum of nine", () => {
    const genreTags = Array.from({ length: 10 }, (_, index) => `Genre ${index + 1}`);

    expect(getAlbumDataIssues({ ...VALID_ALBUM, genreTags }))
      .toContain("genreTags must contain no more than 9 tags");
  });

  it("requires tracks to be an array", () => {
    expect(getAlbumDataIssues({ ...VALID_ALBUM, tracks: "none" })).toContain("tracks must be an array");
  });

  it("validates every nested track and timeline event", () => {
    const invalidTrack = {
      ...VALID_ALBUM.tracks[0],
      num: "1",
      title: " ",
      duration: " ",
      energy: "unknown",
      tags: "Ambient",
      role: 3,
      events: [{
        timestamp: " ",
        section: 4,
        description: "",
        detail: 7,
      }],
    };

    const issues = getAlbumDataIssues({ ...VALID_ALBUM, tracks: [invalidTrack] });

    expect(issues).toContain("tracks[0].num must be a number");
    expect(issues).toContain("tracks[0].title is required");
    expect(issues).toContain("tracks[0].duration is required");
    expect(issues).toContain("tracks[0].energy must be a valid energy level");
    expect(issues).toContain("tracks[0].tags must be an array");
    expect(issues).toContain("tracks[0].role is required");
    expect(issues).toContain("tracks[0].events[0].timestamp is required");
    expect(issues).toContain("tracks[0].events[0].section is required");
    expect(issues).toContain("tracks[0].events[0].description is required");
    expect(issues).toContain("tracks[0].events[0].detail must be a string");
  });

  it("rejects malformed nested containers", () => {
    const issues = getAlbumDataIssues({
      ...VALID_ALBUM,
      tracks: [
        null,
        { ...VALID_ALBUM.tracks[0], tags: [" "], events: [null] },
        { ...VALID_ALBUM.tracks[0], events: "none" },
      ],
    });

    expect(issues).toContain("tracks[0] must be an object matching AlbumTrack");
    expect(issues).toContain("tracks[1].tags entries must be non-empty strings");
    expect(issues).toContain("tracks[1].events[0] must be an object matching TimelineEvent");
    expect(issues).toContain("tracks[2].events must be an array");
  });
});
