# S07 — Brainstorming: Vite Build Pipeline

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- The build must be **reproducible, fast, and split** so no single chunk is huge.

## 2. SCAMPER
- **Combine:** manual chunks group heavy libs (charts, grid, AI).
- **Add:** PWA (offline shell) via vite-plugin-pwa.
- **Modify:** harden build script (frozen lockfile, sourcemaps off in prod, content-hash filenames).

## 3. Ideation
- Chunks: react-vendor, chart-vendor, grid-vendor, form-vendor, state-vendor, ai-vendor.

## 4. Selected Directions
1. Configure `vite.config.ts` manualChunks + PWA + tailwind v4 plugin.
2. Reproducible build (deterministic hashing).

## 5. Open Questions
- Are all 192 routes already lazy? (verify in Dev)
