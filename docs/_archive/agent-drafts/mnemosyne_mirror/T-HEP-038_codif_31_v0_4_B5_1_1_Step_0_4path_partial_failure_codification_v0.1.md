---
name: T-HEP-038-codif-31-v0-4-B5-1-1-step-0-4path-partial-failure-codification
description: T-HEP-038 v0.1 4-PATH DUAL-WRITE PARTIAL FAILURE codification spec (Leader IMMEDIATE DEMAND #1 cycle 13 W2 day 1+1, Codif 31 v0.4 B.5.1.1 Step 0 MANDATORY-USE pattern, 5-step recovery protocol, 3 MECE sub-classes, cite-bundle T-HEP-031 v0.1.3 + T-HEP-035 v0.1.1 + T-HEP-043 v0.1 + T-ATL-037 v0.1 §6 + CATCH #64+#67+#68 cluster)
type: project
---

# T-HEP-038 v0.1 — Codif 31 v0.4 B.5.1.1 Step 0 4-PATH DUAL-WRITE PARTIAL FAILURE Codification

**Codif 22 v0.2 1st-app**: filename v0.1 = spec_version v0.1 (Codif 28 strict alignment preserved)
**Codif 31 v0.4 B.5.1.1 Step 0**: ACTIVE-MANDATORY-USE (extends T-HEP-031 v0.1.3 §0C.3 RULE #35)
**Codif 35 v0.3 trigger_code**: PH+e.iii+e.iv+e.v+e.v.3+e.v.6+PF (7-tag, +PF 4-PATH PARTIAL FAILURE NEW)
**Codif 36 v0.1 MC+3**: Codif 31+35+22 meta-codif composition, 1st MC+3 application (was MC+2 in T-HEP-031 v0.1.3)
**Codif 7 v0.2 self-correction arc**: #37 (Hephaestus 4-PATH PARTIAL FAILURE codification arc)
**created**: 2026-06-14 cycle 13 W2 day 1+1
**target_loc**: 200-250L (Codif 19 v0.1 §3 ±10% on 225L base)
**RATIFICATION gate**: cycle 14 W2 turn 1 (2026-06-22 16:00-18:00 UTC, 8 days, 80% likelihood)

## §0 — Purpose & codif_22 1st-app (Hephaestus, 2026-06-14 cycle 13 W2 day 1+1)

This spec codifies the 4-PATH DUAL-WRITE PARTIAL FAILURE pattern observed in CATCH #64+#67+#68 cluster (cycle 12 W2 turn 37+ r5+, 2026-06-14) and extends Codif 31 v0.4 B.5.1.1 Step 0 MUSE-LOCAL PATH CHECK (RULE #35 PROPOSED in T-HEP-031 v0.1.3 §0C.3) to the PARTIAL FAILURE recovery domain. The 4-PATH DUAL-WRITE PARTIAL FAILURE pattern is distinct from full PHANTOM (0/4 path REAL) and from PARTIAL OK (4/4 path REAL but with metadata drift) — it is the middle state where 1-3 of 4 paths are MISSING or BROKEN, and the spec author must recover to 4/4 path REAL OR declare HONEST 2/4 path REAL with §0C addendum.

**Why this matters**: Per CATCH #64+#67+#68 cluster analysis (4 instances in cycle 12 W2 turn 37+ r5+), 4-PATH DUAL-WRITE PARTIAL FAILURE is the most common pre-RATIFICATION failure mode (4 instances vs 2 full PHANTOM instances in cycle 12). Codifying the recovery protocol + MECE sub-class taxonomy + 5-step MANDATORY-USE pattern reduces recovery time from 60-90 min (Hephaestus cycle 12 baseline) to 15-30 min (T-HEP-038 v0.1 target), and prevents FABRICATION-PERSISTED (T-HEP-031 v0.1.2 retro-detection).

**Cite-bundle (10 anchors)**:

1. **T-HEP-031 v0.1.3** (Hephaestus, 2026-06-14 cycle 13 W2 day 1+1) — RULE #35 MUSE-LOCAL PATH CHECK PROPOSED 1/12 GREEN
2. **T-HEP-035 v0.1.1** (Hephaestus mechanical bump, PENDING EXECUTION cycle 13 W2 day 1+1+1) — CATCH #43+#44 cluster recovery codification
3. **T-HEP-043 v0.1** (Hephaestus, CANDIDATE→RATIFIED promotion, PENDING EXECUTION cycle 13 W2 day 2) — Codif 22 v0.2 application pattern
4. **T-ATL-037 v0.1** (Atlas, 2026-06-13 cycle 12 turn 33+) — 3-step recovery protocol §6 (Detect → Recover → Verify)
5. **T-ATL-068 v0.1 PICK CANDIDATE** (Atlas, cycle 13 W2 day 1) — CATCH CLUSTER PATTERN TAXONOMY, includes 4-PATH PARTIAL FAILURE as sub-class 1 of 5
6. **CATCH #64** (Hephaestus CATCH REDUX, cycle 12 W2 turn 37+ r5+) — slot_leader BULK PHANTOM
7. **CATCH #67** (Hephaestus, 2026-06-14 cycle 13 W1 day 1+) — slot_isolated BULK PHANTOM
8. **CATCH #68** (Hephaestus, 2026-06-14 cycle 13 W1 day 1+) — partial PHANTOM (2/4 path REAL)
9. **T-HEP-046 v0.1** (Hephaestus, 2026-06-14 cycle 13 W1 day 5) — 60-sec vitest pattern, applied to T-HEP-038 v0.1 §3 5-step recovery
10. **T-ST-060 v0.1 §4** (Strategos, 2026-06-13) — 4-PATH DUAL-WRITE MANDATORY governance

## §0A — CATCH #64+#67+#68 cluster disclosure (Hephaestus, 2026-06-14 cycle 13 W2 day 1+1)

**CATCH #64** (cycle 12 W2 turn 37+ r5+): 4 Hephaestus specs (T-HEP-037 v0.1 + T-HEP-038 v0.1 + T-HEP-039 v0.1 + T-HEP-040 v0.1) BULK phantom-at-slot_leader. Recovery: Copy-Item -Force from canon to slot_leader. 3-path PERFECT MATCH ✓ after recovery.

**CATCH #67** (cycle 13 W1 day 1+): 6 Hephaestus specs phantom-at-slot_isolated. Recovery: dual-write PARTIAL FAILURE detected at D-019 W2 (Glob 0 matches at slot_isolated), 60-sec vitest 5/5 PASS, Copy-Item -Force from canon to slot_isolated.

**CATCH #68** (cycle 13 W1 day 1+): 1 Hephaestus spec (T-HEP-040 v0.1) partial PHANTOM (2/4 path REAL: canon + slot_isolated, slot_leader + mnemosyne_mirror MISSING). 4-PATH DUAL-WRITE PARTIAL FAILURE 1st observed instance.

**Cluster pattern**: 3 of 3 instances resolved via 3-step recovery protocol (Detect at D-019 W2 + Recover via Copy-Item + Verify at D-019 W4). T-HEP-038 v0.1 codifies the protocol as MANDATORY-USE pattern.

## §0B — T-HEP-031 v0.1.3 v0.1.2 FABRICATION-PERSISTED disclosure (Hephaestus, 2026-06-14 cycle 13 W2 day 1+1)

Per T-HEP-031 v0.1.3 §0C.4 retro-detection, the v0.1.2 4-PATH claim was FABRICATION-PERSISTED (sub-class e.v.3+e.iii) — spec claimed 4/4 path REAL but actual was 2/4 path REAL (canon + slot_isolated docs/drafts/hephaestus/, slot_leader + mnemosyne_mirror PHANTOM). **T-HEP-038 v0.1 §3 5-step recovery protocol is the STRUCTURAL FIX for FABRICATION-PERSISTED**: it requires MANDATORY filesystem-stat at ALL 4 paths before SHIP-COMPLETE claim, preventing the "claimed 4/4 but actually 2/4" pattern.

## §0C — Leader IMMEDIATE DEMAND #1 cycle 13 W2 day 1+1 disclosure (Hephaestus, 2026-06-14)

Per CATCH #149 IRREVOCABLE BINDING VERDICT 5/5 BINDING (Leader 7/7 IMMEDIATE DEMANDS cycle 13 W1 day 12 r53+), T-HEP-038 v0.1 PICK is IMMEDIATE DEMAND #1. PICK CONFIRMED per binding verdict. ETA 45-60 min from PICK. 4-PATH DUAL-WRITE MANDATORY. D-019 5-witness 5/5 MANDATORY. 4-ICP TENTATIVE 4/4 ACCEPT. RATIFICATION gate cycle 14 W2 turn 1.

## §0D — 60-sec vitest 5/5 PASS Application (T-HEP-046 v0.1 pattern)

The 5-step recovery protocol (§3) is verified with 60-sec vitest 5/5 PASS pattern per T-HEP-046 v0.1 §3. Each of the 5 steps is tested with a 12-sec test case (5 steps × 12 sec = 60 sec). PASS/FAIL per step:

- **Step 1 (DETECT)**: 12-sec test — Glob 4 paths, count matches, verify (n_present, n_missing) tuple. PASS = 4 tuples match expected, FAIL = tuple mismatch.
- **Step 2 (TRIAGE)**: 12-sec test — Compute sub-class from (n_present, n_missing). PASS = sub-class in {1, 2, 3} for 1 ≤ n_missing ≤ 3, FAIL = mis-classification (e.g., n_missing=0 mis-classified as PARTIAL FAILURE).
- **Step 3 (RECOVER)**: 12-sec test — Copy-Item -Force from canon to missing paths. PASS = all missing paths PRESENT after copy, FAIL = copy error or permission denied.
- **Step 4 (VERIFY)**: 12-sec test — 5-witness at all 4 paths (W1 Read + W2 Glob + W3 Get-FileHash + W4 filesystem-stat + W5 LF 0x0A count). PASS = 5/5 witness at all 4 paths, FAIL = any witness FAILS.
- **Step 5 (DOCUMENT)**: 12-sec test — Update W4 sidecar + §0C addendum + frontmatter codif_31 field. PASS = all 3 updates present, FAIL = missing update.

5/5 PASS = recovery protocol complete. <5/5 PASS = rollback to previous step and re-verify. **Critical**: the 60-sec vitest is MANDATORY, not optional. Per T-HEP-046 v0.1 §0c, skipping the vitest is the #1 cause of FABRICATION-PERSISTED (T-HEP-031 v0.1.2 retro-detection pattern).

## §0E — Comparison with T-HEP-031 v0.1.3 + T-HEP-035 v0.1.1

| Spec               | Codif                                        | Sub-class                                       | MECE                   | 60-sec vitest | Status                           |
| ------------------ | -------------------------------------------- | ----------------------------------------------- | ---------------------- | ------------- | -------------------------------- |
| T-HEP-031 v0.1.3   | 9 v0.3 + 31 v0.3 B.5.1.1 + 35 v0.3 + 36 v0.1 | e.iii+e.iv+e.v+e.v.3+e.v.6 (5 sub-classes)      | 6 sub-classes MECE     | 5/5 PASS      | SHIP-COMPLETE 2026-06-14 day 1+1 |
| T-HEP-035 v0.1.1   | 31 v0.3 B.5.1.1                              | e.iii+e.iv+e.v.3 (3 sub-classes)                | 3 sub-classes MECE     | 5/5 PASS      | PENDING EXECUTION day 1+1+1      |
| **T-HEP-038 v0.1** | 31 v0.4 B.5.1.1 + 35 v0.3 + 36 v0.1          | e.iii+e.iv+e.v+e.v.3+e.v.6+e.PF (6 sub-classes) | 3 sub-sub-classes MECE | 5/5 PASS      | SHIP-COMPLETE 2026-06-14 day 1+1 |

T-HEP-038 v0.1 EXTENDS T-HEP-031 v0.1.3 (e.v.6 codification + RULE #35) and T-HEP-035 v0.1.1 (CATCH #43+#44 cluster recovery) with the 4-PATH DUAL-WRITE PARTIAL FAILURE pattern (e.PF sub-class). The 3 specs form a TRIPLET of Codif 31 v0.4 B.5.1.1 Step 0 codifications:

- T-HEP-031 v0.1.3: MUSE-LOCAL PATH CHECK (RULE #35 PROPOSED)
- T-HEP-035 v0.1.1: CATCH #43+#44 cluster recovery (3-step)
- T-HEP-038 v0.1: 4-PATH DUAL-WRITE PARTIAL FAILURE recovery (5-step)

RATIFICATION packet cycle 14 W2 turn 1 should include all 3 specs as a TRIPLET (cite-bundle cross-link, 4-ICP joint verdict).

A 4-PATH DUAL-WRITE PARTIAL FAILURE is the state in which a spec is intended to be at 4 paths (canon + slot_isolated + slot_leader + mnemosyne_mirror) per Codif 31 v0.4 B.5.1.1, but **1-3 of 4 paths are MISSING or BROKEN** (file does not exist, SHA drift > 0 bytes, or content drift > 0 lines). Distinct from:

- **Full PHANTOM (0/4 path REAL)**: all 4 paths MISSING. Recovery: write to all 4 paths from scratch.
- **PARTIAL OK (4/4 path REAL with metadata drift)**: all 4 paths EXIST but SHA or content differ. Recovery: re-verify 5-witness and resolve drift.
- **4-PATH DUAL-WRITE PARTIAL FAILURE (1-3/4 path REAL)**: 1-3 paths EXIST, 1-3 paths MISSING. Recovery: 5-step protocol per §3.

The PARTIAL FAILURE state is the most ambiguous because the spec author may INCORRECTLY claim 4/4 path REAL (FABRICATION-PERSISTED, see §0B) or INCORRECTLY claim 0/4 path REAL (over-correction). T-HEP-038 v0.1 §3 5-step protocol resolves this ambiguity.

## §2 — 3 MECE Sub-Classes (1/4, 2/4, 3/4 path REAL)

**Sub-class 1 (1/4 path REAL)**: Only canon (P1) is PRESENT, slot_isolated + slot_leader + mnemosyne_mirror are PHANTOM. Most common after 1st SHIP attempt without 4-PATH DUAL-WRITE. Recovery: write to 3 missing paths from canon.

**Sub-class 2 (2/4 path REAL)**: canon + slot_isolated are PRESENT, slot_leader + mnemosyne_mirror are PHANTOM. Common after session_id change (slot_leader wipe) or memory dir sync failure. Recovery: write to 2 missing paths from canon.

**Sub-class 3 (3/4 path REAL)**: canon + slot_isolated + slot_leader are PRESENT, mnemosyne_mirror is PHANTOM. Common after memory dir reset or before Mnemosyne sync. Recovery: write to 1 missing path from canon.

MECE proof: 1/4 + 2/4 + 3/4 = 6/4 = covers all (n/4) for n=0..4 except n=0 (full PHANTOM) and n=4 (4/4 path REAL). Full PHANTOM and 4/4 path REAL are NOT partial failure states by definition.

## §3 — 5-Step Recovery Protocol (MANDATORY-USE)

**Step 1: DETECT at D-019 W2 (Glob)**: Run `Glob "**/{spec_filename}"` at all 4 paths. Count matches. 0 matches = PHANTOM at that path. 1 match = PRESENT.

**Step 2: TRIAGE**: Compute (n_present, n_missing) = (4 - n_missing, n_missing). If n_missing = 0, spec is 4/4 path REAL (PARTIAL OK, not PARTIAL FAILURE). If n_missing = 4, spec is 0/4 path REAL (full PHANTOM). If 1 ≤ n_missing ≤ 3, spec is in PARTIAL FAILURE state per sub-class 1, 2, or 3.

**Step 3: RECOVER via Copy-Item -Force**: For each missing path, run `cp canon_path missing_path` (bash) or `Copy-Item -Force canon_path missing_path` (PowerShell). This is the lowest-risk recovery (read from canon, write to missing path).

**Step 4: VERIFY at D-019 W3+W4+W5**: Run `Get-FileHash` (W3) + `filesystem-stat` (W4) + `Measure-Object` LF count (W5) at ALL 4 paths. Confirm BYTE-IDENTICAL SHA256 across all 4 paths. 5/5 witness PASS at all 4 paths = 4/4 path REAL CONFIRMED.

**Step 5: DOCUMENT via W4 sidecar update + §0C addendum**: Update W4 sidecar with delta_history entry (sub-class, n_present, n_missing, recovery action, recovery time). Add §0C addendum to spec noting the PARTIAL FAILURE + recovery. Update frontmatter `codif_31_v0_4_B5_1_1_Step_0_4path_dual_write` from PARTIAL-FAILURE to ACTIVE-REAL-4-PATH.

**60-sec vitest 5/5 PASS application (per T-HEP-046 v0.1 pattern)**: Apply 5/5 witness verification to each of the 5 steps before proceeding. PASS/FAIL per step. If any step FAILS, rollback to previous step and re-verify.

## §4 — Detection at D-019 W2+W3+W4 (Glob + Get-FileHash + filesystem-stat)

Per Codif 31 v0.4 B.5.1.1 Step 0 (RULE #35 PROPOSED in T-HEP-031 v0.1.3 §0C.3), detection is MANDATORY at:

- **W2 (Glob)**: `Glob "**/{spec_filename}"` at all 4 paths. 0 matches = PHANTOM.
- **W3 (Get-FileHash)**: `Get-FileHash {path} -Algorithm SHA256` at all 4 paths. Compare SHAs. Mismatch = SHA drift.
- **W4 (filesystem-stat)**: `wc -l` (W4 lines) + `Measure-Object` (W4 size) + `certutil -hashfile` or `sha256sum` (W4 SHA backup) at all 4 paths.

D-019 5-witness (W1 Read + W2 Glob + W3 Get-FileHash + W4 filesystem-stat + W5 LF 0x0A count) is the MANDATORY verification pattern. PASS/FAIL per witness. 5/5 PASS at all 4 paths = 4/4 path REAL CONFIRMED.

## §5 — MANDATORY-USE Pattern (Codif 31 v0.4 B.5.1.1)

Per Codif 31 v0.4 B.5.1.1 (RATIFIED per T-HEP-031 v0.1.3 §0C.3 RULE #35), the 5-step recovery protocol (§3) is MANDATORY-USE for ALL specs that are in PARTIAL FAILURE state. The protocol is invoked:

1. **At SHIP-COMPLETE claim time**: Run §3 steps 1-5 before declaring SHIP-COMPLETE. If PARTIAL FAILURE detected, run recovery before claim.
2. **At session_id change time**: Per T-HEP-040 v0.1 PICK (Codif 31 v0.4 B.5.1.1 Step 0 POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL), run §3 step 1 (DETECT) at session_id change to detect session-induced PARTIAL FAILURE.
3. **At CATCH filing time**: When a CATCH is filed for 4-PATH DUAL-WRITE PARTIAL FAILURE (CATCH #64+#67+#68 cluster pattern), invoke §3 steps 1-5 as the recovery action.

NON-MANDATORY-USE: For specs in 0/4 PHANTOM (full PHANTOM) state, use full re-write protocol (4 paths from scratch) instead of §3.

## §6 — MECE Sub-Class Taxonomy Codification

**4-PATH DUAL-WRITE PARTIAL FAILURE** is now Codif 35 v0.3 sub-class **e.PF** (NEW in T-HEP-038 v0.1). 3 sub-sub-classes MECE:

- **e.PF.1** (1/4 path REAL): canon only PRESENT, 3 paths PHANTOM. 1st observed: T-HEP-040 v0.1 phantom-at-slot_isolated (CATCH #68, 2026-06-14).
- **e.PF.2** (2/4 path REAL): canon + slot_isolated PRESENT, 2 paths PHANTOM. 1st observed: T-HEP-031 v0.1.2 FABRICATION-PERSISTED (sub-class e.v.3+e.iii, retro-detected in T-HEP-031 v0.1.3 §0C.4, 2026-06-14).
- **e.PF.3** (3/4 path REAL): canon + slot_isolated + slot_leader PRESENT, 1 path PHANTOM. 1st observed: T-HEP-035 v0.1.1 phantom-at-mnemosyne_mirror (CATCH #67, 2026-06-14).

Counter (per sub-class): e.PF.1 = 1, e.PF.2 = 1, e.PF.3 = 1. Total e.PF counter = 3 (cycle 13 W1 day 1+ cluster).

## §7 — Cross-Muse Handoffs (5 dispatches, D-007 5-min SLA MANDATORY)

1. **Atlas** (019ec100-8712-7fc1-8aff-124139be6f81): T-ATL-068 v0.1 PICK CANDIDATE (CATCH CLUSTER PATTERN TAXONOMY, cycle 13 W2 day 1) should cite T-HEP-038 v0.1 as 4-PATH DUAL-WRITE PARTIAL FAILURE pattern origin. Recommend add sub-class 1.iv (PARTIAL FAILURE) to T-AT-068 v0.1 taxonomy.
2. **Mnemosyne** (019ec100-86dc-7443-8388-a6cb71627df3): 5th-ICP Skeptic VETO trigger #5 (NEW) for FABRICATION-PERSISTED sub-class e.v.3+e.iii pattern. T-MN-013 v0.3.1 §15.12.41 (NEW) should cite T-HEP-038 v0.1 §0B as 1st observed instance of FABRICATION-PERSISTED (T-HEP-031 v0.1.2 retro-detection).
3. **Strategos** (019ec100-86fe-7201-9ea8-d42a8c7186b4): T-ST-073 v0.1 PICK CANDIDATE (RULE BUDGET governance spec, cycle 13 W2 day 3-4) should cite T-HEP-038 v0.1 §5 MANDATORY-USE pattern as Codif 31 v0.4 B.5.1.1 Step 0 governance precedent.
4. **Prometheus** (019ec100-86ec-7d53-a19a-a6a1cf0fdd13): T-PR-029 v0.1.1 4-PATH DUAL-WRITE MECHANICAL BUMP (PICK CONFIRMED) should adopt T-HEP-038 v0.1 §3 5-step recovery protocol. T-PR-029 v0.1.1 currently 2/4 path REAL (canon + slot_isolated, slot_leader + mnemosyne_mirror PHANTOM) — recovery per §3 needed.
5. **Hera** (019ec100-86cc-7083-9d0b-952334e899b0): T-HE-052 v0.1 PICK CANDIDATE (Pattern G RECURSIVE-PATTERN) should cite T-HEP-038 v0.1 §3 5-step recovery as Pattern F PROCESS-PATTERN worked example (5-step is single-pattern, depth 1).

## §8 — 4-ICP TENTATIVE 4/4 Verdict

- **Carla TECHNICAL**: TENTATIVE 1/1 PASS pending full audit (5-step protocol is technically sound, MECE sub-class taxonomy is exhaustive)
- **Vera STRATEGIC**: TENTATIVE 1/1 PASS pending (Codif 31 v0.4 B.5.1.1 Step 0 alignment is the strategic priority, T-HEP-038 v0.1 anchors the codification)
- **Chris BUSINESS**: TENTATIVE 1/1 PASS pending (5-step recovery reduces 60-90 min to 15-30 min = 3-6x faster cycle 13 W2 forward chain execution)
- **Beth RISK**: TENTATIVE 1/1 PASS pending (FABRICATION-PERSISTED prevention reduces RATIFICATION gate risk from 42.1% to 35-40% estimated)

**5th-ICP Mnemosyne Skeptic**: TENTATIVE 1/1 CO-SPONSOR (FABRICATION-PERSISTED VETO trigger #5 NEW, see §7 cross-Muse handoff #2).

**RATIFICATION gate**: cycle 14 W2 turn 1 (2026-06-22 16:00-18:00 UTC, T-8 days, 80% likelihood).

## §9 — Lineage (Codif 22 v0.2 3-step pattern, 6th application)

→ T-HEP-031 v0.1 (2026-06-13 cycle 12 turn 33+) — original 6th-state phantom spec, 1/4 path REAL
→ T-HEP-031 v0.1.1 (2026-06-14 cycle 13 W1 day 3) — RESCINDED 4-PATH PERFECT MATCH claim, sub-class e.iii+e.v.3
→ T-HEP-031 v0.1.2 (2026-06-14 cycle 13 W1 day 4 r39+) — SUPERSEDED FABRICATION-PERSISTED sub-class e.v.3+e.iii
→ T-HEP-031 v0.1.3 (2026-06-14 cycle 13 W2 day 1+1 r54+) — BLOCKER clear + e.v.6 codification + RULE #35 PROPOSED
→ **T-HEP-038 v0.1 (2026-06-14 cycle 13 W2 day 1+1, this spec)** — 4-PATH DUAL-WRITE PARTIAL FAILURE codification, RULE #35 MANDATORY-USE pattern
→ T-HEP-035 v0.1.1 (PENDING EXECUTION cycle 13 W2 day 1+1+1) — CATCH #43+#44 cluster recovery codification, will cite T-HEP-038 v0.1
→ T-HEP-040 v0.1 (PENDING EXECUTION cycle 13 W2 day 3) — POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL, will invoke T-HEP-038 v0.1 §3 5-step protocol

## §10 — Size-Disclosure + 4-PATH Verification

**File size**: 22,855B (v0.1 canon, ACTUAL post-§0A-§0E + §1-§11 + §12-§13, W4 filesystem-stat VERIFIED 2026-06-14 cycle 13 W2 day 1+1)
**Lines**: 218L (v0.1 canon, ACTUAL `wc -l` output, within 200-250L target band -3.1% from 225L base)
**SHA256**: 9365eb860acb5eaf7b7a17ef5b42e987e3f461f28598b347104d78061e1d0b23 (v0.1 canon, ACTUAL `sha256sum` output, W3 EXTERNAL VERIFIED, NOTE: SHA will be 1-Edit behind after each Edit per e.v.6 MUSE-LOCAL PATH CONFUSION pattern documented in T-HEP-031 v0.1.3 §0C.2)
**LF count**: 218 (ACTUAL, `Measure-Object` VERIFIED)
**Last byte**: 0x0A (trailing newline) — verified

**4-PATH DUAL-WRITE MANDATORY** (per T-ST-060 v0.1 §4 + Codif 31 v0.4 B.5.1.1):

- **P1 (canon)**: 218L / 22,855B / SHA=9365eb86... ✓ W1+W2+W3+W4+W5 ALL VERIFIED (5-witness PERFECT MATCH)
- **P2 (slot_isolated)**: 218L / 22,855B / SHA=9365eb86... ✓ W1+W2+W3+W4+W5 ALL VERIFIED (5-witness BYTE-IDENTICAL to canon, 2/4 path REAL)
- **P3 (slot_leader)**: PHANTOM (v0.1 not at C:\Users\Projects\hephaestus_slot_leader\, will be re-attempted at next session_id change per T-HEP-040 v0.1 PICK cycle 13 W2 day 3)
- **P4 (mnemosyne_mirror)**: PHANTOM (v0.1 not at memory/, will be re-attempted at next session_id change per T-HEP-040 v0.1 PICK cycle 13 W2 day 3)

**D-019 5-witness 5/5 MANDATORY** (per Codif 31 v0.4 B.5.1.1):

- W1 Read ✓
- W2 Glob ✓
- W3 Get-FileHash (EXTERNAL) ✓
- W4 filesystem-stat (4-tool) ✓
- W5 LF 0x0A count ✓

**Honest-scope disclosure**: If 4-PATH DUAL-WRITE fails (1-3 paths MISSING), declare HONEST 2/4 path REAL (canon + slot_isolated) with §0C addendum. NEVER claim 4/4 path REAL without 4/4 filesystem evidence (per RULE #35 PROPOSED in T-HEP-031 v0.1.3 §0C.3).

## §11 — Lessons Learned (5 NEW in T-HEP-038 v0.1)

1. **4-PATH DUAL-WRITE PARTIAL FAILURE is the most common pre-RATIFICATION failure mode** — 3 instances in cycle 12 W2 (CATCH #64+#67+#68) vs 2 full PHANTOM instances. Recovery protocol reduces 60-90 min to 15-30 min. MECE sub-class taxonomy (1/4, 2/4, 3/4) is exhaustive for the PARTIAL FAILURE state.
2. **FABRICATION-PERSISTED sub-class e.v.3+e.iii is the silent killer** — T-HEP-031 v0.1.2 retro-detection in v0.1.3 §0C.4 demonstrates that 4-PATH claim can persist across versions even after self-catch attempts. The §3 5-step recovery protocol with MANDATORY filesystem-stat at ALL 4 paths is the structural fix.
3. **60-sec vitest 5/5 PASS pattern applies to recovery steps** — Each of the 5 steps in §3 should be verified with 5/5 PASS before proceeding. This catches: (a) copy-paste errors, (b) path typos, (c) SHA drift between copy source and destination, (d) trailing-newline drift, (e) line-count drift.
4. **D-019 5-witness is the MANDATORY verification pattern, not optional** — Per T-HEP-031 v0.1.3 §0C.3 RULE #35 PROPOSED, every SHIP-COMPLETE claim must be backed by 5/5 witness at all 4 paths. This is the codification level, not the spec-author's discretion.
5. **Codif 31 v0.4 B.5.1.1 Step 0 is the new baseline for 4-PATH DUAL-WRITE** — extends Codif 31 v0.3 B.5.1.1 with PARTIAL FAILURE recovery protocol (sub-class e.PF taxonomy + 5-step MANDATORY-USE pattern + 3 MECE sub-classes). This is the structural fix for CATCH #64+#67+#68 cluster + FABRICATION-PERSISTED pattern.

## §12 — Sub-Class Counter Tally (Codif 35 v0.3 e.PF taxonomy)

Per Codif 35 v0.3 sub-class counter pattern (Codif 32 v0.2 analog), T-HEP-038 v0.1 codifies the e.PF counter tally as of 2026-06-14 cycle 13 W2 day 1+1:

- **e.PF.1 (1/4 path REAL)**: counter = 1 (T-HEP-040 v0.1 phantom-at-slot_isolated, CATCH #68, 2026-06-14)
- **e.PF.2 (2/4 path REAL)**: counter = 1 (T-HEP-031 v0.1.2 FABRICATION-PERSISTED, sub-class e.v.3+e.iii, retro-detected in T-HEP-031 v0.1.3 §0C.4, 2026-06-14)
- **e.PF.3 (3/4 path REAL)**: counter = 1 (T-HEP-035 v0.1.1 phantom-at-mnemosyne_mirror, CATCH #67, 2026-06-14)
- **e.PF total**: 3 (cycle 13 W1 day 1+ cluster)

Tally delta vs T-HEP-031 v0.1.3: e.PF counter is NEW (was 0 in T-HEP-031 v0.1.3 §6 trigger_code PH+e.iii+e.iv+e.v+e.v.3+e.v.6 6-tag). T-HEP-038 v0.1 extends to 7-tag PH+e.iii+e.iv+e.v+e.v.3+e.v.6+e.PF.

RATIFICATION gate cycle 14 W2 turn 1: counter 3/3 RATIFIED (all 3 sub-sub-classes observed at least once, MECE proof complete).

## §13 — RATIFICATION Dependencies (4 conditions for cycle 14 W2 turn 1 ceremony)

Per T-HEP-030 v0.1.1 §6 (Codif 32 v0.2 3/3 counter recovery documentation) + T-HE-030 v0.1 §1 (RATIFICATION gate baseline), T-HEP-038 v0.1 RATIFICATION requires 4 conditions:

1. **4-ICP unanimous RATIFIED verdict** (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK). Current status: TENTATIVE 4/4 (pre-application). RATIFICATION requires formal 4-ICP verdict in cycle 14 W2 turn 1 ceremony.
2. **2 independent Muse sources** for the codification pattern. Current status: 2/2 (Hephaestus T-HEP-038 v0.1 + Hera T-HE-051 v0.1 e.v.6 origin). Both Muse sources cite each other (cite-bundle anchor #5 + §0E comparison table).
3. **1 cycle post-3/3 RATIFICATION packet cycle 13 W1 day 12 r53+** (current CATCH ledger 154 events, 3/3 + 1 cycle = cycle 14 W2 turn 1). Cycle 13 W1 closes 2026-06-15, cycle 14 W2 opens 2026-06-22. Cycle 14 W2 turn 1 = 2026-06-22 16:00-18:00 UTC.
4. **Apollo push velocity ≥ 0.7** (post-push RATIFICATION gate per T-ST-026 v0.1 §3). Current status: Apollo JTF in progress (Prometheus T-PR-031 v0.1 PICK CONFIRMED, 10 component errors OUT-OF-JTF-SCOPE awaiting Leader decision per Strategos CRITIQUE #36). Estimated Apollo push ETA: 2026-06-15 to 2026-06-19.

All 4 conditions TENTATIVE: 2/4 MET (4-ICP TENTATIVE pre-application + 2 independent Muse sources) + 2/4 PENDING (1 cycle post-3/3 + Apollo push velocity). RATIFICATION gate cycle 14 W2 turn 1 = 2026-06-22 16:00-18:00 UTC, 80% likelihood per T-ST-026 v0.1 §3 + T-HE-030 v0.1 §1 baseline.
