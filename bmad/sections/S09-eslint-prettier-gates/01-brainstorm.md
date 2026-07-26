# S09 — Brainstorming: ESLint & Prettier Gates

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Lint must be **0 errors, 0 warnings** in CI. Format must be automatic.

## 2. SCAMPER
- **Confirm:** ESLint 9 flat config + typescript-eslint + jsx-a11y.
- **Add:** prettier + eslint-config-prettier; husky + lint-staged.
- **Eliminate:** manual formatting.

## 3. Ideation
- `npm run lint` = `eslint src --max-warnings 0`.

## 4. Selected Directions
1. Flat config with a11y + prettier; `--max-warnings 0`.
2. husky pre-commit → lint-staged (only changed files).

## 5. Open Questions
- Current `lint` script uses `--fix`; CI should run without --fix to catch issues.
