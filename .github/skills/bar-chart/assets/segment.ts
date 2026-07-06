// ──────────────────────────────────────────────────────────────
// Segment — Segmented Horizontal Bar Chart (TypeScript)
// Zero-dependency, accessible, palette-aware chart builder.
// ──────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

/** A single segment in the bar chart. */
export interface SegmentData {
  /** Numeric value — determines the segment's proportional width. */
  value: number;
  /** Optional display label shown inside the segment. */
  title?: string;
  /** Optional explicit hex/CSS color. Overrides the palette for this segment. */
  color?: string;
  /** Optional custom tooltip text. Falls back to `"title (value)"`. */
  tooltip?: string;
}

/** Names of the built-in color palettes. */
export type BuiltInPalette = 'blue' | 'warm' | 'cool' | 'mono';

/**
 * Either a built-in palette name or an array of CSS color strings
 * that will be cycled through for segments without an explicit `color`.
 */
export type SegmentPalette = BuiltInPalette | string[];

/** Configuration for a single `buildSegmentBar` call. */
export interface SegmentOptions {
  /** The data points to render as segments. Must have ≥ 1 item. */
  data: SegmentData[];
  /** Overall bar width. Default: `'100%'`. */
  width?: string;
  /** Overall bar height. Default: `'60px'`. */
  height?: string;
  /** Palette used when a segment has no explicit `color`. Default: `'blue'`. */
  palette?: SegmentPalette;
  /** BCP-47 locale tag for `toLocaleString` number formatting. Default: `'en-US'`. */
  locale?: string;
  /** Show the percentage label on hover. Default: `true`. */
  showPercentage?: boolean;
  /** Show the raw value label. Default: `true`. */
  showValue?: boolean;
  /** Custom value formatter — receives the raw value and locale. */
  valueFormatter?: (value: number, locale: string) => string;
  /** Accessible description set as `aria-label` on the container. */
  ariaLabel?: string;
}

// ── Built-in palettes ────────────────────────────────────────

const PALETTES: Record<BuiltInPalette, string[]> = {
  blue: [
    '#c6e6ff', '#96d0ff', '#6cb6ff', '#539bf5', '#4184e4',
    '#316dca', '#255ab2', '#1b4b91', '#143d79', '#0f2d5c',
  ],
  warm: [
    '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    '#92400e', '#78350f', '#6b2f0a', '#5a2507', '#4a1c04',
  ],
  cool: [
    '#c4f5fc', '#87e8f7', '#4cd8ed', '#22c3e0', '#0ea5c8',
    '#0887a6', '#066b84', '#045167', '#033e50', '#022c39',
  ],
  mono: [
    '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373',
    '#525252', '#404040', '#303030', '#202020', '#101010',
  ],
};

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_WIDTH = '100%';
const DEFAULT_HEIGHT = '60px';
const DEFAULT_PALETTE: BuiltInPalette = 'blue';
const DEFAULT_LOCALE = 'en-US';

// ── Internal helpers ─────────────────────────────────────────

function getSegmentSum(data: SegmentData[]): number {
  return data.reduce((sum, item) => sum + item.value, 0);
}

function getSegmentPercentages(data: SegmentData[]): number[] {
  const sum = getSegmentSum(data);
  if (sum === 0) return data.map(() => 0);
  return data.map((item) => item.value / sum);
}

function prettifyPercentage(pct: number): string {
  const fixed = pct.toFixed(2);
  const [whole, decimals] = fixed.split('.');
  if (decimals === '00') return whole;
  return fixed;
}

function* paletteGenerator(colors: string[]): Generator<string, never, unknown> {
  let i = 0;
  while (true) {
    yield colors[i % colors.length];
    i++;
  }
}

function resolvePalette(palette: SegmentPalette | undefined): string[] {
  if (Array.isArray(palette)) return palette;
  return PALETTES[palette ?? DEFAULT_PALETTE];
}

function formatValue(
  value: number,
  locale: string,
  formatter?: (v: number, l: string) => string,
): string {
  if (formatter) return formatter(value, locale);
  return value.toLocaleString(locale);
}

// ── Public API ───────────────────────────────────────────────

/**
 * Render a segmented horizontal bar chart inside the given element.
 *
 * The element's existing children are replaced. Segments are sized
 * proportionally to their `value` relative to the sum of all values.
 *
 * @param element - The container element (e.g. a `<div>`).
 * @param options - Chart data and visual configuration.
 */
export function buildSegmentBar(
  element: HTMLElement,
  options: SegmentOptions,
): void {
  const {
    data,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    palette,
    locale = DEFAULT_LOCALE,
    showPercentage = true,
    showValue = true,
    valueFormatter,
    ariaLabel,
  } = options;

  // Clear previous content
  element.textContent = '';

  // Container setup
  element.style.width = width;
  element.style.height = height;
  element.classList.add('segment-bar');
  element.setAttribute('role', 'img');
  element.setAttribute(
    'aria-label',
    ariaLabel ??
      data
        .map(
          (d) =>
            `${d.title ? d.title + ': ' : ''}${formatValue(d.value, locale, valueFormatter)}`,
        )
        .join(', '),
  );

  const percentages = getSegmentPercentages(data);
  const colors = paletteGenerator(resolvePalette(palette));

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const pct = percentages[i];
    const segColor = item.color ?? colors.next().value;

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.style.width = `${parseFloat((pct * 100).toFixed(4))}%`;
    wrapper.style.backgroundColor = segColor;
    wrapper.classList.add('segment-item-wrapper');
    wrapper.title =
      item.tooltip ??
      `${item.title ? item.title + ' ' : ''}(${formatValue(item.value, locale, valueFormatter)})`;

    // Title
    if (item.title && item.title.length > 0) {
      const titleSpan = document.createElement('span');
      titleSpan.textContent = item.title;
      titleSpan.classList.add('segment-item-title');
      wrapper.appendChild(titleSpan);
    }

    // Percentage (hidden by default, revealed on hover)
    if (showPercentage) {
      const pctSpan = document.createElement('span');
      pctSpan.textContent = `${prettifyPercentage(pct * 100)}%`;
      pctSpan.classList.add('segment-item-percentage');
      pctSpan.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(pctSpan);
    }

    // Value
    if (showValue) {
      const valueSpan = document.createElement('span');
      valueSpan.textContent = formatValue(item.value, locale, valueFormatter);
      valueSpan.classList.add('segment-item-value');
      wrapper.appendChild(valueSpan);
    }

    element.appendChild(wrapper);
  }
}

// ── Class-based wrapper (optional) ──────────────────────────

/**
 * OOP wrapper around `buildSegmentBar` that keeps a reference
 * to the container and supports `update()` / `destroy()`.
 */
export class SegmentChart {
  private readonly el: HTMLElement;
  private opts: SegmentOptions;

  constructor(element: HTMLElement, options: SegmentOptions) {
    this.el = element;
    this.opts = options;
    this.render();
  }

  /** Re-render the chart with the current options. */
  render(): void {
    buildSegmentBar(this.el, this.opts);
  }

  /** Merge new options and re-render. */
  update(options: Partial<SegmentOptions>): void {
    this.opts = { ...this.opts, ...options };
    this.render();
  }

  /** Remove all chart DOM and ARIA attributes. */
  destroy(): void {
    this.el.textContent = '';
    this.el.classList.remove('segment-bar');
    this.el.removeAttribute('role');
    this.el.removeAttribute('aria-label');
    this.el.removeAttribute('style');
  }
}
