interface SiteBuildMeta {
  pushedCommitCount: number;
  sourceRef: string;
  generatedAt: string;
}

interface SiteBuildInfo extends SiteBuildMeta {
  version: string;
}

interface SiteFooterOptions {
  context?: string;
  actionHref?: string;
  actionLabel?: string;
}

type SiteNavPage = 'home' | 'soundtracks' | 'top10' | 'top20';

interface SiteNavOptions {
  activePage?: SiteNavPage | null;
}

interface SiteHelpers {
  getBuildMeta(): SiteBuildInfo;
  renderNav(options?: SiteNavOptions): string;
  mountNav(elementId: string, options?: SiteNavOptions): void;
  renderFooter(options?: SiteFooterOptions): string;
  mountFooter(elementId: string, options?: SiteFooterOptions): void;
}

declare const __ALBUM_REVIEW_BUILD__: Partial<SiteBuildMeta>;

const PROJECT_URL = 'https://github.com/satyrlord/album-review';

const PRIMARY_NAV_LINKS = [
  { href: 'index.html', label: 'HOME PAGE', page: 'home' },
  { href: 'soundtracks.html', label: 'SOUNDTRACKS', page: 'soundtracks' },
  { href: 'top-10.html', label: 'TOP 10', page: 'top10' },
  { href: 'top-20.html', label: 'TOP 20', page: 'top20' },
] as const;

type SiteWindow = Window & {
  __ALBUM_REVIEW_BUILD__?: Readonly<Partial<SiteBuildMeta>>;
  AlbumReviewSite?: SiteHelpers;
};

export function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normaliseText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatVersionFromCommitCount(pushedCommitCount: number): string {
  const releaseNumber = Math.max(1, Math.floor(pushedCommitCount) + 1);
  return `0.${String(releaseNumber).padStart(3, '0')}`;
}

export function getBuildMeta(): SiteBuildInfo {
  const rawMeta = __ALBUM_REVIEW_BUILD__ ?? {};
  const pushedCommitCount =
    typeof rawMeta.pushedCommitCount === 'number' && Number.isFinite(rawMeta.pushedCommitCount)
      ? Math.max(0, Math.floor(rawMeta.pushedCommitCount))
      : 0;

  return {
    pushedCommitCount,
    sourceRef: typeof rawMeta.sourceRef === 'string' && rawMeta.sourceRef.trim()
      ? rawMeta.sourceRef
      : 'HEAD',
    generatedAt: typeof rawMeta.generatedAt === 'string' ? rawMeta.generatedAt : '',
    version: formatVersionFromCommitCount(pushedCommitCount),
  };
}

export function renderNav(options: SiteNavOptions = {}): string {
  const activePage = options.activePage ?? null;

  return (
    `<nav class="site-nav rounded-[1.6rem] border border-base-300/70 bg-base-200/80 p-2 shadow-xl backdrop-blur-xl" aria-label="Primary">\n` +
    PRIMARY_NAV_LINKS.map(link => {
      const classes = link.page === activePage
        ? "site-nav-link btn btn-sm border border-primary/30 bg-primary text-primary-content shadow-lg shadow-primary/10"
        : "site-nav-link btn btn-sm btn-ghost border border-transparent bg-base-100/40 hover:border-primary/35 hover:bg-primary/10 hover:text-primary";
      const current = link.page === activePage ? ' aria-current="page"' : '';
      return `  <a class="${classes}" href="${link.href}"${current}>${link.label}</a>`;
    }).join('\n') + '\n' +
    `</nav>`
  );
}

export function mountNav(elementId: string, options: SiteNavOptions = {}): void {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.outerHTML = renderNav(options);
}

export function renderFooter(options: SiteFooterOptions = {}): string {
  const meta = getBuildMeta();
  const contextHtml = options.context
    ? `\n        <span class="site-footer-divider" aria-hidden="true">&middot;</span>\n        <span class="site-footer-context">${escapeHtml(options.context)}</span>`
    : '';
  const actionHtml = options.actionHref && options.actionLabel
    ? `\n      <a class="site-footer-btn site-footer-link badge badge-outline badge-lg h-auto rounded-full border-base-300/70 px-4 py-3 hover:border-primary/45 hover:bg-primary/10 hover:text-primary" href="${escapeHtml(options.actionHref)}">${escapeHtml(options.actionLabel)}</a>`
    : '';

  return (
    `<footer class="site-footer border-t border-base-300/70">\n` +
    `  <div class="container">\n` +
    `    <div class="site-footer-inner rounded-[1.6rem] border border-base-300/70 bg-base-200/72 px-4 py-5 shadow-xl backdrop-blur-xl sm:px-5">\n` +
    `      <div class="site-footer-copy">\n` +
    `        <span class="site-footer-brand">Album Analysis</span>` +
    contextHtml + '\n' +
    `      </div>\n` +
    `      <div class="site-footer-meta">\n` +
    `        <a class="site-footer-btn site-footer-version badge badge-outline badge-lg h-auto rounded-full border-base-300/70 px-4 py-3 hover:border-primary/45 hover:bg-primary/10 hover:text-primary" href="${escapeHtml(PROJECT_URL)}" target="_blank" rel="noopener noreferrer">Version ${escapeHtml(meta.version)}</a>\n` +
    `        <a class="site-footer-btn site-footer-credits badge badge-outline badge-lg h-auto rounded-full border-base-300/70 px-4 py-3 hover:border-primary/45 hover:bg-primary/10 hover:text-primary" href="credits.html">CREDITS</a>\n` +
    `      </div>` +
    actionHtml + '\n' +
    `    </div>\n` +
    `  </div>\n` +
    `</footer>`
  );
}

export function mountFooter(elementId: string, options: SiteFooterOptions = {}): void {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.outerHTML = renderFooter(options);
}

const siteWindow = window as SiteWindow;
const rawBuildMeta = __ALBUM_REVIEW_BUILD__ ?? {};

siteWindow.__ALBUM_REVIEW_BUILD__ = Object.freeze({ ...rawBuildMeta });
siteWindow.AlbumReviewSite = {
  getBuildMeta,
  renderNav,
  mountNav,
  renderFooter,
  mountFooter,
};