# S11 — Brainstorming: Bundle Size Governance

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Bundle must stay within strict limits; breaches block merge.

## 2. SCAMPER
- **Confirm:** `scripts/bundle-check.js` exists.
- **Add:** enforce all routes lazy; warn on large chunks.
- **Modify:** thresholds (main ≤150KB gz, total ≤2MB gz).

## 3. Ideation
- CI fails if `bundle-check` over threshold.

## 4. Selected Directions
1. Wire `bundle-check` into CI (S10) + pre-push.
2. Audit any non-lazy route imports.

## 5. Open Questions
- Are grid-vendor/excel-vendor already lazy? (verify)
