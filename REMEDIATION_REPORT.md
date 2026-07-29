# REMEDIATION REPORT — Wave 2

**Audit:** `ZCFA-2026-07-28-001` · **Verdict under remediation:** UNACCEPTABLE
**Branch:** `arena/019faacd-fp-a-betterversion` · **Base:** `8e0bcaa` (wave 1, PR #14, merged)
**Date:** 2026-07-29 · **Scope:** wave 2 (wave 1 closed 14 findings; see PR #14)

> This report records only what was executed and observed in this environment.
> Items that could not be run are marked **BLOCKED** with the exact command
> required. No finding is claimed closed without a command result.

---

## SUMMARY OF VERDICT CHANGE

**The verdict does not change. The project is NOT production-ready.**

Wave 2 closed 8 further findings and, in doing so, uncovered and fixed **13
production defects that no audit finding had named** — several more severe than
the findings that led to them. Significant findings remain open (F-0016
server-side authorization, F-0013 period close, F-0006 repo-wide money
migration, F-0028 orphan engines), and three gates cannot be executed here.

The honest position: the product is materially safer than at `38e7f0f`, and
demonstrably still incomplete.

---

## FINDING STATUS MATRIX

| ID | Title | Status | Evidence |
|---|---|---|---|
| F-0010 | Backup/restore unproven | **CLOSED** | 19/19 KAV-12 round-trip, 2.6s |
| F-0021 | 14 HIGH prod vulnerabilities | **CLOSED** | 14 → 2, both documented+expiring |
| F-0022 | Sentry replays unmasked | **CLOSED** | 16 tests; masking unconditional |
| F-0025 | Full suite cannot complete | **PARTIAL** | 3 hangs eliminated; full run not executed |
| F-0026 | Store layer 35% red | **CLOSED** | 44/44 files, 696/696 tests, 50.8s |
| F-0027 | 48 tautological assertions | **CLOSED** | 46 → 0 + CI gate over 908 files |
| F-0032 | CSP `style-src unsafe-inline` | **CLOSED** | 18 tests; documented acceptance |
| F-0034 | README claims false | **CLOSED** | 11-check gate, falsified 3× |
| F-0024 | CI gates inert (CI half) | **BLOCKED** | token lacks `workflows` scope |
| F-0013, F-0016, F-0006, F-0028, F-0029, F-0030, F-0031, F-0035 | — | **OPEN** | not attempted in wave 2 |

### Defects found during remediation that no finding named

Each was verified against the untouched tree at `8e0bcaa` before being fixed.

| # | Defect | Severity |
|---|---|---|
| 1 | **Backups captured none of the user's data** — `BackupRestore` read IndexedDB; all 36 stores persist to `masterStorage`. Export reported success with an empty file. | CRITICAL |
| 2 | **28 enforced permissions grantable by no role, including Admin** — capex/driver/variance/dashboard/cube/workflow/notification/inventory features permanently dead for every user. | CRITICAL |
| 3 | **`SafeMathParser` returned `0` for division by zero** ("per financial convention"). `profit/revenue` with zero revenue rendered a 0% margin indistinguishable from a measured zero. | CRITICAL |
| 4 | **`SecretsVault` AES key derived from the constant `'vault.rotation.counter'`** — hardcoded key material in a secrets vault (F-0014 class). | CRITICAL |
| 5 | **Unbounded recursion in `SecretsVault.set()`** — `set → appendWal → set`; one write issued 275+ storage ops, each a 600k-iteration PBKDF2. The first secret ever written never completes. | CRITICAL |
| 6 | **Worker-pool stranded tasks forever** — a throwing `workerFactory()` queued work nothing could drain; the promise never settled. `masterStorage.setItem` routes through it, so saves hung silently. | CRITICAL |
| 7 | **Stores >1MB were write-only** — chunk records joined as objects produced `"[object Object]"`; the store was reported empty on read. | CRITICAL |
| 8 | **`esgStore` guarded all 5 mutators with `analytics:read`** — any Viewer could rewrite ESG disclosures. | HIGH |
| 9 | **`SecretsVault.delete()` returned `ok:true` with zero shards deleted** and reset the circuit breaker. | HIGH |
| 10 | **Circuit breaker never tripped on quorum failure** — a dead backend was retried indefinitely. | HIGH |
| 11 | **A failing audit logger destroyed durable writes** — returned `INTERNAL` for a write that had already reached quorum. | HIGH |
| 12 | **`rotate()` race** — the in-flight guard was armed after an `await`, so concurrent rotations both proceeded. | MEDIUM |
| 13 | **Desktop CSP lacked `object-src 'none'`** while the web policy had it. | MEDIUM |

---

## COMMAND EVIDENCE

All commands run at `43107ad` unless noted.

| Command | Exit | Result |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | 0 | 1048 packages |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 | ~37s |
| `node node_modules/eslint/bin/eslint.js src --max-warnings 0` | 0 | ~100s |
| `npm run build` | 0 | ~150s, PWA 379 entries |
| `node scripts/bundle-check.js` | 0 | all G3+G19 PASS, 0 warnings |
| `npm audit --omit=dev` | — | 14 HIGH → **2 HIGH** (both accepted) |
| `node scripts/check-dependency-audit.mjs` | 0 | 2 accepted, 0 unaccepted |
| `node scripts/check-readme-claims.mjs` | 0 | 11/11 |
| `node scripts/check-tautological-tests.mjs` | 0 | 908 files, 0 found |
| `node scripts/csp-hash-check.js` | 0 | inline script hash valid |
| `sh tests/security/HuskyGate10.test.sh` | 0 | 40/41 (2.4 needs pyyaml) |
| `npm run tauri:build` | — | **BLOCKED** — no Rust toolchain |
| `npm run test:e2e` | — | **BLOCKED** — `playwright install` fails (Download failure, code=1) |
| `curl http://localhost:5173/` (dev server) | 0 | **HTTP 200 in 0.027s** — E2E webServer target is healthy |
| `vitest run` (full) + `--coverage` | — | **NOT RUN** — see F-0025 below |

### `npm ci` caveat (unchanged from wave 1)

Plain `npm ci` fails in this sandbox: `onnxruntime-node`'s postinstall downloads
from `api.nuget.org`, which the proxy blocks (ECONNRESET). `--ignore-scripts` is
a sandbox workaround only; `.npmrc` remains scripts-enabled per F-0024.

---

## TEST EVIDENCE

| Shard | Before | After |
|---|---|---|
| `src/store` | 27/40 files failed, 219/627 tests failed, ~800s | **44/44 files, 696/696, 50.8s** |
| `src/store/migration/cubeMigration` | **TIMEOUT at 180s** | **51/51 in 1.9s** |
| `src/services/SecretsVault` | **never terminated** (killed at 300s, 600s) | **75/75 in 10.0s** |
| `src/workers` | 73 | **77/77** |
| `src/engines/SafeMathParser` | 379 (5 certifying a defect) | **381/381** |
| `src/utils/backupRestore` | 4 mock-only | **19/19 real round trip** |
| `src/services` (whole) | did not complete | 882/887, 60s |

The 5 remaining `src/services` failures are in `IncidentResponse`,
`SecurityHeaders-CsrfProtection` and `WebSocketManager` — untouched here and
failing at the audit baseline.

---

## FINANCIAL KNOWN-ANSWER EVIDENCE

| KAV | Status |
|---|---|
| KAV-01..08, 11, 13, 15 | Passing (wave 1) |
| **KAV-12** backup/restore equality | **PASSING** — `src/utils/backupRestore.test.ts` |
| KAV-09 statement articulation | **OPEN** |
| KAV-10 accounting-equation property | **OPEN** |
| KAV-14 storage quota visible | Passing (wave 1); reinforced by the worker-pool fix |

---

## BACKUP/RESTORE EVIDENCE (F-0010 / KAV-12)

`npx vitest run src/utils/backupRestore.test.ts` → **exit 0, 19/19, 2.6s**,
executed against the real `masterStorage` path rather than a mock:

- seed → backup → **wipe (asserted empty)** → restore → deep-equal all stores;
- 5,000-row ledger round-trips without truncation; `'150000.00'` survives exactly;
- tampered file → rejected, **nothing written**; truncated file → rejected;
- SHA-256 over canonical JSON: order-independent, one-cent sensitive;
- registry drift guard scans `src/store` for `persist({ name })` and fails if a
  persisted store is missing from the backup registry, in either direction.

Full detail: `docs/architecture/backup-restore.md`.

---

## SECURITY EVIDENCE

- **Dependencies:** 14 HIGH → 2 HIGH. The remainder (`sharp` <0.35.0 and its
  parent `@huggingface/transformers`) have no patched version. Exposure bounded
  by measurement: after a real build, `dist/assets/*.js` contains no reference
  to `sharp` or `onnxruntime-node` — both are Node-only paths and the browser
  uses `onnxruntime-web`. Recorded in `security/audit-allowlist.json` with an
  expiry of 2026-10-29; the gate fails the build on that date.
- **Sentry replay:** masking is unconditional and reads no environment variable.
  The previously advertised `SENTRY_REPLAY_MASK_ALL_TEXT` was read by no code
  and has been removed from `.env.example`.
- **CSP:** web and desktop policies test-pinned; `unsafe-inline` confined to
  `style-src` and proven absent everywhere else; `object-src 'none'` added to
  desktop.
- **RBAC:** matrix completeness and least-privilege are machine-checked; 35
  negative-authorization tests cover no-session, under-privileged Viewer, and
  Admin-minus-one-permission.

### Gates demonstrated blocking (falsification, not assertion)

| Gate | Falsification | Result |
|---|---|---|
| README claims | restore "Production-Ready" | exit 1 |
| README claims | worker count 4 → 7 | exit 1 |
| README claims | decimal.js adopters 2 → 188 | exit 1 |
| Dependency audit | expire an acceptance | exit 1 |
| Dependency audit | stale allowlist entry | exit 1 |
| Dependency audit | remove acceptance for a live advisory | exit 1 |
| Tautology scan | inject one `expect(true).toBe(true)` | exit 1, names file:line |
| Sentry wiring | revert to `replayIntegration()` | 2 tests fail |
| All | restore correct state | exit 0 |

---

## CI GATE EVIDENCE

`.husky/pre-push` now runs, in order: `tsc` → `eslint --max-warnings 0` → P0
vitest shard → `npm run build` → `bundle-check` → version consistency →
**README claims** → **dependency audit** → **tautology scan** → Gate 10.
The full battery executed and passed on the wave-2 push.

**BLOCKED:** the matching `.github/workflows/ci.yml` changes — `eslint
--max-warnings 0`, `build` depending on `test`, a blocking `audit` job, and the
README/tautology steps — could not be pushed:

```
! [remote rejected] refusing to allow a GitHub App to create or update
  workflow `.github/workflows/ci.yml` without `workflows` permission
```

The change is preserved and applyable at
`ci-patches/0001-ci-gates-F-0021-F-0024-F-0034.patch` with instructions in
`ci-patches/README.md`. **F-0024 stays open on the CI side.** Every gate in the
patch already runs at pre-push, so a developer cannot push a violating change;
the gap is server-side re-verification.

---

## TAURI BUILD EVIDENCE

**BLOCKED.** No Rust toolchain in this environment.
Required: `npm run tauri:build`. Capability and CSP changes were made by
manifest inspection and are covered by `src/__tests__/csp.test.ts`, which parses
`src-tauri/tauri.conf.json` directly. F-0019 remains unverified end-to-end.

---

## E2E EVIDENCE

**BLOCKED, and red in CI.** `npx playwright install chromium` fails in this
sandbox with `Download failure, code=1`, so the suite cannot be run locally.
Required to close: `npx playwright install chromium && npm run test:e2e`.

**Pre-existence established, not assumed.** The E2E job failed on run
`30331505636` (started 2026-07-28T05:26:39Z) — before any commit on this branch
and before wave 1 landed. On PR #15 it fails identically at the same step
(`Run E2E tests`, ~69s, run `30420688576`). It is a pre-existing failure carried
forward, not a wave-2 regression.

**Partial diagnosis performed** (what the sandbox permits):

- `playwright.config.ts` **does** define a `webServer` block running `npm run dev`
  against `http://localhost:5173` with a 120s timeout, so the earlier hypothesis
  that CI never starts the app is **wrong** and is recorded here as refuted.
- The dev server was started locally and verified serving: `curl` →
  **HTTP 200 in 0.027s**, Vite 8.0.16 ready in 551ms. The server side of the
  E2E setup is therefore not the failure.
- 57 spec files exist under `tests/`. Which of them fails, and why, cannot be
  determined without browsers or the CI log — the log/artifact endpoints
  redirect to `*.blob.core.windows.net`, which the sandbox proxy blocks.

**Next command required** (from a machine with browsers or unrestricted network):
`npx playwright test --reporter=line` locally, or download the
`playwright-report` artifact from run `30420688576`.

Consequence for this PR: the `react-router` 8.3.0 override (taken to clear the
CSRF advisory) is verified by `npm run build`, three green OS builds and 56/56
layout+App tests, **not** by an end-to-end navigation run. This is the single
largest unverified change in wave 2 and should be exercised before merge.

---

## COVERAGE EVIDENCE

**NOT OBTAINED.** A full `vitest run --coverage` was not executed. Three
suite-blocking hangs were removed (cubeMigration, SecretsVault, worker-pool
strand), which is a prerequisite, but the full-suite run has not been completed
end-to-end here. The README states this rather than quoting a number, and the
claim gate enforces that.

---

## README CORRECTIONS

Coverage badge deleted. Status changed to "Under remediation — NOT
production-ready". Corrected to measured values: workers 7 → **4**; stores 35 →
**38**; engines "202+" → **188** with the 105/181-unreferenced caveat; pages →
**195**; components → **284** (128 in `ui/`); hooks → **44**; test files →
**928**; LOC → **~380,000**; Vite 7.3 → **8.0**; Tailwind 4.1 → **4.3**.
"100% decimal.js" → measured 2-module adoption. "End-to-end encryption" → local
at-rest encryption with a per-install device key and its stated limits. WCAG
2.2 AA → design target, not CI-enforced. Real-time sync and collaborative
editing → explicitly **not shipped**.

---

## REMAINING BLOCKERS

1. **F-0016 server-side authorization** — client-only RBAC remains bypassable by
   a local user editing devtools state. The largest open security gap.
2. **F-0013 period close** — `PeriodCloseEngine` still orphaned; no period lock
   on any mutation path.
3. **F-0006 money migration** — 2 of 188 modules adopt `money.ts`; no
   `no-raw-float-money` lint rule; `docs/architecture/money.md` not written.
4. **F-0025 full-suite run** — three hangs fixed; a complete `vitest run` and
   coverage report have not been produced.
5. **F-0028 orphan engines** — 105/181 unreferenced; inventory not started.
6. **F-0024 CI half** — blocked on `workflows` token scope.
7. **Tauri build, E2E** — blocked on toolchain/browsers.
8. F-0029 (559 eslint-disable), F-0030 (agent dirs), F-0031 (PWA update flow),
   F-0035 (benchmark asserts), KAV-09/KAV-10, and the remaining mandatory docs.

---

## RESUBMISSION READINESS

**Not ready.** Blockers 1–5 are product gaps, not environment limits, and each
is a stated requirement of the directive.

---

## FINAL VERDICT

**UNACCEPTABLE — remediation continues.**

Wave 2 removed three suite-blocking hangs, eliminated every tautological
assertion and gated their return, made backups actually contain the user's data,
made 28 dead permissions reachable, stopped a formula engine from reporting
undefined quotients as zero, and removed hardcoded key material from a secrets
vault. That is real progress against the audit and it is not sufficient: no
gate may be waived, and F-0016, F-0013 and F-0006 remain open.

Per the directive's final rule — *if any gate fails, the project is not done* —
this build must not be described as production-ready.
