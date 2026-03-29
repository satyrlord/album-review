import { expect, test, type Page } from "@playwright/test";

import { buildHtml } from "../album-scaffold.js";

async function gotoIndex(page: Page): Promise<void> {
  await page.goto("/index.html");
  await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
}

test.describe("album index regressions", () => {
  test("renders all registered albums on first load", async ({ page }) => {
    await gotoIndex(page);

    const totalAlbums = await page.evaluate(() => (window as any).ALBUMS.length);

    await expect(page.locator(".ix-card")).toHaveCount(totalAlbums);
    await expect(page.locator("#ixCount")).toHaveText(`${totalAlbums} / ${totalAlbums} albums`);
  });

  test("matches accent-insensitive album title searches", async ({ page }) => {
    await gotoIndex(page);

    const query = "oxygene";
    const totalAlbums = await page.evaluate(() => (window as any).ALBUMS.length);
    const expectedMatches = await page.evaluate((searchQuery) => {
      const normalise = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return (window as any).ALBUMS.filter((album: { title: string }) => normalise(album.title).includes(searchQuery)).length;
    }, query);

    await page.getByRole("searchbox", { name: "Filter albums" }).fill(query);

    await expect(page.locator(".ix-card")).toHaveCount(expectedMatches);
    await expect(page.locator("#ixCount")).toHaveText(`${expectedMatches} / ${totalAlbums} albums`);
    await expect(page.getByText("Oxygène", { exact: true })).toBeVisible();
    await expect(page.getByText("Oxygène 7–13", { exact: true })).toBeVisible();
    await expect(page.getByText("Oxygène 3", { exact: true })).toBeVisible();
  });

  test("filters by artist pill without leaking other artists", async ({ page }) => {
    await gotoIndex(page);

    const totalAlbums = await page.evaluate(() => (window as any).ALBUMS.length);
    const expectedMatches = await page.evaluate(
      () => (window as any).ALBUMS.filter((album: { artist: string }) => album.artist === "Mike Oldfield").length,
    );

    await page.getByRole("button", { name: "Mike Oldfield" }).click();

    await expect(page.locator(".ix-card")).toHaveCount(expectedMatches);
    await expect(page.locator("#ixCount")).toHaveText(`${expectedMatches} / ${totalAlbums} albums`);
    await expect(page.locator(".ix-card-artist")).toHaveText(Array(expectedMatches).fill("Mike Oldfield"));
  });

  test("opens an album page and returns to the index", async ({ page }) => {
    await gotoIndex(page);

    await page.locator('.ix-card[href="mike-oldfield-tubular-bells-ii-structural-analysis.html"]').click();

    await expect(page).toHaveURL(/mike-oldfield-tubular-bells-ii-structural-analysis\.html$/);
    await expect(page.getByRole("heading", { name: "Tubular Bells II" })).toBeVisible();

    await page.getByRole("link", { name: "← All Albums" }).click();

    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(page.getByRole("heading", { name: "Album Analysis" })).toBeVisible();
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
    await page.route("**/albums.js", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `window.ALBUMS = [{
          file: 'mock-album.html',
          artist: 'Mock Artist',
          title: 'Mock Album',
          year: 2024,
          tracks: 4,
          genre: '<!-- TODO: add genre -->'
        }];`,
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