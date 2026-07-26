# S54 — Brainstorming: Monte Carlo Worker

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Heavy simulation must not block the UI thread.

## 2. SCAMPER
- **Add:** run S53 in a Web Worker; progress + cancel.
- **Modify:** uses S53 engine.

## 3. Ideation
- Worker receives model → returns samples/percentiles.

## 4. Selected Directions
1. `monte-carlo.worker.ts` wrapping S53; UI progress.
2. (Worker exists; wire + test.)

## 5. Open Questions
- Cancel mid-run? (yes, via message.)
