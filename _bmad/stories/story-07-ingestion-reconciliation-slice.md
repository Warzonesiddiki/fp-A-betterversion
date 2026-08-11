# Story 07: Ingestion and Reconciliation Vertical Slice

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-02** (controlled import + reconciliation).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.
## Size: XL | Risk: HIGH

## Why This Story Exists
Fulfils PRD E3.2 and prepares E4. The controlled close wedge depends on actuals being importable, validated, quarantined, traceable, and reconcilable — source-to-posted evidence with no silent coercion (integration-data-quality and controlled-close contracts).

## Research Context
- The integration-data-quality contract defines staging records, control totals, idempotency, and quarantine semantics — this story implements that contract, not a bespoke import UX (`../research/integration-data-quality-contract.md`).
- The R-03 synthesis finding that "data quality / reconciliation evidence is the enterprise credibility gate" (secondary evidence, E-012) supports prioritizing this wedge — but Tier-2 beta usage is required before segment selection (R-04), so the slice stays blocked.
- One demand-led production connector is selected only after owner decision + evidence; CSV/XLSX remains the only default until then (validation-plan: connector appears in ≥50% of target accounts or CSV/XLSX accepted for paid pilot — both UNVALIDATED).

## Dependencies
- Requires: Story 06 (master data authority) DONE; Story 05 DONE.
- Files to inspect/modify: `src/pages/data/DataImportPage.tsx`, server import domain, mapping/worker tests; F-04 typed command envelope for import commands.

## Acceptance Criteria
- [ ] CSV/XLSX staging records source hash, mapping version, actor, row results, control totals and idempotency key.
- [ ] Schema/dimension/date/currency/balance/duplicate/reference validation quarantines failure without coercion.
- [ ] Correction/retry is safe and produces reconciliation evidence.
- [ ] UI has preview, mapping, quality failure, recovery, loading/empty/error/accessibility states.

## Technical Guidance
Do not fake connector success — a connector is a commitment that requires evidence. Async jobs use the outbox/durable worker contract (ADR-E03). Never replace an error with zero; quarantine, never coerce.

## Out of Scope
- Selecting/claiming any production connector; enterprise-scale ingestion; deployment commitments; AI-driven mapping (assisted + cited only, per ai-governance contract).

## Definition of Done
- [ ] Import/retry/reconciliation E2E and data-integrity/security tests pass (real SQLite native binding).
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.
