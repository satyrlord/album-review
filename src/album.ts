/**
 * album.ts — dynamic album-page renderer.
 *
 * Reads ?id=<slug> from the URL, fetches data/<slug>.json,
 * and renders the full analysis page into #albumRoot.
 */

import { buildSegmentChart } from "./segment";
import { applyStoredBg, bindCoverFallbacks, escapeHtml, FALLBACK_COVER_URL, pickAndStoreRandomBg, renderFooter, resolveCoverImageUrl } from "./site";

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
  spotifyUrl?: string;
  youtubeUrl?: string;
  audioStreamUrl?: string;
  overview: string;
  tracks:   AlbumTrack[];
}

(function (): void {
  'use strict';

  /** Parse a M:SS or MM:SS duration string to total seconds. */
  function parseDuration(dur: string): number {
    const parts = dur.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
  }

  /** Format total seconds back to M:SS display string. */
  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /** Wrap the last word of a title in <span> — matches scaffold pattern. */
  function titleH1(title: string): string {
    const parts = escapeHtml(title).split(' ');
    const last  = parts.pop()!;
    return parts.length
      ? `${parts.join(' ')} <span>${last}</span>`
      : `<span>${last}</span>`;
  }

  /** Convert newline-separated overview text to <p> elements. */
  function overviewHtml(text: string): string {
    return text.split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="text-base leading-8 text-base-content/75">${escapeHtml(p.trim())}</p>`)
      .join('\n    ');
  }

  function renderMetaItem(label: string, value: string | number): string {
    return (
      `        <div class="meta-item rounded-[1.15rem] border border-base-300/70 bg-base-100/45 p-4 shadow-lg">` +
        `<strong>${escapeHtml(label)}:</strong>` +
        `<span>${escapeHtml(value)}</span>` +
      `</div>`
    );
  }

  function getEnergyTagClasses(energy: string): string {
    switch (energy) {
      case 'low':
        return 'energy-low';
      case 'high':
        return 'energy-high';
      case 'peak':
        return 'energy-peak';
      default:
        return 'energy-mid';
    }
  }

  function renderEvent(ev: TimelineEvent): string {
    let descInner: string;
    if (ev.section) {
      descInner = `<strong>${escapeHtml(ev.section)}</strong> \u2014 ${escapeHtml(ev.description)}`;
    } else {
      descInner = escapeHtml(ev.description);
    }
    if (ev.detail) {
      descInner += `<span class="detail">${escapeHtml(ev.detail)}</span>`;
    }
    return (
      `      <div class="event">\n` +
      `        <span class="event-time">${escapeHtml(ev.timestamp)}</span>\n` +
      `        <span class="event-desc">${descInner}</span>\n` +
      `      </div>`
    );
  }

  function renderTrack(track: AlbumTrack): string {
    const num       = String(track.num).padStart(2, '0');
    const energyCap = track.energy.charAt(0).toUpperCase() + track.energy.slice(1);
    const energyClasses = getEnergyTagClasses(track.energy);

    const extraTags = track.tags
      .map(t => `      <span class="tag badge badge-ghost badge-sm rounded-full px-3 py-3">${escapeHtml(t)}</span>`)
      .join('\n');

    const eventsHtml = track.events
      .map(renderEvent)
      .join('\n');

    return (
      `  <article class="track card border border-base-300/70 bg-base-200/80 shadow-xl backdrop-blur-xl">\n` +
      `    <div class="card-body gap-5 p-6 sm:p-8">\n` +
      `      <div class="track-header">\n` +
      `        <span class="track-num badge badge-outline badge-primary badge-lg h-auto rounded-full px-4 py-3">${num}</span>\n` +
      `        <div class="min-w-0 flex-1">\n` +
      `          <div class="track-title text-2xl font-semibold leading-tight">${escapeHtml(track.title)}</div>\n` +
      `        </div>\n` +
      `        <span class="track-duration badge badge-outline badge-warning h-auto rounded-full px-4 py-3">${escapeHtml(track.duration)}</span>\n` +
      `      </div>\n` +
      `      <div class="track-tags">\n` +
      `        <span class="tag ${energyClasses} badge badge-outline badge-sm rounded-full px-3 py-3">Energy: ${escapeHtml(energyCap)}</span>\n` +
      (extraTags ? extraTags + '\n' : '') +
      `      </div>\n` +
      `      <p class="track-role text-sm">${escapeHtml(track.role)}</p>\n` +
      `      <div class="timeline">\n` +
      eventsHtml + '\n' +
      `      </div>\n` +
      `    </div>\n` +
      `  </article>`
    );
  }

  function renderHeroMedia(coverUrl: string | undefined, artist: string, title: string): string {
    const resolvedCoverUrl = resolveCoverImageUrl(coverUrl);

    return (
      `    <div class="hero-media">\n` +
      `      <div class="hero-cover-frame overflow-hidden rounded-[1.6rem] border border-base-300/70 bg-base-200/80 p-3 shadow-2xl backdrop-blur-xl">\n` +
      `        <img class="hero-cover rounded-[1.1rem]" src="${escapeHtml(resolvedCoverUrl)}" data-cover-fallback="${escapeHtml(FALLBACK_COVER_URL)}" alt="Album cover for ${escapeHtml(artist)} - ${escapeHtml(title)}" decoding="async" referrerpolicy="no-referrer">\n` +
      `      </div>\n` +
      `    </div>\n`
    );
  }

  function resolveStreamName(url: string): string {
    if (url.includes('music.apple.com')) return 'Apple Music';
    if (url.includes('deezer.com')) return 'Deezer';
    if (url.includes('tidal.com')) return 'Tidal';
    return 'Stream';
  }

  function renderStreamingLinks(d: AlbumData): string {
    const links: string[] = [];

    if (d.spotifyUrl) {
      links.push(
        `        <a class="hero-link hero-link--spotify btn btn-primary btn-sm rounded-full sm:btn-md" href="${escapeHtml(d.spotifyUrl)}" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>`,
      );
    } else if (d.audioStreamUrl) {
      const serviceName = resolveStreamName(d.audioStreamUrl);
      links.push(
        `        <a class="hero-link hero-link--audio-stream btn btn-primary btn-sm rounded-full sm:btn-md" href="${escapeHtml(d.audioStreamUrl)}" target="_blank" rel="noopener noreferrer">Listen on ${escapeHtml(serviceName)}</a>`,
      );
    }

    if (d.youtubeUrl) {
      links.push(
        `        <a class="hero-link hero-link--youtube btn btn-outline btn-secondary btn-sm rounded-full sm:btn-md" href="${escapeHtml(d.youtubeUrl)}" target="_blank" rel="noopener noreferrer">Listen on YouTube</a>`,
      );
    }

    if (!links.length) return '';

    return (
      `      <div class="hero-links">\n` +
      links.join('\n') + '\n' +
      `      </div>\n`
    );
  }

  function renderSiteFooter(context: string): string {
    return renderFooter({
      context,
      actionHref: 'index.html',
      actionLabel: 'All Albums',
    });
  }

  function renderSiteNav(): string {
    return (
      `<nav class="site-nav" aria-label="Primary">\n` +
      `  <a class="site-nav-link btn btn-sm btn-ghost border border-transparent bg-base-100/40 hover:border-primary/35 hover:bg-primary/10 hover:text-primary" href="index.html" data-js="pick-random-bg">\u2190 Back to Home</a>\n` +
      `</nav>`
    );
  }

  function renderPage(d: AlbumData): string {
    const metaRows: string[] = [
      renderMetaItem('Artist', d.artist),
      renderMetaItem('Released', d.year),
      renderMetaItem('Total Length', d.runtime),
      renderMetaItem('Tracks', d.tracks.length),
    ];
    if (d.label)    metaRows.push(renderMetaItem('Label', d.label));
    if (d.producer) metaRows.push(renderMetaItem('Producer', d.producer));
    if (d.genre)    metaRows.push(renderMetaItem('Genre', d.genre));

    const tracksHtml = d.tracks.map(renderTrack).join('\n\n');
    const heroMedia = renderHeroMedia(d.coverUrl, d.artist, d.title);
    const heroLinks = renderStreamingLinks(d);
    const heroClass = 'container hero-layout has-cover';
    const siteNav = renderSiteNav();
    const footerHtml = renderSiteFooter(`${d.artist} · ${d.title} · ${d.year}`);

    return (
      `<div class="hero">\n` +
      `  <div class="${heroClass}">\n` +
      `    <div class="hero-copy rounded-[1.8rem] border border-base-300/70 bg-base-200/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">\n` +
      siteNav +
      `      <div class="subtitle badge badge-outline badge-secondary mt-5 w-fit px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">Timestamp-Based Structural Analysis</div>\n` +
      `      <h1 class="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl 2xl:text-7xl">${titleH1(d.title)}</h1>\n` +
      `      <div class="meta">\n` +
      metaRows.join('\n') + '\n' +
      `      </div>\n` +
      heroLinks +
      `    </div>\n` +
      heroMedia +
      `  </div>\n` +
      `</div>\n\n` +
      `<div class="container pb-20">\n\n` +
      `  <section class="preamble card border border-base-300/70 bg-base-200/80 shadow-xl backdrop-blur-xl">\n` +
      `    <div class="card-body gap-5 p-6 sm:p-8">\n` +
      `      <div class="badge badge-outline badge-accent w-fit px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">Overview</div>\n` +
      `      <h2 class="text-sm text-base-content/55">Macro Context</h2>\n` +
      `      ${overviewHtml(d.overview)}\n` +
      `    </div>\n` +
      `  </section>\n\n` +
      `  <section class="preamble card border border-base-300/70 bg-base-200/80 shadow-xl backdrop-blur-xl">\n` +
      `    <div class="card-body gap-5 p-6 sm:p-8">\n` +
      `      <div class="badge badge-outline badge-primary w-fit px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">Track Timeline</div>\n` +
      `      <h2 class="text-sm text-base-content/55">Proportional structural map</h2>\n` +
      `      <div id="timelineChart" class="rounded-[1.25rem] border border-base-300/60 bg-base-100/45 p-4 shadow-inner sm:p-5"></div>\n` +
      `    </div>\n` +
      `  </section>\n\n` +
      tracksHtml + '\n\n' +
      `</div>\n\n` +
      footerHtml
    );
  }

  function showError(msg: string): void {
    const root = document.getElementById('albumRoot');
    if (!root) return;

    const footerHtml = renderSiteFooter('Album Page');
    root.outerHTML =
      `<div class="hero">\n` +
      `  <div class="container">\n` +
      renderSiteNav() +
      `    <div class="page-state page-state--error mt-5 rounded-[1.6rem] border border-error/25 bg-base-200/82 p-6 shadow-xl backdrop-blur-xl">\n` +
      `      <p class="page-state-title">${escapeHtml(msg)}</p>\n` +
      `      <p class="page-state-copy mt-4"><a class="page-state-link btn btn-sm btn-ghost border border-base-300/60 bg-base-100/40" href="index.html">&#8592; All Albums</a></p>\n` +
      `    </div>\n` +
      `  </div>\n` +
        `</div>\n\n` +
        footerHtml;
  }

  async function main(): Promise<void> {
    applyStoredBg();

    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');
    if (!id) { showError('No album ID specified in URL (?id=…).'); return; }

    // Basic validation — only allow slug-like IDs to prevent path traversal
    if (!/^[a-z0-9-]+$/.test(id)) { showError('Invalid album ID.'); return; }

    try {
      const resp = await fetch(`data/${id}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as AlbumData;

      document.title = `${data.artist} \u00b7 ${data.title} (${data.year}) | ALBANA`;

      const root = document.getElementById('albumRoot');
      if (!root) return;

      root.outerHTML = renderPage(data);
      bindCoverFallbacks(document);

      document.querySelector<HTMLAnchorElement>('[data-js="pick-random-bg"]')
        ?.addEventListener('click', () => { pickAndStoreRandomBg(); });

      const chartEl = document.getElementById('timelineChart');
      if (chartEl) {
        buildSegmentChart(chartEl, {
          rows: data.tracks.map((t) => {
            const trackSeconds = parseDuration(t.duration);
            const segments = t.events.map((ev, idx) => {
              const start = parseDuration(ev.timestamp);
              const end = idx < t.events.length - 1
                ? parseDuration(t.events[idx + 1].timestamp)
                : trackSeconds;
              const span = end - start;
              return {
                title: ev.section,
                value: span,
                tooltip: ev.description.charAt(0).toUpperCase() + ev.description.slice(1),
              };
            });
            return {
              label: t.title,
              duration: trackSeconds,
              durationLabel: t.duration,
              segments,
            };
          }),
          palette: 'vivid',
          ariaLabel: `Track timeline breakdown for ${data.artist} \u2013 ${data.title}`,
        });
      }
    } catch (e: unknown) {
      const detail = e instanceof Error && e.message ? ` ${e.message}` : '';
      showError(`Could not load album "${escapeHtml(id)}".${detail}`);
    }
  }

  void main();
}());
