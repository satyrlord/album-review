import { type Page } from "@playwright/test";

import { expect, test } from "./baseFixtures.js";

import { buildJson } from "../scripts/albums/album-scaffold.js";

interface AlbumIndexEntry {
  id: string;
  artist: string;
  title: string;
  year: number;
  tracks: number;
  genre: string;
  coverUrl?: string;
  isSoundtrack?: boolean;
}

interface AlbumData {
  id: string;
  artist: string;
  title: string;
  coverUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readAlbumIndex(page: Page): Promise<AlbumIndexEntry[]> {
  const response = await page.request.get("/data/index.json");
  expect(response.ok()).toBeTruthy();
  return await response.json() as AlbumIndexEntry[];
}

async function readAlbumData(page: Page, id: string): Promise<AlbumData> {
  const response = await page.request.get(`/data/${id}.json`);
  expect(response.ok()).toBeTruthy();
  return await response.json() as AlbumData;
}

async function gotoIndex(page: Page): Promise<void> {
  await page.goto("/index.html");
  await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
}

async function gotoSoundtracks(page: Page): Promise<void> {
  await page.goto("/soundtracks.html");
  await expect(page.getByRole("heading", { name: "Soundtracks" })).toBeVisible();
}

async function readBuildMeta(page: Page): Promise<{ pushedCommitCount: number; version: string }> {
  const meta = await page.evaluate(() => {
    const siteWindow = window as Window & {
      AlbumReviewSite?: {
        getBuildMeta(): { pushedCommitCount: number; version: string };
      };
    };

    return siteWindow.AlbumReviewSite ? siteWindow.AlbumReviewSite.getBuildMeta() : null;
  });

  expect(meta).not.toBeNull();

  if (!meta) {
    throw new Error("Build metadata was not available in the page context.");
  }

  return meta;
}

async function expectPrimaryNav(page: Page, currentLabel?: "HOME PAGE" | "SOUNDTRACKS"): Promise<void> {
  const navLinks = page.locator(".site-nav-link");

  await expect(navLinks).toHaveCount(2);
  await expect(navLinks).toHaveText(["HOME PAGE", "SOUNDTRACKS"]);
  if (currentLabel) {
    await expect(page.getByRole("link", { name: currentLabel, exact: true })).toHaveAttribute("aria-current", "page");
  }
}

test.describe("album index regressions", () => {
  test("renders all registered albums on first load", async ({ page }) => {
    const totalAlbums = (await readAlbumIndex(page)).length;

    await gotoIndex(page);

    await expectPrimaryNav(page, "HOME PAGE");
    await expect(page.getByRole("link", { name: "SOUNDTRACKS", exact: true })).toHaveAttribute("href", /soundtracks\.html$/);
    await expect(page.locator(".site-footer-credits")).toHaveAttribute("href", /credits\.html$/);
    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
    await expect(page.locator("#ixCount")).toHaveText(`${totalAlbums} / ${totalAlbums} albums`);
  });

  test("soundtracks page shows all registered soundtrack albums", async ({ page }) => {
    await gotoSoundtracks(page);

    await expectPrimaryNav(page, "SOUNDTRACKS");
    const soundtrackAlbums = (await readAlbumIndex(page)).filter((a) => a.isSoundtrack);
    await expect(page.locator(".ix-card")).toHaveCount(soundtrackAlbums.length);
    await expect(page.locator("#ixCount")).toHaveText(`${soundtrackAlbums.length} / ${soundtrackAlbums.length} albums`);
  });

  test("renders a shared footer with a clickable version badge", async ({ page }) => {
    await gotoIndex(page);

    const meta = await readBuildMeta(page);

    await expect(page.locator(".site-footer")).toContainText(`Version ${meta.version}`);
    await expect(page.locator('.site-footer-version')).toHaveAttribute("href", "https://github.com/satyrlord/album-review");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("target", "_blank");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator(".site-footer")).not.toContainText("pushed commit");
    await expect(page.locator(".site-footer")).not.toContainText("github.com/satyrlord/album-review");

    await page.locator('.ix-card[href="album.html?id=jean-michel-jarre-oxygene"]').click();

    await expect(page.locator(".site-footer")).toContainText(`Version ${meta.version}`);
    await expect(page.locator('.site-footer-version')).toHaveAttribute("href", "https://github.com/satyrlord/album-review");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("target", "_blank");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator(".site-footer")).not.toContainText("pushed commit");
    await expect(page.locator(".site-footer")).not.toContainText("github.com/satyrlord/album-review");
  });

  test("site helpers render optional nav and footer states safely", async ({ page }) => {
    await gotoIndex(page);

    const rendered = await page.evaluate(() => {
      const siteWindow = window as Window & {
        AlbumReviewSite?: {
          renderNav(options?: { activePage?: "home" | "soundtracks" | null }): string;
          renderFooter(options?: { context?: string; actionHref?: string; actionLabel?: string }): string;
          mountNav(elementId: string, options?: { activePage?: "home" | "soundtracks" | null }): void;
          mountFooter(elementId: string, options?: { context?: string; actionHref?: string; actionLabel?: string }): void;
        };
      };

      const site = siteWindow.AlbumReviewSite;
      if (!site) {
        throw new Error("AlbumReviewSite helpers were not available.");
      }

      site.mountNav("missing-nav");
      site.mountFooter("missing-footer");

      return {
        navHtml: site.renderNav(),
        footerHtml: site.renderFooter(),
        footerWithActionHtml: site.renderFooter({
          context: "Coverage Pass",
          actionHref: "soundtracks.html",
          actionLabel: "Jump",
        }),
      };
    });

    expect(rendered.navHtml).not.toContain('aria-current="page"');
    expect(rendered.footerHtml).not.toContain("site-footer-context");
    expect(rendered.footerHtml).toContain("site-footer-credits");
    expect(rendered.footerHtml).toContain('href="credits.html"');
    expect(rendered.footerWithActionHtml).toContain("site-footer-context");
    expect(rendered.footerWithActionHtml).toContain('href="soundtracks.html"');
    expect(rendered.footerWithActionHtml).toContain("Jump");
  });

  test("renders album cover thumbnails when cover URLs are present", async ({ page }) => {
    const indexedAlbums = await readAlbumIndex(page);

    await gotoIndex(page);

    const covers = page.locator(".ix-card-cover");

    await expect(covers).toHaveCount(indexedAlbums.filter((album) => Boolean(album.coverUrl)).length);
    await expect(covers.first()).toHaveAttribute("src", /upload\.wikimedia\.org/);
    await expect(covers.first()).toHaveAttribute("alt", /Album cover for/);
  });

  test("matches accent-insensitive album title searches", async ({ page }) => {
    const indexedAlbums = await readAlbumIndex(page);
    await gotoIndex(page);

    const query = "oxygene";
    const normalise = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const totalAlbums = indexedAlbums.length;
    const expectedMatches = indexedAlbums.filter((album) => normalise(album.title).includes(query)).length;

    await page.getByRole("searchbox", { name: "Filter albums" }).fill(query);

    await expect(page.locator(".ix-card")).toHaveCount(expectedMatches);
    await expect(page.locator("#ixCount")).toHaveText(`${expectedMatches} / ${totalAlbums} albums`);
    await expect(page.getByText("Oxygène", { exact: true })).toBeVisible();
    await expect(page.getByText("Oxygène 7–13", { exact: true })).toBeVisible();
    await expect(page.getByText("Oxygène 3", { exact: true })).toBeVisible();
  });

  test("filters by artist pill without leaking other artists", async ({ page }) => {
    const indexedAlbums = await readAlbumIndex(page);
    await gotoIndex(page);

    const totalAlbums = indexedAlbums.length;
    const expectedMatches = indexedAlbums.filter((album) => album.artist === "Mike Oldfield").length;

    await page.getByRole("button", { name: "Mike Oldfield" }).click();

    await expect(page.locator(".ix-card")).toHaveCount(expectedMatches);
    await expect(page.locator("#ixCount")).toHaveText(`${expectedMatches} / ${totalAlbums} albums`);
    await expect(page.locator(".ix-card-artist")).toHaveText(Array(expectedMatches).fill("Mike Oldfield"));
  });

  test("soundtracks page filters non-soundtracks and keeps soundtrack albums chronological", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "late-score",
            artist: "Late Composer",
            title: "Late Score",
            year: 1999,
            tracks: 12,
            genre: "Movie Soundtrack",
            isSoundtrack: true,
          },
          {
            id: "regular-album",
            artist: "Non Soundtrack Artist",
            title: "Regular Album",
            year: 1971,
            tracks: 9,
            genre: "Electronic",
          },
          {
            id: "early-score",
            artist: "Early Composer",
            title: "Early Score",
            year: 1982,
            tracks: 8,
            genre: "Game Soundtrack",
            isSoundtrack: true,
          },
          {
            id: "mid-score",
            artist: "Mid Composer",
            title: "Mid Score",
            year: 1987,
            tracks: 10,
            genre: "Movie Soundtrack",
            isSoundtrack: true,
          },
        ]),
      });
    });

    await gotoSoundtracks(page);

    await expect(page.locator(".ix-card")).toHaveCount(3);
    await expect(page.locator("#ixCount")).toHaveText("3 / 3 albums");
    await expect(page.locator(".ix-card-title")).toHaveText(["Early Score", "Mid Score", "Late Score"]);
    await expect(page.locator("body")).not.toContainText("Regular Album");
  });

  test("collection pages expose empty states when the index is empty", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: "[]",
      });
    });

    await gotoIndex(page);
    await expect(page.locator("#ixCount")).toHaveText("0 / 0 albums");
    await expect(page.locator(".ix-empty")).toHaveText("No albums available.");

    await gotoSoundtracks(page);
    await expect(page.locator("#ixCount")).toHaveText("0 / 0 albums");
    await expect(page.locator(".ix-empty")).toHaveText("No soundtrack albums available.");
  });

  test("index bootstrap exits cleanly when required collection DOM nodes are missing", async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetElementById = Document.prototype.getElementById;
      const blockedIds: Record<string, string> = {
        "missing-grid": "ixGrid",
        "missing-filters": "ixFilters",
        "missing-search": "ixSearch",
        "missing-count": "ixCount",
      };

      Document.prototype.getElementById = function(id: string): HTMLElement | null {
        const fixture = new URL(window.location.href).searchParams.get("fixture");
        if (fixture && blockedIds[fixture] === id) {
          return null;
        }
        return originalGetElementById.call(this, id);
      };
    });

    for (const fixture of ["missing-grid", "missing-filters", "missing-search", "missing-count"]) {
      await page.goto(`/index.html?fixture=${fixture}`);
      await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
      await expect(page.locator("#siteNav")).toHaveCount(1);
      await expect(page.locator("#siteFooter")).toHaveCount(1);
      await expect(page.locator(".site-nav")).toHaveCount(0);
      await expect(page.locator(".site-footer")).toHaveCount(0);
    }
  });

  test("index page covers no-cover cards and no-match search states", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "no-cover",
            artist: "Coverless Artist",
            title: "Bare Bones",
            year: 2024,
            tracks: 1,
            genre: "Minimal",
          },
        ]),
      });
    });

    await gotoIndex(page);

    await expect(page.locator(".ix-card-cover")).toHaveCount(0);
    await expect(page.locator(".ix-card-meta")).toHaveText(["2024  ·  1 track"]);

    await page.getByRole("searchbox", { name: "Filter albums" }).fill("no hits here");

    await expect(page.locator(".ix-empty")).toContainText("No albums match");
    await expect(page.locator(".ix-empty")).toContainText("no hits here");
  });

  test("index page falls back to a generic load error for non-Error fetch failures", async ({ page }) => {
    await page.addInitScript(() => {
      window.fetch = (() => Promise.reject("boom")) as typeof window.fetch;
    });

    await page.goto("/index.html");

    await expect(page.locator(".ix-error")).toHaveText("Could not load album data.");
  });

  test("opens an album page and returns to the index", async ({ page }) => {
    await gotoIndex(page);

    await page.locator('.ix-card[href="album.html?id=mike-oldfield-tubular-bells-ii"]').click();

    await expect(page).toHaveURL(/album\.html\?id=mike-oldfield-tubular-bells-ii$/);
    await expect(page.getByRole("heading", { name: "Tubular Bells II" })).toBeVisible();

    await page.getByRole("link", { name: "HOME PAGE" }).click();

    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
  });

  test("album page renders JSON data via dynamic renderer", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");
    const expectedCover = album.coverUrl ?? "";

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    await expect(page.getByRole("heading", { name: "Oxygène" })).toBeVisible();
    await expectPrimaryNav(page);
    await expect(page.getByRole("link", { name: "HOME PAGE", exact: true })).toHaveAttribute("href", /index\.html$/);
    await expect(page.getByRole("link", { name: "SOUNDTRACKS", exact: true })).toHaveAttribute("href", /soundtracks\.html$/);
    await expect(page.locator(".site-footer-credits")).toHaveAttribute("href", /credits\.html$/);
    await expect(page.locator(".hero-cover")).toBeVisible();
    await expect(page.locator(".hero-cover")).toHaveAttribute(
      "src",
      expectedCover.startsWith("http")
        ? new RegExp(`^${escapeRegex(expectedCover)}$`)
        : new RegExp(`${escapeRegex(expectedCover)}$`),
    );
    await expect(page.locator(".hero-cover")).toHaveAttribute("alt", /Album cover for Jean-Michel Jarre - Oxygène/);
    await expect(page.locator(".track")).toHaveCount(6);
    await expect(page.locator(".track-title").first()).toBeVisible();
    await expect(page.locator(".timeline").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "← All Albums" })).toHaveCount(0);

    await page.getByRole("link", { name: "HOME PAGE" }).click();
    await expect(page).toHaveURL(/\/index\.html$/);
  });

  test("album page exposes streaming links when present", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("href", album.spotifyUrl ?? "");
    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.getByRole("link", { name: "Listen on YouTube Music" })).toHaveAttribute("href", album.youtubeUrl ?? "");
    await expect(page.getByRole("link", { name: "Listen on YouTube Music" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Listen on YouTube Music" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("album page renders the optional label row when present", async ({ page }) => {
    await page.route("**/data/labeled-album.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "labeled-album",
          artist: "Test Artist",
          title: "Signal Forms",
          year: 2024,
          label: "Test Label",
          producer: "",
          genre: "Electronic",
          runtime: "2:34",
          overview: "Label coverage fixture.",
          tracks: [
            {
              num: 1,
              title: "Signal",
              duration: "2:34",
              energy: "mid",
              tags: [],
              role: "Coverage fixture.",
              events: [
                {
                  timestamp: "0:00",
                  section: "Intro",
                  description: "Signal opens.",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/album.html?id=labeled-album");

    await expect(page.getByRole("heading", { name: "Signal Forms" })).toBeVisible();
    await expect(page.locator(".meta")).toContainText("Label:");
    await expect(page.locator(".meta")).toContainText("Test Label");
  });

  test("album page shows error for unknown id", async ({ page }) => {
    await page.goto("/album.html?id=no-such-album");
    await expect(page.locator("body")).toContainText("Could not load album");
  });

  test("album page falls back cleanly for non-Error fetch failures", async ({ page }) => {
    await page.addInitScript(() => {
      window.fetch = (() => Promise.reject("boom")) as typeof window.fetch;
    });

    await page.goto("/album.html?id=generic-failure");

    await expect(page.locator(".page-state-title")).toContainText('Could not load album "generic-failure".');
  });

  test("album page guards missing and invalid ids before requesting data", async ({ page }) => {
    await page.goto("/album.html");
    await expect(page.locator(".page-state-title")).toContainText("No album ID specified in URL");

    await page.goto("/album.html?id=..%2Fbad");
    await expect(page.locator(".page-state-title")).toHaveText("Invalid album ID.");
  });

  test("album page renders minimal albums without optional media or meta fields", async ({ page }) => {
    await page.route("**/data/minimal-album.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "minimal-album",
          artist: "Test Artist",
          title: "Monolith",
          year: 2024,
          label: "",
          producer: "",
          genre: "",
          runtime: "1:23",
          overview: "Single paragraph overview.",
          tracks: [
            {
              num: 1,
              title: "Pulse",
              duration: "1:23",
              energy: "low",
              tags: [],
              role: "Sketch.",
              events: [
                {
                  timestamp: "0:10",
                  section: "",
                  description: "Bare motif",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/album.html?id=minimal-album");

    await expect(page.getByRole("heading", { name: "Monolith" })).toBeVisible();
    await expect(page.locator(".hero-layout.has-cover")).toHaveCount(0);
    await expect(page.locator(".hero-cover")).toHaveCount(0);
    await expect(page.locator(".hero-link")).toHaveCount(0);
    await expect(page.locator(".meta")).not.toContainText("Label:");
    await expect(page.locator(".meta")).not.toContainText("Producer:");
    await expect(page.locator(".meta")).not.toContainText("Genre:");
    await expect(page.locator(".event-desc strong")).toHaveCount(0);
    await expect(page.locator(".event-desc .detail")).toHaveCount(0);
  });

  test("album page renders a track timeline segment chart", async ({ page }) => {
    await page.goto("/album.html?id=vangelis-voices");

    await expect(page.getByRole("heading", { name: "Voices" })).toBeVisible();
    const chart = page.locator("#timelineChart");
    await expect(chart).toHaveAttribute("role", "img");
    await expect(chart).toHaveAttribute("aria-label", /Track timeline breakdown/);
    await expect(chart.locator(".segment-row")).toHaveCount(9);
    await expect(chart.locator(".segment-item-wrapper").first()).toBeVisible();
  });

  test("segment chart covers default palette and zero-sum edge case", async ({ page }) => {
    await page.goto("/album.html?id=vangelis-voices");
    await expect(page.getByRole("heading", { name: "Voices" })).toBeVisible();

    const result = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const segmentPath = "/src/segment.ts";
      const mod: any = await import(segmentPath);
      const buildSegmentChart = mod.buildSegmentChart as (
        el: HTMLElement,
        opts: {
          rows: { label: string; duration: number; durationLabel: string; segments: { title: string; value: number; tooltip: string }[] }[];
          ariaLabel: string;
        },
      ) => void;

      // Exercise default palette by omitting it
      const defaultEl = document.createElement("div");
      document.body.appendChild(defaultEl);
      buildSegmentChart(defaultEl, {
        rows: [
          { label: "Track A", duration: 120, durationLabel: "2:00", segments: [{ title: "Intro", value: 60, tooltip: "Intro" }, { title: "Outro", value: 60, tooltip: "Outro" }] },
          { label: "Track B", duration: 60, durationLabel: "1:00", segments: [{ title: "Main", value: 60, tooltip: "Main" }] },
        ],
        ariaLabel: "Test defaults",
      });
      const defaultRows = defaultEl.querySelectorAll(".segment-row").length;
      const hasBarWidth = (defaultEl.querySelectorAll(".segment-bar")[0] as HTMLElement)?.style.width ?? "";
      const hasNoPctSpan = defaultEl.querySelector(".segment-item-percentage") === null;

      // Exercise zero-sum data
      const zeroEl = document.createElement("div");
      document.body.appendChild(zeroEl);
      buildSegmentChart(zeroEl, {
        rows: [
          { label: "Empty", duration: 0, durationLabel: "0:00", segments: [{ title: "X", value: 0, tooltip: "X" }] },
        ],
        ariaLabel: "Zero sum",
      });
      const zeroSegWidth = (zeroEl.querySelector(".segment-item-wrapper") as HTMLElement)?.style.width ?? "";

      return { defaultRows, hasBarWidth, hasNoPctSpan, zeroSegWidth };
    });

    expect(result.defaultRows).toBe(2);
    expect(result.hasBarWidth).toBe("");
    expect(result.hasNoPctSpan).toBe(true);
    expect(result.zeroSegWidth).toBe("0%");
  });

  test("does not render the removed initial analysis controls", async ({ page }) => {
    await gotoIndex(page);

    await expect(page.getByText("Initial Analysis", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "New album" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Analyse" })).toHaveCount(0);
  });

  test("does not expose the removed add-album endpoint", async ({ page }) => {
    const response = await page.request.post("/api/add-album", {
      data: { input: "Vangelis - Voices" },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(404);
  });

  test("suppresses placeholder genre values in album cards", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([{
          id: "mock-album",
          artist: "Mock Artist",
          title: "Mock Album",
          year: 2024,
          tracks: 4,
          genre: "<!-- TODO: add genre -->",
        }]),
      });
    });

    await gotoIndex(page);

    await expect(page.locator("#ixCount")).toHaveText("1 / 1 album");
    await expect(page.locator(".ix-card-genre")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("TODO");
  });

  test("generated scaffold JSON omits missing genre rows and raw TODO placeholders", async ({ page }) => {
    const scaffoldJson = buildJson(
      "generated-scaffold",
      "Vangelis",
      "Voices",
      1995,
      "",
      [{ num: 1, title: "Voices", lengthMs: 422000 }],
    );

    await page.route("**/data/generated-scaffold.json", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(scaffoldJson) });
    });

    await page.goto("/album.html?id=generated-scaffold");

    await expect(page.getByRole("heading", { name: "Voices" })).toBeVisible();
    await expect(page.locator(".meta")).not.toContainText("Genre:");
    await expect(page.locator("body")).not.toContainText("TODO");
    await expect(page.locator(".track-role")).toHaveText(
      "Initial scaffold only. Narrative role pending detailed listen.",
    );
    await expect(page.locator(".event-desc")).toContainText("Detailed timestamp notes pending.");
  });

  test("credits page renders all sections with nav and footer", async ({ page }) => {
    await page.goto("/credits.html");

    await expect(page.getByRole("heading", { name: /Credits/i })).toBeVisible();
    await expectPrimaryNav(page);

    await expect(page.getByText("Musical Sources")).toBeVisible();
    await expect(page.getByText("Cover Art")).toBeVisible();
    await expect(page.getByText("Research Sources")).toBeVisible();
    await expect(page.getByText("Technology")).toBeVisible();

    await expect(page.locator(".credits-section")).toHaveCount(4);
    await expect(page.locator(".credits-entry")).not.toHaveCount(0);
    await expect(page.locator(".credits-link").first()).toHaveAttribute("target", "_blank");
    await expect(page.locator(".credits-link").first()).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator(".site-footer")).toContainText("Credits & Sources");
  });

  test("credits page exits cleanly when the mount root is missing", async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetElementById = Document.prototype.getElementById;
      Document.prototype.getElementById = function(id: string): HTMLElement | null {
        if (id === "creditsRoot") return null;
        return originalGetElementById.call(this, id);
      };
    });

    await page.goto("/credits.html");

    await expect(page.locator("#creditsRoot")).toHaveCount(1);
    await expect(page.locator(".credits-section")).toHaveCount(0);
  });
});
