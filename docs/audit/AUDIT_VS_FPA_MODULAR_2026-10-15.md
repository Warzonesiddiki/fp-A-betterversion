# Audit: `fp-A-betterversion` measured against the `FPA-modular` spec set

**Date:** 2026-10-15 · **Base:** `04c329e` (`main`) · **Reference:** [Warzonesiddiki/FPA-modular](https://github.com/Warzonesiddiki/FPA-modular) @ HEAD (91 numbered specs, `MASTER_PLAN.md`, `AGENT_PROMPT.md`)
**Method:** everything below was measured on a fresh checkout in this session (commands in §9). Prior audit documents in this repo were treated as claims to verify, not as evidence.

---

## 0. Verdict in five lines

1. **The reference repo's `MASTER_PLAN.md` §1 is, in effect, a post-mortem of this codebase's lineage.** It names "attempt #2" (Tauri + Rust + React, 42 screens / 56 tables / 12 industry packs / README claiming feature-complete) and lists five killers: K1 scope before a spine, K2 incoherent sample data, K3 diverging contracts, K4 unverifiable native code, K5 "done" without evidence. **This repo still exhibits all five** (§2).
2. **The codebase is large and locally disciplined** — tsc and ESLint are clean, 13,337 unit tests pass, there is a correct `decimal.js` money primitive and a good set of ratchet scripts. None of that is in dispute.
3. **But the product does not form a working spine.** Data lives in Zustand blobs in a single KV table; the 35-table relational schema is unused; the Express server (auth/RBAC/period-close) has **zero** UI consumers; a production desktop build **cannot log in offline**; there is no drill-to-source-row, no atomic/idempotent import, no exception answer key, no PowerPoint export, no acceptance harness.
4. **The README is materially false on headline claims** (100% money safety → measured 28.9% adoption; 14,835 tests 100% green → 14 failing locally and CI red on `main` for every run since 20 Aug; "web UI on :5173" → blank page + `alert()` in a browser).
5. **Recommendation:** do **not** re-platform to Python (the reference's stack choice is about *their* constraints). Adopt the reference's **method** — spine-first, oracle-first, one source-of-truth per fact, evidence-or-not-done, cut line — and strangle this repo down to one month-end pipeline that provably works end to end before anything else is touched. The prioritised list is in §8.

---

## 1. Measured reality vs. README claims

| Claim (README hero / Getting Started) | Measured | Status |
| --- | --- | --- |
| "100% Money Safety" | `npm run money:adoption`: **282 / 976 modules = 28.89 %** on the primitive. The AST scanner reports "100 % safe" only because it counts *detected* unsafe ops, and the baseline is pinned at 0. Same README also says "88 of 255" four lines later — three different numbers in one document. | ❌ false |
| "14,835 Tests (100% Green)" | Local sharded run: **13,337 passed / 14 failed / 1 suite failed** (`PeriodClosePage.*` ×13, `smoke-tax-telecom-treasury-workforce` ×1). CI on `main`: **every `CI` run since 2026-08-20 is red**; last two took 6 h 05 m (E2E job has no `timeout-minutes`). | ❌ false |
| "182 Financial Engines Shipped" | 186 non-test engine files; manifest lists 182. **85 of them (46 %) are not imported by any page, component, store, hook, service or worker** — including `PeriodCloseEngine`, `ReconciliationEngine`, `AllocationRuleEngine`, `CashEngine`, `CapExEngine`, `WorkforceEngine`, `RollingForecastEngine`. "Shipped" = has a file and a unit test. | ⚠️ misleading |
| `npm run engines:verify` = "Engine manifest / reachability audit" | Script only checks that the generated manifest matches the file list. It does not check reachability. | ❌ false |
| "Run the dev server (web UI on http://localhost:5173)" | Browser gets `alert('…exclusively as a desktop app…')` and `return null` → blank page. `main.tsx` still registers a PWA service worker for that blocked browser. | ❌ false |
| `npm run check`, `npm run tsc` | Neither script exists in `package.json`. | ❌ false |
| "Fully offline, local-first" desktop | All routes sit behind `<ProtectedRoute>`. Production builds hard-refuse mock auth (`loginMock` throws when `PROD`). `loginReal` → `authClient.login()` → HTTP `VITE_API_URL`. Tauri config bundles **no sidecar** server. Onboarding does not authenticate. ⇒ **a shipped desktop binary cannot get past `/login` without a separately deployed Express server.** | ❌ false |
| "Server … Multi-user APIs, RBAC, period close, JWT auth" | Server exists and has 32 test files (1 failing). **0** non-test files under `src/store`, `src/pages`, `src/components` import `services/api`. The client never calls it. RBAC/period-close enforcement the UI uses is `rbacEnforcer.ts` — client-side only. | ⚠️ unwired |
| "data encrypted at rest" via Tauri SQLite | `tauriSqlStorage.ts` reads/writes one table: `stores(id, value)` — encrypted JSON blobs of whole Zustand stores. Of the 35 relational tables in `src-tauri/migrations`, **34 are never written by the app**; `gl_entries` appears in exactly one comment. `schema:equality` passes because it compares two schema *files*, not usage. | ⚠️ misleading |
| "Every number traceable" / drill-through | `GLEntry` (`src/types/index.ts:712`) has no `sourceFile`, `sourceRow`, `importBatchId`, or `fileHash`. Import pipeline has no file hash, no idempotency check, and `ImportResult.status: 'partial'` is a designed outcome (non-atomic). | ❌ false |
| "QuickBooks · NetSuite · Xero · Sage · Dynamics" integrations | Connector classes exist with real OAuth/HTTP code, but **no page, store or hook instantiates any of them** (`ConnectorRegistry` has 0 UI consumers). `DynamicsConnector` targets Dataverse CRM (`/accounts`, `/contacts`, `/invoices`), not F&O / Business Central GL, AP or TB. | ⚠️ unwired, wrong target |
| "Maintain 80%+ coverage" (per `docs:verify` note) | `vite.config.ts` coverage thresholds: **50 / 50 / 50 / 50**. Reference bar: ≥95 % core, ≥85 % overall. | ❌ |

---

## 2. The five killers (reference `MASTER_PLAN.md` §1) — status in this repo

### K1 — Scope explosion before a working spine · **PRESENT, severe**
- 490,904 LOC of TS/TSX · **242 `<Route>`s / 182 lazy routes** · 216 pages · 292 components · 46 Zustand stores · 186 engines · 9 workers · 18 sector dashboards · 14 templates · 8 i18n locales · PWA · Sentry · collaboration/WebSocket/presence · plugin engine · XBRL · MDX · option pricing · credit risk · ESG.
- The repo's own `CAPABILITY_TRUTH_MATRIX.md`: 227 routes, **0 CONNECTED, 0 GOVERNED, 0 ENTERPRISE-READY**; dispositions: 103 MIGRATE, 77 EXPERIMENTAL, 43 REVIEW (release-blocking), 4 RETAIN.
- The repo's own `.agent/repo_audit.md` already graded "193 routes / 203 pages — **D — STRANGLE** to ≤40 routes". That was 2026-08-20; routes have since grown to 242.
- Reference v1 scope: **19 screens**, one pipeline, one currency, no multi-user, no consolidation. This repo ships consolidation, multi-user, 18 verticals — and no end-to-end month-end.

### K2 — Incoherent / absent sample data · **PRESENT**
- No coherent sample company. No `answer_key`. No planted exceptions / controls. `grep -ri 'answer_key|planted'` → 0 files. Only CSV fixtures are two E2E files.
- `src/services/mockData/*` are fixture factories (the last 25 unsafe money ops live there). Prior audit notes "engine mocks still armed in some vertical engines (RealEstate occupancy placeholders, Construction 1.5× backlog) — loaded guns".
- Consequence: there is **no acceptance harness** and no way to state "recall N/N, controls 0/M" for anomaly/exception logic (`AnomalyDetectionEngine` has no oracle corpus).

### K3 — Contract divergence · **PRESENT**
- **Three schema homes, none authoritative:** `src-tauri/migrations` (35 tables, unused), server in-code DDL (10 tables), Zustand store shapes (42 persisted stores, the real data model). No data dictionary document is 1:1 with any of them.
- Money type divergence: domain types use `number` (`GLEntry.debit/credit/amount`), the primitive is `decimal.js`, the SQL schema is unused so no minor-units column exists, server uses decimal.js in 3 of 31 modules.
- No typed error catalogue (reference doc 22 ↔ `errors.py` equality test). Error strings are inline.
- 15+ competing plans of record: `MASTER_ROADMAP.md`, `docs/MASTER_PLAN.md`, `docs/MASTER_PLAN_259_GAPS.md`, `docs/MERGED_MASTER_PLAN.md`, `docs/ROADMAP.md`, `docs/1000X_ADVANTAGE_ROADMAP.md`, `docs/ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md`, `docs/CONSTITUTION_v5.md`, `FINAL_PROMPT.md`, `MASTER HANDOVER PROMPT.txt` (160 KB), `.agent/BLUEPRINT.md` (344 KB), `_bmad/*`, `agents/A1-A5-multi-agent-roadmap.md`, `reports/COUNCIL_ROADMAP.md`… The reference has exactly one (`00_INDEX.md` §5 "who wins on conflict").

### K4 — Unverifiable native code · **PRESENT (small surface, but real)**
- No `cargo`/`rustc` in the build sandbox; `src-tauri/src/*.rs` (838 LOC, 14 `#[test]`) cannot be compiled or tested here. CI `build.yml`/`release.yml` are the only place Tauri is exercised — and `main` CI is red.
- The Tauri runtime gate means **unit and E2E tests never run the real runtime**: E2E injects a fake `window.__TAURI_INTERNALS__ = {}` shim (`tests/e2e/_helpers/spine.ts`). The `plugin-sql` path (`tauriSqlStorage`) is therefore untested end to end.

### K5 — "Done" without evidence · **PRESENT**
- README headline claims (§1) are unverified or false. `docs:verify` checks engine/store/worker counts and one coverage sentence — it does not check "100 % money safety", "100 % green", "offline", or "traceable".
- 85 engines with tests but no callers = *tested, not done*.
- 8 "security" services with full test suites and **zero runtime consumers**: `CsrfProtection`, `SecurityHeaders`, `RateLimiter`, `CircuitBreaker`, `SecretRotation`, `IncidentResponse`, `ThreatModel`, `SecretsVault`, `PIIRedactor` (client-side implementations of server concerns — security theatre).
- CI gates were "delivered" as `ci-patches/*.patch` for a human to apply; 0008/0009 still apply cleanly (never landed). The folder's own README calls these `config_written_but_not_enforced`.
- `RELEASE_CHECKLIST.md`, `PROGRESS_TRACKER.html`, `KANBAN.json`, `compliance-evidence.json`, `remediation-ledger.json` — multiple status artefacts, none generated from the gate table.

---

## 3. Reference non-negotiables (`AGENT_PROMPT.md` §5) — pass/fail

| # | Non-negotiable | This repo | Evidence |
| --- | --- | --- | --- |
| 1 | Money is integer minor units / Decimal via one module; `float` touching money is a defect | **FAIL** | Core domain types are `number`; 71 % of financial modules bypass the primitive; persisted JSON stores floats. |
| 2 | Every number drills to source transaction + file + row | **FAIL** | No provenance fields; one drill-down component in `reports/`. |
| 3 | Nothing silently discarded (rejected rows counted and explained) | **PARTIAL** | `GLImportService` reports `skippedRows` count only; no per-row reason / quarantine table. |
| 4 | Atomic, idempotent imports | **FAIL** | No file hash, no batch id, `'partial'` status exists. |
| 5 | Deterministic: inject clocks and seeds | **FAIL** | **339** `Date.now()`/`new Date()` call sites inside `src/engines` (non-test). `SafeMathParser` exposes `RAND()`/`RANDBETWEEN()` on `Math.random`. Today's 13 `PeriodClosePage` failures are literally a hard-coded "August 2026 is the current period". |
| 6 | Plain language; findings are "potential exceptions" | PASS (grep) | 0 user-facing "fraud" strings. |
| 7 | Colour never the only signal | **UNVERIFIED / likely FAIL** | 611 inline hex colours in `src/pages`; a11y gate exists but is route-sampled. |
| 8 | Docs are the source of truth, one owner per fact | **FAIL** | §2 K3. |
| 9 | Evidence or it did not happen; release-blocking harness | **FAIL** | No acceptance harness; CI red; README claims unbacked. |
| 10 | Scope is the work plan; ideas go to backlog | **FAIL** | §2 K1. |
| 11 | Small, reversible, sequenced; one item per commit | **FAIL** | History is "session N / wave N" mega-commits. |
| 12 | No gold-plating | **FAIL** | §2 K1. |

---

## 4. Architecture gaps vs. reference `04_TECHNICAL_ARCHITECTURE.md`

| Reference principle | This repo |
| --- | --- |
| **One spine** (`services/month_end`) orchestrating import → store → calc → rules → forecast → exports | No orchestrator. Each page reads a Zustand store directly; "period close" page composes `glStore` + `budgetStore` + `PeriodCloseStateMachine` + `FinancialCloseEngine` inline. |
| **One owner per concern**; exports never recompute | `exportExcel`, `AdvancedExcelEngine`, `ProfessionalExportEngine`, `AdvancedPDFEngine`, `report-builder-export` — five export engines, four of them runtime-dead. Two `ReportScheduler*Engine`s, two `SmartImportMapp*` modules, two sensitivity engines. |
| **One store**, one file per project, relational tables, money as INTEGER minor units | One KV table of encrypted JSON blobs; relational schema dead; floats. |
| UI never touches DB or computes money; thin transport layer | UI *is* the database (Zustand + persist). Pages compute money (71 % bypass). |
| Dependency rule: transport → services → engine → store/core; circular import = build failure | `docs/audit/dependency-cycles.md` exists (cycles acknowledged); no import-linter gate. |
| Technology budget ≤ 12 runtime deps, pinned, licence-checked | 38 runtime deps + optional `@huggingface/transformers`; 17 `overrides`; `license:check` is "best-effort" and passes when `npm ls` fails. |
| Offline-first: zero telemetry, network only via two allow-listed edges | Sentry (`@sentry/react`) + replay in the runtime bundle; PWA SW; `WebSocketManager`/`PresenceService` wired in 4–5 runtime files; connectors (unwired) hit arbitrary hosts; no egress chokepoint (the repo's own W0.6 item, still open). |
| 5-state screens (loading/empty/error/stale/ready) on every fetching component | Partially present ("K30" tests) on a handful of pages; not systematic. |

---

## 5. Functional gaps vs. the reference month-end spine (`01_PRD`, `MASTER_PLAN` §2.1)

| Spine step | Reference v1 requirement | This repo |
| --- | --- | --- |
| 1 Get the month in | D365 F&O / BC **read-only pull** (OData/BC API, msal) producing a snapshot file + CSV/XLSX drop with saved mapping profiles | CSV import exists (`GLImportService`, `SmartImportMapper`). D365 connector is Dataverse CRM, unwired. No snapshot-as-file pattern. |
| 2 Validate | Profile → map → validate → **quarantine with reasons** → control totals → TB tie-out, atomic commit | Column mapping + validation; no quarantine table, no control totals, non-atomic. |
| 3 Statements, BvA, KPIs | P&L / BS / CF at lowest shared grain, variance bridge, KPI dictionary with oracles | Present and **oracle-tested** (`financialStatementOracles.test.ts`, KAV articulation tests) — this is the strongest part of the repo. BvA page exists. |
| 4 Exceptions | **28 catalogued rules**, canonical finding key, owner inbox, due date, **suggested fix on every finding**, ERP rectification journal file, waive-with-reason | `AnomalyDetectionEngine` + `AnomalyExplainer` (unwired), 1 "suggestedFix" string. No catalogue, no key format, no inbox, no journal export. |
| 5 Close | Checklist over real stage records, reconciliations, soft/hard/locked | `PeriodClosePage` has checklist + state machine (client-side, local blob). Bank reconciliation page exists; no GL↔sub-ledger reconciliations. 13 of its tests currently fail. |
| 6 Forecast | Rolling forecast, method per account group, **backtested**, Base/Upside/Downside | Forecast engines exist; `RollingForecastEngine` is runtime-dead; `grep backtest` → 0. |
| 7 Board pack | **Excel + PowerPoint + PDF**, cross-tied (API == Excel == PPT == PDF, 100 % of figures) | Excel (`exceljs`) and PDF (`jspdf`). **No PowerPoint export** (no `pptxgenjs`/equivalent). No cross-artifact tie-out test. |
| 8 AI (optional, off) | Drafts text around verified numbers; guardrail rejects any number not in payload | AI copilot/NLQ/commentary exist; no "number-not-in-payload" guardrail test found; egress not chokepointed. |
| Traceability | Voucher → source file + row from every figure | Absent (§3 #2). |

---

## 6. Engineering hygiene

### 6.1 Build & CI
- `tsc --noEmit` ✅ clean (42 s). `eslint src --max-warnings 0` ✅ clean (2 m 13 s). Vite build ✅ (per CI).
- **Unit tests: 14 failing + 1 failed suite locally; CI red on `main` every run since 20 Aug.** Failures: (a) `PeriodClosePage.{test,a11y.test,money.test}.tsx` — hard-coded "today = 2026-08-07 / August 2026" (clock not injected); (b) `smoke-tax-telecom-treasury-workforce.test.tsx` — stale hand-written `lucide-react` mock missing `Inbox` (the exact class of rot `scripts/test-sharded.mjs`'s own header warns about).
- Server: `npm test` → **1 failed / 31 passed** files (`audit.batch.test.ts` prune cutoff — likely also clock-relative).
- E2E job: no `timeout-minutes` → 6 h default → two 6 h 05 m red runs. Playwright `webServer` runs `npm run dev` against a Tauri-gated app with a shim.
- `ci-patches/0008`, `0009` (Node 26 bump) never applied. `.github/workflows` edits are blocked for the agent — a human must own CI.
- Pre-push hook runs **18** separate npm/node commands (147 lines); pre-commit 55 lines. Expensive and easy to `--no-verify`.
- `npm test` asks for an 8 GB heap; machines with less either thrash or skip (acknowledged in `test-sharded.mjs`).

### 6.2 Dependencies & security
- `npm audit --omit=dev` root: **3 high** (`axios` ≤1.19.0, `brace-expansion`, `browserslist`), 1 moderate, 1 low. Server: **1 critical** (`proxy-addr` IP spoofing), 4 moderate (`qs`, express chain). CI "Dependency Audit" job passed on 30 Aug — advisories are newer; the gate is `--audit-level=high` and would now fail.
- 17 `overrides` in root `package.json` pinning transitive deps — fragile.
- Mock auth is forced on in the vitest env (`VITE_USE_MOCK_AUTH: 'true'`), so auth tests never exercise the real path.
- Sentry replay in a GL application (masking added per F-0022, but telemetry contradicts "zero telemetry / offline").

### 6.3 Repository hygiene
- **3,419 tracked files; 62 at the root; 464 Markdown files (6.2 MB); 252 files with audit/handover/gap/plan/roadmap/prompt/session/ledger/tracker in the name.**
- Agent scaffolding and tool residue committed: `.agent/` (34), `.codex/` (5), `_bmad/` (98), `MEMORY/` (50), `agents/` (41), `prompt/` (18), `skills/`, `.market-acquire/` (72, incl. PowerShell install logs), `.market-catalog.json` (256 KB), `MASTER HANDOVER PROMPT.txt` (160 KB), `coverage.txt`, `PROGRESS_TRACKER.html`, `finplan-ceo-remediation-status.html`, `PR43-BODY.md`, `pr48-body.md`, `presentations/`, `reports/` (58).
- `src-tauri/gen/schemas/*.json` (3 × 150–430 KB generated files) tracked.
- `repo:hygiene` passes because it only checks that tracked files aren't git-ignored — it has no opinion on any of the above.
- Dead runtime features: PWA service worker (browser blocked), 8 security services, 85 engines, 4 of 5 export engines, connectors, `src/plugins`, `src/wasm`, `src/sdk/gl/GlCommitNamespace` (references `gl_entries.version` that nothing writes).

### 6.4 Code quality (non-test `src`)
- 18 TODO/FIXME · 42 `eslint-disable` · 47 `as unknown as` in financial paths (ratchet baseline 116, so improving) · 13 `console.log` · 30 files touching `localStorage` directly · 69 `Math.random` (some intentional/seeded) · 89 `parseFloat`/`toFixed` sites.
- `docs/audit/dependency-cycles.md` — cycles acknowledged, not gated.

---

## 7. What is genuinely good (keep)

- `src/utils/money.ts` (decimal.js, ROUND_HALF_UP, `InvalidMoneyError`) and the `*.money.test.ts` convention.
- Oracle-style tests: `financialStatementOracles.test.ts`, KAV articulation/GL-invariant property tests, consolidation integration tests.
- Ratchet scripts (`money:ast`, `fabrication:audit`, `type-safety:ratchet`, `persistence:map`, `escape:ledger`) — the *mechanism* is right; the baselines and scope need to become absolute bars.
- `PeriodCloseStateMachine`, `FinancialCloseEngine`, `AnomalyDetectionEngine`, consolidation/FX/revrec/lease/tax engines — real domain logic worth keeping behind a spine.
- `docs/architecture/*`, `docs/adr/*`, `docs/security/*` — decent individual documents; the problem is there is no index saying which one wins.
- Server tenancy work (`tenancy.ts`, `gl.tenancy.test.ts`) and SHA-pinned actions.

---

## 8. Everything that needs to be done — prioritised

Severity: **P0** = the product is not what it claims / cannot be used · **P1** = reference non-negotiable violated · **P2** = hygiene & debt. Each item names the reference section that defines "done".

### P0 — Make the claims true or remove them (this week)
1. **Fix `main` CI to green and keep it there.** Repair the 13 `PeriodClosePage` tests (inject a clock; never hard-code "today"), regenerate the `lucide-react` mock from the real export list, fix `server/audit.batch.test.ts`, add `timeout-minutes: 30` to the E2E job (human must apply — workflows are agent-blocked), apply `ci-patches/0008–0009` or delete them. *(ref 14 §5, 15 §4)*
2. **Rewrite the README from measurements only.** Remove "100 % Money Safety", "14,835 (100 % Green)", "web UI on :5173", `npm run check/tsc`, "fully offline", "182 engines shipped", integrations list. Extend `verify-readme-stats.mjs` to assert every numeric claim and to fail on words like "100 %" without a generating script. *(ref 00_INDEX §5, 14 §6)*
3. **Decide the auth/offline contradiction and implement it.** Either (a) local-first: a local credential/profile (no server) unlocks the desktop app, server is optional sync; or (b) bundle the Express server as a Tauri sidecar. Today a production desktop build cannot log in. Record as an ADR. *(ref 04 §1, 12 §1)*
4. **Declare one source of truth and archive the rest.** Keep one plan (`docs/MASTER_PLAN.md`), one index with a "who wins on conflict" table, one changelog, one status ledger. Move everything else under `archive/` (or delete; it's in git history): all `HANDOVER_PROMPT_*`, `AUDIT_*`, `GAP_LEDGER`, `FINAL_PROMPT`, `MASTER HANDOVER PROMPT.txt`, `.agent/`, `.codex/`, `_bmad/`, `MEMORY/`, `agents/`, `prompt/`, `skills/`, `.market-acquire/`, `.market-catalog.json`, `reports/`, `presentations/`, `coverage.txt`, `*.html` trackers, `PR*-body.md`, `KANBAN.json`. *(ref 00_INDEX §4–§5, 70)*
5. **Patch the dependency advisories**: `axios`, `brace-expansion`, `browserslist` (root); `proxy-addr`/`express` chain (server). Re-run `audit:prod` in CI. *(ref 12)*

### P1 — Build the spine the reference describes (next 4–8 weeks; nothing else ships meanwhile)
6. **Pick and freeze the v1 scope = one month-end pipeline, ≤ 40 routes.** Write the cut line. Everything else (18 verticals, consolidation, collaboration, plugins, XBRL, MDX, options, credit risk, ESG, PWA, marketplace, 7 extra locales) goes behind a feature flag or into `archive/` until the spine is green. The repo's own `repo_audit.md` already decided this (W0.5); execute it. *(ref MASTER_PLAN §2.3, §8)*
7. **Data model: one relational store, money as integer minor units.** Make `src-tauri/migrations` (or sql.js in dev) the real store for `gl_entries`, `import_batches`, `quarantine_rows`, `findings`, `periods`, `adjustments`. Add `import_batch_id`, `source_file_sha256`, `source_row` to every GL row. Stop persisting financial data as Zustand JSON blobs (keep Zustand for UI state only). Write a data dictionary doc and a **table-and-column equality test** against the live schema. *(ref 02, 04 §2, 24, 61)*
8. **Atomic, idempotent import with quarantine.** All-or-nothing commit; same file hash → `no_change`; every rejected row persisted with a reason code; control totals and TB tie-out before commit; `'partial'` status removed. *(ref 06, non-negotiables 3–4)*
9. **Exception rules as a catalogue with an answer key.** Write the rule catalogue (name, grain, threshold, severity, canonical key `EXC-nnn|entity|account|period|grain`, suggested-fix template). Generate a **coherent sample company** from one plan with planted exceptions and controls; build `scripts/acceptance.mjs` that runs twice and asserts recall N/N, controls 0/M, run-to-run identical. Make it release-blocking. *(ref 07, 42, 44, 14 §3, MASTER_PLAN §5–§6)*
10. **Determinism sweep.** Inject `clock`/`rng` into every engine; ban `Date.now()`/`new Date()`/`Math.random` in `src/engines` via an ESLint rule with an explicit allow-list (seeded Monte Carlo). Remove `RAND`/`RANDBETWEEN` from the formula parser or seed them. *(ref 15 §1, non-negotiable 5)*
11. **Money: from ratchet to bar.** Change `GLEntry`/`TrialBalanceRow`/budget/forecast line types from `number` to a `Money` (minor-unit integer or decimal string) type; raise `money:adoption` from a 209-baseline ratchet to a hard 100 % bar on `src/engines`, `src/store`, `server/src`; move `src/services/mockData` to `tests/fixtures`. *(ref 04 §2, 15 §1)*
12. **Wire or delete.** For each of the 85 runtime-dead engines, 8 dead security services, 5 export engines, connectors, `src/plugins`, `src/wasm`, PWA: either a page/service imports it on the spine path, or it moves to `archive/`. Add a reachability check to `engines:verify` so "shipped" means reachable. *(ref 14 §6 "no mock-only path", 15 §6)*
13. **Server: decide its role.** If the desktop is local-first, the server is either removed from v1 or becomes an optional sync target with a real client — not an unreachable second implementation of RBAC and period-close. Today it is a parallel product. *(ref 04 §1, MASTER_PLAN §2.3)*
14. **Exports: PowerPoint + cross-artifact tie-out.** Add a PPT deck (board pack) and a test that asserts UI value == Excel cell == PPT text == PDF text for a golden period. Collapse five export engines to one that consumes calc objects and never recomputes. *(ref 09, 10, 14 §3)*
15. **Error catalogue.** Typed error codes (`FPA-ERR-nnn`) in one module, a doc that mirrors it, and an equality test. Replace inline error strings on the spine. *(ref 22)*
16. **Egress chokepoint.** One `transport` module with a host allow-list; Sentry/replay off by default; remove the browser PWA. Add a test that, with AI and connectors disabled, zero network calls occur. *(ref 12 §1(d), 14 §3 "AI-off = zero network")*
17. **Coverage & gates as absolute numbers.** `core/engines ≥ 95 %`, overall ≥ 85 %; one `scripts/check.mjs` that runs tsc + eslint + vitest + money + fabrication + schema + docs + acceptance with an honest exit code and **no skip flags**; make pre-push just call it. *(ref 14 §5)*

### P2 — Debt & hygiene (continuous)
18. Replace the four E2E "shim Tauri" suites with at least one real `tauri-driver` run in CI (K4).
19. Un-track generated files (`src-tauri/gen/schemas/*.json`), move visual-regression PNGs to LFS or regenerate in CI.
20. Reduce 17 `package.json` overrides by upgrading the offending direct deps.
21. Remove `eslint-disable` (42), `console.log` (13), TODO (18) on spine paths; make `license:check` fail when it cannot verify.
22. Colour-only-signal audit of the 611 inline hex sites on spine screens; keep axe gate blocking.
23. Collapse duplicate modules: `ReportSchedulerEngine`/`ReportSchedulingEngine`, `SmartImportMapper`/`SmartImportMapping`, `SensitivityEngine`/`SensitivityTableEngine`, `AuditEngine`/`AuditTrailEngine`/`AuditLogEngine`.
24. Add an import-linter equivalent (e.g. `dependency-cruiser`) so the acknowledged cycles become a build failure.
25. Adopt the reference's commit discipline: one work item per commit with a handover block (tests run, mutations, spec checks) in a single ledger file.

---

## 9. Commands run (reproducibility)

```
git clone --depth 1 https://github.com/Warzonesiddiki/FPA-modular /tmp/FPA-modular
npm ci --ignore-scripts                            # 837 packages
node node_modules/typescript/bin/tsc --noEmit      # exit 0, 42 s
node node_modules/eslint/bin/eslint.js src --max-warnings 0   # exit 0, 2 m 13 s
node scripts/test-sharded.mjs --shards=8 --workers=1 --heap=2200
#   → 5/8 shards passed; 13,337 passed / 14 failed / 1 failed suite; 1,657 s
cd server && npm ci && npm test                    # 1 failed / 31 passed files
npm run docs:verify engines:verify money:ast fabrication:audit schema:equality \
        persistence:map routemap:check escape:ledger repo:hygiene \
        architecture:guardrails money:adoption type-safety:ratchet license:check
npm audit --omit=dev --json  (root and server/)
gh run list --branch main --workflow ci.yml --limit 5   # all failure
gh run view 33286707208                                  # per-job status
vite --host 0.0.0.0 --port 5173 ; curl -s localhost:5173 # 200, app renders null + alert()
```
Reachability scan: for each `src/engines/*.ts`, `grep -rlw <Name> src/{pages,components,store,hooks,services,workers,api,sdk,context} src/App.tsx` excluding tests → 85 of 186 with zero hits.
