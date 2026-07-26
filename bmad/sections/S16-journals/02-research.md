# S16 — Research

**Date:** 2026-07-25

## 1. Questions
- Journals page status?

## 2. Findings
- `src/pages/data/GLJournalsPage.tsx` exists (lazy).
- 1.1.4 (Journals) unchecked in tasklist.

## 3. Decision
- Implement filter + pagination over `glStore.entries`.

## 4. Risks
- Large GL → virtualize (→ S92).

## 5. Dependencies
- S12.
