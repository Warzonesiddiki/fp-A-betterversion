# S05 — Architecture

**Date:** 2026-07-25

## 1. Context
Runtime environment decision; affects every page.

## 2. Components
- `src/App.tsx` (mount gate)
- `src/components/ui/EnvBanner.tsx` (new, browser-mode notice)
- `src/utils/env.ts` (isTauri, isWeb, requireTauri)
- native-feature guards in `src-tauri` bridge usage

## 3. Data Model
- `EnvMode = 'web' | 'desktop' | 'kiosk'`.

## 4. Interfaces
- `getEnvMode()` → EnvMode; `guardTauri(fn)` → safe no-op in web.

## 5. Integration
- Used by all pages; persistence via `masterStorage`.

## 6. Performance/Security
- No behavior change in desktop; web mode slightly lighter (no native calls).

## 7. Testing
- Vitest: App mounts in jsdom (web) without alert; tauri-mock → desktop path.
