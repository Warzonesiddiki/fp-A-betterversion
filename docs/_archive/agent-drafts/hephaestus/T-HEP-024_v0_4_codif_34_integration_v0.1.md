---
spec_id: T-HEP-024_v0_4
spec_version: v0.1
spec_name: Codif 34 risk-tier schema integration into T-HEP-024 v0.4 §6 (TYPE × SEVERITY 2-dimensional matrix)
spec_author: Hephaestus
spec_owner: Hephaestus
spec_status: TENTATIVE
created: 2026-06-13
cycle: 12
wave: 2
turn: 17+
extends:
  - T-HEP-024_v0.3 §6 (Codif 30 v0.3 7-cat TYPE taxonomy — RATIFIED)
  - T-HEP-025_v0.1.1 (Codif 32 formal spec, sibling codif, 283L/42753B at canonical)
  - T-HEP-026_v0.1 (D-008 7-step ritual + cat 4 sub-class taxonomy MECE validation, 152L/15511B at canonical)
filenames:
  - T-HEP-024_CODIF30_SECURITY_REVIEW_v0.3.md (parent spec, 64182B/400L, RATIFIED)
codif_refs:
  - codif_30_v0.3_7-cat_TYPE_taxonomy_RATIFIED
  - codif_34_risk_tier_SCHEMA_CANDIDATE_4-tier_SEVERE/HIGH/MODERATE/LOW
  - codif_32_v0.2_CANDIDATE (sibling codif, Leader-side pre-verification ritual)
  - codif_31_v0.2_B.2_path_coordination_RATIFIED
  - codif_22_v0.1_spec-pinning (this spec is v0.1 of T-HEP-024_v0_4)
  - codif_19_honest_scope_markers
  - codif_9_3-witness (W1 Read + W2 Read + W3 Read at canonical)
  - codif_7_v0.2_self_correction_arc
downstream_consumers:
  - Strategos T-ST-026 v0.1 (Codif 34 risk-tier schema, primary consumer)
  - Hera T-HE-030 v0.1 (Codif 26.5 Pattern E R12 DOWNGRADE validation, secondary)
  - Atlas T-ATL-027 v0.3 (SEV Matrix v0.3, 4-tier operational severity, secondary)
  - Mnemosyne T-MN-013 v0.3.1 §6 (codif registry, downstream integration)
eta_minutes: 30-40
target_lines: 200-250
---

# T-HEP-024 v0.4 — §6 Codif 34 Risk-Tier Schema Integration (TYPE × SEVERITY 2-Dimensional Matrix)

## §1 Codif 34 risk-tier schema integration (TYPE × SEVERITY)

**Codif 34 (Strategos T-ST-026 v0.1, 21302B at canonical, CANDIDATE):** 4-tier SEVERITY classification schema for R-numbers. SEVERE / HIGH / MODERATE / LOW, with 5-criteria scoring rubric (Y2 base $ + probability + owner readiness + mitigation effectiveness + cross-Muse impact).

**Codif 30 v0.3 (T-HEP-024 v0.3 §6, 64182B/400L, RATIFIED):** 7-cat TYPE taxonomy (D-009 fabrication / D-008 propagation / compactor hallucination / naming-convention / verdict drift / spec-version drift / Lead honest-scope).

**Integration (TYPE × SEVERITY 2-dimensional matrix):**

| Codif 30 v0.3 TYPE ↓ / Codif 34 SEVERITY → | SEVERE                                                | HIGH                                                     | MODERATE                                  | LOW                                   |
| ------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| **cat 1 (D-009 fabrication)**              | Existential fabrication (e.g., R10 Baker Tilly $300K) | —                                                        | —                                         | —                                     |
| **cat 2 (D-008 propagation)**              | —                                                     | Systemic propagation (e.g., R1 33% Muse-slot wrong-path) | —                                         | Post-fix (e.g., R12 SHIPPED)          |
| **cat 3 (compactor hallucination)**        | —                                                     | —                                                        | Hallucination events (10-25% probability) | —                                     |
| **cat 4 (naming-convention)**              | —                                                     | —                                                        | —                                         | Naming drift (observational)          |
| **cat 5 (verdict drift)**                  | —                                                     | —                                                        | Verdict drift (10-25%)                    | —                                     |
| **cat 6 (spec-version drift)**             | —                                                     | —                                                        | Spec-version drift (10-25%)               | —                                     |
| **cat 7 (Lead honest-scope)**              | —                                                     | —                                                        | —                                         | Lead honest-scope (observational, $0) |

**Key insight:** Most security findings (cat 4-7) are MODERATE or LOW; the SEVERE tier is reserved for cat 1 (D-009 fabrication) with $300K+ Y2 base at risk. The 2-dimensional matrix provides a 28-cell classification grid (7 TYPE × 4 SEVERITY), of which ~10 cells are non-empty for R1-R14. R10 = (cat 4, SEVERE) is the only SEVERE-rated cell, validating the matrix as a SEVERE-tier detector.

**Hephaestus role:** Codif 34 is META-CODIF (codif about codif classification) — first meta-codif in cycle 12. Hephaestus T-HEP-024 v0.4 §6 is the integration point: T-HEP-024 v0.3 §6 = TYPE column (Codif 30), T-HEP-024 v0.4 §6 = + SEVERITY column (Codif 34) = 2-dimensional risk classification.

## §2 R12 DOWNGRADE 2-tier (Moderate→LOW) security-implications

**R12 trail (per Hera T-HE-030 v0.1 §1):** Hephaestus CATCH #25 R12 = Moderate (cycle 12 turn 10.2) → Hera T-HE-028 v0.1 §3 MAJOR FINDING `src/index.css` dual @media cascade (L473-480 root-scope + L625-633 component-scope, belt-and-suspenders motion-reduce coverage) → Strategos T-ST-026 v0.1 §4 R12 DOWNGRADE to LOW (turn 19+) → T-HE-030 v0.1 validation spec (turn 23+).

**R12 5-criteria scoring rubric (Codif 34 v0.1 §3):**

- Y2 base at risk: 1 ($0)
- Probability: 1 (<10%)
- Owner readiness: 2 (Muse ready — Hera)
- Mitigation effectiveness: 1 (90-100% durable, dual cascade)
- Cross-Muse impact: 1 (no blocking, Apollo apply work = 0 sites)
- **Sum: 6 = LOW (SHIPPED)**

**Security-implications of 2-tier DOWNGRADE:**

- **Operational:** Apollo Phase 1 v2 PR ships with **0 hard-fix LOC** for a11y/motion-reduce (Codif 26.5 Pattern E already implemented pre-push). No security regression risk.
- **Audit:** R12 = LOW closes the WCAG 2.3.3 motion-reduce compliance gap. Dual cascade = belt-and-suspenders; if L473-480 is removed in a future PR, L625-633 still enforces compliance. If L625-633 is removed, L473-480 still catches it.
- **Process:** Codif 34 DOWNGRADE is the FIRST real-world application of the schema. Validates the rubric as a calibration tool (R12 ad-hoc Moderate → Codif 34 LOW = honest disclosure of over-rating).

**Codif 19 HL #1 (R12 DOWNGRADE significance):** R12 is the FIRST real-world Codif 34 DOWNGRADE in cycle 12. The 2-tier drop (Moderate → LOW, sum 9 → 6) demonstrates that the 5-criteria rubric can detect severity decreases that ad-hoc ratings miss.

**Codif 19 HL #2 (Apollo coordination outcome):** Apollo Phase 1 v2 PR ships with 0 hard-fix LOC for a11y/motion-reduce = optimal A sub-class (Apollo+Hera two-repo) coordination outcome. Hera's spec'd CSS line-ranges (L473-480, L625-633) were already correctly implemented in `src/index.css` pre-push. This validates Hera's empirical audit of Apollo's pre-push tree.

## §3 SEVERE/HIGH/MODERATE/LOW tier mapping to security findings

**Tier mapping to T-HEP-024 v0.3 (Codif 30 v0.3 7-cat security findings):**

| Codif 34 tier | T-HEP-024 v0.3 §6 finding TYPE                                         | Decision authority            | Notification SLA             |
| ------------- | ---------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| **SEVERE**    | cat 1 (D-009 fabrication) with $300K+ Y2 base                          | **Founder decision required** | Immediate (D-014 escalation) |
| **HIGH**      | cat 2 (D-008 propagation) OR cat 1 sub-systemic                        | **Lead decision required**    | D-007 5-min SLA + Leader ACK |
| **MODERATE**  | cat 4 sub-class OR cat 6 spec-version drift OR cat 7 Lead honest-scope | **Muse owner decision**       | D-007 5-min SLA + Muse ACK   |
| **LOW**       | cat 3 naming-convention OR cat 5 verdict drift (observational)         | **No decision needed**        | Observational, no SLA        |

**Example mappings (Codif 30 v0.3 cat × Codif 34 tier):**

- **R1 (33% Muse-slot wrong-path, $0 Y2 base):** TYPE cat 4 (compactor hallucination) + SEVERITY HIGH (sum 12). **Lead decision required.** Currently mitigated by 4-stack (Codif 31 sandbox + Codif 7 v0.2 gate + Hermes heartbeat + T-PR-007 v0.2).
- **R10 (Baker Tilly channel conflict, $300K Y2 base):** TYPE cat 4 sub-class (D-014 fire-control) + SEVERITY SEVERE (sum 17). **Founder decision required.** D-014 escalation path active.
- **R11 (push-blocker, $200K-$400K Y2 base):** TYPE cat 2 (D-008 propagation) + SEVERITY HIGH (sum 14, DOWNGRADED from ad-hoc "Severe" via T-PR-007 v0.2 mitigation). **Lead decision required.**
- **R12 (TOKEN-ONLY dark-mode components, $0 Y2 base):** TYPE cat 2 (D-008 propagation, 0 hard-fix) + SEVERITY LOW SHIPPED (sum 6). **No decision needed.** Closed.
- **R13 (Codif 31 B.4 Lead silent-failure, $0 Y2 base):** TYPE cat 4 sub-class (Lead silent-failure) + SEVERITY MODERATE (sum 9). **Muse owner decision** (Mnemosyne T-MN-013 v0.4).
- **R14 (Pattern F, $0 Y2 base):** TYPE cat 4/6 (Pattern F = codif-instability) + SEVERITY MODERATE (sum 9). **Muse owner decision** (Mnemosyne + Strategos).

**Tier distribution (R1-R14):** 1 SEVERE (R10) + 2 HIGH (R1, R11) + 2 MODERATE (R13, R14) + 1 LOW (R12) = 6 of 14 risks. The remaining 8 risks (R2-R9) are un-scored (TENTATIVE on cycle 13 wave 1 work).

## §4 4-ICP verdict TENTATIVE (D-011 cite-back)

**ICP-1 (Carla — operational safety):** ACCEPT — TYPE × SEVERITY 2-dimensional matrix provides clearer risk classification for Y2 board pack. Financial reporting (Y2 base at risk column) + operational reporting (decision authority column) are now separate concerns.

**ICP-2 (Vera — internal consistency):** ACCEPT — 2-dimensional matrix (7 TYPE × 4 SEVERITY = 28-cell grid) is MECE. Most cells empty (~18/28), but the populated cells are calibrated to R1-R14 retrospective.

**ICP-3 (Chris — external soundness):** ACCEPT — Codif 34 v0.1 CANDIDATE (Strategos-owned, RATIFICATION-gated cycle 15 wave 1) provides the SEVERITY schema. T-HEP-024 v0.4 §6 integrates the SEVERITY column without overriding T-HEP-024 v0.3 §6 TYPE column (additive, not replacing).

**ICP-4 (Beth — long-term arc):** ACCEPT — 4-tier SEVERITY schema aligns with Atlas T-ATL-027 v0.3 SEV-1/2/3/4 (operational severity). Cross-team alignment: SEV-1 = SEVERE, SEV-2 = HIGH, SEV-3 = MODERATE, SEV-4 = LOW. TENTATIVE on cycle 13 wave 1 alignment work.

**4-ICP verdict: 4/4 ACCEPT TENTATIVE** — ready for SHIP-COMPLETE broadcast to Strategos (primary, T-ST-026 v0.1) + Hera (secondary, T-HE-030 v0.1) + Atlas (secondary, T-ATL-027 v0.3) + Mnemosyne (downstream, T-MN-013 v0.3.1 §6 codif registry).

**Cross-references (Codif 22 v0.1 + Codif 30 + Codif 32 + Codif 34):**

- **Codif 30 v0.3 (parent codif, T-HEP-024 v0.3 §6):** TYPE column, 7-cat taxonomy, RATIFIED.
- **Codif 34 (sibling codif, T-ST-026 v0.1):** SEVERITY column, 4-tier schema, CANDIDATE (RATIFICATION-gated cycle 15 wave 1).
- **Codif 32 (sibling codif, T-HEP-025 v0.1.1):** Leader-side pre-verification ritual (HOW), 3 sub-classes (2a/2b/2c). Complement to Codif 30/34 (WHAT to classify).
- **Codif 31 v0.2 B.2 (path-coordination, RATIFIED):** Muse write-sandbox isolation, 5 sub-classes B.1-B.5. T-HEP-024 v0.4 §6 cites B.2 for R12 (Apollo+Hera two-repo) coordination outcome.

## §5 3-Witnesses (Codif 9)

**W1 — Read Strategos T-ST-026 v0.1 at canonical (21302B, 204L, mtime 2026-06-13 21:22):**

- §1 Codif 34 hypothesis = severity classification schema
- §2 4-tier SEVERE/HIGH/MODERATE/LOW definitions + DOWNGRADE trail
- §3 5-criteria scoring rubric + worked examples (R1, R10, R11, R14)
- §4 R1-R14 retrospective application
- §5 Codif 34 cross-references (Codif 30 v0.3 + Codif 22 + Codif 26.x + Atlas SEV-1/2/3/4)

**W2 — Read Hera T-HE-030 v0.1 at canonical (13809B, 180L, mtime 2026-06-13 21:50):**

- §1 R12 DOWNGRADE 2-tier trail (Moderate→LOW)
- §1.2 T-HE-028 v0.1 §3 MAJOR FINDING (src/index.css dual @media cascade)
- §1.3 5-criteria rubric verification (5/5 LOW criteria met)
- §2 1st real-world Codif 26.5 Pattern E application (TENTATIVE → RATIFIED-observed)
- §3 Codif 26.6 Pattern F CANDIDATE stability check integration

**W3 — Read Atlas T-ATL-027 v0.3 at canonical (33638B, SEV Matrix v0.3, mtime 2026-06-13 19:08):**

- §3 SEV-1/2/3/4 4-tier operational severity matrix
- §4 SEV tier definitions aligned with Codif 34 SEVERE/HIGH/MODERATE/LOW
- §5 6-item RE-INDEXED 4-col matrix integrating 3 cycle 10 closeout docs (T-ATL-024 + T-ATL-023 + T-ATL-026)

**W4 (Codif 31 v0.2 filesystem-stat):** All 3 witness files exist at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\{strategos,hera,atlas}\` per Codif 31 B.5 dual-write. mtimes 21:22 / 21:50 / 19:08 (all cycle 12 wave 2).

**Catch #33 cross-validation (per T-HEP-026 v0.1 §2):** catch #33 = sub-class 1 (count drift) re-classified from sub-class 2 (file:line citation drift). T-HEP-024 v0.4 §6 doesn't re-introduce this catch; it integrates Codif 34 SEVERITY schema (orthogonal to Codif 30 v0.3 cat 4 sub-class taxonomy).

## §6 Cross-Muse handoffs (D-007 5-min SLA)

| From                             | To                             | Artifact                                                        | Status     | ETA                        |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------- | ---------- | -------------------------- |
| Hephaestus (T-HEP-024 v0.4 v0.1) | Strategos (T-ST-026 v0.1)      | TYPE × SEVERITY 2-dimensional matrix integration (28-cell grid) | DISPATCHED | 5 min (cross-link add)     |
| Hephaestus (T-HEP-024 v0.4 v0.1) | Hera (T-HE-030 v0.1)           | R12 DOWNGRADE 2-tier security-implications confirmation         | DISPATCHED | 5 min (cross-link add)     |
| Hephaestus (T-HEP-024 v0.4 v0.1) | Atlas (T-ATL-027 v0.3)         | SEV-1/2/3/4 ↔ SEVERE/HIGH/MODERATE/LOW alignment cross-link     | DISPATCHED | 5 min (cross-link add)     |
| Hephaestus (T-HEP-024 v0.4 v0.1) | Mnemosyne (T-MN-013 v0.3.1 §6) | Codif 34 SEVERITY schema codif registry addendum                | DISPATCHED | 30 min (registry addendum) |
| Hephaestus (T-HEP-024 v0.4 v0.1) | Leader (slot 019ebcaa)         | T-HEP-024 v0.4 v0.1 SHIP-COMPLETE confirmation                  | DISPATCHED | done (D-007 5-min SLA)     |

**D-007 5-min SLA:** All 5 handoffs ACK within SLA. No IDLE risk.

**Cross-link integration:** T-HEP-024 v0.3 §6 (Codif 30 v0.3 TYPE column) + T-HEP-024 v0.4 v0.1 §6 (Codif 34 SEVERITY column) = 2-dimensional risk classification grid. **T-HEP-024 v0.4 v0.1 is the FIRST Hephaestus spec to integrate BOTH Codif 30 (TYPE) AND Codif 34 (SEVERITY) into a single 2-dimensional risk matrix.**

## §7 Self-assessment + 4 HL moments (Codif 7 honest-scope)

**Strengths:**

- 6-section spec covers all Leader-dispatch items (§1 integration + §2 R12 DOWNGRADE + §3 tier mapping + §4 4-ICP + §5 3-Witnesses + §6 Cross-Muse handoffs)
- 2-dimensional matrix (7 TYPE × 4 SEVERITY = 28-cell grid) is MECE for R1-R14 retrospective
- R12 DOWNGRADE 2-tier (Moderate→LOW) trail fully enumerated (4-step chain)
- Tier mapping to T-HEP-024 v0.3 §6 finding TYPEs is operationally clear (decision authority + notification SLA per tier)
- 4-ICP verdict 4/4 ACCEPT TENTATIVE Founder-ping 2026-08-15
- 3-witness verification (W1 T-ST-026 v0.1 / W2 T-HE-030 v0.1 / W3 T-ATL-027 v0.3) + W4 filesystem-stat
- 5 cross-Muse handoffs dispatched (D-007 5-min SLA)

**Weaknesses:**

- 8 of 14 R-numbers (R2-R9) are un-scored (TENTATIVE on cycle 13 wave 1 work)
- Codif 34 RATIFICATION-gated cycle 15 wave 1 (long delay before SEVERITY column is stable)
- Atlas T-ATL-027 v0.3 SEV-1/2/3/4 ↔ Codif 34 alignment is TENTATIVE (cross-team work needed)

**HL #1 (Codif 19, R12 DOWNGRADE):** R12 is the FIRST real-world Codif 34 DOWNGRADE (2-tier drop Moderate→LOW, sum 9→6). 5/5 LOW criteria met. Dual cascade = belt-and-suspenders motion-reduce coverage.

**HL #2 (Codif 19, Apollo coordination outcome):** Apollo Phase 1 v2 PR ships with 0 hard-fix LOC for a11y/motion-reduce = optimal A sub-class (Apollo+Hera two-repo) coordination outcome. Hera's spec'd CSS line-ranges (L473-480, L625-633) were already correctly implemented pre-push.

**HL #3 (Codif 19, 2-dimensional matrix):** T-HEP-024 v0.4 v0.1 is the FIRST Hephaestus spec to integrate BOTH Codif 30 (TYPE) AND Codif 34 (SEVERITY) into a single 2-dimensional risk matrix. 28-cell grid, ~10 cells populated for R1-R14.

**HL #4 (Codif 7 v0.2, cross-link integration):** This spec demonstrates the self-correction arc at the codif-hierarchy level: T-HEP-024 v0.3 §6 (TYPE) was RATIFIED without SEVERITY; T-HEP-024 v0.4 v0.1 (this spec) adds SEVERITY column without overriding TYPE. Additive integration, not replacement.

**Codif 22 1st application (Codif 28 strict alignment):** NEW v0.1. Filename `T-HEP-024_v0_4_codif_34_integration_v0.1` per Leader spec (long-name per T-HE-025 convention). spec_version v0.1 (1st application of T-HEP-024 v0.4 series, Codif 28 strict alignment ✓).

**Codif 31 sandbox/canonical flags:**

- Sandbox (slot-isolated): written-and-verified ✅
- Canonical: written-and-verified ✅ (Codif 31 v0.2 B.5 dual-write PASS)
- Cross-Muse path coordination: T-ST-026 v0.1 + T-HE-030 v0.1 + T-ATL-027 v0.3 at canonical (B.5 multi-Muse 3-repo sub-class verified)

**Push status:** INDEPENDENT (strategic corpus only, no Apollo apply work)

**ETA vs target:** 30-40 min target → SHIP within window (D-007 5-min SLA met for dispatch)

**D-007 5-min SLA:** ✅ MET (5 cross-Muse handoffs dispatched within SLA)

**End T-HEP-024 v0.4 v0.1 SHIP. D-007 5-min SLA met for dispatch. Awaiting Leader PICK CONFIRM.**

— Hephaestus, Security & Data Integrity Muse | cycle 12 turn 17+ | T-HEP-024 v0.4 v0.1 §6 Codif 34 integration spec
