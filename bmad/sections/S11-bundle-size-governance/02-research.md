# S11 — Research

**Date:** 2026-07-25

## 1. Questions
- Bundle limits; is bundle-check wired?

## 2. Findings
- `scripts/bundle-check.js` exists; `package.json` has `bundle-check` script.
- Limits documented: main ≤150KB gz, total ≤2MB gz.
- CLAUDE.md notes grid-vendor/excel-vendor should be lazy.

## 3. Decision
- Enforce via CI; ensure route-level lazy + vendor lazy.

## 4. Risks
- ai-vendor may be large; lazy-load it (ties to S04 optional model).

## 5. Dependencies
- S07 (chunks), S10 (CI).
