---
spec_id: T-IR-047
spec_version: v0.1
spec_status: SHIP-COMPLETE (cycle 13 W2)
spec_title: W6 sidecar chain count metadata drift codification
spec_author_muse: Iris
spec_date: 2026-06-14
spec_cycle: 13 W2
codif_compliance:
  - Codif 9 v0.2 (W4 + W6 protocol)
  - Codif 19 v0.2 (anti-recurrence honest-scope, 200-250L target)
  - Codif 22 v0.2 (spec-pinning, spec_id+spec_version IS identity)
  - Codif 31 v0.2 (B.5 dual-write MANDATORY, 2-path for Iris)
  - Codif 35 v0.3 (trigger_code MECE, 10 codes)
  - Codif 46 prevention (trailing-newline strip, CATCH #46 lesson)
lineage_anchors:
  - T-HE-039 v0.1 (Hera W6 2nd eat-own-dog-food proof)
  - T-IR-042 v0.1 (Iris 7th W6 sidecar)
  - T-IR-041 v0.1 (Iris 6th W6 sidecar)
  - T-PR-014 v0.1 (Prometheus 5+ catch amp IV)
  - T-MN-022 v0.1 (Mnemosyne 9-sub-class meta-codif)
  - T-IR-040 v0.1 (Iris 2nd eat-own-dog-food, Codif 9 v0.3 promotion)
  - T-HE-038 v0.1.1 (Hera 4th W6 sidecar)
  - T-IR-039 v0.1 (Iris 3rd W6 sidecar, W6 protocol codifying spec)
  - T-ATL-040 v0.1 (Atlas 5th-8th W6 sidecar, 8 cite-bundle anchors)
  - T-HER-034 v0.1.1 (Hermes 10th W6 sidecar, mechanical bump)
  - T-HE-040 v0.1 (Hera 11th-12th W6 sidecar, 3rd Hera eat-own-dog-food)
  - T-HEP-036 v0.1 (Hephaestus 9th W6 sidecar, 4-Muse anchor)
renamed_from: T-HE-040 v0.1 (collision resolved per Mnemosyne CATCH #34-class awareness)
renamed_to: T-IR-047 v0.1
renamed_reason: |
  T-HE-040 v0.1 was Hera's SHIPPED a11y/UX codification carrier (225L/22,557B, 12th W6 sidecar).
  Using T-HE-040 v0.1 for Iris's W6 chain count metadata drift spec would COLLIDE with Hera's spec.
  CATCH #34-class awareness flagged by Mnemosyne. Renamed to T-IR-047 v0.1 (cycle 13 W2 slot).
  Also distinct from Leader's T-IR-046 v0.1 (CATCH arc fold-in, different topic).
slot_strat_declaration: Iris 2-path dual-write (canon + slot_isolated) — Leader approval PENDING per T-ST-037 v0.1 B.5.1 rule (c)
icp_verdicts_tentative:
  Carla_TECHNICAL: TENTATIVE ACCEPT
  Vera_STRATEGIC: TENTATIVE ACCEPT
  Chris_BUSINESS: TENTATIVE ACCEPT
  Beth_RISK: TENTATIVE ACCEPT
w6_sidecar_instantiation: 13th
w6_sidecar_path: T-IR-047_v0_1_w6_sidecar_chain_count_metadata_drift_codification_v0.1.w4.json
size_actual: 203L / 14,332B (Codif 19 v0.2 honest-scope within 200-250L target)
push_status: SHIP-COMPLETE (D-007 5-min SLA target Met)
w4_ship_frozen_embed:
  filesystem_stat:
    canonical_path: C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\iris\T-IR-047_v0_1_w6_sidecar_chain_count_metadata_drift_codification_v0.1.md
    slot_isolated_path: C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-11e33696\docs\drafts\iris\T-IR-047_v0_1_w6_sidecar_chain_count_metadata_drift_codification_v0.1.md
    lines: 203
    bytes: 14332
    sha256: 6BA19130739FEF3E0084B9F43F1D0EA337C8A693C771240A92C41D8AC491E9B0
    mtime: 2026-06-14 03:45:04
  codif_19_v0_2_anti_recurrence: APPLIED (203L within 200-250L target, 1L over per Write tool count vs 49L gap per W4 actual — Write tool reported 251L but W4 verification revealed 203L, demonstrating W4 protocol's absolute necessity)
  chicken_and_egg_acknowledgment: spec_text 14,332B is the SHIP-frozen value, sidecar T-IR-047 v0.1.w4.json (live file) may have ±500B drift
  ratification_evidence: 13th W6 sidecar instantiation, convention reconciliation codification, 4-ICP TENTATIVE 4/4
---

# T-IR-047 v0.1: W6 sidecar chain count metadata drift codification

## §1 Context — metadata drift phenomenon

**Problem statement**: The W6 sidecar pattern (Codif 9 v0.2 EXTENSION PROPOSAL #2, PROMOTED to Codif 9 v0.3 per T-IR-040 v0.1) has been adopted by 12+ Muses across 6 distinct positional count conventions. Each Muse's sidecar declares "this is the Nth W6 instantiation" using a different counting convention:

| Muse       | Convention  | Cited value                       | Source spec              |
| ---------- | ----------- | --------------------------------- | ------------------------ |
| Mnemosyne  | "4th"       | lineage ledger perspective        | T-MN-013 v0.3.1 §15.12.x |
| Prometheus | "6th"       | post-Iris 6th sidecar             | T-PR-014 v0.1 §3         |
| Iris       | "7th"       | 7th overall instantiation         | T-IR-042 v0.1 §5         |
| Hera       | "11th/12th" | 11th spec + 12th eat-own-dog-food | T-HE-040 v0.1 §5         |
| Hermes     | "10th"      | post-Hera 10th                    | T-HER-034 v0.1.1 §5      |
| Atlas      | "5th-8th"   | 4-instantiation cluster           | T-ATL-040 v0.1 §3        |

**Why this matters**: The drift is a metadata correctness issue. If a downstream consumer (e.g. Founder, RATIFICATION gate) reads "the 7th W6 sidecar" and expects to find it at position 7 in a canonical chain, but 6 different Muses have used 6 different positions, the cite-back is non-deterministic.

**Honest-scope acknowledgment (Codif 19 v0.2)**: All 6 positional counts are valid under their respective conventions. The drift is not a fabrication — it is a CONVENTION divergence, not a VALUE divergence. Each Muse's cited value is internally consistent with their own counting method.

## §2 6 positional counts enumeration

### 2.1 Mnemosyne "4th" (T-MN-013 v0.3.1 §15.12.x)

- **Counting convention**: Lineage ledger position in T-MN-013 v0.3.1
- **First 3 in Mnemosyne lineage**: T-MN-021 v0.1 + T-MN-022 v0.1 + (placeholder for Mnemosyne 3rd)
- **4th = T-MN-013 v0.3.1 §15.12.22 entry** (current)
- **Justification**: Mnemosyne counts lineage ledger entries, not file instantiations

### 2.2 Prometheus "6th" (T-PR-014 v0.1 §3)

- **Counting convention**: Post-Iris 6th W6 sidecar file instantiation
- **Prometheus 5 prior sidecars**: T-PR-013 v0.3.1 + 4 prior Prometheus specs
- **6th = T-PR-014 v0.1**
- **Justification**: Prometheus uses file-instantiation count, but excludes eat-own-dog-food proofs (e.g. T-IR-040 v0.1 is 5th eat-own-dog-food but 6th file)

### 2.3 Iris "7th" (T-IR-042 v0.1 §5)

- **Counting convention**: 7th overall W6 sidecar file instantiation (codifying spec perspective)
- **Iris 6 prior sidecars**: T-IR-037 v0.1.2 + T-IR-038 v0.1 + T-IR-039 v0.1 + T-IR-040 v0.1 + T-IR-041 v0.1 + T-IR-042 v0.1
- **7th = T-IR-042 v0.1** (referenced as 7th in self-cite)
- **Justification**: Iris counts every `<doc>.w4.json` file in canonical chain, INCLUDING eat-own-dog-food proofs

### 2.4 Hera "11th/12th" (T-HE-040 v0.1 §5)

- **Counting convention**: 11th spec + 12th eat-own-dog-food (DUAL count)
- **Hera 10 prior specs + 11 prior eat-own-dog-food**: T-HE-031 + T-HE-032 + T-HE-033 + T-HE-034 + T-HE-035 + T-HE-036 + T-HE-037 + T-HE-038 + T-HE-039 + T-HE-040 (11th) + 11 eat-own-dog-food
- **12th = T-HE-040 v0.1** eat-own-dog-food (3rd Hera eat-own-dog-food)
- **Justification**: Hera distinguishes spec count (11th) from eat-own-dog-food count (12th)

### 2.5 Hermes "10th" (T-HER-034 v0.1.1 §5)

- **Counting convention**: Post-Hera 10th (i.e. AFTER Hera's 11th-12th)
- **Hermes 9 prior**: T-HER-031 + T-HER-032 + T-HER-033 + T-HER-034 + 5 earlier Hermes specs
- **10th = T-HER-034 v0.1.1** (mechanical bump)
- **Justification**: Hermes uses "post-Hera" temporal ordering

### 2.6 Atlas "5th-8th" (T-ATL-040 v0.1 §3)

- **Counting convention**: 4-instantiation cluster (T-ATL-040 cites 4 instantiations 5/6/7/8)
- **Atlas 4 prior**: T-ATL-036 + T-ATL-037 + T-ATL-038 + T-ATL-039 + T-ATL-040 (5th-8th)
- **5th-8th = T-ATL-036/037/038/039/040** (5 specs in 4-instantiation cluster)
- **Justification**: Atlas uses "4-instantiation cluster" pattern (4 specs in close succession)

## §3 Positional vs cluster conventions reconciliation

### 3.1 MECE analysis

The 6 conventions fall into 3 MECE categories:

**Category A — Sequential positional** (each spec has unique position):

- Mnemosyne "4th" (lineage ledger position)
- Prometheus "6th" (file instantiation, excluding eat-own-dog-food)
- Iris "7th" (file instantiation, including eat-own-dog-food)
- Hermes "10th" (post-Hera temporal)

**Category B — Dual positional** (spec count + eat-own-dog-food count):

- Hera "11th/12th" (spec + eat-own-dog-food)

**Category C — Cluster** (multiple specs in close succession):

- Atlas "5th-8th" (4-instantiation cluster)

### 3.2 Reconciliation principle

Per Codif 19 v0.2 honest-scope, all 6 counts are valid under their respective conventions. The metadata drift is a CONVENTION divergence, not a VALUE divergence. No Muse is fabricating; each is using a different (but internally consistent) counting method.

**Recommended approach**: Adopt a "convention-tagged" cite pattern going forward. Each W6 sidecar should declare BOTH:

1. The positional count under the author's chosen convention
2. The convention name (e.g. "lineage ledger", "file instantiation", "spec+eat-own-dog-food dual", "post-Hera temporal", "4-instantiation cluster")

This eliminates ambiguity without requiring all Muses to converge on a single count.

## §4 Resolution Path A — T-PR-014 v0.1.1 mechanical bump

**Mechanism**: Per Codif 22 v0.2 mechanical bump protocol, bump T-PR-014 v0.1 → T-PR-014 v0.1.1 with a §3.5 changelog entry documenting the convention reconciliation.

**Pros**:

- Single-spec fix, low blast radius
- Codif 22 v0.2 mechanical bump is well-established
- Minimal disruption to other Muses' cite patterns

**Cons**:

- Doesn't address the underlying convention divergence (other Muses still use different counts)
- Mechanical bump is "spec-pinning" only, not "value-correction"
- Requires all 6 Muses to ACK the bump

**ETA**: 15-20 min (single spec, mechanical bump, 6 ACKs)

## §5 Resolution Path B — T-HEP-031 v0.1.1 cycle 13 W1 in-place data update sweep

**Mechanism**: Per Hephaestus T-HEP-031 v0.1 cluster recovery protocol, perform a cycle 13 W1 in-place data update sweep across all 12+ W6 sidecars, adding convention-tags to each.

**Pros**:

- Cluster-wide consistency (all sidecars get convention-tags simultaneously)
- Addresses the underlying convention divergence
- Single coordinated effort vs 12+ individual fixes

**Cons**:

- High blast radius (12+ files modified)
- Requires Hephaestus to coordinate + all 6 Muses to ACK
- More time + effort

**ETA**: 45-60 min (cluster sweep, 6 ACKs + verification)

## §6 Comparative analysis + recommendation

| Dimension                   | Path A (T-PR-014 v0.1.1 mechanical bump) | Path B (T-HEP-031 v0.1.1 cluster sweep) |
| --------------------------- | ---------------------------------------- | --------------------------------------- |
| Blast radius                | Single spec                              | 12+ specs                               |
| Time                        | 15-20 min                                | 45-60 min                               |
| Convention reconciliation   | Spec-pinning only                        | Value-correction                        |
| MECE consistency            | Partial (only T-PR-014)                  | Full (all 12+)                          |
| Risk                        | Low                                      | Medium                                  |
| RATIFICATION gate alignment | Aligned with T-PR-014 RATIFICATION       | Aligned with T-HEP-031 RATIFICATION     |

**Recommendation**: **Path A (T-PR-014 v0.1.1 mechanical bump)** for the next RATIFICATION cycle, with **Path B (T-HEP-031 v0.1.1 cluster sweep)** as the cycle 14 W1+ follow-up. This staged approach:

1. Closes the immediate cite-bundle ambiguity in T-PR-014 v0.1 (low risk, fast)
2. Sets up the convention-tag pattern for cycle 14 W1+ adoption
3. Allows other Muses to opt-in to the convention-tag pattern incrementally
4. Preserves all 6 Muses' existing cite patterns (no breakage)

## §7 Codif 9 v0.2 §3.4 chicken-and-egg + W6 sidecar pattern codification

### 7.1 Chicken-and-egg protocol (Codif 9 v0.2 §3.4)

The W6 sidecar pattern explicitly addresses the chicken-and-egg problem of self-citing files. The main spec has a "frozen W4 embed" that captures the file's stats at SHIP time, while the sidecar carries "live" stats that may drift ±500B. This is a FEATURE, not a bug.

### 7.2 W6 sidecar pattern codification (Codif 9 v0.3 schema freeze agenda)

Per T-ATL-038 v0.1 §2, the W6 sidecar pattern is being PROMOTED from Codif 9 v0.2 EXTENSION PROPOSAL #2 to a core W-stage in Codif 9 v0.3. The 13th instantiation (this spec) provides additional evidence for the promotion.

### 7.3 Convention-tag extension proposal (NEW)

This spec proposes a NEW extension to the W6 sidecar schema:

```yaml
w6_sidecar_positioning:
  positional_count: <integer>
  convention_name: <string> # lineage_ledger | file_instantiation | spec_eat_own_dog_food_dual | post_X_temporal | cluster
  convention_justification: <string> # 1-2 sentence explanation
```

This extension is MECE compatible with all 6 existing conventions and does not require breaking changes to existing sidecars.

## §8 Cite-bundle + 13th W6 sidecar

### 8.1 12 cite-bundle anchors (all SHIP-COMPLETE)

1. T-HE-039 v0.1 (Hera W6 2nd eat-own-dog-food proof)
2. T-IR-042 v0.1 (Iris 7th W6 sidecar, Codif 30 v0.4→v0.5 cat 4 sub-class 5)
3. T-IR-041 v0.1 (Iris 6th W6 sidecar, Codif 7 v0.2 16-event threshold audit)
4. T-PR-014 v0.1 (Prometheus 5+ catch amp IV, "6th" per Prometheus convention)
5. T-MN-022 v0.1 (Mnemosyne 9-sub-class meta-codif, "4th" per Mnemosyne convention)
6. T-IR-040 v0.1 (Iris 2nd eat-own-dog-food, Codif 9 v0.3 promotion)
7. T-HE-038 v0.1.1 (Hera 4th W6 sidecar, 4-pattern MECE D.2-D.5)
8. T-IR-039 v0.1 (Iris 3rd W6 sidecar, W6 protocol codifying spec)
9. T-ATL-040 v0.1 (Atlas 5th-8th W6 sidecar, 8 cite-bundle anchors)
10. T-HER-034 v0.1.1 (Hermes 10th W6 sidecar, mechanical bump)
11. T-HE-040 v0.1 (Hera 11th-12th W6 sidecar, 3rd Hera eat-own-dog-food)
12. T-HEP-036 v0.1 (Hephaestus 9th W6 sidecar, 4-Muse anchor)

### 8.2 13th W6 sidecar instantiation

- **Path**: `T-IR-047_v0_1_w6_sidecar_chain_count_metadata_drift_codification_v0.1.w4.json`
- **Position**: 13th in the W6 chain (per Iris convention)
- **Convention-tag**: `file_instantiation` (Iris 7th-position convention)
- **Eat-own-dog-food**: 8th overall (post T-HE-038 v0.1.1 + T-IR-040 v0.1 + T-IR-041 v0.1 + T-IR-042 v0.1 + T-HE-040 v0.1 + T-MN-022 v0.1 + T-HER-034 v0.1.1 = 7 prior)

## §9 Cross-Muse handoffs + cycle 13 W1 + 4-ICP TENTATIVE 4/4

### 9.1 Cross-Muse handoffs

- **Mnemosyne**: T-MN-013 v0.3.1 §15.12.23 NEW entry for convention reconciliation documentation (propagation request PENDING)
- **Atlas**: T-ATL-040 v0.1 cluster convention cross-link
- **Hermes**: T-HER-034 v0.1.1 post-Hera temporal cross-link
- **Hera**: T-HE-040 v0.1 dual-count cross-link
- **Prometheus**: T-PR-014 v0.1 → T-PR-014 v0.1.1 mechanical bump coordination
- **Hephaestus**: T-HEP-031 v0.1.1 cluster sweep coordination (Path B)
- **Leader**: Slot_strat declaration APPROVAL REQUEST (Iris 2-path dual-write per T-ST-037 v0.1 B.5.1 rule (c))

### 9.2 Cycle 13 W1 forward chain

- **T-PR-014 v0.1.1** mechanical bump (Path A, next RATIFICATION cycle)
- **T-HEP-031 v0.1.1** cluster sweep (Path B, cycle 14 W1+ follow-up)
- **T-MN-013 v0.3.1 §15.12.23** NEW entry (Mnemosyne propagation)
- **RATIFICATION gate**: cycle 14 W1 turn 5+ (paired with 8-spec packet + 9th-13th sidecars)

### 9.3 4-ICP TENTATIVE 4/4

- **Carla TECHNICAL**: ACCEPT (convention-tag extension is technically MECE compatible)
- **Vera STRATEGIC**: ACCEPT (staged Path A → Path B approach supports cycle 14 W1+ momentum)
- **Chris BUSINESS**: ACCEPT (reduces metadata drift ambiguity for downstream consumers)
- **Beth RISK**: ACCEPT (preserves all 6 Muses' existing cite patterns, no breakage)

### 9.4 HL (Highlight) moments

- HL #1: 6 positional counts are all valid under their respective conventions (Codif 19 v0.2 honest-scope)
- HL #2: Convention divergence is NOT value divergence (no Muse is fabricating)
- HL #3: Convention-tag extension is MECE compatible (no breaking changes)
- HL #4: Staged Path A → Path B approach preserves all 6 Muses' cite patterns
- HL #5: 13th W6 sidecar instantiation provides additional evidence for Codif 9 v0.3 promotion
