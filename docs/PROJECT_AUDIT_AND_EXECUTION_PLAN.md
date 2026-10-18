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
>
> ---
>
> ## 0. v2 revision — why v1 of this plan was incomplete, and what changed
>
> **Owner ruling, 2026-10-18: "ONE RULE FOR THIS PROJECT — ZERO COMPROMISES."**
> v1 of this plan failed that rule in four ways, stated plainly so they are
> never repeated:
>
> 1. **It deferred most of the product.** PLAN / MODEL / REPORT depth, sector
>    packs, AI, server, collaboration and platform work were labelled
>    "frozen / P2 / later" with no completion criteria. Under
>    zero-compromise, _deferred without a completion definition is just
>    unplanned._ v2 gives every pillar, every route class and every engine
>    cluster a disposition and an exit gate (§14–§18). Sequencing still
>    matters — spine first — but nothing in the supported product is allowed
>    to remain undefined.
> 2. **It carried an incomplete flaw register.** v1 listed 6 P0s. The repo's
>    own evidence base is far larger: the Wave-6 zero-flaw audit
>    (16 P0 / 99 P1 / 62 P2, `docs/audit/WAVE6_ZERO_FLAW_AUDIT_2026-08-24.md`),
>    the all-in-one distance report (`ALL_IN_ONE_GAP_REPORT_2026-08-25.md`),
>    `09_KNOWN_GAPS.md` (87 orphan engines, unwired staging pipeline, dead
>    service layer, 60 GL pages with no engine), risks R-001…R-013 and the
>    capability matrix's per-route UNVERIFIED grades. v2 consolidates **all**
>    of it (§15) — a flaw that is known anywhere in this repo is tracked in
>    this plan or explicitly retired with evidence.
> 3. **It had no definition of "project complete".** v1 ended at a roadmap.
>    v2 defines the finish line measurably (§19): supported-scope statement,
>    per-pillar ENTERPRISE-READY evidence, a parallel-run acceptance
>    (tool vs the owner's manual process, on real months, tied to the cent),
>    and a release gate. "Complete" is a ceremony with evidence, not a claim.
> 4. **It under-specified the target product.** "Most advanced and smart
>    all-in-one FP&A" is now a concrete functional taxonomy (§14): data,
>    close, analysis, planning, modelling, reporting, governance, AI,
>    sectors, platform — each with the capabilities a serious FP&A tool is
>    expected to have, and the state of each in this tree.
>
> **Zero-compromise, defined operationally (the ZC gates, §17):** no mock or
> fabricated figure in a supported path; no claimed capability without a
> consumer and a test; no float money math; no silent discard; missing never
> rendered as zero; no export that does not tie to the screen; no
> non-determinism in calculation paths; no UNVERIFIED grade inside the
> supported scope. Any exception requires an owner DEC — never an agent's
> quiet judgement. Where v1 and v2 conflict, **v2 wins**.

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

| Job    | In plain language                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------- |
| **J1** | One Dynamics 365 GL dump goes in; one trusted workspace comes out. No spreadsheet round-trip.         |
| **J2** | The tool finds the potentially wrong entries — exhaustively, with evidence.                           |
| **J3** | The tool turns a finding into a correction the accounts team can act on, and tracks it to "fixed".    |
| **J4** | The tool does the day-over-day / month-over-month / year-over-year comparison, at entry-level detail. |

### 1.1 Owner decisions recorded 2026-10-18 (DEC-015 → DEC-018)

The owner was asked four scoping questions and answered **expansively** on all four.
These answers are policy now, and are recorded in
[`docs/discovery/decision-log.md`](discovery/decision-log.md):

| Decision                                         | Owner's answer                                                                             | What it means in practice                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEC-015 — D365 scope: ALL**                    | Support every D365 GL export shape, not one.                                               | The importer stays **mapping-driven** and must handle: (a) D365 Finance & Operations "General ledger statement by main account" (separate Debit/Credit, voucher, `Ledger account` with dimensions), (b) F&O `GeneralJournalAccountEntryEntity` shape, (c) Business Central `G/L Entries`, (d) trial-balance snapshot files — _recognised and refused as a GL dump, with a reason_, (e) generic mapped CSV/XLSX from any other D365 report/Excel add-in. "Verified D365 support" for a shape still requires one real anonymised sample of that shape (DEC-001/DEC-013 stand). |
| **DEC-016 — Surfaces: ALL**                      | Build the exception queue **and** the comparison workspace **and** prove the import spine. | "All" is a destination, not a parallel work order. Build order is forced by dependency, not preference: spine (J1) → exception queue (J2) → correction hand-off (J3) → comparison workspace (J4). Each surface is built only when the layer beneath it is proven by tests.                                                                                                                                                                                                                                                                                                   |
| **DEC-017 — Materiality: EVERYTHING**            | Flag everything; hide nothing behind a threshold.                                          | Every account × period difference and every rule hit is **listed**. Thresholds may _rank and tier_ findings (Tier 1/2/3 in §7), they may never _suppress_ a row. Default view shows all, sorted by size; filters are the user's choice, never the tool's. Thresholds stay configurable per rule.                                                                                                                                                                                                                                                                             |
| **DEC-018 — Hand-off: Excel + in-tool tracking** | Accounts team gets an Excel correction list; status is tracked inside the tool.            | The correction lifecycle is `REQUESTED → APPLIED (confirmed by a human) → RE-VERIFIED` (the fix is visible in a later import). Nothing auto-marks a correction fixed. The Excel list and the in-tool tracker read the _same_ store records — never two copies of the truth.                                                                                                                                                                                                                                                                                                  |

### 1.2 Non-negotiable interpretation rules

1. **A flag is a review candidate, never an "error", "wrong entry" or "fraud"** — until a human disposition says so. UI copy, exports and rule names obey this. The owner _suspects_; the tool _evidences_; the human _decides_.
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
  - **J1:** No real D365 export has ever been imported. Every D365 claim rests on synthetic fixtures (`GLUploadPage.d365.integration.test.tsx`). The D365 _connector_ targets Dataverse CRM entities (`accounts`, `contacts`, `invoices` — `src/services/api-integration/DynamicsConnector.ts`), not F&O/BC general ledger, and is wired to no page.
  - **J2:** A 5-rule exception catalogue exists (`src/store/exceptionRuleCatalogue.ts`, R-001…R-005) and review card/list components exist (`src/components/exceptions/`) — but **no page or route consumes them**. Today the owner cannot see a single finding in the running app. There is no rule _runner_ that evaluates the catalogue against the ledger.
  - **J3:** The correction data layer is done (assignee, due date, instruction, status, audit trail — `src/types/exceptions.ts`, FR-010 store half). **No Excel correction export and no tracker UI exist.**
  - **J4:** **No comparison workspace exists** (FR-011: "Not built"). Variance surfaces exist (`/variance`, Budget-vs-Actual) but they compare budget-vs-actual by account-category prefix, not day/month/year actuals side-by-side at account × period with drill-to-entry.
- Structural risks: **87+ orphan engines** (README-measured: 95 reachable of 182 at last script run), 242 routes for a single-user month-end workflow, an Express server no frontend module calls, a Tauri relational schema (35 tables) the client never writes, and desktop offline sign-in still unresolved (DEC-014 mechanism chosen, implementation pending).

**The strategy this plan enforces:** finish and prove the spine on synthetic-then-real D365 shapes, then build J2 → J3 → J4 in that order, and only then widen into the broader all-in-one FP&A pillars (PLAN / MODEL / REPORT depth). Scope before spine is the exact failure mode that killed this codebase's predecessors (see `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md` §0).

---

## 3. Measured inventory (2026-10-18)

Commands: `find src -name "*.ts" -o -name "*.tsx" | wc -l`, `grep -c "<Route" src/App.tsx`,
`grep -rhoE "^\s*(it|test)\(" src server --include="*.test.*" | wc -l`, `du -sh`.

| Area               | Measured                                                                                                                        | Note                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Stack              | Tauri 2 + React 19.2 + TypeScript 5.9 (strict) + Vite 8 + Tailwind 4 + Zustand 5/Immer                                          | `package.json`; Node 22 target                                                                |
| `src/` files / LOC | 2,545 files / ~511,804 lines                                                                                                    | includes tests                                                                                |
| Routes / pages     | 242 `<Route>` in `src/App.tsx` / 216 page modules                                                                               | route consolidation is P1, not P0 (§9)                                                        |
| Engines            | 193 top-level modules in `src/engines`                                                                                          | ~half unreachable from runtime (orphan census: `node scripts/verify-readme-stats.mjs --list`) |
| Stores             | 48 non-test modules in `src/store`; 42 persisted as encrypted JSON blobs via `masterStorage`                                    | relational SQLite schema unused by client                                                     |
| Components         | 294 non-test `.tsx` under `src/components`                                                                                      | incl. 18 sector packs                                                                         |
| Services           | 75 modules; 9 ERP/connector classes                                                                                             | none wired to a page                                                                          |
| Workers            | 5 (consolidation, Monte Carlo, batch calc, storage, GL staging)                                                                 |                                                                                               |
| Tests              | 1,430 test files, ~15,093 `it/test` cases                                                                                       | last full green run: 2026-10-17, Node v22.22.3, `npm run check` 8/8 shards (dated history)    |
| Server             | Express + SQLite, JWT/RBAC/tenancy, 12 route modules in `server/src/routes`                                                     | **no frontend caller**; not bundled with desktop app                                          |
| Desktop shell      | Tauri 2, 3 Rust modules, 3 SQL migrations                                                                                       | reported `NATIVE-UNVERIFIED` from any sandbox without Rust                                    |
| Docs               | 437 markdown files under `docs/` (514 repo-wide)                                                                                | one live set per DEC-011; `docs/archive/` is provenance only                                  |
| Exports today      | Excel (`exceljs`), PDF (`jspdf`), editable PPTX (zero-dep OpenXML generator in `src/services/export/financialPackageExport.ts`) | board-pack XLSX+PPTX tie-out tested; PDF leg + most other surfaces untested                   |

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
- **A-02 (P0-adjacent risk).** Persistence is whole-store encrypted JSON blobs in one KV table. It works, but it caps J4: day/month/year comparison across many imported months needs period-indexed queries, not whole-blob scans. DEC-005 names relational SQLite as the target; migration is blocked on native verification. _Do not start the migration inside a feature PR_ — it is its own phase (§10, Phase 6).
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

| ID     | Gap                                                                                                                                                                                               | Severity                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IMP-01 | No real export of _any_ D365 flavour has been imported. DEC-015 now requires **all** flavours; each flavour's "verified" claim needs one anonymised sample.                                       | **P0** (owner input)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| IMP-02 | The export's _own_ control totals (the totals the owner reads in D365) cannot be entered/compared — reconciliation is internal-only (FR-004 open half).                                           | P1 — **CLOSED 2026-10-18**: owner-entered expected rows/debit/credit at Preview → `reconcileControlTotals` (decimal-exact, grouped formatting tolerated, unparseable expected figure throws, never zero) → batch carries `reconciled / mismatch (signed differences) / not-provided` on the result _and_ persisted history; Done step states the verdict in words. A mismatch never blocks import and never earns "reconciled". Evidence: helper + store + wizard tests (340 in data/import/provenance suites) |
| IMP-03 | No saved mapping profiles. A monthly repeat import re-does mapping; DEC-015 multiplies this by flavour. Mapping must be saveable per flavour/source and re-applied automatically on header match. | P1 — **CLOSED 2026-10-18**: `MappingProfile` in `glUploadStore` (persisted v2 with migration, signature = normalised sorted header set, upsert-by-signature, delete); wizard auto-applies a matching profile (user's corrected mapping beats the built-in dictionary) and can save the current mapping by name from the Map step. Evidence: store tests 15/15, wizard IMP-03 tests (auto-apply unlocks Preview on an unmappable-by-dictionary column; save persists `MainAccount` mapping)                     |
| IMP-04 | `DynamicsConnector` is Dataverse CRM, not GL. Any future direct D365 pull (F&O OData / BC API) is a new connector, DEC-gated, and **not** required for v1 — file import is the contract.          | P2 (defer)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| IMP-05 | Trial-balance snapshot files must be _recognised and refused as GL dumps_ with a clear reason (they are balances, not transactions) — part of DEC-015(d).                                         | P1 — **CLOSED 2026-10-18**: `detectTrialBalanceSnapshot` (balances present + no posting-date column) refuses the file by name in the wizard (CSV + XLSX), imports nothing; F&O "GL statement by main account" shape is now also detected/auto-mapped/parsed. Evidence: `d365Parser.test.ts` 27/27, `GLUploadPage.d365.integration.test.tsx` refusal test, import regression set 192/192                                                                                                                        |

### 5.2 Trial balance, statements, period close (CLOSE pillar)

**Exists:** `generateTrialBalance` (debits = credits enforced per journal batch in `validateEntries`, FP-0002), GL Trial Balance / GL Explorer / GL Journals pages with a Source (provenance) column, P&L / Balance Sheet / Cash Flow / Three-Statement pages with money tests and oracle tests (`financialStatementOracles.test.ts`), period-close state machine (`periodCloseStore`, checks, reopen-with-reason).

**Gaps:** sign-presentation rules per account type live inside engines, not one documented contract (P1); fiscal calendar vs calendar month is still an open discovery question (Q11–Q14 in `current-workflow.md`) — **never assume fiscal = calendar**; closed-period write guards are partial across all write surfaces (DEC-008).

### 5.3 J2 — Finding the wrong entries

**Exists:** versioned rule catalogue R-001…R-005 (variance / spike / drop patterns, `ruleId@version`, supersede-with-link), deterministic finding keys, disposition store with append-only audit trail, correction requests (FR-010 store half), `ExceptionReviewCard`/`ExceptionReviewList` components with severity filters, plus an unwired `AnomalyDetectionEngine`/`AnomalyExplainer`.

**Missing — this is the largest product gap in the repo:**

| ID     | Gap                                                                                                                                                                                                                                                                                             | Severity                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| EXC-01 | **No rule runner.** Nothing evaluates the catalogue against `glStore` entries to produce findings. The catalogue has zero consumers (`grep useExceptionRuleCatalogueStore` → definition only).                                                                                                  | **P0**                                  |
| EXC-02 | **No route/page renders the review queue.** Components exist; no page imports `ExceptionReviewList`.                                                                                                                                                                                            | **P0**                                  |
| EXC-03 | The 5 rules are all _aggregate variance_ rules. The owner's actual hunt is **entry-level**: duplicates, wrong-period postings, reversals without counterparts, round-sum entries, missing descriptions, wrong-account patterns, backdated/weekend postings, one-sided journals… (§7 catalogue). | **P0** for the job, built incrementally |
| EXC-04 | No planted-exception answer key (synthetic company with known wrong entries) to measure recall/false-positives. Domain rules require it before any rule is called "working".                                                                                                                    | P1                                      |
| EXC-05 | Findings must carry source-row evidence (batch · row) end-to-end into the queue UI — the data model supports it (`evidenceRows`), no producer exists.                                                                                                                                           | P1                                      |

**Language law (repeat of §1.2.1):** flags are "potential exceptions / review candidates". The moment UI copy calls a flag an error, the tool has accused the accounts team without evidence. This is a testable copy rule, not a style preference.

### 5.4 J3 — Guiding the accounts team to fix it

**Exists (store half, FR-010):** `CorrectionRequest` — instruction + assignee (both refused when empty), due date through the calendar-checked parser (`2026-02-30` refused; agreed absence = `null`, never "today"), source locator (`batch · row`), status `REQUESTED → APPLIED / WITHDRAWN` set only by explicit human action, append-only correction audit trail, v1→v2 blob migration.

**Missing (DEC-018 defines the target):**

| ID     | Gap                                                                                                                                                                                                                                                                                                    | Severity      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| COR-01 | No Excel correction-list export (one row per finding: entry locator, what's suspected, what to change, evidence figures, assignee, due date, status). Must consume the same store records the screen shows — never recompute.                                                                          | **P0** for J3 |
| COR-02 | No correction tracker UI (list, filter by assignee/status/ageing, follow-up).                                                                                                                                                                                                                          | P1            |
| COR-03 | No **re-verification**: when the next import lands, the tool should check whether a corrected entry's fix is actually visible (e.g. original entry reversed / amount changed) and propose `RE-VERIFIED` — a human confirms. This closes the owner's loop and is the feature no spreadsheet gives them. | P1            |
| COR-04 | `APPLIED` must stay human-set. No import-side auto-flip; the tool may _suggest_, never _assert_ "fixed".                                                                                                                                                                                               | rule          |

### 5.5 J4 — Day / month / year comparison "in extreme detail"

**Exists to build on:** fiscal-calendar engines, period logic in report builders, Budget-vs-Actual and `/variance` pages, statement views, GL Explorer drill-to-source rows. `VarianceDecompositionEngine`/`VarianceAttributionEngine` exist; the Variance page itself rolls up by account-code prefix categories with canned driver labels ('Pricing pressure', 'Hiring ahead of plan') — **those labels are hypotheses presented as causes and must not be copied into the comparison workspace** (fabrication risk, NFR-002).

**Missing:** the comparison workspace itself (FR-011). Its contract (§8) is the heart of the owner's daily work and the most detail-sensitive surface in the product: account × period grid, DoD/MoM/YoY columns, money + % deltas with stated sign convention, every figure drillable to its contributing entries, "not in file" for uncovered periods, and — per DEC-017 — **every** difference listed, tiered by size, never threshold-hidden.

### 5.6 REPORT pillar — outputs

**Exists:** board pack with screen→Excel tie-out pinned cell-by-cell by test (`BoardPackPage.exportTieOut.test.tsx`), XLSX **and** editable-PPTX tie-out at service level (`boardPackTieOut.integration.test.ts`), PDF via `jspdf`.

**Gaps:** PDF leg of the tie-out triangle untested (REP-01, P1); most other export surfaces have no tie-out test and at least six published a percentage as a currency cell (P1-14, partially closed 2026-10-18 for six pages); exports must always consume the screen's calculation objects, never recompute.

### 5.7 PLAN / MODEL pillars — the wider "all-in-one"

Budgets, forecasts, scenarios, consolidation (exact-string pipeline, FX/CTA, IC elimination), revenue/leases/tax/debt/workforce engines largely **exist as code**; roughly half the engines are orphaned and several sector pages are template clones of one GL-stats body (`docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`). Verdict: **BUILT-wide, CONNECTED-thin, GOVERNED-unverified** (per `CAPABILITY_TRUTH_MATRIX.md`: every route's Connected/Governed/Enterprise-ready = UNVERIFIED). These pillars are _depth on top of the spine_ — frozen until the spine phases exit (§10), then hardened one workflow at a time with evidence, never by page count.

### 5.8 Cross-cutting audit

| Area          | Finding                                                                                                                                                                                                              | Severity    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Money         | Primitive correct; `GLEntry.debit/credit/amount` still JS `number` (`src/types/index.ts:719-724`); adoption ~29 % at last script run                                                                                 | P1          |
| Determinism   | Ratcheted (344 sites / 79 files at last recording); new calc code must add zero                                                                                                                                      | P1          |
| Fabrication   | Some pages shipped canned drivers/sample figures as if real; fabrication + mock-data audits exist but are scope-limited                                                                                              | P1          |
| Persistence   | Encrypted blob KV works for single-user v1; blocks period-indexed comparison queries at scale (DEC-005 target: relational SQLite, native-verification blocked)                                                       | P1          |
| Server        | Express JWT/RBAC/tenancy built, tested, **no frontend caller**, not bundled                                                                                                                                          | P2 (freeze) |
| Desktop auth  | Offline sign-in unresolved; DEC-014 cached-session mechanism chosen, implementation pending                                                                                                                          | P1          |
| AI            | Copilot/NLQ/commentary exist; no verified-facts gate, egress not chokepointed (AI-001). AI never computes/posts numbers                                                                                              | P2 (defer)  |
| Security      | Local-first (DEC-003); Sentry/PWA egress means "fully offline" may not be claimed; no data may leave the machine by default                                                                                          | P1          |
| Performance   | ~512k LOC, large bundle risk; large-GL (100k+ rows) behaviour must be proven with the bench suite before J4 ships                                                                                                    | P1          |
| Accessibility | a11y test suites exist; every new surface ships the five states (loading/empty/error/partial/success) + keyboard/focus + non-colour signals                                                                          | gate        |
| CI            | 9 workflows in `.github/workflows/`; `main` CI history must be checked with `gh run list` before any "green" claim — never assumed                                                                                   | gate        |
| Docs          | 437 docs under `docs/`; one live set (DEC-011), archive is provenance. Doc sprawl is a recurring failure mode — this file must not become a second competing plan: it points at the registers, it does not copy them | rule        |

---

## 6. Consolidated findings register (what I fix, in order)

**P0 — the owner's job cannot be done end-to-end until these close:**

| ID    | Finding                                                                               | Closes job |
| ----- | ------------------------------------------------------------------------------------- | ---------- |
| P0-01 | No D365 shape is verified against a real export; all flavours unproven (IMP-01)       | J1         |
| P0-02 | No exception rule runner: catalogue (R-001…R-005) has zero consumers (EXC-01)         | J2         |
| P0-03 | No exception review queue page/route (EXC-02)                                         | J2         |
| P0-04 | Rule catalogue lacks entry-level wrong-entry rules (EXC-03)                           | J2         |
| P0-05 | No comparison workspace: DoD/MoM/YoY at account × period with drill-to-entry (FR-011) | J4         |
| P0-06 | Correction hand-off has data but no Excel export and no tracker (COR-01)              | J3         |

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
- **No invented drivers.** The grid shows _what moved and by how much_; "why" is the reviewer's disposition text, or a rule's stated formula — never canned labels.
- **Performance bar:** 100k-entry ledger, grid + drill interactive; proven by bench/load suite, not by opinion.

### Phase 3 — scoped 2026-10-18

Assets in tree: catalogue R-001…R-005 (aggregate rules, data only), finding
model + deterministic keys, disposition store with audit + correction
types, `ExceptionReviewCard/List` components. Missing: a runner that
evaluates rules over the GL, catalogue v2 entry-level rules (§7), and a
queue page/route. Build order: catalogue v2 (R-006…R-017 with tiers) →
pure deterministic runner (`src/services/exceptions/runExceptionRules.ts`)
→ planted-exception answer-key fixtures (recall + false-positive report,
run twice identical) → `/data/exceptions` queue page reusing
`ExceptionReviewList`. R-001…R-005 aggregate evaluators need prior-period
baselines and land with the Phase 4 comparison workspace; until then they
stay catalogue-only and the queue says so — a rule that cannot run is never
presented as running.

**Phase 3 progress 2026-10-18 (code side closed):** catalogue v2
(R-006…R-017, tiers 1–3) + deterministic runner
(`src/services/exceptions/runExceptionRules.ts`, every entry examined,
exact-decimal, options recorded on the run) + `/data/exceptions` queue
page reusing `ExceptionReviewList` (dispositions persist by findingKey;
nav + help coverage wired). Answer-key evidence: planted ledger produces
exactly the 19 expected finding keys, clean ledger zero, run-twice
identical, MAD outlier median-exact. Remaining Phase 3 honesty items:
R-001…R-005 aggregate evaluators land with Phase 4 baselines; correction
requests from ACCEPTED findings are Phase 5 (store types already exist).

**Phase 4 progress 2026-10-18 (code side closed):** comparison engine
(`src/services/comparison/buildComparison.ts`) — day/month/year grains,
natural-sign figures, null = "not in file" (never zero, never −100%),
labelled prior fallback, per-period coverage (entries, days present/in
period, batches), exhaustive |Δ| sort, drill selector; 100k-entry bench
green. Workspace page `/data/comparison` (grain switch, period anchor,
coverage on column headers, exact-account drill via extended
`/drill-down`). Aggregate rules R-001…R-004 now evaluate monthly
baselines in the exception queue. Still open: comparison Excel/PDF
export with the same figures (Phase 9 tie-out), entity/dimension
columns when files carry them (import mapping today carries entityId on
entries — grid columns land with the first owner file that uses them),
period-aware TB presentation on the TB page (engine now exists).

## 9. Target design — J3 correction hand-off (DEC-018)

- **Excel correction list** generated from the disposition/correction stores (same records as the screen): finding key, rule id, account, date, amount, source locator (file · batch · row), suspected issue in plain language, correction instruction, assignee, due date, status. Percentages formatted as percentages, money as money (the P1-14 lesson).
- **Tracker:** in-tool list with status ageing; only humans set `APPLIED`; on a later import the tool may attach a _proposed_ re-verification (e.g. "reversal of batch 7 · row 214 appears in batch 9") which a human confirms to `RE-VERIFIED`.
- The Excel file is a working document for the accounts team, not a report: they can return it with status updates, and re-importing that status sheet is a Phase-5 nicety — **not** v1 scope.

**Phase 5 progress 2026-10-18 (code side closed):** correction lifecycle
enforced in the store (REQUESTED → APPLIED → REVERIFIED, WITHDRAWN from
open states, terminal states locked, re-request is the audited restart);
Excel correction list generated from the tracker records and tied to them
field-by-field by test (`src/services/corrections/buildCorrectionList.ts`);
tracker page `/data/corrections` (create from ACCEPTED findings, ageing,
human-only status actions, Excel export); re-verification proposals when
an APPLIED finding goes quiet — proposed by the tool, confirmed only by
a human click. The spine J1 → J2 → J3 → J4 is now connected end to end.
Remaining: Phase 6 platform truth (offline auth DEC-014, persistence
DEC-005 execution, PDF tie-out leg, CI on main, key-escrow DEC).

## 10. Roadmap — phases, gates, exit evidence

Work top-to-bottom. A phase starts only when the previous phase's exit evidence exists.

| Phase                                 | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Exit evidence                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **1 — progress 2026-10-18**           | Closed so far: shard-1 baseline failures fixed (F-L); F&O GL-statement shape detected/mapped/parsed + TB-snapshot refusal (IMP-05); source-side control totals (IMP-02); saved mapping profiles (IMP-03); headerless CSV by position with row-1 provenance. Still open in Phase 1: BOM/thousands/total-row fixtures are covered by existing tokenizer/parser tests (cited, not re-proven this session); per-shape **real-sample** verification is Phase 1V (owner input). **Full-suite exit tally DONE 2026-10-18: `npm run test:sharded` = 8/8 shards PASS in 1186s (shard 3's count line was not rendered by the runner summary; the shard is marked PASS and the runner exits non-zero on any shard failure).** Phase 0 exit and the code side of Phase 1 are closed; Phase 1V awaits owner samples. | Commits `ad4300a`, `b096a8e`, `804f532`, `3ef5230` + headerless commit; targeted suites cited per commit        |
| **0 — Baseline**                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `npm ci`, full `npm run check` tally recorded; orphan/route census refreshed                                    | Pasted gate tallies in the handover; this doc's §3 numbers re-measured |
| **1 — Universal import (J1)**         | All DEC-015 shapes detected/mapped; TB-snapshot refusal (IMP-05); saved mapping profiles (IMP-03); source-side control totals entry (IMP-02); fixtures per shape incl. BOM, no-header, thousands separators, total rows, `dd-MMM-yyyy`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Per-shape fixture tests green; synthetic file of each shape imports atomically with provenance + control totals |
| **1V — Owner validation**             | Owner imports one real anonymised file per shape they use; D365-side totals reconciled to the cent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Owner-confirmed reconciliation; only then may docs say "verified" for that shape                                |
| **2 — Trusted views**                 | TB/statements sign contract documented + oracle tests; drill-to-source from every statement figure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Oracle tests; statement figure → entries trace test                                                             |
| **3 — Exception engine + queue (J2)** | Rule runner over `glStore`; catalogue v2 (§7); queue page reusing `ExceptionReviewList`; dispositions persist; answer-key fixtures                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Planted-exception recall/false-positive report, run twice, identical output                                     |
| **4 — Comparison workspace (J4)**     | §8 contract, all three grains, drill-through, coverage honesty                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Independent recalculation tests per grain; "not in file" state tests; bench at 100k entries                     |
| **5 — Correction loop (J3)**          | Excel correction export (tie-out to store), tracker UI, re-verification proposals                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Export tie-out test (store == Excel); lifecycle tests; no auto-`APPLIED` path exists                            |
| **6 — Platform truth**                | Offline auth (DEC-014); persistence decision executed (DEC-005); PDF tie-out (REP-01); CI on `main` green                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `gh run list` green; offline sign-in test; screen == Excel == PDF test                                          |
| **7 — All-in-one depth**              | PLAN/MODEL/REPORT hardening one workflow at a time; orphan wiring-or-freeze decisions; route consolidation 242 → owner's working set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Per-workflow Connected evidence in the capability matrix                                                        |
| **8 — Optional**                      | Direct D365 connector (new DEC), AI commentary behind verified-facts gate (AI-001), team/server use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Own DEC + acceptance criteria before any code                                                                   |

**Phase 6 progress 2026-10-18:** DEC-014 offline sign-in implemented
(cached session in the auth store, 30-day clock expiry, revoke-and-wipe,
device-profile binding v1 — OS-user binding awaits the native Tauri OS
plugin); REP-01 screen == Excel == PDF tie-out test added for the
correction hand-off (real Excel writer read back; PDF table captured at
the renderer sink); T3 100k-row GL load bench added
(`glStore.loadBench.test.ts` — measured 2026-10-18: setEntries(100k)
1283ms, period totals 100ms in this sandbox). Still open in Phase 6: CI
green on `main` (main's own test-unit run is red at the base commit;
the branch PR + merge is the owner action), the key-escrow owner DEC
(engine + store exist, 25/25 tests, deliberately no UI wiring until the
policy is decided), DEC-005 SQLite migration (native-blocked).

**Phase 7 progress 2026-10-18 (slice 1):** forecast backtesting harness
(`src/services/forecast/backtestForecast.ts`) — walk-forward scoring of
the existing forecast methods (naive/SMA/SES/linear) against held-out
actuals with MAE/RMSE/MAPE, zero-actual exclusions counted, honest
INSUFFICIENT_HISTORY refusal, plus a GL adapter that discloses missing
months instead of zero-filling them. Monte-Carlo seeded determinism was
already tested. Cascade sentinel pass DONE 2026-10-18: all eight shipped sector
templates evaluated in the real DriverCascadeEngine (sentinel cells,
drivers driven to 2x default) — zero formula errors, every rule moves
its cell; the pass caught a real defect: the real-estate cap-rate
valuation formula used a ternary operator the SafeMathParser cannot
evaluate, so property value could never cascade; the formula is now
parser-supported and a zero cap rate surfaces as an error instead of
silently zeroing the value. Scenario→3-statement impact DONE 2026-10-18
(`src/services/scenario/scenarioImpact.ts`): scenarios scale the GL
entries (exact code or prefix, first match wins, cent-rounded) and both
statement sets are re-derived by the same deriveThreeStatement the
reports use; a scenario that breaks double-entry reports its exact
imbalance with balanced:false — never plugged. Remaining in Phase 7:
rolling-forecast wire-or-retire, plan approval workflow, backtest UI
wiring, budget version diff tests, scenario UI wiring (WhatIfPage
assumptions are still not GL-derived).

**Frozen until Phase 4 exits:** new routes, pages, engines, stores, sector packs, connectors (AGENTS.md rule 8). Repairs, tests, guards and ratchet-lowering are always welcome.

### Phase 2 — scoped 2026-10-18 (read-only, before failing tests)

Measured current state (code read this session, witnesses owed by tests):

- **F-P2-01 (P0 for J1→J4 trust): statement classification is hard-coded
  account-code prefixes, not account type.** `computeProfitLoss`
  (`src/pages/reports/ProfitLossPage.tsx:32`) classifies revenue/COGS/expense
  by `accountCode.startsWith('4'/'5'/'6')`; `computeBalanceSheet`
  (`src/pages/reports/balanceSheetData.ts`) by `'1'..'8'` incl. interest `'7'`
  and tax `'8'`. D365/BC main accounts are owner-defined (DEC-015), so a real
  COA silently yields empty or wrong statements. The BS at least surfaces
  `unclassifiedCount/unclassifiedMovement`; the P&L hides everything
  unclassified. Fix: classify by `GLAccount.type` (glStore is DEC-012
  authoritative); prefix only as an explicit, labelled fallback when type is
  `Unknown`; unclassified movement always shown, never dropped.
- **F-P2-02: the P&L destroys signs.** COGS/expenses pass through `Math.abs`
  (a credit-heavy expense account — refunds exceeding postings — displays as
  positive expense) while revenue is signed. One signed convention
  everywhere: debit-normal `Dr−Cr`, credit-normal `Cr−Dr`, negatives shown
  as negatives.
- **F-P2-03: the canonical sign engine is unused.**
  `src/engines/SignConventionEngine.ts` (natural sign, contra set, variance
  favourability) has zero consumers in pages/components/store, and its
  contra set is itself hard-coded US-style codes. Phase 2 adopts one
  documented sign contract (natural balance by account type; contra by
  account type/flag, not code list), wires the statements + TB to it, and
  deletes or demotes the orphan engine per the wire-or-retire rule.
- **F-P2-04: TB "Beginning Balance" is always 0.**
  `glStore.generateTrialBalance` seeds `beginningBalance: toDecimal(0)` and
  `endingBalance = beginning + netChange` over **all** entries; the cube path
  (~`glStore.ts:1496`) repeats it with `accountName: ''`. With complete
  history that is an inception balance, but the page presents
  Beginning/Net-change/Ending without saying so, and there is no as-of or
  period TB (Phase 4 depends on one). Phase 2 labels honestly and adds the
  period-aware computation the comparison workspace will consume.
- **F-P2-05: drill-to-source exists for TB rows only** (Eye → journals /
  account analysis by `accountId`). Statement headline figures (P&L/BS
  totals and lines) are not drillable; `/drill-down` is linked only from
  dashboard KPIs. Phase 2 exit requires a figure→entries trace test: pick a
  statement figure, list its contributing entries, re-sum independently,
  tie to the cent.

Phase 2 work order (failing-test-first each): (1) sign contract documented
in `docs/product/` + oracle tests against `SignConventionEngine` semantics;
(2) type-based classification for P&L + BS with unclassified honesty;
(3) remove `Math.abs` sign destruction; (4) TB period/opening honesty;
(5) drill from every statement figure + trace test.

**Phase 2 progress 2026-10-18 (code side closed):** sign & classification
contract documented (`docs/product/STATEMENT_SIGN_CONTRACT.md`) and
implemented once in `src/utils/accountClassification.ts` (type beats prefix,
signed natural balances, unclassified always reported; natural signs pinned
against `SignConventionEngine`). P&L extracted to `profitLossData.ts` and
rewritten on the resolver (`Math.abs` removed, interest/tax inside total
expenses); balance sheet on the resolver; cash-flow Net Income now IS the
P&L's (articulation test); report-book export builders delegate to the same
computations (screen == export). Import derives the account master
(classifiable codes only — no fabricated types), so trial-balance rows
carry real types. Drill-to-source: P&L/BS class figures → `/drill-down`
`statementClass` resolution; figure→entries trace test pins the tie. TB
page states its all-imported-entries basis on its face (F-P2-04 label
slice). **Still open:** F-P2-06 cash-flow two-digit layout lines + 'deprec'
description matching await account-master cash-flow categories (Phase 9);
F-P2-07 BvA export builder still uses per-entry `Math.abs` actuals and
prefix favourability (Phase 7); period-aware TB (opening/activity/closing
by period) is Phase 4's to build on this contract.

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
7. Any accounts that should _always_ be reviewed regardless of movement (e.g. suspense, related-party)? They become Tier-1 watchlist rules.

## 13. Risks

| Risk                                                         | Mitigation in this plan                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Building breadth before spine (the predecessor failure mode) | Phase freeze (§10); DEC-016 order                                                               |
| "Verified D365" claimed from documentation alone             | DEC-001/013/015: verified only per-shape, only after a real sample reconciles                   |
| Threshold creep quietly hiding differences                   | DEC-017: suppression is a test failure, not a setting                                           |
| Accusing the accounts team on a false flag                   | Candidate language law; disposition before "wrong"; answer-key false-positive bar               |
| Blob persistence caps comparison scale                       | Phase 6 persistence decision; bench gate in Phase 4                                             |
| Doc sprawl creating competing plans                          | This plan points at registers/decisions; it owns goal, audit, sequence, and working method only |

---

_Audit evidence for this document: file/line citations were read directly from the tree on 2026-10-18 (`src/types/index.ts:719-724`, `src/services/api-integration/DynamicsConnector.ts`, `src/store/exceptionRuleCatalogue.ts`, consumer greps for `useExceptionRuleCatalogueStore`/`ExceptionReviewList`, route grep in `src/App.tsx`, orphan census `node scripts/verify-readme-stats.mjs --list` → 87 orphans). Full gate suite not re-run in the audit sandbox (no `node_modules`) — Phase 0 exists precisely to re-establish that baseline._

---

# Part II — The complete zero-compromise completion blueprint (v2)

_§1–§13 remain in force (goal, spine audit, J1–J4 designs, working method). Part II removes every "out of scope / later / undefined" from the project's future. Sequencing is still spine-first (DEC-016); Part II defines the destination for everything._

## 14. The complete product — functional taxonomy and current state

Grades: **BUILT** (code exists) · **CONN** (wired to real data + states) · **GOV** (auth/audit/scope enforced) · **READY** (evidence-complete). A capability may not be _claimed_ above its evidenced grade. State summarised from the capability matrix, known-gaps and audit reports; per-route truth lives in `docs/CAPABILITY_TRUTH_MATRIX.md` and must be regenerated, never hand-edited.

### 14.1 DATA pillar — get every number in, safely

| Capability                                                                                | State today                                                                                                                                   | Completion definition                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D365 file import (all shapes, DEC-015)                                                    | BUILT (F&O-entity + BC), statement shape undetected, TB snapshot not refused                                                                  | §10 Phase 1 + 1V per-shape real-sample verification                                                                                                                                        |
| Generic CSV/XLSX import + mapping                                                         | BUILT, wizard uses `parseCSV`/`ExcelImportEngine`; a second staging/tokenizer pipeline exists unwired (DEC-012 keeps `glStore` authoritative) | One import path; staging pipeline either becomes the quarantine/audit channel in the UI or is retired by DEC                                                                               |
| Saved mapping profiles (IMP-03)                                                           | Missing                                                                                                                                       | Profiles per flavour/source, auto-applied on header match, versioned                                                                                                                       |
| Source-side control totals (IMP-02)                                                       | Missing (internal totals only)                                                                                                                | Owner-entered or file-carried totals reconciled to the cent before "reconciled" may display                                                                                                |
| Other ERP connectors (QuickBooks, NetSuite, Xero, Sage, Salesforce, Stripe, Plaid, Slack) | BUILT classes, **0 wired**, Dynamics = Dataverse CRM not GL                                                                                   | Each connector: wired UI + credential flow + contract tests + live-sandbox evidence, or labelled EXPERIMENTAL and excluded from supported scope. No connector is "supported" on code alone |
| Bank feeds / AR-AP sub-ledgers / operational inputs (POS/PMS/subscriber)                  | Missing native (gap report #3, #11)                                                                                                           | Native AR/AP ageing feeding cash/working capital, or explicit non-goal DEC                                                                                                                 |
| Data quality & lineage                                                                    | Engines exist (DataQuality, DataLineage, DataCatalog — orphaned)                                                                              | Every figure traceable figure→entries→batch→file·row; data-quality report per import                                                                                                       |
| Master data (COA, entities, dimensions, fiscal calendar)                                  | Partial; 3 fiscal-calendar implementations (`FiscalCalendar.ts`, `FiscalCalendarEngine.ts`, `temporal/fiscalCalendar.ts`)                     | ONE canonical calendar/COA/dimension service; duplicates retired                                                                                                                           |

### 14.2 CLOSE pillar — prove the books

Trial balance + tie-out (BUILT, tested) · period-close state machine (BUILT, write-guards partial — DEC-008 completion required on **every** write surface incl. undo/redo, budget mutators) · reconciliations GL↔sub-ledger (partial: bank rec page exists; GL↔AR/AP/IC recs to complete) · close checklist over real stage records · opening balances & reversals semantics (undocumented — owner Q in §12) · audit chain (three audit engines exist — `AuditEngine`/`AuditLogEngine`/`AuditTrailEngine` — one must be canonical).

### 14.3 ANALYZE pillar — explain and compare

Statements P&L/BS/CF + three-statement articulation (BUILT, oracle-tested — the strongest area) · J4 comparison workspace (missing → §8) · variance decomposition/attribution (engines BUILT, page uses prefix rollups + canned drivers — canned drivers must be purged, §5.5) · flux analysis (new: account×period movement pack feeding J2 Tier-3) · KPI dictionary with per-KPI definition, formula, oracle (partial) · drill-to-source everywhere (partial) · dashboards (BUILT-wide; sector KPI $0 flaw class must stay dead — unit-aware formatting gate).

### 14.4 PLAN pillar — budget, forecast, scenarios

Budgeting (list/detail/BvA BUILT) · driver-based planning (DriverLibrary/DriverCascade — Wave-6 P0-15 cascade-token flaw class needs a sentinel-evaluation pass over **all** templates) · rolling forecast (engine runtime-dead per 2026-10-15 audit — wire or retire) · forecast methods per account group **with backtesting** (absent: `grep backtest` = 0 — required before any forecast may be called "smart") · scenarios/what-if/sensitivity/Monte Carlo (engines BUILT; Monte Carlo worker exists) · workforce/CapEx/cash planning (BUILT partial; payroll pages had fabricated arrays — decontamination + fabrication ratchet extended to engines) · versioning & approval workflow for plans (partial).

### 14.5 MODEL pillar — the hard accounting

Consolidation exact-string pipeline (BUILT, tested; UI wiring per DEC-012) · FX translation/CTA ASC 830 (ADR-001; engines BUILT) · intercompany matching/elimination ASC 810 (engines BUILT) · revenue recognition, leases, debt, tax provision (BUILT partial; transfer-pricing TEST-NOT-FOUND) · three-statement integrated model (BUILT) · IRR/XIRR/NPV contract (Wave-6 P0-16 flaw class: non-convergence must throw/NaN, never guess) · spreadsheet/formula engine estate (many engines: Formula, SafeMathParser, ArrayFormula, cube/OLAP ×6 — canonical subset to be chosen, rest retired; batch-calc worker must never silently zero — W6-P0-01 class).

### 14.6 REPORT pillar — outputs that tie out

Board pack Excel+PPTX tie-out (BUILT, tested — extend to **every** supported export surface) · PDF tie-out leg (missing) · correction-list Excel (missing → §9) · report designer/book/scheduler (BUILT, governance unverified) · XBRL/regulatory reporting (engine orphaned, 0 callers — wire with availability semantics or retire) · commentary (AI-gated, §14.8).

### 14.7 ADMIN & GOVERN pillars — trust

Auth: offline cached session (DEC-014, unimplemented — P1) · RBAC enforcement on **every** mutator (W6-P0-14 class: dataStore mutators had zero RBAC; completeness test required) · SOX/audit families (engines exist, authority undecided — owner decision recorded 2026-10-17 pending) · audit trail reconstruction (R-009) · backup/restore + **encryption-key escrow/recovery** (W6-P0-05: key beside data = total-loss risk; OWNER DECISION, blocks any "your data is safe" claim) · data retention/deletion (GDPR events exist) · settings/integrations administration.

### 14.8 AI pillar — smart, but never a source of numbers

Copilot/NLQ/commentary (BUILT behind flags) · completion = verified-facts gate (AI-001): every number in AI text must resolve to an approved figure or the output is rejected, tested; egress chokepoint with explicit user action (DEC-003); anomaly explanation wired to J2 findings (AnomalyExplainer orphan today). AI ships OFF by default until the gate is proven.

### 14.9 Sector packs (18 industries)

Grades from the 2026-08-25 spot-check: mostly SHALLOW template clones (19 pages shared one GL-stats body; re-measured 2026-10-18: 60 GL pages import no engine, 20 compute inline). Completion per sector = engine-wired metrics with named definitions + money tests + missing-data disclosure (the Construction/Hospitality pattern), or the sector is EXPERIMENTAL in the supported-scope statement. `SectorDriverDashboard` becomes the canonical vertical pattern. No sector may display a KPI whose inputs it does not have (DEC-017's sibling: missing ≠ 0).

### 14.10 Platform

Desktop (Tauri): native menu inert flaw class (W6-P0-07), updater channel undecided (owner), offline sign-in (§14.7) · Browser/PWA: exactly one surface story must survive (owner decision from Wave-6) · Server: integrate for real (env origin + auth token, W6-P0-13 class) or label not-integrated — no fictional endpoints · Plugins/marketplace: sandbox must be wired into the loader and pass computed-key escape tests (W6-P0-02/03), or marketplace claims are pulled · i18n en/ar parity (sound today — keep the parity test) · design system: palette migration 5,548 raw utilities / 373 files to zero in supported paths; ConfirmDialog mounted with queued confirms (W6-P0-08) · performance: selector-less subscriptions purged, heavy math in workers (wired, with progress + error channels — never silent zero), bundle budgets enforced · accessibility WCAG-AA on supported routes (a11y suites exist; populated-state coverage to complete).

## 15. The complete flaw register (consolidated — nothing known stays untracked)

Sources consolidated, not re-invented: Wave-6 register (16 P0/99 P1/62 P2), Wave-7 closure record (7A–7D batches closed the code P0s failing-test-first; remaining items owner-gated), the Aug-25 gap report, `09_KNOWN_GAPS.md`, risks R-001…R-013, and this audit. **Rule: historical "closed" is a claim to re-verify, not a fact.** Phase 0.5 (§18) re-runs the witnesses for every Wave-6 P0 and either confirms closure in this tree or reopens it here.

| Class                                   | Flaws (evidence anchor)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Disposition                                                                                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-A Wrong numbers                       | Silent-zero formula evaluation (W6-P0-01); parseFloat truncation (P0-10); garbage dates (P0-09); IRR/XIRR guessing (P0-16); cascade DSL silent fallback (P0-15); percent-as-currency (P0-06/P1-14); negative-green ReportGrid (P0-12)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Wave-7 claims closure — re-verify each witness test in Phase 0.5; class-guard tests (one guard per class, not per instance)                                                                                                      |
| F-B Data loss / integrity               | Storage errors swallowed (P0-04); encryption key beside data, no escrow (P0-05, OWNER); blob persistence scale cap; duplicate-import & unbalanced-remainder (DEC-007/009 — implemented, keep tests)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | P0-05 owner DEC blocks "data is safe" claims                                                                                                                                                                                     |
| F-C Security / governance               | Plugin sandbox computed-key escape + unwired sandbox (P0-02/03); RBAC-free mutators (P0-14); fictional server endpoint (P0-13); Sentry/PWA egress vs local-first (DEC-003 enforcement pending)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Sandbox wired-or-de-advertised; RBAC completeness test over every mutator; egress inventory test                                                                                                                                 |
| F-D Unwired / false surface             | 87 orphan engines; staging pipeline 0 readers; `parseD365Rows` second parser; most of `src/services/` unreachable; all connectors 0 UI consumers; server 0 frontend callers; 35-table schema never written; ~120 routes computing on empty/mock state; exception catalogue 0 consumers (P0-02/03 in §6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Every item gets wire / retire / experimental disposition (§16) — "exists" is not a state a supported product may ship in                                                                                                         |
| F-E Template clones & fabrication       | 19-page clone census (Aug-25), re-measured: 60 GL pages engine-less, 20 inline-compute; payroll fabricated arrays; canned variance drivers; sector $0 KPIs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Engine-wiring per page with money tests; fabrication ratchet extended into `src/engines`; canned-driver purge                                                                                                                    |
| F-F Duplication                         | Fiscal calendar ×3; import paths ×4 (wizard, ImportEngine, GLImportService/ImportPipeline, staging); export engines ×4+; workflow engines ×6; audit engines ×3; cube/OLAP ×6; report scheduler ×2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | One canonical per concept (§16); duplicates retired by DEC, not polished                                                                                                                                                         |
| F-G Money & determinism debt            | `GLEntry` amounts are JS `number`; money adoption 29.16 % floor (289 modules); 344 determinism sites / 79 files; 47 type-safety escapes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Supported-path targets: adoption 100 %, determinism 0, escapes 0 (§17) — measured per supported module, ratchets only fall                                                                                                       |
| F-H UX / a11y / design                  | 5,548 raw palette utilities / 373 files; ConfirmDialog dead (P0-08); inert native menu (P0-07); five-states coverage incomplete; 242-route overload (R-011)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Palette to 0 in supported paths; route consolidation (§16); WCAG-AA evidence per supported route                                                                                                                                 |
| F-I Platform truth                      | Desktop cannot sign in offline (DEC-014 pending); browser-vs-PWA contradiction; updater channel claim; Tauri native UNVERIFIED from sandboxes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Owner decisions (§20) + native CI verification                                                                                                                                                                                   |
| F-J Claims & docs                       | README false-claims history (100 % money/green/offline); 437 docs; capability matrix UNVERIFIED everywhere outside BUILT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `docs:verify` + capability regeneration as release gates; supported-scope statement (§19) is the only claim surface                                                                                                              |
| F-K Test evidence gaps                  | Transfer-pricing TEST-NOT-FOUND class; SaaS churn/cohort TEST-NOT-FOUND; PDF tie-out leg; cross-artifact tie-out beyond board pack; forecast backtesting absent; connector live evidence absent; J2 answer key absent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Each becomes a named test deliverable in its phase (§18)                                                                                                                                                                         |
| F-L Baseline (2026-10-18, this session) | Full sharded suite: **7/8 shards PASS; shard 1 = 3 failed / 1,878 passed** (Node v22.22.3, this tree @ `88ef97b`); static gates (tsc, lint, format, docs:verify, engines, money:ast, adoption, determinism, palette, fabrication) all exit 0. **Named (shard-1 re-run):** `sqlJsStorage.test.ts` ×2 (quota snapshot must reject with `StorageBackendError`) + `backupRestore.test.ts` ×1 (unreadable key must be collected, not thrown). Root cause probe-verified: `vi.spyOn(localStorage, …)` does not intercept under this jsdom (`Storage.prototype` resolves the method; instance spying is a silent no-op — the inverse of the Node-26 polyfill case in `09_KNOWN_GAPS.md`). **Fixed 2026-10-18:** both-targets spying (instance + `Storage.prototype`, the `masterStorage.security.test.ts` pattern), assertions unchanged — 39/39 in the two files green; full 8/8 re-run is the Phase 0 exit tally still owed | **Closed 2026-10-18:** full-suite re-run pasted **8/8 shards PASS in 1186s** — the baseline is green. (Original F-L text retained above for the record.) Baseline is **not** called green until the full-suite re-run pastes 8/8 |

## 16. Disposition program — every artefact gets a verdict

Zero-compromise does not mean "keep everything"; it means **nothing ambiguous ships**. By the §19 finish line:

- **Routes (242):** each is RETAIN (supported, evidence per §17), MIGRATE (into a canonical pattern/pillar home), or RETIRE (removed with its tests, route-map regenerated). Route target: the owner's working set, not a number chosen for vanity — but every surviving route must be reachable, data-honest and tested. Census: `docs/product/ROUTE_MAP.md` regenerated + `routemap:check`.
- **Engines (182 manifest / 87 orphan):** each orphan is WIRED (consumer + oracle test) or RETIRED (deleted with manifest regenerated). Duplicate clusters (F-F) collapse to one canonical engine per concept. `engines:verify` + orphan census at 0 for supported scope.
- **Stores (48):** one authority per fact (`persistenceAuthority.ts`); shape changes versioned with migrations; persistence map current (`persistence:map`).
- **Services/connectors:** wired-and-evidenced or EXPERIMENTAL-labelled in-product (not in marketing copy).
- **Docs (437):** live set only per DEC-011; every number script-checked (`docs:verify`); archive stays provenance.

## 17. The Zero-Compromise gates (ZC-01…ZC-14) — the one rule, made measurable

A gate is a command or a test with a tally. "We believe" is not a gate.

| ID    | Gate                                                          | Command / evidence                                                                            |
| ----- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ZC-01 | Full suite green, honest exit code                            | `npm run check` 8/8 shards, tallies pasted                                                    |
| ZC-02 | Money: no unsafe ops; adoption 100 % in supported modules     | `money:ast` = 0; `money:adoption` per supported set                                           |
| ZC-03 | Determinism 0 in supported calculation paths                  | `determinism:ratchet` per-file, supported set only                                            |
| ZC-04 | Nothing silently discarded; missing ≠ zero                    | Import rejection contract tests; five-states + "not in file" UI tests                         |
| ZC-05 | Flags are candidates, never "errors", until disposition       | Copy lint over exception UI/exports + lifecycle tests                                         |
| ZC-06 | Everything listed (DEC-017)                                   | Comparison/findings completeness tests (row count == ledger count)                            |
| ZC-07 | Screen == Excel == PDF == PPTX on every supported export      | Cross-artifact tie-out suite per surface                                                      |
| ZC-08 | No fabricated/mock figure in supported paths                  | `fabrication:audit` + `mock-data:audit` incl. `src/engines` scope                             |
| ZC-09 | Every supported engine has an independent oracle              | Oracle test per engine; `financial:oracles` extended                                          |
| ZC-10 | Every supported route: real data, five states, a11y, keyboard | Journey E2E (Playwright) + `test:a11y` populated suites                                       |
| ZC-11 | RBAC + audit on every mutation; period locks un-bypassable    | RBAC completeness test; lock-bypass test sweep (DEC-008)                                      |
| ZC-12 | No data leaves the machine by default                         | Egress inventory test; DEC-003 enforcement                                                    |
| ZC-13 | Backup restores; key recovery works; upgrade migrates         | Restore rehearsal test; migration rehearsal on prior-version data                             |
| ZC-14 | Performance budgets at real scale                             | Bench suite: 100k-entry import/grid/drill + 1M-row staging path within budget; bundle budgets |

## 18. Expanded completion roadmap (supersedes the §10 phase table's scope, keeps its order)

§10 Phases 0–5 stand as written (baseline → import → trusted views → exceptions → comparison → correction loop), with these amendments and additions:

- **Phase 0 exit amended:** shard-1's 3 failures (F-L) named, triaged, and either fixed or filed with owners — plus the **Wave-6 witness re-verification (Phase 0.5)**: each F-A…F-C witness re-run; closures confirmed or flaws reopened into §15.
- **Phase 6 — Platform truth:** offline auth (DEC-014), persistence execution (DEC-005), key escrow (owner DEC), PDF tie-out, server integrate-or-label, browser-vs-PWA single story, updater honesty, native CI.
- **Phase 7 — Planning depth (PLAN):** budget/forecast/scenario hardening, cascade sentinel pass, forecast backtesting harness, rolling-forecast wire-or-retire, plan approval workflow.
- **Phase 8 — Modelling depth (MODEL):** consolidation/FX/IC close-loop, rev-rec/leases/tax completion incl. transfer-pricing tests, canonical spreadsheet/cube subset.
- **Phase 9 — Reporting completion (REPORT):** tie-out on every supported export, report governance, XBRL wire-or-retire.
- **Phase 10 — AR/AP, cash & operational inputs:** sub-ledgers feeding 13-week cash and working capital; payroll decontamination; sector operational adapters.
- **Phase 11 — Sector certification:** one sector at a time to §14.9 completion; canonical SectorDriverDashboard; unfinished sectors labelled EXPERIMENTAL.
- **Phase 12 — Governance & collaboration:** RBAC completeness, SOX authority implemented per owner DEC, audit reconstruction, comments/approvals if team use is confirmed (DEC-004 review trigger).
- **Phase 13 — AI (last, off by default):** verified-facts gate (AI-001), egress chokepoint, J2 explanation wiring; unsupported-number rejection measured on a test corpus.
- **Phase 14 — Scale, design & release readiness:** ZC-14 budgets, palette/design completion, route consolidation finished, installers signed, updater live, backup/restore rehearsal, help/onboarding/runbooks, `RELEASE_CHECKLIST.md` executed for real.

### 18.1 Amendment 2026-10-18 — the owner's 110-section checklist is scope of record

The owner supplied the complete all-in-one FP&A checklist (110 sections).
Every section is now mapped in `docs/MASTER_CHECKLIST_COVERAGE.md`: current
state with evidence, disposition, owning phase (including extension phases
E1 sub-ledgers & operations, E2 connectors & ecosystem, E3 advanced
analytics/statistics/AI, E4 jurisdictions & compliance, E5 sector
certification, E6 platform scale) and the completion gate that closes it. No
row may finish the project as partial/unwired/missing inside supported scope:
each terminates as WORKS-with-evidence, labelled EXPERIMENTAL, or retired by
an owner DEC. Items that collide with standing rulings (multi-user/team/cloud
sync vs DEC-003, network egress, mobile, marketplace, server fate,
compliance authority, key escrow, sector/jurisdiction tiering) are listed in
that annex's conflicts table and require owner DECs before build — they are
never silently dropped and never silently built.

## 19. Definition of "project complete"

The project is complete when **all** are true and evidenced:

1. **Supported-scope statement exists** (in-product + README): what is supported, what is EXPERIMENTAL, what was retired — generated from the capability matrix, with **zero UNVERIFIED grades inside supported scope**.
2. **Owner's month-end, end-to-end, on real data:** D365 dump → import reconciled to the owner's own D365 totals → TB/statements tied → exceptions reviewed and dispositioned → corrections exported, tracked, re-verified on the next import → DoD/MoM/YoY comparison done without leaving the tool → board pack tied out. Run as a **parallel run against the owner's manual process for at least two consecutive months**, differences explained to the cent.
3. **All ZC gates (§17) green in one `npm run check`** on the release commit, plus native (Tauri) verification on a real toolchain and green CI on `main` (`gh run list`).
4. **No open P0/P1 in §15**; every P2 is either closed or carried in a signed known-limitations note inside the product.
5. **Recovery proven:** fresh install → restore from backup → same totals; upgrade from the previous release migrates data losslessly.

## 20. Owner decisions still required (zero-compromise means these are asked, not assumed)

Encryption-key escrow model (F-B) · browser-vs-PWA single story · desktop updater channel · server: integrate or label · SOX/audit authority source · plugin marketplace: wire sandbox or pull claims · direct D365 API pull (Phase 8-optional) · plus the workflow facts in §12 (fiscal calendar, entities/currencies, assignees, watchlist accounts). Each lands as a DEC before code depends on it.
