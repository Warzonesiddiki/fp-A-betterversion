# ATTACK SURFACE MAP — FINPLAN PRO

**Audit Date:** 2026-07-27  
**Repository:** `Warzonesiddiki/fp-A-betterversion`  
**Audit Scope:** All entry points (HTTP, WebSocket, IPC, file upload, plugin system, desktop Tauri APIs)

---

## OVERVIEW

The platform has multiple entry points across web, desktop (Tauri), server, and third-party integrations. Each entry point is mapped with its authentication mechanism, authorization mechanism, and known vulnerabilities from the audit.

---

## ENTRY POINT 1: HTTP / API (Express Server)

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `GET /api/health` | None (public) | None | No vulnerability. |
| `POST /api/auth/*` (login, register, refresh) | `authLimiter` (rate limit 10/15min) | None (public routes) | **CRITICAL:** `accountLockout` not integrated; brute-force protection is dead code (`C-04`). `loginReal()` is a stub (no real auth backend). Mock auth tokens forgeable (`C-01`). |
| `GET /api/audit/*` | `generalLimiter` + `authMiddleware` | `auditRequestMiddleware` (logs request only — no RBAC) | `AuditTrailPage` has no RBAC gating (`C-03`). Server route does not enforce `GDPR_AUDIT_VIEW_ROLES`. |
| `GET /api/budgets` (stub) | `authMiddleware` | None (stub returns 501) | **HIGH:** Protected resources (`budgets`, `gl`, `forecasts`, etc.) apply `authMiddleware` only — no `requireRole()` or permission middleware (`C-02`). User can access if JWT is valid, regardless of role. |
| `GET /api/gl` (stub) | `authMiddleware` | None | Same as above. |
| `GET /api/export` | `authMiddleware` | None | No export authorization check. `AuditExportButton` may not enforce roles. |
| `POST /api/*` (any protected) | `authMiddleware` | `auditRequestMiddleware` (only logging) | **CRITICAL:** No server-side RBAC enforcement. Any valid JWT can access any protected endpoint (`C-02`). |

### HTTP / API Vulnerabilities
- **CSP:** `helmet` CSP allows `styleSrc: ["'self'", "'unsafe-inline'"]` — inline styles allowed (`SecurityHeaders.ts`). `scriptSrc` does not allow `unsafe-inline` in production (good), but `moderate` preset allows `unsafe-inline` for scripts.
- **CORS:** `cors()` allows `http://localhost:5173` in dev; production uses `https://finplan.app` (from `.env` or default). No explicit allowlist enforcement in production.
- **Rate Limiting:** `authLimiter` (10/15min) applied only to `/api/auth`. `generalLimiter` applied only to `/api/audit`. Protected resources (`budgets`, `gl`) have no rate limiting beyond `stubRouter` (30/15min) — but `stubRouter` only applies to stub endpoints (501 responses). If real endpoints are implemented, rate limiting must be applied.
- **Body Size Limit:** `express.json({ limit: '1mb' })` — prevents large payload DoS (good).
- **HSTS:** Enabled only if `NODE_ENV === 'production'`. Development/staging does not enforce HSTS.
- **CSRF:** `CsrfProtection.ts` exists but is NOT applied in `server/src/index.ts`. No `csurf` middleware or CSRF token validation is wired into routes.

---

## ENTRY POINT 2: WEBSOCKET (Real-Time Collaboration)

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `wss://...` (WebSocket server URL) | Token in URL query param (`?token=...`) | None on upgrade; message-level auth not verified | **CRITICAL:** Token leaks in URL (`C-05`). `WebSocketManager.buildUrl()` constructs URL with `token`. No `Authorization` header or handshake validation. Messages (`CollaborationMessage`) are parsed but not validated against user permissions. |

### WebSocket Vulnerabilities
- **Token Exposure:** `connectWithAuth()` sends `new WebSocket(this.buildUrl())` where URL includes `token`. Proxies, server logs, browser history, and DevTools Network tab capture the token.
- **No Message Authorization:** `handleMessage()` parses `JSON.parse(event.data)` and calls handlers. No check that `message.type` or `message.payload` is allowed for the connected user's role.
- **No Heartbeat Validation:** `heartbeatInterval` sends `ping` but does not validate `pong` from server (`resetHeartbeatTimeout` resets timer on any incoming message, not specifically `pong`). A stale connection may remain open indefinitely.
- **Reconnection:** `scheduleReconnect()` retries up to `maxRetries` (default 10) with exponential backoff. No circuit breaker on WebSocket connection.

---

## ENTRY POINT 3: DESKTOP (TAURI) — IPC & FILE SYSTEM

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `src-tauri/src/` (Rust commands) | Tauri `security.csp` in `tauri.conf.json` | `allowlist` not configured (`withGlobalTauri` not mentioned) | `tauri.conf.json` CSP allows `script-src 'self' 'wasm-unsafe-eval'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' ipc: http://ipc.localhost`, `worker-src 'self' blob:`. `ipc:` and `blob:` allow broader sources than needed. `withGlobalTauri` is not explicitly disabled. |
| File upload (`.fpa`, `.xlsx`, `.csv`) | Tauri file associations (`fileAssociations`) | None | `tauri.conf.json` defines file associations for `.fp`, `.fpa`, `.xlsx`, `.xls`, `.csv`. No validation of file content before processing. `ImportPipeline` (frontend) processes uploaded files. |
| Plugin System (`plugin-marketplace`) | None verified | None | `plugin-marketplace` URL can be configured via `.env` (`PLUGIN_MARKETPLACE_URL`). Plugin system (`plugin/`) is not fully audited. `BenchmarkService` may load plugins without validation. |

### Tauri / Desktop Vulnerabilities
- **CSP:** Tauri CSP is more permissive than server CSP (`unsafe-inline` for styles, `wasm-unsafe-eval` for scripts, `blob:` for workers, `ipc:` and `http://ipc.localhost` for connect). This increases XSS risk in desktop app.
- **File System Access:** `TauriSecureStorage` (Rust side) may use OS keychain, but the frontend (`TauriSecureStorage.ts`) uses `sql.js` or `tauriSqlStorage`. No verification that Rust-side file access is scoped to specific directories (`src-tauri/src/commands/` not fully audited).
- **Updater:** `tauri.conf.json` defines updater endpoint (`https://updates.finplanpro.com`). No signature verification mechanism mentioned (`pubkey` is present but not verified in audit). `pubkey` is a base64-encoded minikey — if the updater endpoint is compromised, malicious updates could be installed.
- **IPC Validation:** Rust commands (`src-tauri/src/lib.rs` or `main.rs` not fully audited) — input validation on Rust side is not verified. Frontend can invoke arbitrary Rust functions if `withGlobalTauri` is enabled.

---

## ENTRY POINT 4: FILE UPLOAD / IMPORT (Frontend + Server)

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `GLUploadPage` / `GLImportService` | Client-side (store state) | `rbacEnforcer` (`import:create`) | `GLImportService` (`src/services/GLImportService.ts`) processes `CSV` and `XLSX` uploads. No server-side validation of file content. `SageConnector` uses `readByQuery` with user-controlled `accountId` (SQL injection). `ImportPipeline` (`src/services/ImportPipeline.ts`) does not sanitize inputs before passing to engines. |

### File Upload Vulnerabilities
- **CSV Injection:** `GLImportService.importGLData()` reads CSV rows. If a cell contains `=cmd|' /C calc'!A0` (formula injection), Excel may execute it upon opening. The audit did not verify if `ImportPipeline` strips formulas.
- **XSS via File Content:** `SageConnector.getTransactions()` builds query strings. If malicious `accountId` (with single quotes) is embedded in a CSV file and imported, SQL injection may occur in the connector.
- **No File Type Validation:** `tauri.conf.json` allows `.fpa`, `.xlsx`, `.csv`. The frontend does not verify MIME types or magic numbers before processing.

---

## ENTRY POINT 5: PLUGIN SYSTEM

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `/plugins` (local or marketplace URL) | None verified | None | `plugin-marketplace` URL configurable (`.env`). Plugin system (`src/plugins/` or similar) not fully audited. `BenchmarkService` (`src/services/BenchmarkService.ts`) may load external code. No plugin signing or sandboxing verified. |

---

## ENTRY POINT 6: AI / COPILOT ENGINES (NIM / LLM)

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `VITE_NIM_API_KEY` (client bundle exposure) | Client bundle | None | **HIGH:** `VITE_NIM_API_KEY` is exposed to browser bundle (`C-04` in findings). If set, anyone with access to the deployed app can extract the key from `dist/assets/*.js`. |
| `AICopilotEngine` (`src/engines/AICopilotEngine.ts`) | Client-side (`useAuthStore`) | `rbacEnforcer` (if applied) | Engine may generate non-deterministic results. `AIEngine` (`src/engines/AIEngine.ts`) uses `Math.random()` (expected for Monte Carlo) but other engines may use random values inadvertently (`C-06` — floating-point arithmetic). |

---

## ENTRY POINT 7: CLIENT-SIDE STATE MANIPULATION (DEVTOOLS BYPASS)

| Endpoint / Pattern | Auth | AuthZ | Evidence / Vulnerability |
|---|---|---|---|
| `zustand` store (`useAuthStore.getState()`) | Client-side only | `rbacEnforcer` (client-side only) | **CRITICAL:** User can open DevTools Console and run: `useAuthStore.getState().setUser({ role: 'Admin', permissions: [...], ... })`. All 35 stores are accessible via `useStore.getState()`. No server-side enforcement prevents modified state from being sent to server (if server validates JWT but not state content). |

---

## SUMMARY OF ATTACK VECTORS

| Vector | Severity | Evidence / Finding ID |
|---|---|---|
| Mock auth token forgery (`generateMockToken`) | 🔴 CRITICAL | `C-01`, `authStore.ts` |
| Client-side RBAC bypass (`useAuthStore.getState()`) | 🔴 CRITICAL | `C-02`, `rbacEnforcer.ts` |
| Audit trail mutation (`revertToState`) + no RBAC gating | 🔴 CRITICAL | `C-03`, `auditTrailStore.ts`, `AuditTrailPage.tsx` |
| Brute-force dead code (`accountLockout` not integrated) | 🔴 CRITICAL | `C-04`, `server/src/routes/auth.ts` |
| WebSocket token leak (`?token=...`) | 🔴 CRITICAL | `C-05`, `WebSocketManager.ts` |
| SQL injection (`SageConnector`) | 🔴 CRITICAL | `C-07`, `SageConnector.ts` |
| Unencrypted `masterStorage` (IndexedDB/SQLite) | 🟠 HIGH | `H-01`, `masterStorage.ts` |
| Weak master key (`rotationCounterKey` default string) | 🟠 HIGH | `H-02`, `SecretsVault.ts` |
| PII in audit exports (no `PIIRedactor`) | 🟠 HIGH | `H-03`, `AuditTrailPage.tsx` |
| `VITE_NIM_API_KEY` client bundle exposure | 🟠 HIGH | `H-04`, `.env.example` |
| Sentry replay `1.0` (PII capture) | 🟠 HIGH | `H-05`, `.env.example` |
| Plugin system (unverified sandbox/signature) | 🟠 HIGH | Plugin docs not audited |
| File upload / CSV injection (unverified) | 🟠 HIGH | `GLImportService.ts` |
| Floating-point currency (no decimal rules) | 🟠 HIGH | `C-06`, `SageConnector.ts` |

---

## VISUAL DIAGRAM (TEXT)

```
[Browser / Client]
  │
  ├─► [HTTP] ──► [Express Server]
  │     ├─ Auth (mock / real stub) ──► [C-01, C-04]
  │     ├─ RBAC (client-only) ──► [C-02]
  │     ├─ Audit routes (no RBAC) ──► [C-03]
  │     └─ Protected routes (JWT only) ──► [C-02]
  │
  ├─► [WebSocket] ──► [wss://...] (token in URL) ──► [C-05]
  │
  ├─► [Tauri Desktop] ──► [Rust IPC] ──► [Tauri CSP / File Access]
  │     └─ [File Upload] (.fpa, .xlsx, .csv) ──► [Unverified validation]
  │
  ├─► [Plugin System] ──► [Marketplace URL] ──► [Unverified sandbox]
  │
  ├─► [AI / NIM] ──► [Client bundle key] ──► [C-04 (high severity)]
  │
  └─► [DevTools] ──► [zustand getState()] ──► [C-02 (client-side bypass)]

[Server Side]
  ├─ [SQLite DB] ──► [Audit Store] (mutable) ──► [C-03]
  ├─ [SQLite DB] ──► [Login Attempts] (dead code) ──► [C-04]
  └─ [SecretsVault] ──► [masterStorage] (unencrypted) ──► [H-01, H-02]

[Data Flow]
  Financial Data (IndexedDB / SQLite) ──► Unencrypted ──► [C-01, H-01]
  Audit Trail ──► Mutable / No Hash Chain ──► [C-03]
  WebSocket Messages ──► No AuthZ ──► [C-05]
```
