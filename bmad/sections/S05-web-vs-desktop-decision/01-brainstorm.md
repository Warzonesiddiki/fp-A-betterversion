# S05 — Brainstorming: Web vs Desktop Decision

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- "All-in-one, never use another app" is strongest if it runs **both** in a browser and as a native desktop app.
- Code currently does `if (!isTauri) { alert(...); return null; }` → browser renders nothing. This contradicts README "Desktop & Web".

## 2. SCAMPER
- **Modify:** invert the gate → feature-detect; if not Tauri, use IndexedDB persistence; if Tauri, use SQLite.
- **Substitute:** make Tauri-requirement an **optional** env flag (`VITE_REQUIRE_TAURI`), default off.
- **Combine:** one app, two persistence backends behind `masterStorage`.

## 3. Ideation
- Option A: web + desktop (recommended). Option B: desktop-only (simplify, but loses browser reach).

## 4. Selected Directions
1. **Adopt Option A:** support both. Remove `return null`; show a non-blocking notice in browser mode.
2. Keep Tauri as the premium/offline path.

## 5. Open Questions
- Does any feature require Tauri-only APIs at startup? (file dialogs, autoupdate) → those degrade gracefully in web.
