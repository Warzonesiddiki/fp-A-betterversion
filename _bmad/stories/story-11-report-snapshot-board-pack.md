# Story 11: Governed Report Snapshot and Board Pack Viewer

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-06** (report snapshot + board pack).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.
## Size: L | Risk: MEDIUM-HIGH

## Why This Story Exists
Fulfils PRD E7 and UX §5.5, and the governed-reporting board-pack contract. Published communication must be reproducible and evidence-backed — the "board-pack" end of the loop that makes the wedge auditable and defensible.

## Research Context
- `../research/governed-reporting-board-pack-contract.md` defines metric/report definition metadata, snapshot freezing, export labeling, and recipient-policy drill-through — this story implements that contract.
- The R-03 synthesis and secondary evidence (E-012) indicate evidence-backed reporting is the enterprise credibility gate; the commercial/GTM contract treats governed board-pack output as the unit of value — but market validation (Tier 1) is still UNVALIDATED.
- P-track re-scope: delivered for the first public-beta segment; no board-committee composition assumptions (A-13 enterprise depth UNVALIDATED).

## Dependencies
- Requires: Stories 07, 08, 10 DONE; F-03 context + F-04 audit/command envelopes.
- Files to inspect/modify: report/board-pack pages/components, reporting domain, artifact storage/export worker.

## Acceptance Criteria
- [ ] Metric/report definitions carry formula/data/filter/format/version/owner/certification metadata.
- [ ] Snapshot freezes definition, input versions, context, publisher, time and certification state.
- [ ] PDF/XLSX/CSV outputs include required scope/status labels and audit event.
- [ ] Viewer drill-through honors recipient policy and never infers restricted data.

## Technical Guidance
Use immutable artifact/object storage and async export jobs. Do not start an unconstrained drag/drop report designer in this story. Every export must carry the trust-language scope/status labels (F-02 contract) — never strip the "Draft — local workspace data" truth label.

## Out of Scope
- Full BI/reporting parity; unconstrained report designer; connector/vertical selection; claiming publication-grade certification without evidence.

## Definition of Done
- [ ] Snapshot reproducibility, export, access-control, evidence, E2E and a11y tests pass.
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.
