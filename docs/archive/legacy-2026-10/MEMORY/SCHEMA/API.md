---
id: MEMORY/SCHEMA/API.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# SCHEMA/API — endpoints that exist

Route modules under `server/src/routes/` (verified `ls`, non-test):

```
audit.ts  auth.ts  budgets.ts  commands.ts  entities.ts  export.ts
forecasts.ts  gl.ts  periods.ts  reports.ts  scenarios.ts
```

Per-endpoint paths, verbs, payloads and authz rules: **UNVERIFIED this session** — read the route
file before naming any endpoint. Middleware of note: `server/src/middleware/rateLimit.ts`
(`authLimiter` on auth routes), `entityAuth.ts` (entity access table).

Frontend call sites: only ~14 non-test files reach the server (carried finding, re-verify before
relying on it). Everything else reads local stores.
