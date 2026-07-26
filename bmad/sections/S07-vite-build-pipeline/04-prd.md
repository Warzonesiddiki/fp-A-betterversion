# S07 — PRD

**Date:** 2026-07-25

## 1. Overview
Harden and finalize the Vite production build.

## 2. FRs
- FR-1: `vite.config.ts`: manualChunks → react-vendor, chart-vendor, grid-vendor, form-vendor, state-vendor, ai-vendor.
- FR-2: Add `vite-plugin-pwa` (autoUpdate, Workbox).
- FR-3: Deterministic filenames (content hash), sourcemaps off in prod.
- FR-4: Verify all 192 routes are lazy (fix any static imports in `App.tsx`).

## 3. Acceptance
- Build splits chunks; PWA manifest+SW emitted; build reproducible.

## 4. Out of Scope
- Perf benchmarking (→ S92).
