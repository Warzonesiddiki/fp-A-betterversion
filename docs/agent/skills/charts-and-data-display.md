---
name: charts-and-data-display
description: >
  Use when a chart, sparkline, KPI tile or heatmap shows a number: the picture must
  not imply something the data does not say.
group: product-ui
---

# Charts and data display

**Use when** data becomes a visual.

## Rules

1. **Axis honesty**: bar charts start at zero; a truncated axis needs a visible
   break mark and a reason.
2. **One scale per comparison.** Two y-axes on one chart is a claim; make it two
   charts.
3. **Sign and colour agree** with the domain (variance favourable/unfavourable is
   not "green is up"). Label the convention on the screen.
4. **Aggregation is stated**: sum, average, or last-value — a chart that does not
   say is a finding.
5. **Missing data is a gap**, not a zero-height bar. Partial periods are marked.
6. **Every chart has a table or tooltip** carrying the exact figures; the picture
   is a summary of the numbers, never their only home.
7. **Accessible**: an accessible name, a text summary, and colour-blind-safe
   palettes.

## In this repo

- Charts must read `Money` through the formatting helpers; an axis built from raw
  numbers reintroduces the float trap.
- Tooltip values must match the table exactly — one formatter, not two.
- Drill-through should land on the rows that produced the point.

## Red flags

- A pie chart with twelve slices.
- A trend line over three points.
- A "target" line with no source.

**Proves itself with:** a test asserting the plotted value equals the displayed value.
**Source:** original.
