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

type SiteNavPage = 'home';

interface SiteNavOptions {
  activePage?: SiteNavPage | null;
}

export interface CollectionHeroOptions {
  title: string;
  titleClassName?: string;
  subtitle?: string;
  subtitleVariant?: string;
  tagline?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
}

interface SiteHelpers {
  getBuildMeta(): SiteBuildInfo;
  renderNav(options?: SiteNavOptions): string;
  mountNav(elementId: string, options?: SiteNavOptions): void;
  renderFooter(options?: SiteFooterOptions): string;
  mountFooter(elementId: string, options?: SiteFooterOptions): void;
  renderCollectionHero(options: CollectionHeroOptions): string;
  mountCollectionHero(elementId: string, options: CollectionHeroOptions): void;
}

declare const __ALBUM_REVIEW_BUILD__: Partial<SiteBuildMeta>;

const PROJECT_URL = 'https://github.com/satyrlord/album-review';
export const FALLBACK_COVER_URL = 'covers/fallback-cd-case.svg';

const PRIMARY_NAV_LINKS = [
  { href: 'index.html', label: 'HOME PAGE', page: 'home' },
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

export function resolveCoverImageUrl(coverUrl?: string): string {
  const value = typeof coverUrl === 'string' ? coverUrl.trim() : '';
  return value || FALLBACK_COVER_URL;
}

export function bindCoverFallbacks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>('img[data-cover-fallback]').forEach(img => {
    const fallbackUrl = img.dataset['coverFallback']?.trim() || FALLBACK_COVER_URL;

    const applyFallback = (): void => {
      img.removeEventListener('error', applyFallback);
      if (img.getAttribute('src') === fallbackUrl) return;
      img.setAttribute('src', fallbackUrl);
      img.classList.add('is-fallback-cover');
    };

    img.removeEventListener('error', applyFallback);
    img.addEventListener('error', applyFallback);

    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    }
  });
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
    `<nav class="site-nav p-2" aria-label="Primary">\n` +
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

export function renderCollectionHero(options: CollectionHeroOptions): string {
  const titleClass = options.titleClassName
    ? ` ${escapeHtml(options.titleClassName)}`
    : '';
  const badgeHtml = options.subtitle
    ? `\n        <div class="badge badge-outline ${options.subtitleVariant ?? 'badge-secondary'} subtitle px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.28em]">${escapeHtml(options.subtitle)}</div>`
    : '';
  const taglineHtml = options.tagline
    ? `\n        <p class="max-w-3xl text-sm leading-7 text-base-content/72 sm:text-base">${escapeHtml(options.tagline)}</p>`
    : '';
  const placeholder = escapeHtml(options.searchPlaceholder ?? 'Search\u2026');
  const ariaLabel = escapeHtml(options.searchAriaLabel ?? 'Filter');

  return (
    `<header class="ix-hero">\n` +

    `  <div class="container">\n` +
    `    <div class="flex flex-col items-center gap-5 px-6 py-8 text-center sm:px-10 sm:py-12">` +
    badgeHtml +
    `\n        <h1 class="font-display text-4xl font-semibold tracking-[-0.04em] text-base-content sm:text-5xl lg:text-6xl 2xl:text-7xl${titleClass}">${escapeHtml(options.title)}</h1>` +
    taglineHtml +
    `\n        <label class="input input-bordered flex h-auto min-h-14 w-full max-w-3xl items-center gap-3 border-base-300/60 bg-base-200/50 px-5 py-3 text-lg backdrop-blur-sm">\n` +
    `          <span class="text-base-content/55" aria-hidden="true">&#8981;</span>\n` +
    `          <input type="search" class="ix-search grow bg-transparent text-base outline-none sm:text-lg" id="ixSearch"\n` +
    `                 placeholder="${placeholder}"\n` +
    `                 autocomplete="off" spellcheck="false" aria-label="${ariaLabel}">\n` +
    `        </label>\n` +
    `        <div id="ixGenreNav"></div>\n` +
    `    </div>\n` +
    `  </div>\n` +
    `</header>`
  );
}

export function mountCollectionHero(elementId: string, options: CollectionHeroOptions): void {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.outerHTML = renderCollectionHero(options);
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
    `        <span class="site-footer-brand">ALBANA</span>` +
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

// ── Dynamic background ────────────────────────────────────────────────────────

export const SITE_BG_COUNT = 40;
const BG_LS_KEY = 'siteBgIndex';

export function applyStoredBg(): void {
  const stored = localStorage.getItem(BG_LS_KEY);
  const index = stored !== null ? parseInt(stored, 10) : 1;
  if (index >= 1 && index <= SITE_BG_COUNT) {
    document.documentElement.dataset['bg'] = String(index);
  }
}

export function pickAndStoreRandomBg(): void {
  const index = Math.floor(Math.random() * SITE_BG_COUNT) + 1;
  localStorage.setItem(BG_LS_KEY, String(index));
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
  renderCollectionHero,
  mountCollectionHero,
};