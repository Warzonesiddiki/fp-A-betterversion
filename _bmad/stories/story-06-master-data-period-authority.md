# Story 06: Master Data and Fiscal Period Authority

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-01** (authoritative master data and fiscal period).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.
## Size: XL | Risk: HIGH

## Why This Story Exists
Fulfils PRD E3.1 and the financial-model-workspace / consolidation contracts. Controlled entity, COA, calendar, currency, and dimension data are the preconditions for imports, plans, and close — a pilot slice cannot certify numbers that reference ungoverned master data.

## Research Context
- The financial-metric-lineage and consolidation/FX policy contracts require effective-dated, tenant-scoped master data with audit (`../research/financial-metric-lineage-model.md`; `../research/consolidation-fx-policy-contract.md`).
- The first connector/vertical is NOT selected (path-lock: no connector commitment ahead of evidence); master-data scope must be expressible for any segment the R-04 framework selects.
- Solo-dev re-baseline: delivery is scoped to the first public-beta segment; enterprise multi-entity depth (A-13) stays UNVALIDATED — the story must not silently assume large-entity depth that lacks evidence.

## Dependencies
- Requires: Story 05 (identity/policy/audit foundation) DONE; F-04 server contracts available.
- Files to inspect/modify: new authoritative data domain/migrations/API; existing COA, entity, settings pages/stores through adapters; `server/src/db/schema.ts` (`ensureSchema`/`ensureServerColumns` patterns).
- Depended on by: P-02 (import/reconciliation), P-03 (close), P-04 (plan workspace).

## Acceptance Criteria
- [ ] Tenant-scoped entity/hierarchy, COA, dimensions, fiscal calendar/period and currency contracts are effective-dated and audited.
- [ ] Non-January fiscal year, adjustment periods, and configured periodicity are tested.
- [ ] Referenced master data cannot be destructively deleted; retirement/replacement policy is enforced.
- [ ] RLS/authorization/validation and migration rollback are tested.

## Technical Guidance
Use PostgreSQL numeric/UUID/tenant/RLS conventions in Architecture §5 (production migration path per ADR-E02/E03 is documented but not started; keep the server schema-ensure pattern so the SQLite spike and future PostgreSQL stay contract-compatible). Existing screens migrate only through the feature-flag adapter.

## Out of Scope
- Connector/vertical selection; enterprise scale assumptions (A-13 UNVALIDATED); deployment/residency commitments; building the full enterprise master-data suite beyond the evidence-selected pilot slice.

## Definition of Done
- [ ] Migration, API, authorization, financial-calendar tests and docs pass.
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.
