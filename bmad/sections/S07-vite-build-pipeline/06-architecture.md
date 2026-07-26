# S07 — Architecture

**Date:** 2026-07-25

## 1. Context
Build tooling.

## 2. Components
- `vite.config.ts` (manualChunks + PWA + tailwind v4)
- `index.html`, `public/` (PWA icons)

## 3. Data Model
- N/A.

## 4. Interfaces
- Build script → `dist/`.

## 5. Integration
- Consumed by S10 (CI) and S11 (bundle-check).

## 6. Testing
- `npm run build` succeeds; assert chunk files exist.
