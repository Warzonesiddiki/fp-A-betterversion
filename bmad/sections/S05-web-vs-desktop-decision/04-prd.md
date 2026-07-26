# S05 — PRD

**Date:** 2026-07-25

## 1. Overview
Make the app run in browser and desktop; remove the Tauri-only hard gate.

## 2. User Stories
- As a web user, I want the app to load in my browser.
- As a desktop user, I want native features.

## 3. Functional Requirements
- FR-1: In `src/App.tsx`, replace `if (!isTauri) return null` with environment feature-detection; show a dismissible banner in browser mode (not a blocking alert).
- FR-2: `masterStorage` already routes persistence; verify browser→IndexedDB, desktop→SQLite.
- FR-3: Add `VITE_REQUIRE_TAURI` (optional, default false); when true, enforce desktop-only (for kiosk deployments).
- FR-4: Guard Tauri-only calls (dialogs, notifications, shortcuts) so they no-op safely in browser.

## 4. Non-Functional
- No blocking modal; accessible banner (role=status).

## 5. Acceptance Criteria
- `npm run dev` + open browser → app mounts, no alert.
- `tauri:dev` → app mounts with native features.

## 6. Out of Scope
- Tauri build/packaging (→ S97/S98).

## 7. Dependencies
- S04 (install) before verification.

## 8. Open Issues
- Audit Tauri API usages across `src/` for unguarded calls.
