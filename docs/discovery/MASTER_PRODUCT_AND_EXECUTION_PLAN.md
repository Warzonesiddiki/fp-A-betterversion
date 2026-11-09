# FinPlan Pro — Master Product Vision & Execution Plan

**Status:** Proposed for owner review — 2026-11-04. This is the working plan, not a claim that the product already delivers the vision. No calendar estimates or new provider/industry certifications are approved by this document.

**Owner direction:** build a “perfect” all-in-one FP&A solution; make supported FP&A work completable in FinPlan Pro without requiring another application; ingest accounting/ERP data through a user-customizable format; and design for every industry.

**Decision sources:** DEC-033 (all FP&A is the ultimate scope), DEC-042 (the current v1 supported-label boundary is the DATA→CLOSE trust spine; this does not narrow the ultimate scope), DEC-104 (universal accounting/finance import with a user template system), DEC-015 (all documented D365 GL shapes are in scope), DEC-035 (correction work is completable in-tool; Excel export is optional), and the other active decisions in [decision-log.md](decision-log.md). This plan does not supersede an accepted decision. Where a required product choice is not yet decided, it is explicitly marked **OWNER REVIEW**.

**Evidence baseline:** code and docs reviewed 2026-11-04; latest measured route/completion facts are in [`../CAPABILITY_TRUTH_MATRIX.md`](../CAPABILITY_TRUTH_MATRIX.md), [`../agent/09_KNOWN_GAPS.md`](../agent/09_KNOWN_GAPS.md), and [`VISION_ALIGNMENT_RECHECK_2026_11_02.md`](VISION_ALIGNMENT_RECHECK_2026_11_02.md). The 17,937-passed / 1-skipped / 8-of-8 frontend run is historical (2026-11-02). A fresh 2026-11-04 sharded run timed out after 1,800 seconds at shard 7/8 and ended without a summary; the latest full-suite status is **inconclusive**, not pass or fail. This does not establish live ERP compatibility or owner acceptance.

---

## 1. The vision, translated into an executable product promise

### 1.1 North star

FinPlan Pro should become the finance team's single FP&A workspace from finance-data intake to reviewed decisions, planning, close, collaboration, and trusted outputs. It must support the owner's current Dynamics 365 workflow and expand to other accounting/ERP sources through a common, user-configurable import contract. Industry differences should be handled through configuration and versioned industry packs on top of a stable financial core—not by maintaining a separate code fork for every industry.

“Perfect” is an aspiration and a quality bar, not a literal claim of zero defects or guaranteed detection of every accounting error. The operational meaning is: **no known critical gap is hidden inside a workflow we call supported; each number is traceable and reconciled; uncertainty and missing data are explicit; failures are recoverable; and improvement is measured against real user work.**

**Scope/label boundary:** DEC-033 keeps all FP&A as the ultimate project scope. DEC-042 limits the current v1 `SUPPORTED` claim to the DATA→CLOSE trust spine, not the eventual product. Therefore “all-in-one” is the destination; early releases must be honest, end-to-end supported slices, and the broader modules remain visible with their measured maturity rather than being quietly discarded or promoted.

### 1.2 How I interpret the key phrases

| Owner phrase | Proposed product interpretation | Boundary / honesty rule |
|---|---|---|
| “One stop; user doesn't have to use any other app” | A user can complete the agreed, supported FP&A journeys in FinPlan Pro: import, validate/reconcile, analyze, investigate, disposition/correct, compare, plan, and produce outputs. Excel/PDF exports may be optional interoperability. | The accounting ERP remains an upstream system of record unless the owner approves write-back. “One-stop” does not mean “ERP replacement.” Unsupported work must not be made to look complete. Team sharing is an OWNER REVIEW item because current decisions describe a single-user desktop app. |
| “Data from any accounting ERP can be used” | Any source with accessible, structured accounting data can enter through a saved user mapping/template for supported file formats; API connectors are added when justified and validated. | “Any ERP” is the destination, not current provider coverage. A file with missing essential fields, a PDF image, or a provider with no accessible export/API cannot be silently treated as a valid GL. Direct API compatibility is provider-specific. |
| “Our own user-customizable format” | Map source columns and conventions into FinPlan Pro's canonical financial model; save, reuse, version, test, and optionally share templates. Do not force every ERP to emit one proprietary file. | Template defaults must never invent dates, currencies, entities, account mappings, or amounts. Every change is previewed and its version recorded on imported rows. DEC-104 already approves the template-system direction; persistence, sharing, and UI behavior still need a coherent end-to-end contract. |
| “Cater to all industries” | A stable core supports configurable account mappings, dimensions, fiscal calendars, currencies, workflows, KPIs, and reports; industry packs add reviewed defaults and optional workflows. | “All-industry capable” is not the same as “all industries certified.” O5 currently says no sector/jurisdiction is certified. Every pack needs its own data prerequisites, semantic review, tests, and owner/customer validation. |
| “Perfect” | Continuous improvement against real workflows, financial truth, security, usability, and reliability. | Never promise universal accuracy, zero false positives, total provider coverage, or regulatory compliance without evidence and explicit scope. |

### 1.3 The recommended strategic choice

**Choose a hybrid, import-contract-first strategy.** The universal user-configurable file import is the baseline coverage mechanism; API connectors are optional, provider-specific accelerators that feed the same canonical contract. This is the safest path to broad ERP coverage without pretending the team can build, maintain, and certify a native connector for every accounting system before delivering user value.

- **Reject API-only coverage as the universal strategy:** it leaves customers blocked when an ERP API is unavailable, restricted, expensive, or not configured for the required ledger data.
- **Reject a proprietary export-only requirement:** users should be able to map their existing CSV/XLSX exports rather than manually reshape every file into an undocumented format.
- **Reject one-off per-provider importer code as the long-term pattern:** it duplicates financial validation and creates inconsistent completeness, provenance, and duplicate behavior.
- **Adopt one canonical financial contract:** file import and API adapters must converge on the same parse, validation, reconciliation, provenance, and commit rules.

### 1.4 One-stop workflow target

```text
Accounting ERP / finance source
  ├─ structured export (CSV/XLSX + saved user mapping)
  └─ optional API connector (only when provider scope is validated)
        ↓
immutable import batch + source identity + mapping version
        ↓
parse → validate → preview → row reasons / quarantine → control totals
        ↓
explicit reconciliation → atomic acceptance under current import policy
        ↓
canonical GL + source lineage
        ↓
trial balance / close / statements / analysis / planning / comparison
        ↓
explainable exception candidates → human disposition → correction tracking
        ↓
reviewable reports and exports (export is optional, not a workflow prerequisite)
```

The accounting ERP remains a source, not an app the FP&A user must switch into to perform the supported analysis/review workflow. Connecting to or writing back to the ERP is a separate capability and requires explicit security, ownership, permission, and rollback decisions.

---

## 2. Personas and jobs to be done

These are working hypotheses based on the owner's stated workflow. Confirm roles and access needs before committing to a deployment model.

| Persona | Job | Needed product outcome |
|---|---|---|
| FP&A owner / lead | Bring actuals in, compare periods, understand drivers, plan, and publish reviewable outputs. | One trusted workspace, saved import mappings, source-to-output traceability, explicit readiness and unresolved items. |
| FP&A analyst | Prepare imports, maintain mappings, investigate movements, build budgets/forecasts and reports. | Reusable templates, validated definitions, drill-through, recoverable errors, controlled calculation tools. |
| Accountant / accounts-team member | Review an assigned candidate, understand the source and requested action, record what was done. | In-app instruction, source locator, status, rationale, timestamps, and a clear boundary that the tool does not silently post a correction. |
| Controller / reviewer | Approve period status and review exception outcomes. | Scope, reconciliation, changes, decisions and audit evidence visible in one place. |
| Finance-system administrator | Configure ERP connections, roles, industry templates, retention and backups. | Least-privilege access, secure credential lifecycle, versioned configuration, recovery and audit. |

**OWNER REVIEW:** DEC-103 currently records the product as single-user; DEC-004 describes a local-first desktop target. J3 mentions guiding an accounts team. Confirm whether that means (A) the owner prepares an in-app request which can be exported/shared, (B) every team member signs into a shared workspace, or (C) another workflow. Do not silently add cloud/multi-user architecture or claim cross-user collaboration.

---

## 3. Product scope map

| Product area | Long-term job | First required foundation | Evidence bar before “supported” |
|---|---|---|---|
| **DATA — universal intake** | Bring structured data from any accounting/ERP source into a trusted model. | CSV/XLSX upload, mapping, saved/reusable template, validation, row-level reasons, control totals, source lineage. | Real file shapes, deterministic parse tests, all rows accounted for, independent control reconciliation, owner acceptance for each advertised source shape. |
| **CLOSE** | Establish what is in scope and whether the books are tied and controlled. | Period/entity/currency context, trial balance, close state, write guards, reopen history. | Known-answer financial tests, period boundary tests, no bypass write path, accepted close workflow. |
| **ANALYZE** | Explain actuals and movement without hiding uncertainty. | Statements, account/period comparison, variance and source drill-down. | Definitions, signs, currency, formula, source rows and missing-data behavior agreed and independently tested. |
| **EXCEPTIONS / CORRECTIONS** | Find candidates and guide human review/correction. | Versioned rules, evidence, human disposition, in-app correction lifecycle. | Owner-accepted rule corpus, real-data usability and noise review, evidence that a resolved item is actually corrected. |
| **PLAN** | Budget, forecast, scenarios, assumptions and drivers. | Reuse actuals and approved dimensions; make forecast versioning and assumptions explicit. | Owner-approved definitions, backtests/known answers, approval and version history, no fabricated operational inputs. |
| **MODEL** | Multi-entity consolidation, FX, eliminations, leases, revenue, tax and other specialist accounting. | Preserve exact money, entity/currency scope, proven source mappings. | Each model has an accounting policy, examples, tolerances, source prerequisites, independent oracle tests, and applicable review. |
| **REPORT** | Produce decision-ready, traceable outputs. | Statement/report templates over the same trusted data and calculations. | Every output ties to the on-screen values and lists its scope, date, currency, limitations and unresolved items. |
| **INDUSTRY PACKS** | Adapt the core to sector-specific language and models. | Extensible dimensions, metric definitions, workflows and template bundles. | Pack-level source prerequisites, owner/domain review, representative data, tests and explicit experimental/supported status. |
| **ADMIN / GOVERN / COLLABORATION** | Configure access, templates, integrations, recovery, review and team work. | Resolve local-single-user vs shared-team boundary first. | Threat model, authz tests, retention, backup/restore, audit, access and recovery evidence for chosen deployment. |
| **AI / automation** | Reduce repetitive work without becoming financial authority. | Deterministic calculations and verified structured facts first. | Explicit user action, no unsupported numeric assertions, data-egress approval, audit and human review. No autonomous posting. |

The product's full responsibility list stays governed by DEC-033, DEC-034 and DEC-058 plus the completion register. This table is a roadmap abstraction, not permission to drop checklist items or mark a capability complete by association.

---

## 4. Current state versus the destination (reviewed 2026-11-04)

### Verified repository facts

- The application is a desktop-first Tauri/React FP&A codebase with a broad route/module inventory. The generated completion register has 711 rows; the measured route census is 227 routes, 19 SUPPORTED and 208 EXPERIMENTAL. Route presence does not prove business acceptance.
- The current GL upload path accepts CSV/XLSX, maps fields, validates through `parseGLRows`, records provenance and control totals, and commits through `glStore.importGLData`. The D365 F&O/BC fixtures are synthetic. No owner-provided GL file/control totals have been reconciled.
- `src/services/import/universalImportTemplate.ts` and `universalImportEngine.ts` contain the DEC-104 generic mapping/template and parse functions, with governance tests. Separately, `GLUploadPage` and `useGLUploadStore` save header-signature mapping profiles and re-apply them. The GLUploadPage currently calls `parseGLRows` directly; a repository search found no UI call to `universalImportParse`/`universalImportAutoDetect`. The two template/mapping paths need a deliberate convergence and user-journey audit—do not claim a single end-to-end template system from the type or test alone.
- There is a documentation-evidence mismatch to reconcile: `cap:data.universal-import` is SUPPORTED in the completion register using governance tests, while the generated capability truth matrix's static service inventory lists the two service files as “BUILT — TEST NOT FOUND”. The matrix and generator must be made to represent the intended evidence consistently; do not hand-edit generated output.
- `/data/exceptions`, `/data/corrections`, and `/data/comparison` are routed and have focused tests. They have not been accepted by the owner/accounts team on a real supported cycle. Re-verification is not yet proof that a specific source entry was corrected or the import was complete.
- `/settings/integrations` reaches `INTEGRATION_CATALOG` → `integrationStore` → connector → `glStore` for catalogued ledger feeds. The tests are mocked. No live-provider sandbox or account was used.
- Current code labels QuickBooks, Xero, NetSuite, Sage Intacct, Stripe and Plaid `ledgerImportable`; Stripe is charge-limited, Plaid imports `added` items only and lacks durable incremental cursor behavior. Dynamics targets Dataverse CRM, not D365 F&O/Business Central GL. Salesforce and Slack are not GL feeds.
- The current app is single-user/local-first under DEC-004/DEC-103; credentials/data egress, native Tauri reliability, team access and operational deployment are not certified for a shared production service.
- Fresh local `tsc`, lint, format check, production build, docs verification/link checks, and server tests passed on 2026-11-04; build emitted an ineffective-dynamic-import warning for `src/engines/engineLabels.ts`. The fresh frontend sharded run is inconclusive (timeout at shard 7/8 after 1,800 s); the 17,937/1-skipped pass is historical from 2026-11-02. Documentation verification still warns about legacy annex source-owed/unassessed sections. Root production audit reports 13 advisories (11 moderate, 2 high); server audit reports 2 high; unresolved.

### Consequence

The project has useful working foundations, but the “all-in-one, any ERP, all industry” product claim is not yet substantiated. The immediate task is not to rewrite the application or build dozens of connectors; it is to align the contracts, converge the import paths, close the owner-data gap, and turn the existing workflow into a validated vertical slice. Then broaden in dependency order.

---

## 5. Proposed target architecture and contracts

### 5.1 Canonical finance model

All file and API sources must map to one versioned canonical model before reaching analysis. The first GL contract should account for:

- **Posting identity:** source system/provider, source company/tenant, export/report type, source batch id, source record id/voucher/journal id when provided.
- **Accounting dimensions:** account code, account name if supplied, entity/legal entity, department/cost center and any configured dimensions.
- **Financial facts:** posting date, debit, credit, currency, transaction amount where source semantics require it, and explicit sign/normal-balance conventions.
- **Context:** description/memo, reference/document id, fiscal period if provided, reversal/adjustment indicators, source attributes needed for later traceability.
- **Provenance:** original file/provider, file or batch hash, mapping/template id and version, source row/record, import timestamp, importing user, validation result and accepted/rejected status.

No source field should be silently thrown away. Unknown/unmapped columns are listed for the user; whether a field is ignored, retained as a custom dimension, or blocks import is explicit. A “default” cannot fill an unknown monetary value, currency, entity, date, or account.

### 5.2 User-defined import template

A template is versioned configuration that maps a source shape into the canonical model. Each version should eventually describe:

1. human-readable name, source ERP/provider/report, file type, template id and schema version;
2. source headers and normalized header signature, with mappings to canonical fields;
3. date format/time-zone rule, decimal/thousands separators, sign/debit-credit representation and allowed precision;
4. entity, currency and account mapping behavior—explicit values or explicit “not present,” never guessed defaults;
5. optional dimension mappings and any validation rules approved for that source;
6. a non-sensitive synthetic test fixture and expected parse/control totals;
7. creation/change owner, timestamp, version, compatibility, and a way to preview/revert changes.

**Proposed access levels:** built-in templates (read-only), personal templates, and organization-shared templates only if multi-user deployment is approved. A changed mapping creates a new version; it must not rewrite historical imports. Keep API credentials out of template payloads.

**Current boundary:** `GLUploadPage` already persists simple mapping profiles keyed by normalized headers; `UniversalImportTemplate` offers a richer in-memory template API. Phase 1 must audit, unify, or explicitly distinguish them so only one financial parsing/validation authority remains.

### 5.3 Import state machine and financial controls

Proposed logical states, to be reconciled with the current page/store:

```text
SELECT_SOURCE → DETECT/SELECT_TEMPLATE → MAP → PREVIEW → VALIDATE
   → RECONCILE → READY_TO_COMMIT → COMMITTED
                     ↘ REJECTED / NEEDS_CORRECTION
```

Required invariants:

- Every source row is accepted or rejected with row/field/code/reason; no silent drops.
- Preserve current DEC-007 whole-file atomic rejection for parser/validation errors unless the owner explicitly revises it. Do not introduce a “successful partial” batch by convenience.
- Same source content is idempotent; changed exports and overlapping source records follow an explicit duplicate policy and are never silently merged.
- Source totals are captured where available; internal debit/credit totals are independently computed. A mismatch is visible and never marked reconciled.
- For each committed batch, record rows received/accepted/rejected, debit/credit controls, currencies/entities/periods and any unresolved/unavailable control. Unknown is not 0.
- Locked periods and permission boundaries apply to import, correction, re-import, undo and rollback.
- Any rollback reverses a complete, identified batch and records who/when/why.

**Open architecture constraint:** `glStore` is the current client authority. DEC-005 names local relational SQLite as the target but says persisted stores remain authoritative until migration, rollback and backup/restore gates pass. Do not dual-write into staging or migrate financial authority as part of template work without its own accepted decision and migration proof.

### 5.4 Connector and file adapter contract

File import and API connectors must produce the same canonical rows and use the same financial validation and reconciliation. A connector does not bypass preview/authorization by being “official.” Every API adapter must specify:

- provider product/edition and exact data object(s) fetched (GL transactions vs bank feed vs CRM context);
- auth type, required scopes, least privilege, token expiry/refresh/revocation, secret storage and data egress;
- pagination/cursor semantics, resume checkpoints, rate limits, retry/backoff, API version drift and partial-result behavior;
- source IDs, update/delete/reversal semantics and idempotency across syncs;
- source control totals or a stated reason they are unavailable;
- mapping/version, source lineage, user-initiated sync action and clear imported/skipped/unknown counts;
- provider sandbox evidence, owner/company mapping review and rollback/recovery procedure.

A “connected” health check is not accounting acceptance. See [`../architecture/connectors.md`](../architecture/connectors.md) for current provider limits and the proposed evidence ladder.

### 5.5 Industry configurability

Recommended core-plus-pack model:

- **Core:** canonical journal, periods, entities, accounts, currency, dimensions, provenance, validations, calculations and report primitives.
- **Configuration:** fiscal calendar, chart-of-accounts translation, dimension labels, sign/reporting mappings, approval roles, materiality tiers, localization and import templates.
- **Industry pack:** versioned definitions for relevant data sources, dimensions, KPI formulas/prerequisites, exception rules, planning drivers, report layouts, workflows and test examples.
- **No fabricated metrics:** each industry KPI lists required input sources and yields “unavailable” when missing; accounting data alone does not imply headcount, inventory units, subscribers, patient encounters, or operational volumes.
- **No industry fork:** vertical behavior should be declarative where safe, with reviewed extension points for logic that cannot be represented as configuration.
- **Certification:** use `EXPERIMENTAL` until a subject-matter owner/customer reviews representative source data, definitions, known answers and local regulatory constraints. O5 currently certifies no sector/jurisdiction.

---

## 6. Alternatives considered and recommendation

### ERP ingestion

| Option | Benefits | Risks | Recommendation |
|---|---|---|---|
| A. Native API connector for every ERP first | Convenient when credentials/scopes are available; can automate refresh. | Large perpetual maintenance surface, provider drift, permissions, rate limits, licensing, and still not universal. | Do not use as the first universal coverage strategy. Add by prioritized provider after common contract. |
| B. One proprietary file format only | Simple parser and stable internal shape. | Forces customers to reshape every ERP export and makes the product less universal. | Reject as the only input path. |
| C. User-mapped CSV/XLSX + optional APIs, one canonical importer | Broad file-based reach, user-owned mappings, same validation for all sources; connectors add convenience. | Requires careful template UX/versioning, locale support, and clear handling of unsupported fields. | **Recommended; consistent with DEC-104.** |

### Industry architecture

| Option | Benefits | Risks | Recommendation |
|---|---|---|---|
| Separate code fork/dashboard set per industry | Easy to demonstrate specialization quickly. | Duplicated financial logic, inconsistent controls, expensive maintenance, and false breadth. | Reject. |
| One generic model with no industry configuration | Smaller build. | Ignores different dimensions, metrics, cycles, and source prerequisites. | Insufficient as the final product. |
| Shared FP&A core + configurable, testable industry packs | Reuses trusted money/data/period controls while allowing domain-specific models. | Requires careful pack versioning, domain review, and controls on custom logic. | **Recommended.** |

### Team/deployment architecture

| Option | Benefits | Risks | Recommendation |
|---|---|---|---|
| Keep local single-user desktop | Local-first, reduces server/data-egress scope. | Does not deliver shared in-app access if the accounts team needs to act from separate devices. | Remains the current decision until the owner clarifies J3 collaboration. |
| Add shared hosted workspace now | Enables common queue and multi-user review. | Conflicts with DEC-003/004/103; adds auth, tenancy, egress, storage, audit, recovery and operations obligations. | Do not infer. Make a separate owner decision after collaboration requirements are known. |
| Local-first plus explicitly approved sync service | Could preserve desktop strengths and add team workflows. | Complex conflict resolution, sync correctness and key custody. | Research only after workflow and security decisions; not first implementation. |

---

## 7. Delivery phases, work packages, dependencies, and exit gates

No dates are estimated before the owner approves priorities and the unresolved deployment/source questions. Each phase can be split into small issue-sized changes; a phase is not “done” because a document or component exists.

### Phase 0 — Vision, scope, and review (current)

**Outcome:** everyone follows one coherent product definition.

- **0.1 Product promise:** approve the meaning of one-stop, any ERP, customizable format, all industries, and “perfect” (see §1.2).
- **0.2 User roles:** confirm owner, analyst, accountant, controller, admin; resolve whether accounts-team members need separate logins.
- **0.3 Scope ownership:** confirm DEC-033/104 and current product decisions remain binding; identify any owner corrections without overwriting history.
- **0.4 Docs audit:** update VISION, requirements, roadmap, connector architecture, working agreement, README/doc map; label old audit/decision packets historical where stale.
- **0.5 Current-state reconciliation:** align the completion register, capability matrix and implementation paths for the universal importer; fix any generator/evidence mismatch rather than hand-editing generated output.
- **0.6 Baseline:** retain current green gates, route/capability census, dependency audits and explicit owner blockers.

**Exit gate:** owner reviews this plan and answers the must-decide items in §11, or explicitly accepts the recommended defaults as provisional. No architectural assumption is treated as approved merely because it appears in this plan.

### Phase 1 — One canonical import contract; converge the existing paths

**Outcome:** a user can use one reliable intake path, and mappings do not fork financial logic.

- **1.1 Inventory existing behavior:** compare `GLUploadPage` → `parseGLRows` → `glStore.importGLData`, `useGLUploadStore.mappingProfiles`, `universalImportTemplate`, `universalImportEngine`, D365 parser, connector `buildJournalEntries`, staging/quarantine pipeline and DEC-005 authority boundary. Record callers, data shapes, validation differences, persistence, and tests.
- **1.2 Choose the one parsing/validation authority:** propose `universalImportEngine` as orchestration only if it can reuse the same parser/validators and maintain DEC-007 atomicity. Otherwise make the current `parseGLRows` path the authority and adapt the template system to it. Delete no contract or data namespace without a migration/reachability review.
- **1.3 Write a versioned canonical GL contract:** source fields, optional fields, types, precision, date/locale/debit-credit semantics, entity/currency/dimension behavior, provenance and source identifiers. Maintain the D365 owner shapes and generic mapping as adapters, not competing models.
- **1.4 Define mapping-template schema:** template id/name/version; provider/report/file type; header signature; field mapping; date and number parsing; dimension/account translations; warnings/blocking rules; fixture/expected controls; version ownership and change history.
- **1.5 Establish template semantics:** built-ins read-only; user templates editable; save/reuse/delete; editing creates a new version; an imported batch keeps the exact template version; explicit rename/clone/replace behavior; no secret fields in templates.
- **1.6 Account for unknown columns:** show unmapped headers and allow a user-approved “ignore,” “custom dimension,” or “block” policy; never discard a source fact without a visible outcome.
- **1.7 Test all boundaries:** required vs optional fields, duplicate/blank headers, locale decimal separators, negative/signed values, precision, date dialects, account/entity/currency absence, 100k-row current UI limit, malformed/duplicate rows, empty file, trial-balance snapshot refusal, reimport and rollback.
- **1.8 Resolve evidence wording:** reconcile DEC-104/completion-register evidence with `docs/CAPABILITY_TRUTH_MATRIX.md` and `scripts/generate-capability-truth-matrix.mjs`; generated files remain generated.

**Exit gate:** a mapped CSV/XLSX from at least three structurally different synthetic export shapes produces the same canonical results; every row is accepted or explicitly rejected; independent controls match; rerun is idempotent; a saved template can be reused and versioned; UI, store, and template engine do not disagree.

### Phase 2 — Owner-specific D365 proof (the first real-source acceptance)

**Outcome:** the D365 shapes the owner actually uses are accurately supported or explicitly rejected with reasons.

- **2.1 Ask for anonymized/synthetic-by-owner samples** for each used shape: F&O journal entity, F&O main-account statement, Business Central G/L Entries, and any trial-balance snapshot (which must not be ingested as journal postings). Never ask for credentials in chat.
- **2.2 Ask for independently produced controls:** row count, debit/credit totals, scope (company/entity, period, currency), and the report/export that produced each number.
- **2.3 Confirm the dialect:** D365 product, version, modules, export report, date/number locale, dimensions, reversals, opening balances, journal/voucher identity, and chart-of-accounts rules.
- **2.4 Build fixtures:** preserve structural edge cases but remove confidential identifiers and business-sensitive values; assert raw-file hash and row-level provenance.
- **2.5 Run source-to-app reconciliation:** row/account/currency/period totals, trial balance, statement outputs and differences; explain every mismatch.
- **2.6 Parallel-run with owner:** compare against the existing manual process on the same period(s); collect false positives, missing rows, handling time, and owner sign-off. Existing completion plan proposes two consecutive month cycles for release-level confidence; confirm or revise that threshold with the owner.
- **2.7 Publish a per-shape status:** synthetic-tested / sample-validated / owner-accepted / production-supported. Do not use one D365 badge for all shapes.

**Exit gate:** for each shape called supported, owner-supplied sample and control totals reconcile, all differences are understood, import can be repeated safely, and the owner signs off on the visible limitations. If samples are unavailable, keep the shape mapping-capable but unverified.

### Phase 3 — Trustworthy actuals, close, and audit spine

**Outcome:** every downstream view uses the same scoped, source-traceable actuals.

- **3.1 Confirm authority:** current client authority is `glStore`; target relational SQLite remains blocked by DEC-005 migration/rollback/backup gates. No dual-write.
- **3.2 Define core account/entity/period/currency semantics:** chart-of-accounts mappings, debit/credit normal balance, fiscal calendar, foreign-currency translation and rounding. Any unresolved accounting policy is an owner question, not a guessed formula.
- **3.3 Tie out:** imported batch controls → ledger → trial balance → statements. Add independent “golden” expected totals and exact decimal handling.
- **3.4 Close controls:** make period state visible; test every import/edit/delete/undo/replay path against closed periods; reopen requires authorized reason and audit evidence.
- **3.5 Lineage:** drill every supported number to source rows, calculation definition, scope, currency and import/mapping version.
- **3.6 Recovery:** test batch undo, backup/restore, import retry and crash/failure behavior before real-data production use.

**Exit gate:** no unexplained mismatch, no write bypass, no stale/unavailable value rendered as zero, and all supported views can be rebuilt from the same authoritative dataset.

### Phase 4 — Complete the owner’s J2/J3/J4 review journey in-app

**Outcome:** the existing exception, correction and comparison pages are accepted on real work, not merely reachable.

- **4.1 Exception corpus:** owner identifies rule examples, known positives, known negatives, review thresholds and missing-input behavior. Keep findings as candidates, never confirmed errors.
- **4.2 Rule operations:** version rules, show evidence/source rows, deterministic reruns, preserve prior results, audit when a human changes a disposition.
- **4.3 Correction requests:** validate instruction, source locator, assignee/roles, status transitions, notes, timestamps and optional due date. Do not auto-post to the ERP. Re-verification must identify the corrected source entry or be labelled only as a review cue.
- **4.4 Team interaction:** resolve whether the user only prepares/exports a request or the accounting team must access a shared workspace. If shared access is required, revise DEC-004/103 through an owner decision before building auth/sync.
- **4.5 Comparison contract:** define day/month/year grains, fiscal vs calendar periods, sign conventions, currency, prior-period gaps, new/disappearing accounts, percentage-denominator-zero, filters, and “show all” vs ranking tiers. DEC-017 says thresholds rank; they never suppress a difference.
- **4.6 Usability tests:** ask FP&A owner and at least one accounts-team reviewer to complete import → investigate → disposition → compare → report without an external FP&A app; record where they hesitate or leave the workflow.

**Exit gate:** real supported source cycle, owner-approved rule examples, team-approved correction workflow, all differences visible/drillable, no forced spreadsheet round-trip, and documented limits.

### Phase 5 — Prioritized API connectors

**Outcome:** reduce manual imports for the sources the owner/customers actually need without weakening the universal path.

- **5.1 Rank providers by confirmed customer use, data availability, business value, API permissions/licensing, and implementation/support cost.** Do not select a provider merely because a class exists.
- **5.2 Secure credentials and consent:** inspect current `masterStorage`/credential persistence; establish the OS keychain/approved secure-storage and token lifecycle required by the chosen deployment; scopes are least privilege; tokens never enter logs, exports, mapping templates or test fixtures.
- **5.3 Implement each adapter through one contract:** source identity, transaction scope, pagination/cursors, delta updates/deletions, rate limiting/retries, resumability, errors, duplicate/reimport behavior, mapping version, user initiated sync, and complete/partial/unknown result reporting.
- **5.4 Validate financial completeness:** agree whether the source is a full GL, bank feed, payment events or operational enrichment. Stripe charges and Plaid added transactions are not a complete ledger; refunds, modifications, removals, settlements and reconciliation must be explicitly modeled before a complete accounting claim.
- **5.5 Sandbox and control tests:** use test tenants and source-side controls; simulate expiry, revoked scopes, rate limits, cursor resets, duplicate pages, changed records and connection interruption.
- **5.6 Label evidence per provider and product edition:** code-present, fixture-tested, sandbox-tested, owner-reconciled, production-supported. A health-check green mark is not accounting verification.

**Exit gate:** each prioritized provider has exact source scope, live sandbox evidence, reconciliation, secure token handling, retries/limits, audit lineage, and an owner-approved support label. No provider is bundled into a generic “all ERP” claim.

### Phase 6 — Broaden core FP&A depth

**Outcome:** build the rest of FP&A in dependency order from validated actuals and named users.

- **6.1 Requirements inventory:** reconcile all DEC-033/034 scope items, requirements register and completion register; source text missing from the owner checklist remains SOURCE OWED, not guessed.
- **6.2 Rank capability candidates** by owner/user pain, regulatory/accounting risk, data prerequisites, measurable outcome and reuse of the trusted spine.
- **6.3 Budgets and forecasts:** confirm driver definitions, versioning, actual replacement/blending, approval, forecast horizon and backtesting. DEC-096 governs rolling semantics; do not reinterpret it in code.
- **6.4 Scenarios:** define input assumptions, comparison base, sign behavior, confidence limits and “simulation vs posted actual” disclosures; test known answers and never contaminate actuals.
- **6.5 Consolidation / FX / intercompany:** define entity hierarchy, ownership, CTA, rates, elimination matching and tolerance with domain review; each calculation gets independent oracles.
- **6.6 Operational FP&A:** add cash, workforce, CapEx, SaaS, retail, banking, healthcare and other analysis only when required data (payroll, headcount, inventory, subscription, etc.) is available and governed.
- **6.7 Reporting:** use shared calculations, show scopes and missing sources, tie Excel/PDF/PPT output back to the UI; every artifact has its own parity tests.
- **6.8 Integration/automation:** include notifications and workflows as supporting features, not substitutes for financially complete source data.

**Exit gate:** every capability has a named user/job, field prerequisites, approved formula, test/oracle, traceability, failure/empty state and completion-register disposition.

### Phase 7 — Industry configurability and packs

**Outcome:** reuse the core across industries without claiming unsupported sector expertise.

- **7.1 Build the extension contract:** industry id/version, source-field dictionary, dimension schema, account mapping, fiscal/reporting conventions, KPI definitions and prerequisites, exceptions, planning drivers, reports, workflows and locale/jurisdiction.
- **7.2 Start with a small owner-selected pilot** only after Phase 3 and the workflow foundation; do not guess the highest-value vertical.
- **7.3 Validate every KPI:** formula, unit, sign, time grain, source data, null/unavailable behavior, known-answer fixture, subject-matter approval and regulatory boundary.
- **7.4 Pack lifecycle:** read-only core packs; tenant/user customizations overlay a versioned pack; upgrade preview shows changes and never silently rewrites data or historical results.
- **7.5 Avoid clones:** common data validation, currency, security, audit, missingness, import and report logic remains in core. Pack-specific code requires an explicit need and test.
- **7.6 Publish honest statuses:** generic engine support is not industry certification; each pack remains experimental until representative evidence exists.

**Exit gate:** a second industry uses the same core contract without copying financial logic, and its owner/domain reviewer validates source fields, calculations, outputs and exclusions.

### Phase 8 — Team deployment, security, and operations

**Outcome:** the deployment matches the real user/team workflow and can be trusted with authorized data.

- **8.1 Resolve owner decisions** for local vs hosted, team accounts, access roles, data location/residency, data egress, retention, backup, recovery and device binding.
- **8.2 Threat model:** provider credentials, local data at rest, logs/errors, exports, clipboard, backups, plugins, update chain, AI, remote APIs and support diagnostics.
- **8.3 If multi-user is approved:** design tenant/entity isolation, RBAC, audit consistency, conflict handling, permission revocation, shared template access and server trust boundaries before coding.
- **8.4 If local single-user remains:** test OS-bound secret storage, recovery, import/export, backup/restore, concurrent app instances and offline behavior; do not call device-profile cache an OS-user identity.
- **8.5 Reliability:** define availability, recovery point/time, upgrade/rollback, migration rehearsal, data export, support logging redaction and incident response.
- **8.6 Accessibility/performance:** baseline full task completion, large-file limits, keyboard/screen-reader use, contrast, error recovery and desktop responsiveness; set numeric SLOs only after measurement.
- **8.7 Dependency hygiene:** prioritize unresolved root/server production advisories with owner/engineering review and re-run audits.

**Exit gate:** security/privacy, operational, native build, backup/restore, support runbooks and user acceptance match the selected deployment. No production claim from tests alone.

### Phase 9 — Pilot, release, and continuous improvement

- Choose a small owner-approved pilot scope and named users.
- Run the existing manual process and FinPlan Pro in parallel on approved, representative data.
- Reconcile all output differences to the cent (or declared currency precision) and explain each.
- Record completion time, correction time, exception acceptance/false positives, data gaps, usability blockers and support burden.
- Require explicit owner sign-off and rollback plan before calling the workflow production-supported.
- Review the backlog monthly; expand source/industry capability only from observed demand and evidence.

**Exit gate:** release checklist passes; every shipped capability has a status/evidence; no mandatory external app remains in the supported workflow; known limitations are visible; the owner accepts residual risk.

---

## 8. Small work-package checklist (tracking starter)

Create one issue per row after plan approval; the IDs are planning labels, not repository issue numbers.

| ID | Work item | Depends on | Done when |
|---|---|---|---|
| DOC-01 | Approve vision semantics and plan | Owner review | Owner confirms one-stop, ERP, template, industry and “perfect” interpretations. |
| DOC-02 | Reconcile authority/dated docs | DOC-01 | Current VISION, roadmap, connectors, brief and taskboard point here; historical audits are clearly labelled. |
| DATA-01 | Inventory all import callers and schemas | — | Diagram includes CSV/XLSX, connector, staging, template and GL commit paths with actual callers. |
| DATA-02 | Compare template engine and mapping profiles | DATA-01 | Behavior matrix identifies overlap, missing features and evidence; no undocumented second authority. |
| DATA-03 | Decide canonical GL schema version | DATA-01 | Required/optional fields, precision, signs, currencies, scope, unknown columns and provenance are reviewed. |
| DATA-04 | Define template metadata/version lifecycle | DATA-03 | Built-in/personal/shared levels and clone/edit/delete/upgrade semantics are accepted. |
| DATA-05 | Normalize CSV/XLSX parse path | DATA-02/03 | Both file types call one validated domain path; D365 parsers remain adapters. |
| DATA-06 | Mapping wizard states | DATA-04/05 | Create/select/auto-suggest/preview/save/reuse/version/revert tested with keyboard and errors. |
| DATA-07 | Locale and amount test corpus | DATA-03 | Dates, separators, precision, negative values, missing values, currencies have known answers. |
| DATA-08 | Unknown-column treatment | DATA-03/06 | Unmapped fields are shown and user choice is recorded; no silent field loss. |
| DATA-09 | Import reconciliation contract | DATA-03 | Source and internal controls, mismatch states, row accountability and atomicity are testable. |
| DATA-10 | Reimport/update/rollback contract | DATA-09 | Same file, changed file, overlapping rows, reversals and undo have explicit tested behavior. |
| DATA-11 | Mapping/template migration | DATA-04 | Old templates load; new schema migration preserves history and refuses unsafe mappings. |
| ERP-01 | Obtain owner D365 artifacts | Owner | Anonymized samples and source totals received or explicitly unavailable; no claim is inferred. |
| ERP-02 | Verify each D365 shape | ERP-01/DATA-09 | F&O/BC shapes used by owner individually reconcile and are labelled. |
| ERP-03 | Provider priority decision | DOC-01 | Owner chooses next provider(s) by observed need; exact provider editions are named. |
| ERP-04 | Credentials/data-flow design | ERP-03/SEC-01 | Auth scopes, secret storage, egress and revocation approved before sandbox credentials. |
| ERP-05 | Connector adapter contract | DATA-03/ERP-04 | Adapter maps to canonical rows and reports coverage, errors, cursor and provenance. |
| ERP-06 | Provider sandbox suite | ERP-05 | Pagination, rate limits, retries, token expiry, modified/deleted rows, idempotency tested. |
| ERP-07 | Provider financial reconciliation | ERP-06/ERP-01 | Source totals and mappings accepted; feature label updated with evidence. |
| CLOSE-01 | Source-to-ledger-to-TB tie-out | DATA-09/ERP-02 | Independent control totals, account balances and period scope match. |
| CLOSE-02 | Closed-period guard census | CLOSE-01 | Import, edit, delete, undo, connector sync and correction paths all enforce close policy. |
| CLOSE-03 | Lineage drill-down | CLOSE-01 | User reaches source row, template version and calculation definition from every supported summary. |
| J2-01 | Owner exception examples | CLOSE-01 | Owner supplies positive/negative examples and labels; no invented error ground truth. |
| J2-02 | Exception rule validity/quality | J2-01 | Rules have versions, evidence, missing-input behavior, reproducible output and false-positive review. |
| J3-01 | Team operating model | DOC-01 | Owner decides local single-user vs team/shared operation consistent with DEC-004/103. |
| J3-02 | Correction end-to-end test | J3-01/J2-01 | Request, assignment, human action, evidence and re-verification are accepted by accounts team. |
| J4-01 | Comparison semantics | DOC-01/CLOSE-01 | Grain, calendar, sign, currency, zero denominator, new/missing account semantics approved. |
| J4-02 | Comparison owner acceptance | J4-01/ERP-02 | Real daily/monthly/yearly output is exhaustively checked and drillable. |
| PLAN-01 | Planning capability prioritization | CLOSE-01 | Owner selects top budget/forecast/scenario outcome and definition. |
| PLAN-02 | Forecast/scenario correctness | PLAN-01 | Independent oracles, versioning, approval and actual-vs-forecast semantics pass. |
| PACK-01 | Industry shortlist | DOC-01 | Owner/customer evidence selects first pack; O5 no-sector-certified default preserved until review. |
| PACK-02 | Industry extension model | PACK-01/DATA-03 | Pack schema and version upgrade reviewed with no core fork. |
| PACK-03 | Industry pack known answers | PACK-02 | Domain reviewer approves source prerequisites, metrics, reports and tests. |
| SEC-01 | Threat model and data-flow map | DOC-01 | Local/browser/Tauri/server/provider/log/backup/AI boundaries are documented. |
| SEC-02 | Secret and token lifecycle | SEC-01/ERP-04 | No credentials exposed in logs, templates, backups or unauthorized clients. |
| SEC-03 | Backup/restore/recovery | SEC-01 | Restores tested on supported deployment, with explicit key custody and rollback. |
| OPS-01 | Performance/accessibility baselines | Phase 1 | Target file size, task times, WCAG behaviors and SLOs measured and agreed. |
| OPS-02 | Release/runbook/incident flow | Phase 8 | Signed build, backup, restore, rollback, support, telemetry and incident actions rehearsed. |
| GO-01 | Parallel pilot | All prior gates | At least the owner-approved number of real cycles compared to manual truth. |
| GO-02 | Supported-scope and release review | GO-01 | Owner accepts scope, evidence, limitations, residual risks and rollback plan. |

---

## 9. Definition of done and evidence ladder

### Per work package

1. Requirement or accepted plan item names the user/job, inputs, outputs, and owner.
2. A failing-first unit/integration test covers the defect class or calculation; synthetic data is labelled synthetic.
3. Financial logic has independent expected values and uses the money primitive.
4. No source row, error, omission, missing value, or unsupported state is silently discarded.
5. Relevant typecheck, lint, formatting, focused tests, ratchets and docs checks pass; the full suite is run for wide changes and before release.
6. Accessible loading/empty/error/success states, recoverable actions and audit behavior are covered.
7. Documentation that owns the decision/current fact is updated; generated docs are regenerated by their script.
8. Owner-dependent or live-provider evidence is reported honestly as open.

### Evidence labels

- **Designed:** contract/decision exists; no working code claim.
- **Implemented:** code exists; may be unreachable or incomplete.
- **Unit tested:** isolated deterministic behavior passes.
- **Integrated:** real app path calls it; integration tests exercise it.
- **Sample validated:** exact export shape parses and reconciles to independent controls.
- **Owner accepted:** owner/user reviewed the supported workflow and its limits.
- **Production supported:** deployment, credentials, security, recoverability, operations and rollback meet release criteria.

A single feature may have different labels by provider, file dialect, entity setup, deployment and feature. Do not generalize a sample or connector result to an entire ERP vendor.

### Release acceptance proposal

Before the first “one-stop for this workflow” claim, require:

- approved source shape and template version;
- complete row accounting, idempotency, exact control totals, trial balance and source lineage;
- exception and comparison outputs checked by the owner; no false “wrong entry” claim;
- correction loop completed in-app, with any Excel export optional;
- no external FP&A app is a mandatory part of this agreed workflow;
- independent owner sign-off on at least the agreed number of real cycles;
- chosen deployment security, data retention, backup/restore, access, accessibility, performance and support acceptance;
- all current automated gates green and no known P0 blockers for the scoped release.

The minimum number of real periods/cycles and numeric time-savings targets are **OWNER REVIEW**; the two-consecutive-month parallel run in `docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md` is an existing proposal, not a new fact about owner approval.

---

## 10. Success measures

Set baselines with the owner before promising numeric improvement. The following safety invariants are non-negotiable; outcome targets marked “TBD” require review.

| Measure | Proposed measure / target | Evidence |
|---|---|---|
| Row accountability | 100% of source rows accepted or rejected with a reason; zero silent loss. | Independent source count vs batch accepted+rejected totals. |
| Financial tie-out | Exact agreement at source currency precision, or visible signed difference and no reconciled label. | Source exports/control totals → batch → trial balance → reports. |
| Reimport safety | Same source batch creates no duplicate financial effect; changed files are handled by explicit policy. | Reimport/reversal integration fixtures and owner export rerun. |
| Template effectiveness | Measure first-pass mapping success, correction count, and saved-template reuse by shape; set targets after a baseline. | User telemetry only if explicitly approved; otherwise local pilot log/owner observation. |
| Exception usefulness | Measure owner-labeled useful/expected/false-positive outcomes; do not claim precision/recall until labels and denominator are defined. | Owner-adjudicated sample corpus. |
| One-stop completion | 100% of the agreed supported journey can finish without mandatory Excel/BI/script hopping. | Task observation and in-app workflow census. |
| Comparison completeness | All requested account/period differences visible; thresholds rank but do not suppress under DEC-017. | Known-answer fixture and owner period-by-period review. |
| Industry reuse | A second industry pack uses the same core import/ledger/close controls without copy-paste financial logic. | Pack-specific contract tests and code reuse audit. |
| User outcome | Time-to-complete, correction turnaround, reconciliation exceptions, and user trust improve vs measured baseline. | Parallel run; thresholds TBD with owner. |
| Reliability/security | No silent data loss; tested backup/restore; token/egress/access controls meet chosen deployment. | Threat-model review, security tests, recovery rehearsal, incident runbook. |

Do not use feature count, connector count, route count, “AI score,” or template count as a substitute for these outcomes.

---

## 11. Decisions and questions for owner review

DEC-033 and DEC-104 already establish the all-FP&A and universal-template direction. These questions refine execution; they are not a request to re-answer accepted goals.

| # | Question | Current accepted/default position | Owner response needed |
|---|---|---|---|
| R1 | Is “user-customizable format” correctly interpreted as mapping existing ERP exports into one FinPlan canonical model, not requiring users to create a new proprietary file? | Recommended yes; aligns with DEC-104. | Confirm or correct. |
| R2 | Which source formats are first-class for file import? | Current path is CSV/XLSX; keep these as the first supported baseline. | Confirm whether `.xls`, XML, JSON, parquet, PDF/OCR or other formats are needed in the first release. |
| R3 | Which D365 product/report and which export shapes does the owner use, and can anonymized files plus independent totals be supplied? | DEC-015 includes all documented shapes; each shape remains unverified until real sample/totals reconcile. | Provide safe artifacts or confirm unavailable. |
| R4 | Which non-D365 accounting/ERP sources should be prioritized after the generic mapping path? | Do not build every API connector in parallel; prioritize by actual use and accessible test environment. | Rank ERP names/product editions and whether file export is sufficient initially. |
| R5 | What does “all industries” mean in the first planning horizon? | Shared core + configurable packs; O5 says none certified today. | Name initial target industries/jurisdictions and a domain reviewer. |
| R6 | Does the accounts team need to sign in and work in the same workspace? | Current DEC-004/103: local single-user; not a shared collaboration service. | Choose owner-only request prep, shared workspace, or another collaboration path. If changed, record a new DEC before implementation. |
| R7 | Which external tools must the supported first journey eliminate? | Excel export optional under DEC-035; the ERP remains a source/system of record. | Name mandatory current spreadsheets/BI/email/close apps and which tasks must move in-app. |
| R8 | What data may leave the device, where may data persist, and what retention/key recovery is acceptable? | DEC-003/004 local-first, no automatic egress; secrets and native trust still need review. | Confirm deployment, storage, backups, provider access and recovery requirements. |
| R9 | What is the accepted parallel-run threshold and release criterion? | Two consecutive months is proposed in the October plan; not treated as owner approval. | Set cycle count, outcome/time thresholds and sign-off roles. |
| R10 | Which FP&A capabilities have highest user value after the J1-J4 workflow? | Do not choose by route count; prioritize against all-FP&A scope and prerequisite data. | Rank top 3–5 outcomes (budget, forecast, scenarios, consolidation, reporting, etc.). |
| R11 | Is direct ERP write-back in scope? | No; no write-back under current decisions. | Keep no-write-back or request a separately scoped security/reconciliation decision. |
| R12 | Which customer-facing support statements are acceptable? | Per-source evidence ladder in §9; never claim “all ERP” production support from template code alone. | Confirm terminology/labels if the product will be marketed externally. |

Unanswered means retain the safe, narrower, evidence-honest default. It does not mean the owner rejected the long-term vision.

---

## 12. Risks, mitigations, and stop conditions

| Risk | Why it can break the vision | Mitigation / stop condition |
|---|---|---|
| Scope explosion | “All FP&A/all industries” could consume years without a working trusted workflow. | Maintain complete inventory but deliver gated vertical slices; never silently drop lower-priority scope. |
| Two import/template authorities | The direct GL upload path and universal engine can disagree on schema, amounts, or rejection behavior. | Phase 1 caller/data-flow audit; one validator/commit authority; block new format claims until converged. |
| “Any ERP” overclaim | Header matching does not validate semantics, API permissions, currency, controls or versions. | Per-shape provider evidence ladder and owner sample/control reconciliation. |
| Source omissions | A balanced batch can still omit a whole journal or account. | Exact row accounting, source controls, atomicity, duplicate policy and explicit unknowns. |
| Wrong financial semantics | Sign, currency, period, consolidation or reversal errors propagate to every report. | Independent oracle tests; accounting policy review; no formula without named source/definition. |
| Team model conflict | Local single-user design cannot support multiple people acting in the same queue. | Resolve DEC-004/103 against J3 before cross-user implementation. |
| Insecure credentials / egress | Integrations introduce token, data-retention and provider exposure. | Threat model and secure token lifecycle before live provider tests. |
| False anomaly claims | Noise can lead teams to “fix” valid postings or lose trust. | Findings are candidates; owner-labeled corpus, human disposition, measured false positives. |
| Sector clone debt | Duplicated pages can imply universal coverage while formulas diverge. | Core + pack contract, clone audit, remove or classify non-evidenced pages. |
| Test green interpreted as product proof | Synthetic mocks do not establish real data accuracy or provider compatibility. | Separate automated, sample, owner and production evidence levels. |
| Dependency/security debt | High advisories can undermine customer trust and deployed safety. | Audit/remediation stream with priority, risk owner and regression tests. |
| Missing checklist source | DEC-034 source sections 108–200 remain unresolved. | Keep source-owed rows visible; obtain exact source; never invent titles. |

Stop and ask the owner before: changing authority/persistence, accepting real customer data, enabling external network/AI egress, adding shared multi-user access, changing import atomicity, writing back to ERP, certifying an industry/jurisdiction, or weakening a financial control.

---

## 13. How we will execute after owner review

1. **One plan, one live queue:** split approved work packages into small tasks in [WORKING_AGREEMENT.md](../agent/WORKING_AGREEMENT.md) / [TASKBOARD.md](../TASKBOARD.md); keep dates out until sizing and owner priority are clear.
2. **Dependency order:** import contract → real reconciliation → close/traceability → J2/J3/J4 owner workflow → prioritized APIs and broader pillars → industry packs → deployment/release certification.
3. **One vertical slice at a time:** each slice includes UI, domain service, store/persistence, tests, accessibility, error/recovery states, evidence, and docs; no engine-only “done” claim for a user outcome.
4. **Failing-first and independent truth:** financial tests use known answers computed independently from the implementation; use synthetic fixtures until real samples are authorized.
5. **No double authority:** do not make a new import pathway, store or mapping registry without documenting how it converges with the canonical authority.
6. **Review contracts before code:** any accounting policy, user scope, data retention, credentials, write-back, or deployment decision goes to the owner before implementation.
7. **Maintain the evidence ladder:** code, unit tests, integrated user journey, sample reconciliation, owner acceptance and production readiness are separate milestones.
8. **End every work slice:** run focused tests, relevant ratchets, `tsc`, lint, format, docs verification and (for wide changes/release) the full sharded suite; update this plan/roadmap and the evidence register.
9. **Re-plan from observed data:** after each owner review/pilot, re-rank tasks using value, risk, prerequisites and measured outcomes. Scope is not silently narrowed; deferred items stay visible with a reason and review trigger.

---

## 14. Research performed and known limits

This proposal was grounded in repository inspection of:

- `docs/VISION.md`, DEC-015/016/033/035/104, `requirements-register.md`, current workflow, risk register, owner packets, and the older project audit;
- `GLUploadPage`, `parseGLRows`, `glUploadStore.mappingProfiles`, `universalImportTemplate`, `universalImportEngine`, connector catalog/store, provider classes, connector tests and completion evidence;
- the generated route/capability/completion views, current taskboard, working agreement, and engineering/security docs.

No provider sandbox or customer ERP account was accessed. This planning exercise did not use external vendor documentation or validate current API schemas. During Phase 5, research each selected provider from its official, versioned API documentation and sandbox; record exact URLs/version, scopes, limits, and observations in the connector dossier. Treat code/docs analysis as architecture research, not a provider certification.

---

## 15. Owner review record

**Review status:** awaiting owner comments. Until the owner approves/corrects §§1–3 and answers §11, the phases and priorities are recommendations, not new engineering authorization. Accepted decisions DEC-033/104 remain binding; no accepted decision is silently revised by this draft.
