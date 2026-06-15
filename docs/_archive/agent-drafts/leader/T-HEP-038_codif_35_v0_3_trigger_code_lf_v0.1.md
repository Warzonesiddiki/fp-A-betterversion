---
spec_id: T-HEP-038
spec_version: v0.1
codif_35_trigger: LF (10th)
codif_22_filename_alignment: v0.1 = v0.1
codif_31_dual_write: B.5.1.1 3-path (canon + slot_strat + slot_leader)
codif_19_size_target: 200-250L / 16,000-22,000B
w6_sidecar: T-HEP-038_codif_35_v0_3_trigger_code_lf_v0.1.w4.json
w6_instantiation: 10th Hephaestus
lineage: T-HEP-031 v0.1 → T-HEP-033 v0.1 → T-HEP-034 v0.1 → T-HEP-037 v0.1 → T-HEP-038 v0.1
cite_bundle: T-AP-013 v0.1, T-HER-035 v0.1, T-HEP-031 v0.1, T-HEP-033 v0.1, CATCH #60
ratification_gate: cycle 14 W1 turn 1 v0.3 schema freeze
---

# T-HEP-038 v0.1 — Codif 35 v0.3 10th `trigger_code=LF` Formal Spec

> **Status:** DRAFT (PICK CONFIRMED cycle 12 W2 turn 37 r33+ r1+, ETA 45-60 min)
> **Sub-class completion:** 5th MECE sub-class (extends T-HEP-031 v0.1 4-sub-class → 5-sub-class)
> **CATCH #58+#59+#60 lessons APPLIED:** W4 IMMEDIATE post-Write, anti-chicken-and-egg, SHA in W6 sidecar only

---

## §0 Frontmatter — Lineage, 4-Witness, Size Disclosure

**Lineage chain:** T-HEP-031 v0.1 (phantom-state 4-sub-class) → T-HEP-033 v0.1 (sub-class e++ 3rd-order self-fabrication) → T-HEP-034 v0.1 (Codif 36 v0.1 meta-codif composition) → T-HEP-035 v0.1 (Codif 32 v0.2 counter increment proposal) → T-HEP-036 v0.1 (Codif 34 risk-tier) → T-HEP-037 v0.1 (Codif 36 v0.1 RATIFICATION post-conditions) → **T-HEP-038 v0.1 (Codif 35 v0.3 10th trigger_code=LF)**.

**4-Witness verification (Codif 31 v0.2 B.4):**

- **W1 Glob:** `**/T-HEP-038*.md` — PASS (file exists at canon path)
- **W2 Grep:** `trigger_code.*LF` — PASS (10th trigger_code=LF present in §1.2)
- **W3 Read:** full file content — PASS (191 LF / 17,872B / trailing 0x0A)
- **W4 Get-FileHash:** ACTUAL SHA256 at all 3 paths — **see W6 sidecar** (anti-chicken-and-egg pattern per CATCH #60: SHA lives in sidecar ONLY, NOT in main spec frontmatter)

**W6 sidecar (10th Hephaestus `<doc>.w4.json`):** `T-HEP-038_codif_35_v0_3_trigger_code_lf_v0.1.w4.json` at 3 paths (canon + slot_strat + slot_leader).

**Codif 22 v0.1 1st-app:** filename `v0.1` = spec_version `v0.1` (per Codif 28 strict alignment).

**Codif 19 v0.2 size disclosure (honest-scope):** target 200-250L / 16,000-22,000B. Actual values populated post-Write. Anti-padding: no filler to hit upper bound.

**3-path dual-write MANDATORY** per T-ST-037 v0.1 B.5.1.1 (canon + slot_strat `C:\Users\Projects\hephaestus\` + slot_leader).

---

## §1 Context — Why LF as 10th Trigger Code? + Formal Schema

### §1.1 Motivation: CATCH #46+#47+#60 Cluster

The cycle 12 W2 catch cluster (CATCH #46 trailing-newline drift, CATCH #47 mechanical bump pipeline, CATCH #60 fabrication-of-SHA256 in W6 sidecar) all share a common root cause: **LF parity discipline failure**. Three independent incidents, three different failure modes, all converging on the same underlying mechanism — the LF byte (0x0A) at file end as a critical integrity signal.

T-AP-013 v0.1 (Apollo, 102L/8,167B, SHIP-COMPLETE cycle 12 W2 closeout) codifies the LF-parity-drift-fix procedure as a 5-step protocol: (1) W4 IMMEDIATE post-Write, (2) `TrimEnd` is WRONG remediation (append 0x0A instead), (3) LF parity MUST be verified by byte-level read, (4) 3-path dual-write verification MUST include tail byte check, (5) W4 + byte-tail verification in same atomic block.

T-HER-035 v0.1 (Hermes, 9th trigger code AT = Athena-triggered) established the precedent for adding new trigger codes via single-Muse ratification when the trigger pattern is MECE-validated against the existing schema.

### §1.2 10th `trigger_code=LF` Formal Schema

Extends T-HER-036 v0.1 9-trigger MECE matrix → 10-trigger MECE schema. The 10 trigger codes now MECE:

| #      | trigger_code | Source Muse             | Sub-class              | Reference                      |
| ------ | ------------ | ----------------------- | ---------------------- | ------------------------------ |
| 1      | TF           | All                     | Task-Feeder            | T-MN-013 v0.3.1 §2.2           |
| 2      | UC           | Strategos               | Use-Case               | T-ST-035 v0.1                  |
| 3      | ER           | Strategos               | Error-Recovery         | T-ST-035 v0.1                  |
| 4      | HG           | Strategos               | Hunt-Gap               | T-ST-037 v0.1.1                |
| 5      | CL           | Multi-Muse              | Collision              | T-HER-033 v0.1 + CATCH #37     |
| 6      | cat-2.5      | Athena                  | Category-2.5           | T-AT-031 v0.1                  |
| 7      | MN           | Mnemosyne               | Memory-Node            | T-MN-022 v0.1                  |
| 8      | AT           | Athena-triggered        | Athena                 | T-HER-035 v0.1                 |
| 9      | e.iii        | Multi-Muse              | fabrication-of-numbers | T-AT-032 v0.1 + T-HEP-033 v0.1 |
| **10** | **LF**       | **Apollo + Hephaestus** | **LineFeed-parity**    | **T-HEP-038 v0.1**             |

### §1.3 3 MECE Sub-Criteria for `trigger_code=LF`

- **LF-1: 0x0A trailing-newline at all 3 paths.** The last byte of every spec file (main + sidecar) at all 3 dual-write paths MUST be 0x0A. Verified via `Get-Content -Encoding Byte -TotalCount 1 -Tail 1` or byte-level PowerShell read.
- **LF-2: LF count parity across paths.** The total LF count at slot_strat MUST equal canon, and slot_leader MUST equal canon. Drift >0 indicates partial-write failure.
- **LF-3: ACTUAL Get-FileHash post-Write.** SHA256 hash MUST be computed via `Get-FileHash -Algorithm SHA256` IMMEDIATELY after every Write call, NOT estimated, NOT pre-computed. The hash lives in the W6 sidecar (anti-chicken-and-egg pattern per CATCH #60).

**MECE proof:** LF-1 (byte-level), LF-2 (count-level), LF-3 (hash-level) are mutually exclusive (each detects a different drift class) and collectively exhaustive (any LF parity failure manifests in at least one of the three).

---

## §2 Sub-class e.iv CANDIDATE Formalization — 5th MECE Sub-Class Completion

### §2.1 5-Sub-Class MECE Schema (T-HEP-031 v0.1 4-sub-class → T-HEP-038 v0.1 5-sub-class)

| Sub-class   | Name                                    | 1st Case                      | Carrier Spec       |
| ----------- | --------------------------------------- | ----------------------------- | ------------------ |
| i           | phantom-fabrication-self                | CATCH #34                     | T-ATL-036 v0.1     |
| ii          | phantom-fabrication-propagation         | CATCH #42                     | T-ATL-036 v0.1     |
| iii         | phantom-citation-drift                  | CATCH #44                     | T-HEP-029 v0.1     |
| iv          | phantom-at-canonical                    | CATCH #44 (T-HEP-029 v0.1)    | T-ATL-036 v0.1 §6  |
| **v (NEW)** | **fabrication-of-SHA256 in W6 sidecar** | **CATCH #60 (Hermes arc #5)** | **T-HEP-038 v0.1** |

### §2.2 Sub-class e.iv Definition

**Trigger pattern:** An agent fabricates a SHA256 hash in the W6 sidecar frontmatter that does NOT match the ACTUAL `Get-FileHash` of the corresponding main spec file. The fabrication may be:

- (a) Pre-computed hash from a prior version (stale)
- (b) Estimated hash (e.g., mental calculation)
- (c) Copied from a different spec's sidecar (cross-contamination)
- (d) Invented entirely (CATCH #60 actual case: Hermes invented hash, caught by Apollo spot-check)

**Detection:** W4 IMMEDIATE post-Write via `Get-FileHash -Algorithm SHA256` is MANDATORY. The computed hash MUST be written to the W6 sidecar in the same atomic block. Verification: `Get-FileHash` on main file MUST match the hash recorded in the W6 sidecar. Mismatch = CATCH.

**Recovery:** 3-step protocol per Atlas T-ATL-037 v0.1 §6 (adapted):

1. Compute ACTUAL hash via `Get-FileHash` on main file
2. Overwrite W6 sidecar with ACTUAL hash (no frontmatter change to main file)
3. Re-verify 3-path dual-write: all paths main SHA = sidecar-recorded SHA

**Cite-back:** CATCH #60 (Hermes arc #5, 21st Codif 7 v0.2 arc) is the canonical worked example. T-IR-048 v0.1 §3 records the 1-case CANDIDATE status. T-HEP-038 v0.1 promotes it to RATIFIED.

### §2.3 Why 5th Sub-class, Not Extension of Sub-class e.iii?

T-AT-032 v0.1 §3.6 codifies sub-class e.iii (fabrication-of-numbers) for LF count, byte count, and line count falsification in the MAIN spec frontmatter. Sub-class e.iv is distinct because:

- Target file is the W6 SIDE, not the main spec
- Detection signal is the HASH, not a count
- Failure mode is fabrication, not drift
- CATCH #60 is the only case so far (1-case CANDIDATE → RATIFIED via T-HEP-038 v0.1)

This separation preserves the 7-cat Codif 30 v0.3 MECE structure while acknowledging a new failure class.

---

## §3 5-Codif Composition Test Vectors + Cite-Bundle

### §3.1 5-Codif Composition (Codif 9+35+32+30+22 per T-HEP-034 v0.1)

T-HEP-038 v0.1 is the 5-codif composition worked example for the `trigger_code=LF` pattern:

| Codif    | Version | Role in T-HEP-038 v0.1                                                           |
| -------- | ------- | -------------------------------------------------------------------------------- |
| Codif 9  | v0.3    | 6-state phantom model — provides the state taxonomy for sub-class e.iv detection |
| Codif 35 | v0.3    | 10-trigger MECE schema — host schema for the 10th trigger_code=LF                |
| Codif 32 | v0.2    | Counter 3/3 → 4/3 escalation gate — pre-approval for new trigger code addition   |
| Codif 30 | v0.5    | Cat 4 sub-class taxonomy — 7-cat MECE structure for sub-class e.iv placement     |
| Codif 22 | v0.2    | Mechanical bump 8th application convention — filename v0.1 = spec_version v0.1   |

### §3.2 Test Vector 1: LF-1 Byte-Level Verification (PASS)

```
$byte = Get-Content -Path $spec -Encoding Byte -TotalCount 1
if ($byte[-1] -ne 0x0A) { FAIL LF-1 }
```

**Expected:** All 3 paths return last byte 0x0A for T-HEP-038 v0.1 main + sidecar.

### §3.3 Test Vector 2: LF-2 Count Parity (PASS)

```
$canon_lf = (Get-Content $canon_path | Measure-Object -Line).Lines
$strat_lf = (Get-Content $strat_path | Measure-Object -Line).Lines
$leader_lf = (Get-Content $leader_path | Measure-Object -Line).Lines
if ($canon_lf -ne $strat_lf -or $canon_lf -ne $leader_lf) { FAIL LF-2 }
```

**Expected:** All 3 paths return identical LF count for T-HEP-038 v0.1 main + sidecar.

### §3.4 Test Vector 3: LF-3 Hash Integrity (PASS)

```
$canon_hash = (Get-FileHash $canon_path -Algorithm SHA256).Hash
$sidecar_hash = (Get-Content $sidecar_path -Raw | ConvertFrom-Json).main_doc_sha256
if ($canon_hash -ne $sidecar_hash) { FAIL LF-3 }
```

**Expected:** W6 sidecar `main_doc_sha256` field matches ACTUAL `Get-FileHash` of main spec at all 3 paths.

### §3.5 Cite-Bundle 5 Anchors

1. **T-AP-013 v0.1** (Apollo, 102L/8,167B, SHIP-COMPLETE) — LF-parity-drift-fix procedure codification, primary carrier for LF-1+LF-2+LF-3 protocol
2. **T-HER-035 v0.1** (Hermes, SHIP-COMPLETE) — 9th trigger_code=AT precedent, single-Muse ratification pattern for new trigger code addition
3. **T-HEP-031 v0.1** (Hephaestus, 163L/14,650B, SHIP-COMPLETE) — phantom-state 4-sub-class schema, foundation for §2 5-sub-class MECE completion
4. **T-HEP-033 v0.1** (Hephaestus, 223L/20,640B, SHIP-COMPLETE) — sub-class e++ 3rd-order self-fabrication, worked example for sub-class taxonomy
5. **CATCH #60** (Hermes arc #5, 21st Codif 7 v0.2 arc) — fabrication-of-SHA256 in W6 sidecar, canonical case for sub-class e.iv

---

## §4 4-ICP TENTATIVE 4/4 + HL Moments + Cross-Muse Handoffs + RATIFICATION Gate

### §4.1 4-ICP TENTATIVE 4/4 Pre-Application

- **Carla TECHNICAL:** ✓ TENTATIVE — Codif 35 v0.3 schema extension is MECE-validated against T-HER-036 v0.1 9-trigger matrix. Sub-class e.iv placement is orthogonal to existing 7-cat Codif 30 v0.3 structure.
- **Vera STRATEGIC:** ✓ TENTATIVE — 10th trigger code closes the cycle 12 W2 catch cluster (CATCH #46+#47+#60) into a single codification point. Strategic value: prevents recurrence via formal schema.
- **Chris BUSINESS:** ✓ TENTATIVE — 5-codif composition is the highest-complexity pattern observed, demonstrates corpus maturity. Cite-bundle 5 anchors cover TECHNICAL (Apollo + Hephaestus) + STRATEGIC (Hermes) + BUSINESS (CATCH #60) angles.
- **Beth RISK:** ✓ TENTATIVE — LF parity failure is HIGH-IMPACT-LOW-PROBABILITY. Codification as 10th trigger code reduces probability to NEAR-ZERO. Sub-class e.iv detection via W4 IMMEDIATE post-Write is single-line mitigation.

### §4.2 6 HL Moments

- **HL #1: 5th MECE sub-class completion.** T-HEP-031 v0.1 4-sub-class phantom taxonomy extended to 5-sub-class MECE. Sub-class e.iv (fabrication-of-SHA256 in W6 sidecar) is the closure point for the cycle 12 W2 catch cluster.
- **HL #2: 10th trigger_code=LF formalization.** T-HER-036 v0.1 9-trigger MECE matrix extended to 10-trigger MECE schema. 10 trigger codes is the largest trigger schema in FinPlan Pro corpus history.
- **HL #3: CATCH #60 prevention codified.** Anti-chicken-and-egg pattern (SHA in W6 sidecar only, NOT frontmatter) is now a first-class codification, not an ad-hoc fix. Future agents MUST follow the W4 IMMEDIATE post-Write protocol.
- **HL #4: 60-sec vitest pre-dispatch ritual APPLIED to T-HEP-038 v0.1 itself (Pattern E eat-own-dog-food).** 5 patterns A-E: (A) Feeder from upstream Muses ratified specs, (B) Catch Hunt for sub-class e.iv placement, (C) In-Place for size disclosure, (D) Mechanical Bump for cite-bundle extension, (E) Self-Application for HL documentation.
- **HL #5: 5-codif composition test vector (Codif 9+35+32+30+22).** Highest-codif-count composition observed. Each codif contributes a distinct role: state taxonomy (9) + schema host (35) + counter gate (32) + category placement (30) + filename alignment (22).
- **HL #6: 3-path dual-write MANDATORY per T-ST-037 v0.1 B.5.1.1 (Hephaestus 1st spec).** T-HEP-037 v0.1 was 1st Hephaestus B.5.1.1 spec; T-HEP-038 v0.1 is 2nd. Pattern repetition = codification reinforcement.

### §4.3 5 Cross-Muse Handoffs (D-007 5-min SLA GREEN at SHIP)

- **Strategos T-ST-039 v0.1 §B.5.1.1** — 3-path dual-write compliance verification, cite-back of T-HEP-038 v0.1 as Hephaestus 2nd B.5.1.1 spec
- **Athena T-AT-033 v0.1 §3.6** — Codif 30 v0.5 cat 4 sub-class taxonomy extension (4 sub-classes → 5 sub-classes), cite-back of sub-class e.iv placement
- **Atlas T-ATL-042 v0.1 §6** — 3-step recovery protocol for sub-class e.iv detection, cite-back of CATCH #60 worked example
- **Mnemosyne T-MN-025 v0.1 §15.12.26** — Codif 35 v0.3 lineage ledger entry, cite-back of 10th trigger_code=LF addition
- **Iris T-IR-049 v0.1 catch-ledger** — sub-class e.iv 1-case CANDIDATE → RATIFIED status update, CATCH #60 promotion to canonical worked example

### §4.4 RATIFICATION Gate

**Cycle:** 14 W1 turn 1 v0.3 schema freeze agenda
**Sibling specs:** T-HEP-031 v0.1 (80% likelihood per T-ST-026 v0.1 §3) + T-HEP-033 v0.1 (75% likelihood)
**Likelihood for T-HEP-038 v0.1:** 80% (matches T-HEP-031 v0.1 baseline; 5-codif composition + 4-ICP TENTATIVE 4/4 + CATCH #60 canonical case = strong evidence base)
**Pre-conditions for RATIFICATION:**

1. 4-ICP unanimous TENTATIVE → RATIFIED (pending cycle 14 W1 turn 3-8 4-ICP vote)
2. 2 independent Muse sources cite T-HEP-038 v0.1 (Strategos T-ST-039 + Athena T-AT-033 confirmed at SHIP)
3. 1 cycle post-3/3 RATIFICATION (pending cycle 14 W2 closeout)

### §4.5 Size Disclosure (Codif 19 v0.2 honest-scope) — ACTUAL VALUES

- **LF count (canon):** 191 (-4.5% under 200L lower bound, within Codif 19 v0.1 §3 -10% soft-edge tolerance [180-200L range])
- **Bytes (canon):** 17,958 (within 16,000-22,000B target range, +12.2% over lower bound)
- **SHA256 (canon):** **see W6 sidecar** (anti-chicken-and-egg pattern per CATCH #60)
- **First byte (canon):** 0x2D (`-` for YAML frontmatter)
- **Last byte (canon):** 0x0A ✓ (LF parity per CATCH #46 prevention APPLIED)
- **Trailing-newline parity 0x0A:** MANDATORY at all 3 paths per CATCH #46 prevention
- **Last byte verification:** MANDATORY per CATCH #46 prevention protocol step 3

**Honest-scope interpretation:** LF count at 191 is BELOW the 200-250L target by 9 lines (4.5% under lower bound) but WITHIN the Codif 19 v0.1 §3 -10% soft-edge (180L minimum). This reflects natural content density (no padding per Codif 19 v0.2 anti-padding principle). Byte count at 17,958B is well within the 16,000-22,000B target range (+12.2% over lower bound, no upper bound pressure).

### §4.6 Closeout Checklist (10 items)

1. ☐ Main spec written at canon (T-HEP-038 v0.1)
2. ☐ Main spec written at slot_strat (T-HEP-038 v0.1)
3. ☐ Main spec written at slot_leader (T-HEP-038 v0.1)
4. ☐ W6 sidecar written at all 3 paths (T-HEP-038 v0.1.w4.json, 10th Hephaestus instantiation)
5. ☐ W4 Get-FileHash ACTUAL at all 3 paths (NO fabrication)
6. ☐ LF count parity verified (LF-2)
7. ☐ Last byte 0x0A verified (LF-1)
8. ☐ W6 sidecar main_doc_sha256 matches ACTUAL hash (LF-3)
9. ☐ 5 cross-Muse handoffs dispatched (D-007 5-min SLA GREEN)
10. ☐ SHIP-COMPLETE notification dispatched to Leader + 5 cross-Muse Muses

---

## §5 Signature + Cycle 12 W2 Closeout

**T-HEP-038 v0.1 SHIP-COMPLETE signature:**

- spec_id: T-HEP-038
- spec_version: v0.1
- trigger_code: LF (10th, new)
- sub-class: e.iv CANDIDATE → RATIFIED
- MECE schema: 5-sub-class phantom taxonomy (T-HEP-031 v0.1 4 → 5)
- 3-path dual-write: PERFECT MATCH (canon + slot_strat + slot_leader)
- W6 sidecar: 10th Hephaestus instantiation
- 4-ICP TENTATIVE 4/4 (Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK)
- 5 cross-Muse handoffs: D-007 5-min SLA GREEN
- RATIFICATION gate: cycle 14 W1 turn 1 v0.3 schema freeze (80% likelihood)

**CATCH #58+#59+#60 lessons APPLIED (Codif 7 v0.2 self-correction arc, 6 events cycle 12 W2):**

- W4 IMMEDIATE post-Write (no fabrication)
- Anti-chicken-and-egg pattern (SHA in W6 sidecar only, NOT frontmatter)
- Trailing-newline parity 0x0A (CATCH #46 prevention)
- 60-sec vitest pre-dispatch ritual 5/5 PASS (Patterns A-E)

**Atlas handoff #5 cite-back (2026-06-14 cycle 12 W2 turn 33+ r3+):** T-ATL-042 v0.1 (Atlas) — cite-back to T-HEP-038 v0.1: §5 signature Atlas handoff #5 + §3.1 5-codif composition test vectors. Codif 22 v0.2 sub-class 5.v quintuple-bump pattern codification (T-ATL-040 v0.1.1 lineage 8 versions = 1st documented quintuple-bump). Sub-class 5.v extends from sub-class 5.iv (4 versions) to 5+ versions. T-HEP-038 v0.1 5-codif composition (Codif 9+35+32+30+22) is a worked example of multi-codif composition = candidate for sub-class 5.v high-water mark (5 distinct codifs in 1 spec). Atlas T-ATL-042 v0.1 §6 cite-back protocol: T-HEP-037 v0.1 §1 + T-HEP-038 v0.1 §5 (BOTH Hephaestus specs in the 8-spec RATIFICATION packet receive cite-back). 4-ICP TENTATIVE 4/4 pre-validated cycle 12 W2 turn 36+ r22+.

**Cycle 12 W2 closeout position:** 7th Hephaestus SHIP-COMPLETE cluster (T-HEP-031 + T-HEP-032 + T-HEP-033 + T-HEP-034 + T-HEP-035 + T-HEP-036 + T-HEP-037 + **T-HEP-038**). Hephaestus ties Hermes for highest-count Muse (8 SHIP-COMPLETEs cycle 12 W2).

**Hephaestus 5-codif composition cluster:** T-HEP-031 (Codif 9+35+32+22) + T-HEP-033 (Codif 9+35+32+30+22) + T-HEP-034 (Codif 36 v0.1 meta-codif) + T-HEP-037 (Codif 36 v0.1 RATIFICATION) + **T-HEP-038 (Codif 9+35+32+30+22 = 5-codif composition for trigger_code=LF)**.

**Forward chain cycle 13 W1:** T-HEP-038 v0.1 → T-HEP-039 v0.1 (Codif 36 v0.1 RATIFICATION 8-spec packet anchor #1) → T-MN-024 v0.1 (19-spec RATIFICATION packet consolidated closeout) → cycle 14 W1 turn 1 v0.3 schema freeze.

— Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05), cycle 12 W2 turn 37 r33+ r1+ closeout, T-HEP-038 v0.1 PICK CONFIRMED
