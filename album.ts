/**
 * album.ts — dynamic album-page renderer.
 *
 * Reads ?id=<slug> from the URL, fetches data/<slug>.json,
 * and renders the full analysis page into #albumRoot.
 *
 * Compiled to album.js via tsconfig.browser.json.
 */

interface TimelineEvent {
  timestamp:   string;
  section:     string;
  description: string;
  detail?:     string;
}

interface AlbumTrack {
  num:      number;
  title:    string;
  duration: string;
  energy:   string;
  tags:     string[];
  role:     string;
  events:   TimelineEvent[];
}

interface AlbumData {
  id:       string;
  artist:   string;
  title:    string;
  year:     number;
  label:    string;
  producer: string;
  genre:    string;
  runtime:  string;
  coverUrl?: string;
  overview: string;
  tracks:   AlbumTrack[];
}

(function (): void {
  'use strict';

  function esc(s: string | number): string {
    return String(s)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /** Wrap the last word of a title in <span> — matches scaffold pattern. */
  function titleH1(title: string): string {
    const parts = esc(title).split(' ');
    const last  = parts.pop()!;
    return parts.length
      ? `${parts.join(' ')} <span>${last}</span>`
      : `<span>${esc(title)}</span>`;
  }

  /** Convert newline-separated overview text to <p> elements. */
  function overviewHtml(text: string): string {
    return text.split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${esc(p.trim())}</p>`)
      .join('\n    ');
  }

  function renderEvent(ev: TimelineEvent): string {
    let descInner: string;
    if (ev.section) {
      descInner = `<strong>${esc(ev.section)}</strong> \u2014 ${esc(ev.description)}`;
    } else {
      descInner = esc(ev.description);
    }
    if (ev.detail) {
      descInner += `<span class="detail">${esc(ev.detail)}</span>`;
    }
    return (
      `      <div class="event">\n` +
      `        <span class="event-time">${esc(ev.timestamp)}</span>\n` +
      `        <span class="event-desc">${descInner}</span>\n` +
      `      </div>`
    );
  }

  function renderTrack(track: AlbumTrack): string {
    const num       = String(track.num).padStart(2, '0');
    const energyCap = track.energy.charAt(0).toUpperCase() + track.energy.slice(1);

    const extraTags = track.tags
      .map(t => `      <span class="tag">${esc(t)}</span>`)
      .join('\n');

    const eventsHtml = track.events
      .map(renderEvent)
      .join('\n');

    return (
      `  <!-- TRACK ${num} -->\n` +
      `  <div class="track">\n` +
      `    <div class="track-header">\n` +
      `      <span class="track-num">${num}</span>\n` +
      `      <span class="track-title">${esc(track.title)}</span>\n` +
      `      <span class="track-duration">${esc(track.duration)}</span>\n` +
      `    </div>\n` +
      `    <div class="track-tags">\n` +
      `      <span class="tag energy-${esc(track.energy)}">Energy: ${esc(energyCap)}</span>\n` +
      (extraTags ? extraTags + '\n' : '') +
      `    </div>\n` +
      `    <div class="track-role">${esc(track.role)}</div>\n` +
      `    <div class="timeline">\n` +
      eventsHtml + '\n' +
      `    </div>\n` +
      `  </div>`
    );
  }

  function renderHeroMedia(coverUrl: string, artist: string, title: string): string {
    if (!coverUrl) return '';

    return (
      `    <div class="hero-media">\n` +
      `      <div class="hero-cover-frame">\n` +
      `        <img class="hero-cover" src="${esc(coverUrl)}" alt="Album cover for ${esc(artist)} - ${esc(title)}" decoding="async" referrerpolicy="no-referrer">\n` +
      `      </div>\n` +
      `    </div>\n`
    );
  }

  function renderPage(d: AlbumData): string {
    const metaRows: string[] = [
      `      <div><strong>Artist:</strong> ${esc(d.artist)}</div>`,
      `      <div><strong>Released:</strong> ${esc(d.year)}</div>`,
      `      <div><strong>Total Length:</strong> ${esc(d.runtime)}</div>`,
      `      <div><strong>Tracks:</strong> ${esc(d.tracks.length)}</div>`,
    ];
    if (d.label)    metaRows.push(`      <div><strong>Label:</strong> ${esc(d.label)}</div>`);
    if (d.producer) metaRows.push(`      <div><strong>Producer:</strong> ${esc(d.producer)}</div>`);
    if (d.genre)    metaRows.push(`      <div><strong>Genre:</strong> ${esc(d.genre)}</div>`);

    const tracksHtml = d.tracks.map(renderTrack).join('\n\n');
  const heroMedia  = renderHeroMedia(d.coverUrl ?? '', d.artist, d.title);
  const heroClass  = d.coverUrl ? 'container hero-layout has-cover' : 'container hero-layout';

    return (
      `<div class="hero">\n` +
      `  <div class="${heroClass}">\n` +
      `    <div class="hero-copy">\n` +
      `      <a class="home-btn" href="index.html">&#8592; All Albums</a>\n` +
      `      <div class="subtitle">Timestamp-Based Structural Analysis</div>\n` +
      `      <h1>${titleH1(d.title)}</h1>\n` +
      `      <div class="meta">\n` +
      metaRows.join('\n') + '\n' +
      `      </div>\n` +
      `    </div>\n` +
      heroMedia +
      `  </div>\n` +
      `</div>\n\n` +
      `<div class="container">\n\n` +
      `  <div class="preamble">\n` +
      `    <h2>Overview</h2>\n` +
      `    ${overviewHtml(d.overview)}\n` +
      `  </div>\n\n` +
      tracksHtml + '\n\n' +
      `</div>\n\n` +
      `<div class="footer">\n` +
      `  <div class="container">\n` +
      `    ${esc(d.artist)} &middot; ${esc(d.title)} &middot; ${esc(d.year)}\n` +
      `    <a class="home-btn" href="index.html">&#8592; All Albums</a>\n` +
      `  </div>\n` +
      `</div>`
    );
  }

  function showError(msg: string): void {
    const root = document.getElementById('albumRoot')!;
    root.innerHTML =
      `<div style="padding:4rem 2rem;text-align:center;color:var(--accent2);font-family:'JetBrains Mono',monospace">` +
      `<p style="font-size:1.2rem">${esc(msg)}</p>` +
      `<p><a href="index.html" style="color:var(--accent)">&#8592; All Albums</a></p>` +
      `</div>`;
  }

  async function main(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');
    if (!id) { showError('No album ID specified in URL (?id=…).'); return; }

    // Basic validation — only allow slug-like IDs to prevent path traversal
    if (!/^[a-z0-9-]+$/.test(id)) { showError('Invalid album ID.'); return; }

    let data: AlbumData;
    try {
      const resp = await fetch(`data/${id}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json() as AlbumData;
    } catch (e: unknown) {
      showError(`Could not load album "${esc(id)}". ${e instanceof Error ? e.message : ''}`);
      return;
    }

    document.title = `Structural Analysis \u2014 ${data.artist} \u00b7 ${data.title} (${data.year})`;

    const root = document.getElementById('albumRoot')!;
    root.outerHTML = renderPage(data);
  }

  main().catch((e: unknown) => {
    showError(e instanceof Error ? e.message : 'Unexpected error.');
  });
}());
