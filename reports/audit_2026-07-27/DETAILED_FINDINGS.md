# DETAILED FINDINGS TABLE — FULL-SCOPE AUDIT

**Repository:** `Warzonesiddiki/fp-A-betterversion`  
**Branch:** `arena/019fa391-fp-a-betterversion`  
**Commit:** `7738a00`  
**Audit Date:** 2026-07-27  
**Auditor:** Arena Agent Mode

---

## LEGEND

- [ID] — Unique finding identifier
- [Sev] — Severity (CRITICAL / HIGH / MEDIUM / LOW)
- [Cat] — Category (AuthZ, DataSec, FinEng, Integrity, API, FE, Access, Comp, Test, Perf, Tauri, AI, DevOps, Docs)
- [File(s)] — Primary file path(s)
- [Evidence] — Direct evidence from code (not comments/docs only)
- [Remediation] — Recommended fix

---

## 🔴 CRITICAL FINDINGS

### [C-01] Mock Auth Tokens Forgeable; Production Gate Bypassable
- [Sev] 🔴 CRITICAL
- [Cat] AuthZ
- [File(s)] `src/store/authStore.ts`
- [Evidence] `generateMockToken()` creates unsigned JWT-shaped strings (`header.payload.mock-signature`) with `HS256` header but no cryptographic signature. `loginMock()` accepts ANY password (`// Any password works in offline / mock-auth mode`). The production gate (`if (PROD && isMockAuthEnabled()) throw`) is a single boolean check. `useAuthStore.getState().setUser()` allows direct user/state escalation without any permission check.
- [Remediation] Implement real JWT verification (`jwt.verify` with secret) in `loginReal()`. Add server-side session validation. Remove `setUser()` from public store API or enforce RBAC server-side. Ensure `VITE_USE_MOCK_AUTH` is never set in production CI.

### [C-02] RBAC Enforcement Client-Side Only; Server Has No Permission Checks
- [Sev] 🔴 CRITICAL
- [Cat] AuthZ
- [File(s)] `src/utils/rbacEnforcer.ts`, `server/src/index.ts`, `server/src/middleware/auth.ts`
- [Evidence] `enforce()` checks `useAuthStore.getState().user.permissions` — entirely client-side. `authMiddleware` (`server/src/middleware/auth.ts`) verifies JWT (`jwt.verify`) but never checks `req.user.role` or permissions. Protected routes (`/api/budgets`, `/api/gl`, `/api/forecasts`, etc.) apply only `authMiddleware` + `auditRequestMiddleware` — no `requireRole()` or permission middleware is used (`stubRouter` does not use `requireRole`). User can call `useAuthStore.getState().someAction()` directly to bypass RBAC checks in UI.
- [Remediation] Apply `requireRole()` or permission middleware to ALL protected server routes. Implement server-side RBAC for every mutating endpoint. Remove direct `useStore.getState()` mutations from UI components; enforce actions through UI only.

### [C-03] Audit Trail Mutable; No Append-Only / Hashed Chain; RBAC Gating Missing
- [Sev] 🔴 CRITICAL
- [Cat] DataSec / Compliance
- [File(s)] `src/store/auditTrailStore.ts`, `src/pages/audit/AuditTrailPage.tsx`
- [Evidence] `auditTrailStore` defines `revertToState()` which modifies entries directly. No `hash` or `checksum` field is computed for entries. `AuditTrailPage` does not import `GDPR_AUDIT_VIEW_ROLES` (`admin`, `compliance`, `data-protection-officer`) — no RBAC gating on audit data viewing. `handleExport()` exports full data (including `oldValue`, `newValue`, `userName`, `metadata`) without calling `PIIRedactor`.
- [Remediation] Make audit trail append-only (remove `revertToState` or restrict to super-admin with separate audit log). Add HMAC/hash chain (`previousHash` → compute hash of entry + previous hash). Enforce `GDPR_AUDIT_VIEW_ROLES` in `AuditTrailPage` component and API routes. Call `PIIRedactor` before CSV export.

### [C-04] Brute-Force Protection (`accountLockout`) Dead Code — Not Integrated
- [Sev] 🔴 CRITICAL
- [Cat] AuthZ / API
- [File(s)] `server/src/middleware/accountLockout.ts`, `server/src/routes/auth.ts`
- [Evidence] `accountLockout.ts` defines `checkAccountLockout()` and `recordLoginAttempt()` using SQLite (`db.prepare`). `authRouter` (`server/src/routes/auth.ts`) does NOT import or call these functions. The login endpoint (`/api/auth/login`) has no brute-force check. Lockout state (`lockedUntil`, `loginAttempts`) exists in `authStore` but is only checked in `loginMock()` (client-side), not server-side.
- [Remediation] Integrate `checkAccountLockout()` and `recordLoginAttempt()` into auth router. Move brute-force state server-side (not client-side `authStore`). Use distributed rate limiting (e.g., Redis) for multi-IP protection.

### [C-05] WebSocket Token Passed in URL Query Parameter (Leaked to Logs)
- [Sev] 🔴 CRITICAL
- [Cat] API / DataSec
- [File(s)] `src/services/WebSocketManager.ts`
- [Evidence] `buildUrl()` constructs URL with `?token=${encodeURIComponent(this.config.token)}`. `connectWithAuth()` opens `new WebSocket(this.buildUrl())`. The token is transmitted in the URL (visible in browser DevTools Network tab, proxy access logs, server logs). No authentication on upgrade (no `Authorization` header or handshake token validation described).
- [Remediation] Pass token via `Authorization` header or WebSocket subprotocol, not URL query param. Implement server-side token validation on `upgrade` event.

### [C-06] Financial Calculation Engines Use Floating-Point `number` Without Decimal Rules
- [Sev] 🔴 CRITICAL
- [Cat] FinEng
- [File(s)] `src/engines/` (multiple), `src/utils/decimalUtils.ts`
- [Evidence] `SageConnector.aggregateGLBalance()` uses `number` for `DEBITAMOUNT` / `CREDITAMOUNT` with no rounding rules. `decimalUtils.ts` exists but is not enforced in `SageConnector` or engine code. `masterStorage` stores `number` values without decimal encoding. No `BigInt` or `integer-cents` representation is required.
- [Remediation] Enforce `decimalUtils` (or `decimal.js` / `big.js`) for ALL currency values in engines and storage. Use integer-cents representation in storage or explicit decimal encoding with `fixed` precision rules.

### [C-07] `SageConnector` SQL Injection via String Interpolation
- [Sev] 🔴 CRITICAL
- [Cat] API / DataSec
- [File(s)] `src/services/api-integration/SageConnector.ts`
- [Evidence] `getTransactions()` builds query string via interpolation: `const query = \`FROM GLEntry WHERE ACCOUNTNO = '${accountId}' ORDER BY ENTRYDATE DESC\`;`. The `accountId` parameter is user-controlled. No parameterized query mechanism exists for `readByQuery`. The connector also silently swallows errors (`catch { return { items: [], ... } }`).
- [Remediation] Use parameterized queries or sanitize/validate `accountId` with strict regex (`/^[A-Z0-9_-]+$/i`) before interpolation. Surface errors to caller instead of returning empty arrays silently.

---

## 🟠 HIGH FINDINGS

### [H-01] `masterStorage` Unencrypted; Migration No-Op; Schema Changes Can Crash Runtime
- [Sev] 🟠 HIGH
- [Cat] DataSec / Integrity
- [File(s)] `src/utils/masterStorage.ts`
- [Evidence] `masterStorage` uses `sqlJsStorage` or `tauriSqlStorage` (via `chunkedStorage`) — no encryption. `migrate: (state) => state` is a no-op migration. `version: 1` never increments. If store schema changes (e.g., new fields), stale persisted state may cause runtime errors or missing fields. `partialize` is only applied to `authStore`; other 34 stores persist full state (potentially sensitive).
- [Remediation] Add AES-256-GCM encryption to `masterStorage` (or use `SecretsVault` for sensitive fields). Implement proper schema migration (`version` increment + `migrate` function that transforms old schema to new). Add `partialize` to all stores containing sensitive data.

### [H-02] `SecretsVault` Master Key Derivation Weak (Default String Key)
- [Sev] 🟠 HIGH
- [Cat] DataSec
- [File(s)] `src/services/SecretsVault.ts`
- [Evidence] `SecretsVault` derives AES key from `this.rotationCounterKey` (default `'vault.rotation.counter'`) via PBKDF2 (`PBKDF2_ITERATIONS` from constants — value not shown but likely standard). The base key is imported as `new TextEncoder().encode(this.rotationCounterKey)` — a hardcoded/default string, not from OS keychain or user password. If the storage backend is copied, the derived key can be reproduced.
- [Remediation] Derive master key from OS keychain (macOS Keychain, Windows Credential Manager, Linux libsecret) via `TauriSecureStorage`. Rotate master key on first use and after each rotation cycle. Store rotation counter in secure storage, not plaintext.

### [H-03] `AuditTrailPage` Exports PII Without Redaction; GDPR Audit Roles Not Enforced
- [Sev] 🟠 HIGH
- [Cat] Compliance / DataSec
- [File(s)] `src/pages/audit/AuditTrailPage.tsx`, `src/store/auditTrailGdprEvents.ts`
- [Evidence] `handleExport()` creates CSV with `headers = ['Timestamp', 'User', 'Operation', 'Account', 'DataType', 'Old Value', 'New Value', 'Reason']` — includes `userName`, `oldValue`, `newValue`, `metadata` without redaction. `GDPR_AUDIT_VIEW_ROLES` (`['admin', 'compliance', 'data-protection-officer']`) is defined in `auditTrailStore` but never imported or checked in `AuditTrailPage`. No consent registry or right-to-erasure implementation is fully verified.
- [Remediation] Integrate `PIIRedactor` before CSV export. Enforce `GDPR_AUDIT_VIEW_ROLES` in page component and server route. Implement `rightToErasure()` in audit store (delete all PII for a user upon request). Track consent (`consent.captured`, `consent.withdrawn`) via `auditTrailGdprEvents`.

### [H-04] `VITE_NIM_API_KEY` Exposed in Client Bundle (Vite Env Var)
- [Sev] 🟠 HIGH
- [Cat] DataSec / Secrets
- [File(s)] `.env.example`, `src/services/nim.ts` (implied)
- [Evidence] `.env.example` defines `VITE_NIM_API_KEY=` and notes: "In production, NIM should be proxied through a backend... so the key never reaches the browser." However, `VITE_*` variables are exposed to the browser bundle by Vite (`import.meta.env.VITE_NIM_API_KEY`). Any value set in `.env` or CI environment will be included in the client bundle (`dist/assets/*.js`).
- [Remediation] Remove `VITE_NIM_API_KEY` from `.env.example` entirely. If NIM integration is needed, proxy through server (`/api/nim`) using server-side environment variable (`NIM_API_KEY` without `VITE_` prefix) — not exposed to client.

### [H-05] Sentry Replay Rate `1.0` Captures All Sessions on Error (PII Risk)
- [Sev] 🟠 HIGH
- [Cat] DataSec / Compliance
- [File(s)] `.env.example`, `src/services/` (Sentry init implied)
- [Evidence] `.env.example` mentions `replaysOnErrorSampleRate: 1.0` (or similar setting). This means 100% of error sessions are captured as replay videos, including user actions, form inputs, and potentially PII (budget data, user names). The `.env.example` does not mention `mask` or `block` options for replay.
- [Remediation] Set `replaysOnErrorSampleRate` to a lower value (e.g., `0.1` or `0.05`). Configure `maskAllText` and `block` selectors to exclude PII fields (email, budget amounts, user IDs). Ensure replay data is hosted in GDPR-compliant region (EU) or disabled for EU users.

### [H-06] `bundle-check` Script Exists But Not Enforced in CI; Total JS 1678 KB Gzip
- [Sev] 🟠 HIGH
- [Cat] Perf / DevOps
- [File(s)] `scripts/bundle-check.js`, `package.json`
- [Evidence] `bundle-check` script (`npm run bundle-check`) checks bundle size. The user notes total JS is 1678 KB gzip (exceeds 150 KB main chunk target and 2 MB total target). The CI workflow (`.github/workflows/`) was not fully audited but there is no evidence of automatic bundle-size enforcement gate (e.g., fail CI if > 150 KB).
- [Remediation] Add bundle-size enforcement gate to CI (`bundle-check` must pass with exit code 0). Implement code-splitting and tree-shaking for `Sentry` (skip init if `VITE_SENTRY_DSN` empty — already mentioned but verify in code). Lazy-load all 192 pages properly (`React.lazy` + `Suspense`).

---

## 🟡 MEDIUM FINDINGS

### [M-01] Deep Wizard Tests 43/54 Passing; 11 Failures Unverified
- [Sev] 🟡 MEDIUM
- [Cat] Test / Quality
- [File(s)] `tests/` (deep wizard), `tests/e2e/`
- [Evidence] User notes: "Deep wizard tests: 43/54 passing. What are the 11 failures?" The test results were not fully audited. No evidence of failing tests being fixed or documented.
- [Remediation] Investigate the 11 failing deep wizard tests. Fix or document expected failures. Ensure E2E tests (`tests/e2e/`) run in CI with `playwright.config.ts`.

### [M-02] 12 Migration/Backup Tests Skipped
- [Sev] 🟡 MEDIUM
- [Cat] Test / Integrity
- [File(s)] `tests/`, `src/store/migration/`
- [Evidence] User notes: "12 migration/backup tests are SKIPPED." Skip markers (`.skip`, `test.skip`) hide potential data-loss or corruption risks.
- [Remediation] Unskip migration/back tests. Verify `legacyStorageMigration` (`src/utils/migration/legacyStorageMigration.ts`) works end-to-end (IndexedDB → Tauri SQLite). Test backup integrity (`backupRestore.ts`) with restore verification.

### [M-03] 54 Non-Fixable A11y Warnings (`jsx-a11y/label`, etc.)
- [Sev] 🟡 MEDIUM
- [Cat] Access / FE
- [File(s)] `e2e/a11y/`, `tests/`
- [Evidence] User notes: "54 non-fixable a11y warnings exist (`jsx-a11y/label`, etc.)." These are accessibility gaps. The impact varies — some may prevent screen reader usage, others are minor.
- [Remediation] Audit all 54 warnings. Fix any that affect keyboard navigation or screen reader announcements (high-impact). Document remaining low-impact warnings with justification.

### [M-04] `subscribeWithSelector` Ordering Verified but Not Guaranteed for All Stores
- [Sev] 🟡 MEDIUM
- [Cat] Integrity / DataSec
- [File(s)] `src/store/` (35 stores)
- [Evidence] `authStore` uses `subscribeWithSelector(persist(immer(...)))` — correct order (subscribeWithSelector outermost). Not all 35 stores were audited for middleware ordering. Incorrect ordering can break persistence or selector subscriptions.
- [Remediation] Audit all 35 stores to ensure middleware order: `subscribeWithSelector` → `persist` → `immer` → store state. Add automated test or lint rule to enforce correct middleware nesting.

### [M-05] `IncidentResponse.ts` and `ThreatModel.ts` Likely Dead / Not Wired
- [Sev] 🟡 MEDIUM
- [Cat] AI / Quality
- [File(s)] `src/services/IncidentResponse.ts`, `src/services/ThreatModel.ts`
- [Evidence] `IncidentResponse.ts` (36 KB) defines `IncidentResponse` class but no usage found in server routes or frontend components. `ThreatModel.ts` (31 KB) defines `ThreatSignal` types but no emission/consumption integration verified. The code is extensive but may be ceremonial.
- [Remediation] Verify wiring: does any component import `IncidentResponse`? Does any service call `threatModel.emit()`? If not wired, either remove dead code or wire it to security events (failed auth, suspicious API calls, CSRF failures).

### [M-06] `docs/_archive/` Contains 536 KB Scratch Docs; Agent Artifacts Not Cleaned
- [Sev] 🟡 MEDIUM
- [Cat] Docs / DevOps
- [File(s)] `docs/_archive/`, `.ai/`, `agent_runs/`, `.mimocode/`, `.superpowers/`
- [Evidence] `docs/_archive/muse-scratch/` contains 536 KB of scratch docs. Root-level agent artifacts (`.ai/`, `agent_runs/`, `.mimocode/`, `.superpowers/`) are not needed for production or build. `docs/CAVEMAN_PERSIST/` contains ritual docs.
- [Remediation] Delete `docs/_archive/` and agent scratch directories. Consolidate architecture docs into one authoritative file (`ARCHITECTURE.md`). Move strategic plans (`FINPLAN_*`, `ROADMAP.md`) to external wiki or `docs/strategy/` (optional).

---

## 🔵 LOW FINDINGS

### [L-01] Naming Convention Inconsistency Across AI-Generated Files
- [Sev] 🔵 LOW
- [Cat] AI / Maintainability
- [File(s)] `src/store/`, `src/engines/`, `docs/`
- [Evidence] Many files contain ritual comments ("CAVEMAN PERSIST", "DRIFT", "3-WITNESS", "ICP"). Naming conventions vary: some files use `camelCase`, others `PascalCase` for the same concept (`AuditTrailStore` vs `auditTrailGdprEvents` vs `AuditTrailPage`). This is cosmetic but indicates inconsistent generation patterns.
- [Remediation] Standardize naming with an automated lint rule or refactor script. Remove ritual comments from production source (keep in commit messages only if needed for audit trail).

### [L-02] `SageConnector` Has `// @ts-nocheck` Not Present (Audit Prompt Mentioned It)
- [Sev] 🔵 LOW
- [Cat] AI / Code Quality
- [File(s)] `src/services/api-integration/SageConnector.ts`
- [Evidence] The user's audit prompt stated: `SageConnector.ts` has `// @ts-nocheck` — this disables ALL type safety. The actual file (`SageConnector.ts`) does NOT contain `@ts-nocheck`. It contains full TypeScript types (`SageAuthConfig`, `SageResponseEnvelope`, etc.). The audit prompt may refer to an earlier version or a different file.
- [Remediation] Confirm no `@ts-nocheck` exists in `SageConnector.ts`. If it ever appears, remove it and fix type errors properly.

### [L-03] `console.log` Used in Server Code for Startup Messages
- [Sev] 🔵 LOW
- [Cat] Security / Ops
- [File(s)] `server/src/index.ts`
- [Evidence] `console.log('[server] Running migrations...')` and `console.log('[server] Health check: ...')` output non-sensitive info. No PII or secrets are logged. However, in production, `console.log` should be replaced with structured logging (`winston`, `pino`) for observability.
- [Remediation] Replace `console.log` with structured logger. Ensure no `console.log` outputs sensitive data (verified: none found).

### [L-04] `docs/_archive/muse-scratch/` Contains Unnecessary Scratch Files (`FOUNDER_PUSH_SCRIPT.sh`, `TASKBOARD.md` 281 KB)
- [Sev] 🔵 LOW
- [Cat] Docs / Hygiene
- [File(s)] `docs/_archive/muse-scratch/FOUNDER_PUSH_SCRIPT.sh`, `docs/_archive/muse-scratch/TASKBOARD.md`
- [Evidence] `FOUNDER_PUSH_SCRIPT.sh` (7 KB) is a shell script not needed for build. `TASKBOARD.md` (281 KB) is a massive scratch task board.
- [Remediation] Delete `FOUNDER_PUSH_SCRIPT.sh` and `TASKBOARD.md` (already covered by archive deletion recommendation).

---

## SUMMARY TABLE BY SEVERITY

| Severity | Count | Key Topics |
|---|---|---|
| 🔴 CRITICAL | 7 | Mock auth, RBAC (client-only), audit trail mutable, brute-force dead, WebSocket token leak, floating-point currency, SQL injection |
| 🟠 HIGH | 6 | Master storage unencrypted, secrets key weak, GDPR audit roles missing, `VITE_NIM_API_KEY` exposure, Sentry replay PII, bundle size unenforced |
| 🟡 MEDIUM | 6 | Deep wizard failures, skipped migration tests, a11y warnings, middleware ordering, dead incident response, archive hygiene |
| 🔵 LOW | 4 | Naming inconsistency, `@ts-nocheck` absence, `console.log`, scratch shell scripts |
| **Total** | **23** | — |

---

## EVIDENCE REFERENCES (FILES READ DIRECTLY)

The following files were read directly (not from documentation or comments only) to produce evidence:

- `src/store/authStore.ts` (full 572 lines)
- `src/store/auditTrailStore.ts` (first 523 lines + actions)
- `src/store/auditTrailGdprEvents.ts` (first 60 lines)
- `src/pages/audit/AuditTrailPage.tsx` (full 633 lines)
- `src/utils/rbacEnforcer.ts` (full 529 lines)
- `src/utils/masterStorage.ts` (full 64 lines)
- `src/services/SecretsVault.ts` (first 975 lines)
- `src/services/WebSocketManager.ts` (full 307 lines)
- `src/services/SecurityHeaders.ts` (first 627 lines)
- `src/services/api-integration/SageConnector.ts` (full 763 lines)
- `server/src/index.ts` (full 153 lines)
- `server/src/middleware/auth.ts` (full 68 lines)
- `server/src/middleware/accountLockout.ts` (full 125 lines)
- `server/src/routes/auth.ts` (partial, verified no lockout integration)
- `.env.example` (full 109 lines)
- `package.json` (full 117 lines)
- `docs/_archive/` (directory listing and file counts)
- `src/store/glStore.ts` (partial, verified GL structure)
- `src/engines/AICopilotEngine.ts` (partial, verified engine structure)
- `src/services/IncidentResponse.ts` (partial, verified structure)
- `src/services/ThreatModel.ts` (partial, verified structure)
- `docs/_archive/muse-scratch/atlas/` (file listing)
