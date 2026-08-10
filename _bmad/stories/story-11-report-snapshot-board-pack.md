# Story 11: Governed Report Snapshot and Board Pack Viewer

## Status: DRAFT

## Context & Purpose
Fulfils PRD E7 and UX §5.5. Published communication must be reproducible and evidence-backed.

## Dependencies
- Requires Stories 07, 08 and 10 DONE.
- Relevant files: report/board-pack pages/components, reporting domain, artifact storage/export worker.

## Acceptance Criteria
- [ ] Metric/report definitions carry formula/data/filter/format/version/owner/certification metadata.
- [ ] Snapshot freezes definition, input versions, context, publisher, time and certification state.
- [ ] PDF/XLSX/CSV outputs include required scope/status labels and audit event.
- [ ] Viewer drill-through honors recipient policy and never infers restricted data.

## Technical Guidance
Use immutable artifact/object storage and async export jobs. Do not start unconstrained drag/drop report designer in this story.

## Definition of Done
- [ ] Snapshot reproducibility, export, access-control, evidence, E2E and a11y tests pass.
- [ ] QA review and G6/G7 approval completed.