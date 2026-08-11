# R-04 Pilot Slice Selection Framework — Multi-Agent Squad

> **Date:** 2026-08-11 · **Status:** READY — executes when R-03 evidence exists
> **Purpose:** Select the pilot workflow, vertical, connector, deployment constraints, metrics, and owners — from evidence, not preference.
> **Companion:** `enterprise-pilot-charter-template.md` (the charter to populate).

## A. Selection inputs (all evidence-sourced)

| Decision | Evidence source | Selection rule |
|---|---|---|
| First workflow | R-02 sessions: most-repeated unprompted pain; controller ≥70% urgent ranking; CFO unprompted close-loop mentions | The workflow with the strongest validated pain + highest willingness to pilot |
| First customer/design partner | R-01 pipeline + R-02: paid-pilot/LOI acceptance (≥2), data accessibility, security fit | The partner most willing AND most evidence-accessible (not the largest) |
| First vertical | R-02 org profiles: vertical concentration, data accessibility, pain depth; ≤40% vertical cap | Only if ≥3 evidence-bearing participants share the vertical |
| First connector / import path | R-02 systems inventory: connector present in ≥50% of target accounts OR CSV/XLSX accepted for paid pilot | The single highest-frequency connector OR file-import accelerator |
| Deployment constraints | R-02 IT sessions: accepted deployment pattern (≥4), residency mandates, endpoint policy | The pattern ≥4 IT owners accept with no unmitigated critical blocker |
| Pilot source-data contract | R-02: sample extracts, data owners, mapping complexity | A source the partner can provide sanitized within consent |
| Pilot success metrics | R-03 decision memo + validation-plan thresholds | Measurable, baseline-anchored, tied to validated pain |
| Named owners | Owner appointment (cannot be invented) | Executive + finance + controller + FP&A + IT owners from the partner |

## B. Decision matrix (populated at R-04 from evidence)

| Criterion | Weight | Option A | Option B | Option C | Evidence IDs |
|---|---|---|---|---|---|
| Validated pain depth | 25% |  |  |  |  |
| WTP / pilot acceptance | 20% |  |  |  |  |
| Data accessibility | 15% |  |  |  |  |
| Deployment fit | 15% |  |  |  |  |
| Implementation speed | 10% |  |  |  |  |
| Reference value | 10% |  |  |  |  |
| Risk / control burden | 5% |  |  |  |  |
| **Total** | 100% |  |  |  |  |

Rule: no option enters the matrix without ≥1 evidence ID; the winner must be the highest total AND have no unmitigated critical blocker.

## C. Charter pre-draft (fields marked pending-evidence)

Populate `enterprise-pilot-charter-template.md` with:
- Partner/owners: pending owner appointment (R-01 pipeline)
- Workflow/vertical/connector/deployment: pending R-04 selection above
- Baseline + problem statement: from R-02 quantified impact rows
- Hypotheses + measures + thresholds: from validation-plan exit thresholds
- Out-of-pilot scope: everything not selected by the matrix (e.g., other verticals, other connectors, autonomous AI, broad parity)
- Data exit / rollback / support / change-control: defined in the charter per template before pilot start

## D. Go / no-go gate (before any P-track implementation)

- [ ] R-04 selection memo approved by owner (evidence-linked)
- [ ] Charter populated and signed by partner owners
- [ ] Pilot success metrics baseline measured
- [ ] Data source contract + sanitization confirmed
- [ ] Deployment constraints accepted by partner IT
- [ ] Rollback/exit defined
- Only then do P-01…P-07 unblock.
