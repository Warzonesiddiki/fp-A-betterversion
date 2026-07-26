# S53 — Research

**Date:** 2026-07-25

## 1. Questions
- Monte Carlo engine status?

## 2. Findings
- `MonteCarloEngine` + `monte-carlo.worker.ts` exist.
- Tasklist 2.2.3 Monte Carlo via worker.

## 3. Decision
- Implement pure MC engine (seeded RNG); distributions per driver.

## 4. Risks
- Performance → S54 worker.

## 5. Dependencies
- S43, S50, S54.
