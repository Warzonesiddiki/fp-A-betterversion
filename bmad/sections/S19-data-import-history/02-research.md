# S19 — Research

**Date:** 2026-07-25

## 1. Questions
- Import history status?

## 2. Findings
- `src/pages/data/ImportJobHistory.tsx` exists (lazy).
- Undo logic partially in `glStore` (per tasklist 1.1.2).

## 3. Decision
- Build history list + undo that removes only imported entries.

## 4. Risks
- Undo after later edits → only removes originally imported ids.

## 5. Dependencies
- S12, S13.
