# Mission Decision Ledger

This ledger records scope and process choices made to execute the requested audit without converting aspirations into implementation claims. Existing owner decisions in [`docs/discovery/decision-log.md`](../discovery/decision-log.md) retain precedence.

| ID | Date | Working decision | Rationale and boundary |
| --- | --- | --- | --- |
| MDEC-001 | 2026-11-04 | Preserve DEC-033, DEC-042, DEC-103, DEC-104, and the other accepted owner decisions. | The new mission expands design coverage; it does not silently rewrite accepted product scope, supported-claim boundaries, or deployment decisions. |
| MDEC-002 | 2026-11-04 | Treat the ten financial laws, universal-core architecture, 18 platform modules, and 12 industry packs as target requirements until code and tests prove a specific capability. | This avoids claiming that a design request is an implemented or certified feature. |
| MDEC-003 | 2026-11-04 | Do not make additional application-source changes while `docs_gate_passed` is false. | Documentation and architecture decisions must precede code under the current mission. Existing source modifications in the branch predate this bootstrap and are tracked as a baseline condition. |
| MDEC-004 | 2026-11-04 | Retain the existing `Decimal.js` money architecture as the observed implementation until an ADR evaluates alternatives. | The new fixed-precision requirement permits arbitrary-precision approaches; it does not by itself authorize a migration to a different numeric representation. |
| MDEC-005 | 2026-11-04 | Mark provider, competitor, regulatory, and source-format claims `[UNVERIFIED: reason]` unless inspected evidence is available. | The environment network allowlist excludes most external vendor sites, and no live provider credentials or owner data are available. |
| MDEC-006 | 2026-11-04 | Audit the existing `docs/adr/` series before creating the requested `docs/decisions/ADR-*` series. | The repository already contains numbered ADRs; duplicate identifiers across directories would create ambiguous authority. Resolve naming and precedence in Stage 1 before Stage 3 authoring. |
| MDEC-007 | 2026-11-04 | Keep historic audit and squad documents as provenance unless evidence supports a safe, linked consolidation. | Historical records must not be rewritten to imply they were current or to erase useful evidence. |
| MDEC-008 | 2026-11-04 | Apply DEC-102's resolved O4 status consistently: the product is not a SOX compliance system; the client audit chain is evidence, not SOX authority. | Update current status and compliance mappings without rewriting historical records; do not leave O4 as an active blocker or imply SOX conformity. |
