# S06 — Research

**Date:** 2026-07-25

## 1. Questions
- Best token architecture for Tailwind v4 + dark/light + accent?

## 2. Findings
- Tailwind v4 uses CSS-first config: `@theme` in CSS maps tokens to utilities; dark mode via `@media (prefural-color-scheme: dark)` or `.dark` class + CSS variables.
- Semantic tokens (bg-surface, text-muted, border-subtle, favorable=#16A34A, unfavorable=#DC2626) prevent raw `bg-white`/`text-black` leaks (the exact problem S88 will audit).
- Accent theming: a single `--accent` CSS var swapped at runtime; components use `bg-accent` etc.

## 3. Decision
- Primitive + semantic token layers; `.dark` class toggles semantic var values; `--accent` for theming.

## 4. Risks
- Existing components use raw classes → S88 audit + gradual migration.

## 5. Dependencies
- None; precedes S88.
