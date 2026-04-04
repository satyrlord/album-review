import { escapeHtml, mountFooter, mountNav, normaliseText } from "./site";

interface AlbumEntry {
  id:     string;
  artist: string;
  title:  string;
  year:   number;
  tracks: number;
  genre:  string;
  coverUrl?: string;
  isSoundtrack?: boolean;
}

type CollectionPage = 'home' | 'soundtracks';

interface CollectionPageConfig {
  footerContext: string;
  emptyMessage: string;
  sortAndFilter(albums: AlbumEntry[]): AlbumEntry[];
}

interface CollectionDom {
  grid: HTMLElement;
  filters: HTMLElement;
  search: HTMLInputElement;
  count: HTMLElement;
}

(function (): void {
  'use strict';

  // One colour per unique artist (sorted A-Z). Extend if needed.
  const PALETTE: readonly string[] = [
    'var(--accent)',   // green
    'var(--time)',     // amber
    'var(--accent3)',  // purple
    'var(--accent2)',  // red
    'var(--warn)',     // orange
  ];

  function getCollectionDom(): CollectionDom | null {
    const grid = document.getElementById('ixGrid');
    const filters = document.getElementById('ixFilters');
    const search = document.getElementById('ixSearch');
    const count = document.getElementById('ixCount');

    if (!(grid instanceof HTMLElement)) return null;
    if (!(filters instanceof HTMLElement)) return null;
    if (!(search instanceof HTMLInputElement)) return null;
    if (!(count instanceof HTMLElement)) return null;

    return { grid, filters, search, count };
  }

  function displayGenre(value: string): string {
    const genre = String(value || '').trim();
    return genre && !/^<!--[\s\S]*-->$/.test(genre) ? genre : '';
  }

  function buildColorMap(albums: AlbumEntry[]): Record<string, string> {
    const artists = Array.from(new Set(albums.map(a => a.artist))).sort();
    const map: Record<string, string> = {};
    artists.forEach((name, i) => {
      map[name] = PALETTE[i % PALETTE.length];
    });
    return map;
  }

  const dom = getCollectionDom();
  if (!dom) return;

  const { grid, filters, search, count } = dom;

  const pageKey: CollectionPage = document.body.dataset['collection'] === 'soundtracks'
    ? 'soundtracks'
    : 'home';

  const PAGE_CONFIG: Record<CollectionPage, CollectionPageConfig> = {
    home: {
      footerContext: 'Collection Index',
      emptyMessage: 'No albums available.',
      sortAndFilter(albums: AlbumEntry[]): AlbumEntry[] {
        return albums.slice().sort((left, right) =>
          left.year - right.year
          || left.artist.localeCompare(right.artist)
          || left.title.localeCompare(right.title)
        );
      },
    },
    soundtracks: {
      footerContext: 'Soundtracks',
      emptyMessage: 'No soundtrack albums available.',
      sortAndFilter(albums: AlbumEntry[]): AlbumEntry[] {
        return albums
          .filter(album => album.isSoundtrack)
          .sort((left, right) =>
            left.year - right.year
            || left.artist.localeCompare(right.artist)
            || left.title.localeCompare(right.title)
          );
      },
    },
  };

  mountNav('siteNav', {
    activePage: pageKey,
  });

  mountFooter('siteFooter', {
    context: PAGE_CONFIG[pageKey].footerContext,
  });

  let allAlbums: AlbumEntry[] = [];
  let colorMap: Record<string, string> = {};
  let activeArtist = 'All';

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

  function buildPills(): void {
    const artists = ['All', ...Array.from(new Set(allAlbums.map(a => a.artist))).sort()];
    filters.innerHTML = artists.map(name => {
      const cls = name === 'All' ? ' active' : '';
      return `<button type="button" class="ix-pill btn btn-sm btn-ghost border border-base-300/60 bg-base-100/40 hover:border-primary/35 hover:bg-primary/10 hover:text-primary${cls}" data-artist="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
    }).join('');

    filters.querySelectorAll<HTMLButtonElement>('.ix-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeArtist = btn.dataset['artist'] ?? 'All';
        filters.querySelectorAll('.ix-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      });
    });
  }

  function render(): void {
    const q = normaliseText(search.value.trim());

    const visible = allAlbums.filter(a => {
      const genre = displayGenre(a.genre);
      const matchArtist = activeArtist === 'All' || a.artist === activeArtist;
      const matchSearch = !q
        || normaliseText(a.title).indexOf(q) !== -1
        || normaliseText(a.artist).indexOf(q) !== -1
        || normaliseText(genre).indexOf(q) !== -1;
      return matchArtist && matchSearch;
    });

    count.textContent = `${visible.length} / ${allAlbums.length} album${allAlbums.length !== 1 ? 's' : ''}`;

    if (visible.length === 0 && !q && allAlbums.length === 0) {
      grid.innerHTML = `<div class="ix-empty alert border border-base-300/70 bg-base-200/80 text-sm text-base-content/70 shadow-lg"><span>${PAGE_CONFIG[pageKey].emptyMessage}</span></div>`;
      return;
    }

    if (visible.length === 0) {
      grid.innerHTML = `<div class="ix-empty alert border border-base-300/70 bg-base-200/80 text-sm text-base-content/70 shadow-lg"><span>No albums match &ldquo;${escapeHtml(search.value)}&rdquo;.</span></div>`;
      return;
    }

    grid.innerHTML = visible.map(a => {
      const color = colorMap[a.artist] ?? 'var(--accent)';
      const genre = displayGenre(a.genre);
      const genreHtml = genre
        ? `<div class="ix-card-genre badge badge-outline badge-sm w-fit border-base-300/70 px-3 py-3 text-[0.65rem] uppercase tracking-[0.18em]">${escapeHtml(genre)}</div>`
        : '';
      const mediaHtml = a.coverUrl
        ? `<figure class="ix-card-media relative aspect-square border-b border-base-300/70 bg-base-100/60"><img class="ix-card-cover transition duration-500 group-hover:scale-[1.04]" src="${escapeHtml(a.coverUrl)}" alt="Album cover for ${escapeHtml(a.artist)} - ${escapeHtml(a.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></figure>`
        : '';
      const trackLabel = `${a.tracks} track${a.tracks !== 1 ? 's' : ''}`;
      return (
        `<a class="ix-card group card border border-base-300/70 bg-base-200/85 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-2xl" href="album.html?id=${escapeHtml(a.id)}" style="--card-accent:${color}">` +
          mediaHtml +
          `<div class="ix-card-body card-body gap-3 p-6">` +
            genreHtml +
            `<div class="ix-card-title text-2xl font-semibold leading-tight">${escapeHtml(a.title)}</div>` +
            `<div class="ix-card-artist text-xs uppercase tracking-[0.18em]">${escapeHtml(a.artist)}</div>` +
            `<div class="ix-card-meta text-xs uppercase tracking-[0.18em]">${escapeHtml(a.year)} &nbsp;·&nbsp; ${escapeHtml(trackLabel)}</div>` +
          `</div>` +
          `<div class="ix-card-footer card-actions items-center justify-between border-t border-base-300/70 px-6 py-4 text-xs uppercase tracking-[0.18em]">` +
            `<span>View Analysis</span>` +
            `<span class="ix-card-footer-arrow text-base" aria-hidden="true">→</span>` +
          `</div>` +
        `</a>`
      );
    }).join('');
  }

  search.addEventListener('input', render);

  async function main(): Promise<void> {
    try {
      allAlbums = PAGE_CONFIG[pageKey].sortAndFilter(await loadAlbums());
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'Could not load album data.');
      return;
    }

    colorMap = buildColorMap(allAlbums);
    buildPills();
    render();
  }

  main().catch((error: unknown) => {
    showError(error instanceof Error ? error.message : 'Unexpected error.');
  });
}());
