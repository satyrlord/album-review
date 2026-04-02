import { expect, test, type Page } from "@playwright/test";

import { buildHtml } from "../album-scaffold.js";

interface AlbumIndexEntry {
  id: string;
  artist: string;
  title: string;
  year: number;
  tracks: number;
  genre: string;
  coverUrl?: string;
}

interface AlbumData {
  id: string;
  artist: string;
  title: string;
  coverUrl?: string;
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

test.describe("album index regressions", () => {
  test("renders all registered albums on first load", async ({ page }) => {
    const totalAlbums = (await readAlbumIndex(page)).length;

    await gotoIndex(page);

    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
    await expect(page.locator("#ixCount")).toHaveText(`${totalAlbums} / ${totalAlbums} albums`);
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

  test("opens an album page and returns to the index", async ({ page }) => {
    await gotoIndex(page);

    await page.locator('.ix-card[href="album.html?id=mike-oldfield-tubular-bells-ii"]').click();

    await expect(page).toHaveURL(/album\.html\?id=mike-oldfield-tubular-bells-ii$/);
    await expect(page.getByRole("heading", { name: "Tubular Bells II" })).toBeVisible();

    await page.getByRole("link", { name: "← All Albums" }).first().click();

    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
  });

  test("album page renders JSON data via dynamic renderer", async ({ page }) => {
    const album = await readAlbumData(page, "jean-michel-jarre-oxygene");
    const expectedCover = album.coverUrl ?? "";

    await page.goto("/album.html?id=jean-michel-jarre-oxygene");

    await expect(page.getByRole("heading", { name: "Oxygène" })).toBeVisible();
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

    await page.getByRole("link", { name: "← All Albums" }).first().click();
    await expect(page).toHaveURL(/\/index\.html$/);
  });

  test("album page shows error for unknown id", async ({ page }) => {
    await page.goto("/album.html?id=no-such-album");
    await expect(page.locator("body")).toContainText("Could not load album");
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

  test("generated scaffold pages omit missing genre rows and raw TODO placeholders", async ({ page }) => {
    const scaffoldHtml = buildHtml(
      "Vangelis",
      "Voices",
      1995,
      "",
      [{ num: 1, title: "Voices", lengthMs: 422000 }],
      "1995-10-17",
    );

    await page.route("**/__fixtures__/generated-scaffold.html", async (route) => {
      await route.fulfill({ contentType: "text/html", body: scaffoldHtml });
    });

    await page.goto("/__fixtures__/generated-scaffold.html");

    await expect(page.getByRole("heading", { name: "Voices" })).toBeVisible();
    await expect(page.locator(".meta")).not.toContainText("Genre:");
    await expect(page.locator("body")).not.toContainText("TODO");
    await expect(page.locator(".track-role")).toHaveText(
      "Initial scaffold only. Narrative role pending detailed listen.",
    );
    await expect(page.locator(".event-desc")).toContainText("Detailed timestamp notes pending.");
  });
});