// ──────────────────────────────────────────────────────────────
// Segment — Stacked Segmented Horizontal Bar Chart (TypeScript)
// Zero-dependency, accessible, palette-aware chart builder.
// Each row is one track; segments are timeline sections.
// Every bar spans the full width: each bar shows how one track's
// runtime is split across its sections (a percentage breakdown),
// not the track's length relative to other tracks.
// ──────────────────────────────────────────────────────────────

import { foldKey } from './shared/text.js';

// ── Types ────────────────────────────────────────────────────

/** A single segment (timeline section) within a track bar. */
export interface SegmentData {
  /** Duration in seconds this section spans. */
  value: number;
  /** Section label shown inside the segment. */
  title: string;
  /** Tooltip text for the title attribute. */
  tooltip: string;
}

/** A single track row in the stacked chart. */
export interface SegmentRow {
  /** Track label shown to the left of the bar. */
  label: string;
  /** Total track duration in seconds, used for the accessible summary. */
  duration: number;
  /** Formatted duration string for display. */
  durationLabel: string;
  /** Optional anchor target — when set, the row label links to it. */
  href?: string;
  /** Timeline sections within this track. */
  segments: SegmentData[];
}

/** Names of the built-in color palettes. */
export type BuiltInPalette = 'blue' | 'warm' | 'cool' | 'mono' | 'vivid';

/** Configuration for `buildSegmentChart`. */
export interface SegmentChartOptions {
  /** The track rows to render. */
  rows: SegmentRow[];
  /** Palette used for segment colors. Default: `'blue'`. */
  palette?: BuiltInPalette;
  /** Accessible description set as `aria-label` on the container. */
  ariaLabel: string;
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
  vivid: [
    '#a78bfa', '#f9a8d4', '#5eead4', '#fba67b', '#93c5fd',
    '#fde047', '#86efac', '#d8b4fe', '#7dd3fc', '#fca5a5',
    '#6ee7b7', '#fdba74', '#c4b5fd', '#f0abfc', '#67e8f9',
    '#bef264', '#fcd34d', '#a5f3fc', '#fbcfe8', '#bbf7d0',
  ],
};

// ── Internal helpers ─────────────────────────────────────────

function getSegmentPercentages(segments: SegmentData[]): number[] {
  const sum = segments.reduce((total, s) => total + s.value, 0);
  if (sum === 0) return segments.map(() => 0);
  return segments.map((s) => s.value / sum);
}

/**
 * Stable palette slot per section name, so "Peak" is the same color in
 * every row of the chart instead of depending on segment position.
 */
export function sectionColorIndex(title: string, paletteSize: number): number {
  const key = foldKey(title);
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash * 33) ^ key.charCodeAt(i)) >>> 0;
  }
  return hash % paletteSize;
}

/**
 * Assign each distinct section name one stable color, resolving hash
 * collisions once for the whole chart. Because the mapping is global,
 * a section is the same color in every bar *and* in the legend — no
 * per-row shifting that would make the legend lie. Names are keyed by
 * `foldKey` so casing/spacing variants share a color; the first-seen
 * spelling is used as the legend label.
 */
export function resolveSectionColors(
  rows: SegmentRow[],
  colors: string[],
): Map<string, { label: string; color: string }> {
  const byKey = new Map<string, { label: string; color: string }>();
  const usedSlots = new Set<number>();

  for (const row of rows) {
    for (const seg of row.segments) {
      const label = seg.title;
      if (!label) continue;
      const key = foldKey(label);
      if (byKey.has(key)) continue;

      let slot = sectionColorIndex(label, colors.length);
      // Walk to the next free slot so distinct names don't collide while
      // there are still unused colors; once the palette is exhausted,
      // reuse is unavoidable and we keep the hashed slot.
      if (usedSlots.size < colors.length) {
        while (usedSlots.has(slot)) {
          slot = (slot + 1) % colors.length;
        }
        usedSlots.add(slot);
      }
      byKey.set(key, { label, color: colors[slot] });
    }
  }

  return byKey;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Render a stacked segmented bar chart: one horizontal bar per track,
 * each bar divided into timeline sections. Every bar spans the full
 * width; segment widths are the section's share of that one track, so
 * each bar reads as a percentage breakdown of the track's runtime.
 */
export function buildSegmentChart(
  element: HTMLElement,
  options: SegmentChartOptions,
): void {
  const {
    rows,
    palette = 'blue',
    ariaLabel,
  } = options;

  element.textContent = '';
  element.classList.add('segment-chart');
  element.setAttribute('role', 'list');
  element.setAttribute('aria-label', ariaLabel);

  const colors = PALETTES[palette];
  const sectionColors = resolveSectionColors(rows, colors);

  for (const row of rows) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('segment-row');
    rowEl.setAttribute('role', 'listitem');

    // Screen readers get one plain-language summary per track instead of
    // a pile of unlabeled colored boxes and hover-only tooltips. It lives
    // on the row link when one exists, otherwise on a hidden span.
    const sectionNames = row.segments.map((s) => s.title).filter(Boolean).join(', ');
    const summaryText = `${row.label}, ${row.durationLabel}. Sections: ${sectionNames || 'none listed'}.`;

    const labelEl = document.createElement('div');
    labelEl.classList.add('segment-row-label');
    if (row.href) {
      const linkEl = document.createElement('a');
      linkEl.href = row.href;
      linkEl.textContent = row.label;
      linkEl.setAttribute('aria-label', summaryText);
      labelEl.appendChild(linkEl);
    } else {
      labelEl.setAttribute('aria-hidden', 'true');
      labelEl.textContent = row.label;
      const summaryEl = document.createElement('span');
      summaryEl.classList.add('sr-only');
      summaryEl.textContent = summaryText;
      rowEl.appendChild(summaryEl);
    }

    const durationEl = document.createElement('div');
    durationEl.classList.add('segment-row-duration');
    durationEl.setAttribute('aria-hidden', 'true');
    durationEl.textContent = row.durationLabel;

    // Bar container — every bar spans the full width; the segments inside
    // it divide up that track's own runtime as a percentage breakdown.
    const barEl = document.createElement('div');
    barEl.classList.add('segment-bar');
    barEl.setAttribute('aria-hidden', 'true');

    const percentages = getSegmentPercentages(row.segments);

    for (let i = 0; i < row.segments.length; i++) {
      const seg = row.segments[i];
      const pct = percentages[i];

      // One stable color per section name across the whole chart, so the
      // legend below matches every bar. Unlabeled sections fall back to
      // the hashed slot.
      const color = sectionColors.get(foldKey(seg.title))?.color
        ?? colors[sectionColorIndex(seg.title, colors.length)];

      const wrapper = document.createElement('div');
      wrapper.style.width = `${parseFloat((pct * 100).toFixed(4))}%`;
      wrapper.style.backgroundColor = color;
      wrapper.classList.add('segment-item-wrapper');
      wrapper.title = seg.tooltip;

      const titleSpan = document.createElement('span');
      titleSpan.textContent = seg.title;
      titleSpan.classList.add('segment-item-title');
      titleSpan.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(titleSpan);

      barEl.appendChild(wrapper);
    }

    rowEl.appendChild(labelEl);
    rowEl.appendChild(barEl);
    rowEl.appendChild(durationEl);
    element.appendChild(rowEl);
  }

  appendLegend(element, sectionColors);
}

/**
 * Append a color key mapping each section name to its swatch. It is
 * decorative reinforcement — every row already names its sections in the
 * `sr-only` summary — so it is hidden from assistive tech to keep the
 * `role="list"` container free of non-`listitem` children.
 */
function appendLegend(
  element: HTMLElement,
  sectionColors: Map<string, { label: string; color: string }>,
): void {
  if (sectionColors.size === 0) return;

  const legend = document.createElement('div');
  legend.classList.add('segment-legend');
  legend.setAttribute('aria-hidden', 'true');

  const entries = Array.from(sectionColors.values())
    .sort((a, b) => a.label.localeCompare(b.label));

  for (const { label, color } of entries) {
    const item = document.createElement('div');
    item.classList.add('segment-legend-item');

    const swatch = document.createElement('span');
    swatch.classList.add('segment-legend-swatch');
    swatch.style.backgroundColor = color;

    const text = document.createElement('span');
    text.classList.add('segment-legend-label');
    text.textContent = label;

    item.appendChild(swatch);
    item.appendChild(text);
    legend.appendChild(item);
  }

  element.appendChild(legend);
}
