# S05 — UX Design

**Date:** 2026-07-25

## 1. User Flows
- Browser: load → dismissible "Running in web mode" banner → use app (IndexedDB).
- Desktop: load → full native features.

## 2. Screen Inventory
- `src/App.tsx` mount logic; env banner component; native-feature guards.

## 3. States
- web vs desktop vs optional kiosk (VITE_REQUIRE_TAURI).

## 4–6. A11y / Dark-Light / Help
- Banner: role=status, focusable, dismissible via keyboard.
