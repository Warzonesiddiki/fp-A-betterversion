# R-03 Evidence Synthesis Framework — Multi-Agent Squad

> **Date:** 2026-08-11 · **Status:** READY — executes when R-02 evidence exists
> **Purpose:** Turn R-02 session evidence into assumption dispositions and a decision memo, with zero ambiguity about what counts as validation.

## A. Evidence → status rules (from evidence-log standard)

| Status              | Required evidence                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| VALIDATED           | ≥3 relevant participants with consistent findings (or verified operational artifact) + contradictions documented + linked evidence IDs |
| PARTIALLY VALIDATED | 1–2 consistent participants or strong secondary triangulation + clear residual risk stated                                             |
| INVALIDATED         | ≥2 participants with disconfirming evidence (or verified operational counter-evidence)                                                 |
| UNVALIDATED         | below thresholds — stays UNVALIDATED; no claim change                                                                                  |

- A single quote is a signal, not validation.
- Contradictory evidence is preserved and must appear in the synthesis.
- Secondary evidence (E-003, E-011, E-012) may raise/lower _confidence in the hypothesis_ but can never change validation status.

## B. Per-assumption threshold checklist (applied at R-03)

| Assumption                               | Validating evidence (must meet)                                                                                                            | Invalidating evidence (any of)                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| A-01 $500k+ WTP                          | ≥4 CFOs quantify material close/planning cost/risk AND ≥2 accept paid pilot/LOI path (validation-plan)                                     | ≥3 CFOs say budget <$100k or would extend incumbent instead             |
| A-02 local-first differentiator          | ≥4 IT/security accept a clear deployment pattern; no unmitigated critical blocker; ≥3 buyers cite deployment flexibility as a top-3 reason | ≥3 buyers say cloud/standard SaaS preferred; local-first seen as burden |
| A-03 close→decision→board-pack wedge     | ≥70% controllers rank reconciliation/certification/evidence top-3 urgent; CFOs repeat the close-loop pain unprompted                       | ≥3 buyers say planning speed matters more than close control            |
| A-06 decision workspace beats dashboards | ≥5 CFO/finance leaders complete materiality tasks; ≥80% unassisted                                                                         | executives prefer familiar KPI dashboards; cannot explain ranking       |
| A-07 one connector + import sufficient   | one connector in ≥50% of target accounts OR CSV/XLSX accepted for paid pilot                                                               | target accounts have ≥3 distinct critical connectors; CSV rejected      |
| A-13 enterprise multi-entity ICP         | enterprise CFO/controller/FP&A/IT interviews consistent; procurement analysis; paid-pilot evidence                                         | buyers skew mid-market; enterprise committee rejects the narrative      |
| A-14 multi-stakeholder buying committee  | role-based research shows one connected narrative serves all roles                                                                         | roles want conflicting products/narratives                              |

## C. Decision-memo template (output of R-03)

```markdown
# R-03 Decision Memo — {date}

## Assumption dispositions

| ID  | Status | Evidence IDs | Contradictions | Residual risk |
| --- | ------ | ------------ | -------------- | ------------- |

## Validated findings (what changes downstream)

1. {finding + evidence IDs}

## Invalidated / challenged findings (what must change)

1. {finding + evidence IDs + why}

## Blaze trigger

[ ] Multiple viable pilot directions remain → run a brainstorm session before R-04
[ ] Single clear direction → proceed

## Downstream rebaseline scope

- [ ] product-brief / prd / ux-design / architecture rows affected (list)
- [ ] assumption-registry statuses updated (only with linked evidence)
- [ ] research-to-requirements-traceability updated
```

## D. Synthesis meeting rules

1. Evidence-log rows first; no status change without linked E-IDs.
2. Present disconfirming evidence before supporting evidence.
3. Any assumption with mixed evidence → mark PARTIALLY VALIDATED + residual risk, or run a Blaze challenge session.
4. Do not rebaseline PRD/UX/architecture unless an assumption status actually changed.
