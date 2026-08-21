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
  genreTags?: string[];
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
  audioStreamUrl?: string;
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
  await expect(page.getByRole("heading", { name: "ALBANA" })).toBeVisible();
}

async function readFooterVersion(page: Page): Promise<string> {
  const versionText = (await page.locator(".site-footer-version").textContent()) ?? "";
  expect(versionText).toMatch(/^Version 0\.\d{3}$/);
  return versionText;
}

test.describe("album index regressions", () => {
  test("renders all registered albums on first load", async ({ page }) => {
    const totalAlbums = (await readAlbumIndex(page)).length;

    await gotoIndex(page);

    await expect(page.locator(".site-footer-credits")).toHaveAttribute("href", /credits\.html$/);
    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
    await expect(page.locator("#ixCount")).toHaveText(`${totalAlbums} / ${totalAlbums} albums`);

    const sort = page.getByLabel("Sort albums");
    for (const option of ["year-desc", "artist-asc", "title-asc", "tracks-desc", "year-asc"]) {
      await sort.selectOption(option);
      await expect(sort).toHaveValue(option);
      await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
    }
  });

  test("renders a shared footer with a clickable version badge", async ({ page }) => {
    await gotoIndex(page);

    const version = await readFooterVersion(page);

    await expect(page.locator(".site-footer")).toContainText(version);
    await expect(page.locator('.site-footer-version')).toHaveAttribute("href", "https://github.com/satyrlord/album-review");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("target", "_blank");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator(".site-footer")).not.toContainText("pushed commit");
    await expect(page.locator(".site-footer")).not.toContainText("github.com/satyrlord/album-review");

    await page.locator('.ix-card[href="album.html?id=jean-michel-jarre-oxygene"]').click();

    await expect(page.locator(".site-footer")).toContainText(version);
    await expect(page.locator('.site-footer-version')).toHaveAttribute("href", "https://github.com/satyrlord/album-review");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("target", "_blank");
    await expect(page.locator('.site-footer-version')).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator(".site-footer")).not.toContainText("pushed commit");
    await expect(page.locator(".site-footer")).not.toContainText("github.com/satyrlord/album-review");
  });

  test("site helpers render optional footer and hero states safely", async ({ page }) => {
    await gotoIndex(page);

    const rendered = await page.evaluate(async () => {
      const sitePath = "/src/site.ts";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const site: any = await import(sitePath);

      site.mountFooter("missing-footer");
      site.mountCollectionHero("missing-hero", { title: "Nowhere" });

      return {
        footerHtml: site.renderFooter() as string,
        footerWithActionHtml: site.renderFooter({
          context: "Coverage Pass",
          actionHref: "credits.html",
          actionLabel: "Jump",
        }) as string,
        heroMinimal: site.renderCollectionHero({ title: "Test" }) as string,
        heroFull: site.renderCollectionHero({
          title: "Test Full",
          titleClassName: "ix-brand-title",
          tagline: "A tagline for coverage",
          searchPlaceholder: "Search here…",
          searchAriaLabel: "Filter test",
        }) as string,
        mountedMissing: site.mountPage("missing-root", "<div></div>") as boolean,
      };
    });

    expect(rendered.footerHtml).not.toContain("site-footer-context");
    expect(rendered.footerHtml).toContain("site-footer-credits");
    expect(rendered.footerHtml).toContain('href="credits.html"');
    expect(rendered.footerWithActionHtml).toContain("site-footer-context");
    expect(rendered.footerWithActionHtml).toContain('href="credits.html"');
    expect(rendered.footerWithActionHtml).toContain("Jump");
    expect(rendered.heroMinimal).not.toContain("ix-brand-title");
    expect(rendered.heroMinimal).toContain("Search…");
    expect(rendered.heroFull).toContain("ix-brand-title");
    expect(rendered.heroFull).toContain("A tagline for coverage");
    expect(rendered.heroFull).toContain("Search here…");
    expect(rendered.mountedMissing).toBe(false);
  });

  test("renders album cover thumbnails when cover URLs are present", async ({ page }) => {
    const indexedAlbums = await readAlbumIndex(page);

    await gotoIndex(page);

    const covers = page.locator(".ix-card-cover");

    await expect(covers).toHaveCount(indexedAlbums.length);
    await expect(covers.first()).toHaveAttribute("src", /covers\//);
    await expect(covers.first()).toHaveAttribute("alt", /Album cover for/);
  });

  test("centers the cover focal point for albums that need it", async ({ page }) => {
    const centeredAlbums: Array<{ id: string; expectedPosition: string }> = [
      { id: "matt-uelmen-diablo-hellfire",   expectedPosition: "50% 50%" },
      { id: "gustav-holst-the-planets",      expectedPosition: "50% 38%" },
    ];

    await gotoIndex(page);

    for (const { id, expectedPosition } of centeredAlbums) {
      const cardCover = page.locator(`.ix-card-cover[data-album-id="${id}"]`);
      await expect(cardCover).toBeVisible();
      expect(await cardCover.evaluate((el) => getComputedStyle(el).objectPosition)).toBe(expectedPosition);
    }

    for (const { id, expectedPosition } of centeredAlbums) {
      await page.goto(`/album.html?id=${id}`);
      const heroCover = page.locator(`.hero-cover[data-album-id="${id}"]`);
      await expect(heroCover).toBeVisible();
      expect(await heroCover.evaluate((el) => getComputedStyle(el).objectPosition)).toBe(expectedPosition);
    }
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

  test("filters by artist tag without leaking other artists", async ({ page }) => {
    const indexedAlbums = await readAlbumIndex(page);
    await gotoIndex(page);

    const totalAlbums = indexedAlbums.length;
    const expectedMatches = indexedAlbums.filter((album) => album.artist === "Mike Oldfield").length;

    await page.locator(".ix-artist-tag").filter({ hasText: "Mike Oldfield" }).click();

    await expect(page.locator(".ix-card")).toHaveCount(expectedMatches);
    await expect(page.locator("#ixCount")).toHaveText(`${expectedMatches} / ${totalAlbums} albums`);
    await expect(page.locator(".ix-card-artist")).toHaveText(Array(expectedMatches).fill("Mike Oldfield"));
  });

  test("filters by genre tags additively and toggles off", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          { id: "a1", artist: "A", title: "Alpha", year: 2000, tracks: 1, genre: "X", genreTags: ["Ambient", "Electronic"] },
          { id: "a2", artist: "B", title: "Beta", year: 2001, tracks: 1, genre: "Y", genreTags: ["Electronic", "Rave"] },
          { id: "a3", artist: "C", title: "Gamma", year: 2002, tracks: 1, genre: "Z", genreTags: ["Ambient"] },
        ]),
      });
    });

    await gotoIndex(page);

    // Nav genre tags should be present, ordered by count descending
    const navTags = page.locator(".ix-nav-genre-tag");
    await expect(navTags).toHaveCount(3);

    // Card genre tags should render
    await expect(page.locator(".ix-card-genre-tag")).toHaveCount(5);

    // Click "Ambient" nav tag — filters to albums with Ambient tag
    await navTags.filter({ hasText: "Ambient" }).click();
    await expect(page.locator(".ix-card")).toHaveCount(2);
    await expect(navTags.filter({ hasText: "Ambient" })).toHaveClass(/active/);

    // Additive: click "Electronic" — now only albums with BOTH Ambient AND Electronic
    await navTags.filter({ hasText: "Electronic" }).click();
    await expect(page.locator(".ix-card")).toHaveCount(1);
    await expect(page.locator(".ix-card-title")).toHaveText(["Alpha"]);

    // Toggle off "Ambient" — back to only Electronic filter
    await navTags.filter({ hasText: "Ambient" }).click();
    await expect(navTags.filter({ hasText: "Ambient" })).not.toHaveClass(/active/);
    await expect(page.locator(".ix-card")).toHaveCount(2);

    // Toggle off "Electronic" — back to all
    await navTags.filter({ hasText: "Electronic" }).click();
    await expect(page.locator(".ix-card")).toHaveCount(3);

    // Card genre tags are decorative labels — no interactive elements
    // may be nested inside the card anchor.
    await expect(page.locator(".ix-card button")).toHaveCount(0);
    await expect(page.locator(".ix-card-genre-tag").first()).toBeVisible();
  });

  test("genre tags that would produce zero results are disabled", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          { id: "a1", artist: "A", title: "Alpha", year: 2000, tracks: 1, genre: "X", genreTags: ["Ambient", "Electronic"] },
          { id: "a2", artist: "B", title: "Beta", year: 2001, tracks: 1, genre: "Y", genreTags: ["Rave"] },
        ]),
      });
    });

    await gotoIndex(page);

    const navTags = page.locator(".ix-nav-genre-tag");
    await navTags.filter({ hasText: "Rave" }).click();

    // No album combines Rave with Ambient, so Ambient must be disabled.
    await expect(navTags.filter({ hasText: "Ambient" })).toBeDisabled();
    await expect(navTags.filter({ hasText: "Rave" })).toBeEnabled();

    await navTags.filter({ hasText: "Rave" }).click();
    await expect(navTags.filter({ hasText: "Ambient" })).toBeEnabled();
  });

  test("active filters render as removable chips with a clear-all control", async ({ page }) => {
    await gotoIndex(page);

    await page.locator(".ix-artist-tag").filter({ hasText: "Vangelis" }).click();
    await page.locator(".ix-nav-genre-tag").filter({ hasText: "Ambient" }).first().click();

    const chips = page.locator(".ix-filter-chip");
    await expect(chips).toHaveCount(2);

    // Removing a chip removes only that filter
    await chips.filter({ hasText: "Ambient" }).click();
    await expect(page.locator(".ix-filter-chip")).toHaveCount(1);

    // Clear-all resets tags and search
    await page.getByRole("searchbox", { name: "Filter albums" }).fill("blade");
    await page.locator(".ix-results-bar .ix-clear-filters").click();
    await expect(page.locator(".ix-filter-chip")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Filter albums" })).toHaveValue("");

    const totalAlbums = (await readAlbumIndex(page)).length;
    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
  });

  test("no-results state offers a working clear-filters action", async ({ page }) => {
    const totalAlbums = (await readAlbumIndex(page)).length;
    await gotoIndex(page);

    await page.getByRole("searchbox", { name: "Filter albums" }).fill("zzzz-no-hits");
    await expect(page.locator(".ix-empty")).toContainText("No results");

    await page.locator(".ix-empty .ix-clear-filters").click();
    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
  });

  test("genre tag cloud is labelled and collapses behind an expander", async ({ page }) => {
    await gotoIndex(page);

    await expect(page.locator(".ix-tag-group-label").nth(0)).toHaveText("Artists");
    await expect(page.locator(".ix-tag-group-label").nth(1)).toHaveText("Genres");

    const expander = page.locator(".ix-tag-expander");
    await expect(expander).toBeVisible();
    await expect(expander).toContainText("more");

    const visibleBefore = await page.locator(".ix-nav-genre-tag:visible").count();
    await expander.click();
    const visibleAfter = await page.locator(".ix-nav-genre-tag:visible").count();
    expect(visibleAfter).toBeGreaterThan(visibleBefore);
    await expect(expander).toHaveText("Show fewer");

    await expander.click();
    await expect(expander).toContainText("more");
  });

  test("album cards expose their titles as headings", async ({ page }) => {
    await gotoIndex(page);
    await expect(page.locator("h2.ix-card-title").first()).toBeVisible();
  });

  test("footer shuffle control applies and stores a new backdrop", async ({ page }) => {
    await gotoIndex(page);

    await page.locator(".site-footer-shuffle-bg").click();

    const state = await page.evaluate(() => ({
      applied: document.documentElement.dataset["bg"] ?? "",
      stored: localStorage.getItem("siteBgIndex") ?? "",
    }));

    expect(state.applied).toBe(state.stored);
    const index = Number(state.applied);
    expect(index).toBeGreaterThanOrEqual(1);
    expect(index).toBeLessThanOrEqual(40);
  });

  test("genre tag search matches tag text", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          { id: "a1", artist: "A", title: "Alpha", year: 2000, tracks: 1, genre: "X", genreTags: ["Ambient", "Electronic"] },
          { id: "a2", artist: "B", title: "Beta", year: 2001, tracks: 1, genre: "Y", genreTags: ["Rave"] },
        ]),
      });
    });

    await gotoIndex(page);
    await page.getByRole("searchbox", { name: "Filter albums" }).fill("rave");
    await expect(page.locator(".ix-card")).toHaveCount(1);
    await expect(page.locator(".ix-card-title")).toHaveText(["Beta"]);
  });

  test("collection page exposes empty state when the index is empty", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: "[]",
      });
    });

    await gotoIndex(page);
    await expect(page.locator("#ixCount")).toHaveText("0 / 0 albums");
    await expect(page.locator(".ix-empty")).toHaveText("No albums available.");
  });

  test("index bootstrap exits cleanly when required collection DOM nodes are missing", async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetElementById = Document.prototype.getElementById;
      const blockedIds: Record<string, string> = {
        "missing-grid": "ixGrid",
        "missing-search": "ixSearch",
        "missing-count": "ixCount",
        "missing-sort": "ixSort",
      };

      Document.prototype.getElementById = function(id: string): HTMLElement | null {
        const fixture = new URL(window.location.href).searchParams.get("fixture");
        if (fixture && blockedIds[fixture] === id) {
          return null;
        }
        return originalGetElementById.call(this, id);
      };
    });

    for (const fixture of ["missing-grid", "missing-search", "missing-count", "missing-sort"]) {
      await page.goto(`/index.html?fixture=${fixture}`);
      await expect(page.getByRole("heading", { name: "ALBANA" })).toBeVisible();
      await expect(page.locator("#siteNav")).toHaveCount(0);      // replaced by hero
      await expect(page.locator("#siteFooter")).toHaveCount(1);   // footer placeholder untouched
      await expect(page.locator(".site-footer")).toHaveCount(0);  // footer not mounted
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

    await expect(page.locator(".ix-card-cover")).toHaveCount(1);
    await expect(page.locator(".ix-card-cover")).toHaveAttribute("src", /covers\/fallback-cd-case\.svg$/);
    await expect(page.locator(".ix-card-meta")).toHaveText(["2024  ·  1 track"]);

    await page.getByRole("searchbox", { name: "Filter albums" }).fill("no hits here");

    await expect(page.locator(".ix-empty")).toContainText("No results");
  });

  test("index page falls back when a cover file cannot be loaded", async ({ page }) => {
    await page.route("**/data/index.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "broken-cover",
            artist: "Broken Cover Artist",
            title: "Signal Loss",
            year: 2024,
            tracks: 2,
            genre: "Ambient",
            genreTags: ["Ambient"],
            coverUrl: "covers/does-not-exist.png",
          },
        ]),
      });
    });

    await gotoIndex(page);

    await expect(page.locator(".ix-card-cover")).toHaveAttribute("src", /covers\/fallback-cd-case\.svg$/);
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

    await page.getByRole("link", { name: "← Back to Home" }).click();

    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole("heading", { name: "ALBANA" })).toBeVisible();
  });

  test("album page renders JSON data via dynamic renderer", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");
    const expectedCover = album.coverUrl ?? "";

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    await expect(page.getByRole("heading", { name: "Oxygène", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Back to Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Back to Home", exact: true })).toHaveAttribute("href", /index\.html$/);
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

    await page.getByRole("link", { name: "← Back to Home" }).click();
    await expect(page).toHaveURL(/\/index\.html$/);
  });

  test("album page exposes streaming links when present", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("href", album.spotifyUrl ?? "");
    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.getByRole("link", { name: "Listen on YouTube" })).toHaveAttribute("href", album.youtubeUrl ?? "");
    await expect(page.getByRole("link", { name: "Listen on YouTube" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Listen on YouTube" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Spotify button has dark text on bright primary background", async ({ page }) => {
    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    const spotifyBtn = page.getByRole("link", { name: "Listen on Spotify" });
    await expect(spotifyBtn).toBeVisible();

    const colors = await spotifyBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });

    // Background should be the primary green (#00ff88 → rgb(0,255,136))
    expect(colors.backgroundColor).toBe("rgb(0, 255, 136)");
    // Text must NOT be the light base-content colour — it must be near-black primary-content (#031b10 → rgb(3,27,16))
    expect(colors.color).toBe("rgb(3, 27, 16)");
  });

  test("YouTube link points to www.youtube.com and is labelled Listen on YouTube", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    const ytBtn = page.getByRole("link", { name: "Listen on YouTube" });
    await expect(ytBtn).toBeVisible();
    await expect(ytBtn).toHaveAttribute("href", album.youtubeUrl ?? "");
    // URL must be on www.youtube.com, not music.youtube.com
    expect(album.youtubeUrl).toMatch(/^https:\/\/www\.youtube\.com\//);
    await expect(page.getByRole("link", { name: "Listen on YouTube Music" })).toHaveCount(0);
  });

  test("Back to Home button is visible and ghost-styled on album and credits pages", async ({ page }) => {
    // Album page
    await page.goto("/album.html?id=jean-michel-jarre-oxygene");
    const albumBack = page.getByRole("link", { name: "← Back to Home" });
    await expect(albumBack).toBeVisible();
    await expect(albumBack).toHaveAttribute("href", /index\.html$/);
    const albumBtnClasses = await albumBack.getAttribute("class");
    expect(albumBtnClasses).toContain("btn");
    expect(albumBtnClasses).toContain("btn-ghost");

    // Credits page
    await page.goto("/credits.html");
    const creditsBack = page.getByRole("link", { name: "← Back to Home" });
    await expect(creditsBack).toBeVisible();
    await expect(creditsBack).toHaveAttribute("href", /index\.html$/);
    const creditsBtnClasses = await creditsBack.getAttribute("class");
    expect(creditsBtnClasses).toContain("btn");
    expect(creditsBtnClasses).toContain("btn-ghost");
  });

  test("footer version badge and credits button are present on all three pages", async ({ page }) => {
    const pages = [
      "/index.html",
      "/album.html?id=jean-michel-jarre-oxygene",
      "/credits.html",
    ];

    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator(".site-footer-version")).toBeVisible();
      await expect(page.locator(".site-footer-version")).toHaveAttribute("href", "https://github.com/satyrlord/album-review");
      await expect(page.locator(".site-footer-credits")).toBeVisible();
      await expect(page.locator(".site-footer-credits")).toHaveAttribute("href", /credits\.html$/);
    }
  });

  test("All Albums footer action button is present on the album page", async ({ page }) => {
    await page.goto("/album.html?id=jean-michel-jarre-oxygene");
    const allAlbumsBtn = page.getByRole("link", { name: "All Albums" });
    await expect(allAlbumsBtn).toBeVisible();
    await expect(allAlbumsBtn).toHaveAttribute("href", /index\.html$/);
    const classes = await allAlbumsBtn.getAttribute("class");
    expect(classes).toContain("site-footer-btn");
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

  test("album page renders minimal albums with fallback cover and no optional meta fields", async ({ page }) => {
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
    await expect(page.locator(".hero-layout.has-cover")).toHaveCount(1);
    await expect(page.locator(".hero-cover")).toHaveAttribute("src", /covers\/fallback-cd-case\.svg$/);
    await expect(page.locator(".hero-link")).toHaveCount(0);
    await expect(page.locator(".meta")).not.toContainText("Label:");
    await expect(page.locator(".meta")).not.toContainText("Producer:");
    await expect(page.locator(".meta")).not.toContainText("Genre:");
    await expect(page.locator(".event-desc strong")).toHaveCount(0);
    await expect(page.locator(".event-desc .detail")).toHaveCount(0);
  });

  test("album page falls back when a cover file cannot be loaded", async ({ page }) => {
    await page.route("**/data/broken-cover-album.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "broken-cover-album",
          artist: "Test Artist",
          title: "Black Signal",
          year: 2024,
          label: "",
          producer: "",
          genre: "Ambient",
          genreTags: ["Ambient"],
          runtime: "2:34",
          coverUrl: "covers/does-not-exist.png",
          overview: "Fallback cover fixture.",
          tracks: [
            {
              num: 1,
              title: "Pulse",
              duration: "2:34",
              energy: "mid",
              tags: [],
              role: "Fixture.",
              events: [
                {
                  timestamp: "0:00",
                  section: "Intro",
                  description: "Fixture event.",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/album.html?id=broken-cover-album");

    await expect(page.locator(".hero-layout.has-cover")).toHaveCount(1);
    await expect(page.locator(".hero-cover")).toHaveAttribute("src", /covers\/fallback-cd-case\.svg$/);
  });

  test("album page renders a track timeline segment chart", async ({ page }) => {
    await page.goto("/album.html?id=vangelis-voices");

    await expect(page.getByRole("heading", { name: "Voices", level: 1 })).toBeVisible();
    const chart = page.locator("#timelineChart");
    await expect(chart).toHaveAttribute("role", "list");
    await expect(chart).toHaveAttribute("aria-label", /Track timeline breakdown/);
    await expect(chart.locator(".segment-row")).toHaveCount(9);
    await expect(chart.locator(".segment-item-wrapper").first()).toBeVisible();

    // Row labels deep-link to their track cards.
    const firstLabelLink = chart.locator(".segment-row-label a").first();
    await expect(firstLabelLink).toHaveAttribute("href", "#track-1");
    await expect(page.locator("#track-1")).toHaveCount(1);

    // Every bar spans the full width — bars show each track's own section
    // split as a percentage, not track length relative to other tracks.
    const barWidths = await chart.locator(".segment-bar").evaluateAll(
      (bars) => bars.map((bar) => (bar as HTMLElement).style.width),
    );
    for (const width of barWidths) {
      // No inline width is set; the bar fills its grid cell via CSS.
      expect(width).toBe("");
    }
  });

  test("album page provides a back-to-top control on long pages", async ({ page }) => {
    await page.goto("/album.html?id=vangelis-blade-runner");
    await expect(page.getByRole("heading", { name: /Blade Runner/, level: 1 })).toBeVisible();

    const topBtn = page.locator(".back-to-top");
    await expect(topBtn).not.toHaveClass(/is-visible/);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(topBtn).toHaveClass(/is-visible/);

    await topBtn.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(0);
  });

  test("audio-stream button has dark text on bright primary background", async ({ page }) => {
    await page.goto("/album.html?id=klaus-schulze-irrlicht");

    const streamBtn = page.getByRole("link", { name: "Listen on Apple Music" });
    await expect(streamBtn).toBeVisible();

    const colors = await streamBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });

    // Same contract as the Spotify button: primary green with near-black text.
    expect(colors.backgroundColor).toBe("rgb(0, 255, 136)");
    expect(colors.color).toBe("rgb(3, 27, 16)");
  });

  test("every page exposes a skip-to-content link targeting main content", async ({ page }) => {
    const pages = [
      "/index.html",
      "/album.html?id=jean-michel-jarre-oxygene",
      "/credits.html",
    ];

    for (const url of pages) {
      await page.goto(url);
      const skipLink = page.locator(".skip-link");
      await expect(skipLink).toHaveAttribute("href", "#main");
      await expect(page.locator("#main")).toHaveCount(1);
    }
  });

  test("segment chart covers default palette and zero-sum edge case", async ({ page }) => {
    await page.goto("/album.html?id=vangelis-voices");
    await expect(page.getByRole("heading", { name: "Voices", level: 1 })).toBeVisible();

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
      const barWidths = Array.from(defaultEl.querySelectorAll(".segment-bar"))
        .map((bar) => (bar as HTMLElement).style.width);
      const hasNoPctSpan = defaultEl.querySelector(".segment-item-percentage") === null;
      const srSummaries = Array.from(defaultEl.querySelectorAll(".sr-only"))
        .map((el) => el.textContent ?? "");

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
      const zeroBarWidth = (zeroEl.querySelector(".segment-bar") as HTMLElement)?.style.width ?? "";

      return { defaultRows, barWidths, hasNoPctSpan, srSummaries, zeroSegWidth, zeroBarWidth };
    });

    expect(result.defaultRows).toBe(2);
    // Full-width bars: no inline width is set on any bar; each fills its cell.
    expect(result.barWidths).toEqual(["", ""]);
    expect(result.hasNoPctSpan).toBe(true);
    // Rows without links carry a hidden per-track summary for screen readers.
    expect(result.srSummaries).toEqual([
      "Track A, 2:00. Sections: Intro, Outro.",
      "Track B, 1:00. Sections: Main.",
    ]);
    expect(result.zeroSegWidth).toBe("0%");
    // Bars never carry an inline width — full-width is the CSS default.
    expect(result.zeroBarWidth).toBe("");
  });

  test("does not render initial analysis controls", async ({ page }) => {
    await gotoIndex(page);

    await expect(page.getByText("Initial Analysis", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "New album" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Analyse" })).toHaveCount(0);
  });

  test("does not expose an add-album endpoint", async ({ page }) => {
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
    await expect(page.locator(".ix-card-genre-tag")).toHaveCount(0);
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

    expect(scaffoldJson.genre).toBe("");
    expect(scaffoldJson.genreTags).toEqual([]);

    await page.route("**/data/generated-scaffold.json", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(scaffoldJson) });
    });

    await page.goto("/album.html?id=generated-scaffold");

    await expect(page.getByRole("heading", { name: "Voices", level: 1 })).toBeVisible();
    await expect(page.locator(".meta")).not.toContainText("Genre:");
    await expect(page.locator("body")).not.toContainText("TODO");
    await expect(page.locator(".track-role")).toHaveText(
      "Initial scaffold only. Narrative role pending detailed listen.",
    );
    await expect(page.locator(".event-desc")).toContainText("Detailed timestamp notes pending.");
  });

  test("site cover helpers resolve blank sources and bind fallbacks safely", async ({ page }) => {
    await gotoIndex(page);

    const result = await page.evaluate(async () => {
      const sitePath = "/src/site.ts";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const site: any = await import(sitePath);
      const {
        FALLBACK_COVER_URL,
        bindCoverFallbacks,
        resolveCoverImageUrl,
      } = site;

      const container = document.createElement("div");
      const broken = document.createElement("img");
      const blankFallback = document.createElement("img");
      const stale = document.createElement("img");
      const alreadyFallback = document.createElement("img");

      broken.dataset.coverFallback = "covers/custom-fallback.png";
      broken.setAttribute("src", "covers/missing.png");

      blankFallback.dataset.coverFallback = "   ";
      blankFallback.setAttribute("src", "covers/missing-blank.png");

      stale.dataset.coverFallback = "covers/stale-fallback.png";
      stale.setAttribute("src", "covers/stale.png");
      Object.defineProperty(stale, "complete", { configurable: true, get: () => true });
      Object.defineProperty(stale, "naturalWidth", { configurable: true, get: () => 0 });

      alreadyFallback.dataset.coverFallback = "covers/custom-fallback.png";
      alreadyFallback.setAttribute("src", "covers/custom-fallback.png");

      container.append(broken, blankFallback, stale, alreadyFallback);
      document.body.appendChild(container);

      bindCoverFallbacks(container);

      broken.dispatchEvent(new Event("error"));
      blankFallback.dispatchEvent(new Event("error"));
      alreadyFallback.dispatchEvent(new Event("error"));

      return {
        resolved: {
          missing: resolveCoverImageUrl(),
          empty: resolveCoverImageUrl(""),
          whitespace: resolveCoverImageUrl("   "),
          valid: resolveCoverImageUrl("covers/test-cover.png"),
        },
        fallbackSrcs: {
          broken: broken.getAttribute("src"),
          blankFallback: blankFallback.getAttribute("src"),
          stale: stale.getAttribute("src"),
          alreadyFallback: alreadyFallback.getAttribute("src"),
        },
        fallbackClasses: {
          broken: broken.classList.contains("is-fallback-cover"),
          blankFallback: blankFallback.classList.contains("is-fallback-cover"),
          stale: stale.classList.contains("is-fallback-cover"),
          alreadyFallback: alreadyFallback.classList.contains("is-fallback-cover"),
        },
        defaultFallback: FALLBACK_COVER_URL,
      };
    });

    expect(result.resolved).toEqual({
      missing: "covers/fallback-cd-case.svg",
      empty: "covers/fallback-cd-case.svg",
      whitespace: "covers/fallback-cd-case.svg",
      valid: "covers/test-cover.png",
    });
    expect(result.fallbackSrcs).toEqual({
      broken: "covers/custom-fallback.png",
      blankFallback: "covers/fallback-cd-case.svg",
      stale: "covers/stale-fallback.png",
      alreadyFallback: "covers/custom-fallback.png",
    });
    expect(result.fallbackClasses).toEqual({
      broken: true,
      blankFallback: true,
      stale: true,
      alreadyFallback: false,
    });
    expect(result.defaultFallback).toBe("covers/fallback-cd-case.svg");
  });

  test("defaults to the dark theme and offers every registered theme", async ({ page }) => {
    await gotoIndex(page);

    // Fresh visit renders the default dark theme.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const select = page.locator(".theme-switcher-select");
    await expect(select).toBeVisible();
    await expect(select.locator("option")).toHaveText([
      "Dark",
      "Cosmic",
      "Retro",
      "Vintage",
      "Sega",
      "Minimal",
    ]);
    await expect(select).toHaveValue("dark");
  });

  test("selecting a theme applies it and persists across reloads and pages", async ({ page }) => {
    await gotoIndex(page);

    await page.locator(".theme-switcher-select").selectOption("cosmic");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cosmic");

    const stored = await page.evaluate(() => localStorage.getItem("siteThemeId"));
    expect(stored).toBe("cosmic");

    // Persists on reload of the same page.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cosmic");
    await expect(page.locator(".theme-switcher-select")).toHaveValue("cosmic");

    // Persists onto the album page and its switcher reflects the choice.
    await page.goto("/album.html?id=jean-michel-jarre-oxygene");
    await expect(page.getByRole("heading", { name: "Oxygène", level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cosmic");
    await expect(page.locator(".theme-switcher-select")).toHaveValue("cosmic");

    // And onto the credits page.
    await page.goto("/credits.html");
    await expect(page.getByRole("heading", { name: /Credits/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cosmic");
  });

  test("the theme switcher lets the album page change theme in place", async ({ page }) => {
    await page.goto("/album.html?id=jean-michel-jarre-oxygene");
    await expect(page.getByRole("heading", { name: "Oxygène", level: 1 })).toBeVisible();

    await page.locator(".theme-switcher-select").selectOption("sega");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "sega");
    expect(await page.evaluate(() => localStorage.getItem("siteThemeId"))).toBe("sega");
  });

  test("an unknown stored theme falls back to the default", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("siteThemeId", "not-a-real-theme");
    });

    await gotoIndex(page);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".theme-switcher-select")).toHaveValue("dark");
  });

  test("theme helpers cover registry lookups and unknown-id fallbacks", async ({ page }) => {
    await gotoIndex(page);

    const result = await page.evaluate(async () => {
      const themePath = "/src/theme.ts";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const theme: any = await import(themePath);

      // Unknown ids never leave the document without a theme.
      theme.setTheme("bogus");
      const afterBogus = document.documentElement.dataset["theme"];
      const storedAfterBogus = localStorage.getItem("siteThemeId");

      theme.setTheme("retro");
      const afterRetro = document.documentElement.dataset["theme"];

      const switcherHtml = theme.renderThemeSwitcher() as string;

      // bindThemeControls is a no-op on a container without the control.
      const empty = document.createElement("div");
      theme.bindThemeControls(empty);

      return {
        knownDark: theme.isKnownTheme("dark"),
        knownBogus: theme.isKnownTheme("bogus"),
        knownNull: theme.isKnownTheme(null),
        defaultId: theme.DEFAULT_THEME_ID,
        afterBogus,
        storedAfterBogus,
        afterRetro,
        switcherHasRetroSelected: switcherHtml.includes('value="retro" selected'),
      };
    });

    expect(result.knownDark).toBe(true);
    expect(result.knownBogus).toBe(false);
    expect(result.knownNull).toBe(false);
    expect(result.defaultId).toBe("dark");
    expect(result.afterBogus).toBe("dark");
    expect(result.storedAfterBogus).toBe("dark");
    expect(result.afterRetro).toBe("retro");
    expect(result.switcherHasRetroSelected).toBe(true);
  });

  test("credits page renders all sections with nav and footer", async ({ page }) => {
    await page.goto("/credits.html");

    await expect(page.getByRole("heading", { name: /Credits/i })).toBeVisible();
    await expect(page.locator(".site-nav")).toBeVisible();
    await expect(page.locator(".site-nav a[href='index.html']")).toBeVisible();

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

  test("credits page Back to Home link picks a random background and navigates", async ({ page }) => {
    await page.goto("/credits.html");
    await page.getByRole("link", { name: "← Back to Home" }).click();
    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole("heading", { name: "ALBANA" })).toBeVisible();
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

  test("every album JSON has a youtubeUrl", async ({ page }) => {
    const index = await readAlbumIndex(page);
    for (const entry of index) {
      const album = await readAlbumData(page, entry.id);
      expect(album.youtubeUrl, `${entry.id} is missing youtubeUrl`).toBeTruthy();
      expect(album.youtubeUrl, `${entry.id} youtubeUrl is not a valid URL`).toMatch(
        /^https:\/\/(www\.youtube\.com|music\.youtube\.com|youtu\.be)\//,
      );
    }
  });

  test("every album JSON has spotifyUrl or audioStreamUrl", async ({ page }) => {
    const index = await readAlbumIndex(page);
    const exceptions = ["matt-uelmen-diablo-hellfire", "vangelis-cosmos"];
    for (const entry of index) {
      if (exceptions.includes(entry.id)) continue;
      const album = await readAlbumData(page, entry.id);
      const hasAudio = Boolean(album.spotifyUrl) || Boolean(album.audioStreamUrl);
      expect(hasAudio, `${entry.id} is missing both spotifyUrl and audioStreamUrl`).toBe(true);
    }
  });

  test("audioStreamUrl albums show alternative streaming button instead of Spotify", async ({ page }) => {
    await page.goto("/album.html?id=klaus-schulze-irrlicht");

    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveCount(0);
    const audioBtn = page.getByRole("link", { name: "Listen on Apple Music" });
    await expect(audioBtn).toBeVisible();
    await expect(audioBtn).toHaveAttribute("target", "_blank");
    await expect(audioBtn).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Deezer audioStreamUrl resolves to Listen on Deezer label", async ({ page }) => {
    await page.goto("/album.html?id=klaus-schulze-mirage");

    await expect(page.getByRole("link", { name: "Listen on Spotify" })).toHaveCount(0);
    const deezerBtn = page.getByRole("link", { name: "Listen on Deezer" });
    await expect(deezerBtn).toBeVisible();
    await expect(deezerBtn).toHaveAttribute("href", "https://www.deezer.com/album/53122162");
  });
});
