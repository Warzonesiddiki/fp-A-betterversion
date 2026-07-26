# S54 — Research

**Date:** 2026-07-25

## 1. Questions
- MC worker status?

## 2. Findings
- `src/workers/monte-carlo.worker.ts` exists.
- Tasklist 2.2.3 Monte Carlo via worker.

## 3. Decision
- Wire worker to S53; add progress + cancel; tests.

## 4. Risks
- Worker bundling in Vite/Tauri.

## 5. Dependencies
- S53, S91.
