# Audit Evidence Checklist

> **2026-11-11 repository review note:** The checklist is a usable instrument and its 2026-10-15 legend is honest, but three of its
> "collected" entries point at material that has since moved or is now known to be wrong, and several "not yet collected" items were
> closed afterwards by work this review has itself verified.
>
> **Stale in section A:** the counts "242 routes, 182 engines, 95 reachable" are superseded — measured today, `src/App.tsx` declares
> **227** routes and `engineManifest.generated.ts` holds **180** engines (98 shipped / 82 orphan). The `docs/audit/` and
> `docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md` references elsewhere still repeat 242/182. The dependency line ("advisories root 3H/1M/1L,
> server 1C/4M → 0/0") does not describe the present state: `npm run audit:prod` today reports 13 advisories (2 high) at root and 2 high
> in `server/`, both unpatched by design pending owner authorization.
>
> **Closed since this list was written**, so the box status is pessimistic rather than false: section D "sign and statement presentation
> rules documented" is now satisfied by [`docs/product/STATEMENT_SIGN_CONTRACT.md`](../product/STATEMENT_SIGN_CONTRACT.md) — though that
> review also found the Budget-vs-Actual export still absolutises (AUD-115); section G "data at rest / in transit / authentication /
> LLM egress" is now covered by `docs/security/ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md`, [`docs/security/PSEUDONYMIZATION.md`](../security/PSEUDONYMIZATION.md), [`docs/security/PII_REDACTION_POLICY.md`](../security/PII_REDACTION_POLICY.md)
> and the TLS-absent finding in `docs/compliance/soc2-readiness.md`; and section C's "no D365 export contract exists to test against" is
> obsolete — [`docs/discovery/d365-export-contract.md`](d365-export-contract.md) now exists and its DEC-047 implementation re-verified
> in this review (12/12 tests, exact aliases, 5/5 + 7/7 counts accurate), while still explicitly unverified against a real export.
>
> **Still genuinely open, and the right reading of this page:** sections B (D365 owner confirmation, sample data, control totals), D
> ("selected output independently recalculated", "missing/zero/not-applicable differentiated" — still a verified gap), E (abnormality
> taxonomy, dispositions), and F (usability sessions) remain uncollected. Section D's "metrics catalog identifies formula, unit,
> required inputs and provenance" is still uncollected: there is no metrics-catalogue document in `docs/product/`. No external auditor
> has reviewed this checklist, and no owner has confirmed the B-section items.


> Legend: `[x]` collected 2026-10-15 (see `audit-progress-2026-10-15.md`), `[~]` partial, `[ ]` not yet collected. Items marked **Verified gap** were checked and found absent in the target.

Use this checklist to distinguish repository evidence from product-owner statements. Record evidence links, date, and reviewer. Do not paste confidential GL data into the audit pack.

## A. Repository and delivery
- [x] Target repository branch, commit SHA, and review date recorded. (`main` @ `04c329e`, working branch `arena/48b4e481-fp-a-betterversion`, 2026-10-15)
- [x] Reference repository branch, commit SHA, and review date recorded. (`FPA-modular` `main` @ `641d3d8`, 2026-10-15)
- [x] File tree and entry points inventoried. (audit §1–§3: 242 routes, 182 engines, 95 reachable)
- [x] Setup, run, and test commands executed in a clean environment where possible. (`npm ci`, `tsc`, `eslint`, sharded vitest, server vitest, `vite --host`)
- [x] Test, lint, type-check, and CI results captured exactly. (audit-progress "Target — executed" table)
- [~] Specs/taskboard/milestones reconciled against actual implementation. (Partially: README and `docs/CAPABILITY_TRUTH_MATRIX.md` reconciled; the 15+ other plans were inventoried, not reconciled — DEC-006)
- [x] Dependencies, secrets/configuration, packaging, and release process reviewed. (advisories root 3H/1M/1L, server 1C/4M → 0/0; Tauri bundle not compiled — no Rust toolchain; release workflow not exercised)
- [x] Prior audit counts and claims verified or marked unverified. (README "14,835 tests / 100 % green / 100 % money safety / fully offline / 182 engines" all falsified and corrected)

## B. Dynamics 365 source and export
- [ ] Product/version/configuration identified (owner confirmation).
- [ ] Export procedure and report/query identified.
- [ ] Synthetic/anonymized sample and data dictionary obtained.
- [ ] Required and optional columns documented.
- [ ] Account chart and dimensions understood at the level needed for first use case.
- [ ] Fiscal calendar, period boundaries, posting dates, reversals, opening balances, and time zone clarified.
- [ ] Currency and exchange-rate source/handling clarified.
- [ ] Data scope and any expected row count/control totals documented.
- [ ] Data authorization and retention/processing constraints recorded.

## C. Import and data quality
- [~] Header mapping and schema drift behavior tested. (`SmartImportMapper` has unit tests; no D365 export contract exists to test against)
- [ ] Blank rows, malformed values, encoding, decimal separators, and negative values tested.
- [~] Duplicate/repeated files and duplicate journal candidates tested. (Branch: file-hash idempotency + per-row ledger-duplicate rejection, tested in `glStore.provenance.test.ts`; duplicate *journal* heuristics still open)
- [ ] Row arity/column count and type errors surfaced with actionable detail.
- [~] Atomicity or partial-acceptance policy documented and tested. (Branch: store is all-or-nothing on validation errors; ledger-duplicate rows are skipped and each reported — documented in `importGLData` doc comment; page-level pre-filtering of unparseable rows still open)
- [ ] Reconciliation compares source-side controls and imported data.
- [~] Every accepted or rejected row is explainable; no silent data loss. (Branch: `ImportRejection[]` with row/code/reason returned and shown; accepted rows carry `provenance.sourceRow`)

## D. Financial correctness
- [ ] Debit/credit and account normal-balance conventions documented.
- [ ] Sign and statement presentation rules documented and tested.
- [ ] Rounding, precision, currency conversion, and aggregation order documented.
- [ ] Period and comparison logic independently tested.
- [ ] Metrics catalog identifies formula, unit, required inputs, and provenance.
- [ ] Missing, zero, not applicable, invalid, and unavailable states differentiated. **(Verified gap: `number` amounts; no availability contract)**
- [ ] Selected output independently recalculated from source/imported records.
- [ ] Boundary, reversal, net-zero, and high-volume cases considered as in-scope.

## E. Abnormality and review workflow
- [ ] User's current abnormality taxonomy captured from examples, using synthetic/anonymized data.
- [ ] Each candidate rule has rationale, required inputs, thresholds, and known limits.
- [ ] False-positive and expected-transaction cases represented in fixtures.
- [ ] Flag language avoids asserting that an entry is wrong absent human review.
- [ ] Dispositions, notes, ownership, and history requirements agreed.
- [ ] Escalation/approval behavior documented if needed.

## F. UI/UX
- [ ] Primary user and core task observed or validated.
- [ ] Screen inventory and navigation match user workflow.
- [ ] Period scope and data status are visible.
- [ ] Import, reconciliation, exception, no-data, and error states tested.
- [ ] Drill-down preserves context and shows provenance.
- [ ] Keyboard navigation, focus, labels, contrast, zoom, and table accessibility reviewed.
- [ ] Usability sessions and issues recorded; design changes linked to findings.

## G. Security, privacy, and AI
- [ ] Deployment model and trust boundaries documented.
- [ ] Data at rest/in transit, local/cloud locations, backups, and deletion behavior reviewed.
- [ ] Logs and telemetry checked for sensitive data.
- [ ] Authentication/authorization requirements established for actual user model.
- [ ] Export permissions and file handling reviewed.
- [ ] LLM use, providers, prompts, data egress, retention, and redaction explicitly documented—or AI excluded.
- [ ] AI output is not treated as verified financial data; failure/fallback behavior tested if present.
- [ ] Threats, residual risks, and release acceptance recorded.
