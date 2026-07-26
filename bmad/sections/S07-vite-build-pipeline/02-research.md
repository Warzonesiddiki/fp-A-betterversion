# S07 — Research

**Date:** 2026-07-25

## 1. Questions
- Vite 8 build best practices; chunking; PWA.

## 2. Findings
- Vite 8 supports `build.rollupOptions.output.manualChunks`.
- `@tailwindcss/vite` (no PostCSS) is already configured.
- `vite-plugin-pwa` provides Workbox auto-update.
- Current `vite.config.ts` exists (large); manualChunks partially defined.

## 3. Decision
- Keep Tailwind v4 plugin; formalize 6 vendor chunks; add PWA; deterministic output.

## 4. Risks
- Over-chunking can hurt caching; keep 6 sensible groups.

## 5. Dependencies
- S04 (install) before build verification.
