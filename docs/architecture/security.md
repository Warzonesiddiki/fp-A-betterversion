# Security Architecture

**Status:** current as of 2026-07-29, during remediation of audit `ZCFA-2026-07-28-001`.
Every statement below describes code that exists in this repository. Where a
control is missing, weak, or unproven, that is stated plainly rather than
omitted. Claims that could not be verified in this environment are marked
**UNVERIFIED**; controls that do not exist are marked **NOT IMPLEMENTED**.

---

## 1. Trust model

FinPlan Pro is **local-first**. The browser/desktop client holds the general
ledger, budgets, forecasts and entity structure in a local SQL.js (web) or
Tauri SQLite (desktop) database. An optional Express server exists in `server/`
but the shipped client does not depend on it for authorization today.

The consequences follow directly and are not negotiable:

| Adversary                                                                 | Defended?                           | Notes                                                                          |
| ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Remote attacker with no local access                                      | Partially                           | CSP, no eval, sandboxed plugins, no open network listeners                     |
| Attacker who obtains a copy of the database file **without** the key item | Yes                                 | AES-256-GCM at rest (§3)                                                       |
| Attacker with access to the same OS user / browser profile                | **No**                              | The device key lives in `localStorage` beside the data. Documented limitation. |
| Malicious user escalating their own role in devtools                      | **Not yet** — client-only RBAC (§4) | F-0016 open                                                                    |
| Malicious plugin author                                                   | Partially                           | AST validation + terminable execution budget (§6)                              |

---

## 2. Authentication

- `src/store/authStore.ts` holds the session. `VITE_USE_MOCK_AUTH` enables an
  offline mock login **and is hard-blocked in production builds**: both
  `src/main.tsx` and `authStore.ts` throw at module scope if `import.meta.env.PROD`
  is true and the flag is set. Mock tokens are unsigned and forgeable, so this
  gate is a correctness requirement, not a convenience.
- Token rotation lives in `src/utils/tokenRotation.ts`.
- MFA is modelled on the `User` type (`mfaEnabled`) but enrolment/verification
  is **NOT IMPLEMENTED** in the client.

---

## 3. Data at rest

Implemented in `src/utils/masterStorage.ts`.

- **Cipher:** AES-256-GCM via Web Crypto, 12-byte random IV per record,
  IV prepended to the ciphertext, base64 encoded in fixed 32KB chunks
  (the previous `String.fromCharCode(...bytes)` spread threw
  `RangeError: Maximum call stack size exceeded` on payloads above ~100KB,
  i.e. any realistic GL import).
- **Key material**, in precedence order:
  1. `MASTER_STORAGE_KEY` environment variable (operator/test override);
  2. a per-install **device key** — 256 random bits generated on first run and
     stored in `localStorage` under `finplan.storage-key.v1`;
  3. otherwise `StorageKeyUnavailableError` — **fail closed**, no fallback key.

  The hardcoded literal key found by the audit (F-0014) has been removed and a
  pre-commit hook blocks its reintroduction.

- **What this does and does not protect** (F-0014 honesty requirement):
  it protects a copy of the SQL.js database taken _without_ the key item. It
  does **not** protect against an attacker who can read the same browser
  profile, because the key sits next to the data. There is no server-side key
  escrow, and **OS keychain integration is NOT IMPLEMENTED** — that is the
  planned upgrade for the Tauri build. Do not describe this as "end-to-end
  encryption".

- **Fail-closed reads (F-0012):** a decryption failure raises
  `StorageDecryptionError` and surfaces a user-visible storage error. Ciphertext
  is never handed back to `JSON.parse` and never becomes application state.
  Data encrypted under the retired key is unrecoverable by design; the recovery
  path is restore-from-backup.

- **Fail-loud writes (F-0011):** every write is wrapped; quota, serialization,
  encryption and backend failures raise `StorageWriteError` and emit a storage
  error event. No write fails silently.

- **Chunking (F-0025):** values above 1MB are split. Two defects were fixed
  here: chunk records were joined as objects (producing `"[object Object]"`,
  making any store >1MB permanently unreadable), and a missing slice was
  reported as an empty store. Missing slices now raise a corruption error.
  Chunk writes are **not atomic** — a crash mid-write leaves a store that is
  detected as corrupt but not automatically repaired.

---

## 4. Authorization (RBAC)

- Catalogue: `Permissions` in `src/utils/rbacEnforcer.ts` (94 strings).
- Grants: `ROLE_PERMISSIONS` in `src/store/authStore.ts` across five roles —
  `Admin`, `FP&A_Manager`, `Analyst`, `Department_Head`, `Viewer`.
- Enforcement: store actions are wrapped with `enforce()` / `withRBAC()`, which
  throw `PermissionError` when `hasPermission(user, p)` is false.
- Invariants are machine-checked by `src/store/rbacMatrixCompleteness.test.ts`:
  every enforced permission must be grantable by at least one role; Admin must
  hold the whole catalogue; no role may hold a string outside the catalogue;
  Viewer may hold no financial write; destructive and user-admin permissions are
  Admin-only; and **no mutating action may be guarded by a `:read` permission**
  (`esgStore` shipped exactly that, letting any Viewer rewrite ESG disclosures).
- Denial behaviour is proven by `src/store/rbacNegativeAuthorization.test.ts`
  (35 tests): no session, under-privileged Viewer, and Admin-minus-one-permission,
  each asserting state is unchanged after denial.

> **Open, tracked as F-0016 — client-only enforcement.**
> All of the above runs in the browser. A user who edits `authStore` state in
> devtools can bypass it, because the data lives locally and there is no server
> in the write path. Client RBAC is a UI-integrity and mistake-prevention
> control; it is **not** a security boundary against the local user. Server-side
> authorization in `server/` is required before any multi-tenant or
> untrusted-user deployment.

---

## 5. Audit trail

`src/store/auditTrailStore.ts` with `src/utils/sha256.ts`.

- Entries are hash-chained: `hash_n = SHA-256(hash_{n-1} ‖ canonical(record_n))`,
  covering id, timestamp, actor, operation, entity, before/after values, reason,
  source and correlation id. The previous non-cryptographic djb2 hash (computed
  over freshly generated values, and therefore unverifiable by construction) was
  removed under F-0015.
- `verifyIntegrity()` recomputes the chain and detects mutation, deletion,
  reordering and truncation.
- **Limitation:** the chain is **unkeyed**, so an attacker with write access to
  the store can recompute a consistent chain after tampering. Tamper-evidence
  against a local adversary requires an append-only server sink or an HMAC with
  a key the client does not hold — **NOT IMPLEMENTED**, tracked with F-0016.
- The sql.js backend is in-memory in the browser session; durability follows
  §3.

---

## 6. Plugin sandbox

`src/plugins/` — see `docs/architecture/plugin-security.md` for detail.

Three enforcement layers, all required because the sandbox runs in-process:

1. **Static rejection** — acorn AST validation rejects constant-true loops
   (`while(true)`, `for(;;)`, `while(!0)`), `async`/generator functions, direct
   `eval`, oversized string literals, and host-escape identifiers
   (`require(`, `child_process`, `process.env`, `new WebSocket`, `document.cookie`,
   `location.href`).
2. **Loop heartbeat** — every loop body is instrumented with a `__fpTick()` call
   bound to a baked-in deadline, so a non-literal infinite loop
   (`while (i >= 0) i++`) is terminated. Measured: 202ms against a 200ms budget.
3. **Scheduling bounds** — sandboxed `setTimeout`/`setInterval` shims accept only
   work inside the remaining budget and create no real timers.

**Limitation:** execution is still in-process. A Worker isolate with
`terminate()` would be strictly stronger and remains the recommended hardening.

---

## 7. Content Security Policy

Defined twice and kept consistent: `index.html` (web) and
`src-tauri/tauri.conf.json` → `app.security.csp` (desktop). Pinned by
`src/__tests__/csp.test.ts`.

Enforced in both surfaces: `default-src 'self'`; `script-src` **without**
`'unsafe-inline'` and **without** `'unsafe-eval'` (web uses a SHA-256 hash for
the single inline bootstrap; desktop adds only `'wasm-unsafe-eval'` for sql.js);
`object-src 'none'`; `base-uri 'self'`; `form-action 'self'`;
`frame-ancestors 'none'`; no wildcard or scheme-wide `http:` source.

### Accepted exception: `style-src 'unsafe-inline'` (F-0032)

Retained deliberately. Measured evidence from a production build:

- runtime `createElement('style')` / `insertRule(` calls appear in
  `dist/assets/DataGrid-*.js`, `ReportDesignerPage-*.js`, `pdf-vendor-*.js`,
  `Combination-*.js` and the entry chunk (ag-grid, framer-motion, jsPDF);
- 145 `.tsx` files use `style={{ ... }}`.

Neither a nonce nor a hash can cover styles injected at runtime by third-party
code we do not control. **Risk accepted:** `style-src 'unsafe-inline'` permits
CSS injection (selector-based exfiltration, UI redress) but **not** script
execution — the script-side controls above are what prevent code execution, and
they are unrelaxed. Removing this exception requires eliminating runtime style
injection from the dependency set; it is not achievable by editing the policy.

---

## 8. Desktop (Tauri) capabilities — F-0019

`src-tauri/capabilities/default.json`:

- `shell:allow-execute` **removed**. The desktop shell cannot spawn processes.
- Filesystem access is scoped (`fs:scope-appdata-recursive`,
  `applocaldata`, `appconfig`, `applog`, plus `document`/`download`/`desktop`
  for user-initiated import/export). Unscoped read/write is gone.
- SQL is limited to `load`, `select`, `execute`, `close`.
  **`sql:allow-execute` remains** because migrations require DDL; parameterised
  statements are used throughout, but this permission is broader than ideal and
  is the largest remaining desktop privilege.
- **Auto-updater disabled** (`updater.active: false`, F-0020).
  `updates.finplanpro.com` is not controlled infrastructure and did not resolve
  in DNS. Re-enable only with a controlled endpoint, a signing key, and tests.
- **UNVERIFIED:** `npm run tauri:build` has not been executed in this
  environment (no Rust toolchain). Capability changes were reviewed by manifest
  inspection only.

---

## 9. Output and input safety

- **Spreadsheet formula injection (F-0017):** `src/utils/spreadsheetSanitize.ts`
  neutralises cells beginning with `=`, `+`, `-`, `@`, tab or carriage return.
  Applied by every CSV and ExcelJS writer; the previous live-formula conversion
  was removed. Corpus tests cover `=cmd|`, `=HYPERLINK`, `+cmd`, `-cmd`, `@SUM`
  and whitespace-prefixed payloads.
- **Formula evaluation:** `SafeMathParser` is a real parser over `decimal.js`;
  it never calls `eval`, and rejects empty/whitespace-only input (F-0008).
- **Schema validation:** Zod is used at import and API boundaries. Coverage is
  **not yet complete** across worker and IPC messages.

---

## 10. Observability privacy — F-0022

`src/sentryReplayConfig.ts`. Session Replay previously ran with **no masking
options** at `replaysOnErrorSampleRate: 1.0`, shipping pixel-accurate video of
ledger data; the advertised `SENTRY_REPLAY_MASK_ALL_TEXT` variable was read by
no code.

Now `maskAllText`, `maskAllInputs` and `blockAllMedia` are **unconditional** —
there is deliberately no environment variable that can weaken them. Financial
selectors (`.ag-cell`, `.budget-grid`, `.trial-balance`, `[data-financial]`,
…), value-bearing attributes (`value`, `title`, `placeholder`, `aria-label`, …)
and media/canvas surfaces are masked or blocked; network request and response
bodies are never captured. Unmasking is opt-in per element via
`data-sentry-unmask`. Sentry activates only when `VITE_SENTRY_DSN` is set.

---

## 11. Supply chain — F-0021

- `scripts/check-dependency-audit.mjs` blocks any HIGH/CRITICAL advisory in the
  **production** tree unless it is recorded in `security/audit-allowlist.json`
  with a reason, an exposure assessment and an expiry date. Expired acceptances
  fail the build; stale entries whose advisory has disappeared also fail, so the
  allowlist cannot rot into a mute button.
- Current state: 14 HIGH → **2 HIGH**, both accepted and documented
  (`sharp` <0.35.0 and its parent `@huggingface/transformers`, which pins it).
  No patched version exists. Exposure is bounded: both are Node-only paths, and
  a production build contains no reference to `sharp` or `onnxruntime-node` in
  `dist/assets/*.js` — the browser uses `onnxruntime-web`. Acceptance expires
  2026-10-29.
- A staged-diff secret scan runs in `.husky/pre-commit` (added lines only, so a
  commit that _removes_ secret material is never blocked by its own deletion).

---

## 12. Known gaps

| Gap                                          | Finding           | Status                               |
| -------------------------------------------- | ----------------- | ------------------------------------ |
| Server-side authorization                    | F-0016            | Open — client-only enforcement today |
| Audit chain is unkeyed / no append-only sink | F-0015 (2nd half) | Open                                 |
| OS keychain key storage on desktop           | F-0014 follow-up  | Not implemented                      |
| MFA enrolment/verification                   | —                 | Not implemented                      |
| `sql:allow-execute` breadth                  | F-0019            | Accepted for migrations              |
| `style-src 'unsafe-inline'`                  | F-0032            | Accepted, evidence in §7             |
| Tauri build verification                     | F-0019            | UNVERIFIED — no Rust toolchain here  |
| Zod coverage on worker/IPC messages          | —                 | Partial                              |
| Repo-wide float→money migration              | F-0006            | Partial (2 modules adopted)          |

---

## 13. Reporting a vulnerability

See `SECURITY.md` at the repository root.
