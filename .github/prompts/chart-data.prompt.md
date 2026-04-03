---
description: "Convert raw data (CSV, JSON, or inline values) into a segmented horizontal bar chart call. Use when: turning data into a chart, visualizing a dataset as segments, creating a bar chart from numbers."
argument-hint: "Paste CSV/JSON data or describe the values to chart"
agent: "agent"
---

# Chart Data

Convert the provided data into a segmented horizontal bar chart using the `buildSegmentBar` API from the [bar-chart skill](../skills/bar-chart/SKILL.md).

## Input

Accept data in any of these forms:

- **CSV** — header row + value rows (use first text column as `title`, first numeric column as `value`)
- **JSON array** — objects with at least a numeric field
- **Inline description** — e.g. "Revenue 16744, Costs 6500, Profit 32750"
- **Existing variable** — reference to an array already in scope

## Output

1. A `SegmentData[]` array derived from the input.
2. A `buildSegmentBar(...)` call wired to a target element.
3. If a target element doesn't exist yet, add a `<div id="...">` to the appropriate HTML file.
4. Import `segment.css` in the page if not already present.

## Rules

- Map the most descriptive text field to `title`.
- Map the primary numeric field to `value`.
- If the user specifies colors, set `color` per item; otherwise omit and let the palette handle it.
- Choose a palette that fits the data mood (`warm` for financial, `cool` for performance, `blue` default).
- Format the call with the user's locale if mentioned, otherwise default to `'en-US'`.
- Keep the generated code minimal — no extra wrappers or abstractions.
