# FinPlan Pro — Project Audit & Execution Plan

> **This is the master working document for this project from 2026-10-18.**
> Every future session (human or AI agent) starts here, then follows the
> session ritual in §11. Where this document and measured code disagree, the
> code and the script that measured it win — and this document is the bug.
>
> **Status:** Audit performed 2026-10-18 on branch
> `arena/2b91a53b-fp-a-betterversion` @ `29b19a9` (single-commit checkout).
> **Companion documents (do not duplicate them, follow them):**
> [`AGENTS.md`](../AGENTS.md) (engineering rules) ·
> [`docs/VISION.md`](VISION.md) (product goal) ·
> [`docs/agent/WORKING_AGREEMENT.md`](agent/WORKING_AGREEMENT.md) (owner's goal + live queue) ·
> [`docs/discovery/requirements-register.md`](discovery/requirements-register.md) (FR/NFR register) ·
> [`docs/discovery/decision-log.md`](discovery/decision-log.md) (DEC-001…DEC-018) ·
> [`docs/agent/09_KNOWN_GAPS.md`](agent/09_KNOWN_GAPS.md) (measured gaps) ·
> [`docs/discovery/d365-export-contract.md`](discovery/d365-export-contract.md) (D365 mapping contract)
>
> **Honesty note on this audit:** `node_modules` was not installed in the
> audit sandbox, so `npm run check` was **not** re-run for this document.
> All counts below are from `find`/`grep` commands run on 2026-10-18 (named
> next to each figure). Test-pass claims from earlier sessions are cited as
> dated history, never as today's result.

---

## 1. The goal — in the owner's words, and what it commits us to

> "all in one fp&a tool/app a one stop solution for fp&a
> also i am using dynamic 365 where i export all data gl dump and use it to work
> also i have to identify the wrong entries and guide accounts team to fix it
> i want this project to help me with that also
> as i compare day by day, month by month, year on year compariosion where i
> compare and check each and everything in extreme detail but now i want this
> tool to help me with this task"

That is **four jobs**. Everything built on this project must name the job it serves:

| Job | In plain language |
| --- | --- |
| **J1** | One Dynamics 365 GL dump goes in; one trusted workspace comes out. No spreadsheet round-trip. |
| **J2** | The tool finds the potentially wrong entries — exhaustively, with evidence. |
| **J3** | The tool turns a finding into a correction the accounts team can act on, and tracks it to "fixed". |
| **J4** | The tool does the day-over-day / month-over-month / year-over-year comparison, at entry-level detail. |

### 1.1 Owner decisions recorded 2026-10-18 (DEC-015 → DEC-018)

The owner was asked four scoping questions and answered **expansively** on all four.
These answers are policy now, and are recorded in
[`docs/discovery/decision-log.md`](discovery/decision-log.md):

| Decision | Owner's answer | What it means in practice |
| --- | --- | --- |
| **DEC-015 — D365 scope: ALL** | Support every D365 GL export shape, not one. | The importer stays **mapping-driven** and must handle: (a) D365 Finance & Operations "General ledger statement by main account" (separate Debit/Credit, voucher, `Ledger account` with dimensions), (b) F&O `GeneralJournalAccountEntryEntity` shape, (c) Business Central `G/L Entries`, (d) trial-balance snapshot files — *recognised and refused as a GL dump, with a reason*, (e) generic mapped CSV/XLSX from any other D365 report/Excel add-in. "Verified D365 support" for a shape still requires one real anonymised sample of that shape (DEC-001/DEC-013 stand). |
| **DEC-016 — Surfaces: ALL** | Build the exception queue **and** the comparison workspace **and** prove the import spine. | "All" is a destination, not a parallel work order. Build order is forced by dependency, not preference: spine (J1) → exception queue (J2) → correction hand-off (J3) → comparison workspace (J4). Each surface is built only when the layer beneath it is proven by tests. |
| **DEC-017 — Materiality: EVERYTHING** | Flag everything; hide nothing behind a threshold. | Every account × period difference and every rule hit is **listed**. Thresholds may *rank and tier* findings (Tier 1/2/3 in §7), they may never *suppress* a row. Default view shows all, sorted by size; filters are the user's choice, never the tool's. Thresholds stay configurable per rule. |
| **DEC-018 — Hand-off: Excel + in-tool tracking** | Accounts team gets an Excel correction list; status is tracked inside the tool. | The correction lifecycle is `REQUESTED → APPLIED (confirmed by a human) → RE-VERIFIED` (the fix is visible in a later import). Nothing auto-marks a correction fixed. The Excel list and the in-tool tracker read the *same* store records — never two copies of the truth. |

### 1.2 Non-negotiable interpretation rules

1. **A flag is a review candidate, never an "error", "wrong entry" or "fraud"** — until a human disposition says so. UI copy, exports and rule names obey this. The owner *suspects*; the tool *evidences*; the human *decides*.
2. **Missing is never zero.** A period/entity/account not present in the imported file renders as "not in file" with the reason. Never `?? 0`, never a default currency/entity/period.
3. **One source of truth per fact.** `glStore` is the authoritative ledger for all UI reads (DEC-012). The exact-string staging/promotion pipeline is an audit/validation channel only — no dual-write bridging (DEC-005).
4. **Money has one primitive.** All amount arithmetic through `src/utils/money.ts` (`decimal.js`, ROUND_HALF_UP). Core domain types still carry JS `number` (`src/types/index.ts:719-724` — `GLEntry.debit/credit/amount`) — that is a known debt (P1-02), not a licence to add more float math.
5. **No gate is weakened to pass it.** Ratchets (money, determinism, palette, type-safety, fabrication) only move down.

---

## 2. Executive verdict

**FinPlan Pro is a very wide, locally disciplined codebase wrapped around a spine that is ~70 % built but has never been run on a real D365 file.**

Measured on 2026-10-18 (counting method in §3):

- **2,545** source files under `src/` (~512k lines), **242** routes, **216** page modules, **193** engine modules (top level of `src/engines`), **48** stores, **1,430** test files / **~15,093** test cases.
- The genuinely strong parts: the GL import contract (atomic, idempotent, provenance, control totals — §5.1), the money primitive, the trial balance, statement views, the board-pack Excel/PPTX tie-out, and a ratchet/gate system that makes dishonest "done" claims hard.
- The decisive gaps against the owner's four jobs:
  - **J1:** No real D365 export has ever been imported. Every D365 claim rests on synthetic fixtures (`GLUploadPage.d365.integration.test.tsx`). The D365 *connector* targets Dataverse CRM entities (`accounts`, `contacts`, `invoices` — `src/services/api-integration/DynamicsConnector.ts`), not F&O/BC general ledger, and is wired to no page.
  - **J2:** A 5-rule exception catalogue exists (`src/store/exceptionRuleCatalogue.ts`, R-001…R-005) and review card/list components exist (`src/components/exceptions/`) — but **no page or route consumes them**. Today the owner cannot see a single finding in the running app. There is no rule *runner* that evaluates the catalogue against the ledger.
  - **J3:** The correction data layer is done (assignee, due date, instruction, status, audit trail — `src/types/exceptions.ts`, FR-010 store half). **No Excel correction export and no tracker UI exist.**
  - **J4:** **No comparison workspace exists** (FR-011: "Not built"). Variance surfaces exist (`/variance`, Budget-vs-Actual) but they compare budget-vs-actual by account-category prefix, not day/month/year actuals side-by-side at account × period with drill-to-entry.
- Structural risks: **87+ orphan engines** (README-measured: 95 reachable of 182 at last script run), 242 routes for a single-user month-end workflow, an Express server no frontend module calls, a Tauri relational schema (35 tables) the client never writes, and desktop offline sign-in still unresolved (DEC-014 mechanism chosen, implementation pending).

**The strategy this plan enforces:** finish and prove the spine on synthetic-then-real D365 shapes, then build J2 → J3 → J4 in that order, and only then widen into the broader all-in-one FP&A pillars (PLAN / MODEL / REPORT depth). Scope before spine is the exact failure mode that killed this codebase's predecessors (see `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md` §0).

---

## 3. Measured inventory (2026-10-18)

Commands: `find src -name "*.ts" -o -name "*.tsx" | wc -l`, `grep -c "<Route" src/App.tsx`,
`grep -rhoE "^\s*(it|test)\(" src server --include="*.test.*" | wc -l`, `du -sh`.

| Area | Measured | Note |
| --- | --- | --- |
| Stack | Tauri 2 + React 19.2 + TypeScript 5.9 (strict) + Vite 8 + Tailwind 4 + Zustand 5/Immer | `package.json`; Node 22 target |
| `src/` files / LOC | 2,545 files / ~511,804 lines | includes tests |
| Routes / pages | 242 `<Route>` in `src/App.tsx` / 216 page modules | route consolidation is P1, not P0 (§9) |
| Engines | 193 top-level modules in `src/engines` | ~half unreachable from runtime (orphan census: `node scripts/verify-readme-stats.mjs --list`) |
| Stores | 48 non-test modules in `src/store`; 42 persisted as encrypted JSON blobs via `masterStorage` | relational SQLite schema unused by client |
| Components | 294 non-test `.tsx` under `src/components` | incl. 18 sector packs |
| Services | 75 modules; 9 ERP/connector classes | none wired to a page |
| Workers | 5 (consolidation, Monte Carlo, batch calc, storage, GL staging) | |
| Tests | 1,430 test files, ~15,093 `it/test` cases | last full green run: 2026-10-17, Node v22.22.3, `npm run check` 8/8 shards (dated history) |
| Server | Express + SQLite, JWT/RBAC/tenancy, 12 route modules in `server/src/routes` | **no frontend caller**; not bundled with desktop app |
| Desktop shell | Tauri 2, 3 Rust modules, 3 SQL migrations | reported `NATIVE-UNVERIFIED` from any sandbox without Rust |
| Docs | 437 markdown files under `docs/` (514 repo-wide) | one live set per DEC-011; `docs/archive/` is provenance only |
| Exports today | Excel (`exceljs`), PDF (`jspdf`), editable PPTX (zero-dep OpenXML generator in `src/services/export/financialPackageExport.ts`) | board-pack XLSX+PPTX tie-out tested; PDF leg + most other surfaces untested |

---

## 4. Architecture audit

```
D365 export (CSV/XLSX) ──► GLUploadPage ──► parseGLRows / d365Parser ──► glStore.importGLData
                              │                     │                         │ atomic · SHA-256 idempotent
                              │                     │                         │ per-row rejections · provenance
                              ▼                     ▼                         ▼ control totals · scope
                        column mapping        flavour detection        trial balance / statements
                                                                              │
                        ┌─────────────────────────────────────────────────────┼──────────────────────────┐
                        ▼                             ▼                     ▼                          ▼
                  GL Explorer / TB pages      Variance / BvA pages   Exception catalogue        Board pack
                  (drill-to-source rows)      (budget-vs-actual)     (NO runner, NO page) ✗      (Excel/PDF/PPTX)

Express server (auth/RBAC/period-close) ──✗ no frontend caller        DynamicsConnector (Dataverse CRM) ──✗ unwired
Tauri SQLite 35-table schema ──✗ client never writes it               AI copilot ── present, no verified-facts gate
```

**Findings:**

- **A-01 (strength).** Layering is real: pages → stores → engines/services → `utils/money`. Engines are pure calculation modules; the money/determinism ratchets police the calculation paths.
- **A-02 (P0-adjacent risk).** Persistence is whole-store encrypted JSON blobs in one KV table. It works, but it caps J4: day/month/year comparison across many imported months needs period-indexed queries, not whole-blob scans. DEC-005 names relational SQLite as the target; migration is blocked on native verification. *Do not start the migration inside a feature PR* — it is its own phase (§10, Phase 6).
- **A-03.** Two ledgers exist on paper: `glStore` (authoritative, DEC-012) and the exact-string staging/promotion pipeline (`gl-ledger-exact:v1:*`). The staging pipeline is genuinely useful as the import quarantine/audit channel (§5.1) — keep it in that role only.
- **A-04.** The server is a parallel universe: real JWT/RBAC/tenancy/period-close code with tests, zero UI consumers, not bundled. Until DEC-004/DEC-014 land, it must not be described as part of the product. Offline desktop sign-in (cached local session, DEC-014) is the unblock for "the owner can actually open the app".
- **A-05.** Breadth is a liability until the spine is proven: 242 routes, 18 sector dashboards, plugins, collaboration, ESG/insurance/construction packs. They stay (DEC-006/DEC-010: no destructive pruning without owner decision) but they are **frozen** — no new routes/engines/stores/sector packs until Phase 4 exits (§10).

---

## 5. Domain audit — the owner's workflow, step by step

### 5.1 J1 — D365 GL import (the spine)

**What exists (verified by reading the code):**

- `src/pages/data/GLUploadPage.tsx` — upload wizard with column mapping; one parser (`src/services/import/parseGLRows.ts`) serves both preview and import, so they cannot disagree.
- `src/services/import/d365Parser.ts` — detects F&O (`Ledger account`, `AccountingDate`, `AccountingCurrencyDebitAmount`…) vs Business Central (`G/L Account No.`, `Posting Date`, `Entry No.`…) from headers (`detectD365Flavor`), parses ISO / US / `dd-MMM-yyyy` dates with calendar round-trip checks, rejects non-transaction (total/opening-balance) rows with reasons.
- `src/store/glStore.ts` `importGLData` — SHA-256 file idempotency (reject, never merge), atomic on validation error (DEC-007), whole-file reject on possible ledger overlap (DEC-009), per-row rejections `{row, code, reason}`, per-entry provenance `{batchId, fileHash, sourceFile, sourceRow}`, cent-exact control totals computed independently of the TB engine, batch scope `{periods, dateRange, entities|'unavailable', currencies|'unavailable'}`.
- Supporting pipeline: CSV/XLSX tokenizers, GL staging coordinator/repository, period write guard (closed periods block writes, DEC-008 partial), `gl-ingestion.worker`.

**Gaps:**

| ID | Gap | Severity |
| --- | --- | --- |
| IMP-01 | No real export of *any* D365 flavour has been imported. DEC-015 now requires **all** flavours; each flavour's "verified" claim needs one anonymised sample. | **P0** (owner input) |
| IMP-02 | The export's *own* control totals (the totals the owner reads in D365) cannot be entered/compared — reconciliation is internal-only (FR-004 open half). | P1 |
| IMP-03 | No saved mapping profiles. A monthly repeat import re-does mapping; DEC-015 multiplies this by flavour. Mapping must be saveable per flavour/source and re-applied automatically on header match. | P1 |
| IMP-04 | `DynamicsConnector` is Dataverse CRM, not GL. Any future direct D365 pull (F&O OData / BC API) is a new connector, DEC-gated, and **not** required for v1 — file import is the contract. | P2 (defer) |
| IMP-05 | Trial-balance snapshot files must be *recognised and refused as GL dumps* with a clear reason (they are balances, not transactions) — part of DEC-015(d). | P1 |

### 5.2 Trial balance, statements, period close (CLOSE pillar)

**Exists:** `generateTrialBalance` (debits = credits enforced per journal batch in `validateEntries`, FP-0002), GL Trial Balance / GL Explorer / GL Journals pages with a Source (provenance) column, P&L / Balance Sheet / Cash Flow / Three-Statement pages with money tests and oracle tests (`financialStatementOracles.test.ts`), period-close state machine (`periodCloseStore`, checks, reopen-with-reason).

**Gaps:** sign-presentation rules per account type live inside engines, not one documented contract (P1); fiscal calendar vs calendar month is still an open discovery question (Q11–Q14 in `current-workflow.md`) — **never assume fiscal = calendar**; closed-period write guards are partial across all write surfaces (DEC-008).

### 5.3 J2 — Finding the wrong entries

**Exists:** versioned rule catalogue R-001…R-005 (variance / spike / drop patterns, `ruleId@version`, supersede-with-link), deterministic finding keys, disposition store with append-only audit trail, correction requests (FR-010 store half), `ExceptionReviewCard`/`ExceptionReviewList` components with severity filters, plus an unwired `AnomalyDetectionEngine`/`AnomalyExplainer`.

**Missing — this is the largest product gap in the repo:**

| ID | Gap | Severity |
| --- | --- | --- |
| EXC-01 | **No rule runner.** Nothing evaluates the catalogue against `glStore` entries to produce findings. The catalogue has zero consumers (`grep useExceptionRuleCatalogueStore` → definition only). | **P0** |
| EXC-02 | **No route/page renders the review queue.** Components exist; no page imports `ExceptionReviewList`. | **P0** |
| EXC-03 | The 5 rules are all *aggregate variance* rules. The owner's actual hunt is **entry-level**: duplicates, wrong-period postings, reversals without counterparts, round-sum entries, missing descriptions, wrong-account patterns, backdated/weekend postings, one-sided journals… (§7 catalogue). | **P0** for the job, built incrementally |
| EXC-04 | No planted-exception answer key (synthetic company with known wrong entries) to measure recall/false-positives. Domain rules require it before any rule is called "working". | P1 |
| EXC-05 | Findings must carry source-row evidence (batch · row) end-to-end into the queue UI — the data model supports it (`evidenceRows`), no producer exists. | P1 |

**Language law (repeat of §1.2.1):** flags are "potential exceptions / review candidates". The moment UI copy calls a flag an error, the tool has accused the accounts team without evidence. This is a testable copy rule, not a style preference.

### 5.4 J3 — Guiding the accounts team to fix it

**Exists (store half, FR-010):** `CorrectionRequest` — instruction + assignee (both refused when empty), due date through the calendar-checked parser (`2026-02-30` refused; agreed absence = `null`, never "today"), source locator (`batch · row`), status `REQUESTED → APPLIED / WITHDRAWN` set only by explicit human action, append-only correction audit trail, v1→v2 blob migration.

**Missing (DEC-018 defines the target):**

| ID | Gap | Severity |
| --- | --- | --- |
| COR-01 | No Excel correction-list export (one row per finding: entry locator, what's suspected, what to change, evidence figures, assignee, due date, status). Must consume the same store records the screen shows — never recompute. | **P0** for J3 |
| COR-02 | No correction tracker UI (list, filter by assignee/status/ageing, follow-up). | P1 |
| COR-03 | No **re-verification**: when the next import lands, the tool should check whether a corrected entry's fix is actually visible (e.g. original entry reversed / amount changed) and propose `RE-VERIFIED` — a human confirms. This closes the owner's loop and is the feature no spreadsheet gives them. | P1 |
| COR-04 | `APPLIED` must stay human-set. No import-side auto-flip; the tool may *suggest*, never *assert* "fixed". | rule |

### 5.5 J4 — Day / month / year comparison "in extreme detail"

**Exists to build on:** fiscal-calendar engines, period logic in report builders, Budget-vs-Actual and `/variance` pages, statement views, GL Explorer drill-to-source rows. `VarianceDecompositionEngine`/`VarianceAttributionEngine` exist; the Variance page itself rolls up by account-code prefix categories with canned driver labels ('Pricing pressure', 'Hiring ahead of plan') — **those labels are hypotheses presented as causes and must not be copied into the comparison workspace** (fabrication risk, NFR-002).

**Missing:** the comparison workspace itself (FR-011). Its contract (§8) is the heart of the owner's daily work and the most detail-sensitive surface in the product: account × period grid, DoD/MoM/YoY columns, money + % deltas with stated sign convention, every figure drillable to its contributing entries, "not in file" for uncovered periods, and — per DEC-017 — **every** difference listed, tiered by size, never threshold-hidden.

### 5.6 REPORT pillar — outputs

**Exists:** board pack with screen→Excel tie-out pinned cell-by-cell by test (`BoardPackPage.exportTieOut.test.tsx`), XLSX **and** editable-PPTX tie-out at service level (`boardPackTieOut.integration.test.ts`), PDF via `jspdf`.

**Gaps:** PDF leg of the tie-out triangle untested (REP-01, P1); most other export surfaces have no tie-out test and at least six published a percentage as a currency cell (P1-14, partially closed 2026-10-18 for six pages); exports must always consume the screen's calculation objects, never recompute.

### 5.7 PLAN / MODEL pillars — the wider "all-in-one"

Budgets, forecasts, scenarios, consolidation (exact-string pipeline, FX/CTA, IC elimination), revenue/leases/tax/debt/workforce engines largely **exist as code**; roughly half the engines are orphaned and several sector pages are template clones of one GL-stats body (`docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`). Verdict: **BUILT-wide, CONNECTED-thin, GOVERNED-unverified** (per `CAPABILITY_TRUTH_MATRIX.md`: every route's Connected/Governed/Enterprise-ready = UNVERIFIED). These pillars are *depth on top of the spine* — frozen until the spine phases exit (§10), then hardened one workflow at a time with evidence, never by page count.
### 5.8 Cross-cutting audit

| Area | Finding | Severity |
| --- | --- | --- |
| Money | Primitive correct; `GLEntry.debit/credit/amount` still JS `number` (`src/types/index.ts:719-724`); adoption ~29 % at last script run | P1 |
| Determinism | Ratcheted (344 sites / 79 files at last recording); new calc code must add zero | P1 |
| Fabrication | Some pages shipped canned drivers/sample figures as if real; fabrication + mock-data audits exist but are scope-limited | P1 |
| Persistence | Encrypted blob KV works for single-user v1; blocks period-indexed comparison queries at scale (DEC-005 target: relational SQLite, native-verification blocked) | P1 |
| Server | Express JWT/RBAC/tenancy built, tested, **no frontend caller**, not bundled | P2 (freeze) |
| Desktop auth | Offline sign-in unresolved; DEC-014 cached-session mechanism chosen, implementation pending | P1 |
| AI | Copilot/NLQ/commentary exist; no verified-facts gate, egress not chokepointed (AI-001). AI never computes/posts numbers | P2 (defer) |
| Security | Local-first (DEC-003); Sentry/PWA egress means "fully offline" may not be claimed; no data may leave the machine by default | P1 |
| Performance | ~512k LOC, large bundle risk; large-GL (100k+ rows) behaviour must be proven with the bench suite before J4 ships | P1 |
| Accessibility | a11y test suites exist; every new surface ships the five states (loading/empty/error/partial/success) + keyboard/focus + non-colour signals | gate |
| CI | 9 workflows in `.github/workflows/`; `main` CI history must be checked with `gh run list` before any "green" claim — never assumed | gate |
| Docs | 437 docs under `docs/`; one live set (DEC-011), archive is provenance. Doc sprawl is a recurring failure mode — this file must not become a second competing plan: it points at the registers, it does not copy them | rule |

---

## 6. Consolidated findings register (what I fix, in order)

**P0 — the owner's job cannot be done end-to-end until these close:**

| ID | Finding | Closes job |
| --- | --- | --- |
| P0-01 | No D365 shape is verified against a real export; all flavours unproven (IMP-01) | J1 |
| P0-02 | No exception rule runner: catalogue (R-001…R-005) has zero consumers (EXC-01) | J2 |
| P0-03 | No exception review queue page/route (EXC-02) | J2 |
| P0-04 | Rule catalogue lacks entry-level wrong-entry rules (EXC-03) | J2 |
| P0-05 | No comparison workspace: DoD/MoM/YoY at account × period with drill-to-entry (FR-011) | J4 |
| P0-06 | Correction hand-off has data but no Excel export and no tracker (COR-01) | J3 |

**P1 — trust, scale and follow-through:** IMP-02 (source-side control totals), IMP-03 (saved mapping profiles), IMP-05 (TB-snapshot refusal), EXC-04 (planted-exception answer key), EXC-05 (evidence rows end-to-end), COR-02 (tracker UI), COR-03 (re-verification proposal), REP-01 (PDF tie-out leg), money-type debt (`GLEntry` numbers), PDF/other export tie-outs, offline auth (DEC-014), route/engine orphan freeze enforcement.

**P2 — defer deliberately:** direct D365 API pull (IMP-04), server activation, AI commentary gate, sector-pack depth, consolidation/FX hardening beyond current tests, PPTX beyond board pack.

---

## 7. Target design — J2 wrong-entry detection (rule catalogue v2)

Existing R-001…R-005 (aggregate variance/spike/drop) stay. Add **entry-level** rules, each with: rule id + version, required inputs, exact formula/condition, evidence rows (batch · row), known limits, recommended action. Every rule runs over **every** entry (DEC-017); output is tiered, never filtered:

- **Tier 1 — structural suspects:** unbalanced voucher/journal; duplicate entry (same account, date, amount, reference); one-sided journal; debit=credit both non-zero on one line; negative/reversed sign anomalies.
- **Tier 2 — pattern suspects:** posting to a dormant account; round-sum amounts above a configurable size; backdated or weekend/holiday postings; entries just below approval-style thresholds; unusual account↔department/entity combinations vs history; missing/blank description or reference where the flavour normally carries one; reversal without an identifiable original.
- **Tier 3 — movement suspects:** account × day/month/year movements (feeds J4), new accounts, accounts disappearing, amount outliers vs the account's own history (median/MAD, stated in the rule).

Rules are deterministic (same ledger + same rule version → identical finding keys), money-exact, and each ships with a planted-exception fixture. A finding's lifecycle: `NEW → disposition (ACCEPT / REJECT / REVIEW / ESCALATE) → correction request (FR-010) → APPLIED → RE-VERIFIED`.

---

## 8. Target design — J4 comparison workspace (FR-011 contract)

- **Grid:** one row per account (entity/dimension columns when the file carries them — absent dimension = "not in file", never a merged zero). Columns: current period, prior period, prior-year period, Δ money, Δ % — repeated per grain.
- **Grains:** Day (DoD), Month (MoM), Year (YoY) switchable on the same grid; the period each column covers is printed on the column, with its batch coverage.
- **Sign convention** stated on screen (per account type's normal balance) and identical in Excel/PDF exports.
- **Every figure drills to its contributing entries** (provenance batch · row), reusing the GL Explorer pattern.
- **Completeness honesty:** a period with no imported batch shows "not in file"; a partially covered month says so (days present / days in month). Comparison against an uncovered period is listed as unavailable — never as −100 %.
- **Exhaustive by default (DEC-017):** all accounts listed, sorted by |Δ|; Tier badges (§7) rank attention. Search/filter is user-controlled.
- **No invented drivers.** The grid shows *what moved and by how much*; "why" is the reviewer's disposition text, or a rule's stated formula — never canned labels.
- **Performance bar:** 100k-entry ledger, grid + drill interactive; proven by bench/load suite, not by opinion.

## 9. Target design — J3 correction hand-off (DEC-018)

- **Excel correction list** generated from the disposition/correction stores (same records as the screen): finding key, rule id, account, date, amount, source locator (file · batch · row), suspected issue in plain language, correction instruction, assignee, due date, status. Percentages formatted as percentages, money as money (the P1-14 lesson).
- **Tracker:** in-tool list with status ageing; only humans set `APPLIED`; on a later import the tool may attach a *proposed* re-verification (e.g. "reversal of batch 7 · row 214 appears in batch 9") which a human confirms to `RE-VERIFIED`.
- The Excel file is a working document for the accounts team, not a report: they can return it with status updates, and re-importing that status sheet is a Phase-5 nicety — **not** v1 scope.

## 10. Roadmap — phases, gates, exit evidence

Work top-to-bottom. A phase starts only when the previous phase's exit evidence exists.

| Phase | Scope | Exit evidence |
| --- | --- | --- |
| **0 — Baseline** | `npm ci`, full `npm run check` tally recorded; orphan/route census refreshed | Pasted gate tallies in the handover; this doc's §3 numbers re-measured |
| **1 — Universal import (J1)** | All DEC-015 shapes detected/mapped; TB-snapshot refusal (IMP-05); saved mapping profiles (IMP-03); source-side control totals entry (IMP-02); fixtures per shape incl. BOM, no-header, thousands separators, total rows, `dd-MMM-yyyy` | Per-shape fixture tests green; synthetic file of each shape imports atomically with provenance + control totals |
| **1V — Owner validation** | Owner imports one real anonymised file per shape they use; D365-side totals reconciled to the cent | Owner-confirmed reconciliation; only then may docs say "verified" for that shape |
| **2 — Trusted views** | TB/statements sign contract documented + oracle tests; drill-to-source from every statement figure | Oracle tests; statement figure → entries trace test |
| **3 — Exception engine + queue (J2)** | Rule runner over `glStore`; catalogue v2 (§7); queue page reusing `ExceptionReviewList`; dispositions persist; answer-key fixtures | Planted-exception recall/false-positive report, run twice, identical output |
| **4 — Comparison workspace (J4)** | §8 contract, all three grains, drill-through, coverage honesty | Independent recalculation tests per grain; "not in file" state tests; bench at 100k entries |
| **5 — Correction loop (J3)** | Excel correction export (tie-out to store), tracker UI, re-verification proposals | Export tie-out test (store == Excel); lifecycle tests; no auto-`APPLIED` path exists |
| **6 — Platform truth** | Offline auth (DEC-014); persistence decision executed (DEC-005); PDF tie-out (REP-01); CI on `main` green | `gh run list` green; offline sign-in test; screen == Excel == PDF test |
| **7 — All-in-one depth** | PLAN/MODEL/REPORT hardening one workflow at a time; orphan wiring-or-freeze decisions; route consolidation 242 → owner's working set | Per-workflow Connected evidence in the capability matrix |
| **8 — Optional** | Direct D365 connector (new DEC), AI commentary behind verified-facts gate (AI-001), team/server use | Own DEC + acceptance criteria before any code |

**Frozen until Phase 4 exits:** new routes, pages, engines, stores, sector packs, connectors (AGENTS.md rule 8). Repairs, tests, guards and ratchet-lowering are always welcome.

## 11. How I will work — the commitment

**Session ritual (every session, no exceptions):**

```text
START  Read AGENTS.md → this plan (§1, §6, §10) → docs/agent/09_KNOWN_GAPS.md
       → docs/agent/WORKING_AGREEMENT.md queue → git status
       Run npm run tsc && npm run lint — clean before touching anything
WORK   One queue item per change. Failing test first (red output captured).
       Narrowest suites after each edit; every ratchet the change could move.
       Money via src/utils/money.ts; time via src/utils/clock.ts.
       Missing = "not in file", never 0. Flag = candidate, never "error".
       Everything listed (DEC-017); thresholds rank, never hide.
END    npm run check (or the justified subset — named as partial, never "green")
       Update the document that owns each changed fact + the queue below
       Handover with docs/agent/HANDOVER_TEMPLATE.md: what moved, tallies,
       what is unverified/unwired/owner-blocked — in those words
```

**Definition of done (all six, or it is reported partial):** (1) failing-first test with captured red; (2) fix addresses the class, not the instance; (3) gates actually run in this tree, tallies pasted; (4) docs updated in the same change, false claims deleted; (5) every number reported came from a command; (6) honest handover labelling unverified/unwired/blocked work.

**I stop and ask the owner only when:** a real sample or a money-semantics fact (fiscal calendar, sign convention, entity structure) is needed and cannot be defaulted safely; anything would send data off the machine or need a credential; a documented fact irreconcilably contradicts the code and fixing it changes a product claim (→ new DEC). Everything else I decide, do, and show evidence for.

## 12. Open questions for the owner (non-blocking unless marked)

1. **[Blocking for Phase 1V only]** One anonymised export per D365 flavour you use (F&O and/or BC), plus the control total you read in D365 for that file. Synthetic-shaped files are fine to start; real headers matter.
2. Which D365 product/version produces your dump, and from which screen/report do you export it?
3. Fiscal calendar: is your fiscal year the calendar year? When does your month actually close?
4. Single entity / single currency, or multi-entity / multi-currency in the same dump?
5. Accounts team hand-off today: who are the assignees (names/roles for the tracker), and what due-date rhythm do you want (e.g. corrections before close +2 days)?
6. Sign/presentation preference for the comparison grid (e.g. expenses shown positive or negative)?
7. Any accounts that should *always* be reviewed regardless of movement (e.g. suspense, related-party)? They become Tier-1 watchlist rules.

## 13. Risks

| Risk | Mitigation in this plan |
| --- | --- |
| Building breadth before spine (the predecessor failure mode) | Phase freeze (§10); DEC-016 order |
| "Verified D365" claimed from documentation alone | DEC-001/013/015: verified only per-shape, only after a real sample reconciles |
| Threshold creep quietly hiding differences | DEC-017: suppression is a test failure, not a setting |
| Accusing the accounts team on a false flag | Candidate language law; disposition before "wrong"; answer-key false-positive bar |
| Blob persistence caps comparison scale | Phase 6 persistence decision; bench gate in Phase 4 |
| Doc sprawl creating competing plans | This plan points at registers/decisions; it owns goal, audit, sequence, and working method only |

---

*Audit evidence for this document: file/line citations were read directly from the tree on 2026-10-18 (`src/types/index.ts:719-724`, `src/services/api-integration/DynamicsConnector.ts`, `src/store/exceptionRuleCatalogue.ts`, consumer greps for `useExceptionRuleCatalogueStore`/`ExceptionReviewList`, route grep in `src/App.tsx`, orphan census `node scripts/verify-readme-stats.mjs --list` → 87 orphans). Full gate suite not re-run in the audit sandbox (no `node_modules`) — Phase 0 exists precisely to re-establish that baseline.*
