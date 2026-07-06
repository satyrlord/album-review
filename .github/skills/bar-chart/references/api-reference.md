# Segment — TypeScript API Reference

## Types

### `SegmentData`

Each item in the `data` array.

- `value` (`number`, required, default: none): Numeric value; determines proportional width.
- `title` (`string`, optional, default: none): Label rendered inside the segment (top-left).
- `color` (`string`, optional, default: next palette color): Explicit CSS color string. Overrides palette.
- `tooltip` (`string`, optional, default: `"title (formatted value)"`): Custom tooltip text for the `title` attribute.

### `SegmentOptions`

Top-level config passed to `buildSegmentBar` or `SegmentChart`.

- `data` (`SegmentData[]`, required, default: none): Array of segment data points (≥ 1 item).
- `width` (`string`, optional, default: `'100%'`): CSS width of the bar container.
- `height` (`string`, optional, default: `'60px'`): CSS height of the bar container.
- `palette` (`BuiltInPalette | string[]`, optional, default: `'blue'`): Built-in palette name or custom color array.
- `locale` (`string`, optional, default: `'en-US'`): BCP-47 locale for number formatting.
- `showPercentage` (`boolean`, optional, default: `true`): Show percentage on hover.
- `showValue` (`boolean`, optional, default: `true`): Show the raw value label.
- `valueFormatter` (`(value: number, locale: string) => string`, optional, default: `toLocaleString`): Custom value display.
- `ariaLabel` (`string`, optional, default: auto-generated): Accessible `aria-label` for the container.

### `BuiltInPalette`

```typescript
type BuiltInPalette = 'blue' | 'warm' | 'cool' | 'mono';
```

### `SegmentPalette`

```typescript
type SegmentPalette = BuiltInPalette | string[];
```

---

## Functions

### `buildSegmentBar(element, options)`

```typescript
function buildSegmentBar(element: HTMLElement, options: SegmentOptions): void;
```

Clears the element, adds the `segment-bar` class, sets ARIA attributes, and appends one `<div class="segment-item-wrapper">` per data item with proportional widths.

**Throws** nothing — a zero-sum dataset renders zero-width segments gracefully.

---

## Classes

### `SegmentChart`

Optional OOP wrapper for stateful charts.

```typescript
class SegmentChart {
  constructor(element: HTMLElement, options: SegmentOptions);
  render(): void;
  update(options: Partial<SegmentOptions>): void;
  destroy(): void;
}
```

- `render()`: Re-render with current options. Called automatically by the constructor.
- `update(opts)`: Shallow-merge new options into existing ones and re-render.
- `destroy()`: Remove all chart DOM, classes, ARIA attributes, and inline styles.

---

## CSS Custom Properties

Override these on `.segment-bar` or an ancestor to theme the chart.

- `--segment-gap` (default: `2px`): Gap between segments.
- `--segment-radius` (default: `3px`): Border radius on first/last segments.
- `--segment-font-family` (default: `system-ui, …`): Font for titles and values.
- `--segment-font-mono` (default: `ui-monospace, …`): Font for percentage labels.
- `--segment-label-size` (default: `12px`): Font size for all labels.
- `--segment-title-bg` (default: `rgba(0,0,0,0.35)`): Background of the title badge.
- `--segment-hover-overlay` (default: `rgba(0,0,0,0.25)`): Darkening overlay on hover.
- `--segment-hover-expand` (default: `128px`): Horizontal padding added on hover.
- `--segment-transition` (default: `0.4s cubic-bezier(…)`): Transition timing for hover effects.

---

## CSS Classes

- `.segment-bar` on the container `<div>`: Flex row, gap, font family.
- `.segment-item-wrapper` on each segment `<div>`: Proportional width, color, hover.
- `.segment-item-title` on a `<span>`: Title badge (top-left).
- `.segment-item-value` on a `<span>`: Formatted value (bottom-left).
- `.segment-item-percentage` on a `<span>`: Percentage (bottom-right, hover-only).

---

## Usage Examples

### Minimal

```typescript
buildSegmentBar(document.getElementById('chart')!, {
  data: [{ value: 70 }, { value: 30 }],
});
```

### Custom colors and titles

```typescript
buildSegmentBar(document.getElementById('chart')!, {
  data: [
    { title: 'Revenue', value: 16744, color: '#ff0000' },
    { title: 'Costs',   value: 6500,  color: '#00aa00' },
    { title: 'Profit',  value: 32750, color: '#0055ff' },
    { title: 'Tax',     value: 3200,  color: '#ffcc00' },
  ],
});
```

### Custom palette array

```typescript
buildSegmentBar(document.getElementById('chart')!, {
  data: [
    { title: 'A', value: 10 },
    { title: 'B', value: 20 },
    { title: 'C', value: 30 },
  ],
  palette: ['#e63946', '#457b9d', '#1d3557'],
});
```

### Class-based with update

```typescript
const chart = new SegmentChart(document.getElementById('chart')!, {
  data: [{ title: 'Loading', value: 1 }],
  palette: 'mono',
});

// Later, when data arrives:
chart.update({
  data: [
    { title: 'Pass', value: 85, color: '#22c55e' },
    { title: 'Fail', value: 15, color: '#ef4444' },
  ],
});
```

### German locale

```typescript
buildSegmentBar(document.getElementById('chart')!, {
  data: [{ value: 12345.67 }, { value: 8901.23 }],
  locale: 'de-DE',
});
```
