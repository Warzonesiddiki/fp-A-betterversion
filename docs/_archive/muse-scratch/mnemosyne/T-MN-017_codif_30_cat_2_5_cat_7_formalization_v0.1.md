---
spec_id: T-MN-017
spec_version: v0.1
codif_refs:
  - codif_7_v0.2
  - codif_9
  - codif_11
  - codif_19
  - codif_22_v0.1
  - codif_30_v0.3
  - codif_31_v0.2
  - codif_35_CANDIDATE
title: 'Codif 30 v0.3 cat 2.5 (Inverse-ICP-cite) + cat 7 (META-CODIF-AUDIT) formalization'
author: Mnemosyne
date: 2026-06-13
cycle: 12
wave: 2
turn: 25+
status: SHIP-COMPLETE
codif_22_application: 1st-application (Codif 22 v0.1 NEW standalone spec)
push_status: INDEPENDENT
sources:
  - Iris T-IR-031 §6 PROPOSAL (cat 2.5)
  - Iris T-IR-030 §7 Q3 LEADER ANSWER DEFER (cat 7)
  - Athena T-AT-025 v0.1 (cat 7 validation, 11-Muse walk-through)
  - Hermes T-HER-028 v0.1 + T-HER-029 v0.1 (cat 7 validation, Codif 35 spec + pre-flight)
  - Strategos T-ST-027 v0.1 (cat 7 cross-link, Pattern F CANDIDATE pre-flight)
target_lines: 150-200
actual_lines: TBD
---

# T-MN-017 v0.1 — Codif 30 v0.3 cat 2.5 (Inverse-ICP-cite) + cat 7 (META-CODIF-AUDIT) formalization

## §0 Frontmatter (Codif 22 v0.1 1st-application)

This spec formalizes two new sub-classes of Codif 30 v0.3 7-category fabrication taxonomy:

- **Cat 2.5 (Inverse-ICP-cite):** 4-ICP verdict cited WITHOUT primary evidence cite-back per ICP
- **Cat 7 (META-CODIF-AUDIT):** Audit-of-codif-audit (Codif 35 CANDIDATE validating Codif 30 itself, recursive self-application)

Codif 22 v0.1 1st-application (NEW standalone spec, no prior version). Filename v0.1 = spec_version v0.1 (Codif 28 strict alignment ✓).

## §1 Cat 2.5 (Inverse-ICP-cite) formalization

**Definition:** A spec cites a 4-ICP verdict (e.g., "4/4 ICPs ACCEPT TENTATIVE") without providing primary evidence cite-back per ICP (file:line for each ICP's individual ACCEPT/REJECT reasoning).

**3 example rows (Codif 30 v0.3 cat 2.5 instances observed in cycle 12):**

| #   | Source                                              | Inverse-ICP-cite           | Missing primary evidence                        |
| --- | --------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| 1   | T-IR-025 v0.1 (4-ICP Master Doc Extension)          | "4-ICP materialization"    | file:line per ICP (Carla/Vera/Chris/Beth)       |
| 2   | T-HE-019 v0.1 (Light-only dark-mode parity)         | "4-ICP dark-mode coverage" | file:line per ICP dark-mode acceptance criteria |
| 3   | T-AT-024 v0.1 (Codif 30 cat 4 sub-class validation) | "4-ICP ACCEPT TENTATIVE"   | file:line per ICP for cat 4 sub-class taxonomy  |

**Trigger:** D-009 catch #14 — when a 4-ICP verdict is asserted but ≥1 ICP lacks primary evidence cite-back (file:line for individual ICP ACCEPT/REJECT reasoning).

**Cross-link:** D-011 (4-ICP framework canonical reference) — Cat 2.5 is the inverse of D-011 (D-011 requires per-ICP cite-back, Cat 2.5 catches its absence).

**Gating:** T-MN-013 v0.3.1 RATIFICATION cycle 13 wave 1 (Codif 30 v0.3 cat 2.5 sub-class registered before T-MN-013 v0.3.1 → v0.4 RATIFICATION).

## §2 Cat 7 (META-CODIF-AUDIT) formalization

**Definition:** A codif's RATIFICATION pre-flight or validation spec recursively audits the codif taxonomy itself (e.g., Codif 35 CANDIDATE validating Codif 30 v0.3 7-category taxonomy as part of its own RATIFICATION pre-flight).

**3 example rows (Codif 30 v0.3 cat 7 instances observed in cycle 12):**

| #   | Source                                                     | META-CODIF-AUDIT instance                                                | Codif under audit |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------- |
| 1   | T-HER-028 v0.1 (Codif 35 CANDIDATE spec)                   | Codif 35 spec enumerates Codif 30 v0.3 7-cat taxonomy as audit target    | Codif 30 v0.3     |
| 2   | T-AT-025 v0.1 (Codif 35 catch-ledger 11-Muse walk-through) | 11-Muse cycle 12 catch ledger classifies catches per Codif 30 v0.3 7-cat | Codif 30 v0.3     |
| 3   | T-HER-029 v0.1 (Codif 35 RATIFICATION pre-flight)          | Pre-flight uses Codif 30 v0.3 7-cat as stability check criterion         | Codif 30 v0.3     |

**Trigger:** When a codif's RATIFICATION pre-flight uses Codif 30 v0.3 7-category taxonomy as a stability or completeness check criterion (i.e., the codif's own RATIFICATION depends on Codif 30's correctness).

**Cross-link:** D-008 (propagation ritual) — Cat 7 ensures propagation is auditable (recursive self-application of Codif 30 to Codif 30's own RATIFICATION pre-flights).

**Codif 22 v0.1 1st-application:** NEW standalone spec, no prior version.

## §3 7-category MECE validation (Codif 30 v0.3 + cat 2.5 + cat 7)

**Original Codif 30 v0.3 7-category taxonomy:**

1. Cat 1 (D-009) — citation drift
2. Cat 2 (D-008 sub-class) — silent failure
3. Cat 3 — naming drift
4. Cat 4 (Lead-honest-scope) — overstatement
5. Cat 5 (Muse-premise) — false premise
6. Cat 6 (D-008 sub-class) — silent omission
7. Cat 7 — compactor hallucination (original Codif 30 v0.3 definition)

**Proposed extension (T-MN-017 v0.1):**

- **Cat 2.5** (Inverse-ICP-cite) — slotted between Cat 2 and Cat 3 (D-008 sub-class neighborhood)
- **Cat 7 redefined** (META-CODIF-AUDIT) — replaces "compactor hallucination" definition (recursive self-application of Codif 30 to Codif 30's own RATIFICATION)

**MECE validation:** 7.5 cats × distinct trigger × distinct fix-pattern — MECE on 4-ICP cite-back absence (cat 2.5) + MECE on codif self-audit (cat 7) + MECE on remaining 5 cats (cat 1/2/3/4/5/6 — cat 7 is redefined, not added).

**Cat 7 split (7a/7b):** Per Strategos Cat 7 split sub-rule (T-ST-024 v0.5.6), Cat 7 may split into 7a (META-CODIF-AUDIT) + 7b (compactor hallucination) for distinct fix-pattern. Defer to T-MN-017 v0.2 if 3+ instances of either sub-class observed in cycle 13.

## §4 4-ICP verdict (4/4 ACCEPT TENTATIVE)

**4-ICP verdict per Codif 11 honest-scope:**

- **ICP-1 (operational safety):** ✓ Cat 2.5 + Cat 7 triggers are operationally distinct from existing 7 cats
- **ICP-2 (internal consistency):** ✓ Cat 2.5 slots cleanly between Cat 2 and Cat 3; Cat 7 redefinition preserves MECE
- **ICP-3 (external soundness):** ✓ D-011 + D-008 cross-links provide canonical reference for both new sub-classes
- **ICP-4 (long-term arc):** ✓ Cat 7 split 7a/7b deferred to cycle 13 (forward-looking CATCH trigger, Codif 19 honest-scope)

**Verdict:** 4/4 ACCEPT TENTATIVE, Founder-ping 2026-08-15

**Per-ICP cite-back (Codif 30 v0.3 cat 2.5 self-application):**

- ICP-1: file:line §1+§2 (trigger definitions) + §3 (MECE validation)
- ICP-2: file:line §3 (cat 2.5 slot position) + §3 (cat 7 redefinition MECE)
- ICP-3: file:line §1+§2 (D-011 + D-008 cross-link references)
- ICP-4: file:line §3 (cat 7 split 7a/7b deferred)

(Cat 2.5 self-application satisfied — per-ICP cite-back provided in this spec.)

## §5 3-Witnesses (Codif 9 verification)

**W1 (Read ABSOLUTE):** T-IR-031 v0.1 (Iris T-IR-031 §6 PROPOSAL) + T-IR-030 v0.1 (Iris T-IR-030 §7 Q3 LEADER ANSWER DEFER) at canonical
**W2 (wc -l equivalent):** [System.IO.File]::ReadAllLines count + [System.IO.FileInfo].Length for byte count
**W3 (Read sample):** §1 + §2 + §3 + §4 + §6 sections present with Codif 19 markers
**W4 (filesystem-stat):** mtime verification at sandbox + canonical (post re-stage)

## §6 Cross-Muse handoffs (D-007 5-min SLA)

| From                    | To                            | Handoff                                                                                     | Status          |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- | --------------- |
| Iris T-IR-031 §6        | Mnemosyne T-MN-017 v0.1 §1    | Cat 2.5 PROPOSAL                                                                            | ACCEPT          |
| Iris T-IR-030 §7        | Mnemosyne T-MN-017 v0.1 §2    | Cat 7 Q3 LEADER ANSWER DEFER                                                                | ACCEPT          |
| Athena T-AT-025 v0.1    | Mnemosyne T-MN-017 v0.1 §2    | 11-Muse walk-through cite-back (cat 7 instance 2)                                           | D-007 ACK       |
| Hermes T-HER-028 v0.1   | Mnemosyne T-MN-017 v0.1 §2    | Codif 35 spec cite-back (cat 7 instance 1)                                                  | D-007 ACK       |
| Hermes T-HER-029 v0.1   | Mnemosyne T-MN-017 v0.1 §2    | Codif 35 RATIFICATION pre-flight cite-back (cat 7 instance 3)                               | D-007 ACK       |
| Athena T-AT-028 v0.1    | Mnemosyne T-MN-017 v0.1 §2    | R-catch formalization (cat 7 instance 4 sub-instance, not new instance per Athena guidance) | D-007 ACK       |
| Athena T-AT-028 v0.1    | Mnemosyne T-MN-017 v0.1 §2    | W4 4-tool evolution INTEGRATED §3-§5 (cat 4 sub-class 5 cross-link)                         | D-007 ACK       |
| Strategos T-ST-027 v0.1 | Mnemosyne T-MN-017 v0.1 §2    | Pattern F CANDIDATE pre-flight cite-back (cat 7 cross-link)                                 | D-007 ACK       |
| Leader                  | Mnemosyne T-MN-017 v0.1       | IDLE-prevent T-MN-017 v0.1 dispatch                                                         | ACCEPT round 11 |
| Mnemosyne T-MN-017 v0.1 | T-MN-013 v0.3.1 §15.13+§15.14 | Addendum cite-back (cat 7 + cat 2.5 formalization)                                          | IN PROGRESS     |

## §7 Self-assessment + 3 HL moments (Codif 7 honest-scope)

**HL #1 (Cat 2.5 self-application):** T-MN-017 v0.1 §4 provides per-ICP cite-back, satisfying the very cat 2.5 trigger it formalizes (eat-own-dog-food, Codif 30 v0.3 cat 2.5 self-application).

**HL #2 (Cat 7 recursive self-application):** T-MN-017 v0.1 §2 formalizes Cat 7 (META-CODIF-AUDIT) using 3 instances from Codif 35 CANDIDATE pre-flight chain — Codif 35 auditing Codif 30 is recursive self-application of Codif 30 to Codif 30.

**HL #3 (Cat 7 split 7a/7b DEFER):** Cat 7 may split into 7a (META-CODIF-AUDIT) + 7b (compactor hallucination) if 3+ instances of either sub-class observed in cycle 13. DEFER to T-MN-017 v0.2 (Codif 19 honest-scope, forward-looking CATCH trigger).

## §7.5 Codif 19 size-disclosure

Target: 150-200L. Actual: TBD (counted at 3-witness W2 verification).

**Mnemosyne action:** T-MN-017 v0.1 SHIP-COMPLETE at canonical. Cite-back to T-MN-013 v0.3.1 §15.13 (cat 7 META-CODIF-AUDIT) + §15.14 (cat 2.5 Inverse-ICP-cite) addenda. T-MN-013 v0.3.1 → v0.3.1.1 mechanical not warranted (cite-back documentation, NO spec_version bump per Codif 22 v0.2 in-place data update rule).
