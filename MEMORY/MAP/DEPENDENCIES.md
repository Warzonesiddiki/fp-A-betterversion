---
id: MEMORY/MAP/DEPENDENCIES.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# MAP/DEPENDENCIES

## Notable external (from package.json, read 2026-08-18)

- React 19, react-router-dom, Vite, Tailwind, Zustand, recharts, decimal.js, lucide-react,
  @tauri-apps/api + cli, vitest, @playwright/test, eslint, prettier, husky, jest-axe.
- `server/`: Express + SQLite (better-sqlite3-family native binding, bootstrapped explicitly
  because `server/.npmrc` sets `ignore-scripts=true` as a supply-chain posture).
- Vulnerability posture: patch-level `overrides` in `server/package.json` (`ip-address`,
  `body-parser`) per ADR-001. `npm audit` reported 0 vulnerabilities at install this session.

## Internal dependency rules

- Pages → derivation modules → `@/utils/money` (+ engines). Pages must not do money arithmetic
  inline.
- Engines are pure: no I/O, no DOM, deterministic, no global mutation (`@purity-tier` headers).
- Stores must not import pages. Engines must not import stores.
- Vertical packs must not fork the core engine (K19).
