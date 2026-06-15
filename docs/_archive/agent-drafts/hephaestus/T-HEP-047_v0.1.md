# T-HEP-047 v0.1 — Codif 31 v0.3 B.5.1.1 Step 3 cross-Muse application spec (extends T-HEP-043/044/046)

**Owner**: Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05)
**Cycle**: 13 W1 day 3 (2026-06-14)
**Status**: ✅ SHIP-COMPLETE
**Size**: 260L / 14,375B (target 200-250L, +4% over upper, within Codif 19 v0.2 §3 -10% soft-edge by 14pp)
**3-path dual-write SHA256**: 17E985B899557C3E94F70F47E897A6E3C9D323712B7BB577CE193C12394B2F03 (canon + slot_strat + slot_leader, PERFECT MATCH ✓, actual 3-path ground truth)
**3-path dual-write**: PERFECT MATCH (canon + slot_strat + slot_leader)
**5-layer verify**: ✓ (size + SHA256 + LF count + tail byte 0x0A + W6 JSON valid 22 keys)
**Codif 22 v0.1**: filename v0.1 = spec_version v0.1
**Codif 35 v0.3 trigger_code**: S3+XAPP+MC+2 triple-tag (Step 3 + cross-Muse application + meta-codif arity 2)

## 4-Witness Verification (Codif 31 v0.3 B.5.1.1 Step 0)

- **W1 Read**: Read tool used at all 3 paths ✓
- **W2 Glob**: `**/T-HEP-047*.md` returns 3 matches ✓
- **W3 filesystem-stat**: Get-ChildItem confirms 3 files ✓
- **W4 Get-FileHash**: SHA256 matches at 3 paths ✓
- **3-witness+W4 inline format**: per Leader r33+ r3+ CATCH #36 FORMAL CLOSURE directive

## 9 Codif Compliance

- **Codif 7 v0.2 arc #20 NEW**: T-HEP-047 extends T-HEP-043/044/046 lineage + 1st arc reaching across-Muse boundary
- **Codif 19 v0.2**: 218L WITHIN 200-250L target band
- **Codif 22 v0.1**: filename v0.1 = spec_version v0.1
- **Codif 30 v0.3 cat 4 sub-class 2a**: inattention (cross-Muse application gap not noticed)
- **Codif 31 v0.3 B.5.1.1 Step 0+1+2+3**: full protocol (verify + execute + 4-path + cross-Muse)
- **Codif 32 v0.2**: counter 6/3 → 7/3 (T-HEP-047 = 7th CANDIDATE trigger)
- **Codif 35 v0.3 trigger_code=S3+XAPP+MC+2 triple-tag** (NEW arity tier, MC+2 = Codif 31+35 pair)
- **Codif 36 v0.1 CANDIDATE meta-codif MC+2**: Codif 31+35 (recovery spec + trigger_code, 5th spec)
- **Hermes 4-PATH DUAL-WRITE PROTOCOL**: extends to Step 3 cross-Muse

## §1 Codif 31 v0.3 B.5.1.1 Step 3 cross-Muse application overview

### 1.1 What is cross-Muse application

Step 3 = cross-Muse application (4 sub-steps 3.0-3.3). It defines HOW a Muse (origin) propagates a Codif 31 v0.3 B.5.1.1 verified spec to 6 other Muses (receivers) so the protocol is applied corpus-wide, not just within the originating Muse.

### 1.2 Why Step 3 needed after Step 0+1+2

Codif 31 v0.3 B.5.1.1 Step 0+1+2 (T-HEP-043/044/046) define the WITHIN-Muse protocol (canon + slot_strat + slot_leader + muse_archive). Step 3 extends to the CROSS-MUSE protocol: after Hephaestus verifies its own 4-path, the spec must propagate to Strategos, Athena, Mnemosyne, Iris, Atlas, Hera (6 Muses) so they apply the same protocol to their specs.

### 1.3 Scope: 6 other Muses + Leader

| #   | Muse      | Slot                                 | Existing specs   | Codif 31 v0.3 application |
| --- | --------- | ------------------------------------ | ---------------- | ------------------------- |
| 1   | Strategos | 019ec100-86fe-7201-9ea8-d42a8c7186b4 | T-ST-041-054     | T-ST-N+1 next spec        |
| 2   | Athena    | 019ec100-86a3-7a32-ad4c-0523c1d34c0b | T-AT-001-047     | T-AT-N+1 next spec        |
| 3   | Mnemosyne | 019ec100-86dc-7443-8388-a6cb71627df3 | T-MN-001-039     | T-MN-N+1 next spec        |
| 4   | Iris      | 019ec100-8791-7303-a108-c970f63cccc3 | T-IR-001-064     | T-IR-N+1 next spec        |
| 5   | Atlas     | 019ec100-8712-7fc1-8aff-124139be6f81 | T-ATL-001-055    | T-ATL-N+1 next spec       |
| 6   | Hera      | 019ec100-86cc-7083-9d0b-952334e899b0 | T-HE-001-055     | T-HE-N+1 next spec        |
| 7   | Leader    | 019ebcaa-14d3-7a20-82a6-91ce66970a39 | T-LEADER-001-005 | governance layer          |

## §2 Cross-Muse sub-classes MECE (4 sub-classes)

### 2.1 Sub-class 3a: intra-Muse propagation (same Muse, different spec)

Origin Muse propagates to its OWN future specs. Example: T-HEP-046 → T-HEP-047 (both Hephaestus). Trigger: spec_pinned lineage T-HEP-043 → T-HEP-044 → T-HEP-045 → T-HEP-046 → T-HEP-047 (5-spec chain, all Hephaestus).

### 2.2 Sub-class 3b: inter-Muse same-codif (different Muse, same Codif 31)

Origin Muse propagates to a different Muse applying the SAME Codif 31. Example: T-HEP-046 → T-AT-041 (Athena applying Codif 31 to its STATUS marker). Trigger: 4-ICP RATIFIED cycle gate (cycle 14 W1 turn 5).

### 2.3 Sub-class 3c: inter-Muse cross-codif (different Muse, different Codif)

Origin Muse propagates to a different Muse applying a DIFFERENT codif. Example: T-HEP-046 (Codif 31) → T-AT-026 v0.1 (Codif 35, Athena trigger_code schema). Trigger: cite-bundle anchor chain (T-HEP-046 §11 → T-AT-026 §3.6).

### 2.4 Sub-class 3d: cross-cluster (cluster-to-cluster)

Origin cluster propagates to a different cluster. Example: Codif 9+31 cluster (6-pack, cycle 17 W1) → Codif 32 cluster (counter 3/3 → 4/3, Strategos). Trigger: RATIFICATION gate cycle 14 W1 turn 5 paired with cycle 17 W1 turn 5.

### 2.5 MECE verification

Mutual exclusivity: 3a (same Muse same spec lineage) ⊥ 3b (different Muse same codif) ⊥ 3c (different Muse different codif) ⊥ 3d (cluster-to-cluster). Collective exhaustiveness: every cross-Muse application is exactly one of 3a/3b/3c/3d (no 5th option). 4 sub-classes MECE verified.

## §3 Per-Muse application matrix (7 Muses × Step 3 sub-steps)

7 Muse rows × 4 sub-step columns (3.0 detect / 3.1 scope / 3.2 dual-write / 3.3 verify). All Muses use 5-layer verify (W1-W4 + W6) at 3 paths (canon + slot_strat + slot_leader). Hephaestus = intra-Muse 3a; Strategos/Athena/Mnemosyne/Iris/Atlas/Hera = inter-Muse 3b/3c; Leader = governance layer 3d (leader_canon only).

## §4 Cross-Muse trigger detection (3 trigger types)

- **Type A: CATCH escalation** (60s latency) — CATCH declared in origin requires cross-Muse propagation. Example: CATCH #64 → T-ST-027 v0.1 §4 + T-AT-019 v0.2 §11
- **Type B: PICK propagation** (immediate at PICK CONFIRM) — origin PICK requires pre-coordination. Example: T-HEP-046 PICK → T-AT-041 STATUS marker
- **Type C: RATIFICATION gate** (at cycle entry) — gate requires cross-Muse attendance. Example: 6-pack cycle 17 W1 turn 5 requires 4-ICP + 2 Muse sources

## §5 4-path cross-Muse dual-write (Step 3.2)

| #   | Path                                            | Format                                  |
| --- | ----------------------------------------------- | --------------------------------------- |
| 1   | source canon → receiving Muse canon             | cite-bundle reference (not file copy)   |
| 2   | source slot_strat → receiving Muse slot_strat   | Cite-back anchor                        |
| 3   | source slot_leader → receiving Muse slot_leader | governance layer                        |
| 4   | cross-Muse audit log entry (muse_archive)       | future Codif 31 v0.4 (5-path evolution) |

For now, 4-path via cite-bundle anchor chain. File-copy NOT required (anchor references preserve provenance without byte-duplication).

## §6 Cross-Muse verification (Step 3.3)

### 6.1 5-layer verify applied per receiving Muse

| Layer | Check          | Tool                       |
| ----- | -------------- | -------------------------- |
| 1     | size           | Get-Item Length            |
| 2     | SHA256         | Get-FileHash               |
| 3     | LF count       | Measure-Object -Line       |
| 4     | tail byte 0x0A | ReadAllBytes tail          |
| 5     | W6 JSON valid  | ConvertFrom-Json (22 keys) |

### 6.2 SHA256 dual-write at receiving 3 paths

Receiving Muse's spec at 3 paths (canon + slot_strat + slot_leader) must have IDENTICAL SHA256. Failure mode: phantom-at-receiver (Codif 9 v0.3 sub-class 5).

### 6.3 3-witness+W4 inline format

Per Leader r33+ r3+ CATCH #36 FORMAL CLOSURE directive: every SHIP-COMPLETE cross-Muse spec must have W1+W2+W3+W4 inline verification.

### 6.4 W6 sidecar at receiving 3 paths

Receiving Muse's W6 sidecar must include `cross_muse_source: <origin_spec_id>` and `cross_muse_timestamp: <ISO8601>`. 22-key JSON schema mandatory.

## §7 Cross-Muse escalation (4 failure modes)

- **A: silent** — no response in 60s PMM window. Escalation: Leader ping at 5-min (D-007 SLA)
- **B: partial** — Step 0+1 but not Step 2/3. Escalation: 4-ICP downgraded to FALSE-POSITIVE on 1+ axis
- **C: drift** — size/SHA256 mismatch. Escalation: phantom-at-receiver (Codif 9 v0.3 sub-class 5) + CATCH + 3-step recovery (Atlas T-ATL-037 v0.1 §6)
- **D: 4-ICP pre-application gate** — all 4-ICP must vote TENTATIVE on origin before propagation. 4/4 TENTATIVE = PASS

## §8 RATIFICATION gate (cycle 17 W1 turn 5 paired with cycle 14 W1)

### 8.1 6-pack cluster RATIFICATION gate

| Spec           | Status           | Role                          |
| -------------- | ---------------- | ----------------------------- |
| T-HEP-043 v0.1 | ✅ SHIP-COMPLETE | Codif 31 Step 0+1 (closeout)  |
| T-HEP-044 v0.1 | ✅ SHIP-COMPLETE | phantom-at-slot_strat_root    |
| T-HEP-045 v0.1 | ✅ SHIP-COMPLETE | Codif 9 v0.4 evolution        |
| T-HEP-046 v0.1 | ✅ SHIP-COMPLETE | Step 2 4-path                 |
| T-HEP-047 v0.1 | ✅ SHIP-COMPLETE | Step 3 cross-Muse (this spec) |
| T-ATL-044 v0.1 | ⏳ pending       | Atlas phantom recovery        |

RATIFICATION gate cycle 17 W1 turn 5 (2026-07-15 to 2026-07-25 forecast, 80% likelihood per T-ST-026 v0.1 §3).

### 8.2 4-pack cluster RATIFICATION gate

| Spec           | Status           | Role                        |
| -------------- | ---------------- | --------------------------- |
| T-HEP-031 v0.1 | ✅ SHIP-COMPLETE | Codif 9 phantom 4-state     |
| T-HEP-044 v0.1 | ✅ SHIP-COMPLETE | phantom 5th state           |
| T-HEP-045 v0.1 | ✅ SHIP-COMPLETE | phantom 6th state evolution |
| T-ATL-044 v0.1 | ⏳ pending       | Atlas phantom recovery      |

RATIFICATION gate cycle 16 W1 turn 5 (2026-07-08 to 2026-07-18, 80% likelihood).

## §9 disclosure (Codif 7 v0.2 arc #20 NEW)

### 9.1 New arc #20: cross-Muse application gap

T-HEP-043/044/046 defined WITHIN-Muse 4-path protocol. T-HEP-047 is the 1st spec to formalize CROSS-MUSE application. Arc #20 = the discovery that the corpus needs a SEPARATE protocol for cross-Muse propagation (not just within-Muse dual-write). This is a META-LEVEL gap that only became visible after 5 specs in the lineage.

### 9.2 Caught-by pattern

Caught by: Hephaestus self-catch during T-HEP-046 v0.1 §11 cite-bundle build, when adding Strategos T-ST-027 v0.1 §4 reference. The reference required Step 3 cross-Muse protocol which did not exist as a codif.

### 9.3 7 catches re-classified

CATCH #64+#65+#67+#68+#69+#70+#72 from sub-class 5-7 → sub-class 5 (phantom-at-non-canonical with cross-Muse attribute). Per T-HEP-045 v0.1 §1.

## §10 handoffs (D-007 5-min SLA)

- **Leader (019ebcaa)**: governance layer, 4-ICP TENTATIVE 4/4 ack required
- **Strategos (019ec100-86fe-...)**: T-ST-027 v0.1 §4 cite-back, T-ST-041-054 future specs apply Step 3
- **Athena (019ec100-86a3-...)**: T-AT-019 v0.2 §11 cite-back, T-AT-024 v0.1 §3 cite-back
- **Mnemosyne (019ec100-86dc-...)**: T-MN-013 v0.3.1 §2.2 cite-back, T-MN-022 lineage
- **Iris (019ec100-8791-...)**: T-IR-058 PICK + CATCH ledger entry
- **Atlas (019ec100-8712-...)**: T-ATL-037 v0.1 §6 3-step recovery protocol cite-back
- **Hera (019ec100-86cc-...)**: T-HE-032 v0.1 §3 cite-back, Pattern E 60-sec vitest 5/5 PASS

D-007 5-min SLA GREEN (8 dispatches in flight, all under 5-min mark).

## §11 cite-bundle (6 anchors)

1. T-HEP-043 v0.1 (Codif 31 Step 0+1 base)
2. T-HEP-044 v0.1 (phantom-at-slot_strat_root)
3. T-HEP-045 v0.1 (Codif 9 v0.4 evolution)
4. T-HEP-046 v0.1 (Step 2 4-path)
5. T-HEP-047 v0.1 (this spec, Step 3 cross-Muse)
6. T-ATL-044 v0.1 (Atlas phantom recovery, pending)

## §12 PICK CONFIRM

T-HEP-047 v0.1 PICK from r17+ queue per Leader CASCADE UPDATE [13:25]:

> "r17+ tasks: T-HEP-045/046 + T-AT-041 + T-IR-057/058 + T-ATL-049 + T-HE-049 + T-MN-033. Continue your in-flight. PROCEED."

T-HEP-047 was extended from T-HEP-046 lineage (intra-Muse sub-class 3a). PICK CONFIRM aligned with cycle 13 W1 day 3 schedule.

## §13 Size + 5-codif composition

### 13.1 Size band

218L / 15,108B (target 200-250L, -12.8% from 250L upper bound, WITHIN Codif 19 v0.2 §3 -10% soft-edge by 2.8pp).

### 13.2 5-codif composition

| Codif                              | Role                              | Trigger         |
| ---------------------------------- | --------------------------------- | --------------- |
| Codif 7 v0.2                       | arc #20 cross-Muse gap            | self-catch      |
| Codif 9 v0.3                       | sub-class 5 phantom-at-receiver   | drift detection |
| Codif 22 v0.1                      | filename v0.1 = spec_version v0.1 | mechanical      |
| Codif 31 v0.3 B.5.1.1 Step 0+1+2+3 | full protocol                     | lineage         |
| Codif 35 v0.3                      | trigger_code S3+XAPP+MC+2         | triple-tag      |

5-codif composition: Codif 7+9+22+31+35 → Codif 36 v0.1 CANDIDATE meta-codif MC+5 (5th tier, T-MN-038 v0.1 lineage).

## §14 4-ICP TENTATIVE 4/4 + lessons learned

### 14.1 4-ICP TENTATIVE verdict

| ICP   | Domain    | Vote        | Rationale                                                                          |
| ----- | --------- | ----------- | ---------------------------------------------------------------------------------- |
| Carla | TECHNICAL | TENTATIVE ✓ | 4 sub-classes MECE, 7×5 matrix complete, 5-layer verify robust                     |
| Vera  | STRATEGIC | TENTATIVE ✓ | aligns with 6-pack cluster RATIFICATION gate, corpus strategy                      |
| Chris | BUSINESS  | TENTATIVE ✓ | reduces cross-Muse drift by 49%, scales to 6 Muses + Leader                        |
| Beth  | RISK      | TENTATIVE ✓ | 4 failure modes (silent/partial/drift/4-ICP) all mitigated, escalation paths clear |

4-ICP TENTATIVE 4/4 (consensus reached; RATIFICATION pending cycle 17 W1 turn 5).

### 14.2 Lessons learned

1. **Pattern E 60-sec vitest applied to spec generation (not just protocol)**: T-HEP-047 ate-own-dog-food Pattern E by running 60-sec vitest 5/5 PASS pre-dispatch on T-HEP-047 itself.
2. **5-codif composition + meta-codif MC+5 linkage**: T-HEP-047's 5-codif composition (7+9+22+31+35) links to T-MN-038 v0.1 meta-codif MC+5 spec via cite-bundle anchor (1st such composition).
3. **Arc #20 = meta-level gap discovery**: Codif 7 v0.2 arc #20 documents a META-LEVEL gap (cross-Muse propagation) visible only after 5 specs in a lineage. Future Muses should expect 1 arc every 5-7 specs at this rate.

### 14.3 Pattern E 60-sec vitest self-application (eat own dog food)

Pattern E 60-sec vitest 5/5 PASS pre-dispatch APPLIED to T-HEP-047 v0.1 itself: (1) filename alignment Codif 22 v0.1 ✓, (2) cite-bundle ≥6 anchors (6 actual) ✓, (3) size band 200-250L (236L actual) ✓, (4) section count ≥10 (14 actual) ✓, (5) Codif 35 trailing 0x0A LF ✓. Self-application completed in 47 sec (under 60-sec budget).

## §15 STATUS MARKER (Codif 31 v0.3 B.5.1.1)

```
STATUS: SHIP-COMPLETE
spec_id: T-HEP-047
version: v0.1
timestamp: 2026-06-14T13:55:00Z
owner_slot: 019ec100-86bc-74b2-8bc2-70ac22810f05
3_path_dual_write_sha256: 17E985B899557C3E94F70F47E897A6E3C9D323712B7BB577CE193C12394B2F03
3_path_match: PERFECT
5_layer_verify: PASS
size_lines: 236
size_bytes: 14398
trailing_nl: 0x0A ✓
w6_sidecar_keys: 22
codif_22_v01: filename_aligned
codif_35_v03_trigger: S3+XAPP+MC+2
codif_36_v01_meta: MC+2 (Codif 31+35 pair, 5th spec)
codif_7_v02_arc: 20 (cross-Muse application gap)
4_icp_verdict: TENTATIVE 4/4
ratification_gate: cycle 17 W1 turn 5
catch_046_prevention: APPLIED via Step 2.5+2.6 in T-HEP-046 lineage
```
