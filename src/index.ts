import { applyStoredBg, bindCoverFallbacks, escapeHtml, FALLBACK_COVER_URL, mountCollectionHero, mountFooter, normaliseText, resolveCoverImageUrl } from "./site";

interface AlbumEntry {
  id:     string;
  artist: string;
  title:  string;
  year:   number;
  tracks: number;
  genre:  string;
  /** Individual genre/subgenre tags derived from `genre` by splitting on "/" and trimming whitespace; `genre` remains the display string. */
  genreTags: string[];
  coverUrl?: string;
}

interface CollectionDom {
  grid: HTMLElement;
  search: HTMLInputElement;
  count: HTMLElement;
}

(function (): void {
  'use strict';

  // One colour per unique artist (sorted A-Z). Identity hues only — the
  // functional colours (--time amber, --warn orange, secondary red) are
  // reserved for timestamps, warnings, and errors. All pass WCAG AA on
  // the card surface at the 12px artist-label size.
  const PALETTE: readonly string[] = [
    '#00ff88', // green
    '#ff6ec7', // pink
    '#5ac8fa', // sky blue
    '#c3f34d', // lime
    '#b18aff', // violet
  ];

  /** Genre tags shown before the "+ more" expander is opened. */
  const VISIBLE_GENRE_TAGS = 10;

  function getCollectionDom(): CollectionDom | null {
    const grid = document.getElementById('ixGrid');
    const search = document.getElementById('ixSearch');
    const count = document.getElementById('ixCount');

    if (!(grid instanceof HTMLElement)) return null;
    if (!(search instanceof HTMLInputElement)) return null;
    if (!(count instanceof HTMLElement)) return null;

    return { grid, search, count };
  }

  function buildColorMap(albums: AlbumEntry[]): Record<string, string> {
    const artists = Array.from(new Set(albums.map(a => a.artist))).sort();
    const map: Record<string, string> = {};
    artists.forEach((name, i) => {
      map[name] = PALETTE[i % PALETTE.length];
    });
    return map;
  }

  function renderAlbumCardMedia(album: AlbumEntry): string {
    const coverSrc = resolveCoverImageUrl(album.coverUrl);

    return (
      `<figure class="ix-card-media relative aspect-square border-b border-base-300/70 bg-base-100/60">` +
        `<img class="ix-card-cover transition duration-500 group-hover:scale-[1.04]" ` +
          `src="${escapeHtml(coverSrc)}" ` +
          `data-album-id="${escapeHtml(album.id)}" ` +
          `data-cover-fallback="${escapeHtml(FALLBACK_COVER_URL)}" ` +
          `alt="Album cover for ${escapeHtml(album.artist)} - ${escapeHtml(album.title)}" ` +
          `loading="lazy" decoding="async" referrerpolicy="no-referrer">` +
      `</figure>`
    );
  }

  const pageEmptyMessage = 'No albums available.';

  mountCollectionHero('ixHero', {
    title: 'ALBANA',
    titleClassName: 'ix-brand-title',
    tagline: 'Your resource for structural album analysis',
    searchPlaceholder: 'Search albums…',
    searchAriaLabel: 'Filter albums',
  });

  const dom = getCollectionDom();
  if (!dom) return;

  const { grid, search, count } = dom;

  mountFooter('siteFooter', {
    context: 'Collection Index',
  });

  let allAlbums: AlbumEntry[] = [];
  let colorMap: Record<string, string> = {};
  const activeArtistTags = new Set<string>();
  const activeGenreTags = new Set<string>();
  let genreTagsExpanded = false;
  let topGenreTags: string[] = [];

  function showError(message: string): void {
    grid.innerHTML =
      '<div class="ix-error alert border border-error/30 bg-error/15 text-sm text-error shadow-lg">' +
        `<span>${escapeHtml(message)}</span>` +
      '</div>';
  }

  async function loadAlbums(): Promise<AlbumEntry[]> {
    const response = await fetch('data/index.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Could not load data/index.json (${response.status}).`);
    }
    return await response.json() as AlbumEntry[];
  }

  function toggleArtistTag(artist: string): void {
    if (activeArtistTags.has(artist)) {
      activeArtistTags.delete(artist);
    } else {
      activeArtistTags.add(artist);
    }
    syncTagButtons();
    render();
  }

  function toggleGenreTag(tag: string): void {
    if (activeGenreTags.has(tag)) {
      activeGenreTags.delete(tag);
    } else {
      activeGenreTags.add(tag);
    }
    syncTagButtons();
    render();
  }

  function clearAllFilters(): void {
    activeArtistTags.clear();
    activeGenreTags.clear();
    search.value = '';
    syncTagButtons();
    render();
  }

  function matchesFilters(album: AlbumEntry, artists: ReadonlySet<string>, genres: ReadonlySet<string>, q: string): boolean {
    const tags = album.genreTags ?? [];
    const matchArtist = artists.size === 0 || artists.has(album.artist);

    let matchGenre = true;
    for (const tag of genres) {
      if (!tags.includes(tag)) {
        matchGenre = false;
        break;
      }
    }

    const matchSearch = !q
      || normaliseText(album.title).indexOf(q) !== -1
      || normaliseText(album.artist).indexOf(q) !== -1
      || tags.some(t => normaliseText(t).indexOf(q) !== -1);

    return matchArtist && matchGenre && matchSearch;
  }

  /** Would adding this genre tag to the current selection still match at least one album? */
  function genreTagHasResults(tag: string): boolean {
    const q = normaliseText(search.value.trim());
    const candidate = new Set(activeGenreTags);
    candidate.add(tag);
    return allAlbums.some(a => matchesFilters(a, activeArtistTags, candidate, q));
  }

  function syncTagButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('.ix-nav-genre-tag').forEach(btn => {
      const tag = btn.dataset['genre'] ?? '';
      const active = activeGenreTags.has(tag);
      btn.classList.toggle('active', active);

      // Combining a genre with the current selection can dead-end at zero
      // results (genres are AND-ed); disable those instead of letting the
      // user walk into an empty grid.
      const dead = !active && !genreTagHasResults(tag);
      btn.disabled = dead;
      btn.setAttribute('aria-disabled', String(dead));

      // The collapsed row shows the most-used tags plus anything active.
      const inTop = topGenreTags.includes(tag);
      btn.hidden = !genreTagsExpanded && !inTop && !active;
    });

    document.querySelectorAll<HTMLButtonElement>('.ix-artist-tag').forEach(btn => {
      const artist = btn.dataset['artist'] ?? '';
      btn.classList.toggle('active', activeArtistTags.has(artist));
    });

    const expander = document.querySelector<HTMLButtonElement>('.ix-tag-expander');
    if (expander) {
      const hiddenCount = Number(expander.dataset['hiddenCount'] ?? '0');
      expander.textContent = genreTagsExpanded ? 'Show fewer' : `+${hiddenCount} more`;
      expander.setAttribute('aria-expanded', String(genreTagsExpanded));
    }
  }

  function renderActiveFilterChips(): void {
    const bar = document.getElementById('ixActiveFilters');
    if (!bar) return;

    const chips: string[] = [];
    for (const artist of Array.from(activeArtistTags).sort()) {
      chips.push(`<button type="button" class="ix-filter-chip badge badge-outline badge-warning h-auto rounded-full px-3 py-2" data-kind="artist" data-value="${escapeHtml(artist)}">${escapeHtml(artist)} ✕</button>`);
    }
    for (const tag of Array.from(activeGenreTags).sort()) {
      chips.push(`<button type="button" class="ix-filter-chip badge badge-outline badge-accent h-auto rounded-full px-3 py-2" data-kind="genre" data-value="${escapeHtml(tag)}">${escapeHtml(tag)} ✕</button>`);
    }

    const hasSearch = search.value.trim().length > 0;
    const clearBtn = (chips.length > 0 || hasSearch)
      ? `<button type="button" class="ix-clear-filters btn btn-xs btn-ghost border border-base-300/60 bg-base-100/40 rounded-full">Clear filters</button>`
      : '';

    bar.innerHTML = chips.join('') + clearBtn;

    bar.querySelectorAll<HTMLButtonElement>('.ix-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.dataset['kind'] === 'artist') {
          toggleArtistTag(chip.dataset['value'] ?? '');
        } else {
          toggleGenreTag(chip.dataset['value'] ?? '');
        }
      });
    });
    bar.querySelector<HTMLButtonElement>('.ix-clear-filters')
      ?.addEventListener('click', clearAllFilters);
  }

  function render(): void {
    const q = normaliseText(search.value.trim());

    const visible = allAlbums.filter(a => matchesFilters(a, activeArtistTags, activeGenreTags, q));

    count.textContent = `${visible.length} / ${allAlbums.length} album${allAlbums.length !== 1 ? 's' : ''}`;
    renderActiveFilterChips();
    syncTagButtons();

    if (visible.length === 0 && !q && allAlbums.length === 0) {
      grid.innerHTML = `<div class="ix-empty alert border border-base-300/70 bg-base-200/80 text-sm text-base-content/70 shadow-lg"><span>${pageEmptyMessage}</span></div>`;
      return;
    }

    if (visible.length === 0) {
      grid.innerHTML =
        `<div class="ix-empty alert border border-base-300/70 bg-base-200/80 text-sm text-base-content/70 shadow-lg">` +
          `<span>No results for the current search and filters.</span>` +
          `<button type="button" class="ix-clear-filters btn btn-xs btn-ghost border border-base-300/60 bg-base-100/40 rounded-full">Clear filters</button>` +
        `</div>`;
      grid.querySelector<HTMLButtonElement>('.ix-clear-filters')
        ?.addEventListener('click', clearAllFilters);
      return;
    }

    grid.innerHTML = visible.map(a => {
      const color = colorMap[a.artist] ?? 'var(--accent)';
      const tags = a.genreTags ?? [];
      const genreHtml = tags.length > 0
        ? `<div class="ix-card-tags">${tags.map(t => {
            const cls = activeGenreTags.has(t) ? ' active' : '';
            return `<span class="ix-genre-tag ix-card-genre-tag${cls}">${escapeHtml(t)}</span>`;
          }).join('')}</div>`
        : '';
      const mediaHtml = renderAlbumCardMedia(a);
      const trackLabel = `${a.tracks} track${a.tracks !== 1 ? 's' : ''}`;
      return (
        `<a class="ix-card group card border border-base-300/70 bg-base-200/85 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-2xl" href="album.html?id=${escapeHtml(a.id)}" style="--card-accent:${color}">` +
          mediaHtml +
          `<div class="ix-card-body card-body gap-3 p-6">` +
            `<h2 class="ix-card-title text-2xl font-semibold leading-tight">${escapeHtml(a.title)}</h2>` +
            `<div class="ix-card-artist text-xs uppercase tracking-[0.18em]">${escapeHtml(a.artist)}</div>` +
            `<div class="ix-card-meta text-xs uppercase tracking-[0.18em]">${escapeHtml(a.year)} &nbsp;·&nbsp; ${escapeHtml(trackLabel)}</div>` +
            genreHtml +
          `</div>` +
          `<div class="ix-card-footer card-actions items-center justify-between border-t border-base-300/70 px-6 py-4 text-xs uppercase tracking-[0.18em]">` +
            `<span>View Analysis</span>` +
            `<span class="ix-card-footer-arrow text-base" aria-hidden="true">→</span>` +
          `</div>` +
        `</a>`
      );
    }).join('');

    bindCoverFallbacks(grid);
  }

  function buildTagCloud(): void {
    const nav = document.getElementById('ixGenreNav');
    if (!nav) return;

    // Artist tags (sorted A-Z)
    const artists = Array.from(new Set(allAlbums.map(a => a.artist))).sort();

    // Genre tag counts (sorted by count descending then alphabetically)
    const tagCounts = new Map<string, number>();
    for (const album of allAlbums) {
      for (const tag of album.genreTags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    const sortedGenres = Array.from(tagCounts.entries()).sort((a, b) =>
      b[1] - a[1] || a[0].localeCompare(b[0])
    );
    topGenreTags = sortedGenres.slice(0, VISIBLE_GENRE_TAGS).map(([tag]) => tag);
    const hiddenCount = Math.max(0, sortedGenres.length - VISIBLE_GENRE_TAGS);

    const expanderHtml = hiddenCount > 0
      ? `<button type="button" class="ix-genre-tag ix-tag-expander" data-hidden-count="${hiddenCount}" aria-expanded="false">+${hiddenCount} more</button>`
      : '';

    nav.innerHTML =
      `<div class="ix-nav-artist-tags">` +
      `<span class="ix-tag-group-label">Artists</span>` +
      artists.map(artist =>
        `<button type="button" class="ix-artist-tag ix-nav-artist-tag" data-artist="${escapeHtml(artist)}">${escapeHtml(artist)}</button>`
      ).join('') +
      `</div>` +
      `<div class="ix-nav-genre-tags">` +
      `<span class="ix-tag-group-label">Genres</span>` +
      sortedGenres.map(([tag, cnt]) =>
        `<button type="button" class="ix-genre-tag ix-nav-genre-tag" data-genre="${escapeHtml(tag)}" title="${cnt} album${cnt !== 1 ? 's' : ''}">${escapeHtml(tag)}<span class="ix-genre-tag-count">${cnt}</span></button>`
      ).join('') +
      expanderHtml +
      `</div>`;

    nav.querySelectorAll<HTMLButtonElement>('.ix-nav-artist-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleArtistTag(btn.dataset['artist'] ?? '');
      });
    });

    nav.querySelectorAll<HTMLButtonElement>('.ix-nav-genre-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleGenreTag(btn.dataset['genre'] ?? '');
      });
    });

    nav.querySelector<HTMLButtonElement>('.ix-tag-expander')?.addEventListener('click', () => {
      genreTagsExpanded = !genreTagsExpanded;
      syncTagButtons();
    });

    syncTagButtons();
  }

  search.addEventListener('input', render);

  async function main(): Promise<void> {
    applyStoredBg();

    try {
      allAlbums = (await loadAlbums()).slice().sort((left, right) =>
        left.year - right.year
        || left.artist.localeCompare(right.artist)
        || left.title.localeCompare(right.title)
      );
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'Could not load album data.');
      return;
    }

    colorMap = buildColorMap(allAlbums);
    buildTagCloud();
    render();
  }

  main().catch((error: unknown) => {
    showError(error instanceof Error ? error.message : 'Unexpected error.');
  });
}());
