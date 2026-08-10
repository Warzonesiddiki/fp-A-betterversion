# Story 07: Ingestion and Reconciliation Vertical Slice

## Status: DRAFT

## Context & Purpose
Fulfils PRD E3.2 and prepares E4. Actuals must be importable, validated, quarantined, traceable, and reconcilable.

## Dependencies
- Requires Story 06 DONE.
- Relevant files: `src/pages/data/DataImportPage.tsx`, server import domain, mapping/worker tests.

## Acceptance Criteria
- [ ] CSV/XLSX staging records source hash, mapping version, actor, row results, control totals and idempotency key.
- [ ] Schema/dimension/date/currency/balance/duplicate/reference validation quarantines failure without coercion.
- [ ] Correction/retry is safe and produces reconciliation evidence.
- [ ] UI has preview, mapping, quality failure, recovery, loading/empty/error/accessibility states.

## Technical Guidance
One demand-led production connector is selected only after owner decision; do not fake connector success. Async jobs use outbox/durable worker contract.

## Definition of Done
- [ ] Import/retry/reconciliation E2E and data-integrity/security tests pass.
- [ ] QA review and G6/G7 approval completed.