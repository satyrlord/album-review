interface AlbumEntry {
  id:     string;
  artist: string;
  title:  string;
  year:   number;
  tracks: number;
  genre:  string;
  coverUrl?: string;
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

  function esc(s: string | number): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normaliseText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
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

  const grid    = document.getElementById('ixGrid')!;
  const filters = document.getElementById('ixFilters')!;
  const search  = document.getElementById('ixSearch') as HTMLInputElement;
  const count   = document.getElementById('ixCount')!;

  let allAlbums: AlbumEntry[] = [];
  let colorMap: Record<string, string> = {};
  let activeArtist = 'All';

  function showError(message: string): void {
    grid.innerHTML =
      '<div class="ix-error">' +
        `${esc(message)}` +
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
      return `<button class="ix-pill${cls}" data-artist="${esc(name)}">${esc(name)}</button>`;
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
      grid.innerHTML = '<div class="ix-empty">No albums available.</div>';
      return;
    }

    if (visible.length === 0) {
      grid.innerHTML = `<div class="ix-empty">No albums match &ldquo;${esc(search.value)}&rdquo;.</div>`;
      return;
    }

    grid.innerHTML = visible.map(a => {
      const color = colorMap[a.artist] ?? 'var(--accent)';
      const genre = displayGenre(a.genre);
      const genreHtml = genre ? `<div class="ix-card-genre">${esc(genre)}</div>` : '';
      const mediaHtml = a.coverUrl
        ? `<div class="ix-card-media"><img class="ix-card-cover" src="${esc(a.coverUrl)}" alt="Album cover for ${esc(a.artist)} - ${esc(a.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>`
        : '';
      const trackLabel = `${a.tracks} track${a.tracks !== 1 ? 's' : ''}`;
      return (
        `<a class="ix-card" href="album.html?id=${esc(a.id)}" style="--card-accent:${color}">` +
          mediaHtml +
          `<div class="ix-card-body">` +
            genreHtml +
            `<div class="ix-card-title">${esc(a.title)}</div>` +
            `<div class="ix-card-artist">${esc(a.artist)}</div>` +
            `<div class="ix-card-meta">${esc(a.year)} &nbsp;·&nbsp; ${esc(trackLabel)}</div>` +
          `</div>` +
          `<div class="ix-card-footer">View Analysis &rarr;</div>` +
        `</a>`
      );
    }).join('');
  }

  search.addEventListener('input', render);

  async function main(): Promise<void> {
    try {
      allAlbums = await loadAlbums();
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
