# S07 — Product Brief

**Date:** 2026-07-25

## 1. Vision
A fast, reproducible, code-split production build with offline support.

## 2. Target Users
- Developers, CI, end users (fast load).

## 3. Problem & Value
- Problem: build config may be inconsistent; no PWA.
- Value: reliable, cacheable, installable build.

## 4. Success Metrics
- `npm run build` deterministic; chunks split; PWA registered.

## 5. Scope Guardwalls
- In: vite config, chunks, PWA. Out: runtime perf tuning (→ S92).
