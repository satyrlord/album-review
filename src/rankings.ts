import { escapeHtml, normaliseText, renderFooter, renderNav } from "./site";

interface CollectionEntry {
  id: string;
  artist: string;
  title: string;
  year: number;
}

interface RankedAlbum {
  rank: number;
  artist: string;
  title: string;
  year: number;
  decade: string;
  genre: string;
  note: string;
}

type RankingPage = "top10" | "top20";

interface RankingConfig {
  title: string;
  heading: string;
  subtitle: string;
  intro: string;
  selectEntries(entries: readonly RankedAlbum[]): RankedAlbum[];
}

(function (): void {
  "use strict";

  const DECADE_ORDER: readonly string[] = [
    "Early Pioneers",
    "1980s",
    "1990s",
    "2000s",
    "Present Day",
  ];

  const PAGES: Record<RankingPage, RankingConfig> = {
    top10: {
      title: "TOP 10 | Album Analysis",
      heading: "TOP 10",
      subtitle: "Highest-Rated Electronic / New Age / Ambient Albums",
      intro: "Ten essential albums per era, from the early synthesiser pioneers through to the present day. Green entries link to full structural analysis.",
      selectEntries(entries: readonly RankedAlbum[]): RankedAlbum[] {
        return entries.filter(entry => entry.rank <= 10);
      },
    },
    top20: {
      title: "TOP 20 | Album Analysis",
      heading: "TOP 20",
      subtitle: "Expanded Cross-Era Canon",
      intro: "Twenty albums per era charting the full breadth of electronic, new-age, and ambient music. Covered albums stay live; future additions remain visibly muted.",
      selectEntries(entries: readonly RankedAlbum[]): RankedAlbum[] {
        return entries.slice();
      },
    },
  };

  function entryKey(artist: string, title: string, year: number): string {
    return `${normaliseText(artist)}::${normaliseText(title)}::${year}`;
  }

  function renderSiteFooter(context: string): string {
    return renderFooter({
      context,
      actionHref: "index.html",
      actionLabel: "All Albums",
    });
  }

  function renderSiteNav(activePage: RankingPage): string {
    return renderNav({ activePage });
  }

  function buildCollectionMap(collection: CollectionEntry[]): Map<string, string> {
    const map = new Map<string, string>();
    collection.forEach(entry => {
      map.set(entryKey(entry.artist, entry.title, entry.year), entry.id);
    });
    return map;
  }

  function groupByDecade(entries: readonly RankedAlbum[]): Array<{ decade: string; entries: RankedAlbum[] }> {
    const buckets = new Map<string, RankedAlbum[]>();

    entries.forEach(entry => {
      let decadeEntries = buckets.get(entry.decade);
      if (!decadeEntries) {
        decadeEntries = [];
        buckets.set(entry.decade, decadeEntries);
      }
      decadeEntries.push(entry);
    });

    return Array.from(buckets.entries())
      .sort((left, right) => {
        const leftIndex = DECADE_ORDER.indexOf(left[0]);
        const rightIndex = DECADE_ORDER.indexOf(right[0]);
        return leftIndex - rightIndex;
      })
      .map(([decade, decadeEntries]) => ({ decade, entries: decadeEntries }));
  }

  function renderEntry(entry: RankedAlbum, collectionMap: Map<string, string>): string {
    const rank = String(entry.rank).padStart(2, "0");
    const matchId = collectionMap.get(entryKey(entry.artist, entry.title, entry.year));
    const state = matchId ? "IN COLLECTION →" : "NOT IN COLLECTION";
    const shellTag = matchId ? "a" : "article";
    const href = matchId ? ` href="album.html?id=${escapeHtml(matchId)}"` : "";
    const cls = matchId
      ? "ranking-item is-available card border border-base-300/70 bg-base-200/80 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-2xl"
      : "ranking-item is-unavailable card border border-base-300/60 bg-base-200/70 shadow-lg";
    const stateClass = matchId
      ? "ranking-state badge badge-outline badge-success h-auto rounded-full px-4 py-3 text-[0.68rem] uppercase tracking-[0.18em]"
      : "ranking-state badge badge-ghost h-auto rounded-full border border-base-300/60 px-4 py-3 text-[0.68rem] uppercase tracking-[0.18em]";

    return (
      `      <${shellTag} class="${cls}"${href}>\n` +
      `        <div class="card-body gap-5 p-6 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">\n` +
      `          <div class="ranking-rank badge badge-outline badge-warning badge-lg h-auto rounded-full px-4 py-3">${rank}</div>\n` +
      `          <div class="ranking-body min-w-0">\n` +
      `            <div class="ranking-title text-2xl font-semibold leading-tight">${escapeHtml(entry.title)}</div>\n` +
      `            <div class="ranking-artist mt-2 text-xs uppercase tracking-[0.18em]">${escapeHtml(entry.artist)}</div>\n` +
      `            <div class="ranking-meta mt-3 text-xs uppercase tracking-[0.18em]">${escapeHtml(entry.year)} · ${escapeHtml(entry.genre)} · ${escapeHtml(entry.decade)}</div>\n` +
      `            <p class="ranking-note mt-4 text-sm leading-7">${escapeHtml(entry.note)}</p>\n` +
      `          </div>\n` +
      `          <div class="${stateClass}">${state}</div>\n` +
      `        </div>\n` +
      `      </${shellTag}>`
    );
  }

  function renderPage(pageKey: RankingPage, allEntries: readonly RankedAlbum[], collectionMap: Map<string, string>): string {
    const config = PAGES[pageKey];
    const pageEntries = config.selectEntries(allEntries);
    const availableCount = pageEntries.filter(entry => collectionMap.has(entryKey(entry.artist, entry.title, entry.year))).length;
    const footerHtml = renderSiteFooter(pageKey === "top20" ? "Top 20 by Decade" : "Top 10 by Decade");
    const sectionsHtml = groupByDecade(pageEntries).map(section => (
      `  <section class="ranking-decade">\n` +
      `    <div class="ranking-decade-head">\n` +
      `      <h2>${escapeHtml(section.decade)}</h2>\n` +
      `      <span>${section.entries.length} ${section.entries.length === 1 ? "entry" : "entries"}</span>\n` +
      `    </div>\n` +
      `    <div class="ranking-list">\n` +
      section.entries.map(entry => renderEntry(entry, collectionMap)).join("\n") + "\n" +
      `    </div>\n` +
      `  </section>`
    )).join("\n\n");

    return (
      `<div class="hero ranking-hero">\n` +
      `  <div class="container">\n` +
      renderSiteNav(pageKey) +
      `    <div class="subtitle badge badge-outline badge-secondary mt-5 w-fit px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">${escapeHtml(config.subtitle)}</div>\n` +
      `    <div class="ranking-heading mt-5">\n` +
      `      <h1 class="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-base-content sm:text-5xl lg:text-6xl 2xl:text-7xl"><span class="text-primary">${escapeHtml(config.heading)}</span> By Decade</h1>\n` +
      `      <div class="ranking-count badge badge-outline badge-warning badge-lg h-auto rounded-full px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em]">${pageEntries.length} ranked albums</div>\n` +
      `    </div>\n` +
      `    <p class="ranking-intro mt-4 max-w-4xl text-base leading-8">${escapeHtml(config.intro)}</p>\n` +
      `  </div>\n` +
      `</div>\n\n` +
      `<div class="container pb-20">\n` +
      `  <section class="ranking-summary card border border-base-300/70 bg-base-200/80 shadow-xl backdrop-blur-xl">\n` +
      `    <div class="card-body gap-5 p-6 sm:p-8 xl:flex xl:flex-row xl:items-center xl:justify-between">\n` +
      `      <div class="ranking-summary-text text-xs uppercase tracking-[0.22em] text-base-content/60">${availableCount} / ${pageEntries.length} entries already analysed in this collection</div>\n` +
      `      <div class="ranking-legend">\n` +
      `        <span class="ranking-key ranking-key--available badge badge-outline badge-success h-auto rounded-full px-4 py-3 text-[0.68rem] uppercase tracking-[0.18em]">Green = linked analysis</span>\n` +
      `        <span class="ranking-key ranking-key--unavailable badge badge-ghost h-auto rounded-full border border-base-300/60 px-4 py-3 text-[0.68rem] uppercase tracking-[0.18em]">Grey = future addition</span>\n` +
      `      </div>\n` +
      `    </div>\n` +
      `  </section>\n\n` +
      sectionsHtml + "\n" +
      `</div>\n\n` +
      footerHtml
    );
  }

  function showError(pageKey: RankingPage, message: string): void {
    const root = document.getElementById("rankingRoot");
    if (!root) return;

    const footerHtml = renderSiteFooter(pageKey === "top20" ? "Top 20 by Decade" : "Top 10 by Decade");

    root.outerHTML =
      `<div class="hero ranking-hero">\n` +
      `  <div class="container">\n` +
      renderSiteNav(pageKey) +
      `    <div class="page-state page-state--error mt-5 rounded-[1.6rem] border border-error/25 bg-base-200/82 p-6 shadow-xl backdrop-blur-xl">\n` +
      `      <p class="page-state-title">${escapeHtml(message)}</p>\n` +
      `      <p class="page-state-copy mt-4">The ranked pages need both data/rankings.json and data/index.json to determine which albums are already covered.</p>\n` +
      `    </div>\n` +
      `  </div>\n` +
      `</div>\n\n` +
      footerHtml;
  }

  async function loadCollection(): Promise<CollectionEntry[]> {
    const response = await fetch("data/index.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load data/index.json (${response.status}).`);
    }
    return await response.json() as CollectionEntry[];
  }

  async function loadRankings(): Promise<RankedAlbum[]> {
    const response = await fetch("data/rankings.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load data/rankings.json (${response.status}).`);
    }
    return await response.json() as RankedAlbum[];
  }

  async function main(): Promise<void> {
    const pageKey = document.body.dataset["ranking"] === "top20" ? "top20" : "top10";
    const root = document.getElementById("rankingRoot");
    if (!root) return;

    document.title = PAGES[pageKey].title;

    try {
      const collection = await loadCollection();
      const rankings = await loadRankings();
      const collectionMap = buildCollectionMap(collection);
      root.outerHTML = renderPage(pageKey, rankings, collectionMap);
    } catch (error: unknown) {
      showError(pageKey, error instanceof Error ? error.message : "Could not load ranking data.");
    }
  }

  void main();
}());
