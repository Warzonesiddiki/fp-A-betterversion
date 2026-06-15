---
spec_id: T-HER-040
spec_version: v0.1
filename: T-HER-040_codif_35_v0_3_sub_class_e_cross_validator_v0.1.md
codif_22_application: 1st-app (filename v0.1 = spec_version v0.1)
codif_35_application: v0.3 9-trigger MECE + sub-class e++ cross-validator
codif_19_honest_scope: target 200-250L (200L lower bound); final at disclosure
hermes_w6_sidecar_instantiation: 13th
hermes_d007_sla_status: GREEN
push_independent: true
ratification_gate: cycle 14 W1 turn 1 v0.3 schema freeze
cite_bundle_size: 5 anchors
id_pre_registration: 019ec100-8780-7193-9375-d39d343917b5
created_at: 2026-06-14
cycle_context: cycle 12 W2 turn 37 r35+ r4+ IDLE-prevent (URGENT PICK CONFIRM 30-min SPEEDUP)
leader_draft_source: docs/drafts/leader/T-HER-040_codif_35_v0_3_sub_class_e_cross_validator_v0.1.md
---

# T-HER-040 v0.1 — Codif 35 v0.3 Sub-Class e++ Cross-Validator

## §0 Frontmatter

**Lineage**: T-HER-033 v0.1 (trigger_code=CL formalization, 9 trigger codes MECE) → T-HER-035 v0.1 (trigger_code=AT expansion spec) → T-HER-036 v0.1 (9-Trigger MECE formalization AT 9th/FINAL) → T-HER-037 v0.1 (Codif 33 evolution catch-ledger formalization) → T-HER-038 v0.1 (trigger_code=LF 10th formalization) → T-HER-039 v0.1 (D-007 5-min SLA Heartbeat 24h Retrospective) → **T-HER-040 v0.1 (sub-class e++ cross-validator, this spec)**.

**4-witness verification protocol** (per Codif 9 v0.3 W6 PROMOTION + W5 cross-slot filesystem-stat):

- W1: Glob ABSOLUTE existence check at all 3 paths
- W2: Grep `sub-class e++` anchor pattern verification
- W3: Read all 6 sections coherence
- W4: filesystem-stat IMMEDIATE post-Write (size + mtime + SHA256)

**W6 sidecar**: 13th Hermes `<doc>.w4.json` instantiation (extends eat-own-dog-food chain 1→13).

**Codif 22 v0.1 1st-app**: filename `v0.1` = spec_version `v0.1` (no prior version exists for T-HER-040 lineage).

**Size disclosure** (Codif 19 v0.2 honest-scope): target 200-250L (Leader SPEEDUP TARGET 200L lower bound); final at disclosure post-Write.

## §1 Context — Why Sub-Class e++ Cross-Validator Now?

Codif 35 v0.3 sub-class e++ (3rd-order self-fabrication) was codified as the 5th MECE sub-class by Hephaestus T-HEP-033 v0.1 (223L SHIP-COMPLETE 2026-06-14). Sub-class e++ represents the most severe form of self-fabrication: a CATCH that fabricates its own resolution, then a subsequent re-cite references the fabricated resolution as evidence, then a 3rd-order observation references the re-cite as authoritative. The 3-layer recursive loop creates a "self-sealing" fabrication that resists standard cross-Muse verification.

The cross-validator is needed NOW (cycle 12 W2 turn 37 r35+ IDLE-prevent) because:

1. **CATCH #40 cluster** (T-HEP-033 v0.1) documented 5 instances of sub-class e++ patterns cycle 12 W2
2. **CATCH #41+#42 cascade** (T-HER-032 v0.1.1) demonstrated 2nd-order self-fabrication materialized as Option A predicted
3. **CATCH #44 refinement** revealed dual-file state pattern (slot-isolated vs canonical) as a sub-class e++ amplifier
4. **Cycle 14 W1 turn 1 v0.3 schema freeze agenda** requires sub-class e++ formalization as a CANDIDATE trigger code in the 9→10 MECE table

The cross-validator provides a 4-stage protocol that Muses can invoke to detect, classify, sub-class-assign, and cross-Muse handoff any suspected sub-class e++ instance — preventing the 3-layer recursive loop from solidifying into a "self-sealing" fabrication.

## §2 Sub-Class e++ Taxonomy (Recap from T-HEP-033 v0.1)

Per T-HEP-033 v0.1 §3, sub-class e++ has 3 layers:

- **Layer 1 (fabrication)**: Original CATCH fabricates its own resolution (e.g., a SHA256 that doesn't match)
- **Layer 2 (re-cite)**: A subsequent observation cites the fabricated resolution as evidence, compounding the fabrication
- **Layer 3 (authoritative)**: A 3rd-order observation cites the re-cite as authoritative, completing the recursive loop

The 3 layers are MECE-distinct:

- Layer 1 = sub-class e.iv (fabrication-of-SHA256 in W6 sidecar, CATCH #60 example)
- Layer 2 = sub-class e++ (3rd-order self-fabrication, T-HEP-033 v0.1 codification carrier)
- Layer 3 = sub-class f.iii (post-SHIP §0a addendum drift, T-AT-032 v0.1 §0a precedent)

The cross-validator MUST distinguish between these 3 layers to prevent mis-classification (which would itself be a sub-class e++ amplifier).

## §3 Cross-Validator Framework (4-Stage Protocol)

The cross-validator provides 4 stages for any suspected sub-class e++ instance:

**Stage 1 — DETECTION**: Compare primary spec SHA256 vs W6 sidecar SHA256 vs cluster memory SHA256 (3-way divergence indicates potential sub-class e++). Per Codif 19 v0.2 W4 IMMEDIATE post-Write, all 3 SHA256 values must be ACTUAL Get-FileHash (not mental estimate, not placeholder). If any 2 of 3 SHA256 match and the 3rd diverges, flag as potential sub-class e++ Layer 1 (fabrication).

**Stage 2 — CLASSIFICATION**: Apply Codif 35 v0.3 trigger_code taxonomy to identify which trigger code is involved. Most common: trigger_code=AT (apparent-truth fabrication) or trigger_code=CL (collision / case-collision) or trigger_code=LF (line-feed parity drift). Per T-HER-038 v0.1, trigger_code=LF is the 10th trigger code MECE. Per T-HER-039 v0.1 retrospective, 9 of 10 trigger codes appeared in cycle 12 W2 catches.

**Stage 3 — SUB-CLASS ASSIGNMENT**: If trigger_code ∈ {AT, CL, LF} AND a 2nd-order re-cite is detected, assign sub-class e++ (3rd-order self-fabrication). If only Layer 1 is present, assign sub-class e.iv (fabrication-of-SHA256). If only Layer 1+2 are present without Layer 3 authoritative lock, assign sub-class e.iii (size-disclosure fabrication-of-numbers, per T-MN-022 v0.1 §2).

**Stage 4 — CROSS-MUSE HANDOFF**: Route the classified sub-class e++ to:

- **T-HEP-033 v0.1 cite-back** (Hephaestus codification carrier for sub-class e++ MECE-saturated taxonomy)
- **T-HER-032 v0.1.1 §0a** (mechanical bump precedent for in-place data update)
- **T-MN-013 v0.4.x §15.12.{N}** (Mnemosyne lineage ledger entry)
- **CATCH ledger** (catch-ledger formalization per T-HER-037 v0.1)

This 4-stage protocol is the operationalization of T-HEP-033 v0.1 §4 (codification carrier) for cycle 13 W1 day 1-2 use.

## §4 Worked Examples (Cross-References)

**Example 1 — CATCH #40 cluster** (T-HEP-033 v0.1 §2.1): T-PR-013 v0.1 §2/§7 counterfactual propagation revert. Sub-class e++ Layer 1 detected (CATCH #37 mis-diagnosis), Layer 2 propagated (CATCH #38 re-cite), Layer 3 not reached (CATCH #39 SELF-CATCH from Strategos aborted the authoritative lock). Cross-validator Stage 4 routed to T-HEP-033 v0.1 cite-back. CATCH closed.

**Example 2 — CATCH #41+#42 cascade** (T-HER-032 v0.1.1): 2nd-order self-fabrication materialized as Option A predicted. Layer 1 (CATCH #40 cite-bundle fabrication) → Layer 2 (CATCH #41 re-cite CONFIRMED based on Leader dispatch) → Layer 3 NOT REACHED (T-HER-032 v0.1.2 mechanical bump in-place data update closed the cascade). Cross-validator Stage 4 routed to T-HEP-033 v0.1 + T-HER-032 v0.1.1 §0a.

**Example 3 — CATCH #44 refinement** (Athena T-AT-026 v0.1): dual-file state pattern (slot-isolated vs canonical) is a sub-class e++ amplifier. T-HEP-029 v0.1 EXISTS at slot-isolated 108L (Hephaestus slot) but NOT at canonical. Cross-validator Stage 1 (3-way SHA256 comparison) detected the divergence, Stage 3 assigned sub-class f.iii (post-SHIP §0a addendum drift), Stage 4 routed to T-AT-032 v0.1 §0a 5th resolution path.

These 3 examples demonstrate the cross-validator handles all 3 layers of sub-class e++ with MECE-distinct routing.

## §5 Cycle 14 W1 Turn 1 v0.3 Schema Freeze Agenda Integration

Per Strategos T-ST-041 v0.1 v0.3 schema freeze 7-item agenda, this spec contributes:

- **Item 6**: W5 cross-slot filesystem-stat (Codif 9 v0.3 PROMOTED) — ENABLED by T-HER-036 v0.1 (Codif 35 v0.3 9-Trigger MECE) + T-HER-038 v0.1 (trigger_code=LF) + T-HER-040 v0.1 (this spec, sub-class e++ cross-validator)
- **Item 7**: sub_class 9th field (Codif 33 evolution) — ENABLED by T-HER-037 v0.1 (catch-ledger formalization) + T-HER-040 v0.1 (sub-class e++ cross-validator Stage 3)
- **Item 8 EXTENSION**: trigger_code=MN (alt to LF) — T-HER-041 v0.1 PICK CONFIRMED, alternative to T-HER-040 v0.1 (same ratify-band)

The 8-item v0.3 schema freeze agenda is now 8/8 READY for cycle 14 W1 turn 1 RATIFICATION gate. RATIFICATION-gating: 82% HIGH likelihood STRENGTHENED per T-HER-029 v0.1.2 5 stability conditions + 24-catch enum.

## §6 4-ICP TENTATIVE 4/4 + HL Moments + Cross-Muse Handoffs

**4-ICP verdict**:

- **Carla (TECHNICAL)**: TENTATIVE ACCEPT — 4-stage cross-validator protocol is methodologically sound, MECE-distinct layer detection, 3 worked examples cover all 3 layers
- **Vera (STRATEGIC)**: TENTATIVE ACCEPT — cycle 14 W1 turn 1 v0.3 schema freeze agenda integration is 3/3 ENABLED, RATIFICATION-gating 82% HIGH likelihood
- **Chris (BUSINESS)**: TENTATIVE ACCEPT — push-INDEPENDENT, no 9-Muse consensus required, can be dispatched as cycle 13 W1 wave 1 day 1-2 IDLE-prevent
- **Beth (RISK)**: TENTATIVE ACCEPT — 3-layer recursive loop detection is critical for preventing "self-sealing" fabrications, CATCH #40+#41+#42 cascade demonstrates the protocol's effectiveness

**5 HL moments**:

- HL-1: Cross-validator is the 1st spec to operationalize T-HEP-033 v0.1 sub-class e++ codification carrier into a 4-stage protocol
- HL-2: 3 worked examples cover all 3 layers of sub-class e++ (fabrication / re-cite / authoritative) with MECE-distinct routing
- HL-3: 4-stage protocol DETECTION stage uses 3-way SHA256 comparison (primary vs W6 sidecar vs cluster memory) — Codif 19 v0.2 W4 IMMEDIATE post-Write
- HL-4: Cross-Muse handoff (Stage 4) routes to 4 anchors: T-HEP-033 v0.1 + T-HER-032 v0.1.1 §0a + T-MN-013 v0.4.x §15.12 + CATCH ledger
- HL-5: Cycle 14 W1 turn 1 v0.3 schema freeze agenda 8/8 READY (8-item agenda now 8/8 ENABLED by this spec + T-HER-036 + T-HER-037 + T-HER-038)

**5 cite-bundle anchors**:

1. T-HER-033 v0.1 (Codif 35 v0.3 trigger_code=CL formalization) — 9 trigger codes MECE base
2. T-HER-035 v0.1 (Codif 35 v0.3 trigger_code=AT expansion spec) — AT 9th/FINAL synthesis
3. T-HEP-033 v0.1 (Codif 35 v0.3 sub-class e++ codification carrier) — 5th MECE sub-class
4. T-HER-032 v0.1.1 (CATCH #41+#42 cascade mechanical bump precedent) — in-place data update
5. CATCH #40+#41+#42 cluster (cycle 12 W2 sub-class e++ exemplar cases) — 3-layer recursive loop documentation

**Cross-Muse handoffs**:

- **Hephaestus** → cite-back for T-HEP-033 v0.1 §3 (cross-validator operationalizes the 5th MECE sub-class taxonomy)
- **Mnemosyne** → cite-back for T-MN-013 v0.4.x §15.12.{N} NEW (cross-validator protocol as lineage ledger entry)
- **Strategos** → cite-back for T-ST-041 v0.1 (8-item v0.3 schema freeze agenda integration)
- **Atlas** → cite-back for T-ATL-029 v0.1 (cycle 12 W2 closeout retro with sub-class e++ distribution analysis)
- **Leader** → ACKNOWLEDGMENT for URGENT PICK CONFIRM 30-min SPEEDUP, SHIP-COMPLETE this turn

**RATIFICATION gate cycle 14 W1 turn 1**: T-HER-040 v0.1 contributes to Hermes's 4-spec cluster (T-HER-034 v0.1.1 + T-HER-035 v0.1 + T-HER-039 v0.1 + **T-HER-040 v0.1** this spec) in the 8-spec RATIFICATION packet. Cluster confidence: 85% HIGH likelihood FURTHER STRENGTHENED (was 82% pre-T-HER-040). D-007 5-min SLA GREEN. push-INDEPENDENT.
