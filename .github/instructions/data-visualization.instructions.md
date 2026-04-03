---
description: "Use when creating data visualizations, bar charts, segment charts, proportional displays, or any charted breakdown of numeric data. Covers color contrast, accessibility, number formatting, and layout conventions."
applyTo: "**/segment*.ts"
---

# Data Visualization Conventions

## Color & Contrast

- Segment text (titles, values) must meet WCAG AA contrast (4.5:1) against the segment background.
- Prefer the built-in palettes (`blue`, `warm`, `cool`, `mono`) which are ordered light→dark. For dark backgrounds, start from a later palette index or supply a custom array.
- Never rely on color alone to convey meaning — pair with labels or patterns.

## Number Formatting

- Always pass a BCP-47 `locale` string; never hard-code comma/period separators.
- Use `Intl.NumberFormat` or `toLocaleString` — not manual string manipulation.
- Percentages should display 0–2 decimal places; drop trailing `.00`.

## DOM & Security

- Build DOM with `createElement` + `textContent`. Never use `innerHTML`.
- Sanitize any user-supplied strings before setting `textContent` (though `textContent` is inherently safe).

## Accessibility

- Container: `role="img"` + descriptive `aria-label`.
- Decorative percentage labels: `aria-hidden="true"`.
- Each segment wrapper needs a `title` attribute for native tooltip.
- Provide a data-table alternative when the chart is the sole source of information.

## Layout

- Segment widths must be percentage-based (`%`), never pixel values.
- Use `flex-wrap: nowrap` to keep all segments on one row.
- Hide labels on narrow segments via `overflow: hidden` — don't shrink font size.
- Use CSS custom properties (`--segment-*`) for all theme tokens.
