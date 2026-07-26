# S06 — Brainstorming: Design Tokens & Theme System

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A "zero-compromise" UI needs one token source; no hardcoded colors; perfect dark/light.

## 2. SCAMPER
- **Combine:** centralize all colors/spacing/radii in `src/config/design-tokens.ts` + CSS variables.
- **Substitute:** Tailwind v4 `@theme` referencing CSS vars → tokens drive utilities.
- **Add:** accent theming (user-selectable accent color).

## 3. Ideation
- Token tiers: primitive (gray-50..950), semantic (bg-surface, text-default, border, favorable, unfavorable), component.

## 4. Selected Directions
1. Define primitive + semantic tokens; wire Tailwind v4 theme.
2. Accent system via CSS var `--accent`.
3. Leave raw-color audit to S88 (depends on this token base).

## 5. Open Questions
- How many accents? Start with 1 default + 5 presets.
