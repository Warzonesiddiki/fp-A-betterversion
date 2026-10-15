# Audit Progress — 2026-10-15

**Status:** Target checks executed on 2026-10-15 (this document updated in place; see "Target — executed"). Full detail: [`../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`](../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md).  
**Target checkout:** `fp-A-betterversion`, `main`, `04c329e0678e34b712f77ee97e0d536050d18e6a` (2026-08-30).  
**Reference checkout:** `FPA-modular`, `main`, `641d3d8305730da7b580ec0461a183d70f5a78bf` (2026-10-15).  
Both repositories were shallow-cloned at the visible HEAD. Therefore local `git rev-list --count` reports 1 for each and is **not a valid total-history count**. The public GitHub pages displayed 1,395 target commits and 53 reference commits at inspection; counts are not a quality measure.

## Important correction

The original prompt assigned the stacks backwards. Evidence inspected so far:

- Target is the established **TypeScript/React/Vite/Tauri** application `FinPlan Pro`; `package.json` has scripts for TypeScript, ESLint, Vite, Vitest, Playwright, Tauri and custom financial/data truth gates.
- Reference is the **Python** project `FPA-modular`; its README describes Python 3.11+, a frozen core, and M0/spec hardening.
- Target is not simply “Python M0 with 9 tests.” Its README advertises a broad desktop FP&A application and a much larger test corpus. Its claims need runtime verification.
- Reference is not an established 1,395-commit benchmark on the public page inspected. The page showed 53 commits. However, the local reference test command did run successfully as recorded below.

The product owner should confirm whether the target application remains the product of record, whether a Python rewrite is intended, and whether the immediate product priority is a D365 GL month-end review workflow. No migration decision should be inferred.

## Tests executed

### Reference

Command: `python -m pytest -q` from the shallow-cloned reference checkout.  
Result: **1,033 passed in 21.82s** (2026-10-15 environment). This includes substantial documentation/API contract tests in addition to application unit and integration tests. This is a single run in this environment, not proof of production readiness or a full test-history claim.

### Target — executed (2026-10-15, branch `arena/48b4e481-fp-a-betterversion`, base `04c329e`)

Environment: Node v22.22.3, npm 10.9.8, 2 vCPU / 3.8 GB RAM, no Rust toolchain (Tauri shell not compiled). Dependencies installed from the lockfile (`npm ci --ignore-scripts`, 837 packages; `server/`: 187).

| Check | Command | Result at `04c329e` | Label |
|---|---|---|---|
| Type check | `tsc --noEmit` | exit 0 (42 s) | Verified |
| Lint | `eslint src --max-warnings 0` | exit 0 (2 m 13 s) | Verified |
| Unit tests (frontend) | `node scripts/test-sharded.mjs --shards=8 --workers=1 --heap=2200` | **13,337 passed / 14 failed / 1 failed suite**; 5 of 8 shards green; 1,657 s | Verified |
| Unit tests (server) | `cd server && npm test` | **1 failed / 31 passed** files (`routes/audit.batch.test.ts`) | Verified |
| CI on `main` | `gh run list --workflow ci.yml --branch main` | every run since 2026-08-20 failed; last two ran 6 h 05 m (E2E job has no `timeout-minutes`) | Verified |
| Money adoption | `npm run money:adoption` | 282 / 976 financial modules = 28.89 % | Verified |
| Money AST ratchet | `npm run money:ast` | 0 detected unsafe ops (baseline pinned at 0; scanner scope-limited) | Verified |
| Fabrication scan | `npm run fabrication:audit` | 0 findings (the repo's own notes list classes the scanner cannot see) | Verified |
| Docs truth | `npm run docs:verify` | passed — but checked only engine/store/worker counts; did not check "100 % money safety", "100 % green", "offline" | Verified |
| Engine reachability | independent scan + corrected `verify-readme-stats.mjs` | 182 engine modules; **95 reachable, 87 orphans** (no page/store/service caller). The shipped script reported 0 orphans because it counted the barrel and the generated manifest as consumers | Verified |
| Prod dependency audit | `npm audit --omit=dev` (root / server) | root 3 high + 1 moderate + 1 low; server **1 critical** (`proxy-addr`) + 4 moderate | Verified |
| Browser run | `vite --host 0.0.0.0`; `curl localhost:5173` | HTTP 200; `App` fires `alert()` and renders `null` (desktop-only gate) | Verified |

Failure causes (all Verified by reading the failing assertion):
- 13 x `src/pages/periods/PeriodClosePage.{test,a11y.test,money.test}.tsx` — the page selects "the period containing today" via `new Date()`; the fixtures hard-code August 2026 ("today = 2026-08-07"). Rotted on 2026-09-01.
- 1 x `src/pages/smoke-tax-telecom-treasury-workforce.test.tsx` — partial per-file `vi.mock('lucide-react')` missing `Inbox`; the global complete mock in `src/test/setup.ts` was shadowed.
- server `audit.batch.test.ts` — fixture stamped 2026-08-20 and assumes "now - 30 d" precedes it. Rotted on 2026-09-19.

Remediation applied on the working branch (commits `1fc7127`, `c0d33ff`, `aa1812e`): injectable clock `src/utils/clock.ts` used by the page and pinned in tests; local lucide mock removed; server fixture made clock-relative; README rewritten to measured facts; `docs:verify` extended to reject unbacked claims and to measure reachability honestly; `npm run check` / `tsc` / `format:check` scripts added (`format` was broken: `prettier.js` -> `prettier.cjs`); advisories cleared (root 0, server 0; server 323/323 after fix). The charter's "do not modify first to make tests pass" rule was respected: baseline results above were recorded before any change.

## Observed source facts — reference

Files directly inspected:
- `app/imports/validation.py`
- `app/imports/commit.py`
- `app/imports/parser_csv.py`
- `app/imports/trial_balance.py`
- `app/calc/statements.py`
- `app/core/money.py`
- `app/core/audit.py`
- `tests/integration/test_month_end_spine.py`

Observed strengths in this small implemented slice:
- Money is represented as integer minor units, with `Decimal` at parsing/display boundaries and float rejection in `app/core/money.py`.
- Import validation returns valid and quarantined records rather than silently accepting every row (`validation.py`).
- Import persistence uses a database transaction and deterministic file hash/batch ID; repeated import attempts replace rows for an already committed matching batch (`commit.py`).
- The integration “spine” test checks malformed data, re-import idempotency, trial-balance status, and selected P&L outputs.
- Audit-chain hashing/verification primitives and tests exist.

Risks/questions exposed by code inspection (not all are confirmed defects):
- `parser_csv.py` skips fully blank lines; its comment says the caller accounts for them, but verify that the actual source-row count contract does so reliably. Its decoding fallback eventually uses Latin-1 with replacement, which can turn undecodable bytes into altered text rather than a blocking encoding error.
- `validation.py` catches broad `Exception` around money parsing; this may classify unexpected programming/system errors as bad amount rows. Consider catching the expected parse error classes only, after checking the full error hierarchy.
- For debit/credit mapping, empty strings are coerced to zero. Confirm whether blank versus explicit zero is intentionally equivalent for the real D365 export and whether conflicting debit and credit values are rejected.
- `trial_balance.py` tests whether entity-level net movement equals zero. That may be suitable only for a complete journal-level balanced ledger; an arbitrary GL extract or P&L-only feed should not be called a balanced trial balance. UI/status semantics and import scope must make this distinction explicit.
- `statements.py` uses a simplified account `statement_line` map and assumes a particular storage-sign convention. Validate the mapping and signs against D365 account configuration and accepted accounting policy before relying on its statement output.
- The small month-end spine asserts expected totals for the fixture, but independent source-side reconciliation and broader sign/currency/period cases remain to be assessed.

These observations are preliminary: they do not replace a full review of specs, schema, test coverage, or D365 integration.

## Observed source facts — target

- `DynamicsConnector` (`src/services/api-integration/DynamicsConnector.ts`) implements OAuth2 client-credentials against Entra ID and reads **Dataverse** `/accounts`, `/contacts`, `/invoices` — CRM entities, not Finance & Operations / Business Central general-ledger, AP or trial-balance data. No page, store or hook instantiates it or `ConnectorRegistry` (Verified: grep over `src/pages`, `src/store`, `src/hooks`, `src/components`). The owner's actual source (a D365 GL export) is therefore served only by the CSV/Excel import path (`src/services/GLImportService.ts`, `SmartImportMapper`).
- Import path (Verified by reading `GLImportService.ts`, `ImportPipeline.ts`, `src/types/index.ts:712`): `GLEntry` carries no `sourceFile`, `sourceRow`, `importBatchId` or file hash; no file-hash idempotency; `ImportResult.status` includes `'partial'`; rejected rows are reported only as a `skippedRows` count. FR-002 / FR-003 / FR-005 are therefore **not met** by current code.
- Persistence (Verified: `src/utils/masterStorage.ts`, `tauriSqlStorage.ts`): financial state is persisted as encrypted JSON blobs of whole Zustand stores in a single `stores(id, value)` table. The 35-table relational schema in `src-tauri/migrations` is not written by the app (`gl_entries` appears only in a comment).
- Server (Verified): `server/` implements JWT, RBAC, tenancy and period-close routes, but **zero** non-test files under `src/store`, `src/pages`, `src/components` import `services/api`. The desktop app does not bundle it. Production builds refuse mock auth and `loginReal` requires the server, so a shipped desktop build cannot sign in offline.
- Money (Verified): `src/utils/money.ts` is a correct decimal primitive; core domain types still use JS `number` for `debit/credit/amount`; adoption 28.89 %.
- Determinism (Verified): 339 `Date.now()` / `new Date()` call sites inside `src/engines` (non-test).
- The checkout contains 1,334 files matching `.test.*` or `.spec.*` under `src` by the basic filename count. This is a file count, not test count, and may include different categories.
- The README publishes historical counts and claims (e.g., 14,835 tests in an August 2026 measurement); they are self-reported and have not been rerun here.
- `package.json` includes quality gates such as `financial:oracles`, `money:ast`, `fabrication:audit`, `mock-data:audit`, `persistence:map`, `schema:equality`, and accessibility tests. Their existence is an audit lead, not verification that they are effective or passing.

## Immediate audit findings (provisional)

| ID | Severity | State | Finding | Next verification |
|---|---|---|---|---|
| AUD-001 | High | Verified mismatch | Prior audit describes target as Python and reference as TypeScript/Tauri; inspected public evidence shows the opposite. | Confirm product-of-record and intended implementation language with owner. |
| AUD-002 | High | **Verified** | Scope is misaligned: 242 routes / 216 pages / 18 sector dashboards / consolidation / collaboration / plugins exist, while the owner's concrete need (import a monthly D365 GL export -> validate -> review abnormalities) has no provenance, no idempotent import, no exception catalogue and no disposition workflow. The repo's own `docs/CAPABILITY_TRUTH_MATRIX.md` records 0 of 227 routes as CONNECTED or GOVERNED. | Gate 1 decisions (DEC-001/002); scope freeze to a <= 40-route spine. |
| AUD-003 | High | Potential | A GL movement total is not necessarily a trial balance; completeness and feed type affect what “balanced” means. | Define D365 export type and reconcile against source report controls. |
| AUD-004 | Medium | Potential | Broad exception handling in reference import validation can obscure unexpected failures. | Review `AppError` hierarchy and add targeted tests if behavior confirmed. |
| AUD-005 | Medium | Potential | Encoding fallback and blank-row accounting may undermine source-row fidelity for malformed exports. | Add codec/row-count fixtures and inspect importer caller. |
| AUD-006 | High | **Verified (closed)** | Target checks executed; results in "Target — executed" above. Suite was red (14 tests + 1 suite; server 1 file) from clock-dependence and a stale mock; fixed on the working branch. | Re-run `npm run check` on `main` after merge; keep CI green. |
| AUD-007 | Critical | Verified | README headline claims were false: "100 % Money Safety" (measured 28.89 % adoption), "14,835 tests 100 % green" (14 failing; CI red since 2026-08-20), "fully offline" (cannot sign in without a server), "182 engines shipped" (87 have no caller). | README rewritten from measurements (`c0d33ff`); `docs:verify` now rejects these wordings. Owner to confirm no other channel repeats the old claims. |
| AUD-008 | Critical | **Verified — partially remediated on branch** | No source-row provenance on GL entries, no import idempotency, non-atomic (`'partial'`) imports, rejected rows not individually explained. Violates FR-002, FR-003, FR-005; realises R-001, R-002. Branch (store-neutral slice): `importGLData` now rejects repeated file content by SHA-256, stamps `{batchId, fileHash, sourceFile, sourceRow}` on every committed entry, returns per-row rejections and decimal control totals; the upload page hashes file bytes and shows the batch evidence. 27 new tests. | Remaining: D365 export contract (DEC-001), page-level all-or-nothing, drill-to-source, store of record (DEC-005). |
| AUD-009 | High | Verified | Relational SQLite schema unused; app state is JSON blobs in a KV table; three unreconciled schema homes (migrations, server DDL, Zustand shapes). | DEC-005; then a table-and-column equality test against the live schema. |
| AUD-010 | High | Verified | Express server (auth/RBAC/period close) has no client; desktop production build cannot authenticate offline. | DEC-004 (auth/offline model). |
| AUD-011 | High | Verified | 87 of 182 engines, 8 client-side "security" services, 4 of 5 export engines and all ERP connectors have no runtime consumer; tested-but-unwired code was presented as shipped. | Wire-or-archive per module; make `engines:verify` fail on orphans (now measurable: `node scripts/verify-readme-stats.mjs --list`). |
| AUD-012 | High | **Verified — ratcheted on branch** | Calculations and page logic read the wall clock directly; `SafeMathParser` exposes `RAND()`. NFR-001 not met. Branch: `npm run determinism:ratchet` (in `npm run check`) fails on any per-file increase; `glStore` and the financial stores (period close, budget, forecast, scenario, data, driver, audit trail) now read `src/utils/clock.ts`; baseline 684 → 638 → 518 → 345 sites (all of `src/store`, `src/utils` and every reachable engine now read the clock; what remains is orphan engines, unreachable services and the spreadsheet `RAND` functions). | Continue the sweep through `src/engines` (352 sites) and `src/services` (166); decide `RAND()` policy. |
| AUD-013 | High | Verified | Production dependency advisories: root 3 high; server 1 critical (`proxy-addr` IP spoofing). | Cleared on the working branch (`aa1812e`): root 0, server 0. Keep `audit:prod` in CI. |
| AUD-014 | Medium | Verified | 464 Markdown files (6.2 MB), 15+ competing plans of record, 62 root files, committed agent scaffolding and tool residue. No index says which document wins. | Adopt this pack + `docs/audit/` as plan of record (DEC-006); archive the rest. |
| AUD-015 | Medium | Verified | The Dynamics connector targets Dataverse CRM, not F&O/BC GL; it cannot serve the owner's monthly GL export even if wired. | Discovery Q6/Q8 (which D365 product, export shape) before any connector work. |
| AUD-016 | Medium | Verified | No PowerPoint export; no cross-artifact tie-out test (UI == Excel == PDF). | Gate 5 scope decision. |
| AUD-017 | Low | Verified | `npm run format` was broken (Prettier 3 ships `prettier.cjs`); `npm run check` and `npm run tsc`, both referenced by the README, did not exist; `lint` mutated files. | Fixed (`c0d33ff`). |

## Branch log (what has been done on `arena/48b4e481-fp-a-betterversion` since the baseline)

| Commit | Scope |
|---|---|
| `b1f596b` | Audit document `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md` |
| `1fc7127` | Suite green: injectable clock, stale icon mock, clock-relative server fixture |
| `c0d33ff` | README rewritten from measurements; `docs:verify` rejects unbacked claims; broken scripts fixed |
| `aa1812e` | Production advisories cleared (root 0, server 0) |
| `4dbbba3` | This pack adopted at `docs/discovery/`; executed evidence recorded |
| `f30e123` | Gate 2 import slice: SHA-256 idempotency, atomic validation, per-row rejections, provenance on every entry, control totals, batch evidence UI |
| `05367e7` | Determinism ratchet script + baseline, wired into `npm run check` |
| `a2e8847` | Batch scope (FR-001), persisted pre-parse rejections, Source column in GL Explorer, stable server journal identity |
| `810b10a` | Financial stores moved to the injectable clock (baseline 679 → 638) |
| `70e2eaa` | Canonical agent handbook: `AGENTS.md` + `docs/agent/00–10`, `HANDOVER_TEMPLATE.md`; `CLAUDE.md`/`GEMINI.md`/`CONTRIBUTING.md` point at it |
| `132a261` | `parseGLRows` extracted from the upload wizard as a pure, fixture-tested function (FR-002/UX-002); whitespace-only account codes now rejected; full `test:sharded` at `897b6a0`: 8/8, 1,318 files, 15,448 tests |
| `897b6a0` | All 54 reachable engines moved to the clock (baseline 518 → 345); remaining sites are orphans, unreachable services and `RAND` |
| `947295b` | Remaining stores and utils moved to the clock; `nowISO()`/`nowMs()` added (baseline 638 → 518). Full `test:sharded` after it: 8/8, 1,318 files, 15,448 tests passed, 1 skipped (pre-existing) |

## Recommended next sequence (updated 2026-10-15 after execution)

1. ~~Run target checks~~ — done (above). Keep the tree green: merge the working branch; a human applies the E2E `timeout-minutes` change to `.github/workflows/ci.yml` (agent sessions cannot modify workflows).
2. **Owner decisions** (Gate 1), recorded in `decision-log.md`: DEC-001 first supported D365 export shape (needs a synthetic sample + column dictionary), DEC-002 first FP&A view / exception use case, DEC-003 data & AI policy, DEC-004 auth/offline model, DEC-005 store of record, DEC-006 plan-of-record documents.
3. Gate 2 vertical slice on the existing TypeScript/Tauri app — **started (store-neutral part done on the branch):** file hash, batch id, per-row rejection reasons, atomic commit on validation errors, control totals, source-row provenance on every imported `GLEntry`. Remaining: synthetic D365 GL fixture + column dictionary (needs DEC-001), source-side control-total comparison, drill-to-source, FR-001 scope fields (entity/currency/import time on the batch), FR-006 missing-vs-zero contract. Acceptance = FR-001 … FR-006 tests.
4. Reference (`FPA-modular`) patterns judged transferable on evidence: integer-minor-unit money with float rejection, quarantine-with-reasons, hash/batch idempotency, canonical finding key, oracle-first tests, acceptance harness with planted exceptions and controls, "evidence or not done" handover. Not transferable without a decision: the Python engine, the 28-rule catalogue as-is, its Dataverse-vs-F&O/BC assumptions.
5. Only after Gate 2 is green: exception rules (Gate 4) and board exports (Gate 5). No new routes, engines or sector packs before then.

## 2026-10-16 — Owner-delegated defaults and strict malformed-file policy

Owner authorized autonomous project decisions. DEC-001–006 now record conservative
accepted technical defaults, with unverified exports, native migration, auth changes
and egress enforcement explicitly pending. DEC-007 rejects a file containing any
upstream parse rejection; DEC-008 selects blocking closed-period semantics (not yet
implemented). No destructive archive, authentication bypass or storage migration was
performed.

Implemented DEC-007 in `glStore.importGLData`: return sorted source-row rejections
before financial writes, keep caller inputs and existing financial state unchanged,
and allow corrected retries without consuming the hash. Duplicate-file/duplicate-row
behavior is unchanged and still needs its own completeness review. Rejected-attempt
history is not yet durable.

Verification: `npm run tsc`; ESLint (changed TypeScript files, zero warnings);
Prettier (changed source files and agent data-model doc); Vitest GL store/import
services/upload page **12 files / 182 tests passed**; money AST, determinism ratchet
(345 unchanged), documentation verification and fabrication audit passed. The full
sharded suite was **not rerun** for this change.

## 2026-10-16 — Ledger-overlap completeness (DEC-009)

Inspection found that `importGLData` validated balance before removing rows that
matched the ledger, then committed the remainder without another balance check.
Even a balanced remainder could silently omit a complete journal. Changed the
policy to reject the whole file for review whenever a possible ledger overlap is
found; no entries/history/undo identifiers/sync metadata change. Failed attempts
do not consume a hash. Same-file hash rejection remains unchanged.

The overlap key now normalizes debit/credit using the same authority as persisted
entries: upload parser `amount: 0` placeholders no longer conceal overlaps, and
different gross debit/credit pairs with the same net are not collapsed. This is
still a conservative match heuristic, not a proven duplicate identity. Entity/
currency-aware matching and verified source journal/line identifiers remain open.
Repeated equal-valued lines within a new file are preserved. Empty imports now
return an explicit validation reason without success history.

Tests cover balanced overlaps, one-sided overlaps (formerly an unbalanced
remainder), parser → store placeholder amounts with true source-row numbers,
equal-net/different-gross entries, repeated source lines and empty files.

Period lock investigation: `PeriodCloseEntry` persists a fiscal-period ID and
entity, while GL imports primarily identify periods through posting dates and
`YYYY-MM`. Close checklists retain a deadline but not the full fiscal date range.
Before DEC-008 can be enforced across import/edit/delete/undo, retain authoritative
fiscal date ranges and define entity/adjusting-period matching; do not guess a
calendar-month mapping or claim the gate is closed.

Verification for DEC-009: TypeScript passed; ESLint on changed TypeScript files
passed with zero warnings; Prettier passed; all GL-store/import-services/data-page
tests passed (**31 files / 305 tests**). Money AST, determinism (345 unchanged),
documentation verification and fabrication audit passed. Full sharded suite was
not rerun for this change.

## 2026-10-16 — Fiscal scope retention and reopen bypass (DEC-008 partial)

Close checklists now persist supplied canonical start/end dates and adjusting-period
flags. Calendar initialization prevalidates all input before mutation, rejects
invalid ranges/duplicate IDs, and refuses year/date/entity rebinding of existing
period IDs. Compatible legacy checklists are backfilled without replacing tasks,
close entries or audit history. The page validates existing bindings on mount and
surfaces conflicts with an explicit retry/error state rather than crashing or
silently reusing prior-year close state.

Removed a verified bypass: `resetPeriod` previously changed any closed state to
open without PERIOD_REOPEN or an audit event. It now refuses closed periods, even
for Admin; open/unknown periods are no-ops. Authorized reopen and force-reopen
require a trimmed, non-blank audit reason. Local generated approval IDs are not
independent approval evidence.

Still open: all GL write guards, entity and overlapping/adjusting-period resolution,
hydration readiness and concurrent transition/write semantics. No claim of complete
closed-ledger immutability. Initialization does not infer a state-machine close from
the fiscal calendar's `isClosed` flag.

Targeted verification: **17 files / 292 tests passed**, covering period store,
period page (including accessibility/money), state machine, GL stores, import
services and upload page. The first expanded test run caught a changed mount-time
initialization call count; the empty-state test now explicitly separates mount-time
validation from the user retry. No weakened assertions or skipped tests. Full
sharded suite was not rerun for this change.

Additional checks passed: TypeScript, changed-file ESLint (zero warnings), Prettier,
money AST, determinism ratchet (345 unchanged), docs verification, fabrication audit
and architecture guardrails.
