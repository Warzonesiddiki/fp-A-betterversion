# Story 06: Master Data and Fiscal Period Authority

## Status: DRAFT

## Context & Purpose
Fulfils PRD E3.1. Controlled entity, COA, calendar, currency, and dimension data is required before imports, plans, and close.

## Dependencies
- Requires Story 05 DONE.
- Relevant files: new authoritative data domain/migrations/API; existing COA, entity, settings pages/stores through adapters.

## Acceptance Criteria
- [ ] Tenant-scoped entity/hierarchy, COA, dimensions, fiscal calendar/period and currency contracts are effective-dated and audited.
- [ ] Non-January fiscal year, adjustment periods, and configured periodicity are tested.
- [ ] Referenced master data cannot be destructively deleted; retirement/replacement policy is enforced.
- [ ] RLS/authorization/validation and migration rollback are tested.

## Technical Guidance
Use PostgreSQL numeric/UUID/tenant/RLS conventions in Architecture §5. Existing screens migrate only through feature-flag adapter.

## Definition of Done
- [ ] Migration, API, authorization, financial-calendar tests and docs pass.
- [ ] QA review and G6/G7 approval completed.