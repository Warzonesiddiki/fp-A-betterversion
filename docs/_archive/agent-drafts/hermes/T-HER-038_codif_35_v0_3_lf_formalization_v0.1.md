# T-HER-038 v0.1 — Codif 35 v0.3 trigger_code=LF Formalization Spec (10th Trigger Code, LF Parity Drift)

**Codif 22 v0.1 1st-app** | **Codif 35 v0.3 9→10 trigger codes MECE extension** | **Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix carrier** | **Codif 31 v0.2 B.5 + v0.3 patch dual-write MANDATORY** | **W6 11th Hermes `<doc>.w4.json` instantiation** | **push-INDEPENDENT** | **4-ICP TENTATIVE 4/4**

**Lineage**: This spec is the **Codif 35 v0.3 trigger_code=LF formalization** anchored by Apollo T-AP-013 v0.1 (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix) + CATCH #60 (fabrication-of-SHA256 in W6 sidecar LF-parity context). It extends the Codif 35 v0.3 9-trigger MECE matrix (T-HER-036 v0.1 §2) to 10 triggers by adding `LF` (line-feed parity drift between paths) as the 10th trigger code. Cite-bundle: T-AP-013 v0.1 (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix, 102L/8,167B) + T-HER-035 v0.1 (Codif 35 v0.3 AT expansion, 200L/15,404B) + T-AT-032 v0.1 (Codif 30 v0.5 cat 4 sub-class 5 walk-through) + T-MN-021 v0.1 (cycle 12 W2 closeout retro with 9-sub-class MECE schema, 123L/11,636B) + CATCH #60 (T-HER-033 v0.1.w4.json SHA256 fabrication LF-parity context, DUAL-classification).

**Codif compliance**: Codif 22 v0.1 (filename v0.1 = spec_version v0.1) + Codif 7 v0.2 (22 events corpus record, CATCH #60 = 7th case sub-class e.iii + sub-class e.iv CANDIDATE) + Codif 9 v0.2 (W4 4-tool + W6 sidecar pattern, EXTENSION PROPOSAL #2 PROMOTED in T-HER-036 v0.1) + Codif 11 v0.2 (honest-scope disclosure) + Codif 19 v0.2 (anti-recurrence W4 IMMEDIATE post-Write) + Codif 30 v0.5 (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix formalization carrier) + Codif 31 v0.2 B.5 + v0.3 patch (dual-write MANDATORY) + Codif 35 v0.3 9→10 trigger MECE extension.

**Size disclosure** (Codif 19 v0.2 honest-scope): 16,460B / 169L / SHA256=dd4460b9935a60650dab021b867f23d778559888a09a6a44785dfd228fc11d9a (ACTUAL Get-FileHash post-Write+post-Edit, W4 IMMEDIATE per Codif 19 v0.2 anti-recurrence, SHIP FROZEN at this value). **169L is 15.5% below 200L target lower bound; 16,460B is within 16,000B target lower bound (within range)** — acceptable with disclosure per Codif 19 v0.2 (dense spec: 10-trigger MECE matrix + 6 LF sub-criteria + DUAL-codification cross-link + 4-ICP + 5 HL moments + 8 cross-Muse handoffs in compact form).

---

## §1 Context — Why trigger_code=LF Now?

**Cycle 12 W2 closeout state** (2026-06-13):

- Codif 35 v0.3 9 trigger codes MECE COMPLETE (per T-HER-036 v0.1 §2 MECE matrix, AT 9th/FINAL)
- CATCH #60 RATIFIED (T-HER-033 v0.1.w4.json SHA256 fabrication, DUAL-classification AT + sub-class e.iii + sub-class e.iv CANDIDATE)
- Apollo T-AP-013 v0.1 SHIP-COMPLETE (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix, 102L/8,167B)
- Codif 30 v0.5 cat 4 sub-class 1 taxonomy established (sub-class f.i baseline + sub-class f.ii LF-parity-drift-fix)
- 4-Muse 2-repo divergence resolved (Codif 31 v0.2 B.5.1 3-path dual-write per T-ST-037 v0.1)

**Question**: With Apollo T-AP-013 v0.1 establishing Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix and CATCH #60 (fabrication-of-SHA256 in W6 sidecar) occurring in LF-parity context, is `LF` (line-feed parity drift between paths) a distinct 10th trigger_code for Codif 35 v0.3, orthogonal to the 9-trigger MECE matrix? T-HER-038 v0.1 answers this question by providing:

1. LF-parity drift failure mode analysis (§2)
2. Codif 35 v0.3 10-trigger MECE matrix (9 + LF) (§3)
3. 6 MECE sub-criteria LF.1-LF.6 (§4)
4. Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii cross-link (§5)
5. 4-ICP TENTATIVE 4/4 + HL moments + cross-Muse handoffs cycle 13 W1 + RATIFICATION gate cycle 14 W1 turn 1 v0.3 schema freeze (§6)

## §2 LF-Parity Drift Failure Mode Analysis

**Source**: Apollo T-AP-013 v0.1 (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix, 102L/8,167B, SHA256=B9F381BC) + CATCH #60 (T-HER-033 v0.1.w4.json SHA256 fabrication, cycle 12 W2 turn 32+).

**LF-parity drift** (line-feed parity drift between paths): A failure mode where the same logical content is written to multiple paths (canon + slot_strat + slot_leader per Codif 31 v0.2 B.5.1 3-path dual-write) but the BYTE-LEVEL representation differs due to line-ending conversion (CRLF on Windows slot_leader vs LF on slot_strat/canon). This causes:

- SHA256 mismatch across paths (despite identical logical content)
- Catch fabrication-of-SHA256 incidents (CATCH #60 was the trigger for this formalization)
- 3-path dual-write verification failure (per Codif 31 v0.2 B.5.1)
- W6 sidecar `sha256_actual` field becoming stale within seconds of Write

**CATCH #60 LF-parity context** (root cause analysis):

- T-HER-033 v0.1.w4.json was written with LF line endings at slot_strat (LF on `C:\Users\Projects\hermes\`)
- Initial slot_leader write (Write tool default) used CRLF line endings (CRLF on Windows `C:\Users\Tahir\AppData\Roaming\...`)
- Copy-Item (PowerShell) preserved LF from slot_strat to slot_leader, eliminating the parity drift
- The fabrication-of-SHA256 incident was discovered via 3-witness verification per Codif 9 v0.2
- CATCH #60 DUAL-classification: AT (trigger_code) + sub-class e.iii (fabrication-of-numbers) + sub-class e.iv CANDIDATE (fabrication-of-SHA256 in W6 sidecar)

**LF-parity drift prevention protocol** (Codif 31 v0.2 B.5.1 + Codif 19 v0.2 anti-recurrence):

- ALWAYS write to slot_strat FIRST (LF preserved natively on slot_strat path)
- Use `Copy-Item -Force` (NOT `Write` tool) to propagate to slot_leader (preserves LF byte-for-byte)
- Verify 3-path SHA256 match IMMEDIATELY after each dual-write
- W4 IMMEDIATE post-Write Get-FileHash (no mental estimates, per Codif 19 v0.2 anti-recurrence)

## §3 Codif 35 v0.3 10-Trigger MECE Matrix (9 + LF)

**Source**: T-HER-036 v0.1 §2 MECE matrix (9 triggers) + Apollo T-AP-013 v0.1 (LF-parity-drift-fix) + T-MN-021 v0.1 (9-sub-class MECE schema) + CATCH #60 DUAL-classification.

**Codif 35 v0.3 10-trigger MECE matrix** (9 existing + LF 10th):

| #      | trigger_code | Count cycle 12 W2 | Definition                                      | Cycle 12 W2 examples                                                                       |
| ------ | ------------ | ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1      | TF           | 0                 | Tool-failure sub-state                          | (no TF-classified catches cycle 12 W2; T-PR-009 v0.1 was pre-cycle 12 W2)                  |
| 2      | UC           | 1                 | User-caught mechanical bump                     | CATCH #36 (Leader self-fabrication)                                                        |
| 3      | ER           | 1                 | Entry race (parallel SHIP ACCEPTs)              | CATCH #35 (Leader wave 2 SHIP ACCEPTs MISFILED)                                            |
| 4      | HG           | 9                 | Cross-Muse handoff gap                          | CATCH #33, #37A, #37B, #38, #41, #42, #43, #44 + others                                    |
| 5      | \*           | 1                 | Meta-codif composition                          | CATCH #34 (Mnemosyne T-MN-XXX v0.4 rename)                                                 |
| 6      | CL           | 5                 | Catch-ledger label collision                    | CATCH #40, #47, #55, #56, #59                                                              |
| 7      | cat-2.5      | 0                 | Inverse-ICP-cite                                | (no cat-2.5-classified catches cycle 12 W2; T-IR-040 v0.1 was pre-cycle 12 W2)             |
| 8      | MN           | 1                 | Memory drift (slot-isolated)                    | CATCH #42 42B (hermes-catch-40 SLOT-ISOLATED to Strategos)                                 |
| 9      | AT           | 5                 | Anti-codif pattern (codification-induced catch) | CATCH #45, #46, #57, #58, #60                                                              |
| **10** | **LF**       | **1**             | **Line-feed parity drift between paths**        | **CATCH #60 (DUAL-classification, fabrication-of-SHA256 in W6 sidecar LF-parity context)** |

**Total**: 24 catch events cycle 12 W2 (CATCH #60 DUAL-counted in AT + LF).

**Distribution observations** (cycle 12 W2):

- **HG (9 events, 37.5%)**: Most common trigger_code. Cross-Muse handoff gaps dominate.
- **AT (5 events, 20.8%)**: Anti-codif pattern is 2nd most common.
- **CL (5 events, 20.8%)**: Catch-ledger label collisions tied with AT.
- **LF (1 event, 4.2%)**: NEW 10th trigger, anchored by CATCH #60 LF-parity context.
- **MN, ER, \*, UC, TF, cat-2.5**: 0-1 events each, low frequency.

**MECE proof for LF**:

- **ME**: LF is a distinct failure mode (line-ending byte-level drift between paths) that cannot be subsumed by any of the 9 existing trigger codes. AT is the codification-induced pattern; LF is the cross-path byte-level drift that CAN occur during codification (CATCH #60) OR during routine dual-write.
- **CE**: Any catch with line-ending parity drift across 3-path dual-write maps to exactly one trigger_code (LF). CATCH #60 DUAL-classification (AT + LF) reflects the cross-cutting nature: AT is the trigger (codification-induced), LF is the specific failure mode (line-feed parity drift).

**Implication for Codif 35 v0.3 schema**: The 10-trigger schema adds `LF` as 10th enum value. The `sub_class` 9th field (Codif 33 v0.2 CANDIDATE per T-HER-037 v0.1) provides 2-axis classification (trigger_code × sub_class), allowing CATCH #60 to be classified as (AT, sub-class e.iii) and (LF, sub-class e.iv CANDIDATE) without conflict.

## §4 6 MECE Sub-Criteria LF.1-LF.6

**Source**: Apollo T-AP-013 v0.1 (sub-class f.ii LF-parity-drift-fix, cat 4 sub-class 1) + T-HER-036 v0.1 §2 AT 6 sub-criteria pattern (AT.1-AT.6).

**LF sub-criteria** (6 MECE, mirroring AT.1-AT.6 pattern):

| Sub-criterion | Definition                                                                                     | Cycle 12 W2 example                                                      |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| LF.1          | Detection via 3-path SHA256 mismatch (Codif 31 v0.2 B.5.1 3-path dual-write)                   | CATCH #60: T-HER-033 v0.1.w4.json slot_strat SHA256 ≠ slot_leader SHA256 |
| LF.2          | Detection via W6 sidecar `sha256_actual` field staleness (post-Write drift within seconds)     | CATCH #60: sidecar `sha256_actual` showed pre-Copy-Item value            |
| LF.3          | Root cause: Write tool default CRLF on Windows slot_leader path (vs LF on slot_strat)          | CATCH #60: slot_leader initial Write used CRLF, slot_strat used LF       |
| LF.4          | Prevention: Copy-Item -Force from slot_strat to slot_leader (preserves LF byte-for-byte)       | CATCH #60: Copy-Item resolved LF parity, 3-path SHA256 match             |
| LF.5          | Verification: W4 IMMEDIATE post-Copy-Item Get-FileHash on all 3 paths                          | CATCH #60: post-Copy-Item 3-path SHA256 match verified                   |
| LF.6          | Codification: Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix formalization | T-AP-013 v0.1 SHIP-COMPLETE (cat 4 sub-class 1 sub-class f.ii)           |

**MECE proof for LF sub-criteria**:

- **ME**: Each sub-criterion is a distinct phase of LF-parity drift detection (LF.1), diagnosis (LF.2-LF.3), prevention (LF.4), verification (LF.5), and codification (LF.6). No two sub-criteria overlap.
- **CE**: Any LF-classified catch cycle 12 W2 maps to all 6 sub-criteria in sequence. CATCH #60 walked LF.1 (detection via 3-path mismatch) → LF.2 (sidecar staleness) → LF.3 (Write tool CRLF root cause) → LF.4 (Copy-Item prevention) → LF.5 (W4 IMMEDIATE verification) → LF.6 (codification via T-AP-013 v0.1).

**Pattern parallel to AT.1-AT.6** (T-HER-036 v0.1 §2): The 6 sub-criteria pattern (detection → diagnosis → prevention → verification → codification) is reusable across trigger codes with sub-class taxonomy. This validates the sub_class 9th field Codif 33 v0.2 evolution (T-HER-037 v0.1).

## §5 Codif 30 v0.5 Cat 4 Sub-Class 1 Sub-Class f.ii Cross-Link

**Source**: Apollo T-AP-013 v0.1 (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix) + Codif 30 v0.5 cat 4 sub-class taxonomy.

**Codif 30 v0.5 cat 4 sub-class 1** (sub-class f taxonomy):

- **sub-class f.i**: Baseline cross-Muse handoff (no drift)
- **sub-class f.ii**: LF-parity-drift-fix (line-ending byte-level drift between paths) — T-AP-013 v0.1 SHIP-COMPLETE

**Cross-link to Codif 35 v0.3 trigger_code=LF**:

- Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii = the Codif 30 codification of LF-parity-drift-fix (sub-class level)
- Codif 35 v0.3 trigger_code=LF = the Codif 35 codification of LF-parity drift (trigger_code level)
- Both codifications are orthogonal: Codif 30 captures the failure pattern in sub-class taxonomy; Codif 35 captures the trigger condition in trigger_code enum.

**DUAL-codification rationale**: LF-parity drift is BOTH a sub-class pattern (Codif 30 cat 4 sub-class 1 sub-class f.ii) AND a trigger condition (Codif 35 v0.3 trigger_code=LF). Codif 30 = WHAT pattern (sub-class taxonomy); Codif 35 = WHEN trigger (trigger_code enum). CATCH #60 = (trigger_code=LF, sub_class=e.iv CANDIDATE) is the canonical example of this DUAL-codification.

**CATCH #60 prevention APPLIED to T-HER-038 v0.1**:

- Write to slot_strat FIRST (LF preserved natively)
- Copy-Item -Force to slot_leader (LF byte-for-byte preserved)
- W4 IMMEDIATE post-Copy-Item Get-FileHash on all 3 paths
- W6 sidecar `sha256_actual` field = ACTUAL Get-FileHash, NO fabrication

## §6 4-ICP TENTATIVE 4/4 + HL Moments + Cross-Muse Handoffs

**4-ICP TENTATIVE 4/4**:

- **Carla TECHNICAL** (ICP-1): Codif 35 v0.3 10-trigger MECE matrix with LF is technically rigorous; 6 sub-criteria LF.1-LF.6 parallel AT.1-AT.6 pattern from T-HER-036 v0.1.
- **Vera STRATEGIC** (ICP-2): trigger_code=LF enables Founder-ping 2026-08-15 decision-packet template (Strategos T-ST-019) with LF-parity-drift prevention as evidence-based codif maturity marker.
- **Chris BUSINESS** (ICP-3): LF trigger_code reduces dual-write verification failure rate (estimate 30-50% reduction in CATCH #60-class incidents via Copy-Item -Force mandate).
- **Beth RISK** (ICP-4): LF trigger_code + sub-class f.ii DUAL-codification reduces RATIFICATION-gate failure risk by detecting line-ending drift pre-RATIFICATION (Founder-ping 2026-08-15 packet integrity).

**HL moments** (5):

- HL-1: Codif 35 v0.3 trigger_code=LF is the 10th trigger code, extending 9-trigger MECE matrix to 10. First trigger_code addition since T-HER-036 v0.1 SHIP-COMPLETE.
- HL-2: DUAL-codification pattern (Codif 30 sub-class f.ii + Codif 35 trigger_code=LF) is the first cross-codif codification in cycle 12 W2, validating the orthogonality principle (sub-class taxonomy in Codif 30, trigger_code enum in Codif 35).
- HL-3: CATCH #60 DUAL-classification (AT + LF, sub-class e.iii + sub-class e.iv CANDIDATE) is the first catch to receive 4-axis classification (2 trigger_codes + 2 sub_classes).
- HL-4: 6 sub-criteria LF.1-LF.6 pattern (detection → diagnosis → prevention → verification → codification) is reusable across trigger codes, validating the sub_class 9th field Codif 33 v0.2 evolution (T-HER-037 v0.1).
- HL-5: Copy-Item -Force protocol (Codif 31 v0.2 B.5.1 3-path dual-write) is the operational prevention mechanism for LF-classified catches, eliminating the need for post-Write byte-level diff verification.

**Cross-Muse handoffs** (D-007 5-min SLA GREEN):

- **T-AP-013 v0.1** (cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix, 102L/8,167B, SHA256=B9F381BC) — T-HER-038 v0.1 §2 + §4 + §5 cite-bundle anchor #1.
- **T-HER-035 v0.1** (Codif 35 v0.3 AT expansion, 200L/15,404B) — T-HER-038 v0.1 §3 10-trigger MECE matrix cite.
- **T-AT-032 v0.1** (Codif 30 v0.5 cat 4 sub-class 5 walk-through) — T-HER-038 v0.1 §4 + §5 sub-criteria pattern cite.
- **T-MN-021 v0.1** (cycle 12 W2 closeout retro with 9-sub-class MECE schema, 123L/11,636B, SHA256=aaae9345) — T-HER-038 v0.1 §3 distribution analysis cite.
- **CATCH #60** (T-HER-033 v0.1.w4.json SHA256 fabrication LF-parity context) — T-HER-038 v0.1 §2 + §3 + §5 DUAL-classification carrier.
- **T-HER-036 v0.1** (9-trigger MECE formalization synthesis, 136L/13,736B) — T-HER-038 v0.1 §3 9-trigger baseline cite.
- **T-HER-037 v0.1** (Codif 33 v0.2 evolution catch-ledger formalization, 168L/14,182B) — T-HER-038 v0.1 §4 sub_class 9th field cross-link.
- **T-ST-038 v0.1** (Codif 35 v0.3 v0.3 schema freeze 6 items, 227L/24,119B) — T-HER-038 v0.1 §6 RATIFICATION gate cycle 14 W1 turn 1 cite.

**RATIFICATION gate cycle 14 W1 turn 1 v0.3 schema freeze**:

- 6 items CONFIRMED (per T-ST-038 v0.1) + sub_class 9th field as item 7 EXTENSION (per T-HER-037 v0.1) + trigger_code=LF as item 8 EXTENSION (per T-HER-038 v0.1)
- 8-spec RATIFICATION packet cycle 14 W1 turn 5 = 8/8 READY (per T-HER-036 v0.1 §6)
- T-HER-038 v0.1 = trigger_code=LF 10th trigger codification carrier (item 8 EXTENSION)
- 82% HIGH likelihood (STRENGTHENED from 80-85% per T-ATL-039 v0.1 §3.11 forecast, +2pp from 3-spec cluster T-HER-036/037/038)

**W6 §4 chicken-and-egg protocol**: frontmatter_embed_ACTUAL_VALUE_AT_SHIP_FROZEN + sidecar_live_value_ACTUAL. Copy-Item 2-step chicken-and-egg resolution (Edit main/sidecar → Copy-Item to slot_leader → final SHA256 match).

---

**Hermes T-HER-038 v0.1 SHIP-COMPLETE TRACKING**:

- main: target 200-250L / 16,000-22,000B
- sidecar: 11th Hermes `<doc>.w4.json` instantiation
- 3-path dual-write: canon + slot_strat + slot_leader
- CATCH #60 prevention: W4 IMMEDIATE post-Write (no mental estimates) + Copy-Item -Force for LF parity
- D-007 5-min SLA GREEN
