---
name: bar-chart
description: "Create Segmented Horizontal Bar Charts with TypeScript. Use when: building bar charts, creating segmented bars, visualizing proportional data, rendering stacked horizontal charts, adding data visualization components, displaying percentage breakdowns."
argument-hint: "Describe the data and visual style for your segmented bar chart"
---

# Segmented Horizontal Bar Chart — TypeScript

Generate a fully typed, accessible, zero-dependency segmented horizontal bar chart component using vanilla TypeScript and CSS.

## When to Use

- Visualizing proportional data as colored horizontal segments
- Comparing dataset breakdowns (budgets, test durations, category splits)
- Rendering stacked bar charts without a charting library
- Adding lightweight data visualization to any web page

## What Gets Produced

| File | Purpose |
| --- | --- |
| `segment.ts` | Typed module: interfaces, builder, palette cycling, formatters |
| `segment.css` | Styles: layout, hover effects, responsive label collapse, theme tokens |
| Usage snippet | HTML + TS call site wiring for the consumer page |

## Procedure

### Step 1 — Gather Requirements

Ask the user (or infer from context):

1. **Data shape** — What fields does each segment have? At minimum `value: number`. Optional: `title`, `color`, `tooltip`.
2. **Palette** — Should segments use a built-in palette (blue, warm, cool, monochrome) or user-supplied colors per segment?
3. **Display options** — Show titles? Show values? Show percentages on hover? Custom number formatting (locale, decimals)?
4. **Dimensions** — Fixed width/height or responsive?
5. **Destination** — File paths for the generated `.ts` and `.css`, and which HTML element will host the chart.

### Step 2 — Create the TypeScript Module

Use [./assets/segment.ts](./assets/segment.ts) as the canonical template. Adapt it to the user's requirements:

- Export the `SegmentData`, `SegmentOptions`, and `SegmentPalette` types.
- Export the `buildSegmentBar` function as the public API.
- Include the `getSegmentPercentages`, `getSegmentSum`, `prettifyPercentage`, and palette generator as internal helpers.
- If the user needs a class-based API, wrap in a `SegmentChart` class with `render()` and `destroy()` methods.

Key implementation rules:

```text
- NEVER use innerHTML or insertAdjacentHTML — build DOM with createElement / textContent only.
- Always set lang-appropriate number formatting via toLocaleString or Intl.NumberFormat.
- Add ARIA attributes: role="img", aria-label on the bar, aria-hidden on decorative spans.
- Provide a title attribute on each segment wrapper for native tooltip.
- Use a CSS custom-property prefix (--segment-*) for all theme tokens so consumers can override.
- Percentage widths MUST use flex-basis or width in %, never px.
```

### Step 3 — Create the CSS

Use [./assets/segment.css](./assets/segment.css) as the canonical template. Key conventions:

```text
- Prefix every class with `segment-` to avoid collisions.
- Define all colors, radii, font sizes, and gaps as CSS custom properties on .segment-bar.
- The hover effect expands the segment with inset box-shadow darkening.
- Percentage label is hidden by default, revealed on hover with opacity transition.
- Segments below a minimum width threshold hide their title/value labels via container-aware overflow: hidden.
- Use border-radius only on first-child / last-child wrappers.
- Support both LTR and RTL via logical properties (inline-start/inline-end) where possible.
```

### Step 4 — Wire Up in HTML

Provide the consumer with a usage snippet:

```html
<!-- Container: empty div with a unique ID -->
<div id="myChart"></div>
```

```typescript
import { buildSegmentBar } from './segment';

buildSegmentBar(document.getElementById('myChart')!, {
  data: [
    { title: 'Segment A', value: 50 },
    { title: 'Segment B', value: 30 },
    { title: 'Segment C', value: 20 },
  ],
  // Optional overrides:
  // width: '100%',
  // height: '60px',
  // palette: 'blue',
  // locale: 'en-US',
  // showPercentage: true,
  // showValue: true,
});
```

### Step 5 — Validate

1. Verify the chart renders with at least 2 data points.
2. Hover each segment — percentage label should appear smoothly.
3. Check that segment widths sum to 100% (no gaps, no overflow).
4. Confirm title attributes produce native tooltips.
5. Run a screen reader or inspect ARIA: the container should have `role="img"` and a descriptive `aria-label`.
6. Resize the viewport — labels on very narrow segments should be hidden by overflow.

## Built-in Palettes

| Name | Colors (10 stops, light → dark) |
| --- | --- |
| `blue` | `#c6e6ff #96d0ff #6cb6ff #539bf5 #4184e4 #316dca #255ab2 #1b4b91 #143d79 #0f2d5c` |
| `warm` | `#fde68a #fbbf24 #f59e0b #d97706 #b45309 #92400e #78350f #6b2f0a #5a2507 #4a1c04` |
| `cool` | `#c4f5fc #87e8f7 #4cd8ed #22c3e0 #0ea5c8 #0887a6 #066b84 #045167 #033e50 #022c39` |
| `mono` | `#f5f5f5 #e5e5e5 #d4d4d4 #a3a3a3 #737373 #525252 #404040 #303030 #202020 #101010` |

Palettes cycle when there are more segments than stops.

## TypeScript API Summary

See [./references/api-reference.md](./references/api-reference.md) for the full typed API, including:

- `SegmentData` — per-segment input shape
- `SegmentOptions` — top-level configuration
- `SegmentPalette` — union of built-in palette names or custom hex array
- `buildSegmentBar(element, options)` — imperative builder
- `SegmentChart` class — optional OOP wrapper with `render()` / `update()` / `destroy()`

## Accessibility Checklist

- [ ] Container has `role="img"` and `aria-label` summarizing the data
- [ ] Each segment wrapper has a `title` for native tooltip
- [ ] Color contrast of title/value text against segment background meets WCAG AA (4.5:1)
- [ ] Percentage labels use `aria-hidden="true"` (decorative, duplicated in title)
- [ ] Chart is not the sole means of conveying information — pair with a data table when critical

## Common Customizations

| Need | How |
| --- | --- |
| Custom colors per segment | Set `color` on each `SegmentData` item — overrides palette |
| No hover effect | Remove `.segment-item-wrapper:hover` rules from CSS |
| Fixed-width chart | Set `width: '600px'` in options |
| Thinner bar | Set `height: '32px'` in options |
| Custom number format | Pass `locale: 'de-DE'` or a `valueFormatter` function |
| Sort segments | Pre-sort the `data` array before calling `buildSegmentBar` |
| Animate on load | Add a CSS `@keyframes` on `.segment-item-wrapper` with `width` transition |
