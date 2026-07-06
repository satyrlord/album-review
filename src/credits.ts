import { applyStoredBg, bindFooterControls, escapeHtml, pickAndStoreRandomBg, renderBackNav, renderFooter } from "./site";

interface CreditEntry {
  source: string;
  usage: string;
  url?: string;
}

interface CreditSection {
  heading: string;
  description: string;
  entries: CreditEntry[];
}

(function (): void {
  "use strict";

  const MUSIC_SOURCES: CreditEntry[] = [
    { source: "MusicBrainz", usage: "Canonical track listings, durations, and release metadata for all album analyses", url: "https://musicbrainz.org/" },
    { source: "Wikipedia", usage: "Album context, production notes, release history, and genre classification", url: "https://en.wikipedia.org/" },
    { source: "Spotify", usage: "Streaming links on album detail pages", url: "https://open.spotify.com/" },
    { source: "YouTube", usage: "Streaming links on album detail pages", url: "https://www.youtube.com/" },
  ];

  const COVER_ART_SOURCES: CreditEntry[] = [
    { source: "Wikimedia Commons / Wikipedia", usage: "Original source for most locally cached album-cover files.", url: "https://commons.wikimedia.org/" },
    { source: "Amazon Product Images", usage: "Original source for the locally cached Vangelis — Cosmos cover.", url: "https://www.amazon.com/" },
    { source: "Ozone.ro", usage: "Original source for the locally cached Jean-Michel Jarre — Oxygène Trilogy cover." },
    { source: "Deezer CDN", usage: "Original source for the locally cached Nine Inch Nails — Quake cover.", url: "https://www.deezer.com/" },
  ];

  const RESEARCH_SOURCES: CreditEntry[] = [
    { source: "Pitchfork", usage: "\"The 50 Best Ambient Albums of All Time\" — album discovery and cross-referencing", url: "https://pitchfork.com/" },
    { source: "SensCritique", usage: "\"My 50 Best Ambient Albums of All Time\" — ranked curated list", url: "https://www.senscritique.com/" },
    { source: "Optimistic Underground", usage: "\"32 Best Ambient Albums Ever Made\" — chronological curated list", url: "https://optimisticunderground.com/" },
    { source: "Hyperreal.org", usage: "Classic Ambient Recordings Survey (2001) — community poll data", url: "http://music.hyperreal.org/" },
    { source: "Scaruffi", usage: "\"Best Ambient Albums of All Time\" — critic ranking", url: "https://www.scaruffi.com/" },
    { source: "Album of the Year / AllMusic", usage: "Highest rated ambient albums aggregation", url: "https://www.albumoftheyear.org/" },
    { source: "Deep Cuts (Substack)", usage: "\"30 Records That Fuelled My Ambient Obsession\" — curated newsletter", url: "https://deepcutswrites.substack.com/" },
    { source: "BBC Radio 3", usage: "\"10 Relaxing Ambient Albums for Meditation\" — editorial selection", url: "https://www.bbc.co.uk/radio3" },
    { source: "RateYourMusic", usage: "\"My Top 100 Ambient Albums\" by kuszynier — personal ranked list", url: "https://rateyourmusic.com/" },
    { source: "Psy-Amb", usage: "\"Best Ambient Music of All Time Top 25\" (Darktremor via Listology) — personal ranked list", url: "https://psy-amb.blogspot.com/" },
    { source: "Reddit r/ambientmusic", usage: "Top 100 Favorite Albums community poll (2024)", url: "https://www.reddit.com/r/ambientmusic/" },
    { source: "AcclaimedMusic", usage: "Ambient genre chart — aggregated critical consensus", url: "https://www.acclaimedmusic.net/" },
  ];

  const TECHNOLOGY_SOURCES: CreditEntry[] = [
    { source: "Vite", usage: "Build toolchain and development server", url: "https://vite.dev/" },
    { source: "TypeScript", usage: "Type-safe browser and tooling code", url: "https://www.typescriptlang.org/" },
    { source: "Tailwind CSS", usage: "Utility-first CSS framework", url: "https://tailwindcss.com/" },
    { source: "DaisyUI", usage: "Component library and dark theme system", url: "https://daisyui.com/" },
    { source: "Playwright", usage: "Browser regression testing and coverage capture", url: "https://playwright.dev/" },
    { source: "GitHub Pages", usage: "Static site hosting and deployment", url: "https://pages.github.com/" },
  ];

  const SECTIONS: CreditSection[] = [
    { heading: "Musical Sources", description: "Metadata and streaming services used for album analysis content.", entries: MUSIC_SOURCES },
    { heading: "Cover Art", description: "Album cover images are used under fair use for identification purposes. All rights belong to their respective copyright holders.", entries: COVER_ART_SOURCES },
    { heading: "Research Sources", description: "Curated lists and community polls used for the future research shortlist.", entries: RESEARCH_SOURCES },
    { heading: "Technology", description: "Open-source tools and services powering this site.", entries: TECHNOLOGY_SOURCES },
  ];

  function renderEntry(entry: CreditEntry): string {
    const sourceHtml = entry.url
      ? `<a class="credits-link text-primary hover:text-primary/80 hover:underline" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.source)}</a>`
      : `<span class="credits-source">${escapeHtml(entry.source)}</span>`;

    return (
      `        <div class="credits-entry flex flex-col gap-1 rounded-2xl border border-base-300/60 bg-base-100/40 px-5 py-4">\n` +
      `          <div class="text-sm font-semibold">${sourceHtml}</div>\n` +
      `          <div class="text-xs text-base-content/60">${escapeHtml(entry.usage)}</div>\n` +
      `        </div>`
    );
  }

  function renderSection(section: CreditSection): string {
    return (
      `  <section class="credits-section card border border-base-300/70 bg-base-200/80 shadow-xl backdrop-blur-xl">\n` +
      `    <div class="card-body gap-5 p-6 sm:p-8">\n` +
      `      <h2 class="font-display text-2xl font-semibold tracking-[-0.03em]">${escapeHtml(section.heading)}</h2>\n` +
      `      <p class="text-sm leading-7 text-base-content/60">${escapeHtml(section.description)}</p>\n` +
      `      <div class="credits-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">\n` +
      section.entries.map(renderEntry).join("\n") + "\n" +
      `      </div>\n` +
      `    </div>\n` +
      `  </section>`
    );
  }

  function renderPage(): string {
    const navHtml = renderBackNav();
    const footerHtml = renderFooter({ context: "Credits & Sources" });

    return (
      `<div class="hero" id="main">\n` +
      `  <div class="container">\n` +
      navHtml +
      `    <div class="subtitle badge badge-outline badge-accent mt-5 w-fit px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">Acknowledgements</div>\n` +
      `    <div class="mt-5">\n` +
      `      <h1 class="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-base-content sm:text-5xl lg:text-6xl 2xl:text-7xl">Credits &amp; <span class="text-primary">Sources</span></h1>\n` +
      `    </div>\n` +
      `    <p class="mt-4 max-w-4xl text-base leading-8">Musical metadata, album artwork, research lists, and open-source tools that make this project possible.</p>\n` +
      `  </div>\n` +
      `</div>\n\n` +
      `<div class="container space-y-8 pb-20">\n` +
      SECTIONS.map(renderSection).join("\n\n") + "\n" +
      `</div>\n\n` +
      footerHtml
    );
  }

  function main(): void {
    applyStoredBg();

    const root = document.getElementById("creditsRoot");
    if (!root) return;

    document.title = "Credits | ALBANA";
    root.outerHTML = renderPage();
    bindFooterControls();

    document.querySelector<HTMLAnchorElement>('[data-js="pick-random-bg"]')
      ?.addEventListener('click', () => { pickAndStoreRandomBg(); });
  }

  main();
}());
