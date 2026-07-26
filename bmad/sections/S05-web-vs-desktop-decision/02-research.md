# S05 — Research

**Date:** 2026-07-25

## 1. Questions
- Can the same React/Vite app run in a browser and in Tauri? Does the gate block it?

## 2. Findings (verified)
- `src/App.tsx` lines 351–358: `if (!isTauri) { alert('...exclusively...Tauri...'); return null; }`. Confirms browser renders nothing.
- Tauri 2 embeds a webview running standard web tech; the frontend is plain React. Running the same build in a browser is technically trivial once the gate is removed.
- Persistence already abstracts via `masterStorage` (IndexedDB in browser, SQLite in Tauri) — so data layer is environment-agnostic.
- Tauri-only capabilities (native file dialog, OS notifications, autoupdate) are opt-in via `@tauri-apps/*` and are already mocked in tests.

## 3. Decision
- Remove the hard gate; feature-detect. Browser mode = IndexedDB + graceful degradation of native features. Desktop mode = SQLite + native features.

## 4. Risks
- Some components may assume `window.__TAURI_INTERNALS__`; audit during Dev (S97–S98).

## 5. Dependencies
- S04 (clean install) should land first so we can run/verify in browser.
