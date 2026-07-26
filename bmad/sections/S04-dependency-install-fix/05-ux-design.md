# S04 — UX Design

**Date:** 2026-07-25
**Note:** Dev-experience / build.

## 1. User Flows
- Dev runs `npm ci` → succeeds. AI panel: if model unavailable → friendly "AI unavailable" state.

## 2. Screen Inventory
- `package.json`, `.npmrc`, `src/ai/optionalModel.ts`, AI UI fallback.

## 3. States
- AI: available (model loaded) vs unavailable (graceful message).

## 4–6. A11y / Dark-Light / Help
- Fallback message must be accessible (role=status).
