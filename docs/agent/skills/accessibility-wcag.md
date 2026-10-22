---
name: accessibility-wcag
description: >
  Use for any interactive UI change: keyboard reachability, focus, contrast,
  live regions, motion. Accessibility is a gate here, not a polish pass.
group: product-ui
---

# Accessibility (WCAG)

**Use when** adding a control, a modal, a table, a chart or a drag interaction.

## The minimum, every time

1. **Keyboard**: every action reachable without a mouse, in a sensible order, with
   a visible focus ring.
2. **Focus**: a modal traps focus and returns it to the opener; a route change
   moves focus to the heading, not the body.
3. **Names**: every input has a label; every icon button has an accessible name.
4. **Contrast**: text meets AA against its actual backdrop, in both themes.
5. **Live regions**: async results announce politely; errors announce assertively
   and are not only colour.
6. **Motion**: respect `prefers-reduced-motion`; no parallax or autoplay that
   cannot be stopped.
7. **Tables**: real `<th>` with scope; a grid of divs is not a table.

## In this repo

- `npm run test:a11y` runs the accessibility suites; `src/theme/` contract tests
  pin contrast per token pair.
- Colour comes from semantic CSS custom properties (`--text-*`, `--surface-*`,
  `--action-*`). A numbered Tailwind stop (`text-slate-500`) breaks the ratchet
  and cannot flip with the theme.
- A quarantine/notice must be announced, not just rendered — see the GL notices.

## Red flags

- `div` with `onClick` and no role or key handler.
- Placeholder used as a label.
- A colour-only status indicator.

**Proves itself with:** `npm run test:a11y` and a keyboard pass you actually did.
**Source:** original, from the repo's a11y suites and UI contract ids.
