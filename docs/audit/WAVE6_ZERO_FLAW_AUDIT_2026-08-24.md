# Wave-6 Zero-Flaw Audit — All-Domain, 30 Lanes (2026-08-24)

> **Mission lens:** owner directive — one-stop ALL-INDUSTRY FP&A, zero compromises, zero flaws.
> **Method:** 30 read-only audit subagents fanned out in three orchestration passes (main 19 + retry 5 + recovery 6 = **30/30 lanes reported**). Schema-structured findings; every finding carries file:line witnesses read by the auditing agent.
> **Raw evidence:** `reports/WAVE6_WORKFLOW_RAW_2026-08-24.txt` (pass-1 archive; passes 2–3 returns summarized below). Ledger record: `_bmad/reasoning-ledger.md` Entry #38.
> **Honest labeling (D-007):** `docs-truth` lane reported in pass 1 with no P0/P1 entering the register, but its detail was lost to output-spill truncation; a solo re-run lane is in flight and will be appended. Nothing in this report is fabricated; UNVERIFIED items are marked.

## Headline

| Severity | Count (raw) | Unique |
|---|---|---|
| **P0** | 17 | **16** (sandbox escape found twice) |
| **P1** | 99 | 99 |
| **P2** | 62 | 62 |

## P0 Register (the flaws that cannot ship)

| ID | Lane | Finding | Evidence anchor | Fix direction |
|---|---|---|---|---|
| W6-P0-01 | workers | batch-calc formula evaluator **silently zeroes every result** under shipped Tauri CSP (`new Function` blocked; `catch {return 0}`) | `batch-calc.worker.ts:173-182`; `tauri.conf.json:26` | CSP-safe tokenizer/parser + error channel instead of silent 0 |
| W6-P0-02 | plugins + security | PluginSandbox FORBIDDEN_PROPERTIES check bypassed by computed keys (`String.fromCharCode`-built `"constructor"`) → real `Function` constructor reach for marketplace code | `PluginSandbox.ts:744-787` | reject non-literal computed member keys; fromCharCode regression tests |
| W6-P0-03 | plugins | Documented sandbox control **not wired** into any execution path — loader runs plugin factories unsandboxed while docs claim hardened sandbox | plugins loader path | wire validator into loader, or de-advertise (owner call) |
| W6-P0-04 | utils/storage | Raw storage backends swallow every error → masterStorage fail-closed read/quota/corruption architecture is dead code | masterStorage/safeJSONStorage paths | typed error propagation through wrapper chain |
| W6-P0-05 | utils/storage | Encryption key stored beside data, auto-rotates on corruption, no escrow → WebView reset/reinstall **permanently destroys all encrypted financial history** | encryption utils | exportable/recoverable key flow — **OWNER DECISION** |
| W6-P0-06 | config/sectors | Dashboard sector KPI tiles always render $0 (no sector sets `accountCodes`; percent KPIs force-formatted as currency) | sector config ↔ dashboard wiring | populate accountCodes + unit-aware formatter |
| W6-P0-07 | tauri | Native File/View/Tools menu is **inert end-to-end** in the packaged desktop app | menu handler bindings | bind commands or remove menu |
| W6-P0-08 | a11y/ui | Shipped ConfirmDialog mounted nowhere; exported `confirm.*` API deadlocks on first use; single-resolve store hangs concurrent callers forever | `ConfirmDialog.tsx:29-45` | mount provider + queue pending confirms |
| W6-P0-09 | data-io | GL import persists unusable dates and garbage periods — no date parsing/validation on the live wizard path | GL import wizard | strict parse + derived period validation |
| W6-P0-10 | data-io | `parseFloat` coercion silently truncates comma-formatted amounts ("1,234.56" → 1) — wrong financial output | import coercion path | locale-aware numeric parser |
| W6-P0-11 | collab/locking | Undo/redo and `updateLineItem` bypass the period hard-lock freeze on budget lines | budget line mutators | enforce lock at the mutation chokepoint |
| W6-P0-12 | components | ReportGrid colors negative metrics **GREEN** (sign detected from rendered string; minus-sign negatives never red); off-palette shades | `ReportGrid.tsx:158-162` | color from raw values + #16A34A/#DC2626 tokens |
| W6-P0-13 | server | GL publish-to-server targets fictional `https://api.finplanpro.dev/v1` with empty bearer — the real Express backend receives zero traffic | sdk `DEFAULT_BASE_URL`; `GlCommitNamespace.ts:115,180` | point client at env origin; wire authStore token |
| W6-P0-14 | security | dataStore GL-account/import mutators have **zero RBAC enforcement** (deleteAccount destroys master data unchecked) | `dataStore.ts` imports/mutators | `enforce()` guards + rbac-matrix completeness test |
| W6-P0-15 | templates | Cascade formula DSL mismatch silently kills headline template rules (`prev`, `labor_rate`, `production_volume` unresolved; catch falls back to current value) | `DriverCascadeEngine.ts:610-627`; `ThreeStatementModel.ts:462`; `ManufacturingCOGS.ts:408-475` | align tokens + sentinel-evaluation validation pass over all templates |
| W6-P0-16 | engines | IRR/XIRR **silently return garbage**: non-convergence returns last iterate; `IRR([])`/single-flow return 0.1 guess; all-positive flows diverge to huge finite numbers | `financial.ts:47-65,106-127` | sign-change precondition + bracketing/bisection + NaN-or-throw contract |

## P1 Landscape (99 findings, clustered)

| Cluster | ~# | Representatives |
|---|---|---|
| Render performance | 8 | 200 selector-less store subscriptions (124 on hot GL store); DashboardPage discarded O(n) aggregation per render; heavy Decimal math on main thread while workers sit unwired |
| Worker protocol | 5 | consolidation counts but never applies auto-detected IC eliminations; progress reporting dead end-to-end (constant ids vs task-id filter); no payload validation; `terminate()` strands tasks |
| State/persistence | 5 | periodCloseStore off-canonical stack; migration story nominal (32/39 identity migrates; 2 stores version-without-migrate); safeJSONStorage defeats fail-closed contract |
| Integration truth | 9 | WS never resubscribes/re-authenticates; non-idempotent POST auto-retry (duplicate records); crdtSync wipes pendingOps without ack; ERP write-back rollback is a no-op; no AbortController anywhere; `loginReal()` permanent throw; axios layer orphaned |
| Security/RBAC | 7 | setUser permissions-array injection; vault accepts ANY password; capability ACL blocks own notification/shortcut APIs; no updater configured while lib.rs claims registered; react-router ^8 cross-major override |
| Desktop/Tauri | 3 | secure-storage stack (keyring + SecretsVault) zero production wiring; F-DESK-006 unimplemented despite docs |
| Data I/O | 8 | formula injection in shipped DataGrid export writers; CSV import structurally truncated to 20 rows; AdvancedExcelEngine emits invalid .xlsx; password-export ignores password; sql.js rewrites entire DB per setItem |
| PWA/offline | 5 | `navigator.storage.persist()` never called (eviction exposure for whole dataset); precache excludes chart/grid/excel/pdf vendors; update machinery dead; browser hard-block contradicts shipped PWA manifest |
| Accessibility | 10 | stacked-dialog Escape closes all layers; DataGrid column menu ARIA roles without keyboard support; FileDropZone SR-invisible errors + 2.77:1 contrast; Toast nesting forces assertive interrupts; Modal lacks portal/scroll-lock |
| Gates/CI | 12 | bundle-check.js TDZ crash on its own warn/fail paths; CI summary prints PASSED with failing E2E; husky pre-push matches docs on neither count nor timeouts; Node 20 workflows vs Node-22 mandate; ungated Pages deploy races release.yml; ESLint untyped preset; test files type-checked by no gate |
| Coverage gaps | 6 | useRollingForecast zero tests; entire src/templates zero tests; e2e pageerror guard vacuous; phantom USER_JOURNEY_TEST_COVERAGE.md cited 31×; orphaned e2e/ dir; 14 UI files >300 lines |
| Industry/mission coverage | 15 | No Professional Services & Nonprofit sector configs; percent-unit convention conflict (100× misrender class); USD hardcoded across 15 sectors; stale fiscalYearStart 2024-01-01; engines missing nonprofit fund accounting, job costing, dedicated deferred revenue; insurance template stranded in split-brain registries; hospitality/logistics/agriculture/telecom templates absent; ERP connectors advertised with no backing dependency; warehouse ingestion absent beyond sql.js; enterprise RBAC/SSO shallow; AI forecasting rests on one optional uninstalled peer dep; no SOC2/ISO/GDPR evidence |
| i18n | 3 | hardcoded English strings in SOXCompliancePage/GLJournalsPage defeat 8-locale layer; Arabic shipped with zero RTL wiring |

## What is SOUND (verified healthy — do not regress)

- **Money layer:** exact Decimal math, ROUND_HALF_UP, divide-by-zero throws (`utils/money.ts`); MACRS tables sum to 100% half-year; SYD/SL exact-sum invariants.
- **Express backend:** helmet CSP, zod validation, bcrypt + rotating sha256 refresh tokens with reuse detection, parameterized SQL throughout, 34 test files, no committed secrets.
- **Routing core:** all 181 lazy imports resolve; 228 paths, 0 duplicates; Suspense + ErrorBoundary on every route.
- **Persistence hygiene:** persist names 41/41 unique; canonical middleware order in 40/42 persisting stores.
- **Test posture:** engines colocated-test ratio 148% (316/214); core NPV/IRR/XIRR/Consolidation suites exist; 0 `.only/.todo/.fixme`.
- **Secrets:** git tracks only empty `.env.example` templates; no private-key material in tree.
- **i18n parity:** en/ar 320=320 leaf keys, 0 missing.
- **Button primitive:** clean (tokens, forwardRef, native semantics).

## OWNER DECISIONS REQUIRED (product-level tradeoffs, flagged not decided)

1. **Encryption key escrow/recovery UX** (W6-P0-05): convenience-vs-data-loss tradeoff needs an owner ruling before implementation.
2. **Plugin marketplace honesty** (W6-P0-03): wire the sandbox into the loader, or pull marketplace claims until evidence justifies them (path-lock forbids autonomy expansion ahead of research).
3. **Server integration truth** (W6-P0-13): implement the frontend auth/API client against the existing Express server now, OR label `server/` as not-yet-integrated in AGENTS.md so no doc implies it is live.
4. **Browser/PWA story**: App.tsx hard-blocks browsers while shipping an installable offline-first PWA manifest — exactly one surface story must survive.
5. **Desktop updater channel**: configure the Tauri updater or remove the false lib.rs registration claim.

## Wave-7 Fix Program (queued on board)

- **7A Wrong-numbers batch:** P0-01, 06, 09, 10, 11, 12, 15, 16 (+ consolidation elimination-apply P1). Every fix lands with a failing-test-first regression.
- **7B Security batch:** P0-02, 03*, 04, 14 (+ setUser derivation, vault unlock check, router override alignment). (*pending owner call)
- **7C Integration-truth batch:** P0-13 + auth client decision implementation + storage error surfacing + key escrow (per owner).
- **7D Product-surface batch:** P0-05*, 07, 08 (+ KPI units, fiscal-calendar linkage).
- Gate per batch: `tsc --noEmit → lint → vitest → build` all green before merge; D-002 three-witnesses in commit messages.

## Method notes (for future waves)

Schema-validated structured output failed on 11/30 pass-1 agents — concentrated in large-inventory lanes (engines glob 530 paths, ui 252 paths). Narrowed scopes plus a plain-text JSON-parse fallback recovered 6/6 in pass 3. Future audits: cap inventory lanes' read budgets up front and demand the JSON-only final message.
