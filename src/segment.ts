// ──────────────────────────────────────────────────────────────
// Segment — Stacked Segmented Horizontal Bar Chart (TypeScript)
// Zero-dependency, accessible, palette-aware chart builder.
// Each row is one track; segments are timeline sections.
// ──────────────────────────────────────────────────────────────

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
  /** Total track duration in seconds (determines proportional bar width). */
  duration: number;
  /** Formatted duration string for display. */
  durationLabel: string;
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

// ── Public API ───────────────────────────────────────────────

/**
 * Render a stacked segmented bar chart: one horizontal bar per track,
 * each bar divided into timeline sections. All bars span full width.
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
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', ariaLabel);

  const colors = PALETTES[palette];

  for (const row of rows) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('segment-row');

    const labelEl = document.createElement('div');
    labelEl.classList.add('segment-row-label');
    labelEl.textContent = row.label;

    const durationEl = document.createElement('div');
    durationEl.classList.add('segment-row-duration');
    durationEl.textContent = row.durationLabel;

    // Bar container — full width for every track
    const barEl = document.createElement('div');
    barEl.classList.add('segment-bar');

    const percentages = getSegmentPercentages(row.segments);

    for (let i = 0; i < row.segments.length; i++) {
      const seg = row.segments[i];
      const pct = percentages[i];

      const wrapper = document.createElement('div');
      wrapper.style.width = `${parseFloat((pct * 100).toFixed(4))}%`;
      wrapper.style.backgroundColor = colors[i % colors.length];
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
}
