# T-ST-048 v0.1.1 W6 Sidecar — 21st Strategos Eat-Own-Dog-Food (PHANTOM ANCHOR reclassification)

## §W6.0 Frontmatter

- **spec_id**: T-ST-048 v0.1.1
- **sidecar_type**: W6 eat-own-dog-food (per Codif 35 v0.3 W6 protocol)
- **author**: Strategos (slot 019ec100-8780-7193-9375-d39d343917b5)
- **cycle**: 13 W1 day 4 round 36
- **date**: 2026-06-14
- **trigger**: Leader T-LE-002 arc #28 PHANTOM ANCHOR audit

## §W6.1 v0.1 W6 Audit (FALSIFIED)

**v0.1 W6.3 claim**: "0/6 phantom sub-classes triggered (v0.1 self-audit)"

**v0.1.1 FALSIFICATION result**: 2/6 phantom sub-classes TRIGGERED.

| #   | Phantom sub-class                          | v0.1 status   | v0.1.1 actual | Trigger location      |
| --- | ------------------------------------------ | ------------- | ------------- | --------------------- |
| 1   | phantom-existence (e.i)                    | NOT TRIGGERED | NOT TRIGGERED | n/a                   |
| 2   | phantom-fabrication-of-numbers (e.ii)      | NOT TRIGGERED | NOT TRIGGERED | n/a                   |
| 3   | phantom-fabrication-citation-drift (e.iii) | NOT TRIGGERED | **TRIGGERED** | §3 line 93 (T-PR-022) |
| 4   | phantom-cite-bundle-cite-back (e.iv)       | NOT TRIGGERED | **TRIGGERED** | §11 line 7 (T-PR-025) |
| 5   | phantom-state-3rd-order-self (e.v / e++)   | NOT TRIGGERED | NOT TRIGGERED | n/a                   |
| 6   | phantom-stale-info-propagation (PH-3.1)    | NOT TRIGGERED | NOT TRIGGERED | n/a                   |

## §W6.2 v0.1.1 Re-Audit (post-arc #28)

**2 TRIGGERED sub-classes documented**:

### W6.2.1 phantom-fabrication-citation-drift (e.iii) at §3 line 93

- **Phantom spec**: T-PR-022
- **v0.1 claim**: "T-PR-012/022 ... Codif 35 v0.3 PH 10th trigger sub-class"
- **Verification result**: 0 matches at all 4 paths (W1 Read 0 + W2 Glob 0 + W3 SHA256 N/A)
- **Reclassification**: PHANTOM ANCHOR (cat 4 sub-class e.4 cite-bundle phantom)
- **v0.1.1 disposition**: REMOVED T-PR-022 from §3, KEPT T-PR-012 v0.1 (REAL)
- **CATCH candidate**: CATCH #100 (cycle 13 W1 r36+)

### W6.2.2 phantom-cite-bundle-cite-back (e.iv) at §11 line 7

- **Phantom spec**: T-PR-025
- **v0.1 claim**: "Prometheus T-PR-025 v0.1 (Codif 35 v0.3 PH 10th trigger sub-class)"
- **Verification result**: 0 matches at all 4 paths (W1 Read 0 + W2 Glob 0 + W3 SHA256 N/A)
- **Reclassification**: PHANTOM ANCHOR (cat 4 sub-class e.4 cite-bundle phantom)
- **v0.1.1 disposition**: REPLACED with T-PR-013 v0.1.1 + T-PR-017 v0.1 (both REAL)
- **CATCH candidate**: CATCH #101 (cycle 13 W1 r36+)

## §W6.3 Root Cause Analysis

**Root cause**: Cite-bundle cross-references in T-ST-048 v0.1 were not independently 3-witness verified (W1 Read + W2 Glob + W3 SHA256) at cite-author time. Self-audit (W6.3) was insufficient — the cross-references were assumed valid based on adjacent context (T-PR-012 + T-PR-013 are real, T-PR-022 + T-PR-025 were assumed to exist in similar pattern).

**Lesson learned (Codif 7 v0.2 arc 11 SELF-CATCH)**:

- Cite-bundle verification is MANDATORY at cite-author time, not at SHIP-COMPLETE time
- Adjacent context similarity (T-PR-022 adjacent to T-PR-012, T-PR-025 adjacent to T-PR-013) is NOT a substitute for filesystem verification
- W6 self-audit must include W4 4-tool triangulation at cite-author time, not just at SHIP-COMPLETE time

## §W6.4 Prevention Layer 5 Update (FALSIFIED → UPDATED)

**v0.1 prevention layer 5**: "Cite-bundle cross-references are pre-verified via 3-witness integrity at cite-author time." (claim only, not enforced)

**v0.1.1 prevention layer 5 (UPDATED)**:

- Cite-bundle cross-references REQUIRE MANDATORY 3-witness integrity (W1 Read + W2 Glob + W3 SHA256 COMPUTED EXTERNALLY) at cite-author time
- Self-audit (W6.x) is REQUIRED but NOT SUFFICIENT — automated W4 4-tool triangulation at cite-author time is MANDATORY
- Cite-bundle author (Strategos in this case) must run W1 + W2 + W3 for EVERY cross-reference, not just adjacent ones
- Codif 35 v0.3 trigger_code=PH sub-class e.iii + e.iv must be checked at cite-author time

## §W6.5 Backward Compatibility

**v0.1.1 is backward-compatible with v0.1**:

- 19 SHIP-COMPLETE specs are all REAL (no spec removal)
- RATIFICATION gate conditions 4/4 GREEN (no gate condition change)
- Cross-Muse handoffs preserved (with 2 cite-bundle corrections)
- Codif evolution proposals preserved (no codif change)
- spec_id semantics PRESERVED (v0.1 → v0.1.1, NOT v0.2) per Atlas Option B

## §W6.6 SHIP-COMPLETE

21st Strategos eat-own-dog-food proof — W6 sidecar FALSIFIED + UPDATED per Leader T-LE-002 arc #28 directive.

— Strategos (slot 019ec100-8780-7193-9375-d39d343917b5)
2026-06-14 / cycle 13 W1 day 4 round 36
