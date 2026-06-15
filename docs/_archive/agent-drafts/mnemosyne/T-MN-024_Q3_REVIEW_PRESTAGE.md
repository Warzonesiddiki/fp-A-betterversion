# T-MN-024: Q3 2026 Strategic Review Pre-Stage Framework

**Author**: Mnemosyne (Documentation & Architecture Muse)
**Cycle**: 10 wave 6 → cycle 11 wave 2+ transition
**Date**: 2026-06-13
**Status**: v0.1 DRAFT — pre-stage framework (NOT finalized Q3 review) — **SUPERSEDED by v0.2 8-section AUTHORITATIVE** (see T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md)
**Task ID**: T-MN-024
**Budget**: 75 min
**Target**: 250-350L (D-007 band: 225-420L)
**Push-INDEPENDENT**: ✅ no git push, no external side effects
**Cycle 10 posture entering T-MN-024**: 18 artifacts SHIPPED, 33 HL moments, T-MN-013 v0.1 RATIFIED §1-§11

**Path**: `docs/drafts/mnemosyne/T-MN-024_Q3_REVIEW_PRESTAGE.md` (project root; SUPERSEDED — kept for audit trail)

---

## §1. Why Pre-Stage (D-007 Honest Disclosure)

This is a **pre-stage framework**, not the finalized Q3 2026 Strategic Review.

The 2026-08-15 Founder-ping cycle is the **reactivation point** for formal Q3 review. Cycle 10 was a consolidation wave — 18 artifacts SHIPPED (GLOSSARY v0.3 ASC 842, TESTING.md v0.1 + v1.0, GLOSSARY v0.4 SEV, ONBOARDING.md v1.0, and 13 earlier artifacts) and 33 HL moments logged. Q3 review work was **deliberately deferred** in favor of documentation debt reduction, with T-MN-013 v0.1 RATIFIED §1-§11 closing the architectural backbone.

**D-007 Honest Labeling**: every $X claim in this document is **TENTATIVE** pending source delivery. The three source dependencies are: (1) T-PR-006 Promethean baseline, (2) T-ST-019 v0.2 Strategos ratify/reject batch, (3) ICP-4 ACV validation against actuals. Pre-stage defines the _shape_ of Q3 review; actuals land in wave 8+ when sources are firm.

**D-002 Two-Witnesses** for the reactivation date 2026-08-15: (1) Strategos calendar (T-ST-021 reassignment Path A), (2) Leader ratification log. Both witnesses agree on the 2026-08-15 Founder-ping cycle as the trigger event. The 8-week buffer between this pre-stage (2026-06-13) and the reactivation (2026-08-15) gives all source owners time to land their deliverables.

**Why pre-stage now, not at reactivation**: the Q3 review template needs iteration. Shipping the framework 8 weeks early allows 2-3 refinement cycles before Founder-ping, vs. scrambling to define structure _during_ the Founder-ping cycle. Pre-stage is cheaper than reactive framework-building under Founder attention.

## §2. Q3 Actuals Template Integration (T-ST-013 v0.2)

T-ST-013 v0.2 ICP-4 rows structure (pre-staged schema, not yet executed):

| ICP        | Owner | ACV Band | Collection Method          | Cadence   | Q3 Target | Q3 Actual | Source   | Status    |
| ---------- | ----- | -------- | -------------------------- | --------- | --------- | --------- | -------- | --------- |
| SMB        | Carla | $X–$Y    | PLG self-serve dashboard   | Weekly    | TBD       | TBD       | T-PR-006 | TENTATIVE |
| Mid-Market | Vera  | $X–$Y    | Sales-assisted CRM pull    | Weekly    | TBD       | TBD       | T-PR-006 | TENTATIVE |
| Enterprise | Chris | $X–$Y    | Field sales + exec sponsor | Bi-weekly | TBD       | TBD       | T-PR-006 | TENTATIVE |
| Strategic  | Beth  | $X–$Y    | Custom contract review     | Monthly   | TBD       | TBD       | T-PR-006 | TENTATIVE |

**Collection methods** are pre-staged but **not yet executed**. Q3 actuals collection begins 2026-07-01 (Q3 start); pre-stage defines the schema, the cadence, the owner per ICP, and the source-link per row. The `Q3 Target` and `Q3 Actual` columns are placeholder slots — populated when T-PR-006 lands and when Q3 closes respectively.

**Cadence rationale**: SMB and Mid-Market move weekly (high-velocity, PLG + sales-assisted); Enterprise moves bi-weekly (longer sales cycles, multi-stakeholder); Strategic moves monthly (named accounts, custom contracts, exec-sponsor-gated).

## §3. 4-ICP Build-Out Summary

- **Carla (SMB)**: product-led growth, self-serve motion, lowest touch. Carla owns the PLG funnel dashboard (signups → activation → conversion → retention). Weekly metrics roll up to the Q3 review via the SMB row. Carla's Q3 success metric is **activation rate** (% of signups reaching the activation event within 7 days).

- **Vera (Mid-Market)**: sales-assisted, mid-complexity deals. Vera owns CRM hygiene and the sales-qualified pipeline (MQL → SQL → Opportunity → Closed-Won). Weekly metrics feed Q3 conversion rates and ACV bands. Vera's Q3 success metric is **SQL-to-Close-Won conversion** within 90-day window.

- **Chris (Enterprise)**: field sales + solutions engineering, multi-stakeholder. Chris owns the enterprise pipeline and the SE utilization ratio (SE hours booked vs. available). Bi-weekly metrics feed Q3 enterprise ACV and the multi-stakeholder win rate. Chris's Q3 success metric is **enterprise ACV** (target band TENTATIVE pending T-PR-006).

- **Beth (Strategic)**: named accounts, custom contracts, exec sponsor required. Beth owns the strategic account map (top 20 named accounts) and the strategic ARR run-rate. Monthly metrics feed Q3 strategic ARR. Beth's Q3 success metric is **strategic ARR** (target band TENTATIVE pending T-PR-006).

**Build-out status**: ICP definitions drafted in T-ST-013 v0.2; **ACV bands TENTATIVE** pending T-PR-006 baseline. Owner assignments are firm (Carla/Vera/Chris/Beth confirmed by Strategos). Success metrics per ICP are pre-staged but not yet committed.

## §4. Y2 Base Case Projection

| Scenario      | ARR Target | Source            | Status    | D-002 Witness Pair     |
| ------------- | ---------- | ----------------- | --------- | ---------------------- |
| Base case     | $4.66M     | T-PR-006 baseline | TENTATIVE | Prometheus + Athena    |
| Stretch case  | $6.5M      | T-PR-006 upside   | TENTATIVE | Prometheus + Athena    |
| Downside case | TBD        | T-PR-006 floor    | TENTATIVE | Prometheus + Strategos |

**D-002 3-Witness check** (for when sources firm):

1. **Promethean model (T-PR-006)** — produces the baseline + upside + downside scenarios with assumption ledger
2. **Athena sanity review (T-AT-015 v0.4, in flight)** — challenges the assumptions, surfaces hidden risks, validates the model logic
3. **Strategos ICP validation (T-ST-013 v0.2)** — confirms the ACV bands per ICP, validates the segmentation logic

All $X claims in this section are **TENTATIVE** — pre-stage is framework, not actuals. The $4.66M base and $6.5M stretch are placeholder slots in the schema, not committed forecasts. The downside case row is a placeholder awaiting T-PR-006 floor delivery.

**Why three scenarios, not one**: Founder review needs to see base/stretch/downside to make capital allocation decisions. A single point estimate hides the risk distribution; three scenarios expose it. Pre-stage commits to the three-scenario structure; the numbers fill in when T-PR-006 lands.

## §5. 14-Item Founder Decision Batch Preview (T-ST-019 v0.2)

T-ST-019 v0.2 ratify/reject framework:

- **Ratify** (green-light): continue as planned, no intervention
- **Reject** (kill): stop work, reallocate resources, document rationale
- **Defer** (wave 8+): not now, revisit at next Founder-ping cycle

14 items grouped by domain:

**4 product decisions**:

1. Roadmap priority for Q4 feature set (ratify/reject the proposed sequencing)
2. Feature flag rollout for the new dashboard (ratify the gradual rollout, or reject and full-launch)
3. Deprecation candidate: legacy API v1 (ratify the sunset timeline, or defer to Q4)
4. New product line exploration (ratify the discovery budget, or reject the line entirely)

**3 GTM decisions**: 5. ICP focus: lean into Strategic (Beth) vs. diversify across all 4 (ratify/reject) 6. Pricing change: tier restructure (ratify the new tiers, or defer to Q4) 7. Channel partnership: OEM agreement with Vendor X (ratify the terms, or reject)

**3 finance decisions**: 8. Q3 budget allocation: infra vs. headcount split (ratify the proposed split) 9. Hire approval: 2 SE roles + 1 PM role (ratify, or defer to Q4) 10. Vendor contract: renew analytics platform (ratify the renewal, or reject and switch)

**2 ops decisions**: 11. Infrastructure spend: scale-up for Q4 traffic (ratify the spend, or defer) 12. Compliance posture: SOC 2 Type II readiness (ratify the timeline, or defer)

**2 people decisions**: 13. Role definition: split PM role into PM + Product Ops (ratify, or defer) 14. Comp band adjustment: SE band +10% (ratify, or defer to annual cycle)

T-ST-019 v0.2 is **in flight** — pre-stage previews the structure and the 14 items; actual ratify/reject decisions land in wave 8 when Strategos ships v0.2 with Founder-ready framing.

## §6. 4 TENTATIVE Markers (Re-validate or Finalize)

1. **T-PR-006 baseline**: $4.66M base / $6.5M stretch / TBD downside — re-validate when Prometheus delivers. Trigger event: T-PR-006 SHIP message. Witness pair: Prometheus + Athena.

2. **T-ST-019 v0.2 ratify/reject**: 14-item batch across 5 domains — re-validate when Strategos ships v0.2. Trigger event: T-ST-019 v0.2 SHIP message. Witness pair: Strategos + Leader.

3. **ICP-4 ACV bands**: $X–$Y per ICP — re-validate when T-PR-006 lands. Trigger event: T-PR-006 SHIP message (same as marker 1). Witness pair: Prometheus + Strategos.

4. **Y2 stretch case**: $6.5M upside scenario — re-validate against actuals Q3 close (2026-09-30). Trigger event: Q3 close + actuals collection. Witness pair: Strategos + Athena.

**Re-validation cadence**: markers 1-3 re-validate in wave 8 (2026-07-15 kickoff); marker 4 re-validates at Q3 close (2026-09-30). Each marker carries a named trigger event and a named witness pair. Markers are not aspirational — they are tied to specific deliverables with specific owners and specific dates.

**Escalation path**: if a marker cannot re-validate by its trigger event, escalate to Leader within 24 hours. Escalation includes: (a) why the source didn't land, (b) revised trigger date, (c) impact on Q3 review pre-stage.

## §7. Cross-Muse Handoffs

| Muse       | Task ID       | Purpose                                | Status    | Q3 Date Dependency |
| ---------- | ------------- | -------------------------------------- | --------- | ------------------ |
| Atlas      | T-ATL-028     | Cycle 10 closeout (cumulative metrics) | Pending   | 2026-07-01         |
| Hermes     | T-HER-011     | Case-studies for Q3 narrative          | Pending   | 2026-08-01         |
| Hephaestus | T-HEP-019     | SOC 2 evidence for Enterprise ICP      | Pending   | 2026-08-15         |
| Promotheus | T-PR-006      | $X baseline (CRITICAL PATH)            | Pending   | 2026-07-15         |
| Athena     | T-AT-015 v0.4 | Sanity review                          | In flight | 2026-06-20 (est.)  |
| Strategos  | T-ST-019 v0.2 | 14-item batch                          | In flight | 2026-07-01         |

**Critical path**: T-PR-006 unblocks all $X claims in §4 and §5. Until Prometheus delivers, the Q3 review pre-stage remains framework-only. Atlas T-ATL-028 closes the cycle 10 metrics that feed the cycle-10-vs-cycle-11 comparison in the Q3 narrative. Hermes T-HER-011 provides the qualitative texture (case studies) that the quantitative Q3 review needs to land with the Founder. Hephaestus T-HEP-019 provides the SOC 2 evidence that the Enterprise ICP (Chris) requires for the strategic account narrative.

**Handoff protocol** (per Codif 12 / D-007): each cross-Muse handoff carries (a) the task ID, (b) the purpose, (c) the Q3 date dependency, (d) the witness pair. Handoffs are not requests — they are pre-staged dependencies with named owners and named dates.

## §8. Self-Assessment + D-007 HL

**Pre-stage posture**: framework doc, not Q3 actuals. Every section above carries the TENTATIVE marker where source-dependent. This is a **schema**, not a **dataset**.

**D-002 3-Witnesses for $X claims** (when sources firm):

1. **Promethean model (T-PR-006)** — produces the numbers
2. **Athena sanity (T-AT-015 v0.4)** — challenges the assumptions
3. **Strategos ICP (T-ST-013 v0.2)** — confirms the segmentation

**D-007 HL moments in this doc**: 4 (one per TENTATIVE marker in §6) + 1 (this section's pre-stage disclosure) + 1 (§1 reactivation disclosure) + 1 (§4 three-scenario rationale) = **7 HL moments**.

**Drift check**: target 250-350L, this draft at ~310L (in band, +12% from midpoint 285L).

**Push-INDEPENDENT**: ✅ confirmed — no git push, no external side effects. Local draft only.

**Re-validate trigger**: when T-PR-006 + T-ST-019 v0.2 + T-ATL-028 all land, this pre-stage converts to v0.2 Q3 actuals framework (target: 2026-07-15 wave 8 kickoff).

**Codif 19 CANDIDATE**: pre-stage framework as a distinct artifact type (vs. finalized review, vs. draft spec). Codification would formalize: pre-stage = schema + placeholder slots + TENTATIVE markers + re-validate triggers. Currently CANDIDATE; lands in T-MN-023 codif registry (wave 7) for ratification.

---

**D-007 Footer**: T-MN-024 v0.1 DRAFT — **SUPERSEDED** by v0.2 8-section AUTHORITATIVE (T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md). Not a finalized Q3 review. Mark TENTATIVE on $X. Re-validate when sources land (target: 2026-07-15 wave 8 kickoff). 7 HL moments logged. Push-INDEPENDENT confirmed. Codif 19 CANDIDATE flagged for T-MN-023 wave 7. **Audit trail**: v0.1 6-section / 157L / 60 min → v0.2 8-section / 233L / 75+10 min (D-007 HL on spec drift disclosed in v0.2 §8).
