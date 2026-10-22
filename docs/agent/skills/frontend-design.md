---
name: frontend-design
description: >
  Use when building or restyling a screen: density for finance work, hierarchy
  that survives a projector, and no decoration that costs a click.
group: product-ui
---

# Frontend design

**Use when** a page, panel or table gets a visual change.

## The bar here

1. **Density is the feature.** Finance users scan tables; whitespace that forces
   scrolling is a cost. Prefer tight rows, right-aligned numbers, tabular figures.
2. **One primary action per screen.** Everything else is secondary and looks it.
3. **Numbers align vertically.** Monospace digits or `font-variant-numeric:
   tabular-nums`; a column that jitters is unreadable.
4. **State is visible**: loading, empty, partial, stale, quarantined, error. Empty
   and zero are different screens.
5. **Tokens, not literals.** Semantic custom properties only; the palette ratchet
   fails on numbered Tailwind stops.
6. **Motion earns its place** and respects reduced motion.
7. **Dark and light** are both real; contrast contracts are tested.

## In this repo

- Theme tokens live in `src/index.css`; contract suites in `src/theme/` pin
  contrast. `npm run palette:ratchet` blocks palette-stop regressions.
- Existing page conventions: page header with period/entity scope, toolbar, table,
  totals row, notice area. Match them before inventing a layout.
- A "missing data" state is a first-class design state, not a grey dash invented
  ad hoc.

## Red flags

- A gradient, a hero, or a marketing tone inside a working tool.
- Colour used as the only carrier of meaning.
- A number formatted differently in two places on one screen.

**Proves itself with:** both themes rendered, plus the palette and contrast gates.
**Source:** original, influenced by anthropics/skills `frontend-design` (see its
licence in that repository), rewritten for this product.
