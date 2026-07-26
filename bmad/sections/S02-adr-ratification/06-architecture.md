# S02 — Architecture

**Date:** 2026-07-25

## 1. Context
Governance layer; no runtime code. Establishes decision provenance.

## 2. Components
- `docs/ratification/ADR-002-zustand.md`
- `docs/ratification/ADR-004-decimaljs.md`
- `docs/ratification/ADR-005-masterstorage.md`
- `docs/ratification/ADR-010-schema-migration.md`
- `docs/ratification/ADR-003-olap-cube-RETIRED.md`
- `AGENTS.md` (Ratification State table update)

## 3. Data Model
- ADR template: `Status | Context | Decision | Consequences | 4-ICP Verdict | Date`.

## 4. Interfaces
- ADRs referenced by all later sections' Architecture docs.

## 5. Integration
- None (docs only). Later sections cite ADR IDs.

## 6. Performance/Security
- N/A.

## 7. Testing
- Validation: files exist; AGENTS.md table updated; grep shows no `TENTATIVE` for these ADRs.
