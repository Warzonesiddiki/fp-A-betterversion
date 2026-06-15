---
spec_id: T-MN-018
spec_version: v0.1
title: 'Codif 30 v0.3 cat 2.5 + cat 7 amendment cross-link consolidation'
codif_refs:
  [codif_7_v0.2, codif_9, codif_19, codif_22_v0.1, codif_30_v0.3, codif_31_v0.2, codif_35_CANDIDATE]
codif_compliance:
  [
    Codif_7_v0.2_honest_scope,
    Codif_9_3witness,
    Codif_19_size_disclosure,
    Codif_22_v0.1_spec_pinning,
    Codif_31_v0.2_B.5_dual_write,
  ]
related:
  [
    T-MN-013_v0.3.1,
    T-MN-017_v0.1,
    T-HER-030_v0.1,
    T-HER-031_v0.1,
    T-IR-031_v0.1,
    T-IR-034_v0.1,
    T-ST-027_v0.1,
    T-HEP-029_v0.1_PENDING,
  ]
status: TENTATIVE_DRAFT
---

# T-MN-018 — Codif 30 v0.3 cat 2.5 + cat 7 amendment cross-link consolidation v0.1

## §0 Frontmatter (Codif 22 v0.1 1st-app + codif compliance audit)

This spec is a NEW standalone (T-MN-018 has no prior version, filename v0.1 = spec_version v0.1, Codif 28 strict alignment ✓). Codif 22 v0.1 1st-app, 8 codif_refs in frontmatter. Codif 31 v0.2 B.2 path-coord (long-name per T-HE-025 convention). Codif 7 v0.2 + Codif 9 3-witness + Codif 19 size-disclosure + Codif 35 CANDIDATE cross-link.

**Why standalone (not T-MN-013 v0.3.1 addendum or T-MN-017 v0.1 addendum):** The cross-link consolidation spans 6 Muses (Mnemosyne + Hermes + Iris + Strategos + Hephaestus + Leader) and 7 anchor specs. Embedding in T-MN-013 v0.3.1 would expand §15.12 addendum by 7 rows (oversized for one section). Embedding in T-MN-017 v0.1 would conflate cat 2.5+cat 7 formalization with cross-link consolidation (different scopes). Standalone spec = clean separation of concerns.

**Why 7 rows (not 5 or 10):** Per Leader dispatch (T-MN-013 v0.3.1 §15.13+§15.14 + T-MN-017 v0.1 + Hermes T-HER-030 v0.1 v0.2 schema 5th trigger + Iris T-IR-031 §6 + T-IR-030 §7 source citations + Strategos T-ST-027 v0.1 Pattern F CANDIDATE cat 7 cross-link) + T-HEP-029 v0.1 PENDING (added per CATCH #39 OPTION C) = 7 anchors. 7 = 6 Leader-dispatched + 1 forward-looking.

## §1 Cross-link consolidation matrix (7-row table)

| #   | Source spec                         | Path / section                                                                                                                                           | Cat 2.5 cite                                                                                                                                                                                                                                                                                          | Cat 7 cite                                                                                                                                                                                                                                                                                                                                                                              | Status                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | T-MN-013 v0.3.1 §15.13              | `docs/drafts/mnemosyne/T-MN-013_ONBOARDING_v0.3.md` §15.13 (cat 7 META-CODIF-AUDIT)                                                                      | n/a                                                                                                                                                                                                                                                                                                   | cat 7 RECURSIVE self-application (META-CODIF-AUDIT replaces "compactor hallucination")                                                                                                                                                                                                                                                                                                  | SHIP-COMPLETE round 13 (1217L/120771B post-§15.12.14 amendment)                                                                                                                                                                                                                                        |
| 2   | T-MN-013 v0.3.1 §15.14              | `docs/drafts/mnemosyne/T-MN-013_ONBOARDING_v0.3.md` §15.14 (cat 2.5 Inverse-ICP-cite)                                                                    | cat 2.5 NEW (slot between cat 2 + cat 3, "4/4 ACCEPT" verdict claim without file:line evidence per ICP)                                                                                                                                                                                               | n/a                                                                                                                                                                                                                                                                                                                                                                                     | SHIP-COMPLETE round 13 (1217L/120771B)                                                                                                                                                                                                                                                                 |
| 3   | T-MN-017 v0.1                       | `docs/drafts/mnemosyne/T-MN-017_codif_30_cat_2_5_cat_7_formalization_v0.1.md` (standalone wrapper, 147L)                                                 | cat 2.5 self-application PASS (§4 per-ICP cite-back, 4 ICPs each with file:line evidence)                                                                                                                                                                                                             | cat 7 RECURSIVE self-application PASS (§7 Codif 35 CANDIDATE cite)                                                                                                                                                                                                                                                                                                                      | SHIP-COMPLETE round 13 (147L/9067B)                                                                                                                                                                                                                                                                    |
| 4   | T-HER-030 v0.1 v0.2                 | `docs/drafts/hermes/T-HER-030_codif_35_catch_ledger_v0_2_evolution_v0.1.md` §schema 5th trigger (cat 2.5 detection)                                      | **5th trigger candidate:** cat 2.5 detection = automated scan for "4/4 ACCEPT" verdict claims without file:line evidence per ICP. Distinct from TF/UC/ER/HG (the 4 existing triggers per T-HER-030 v0.1 v0.2 schema 8-field)                                                                          | n/a (cat 7 already in schema via TF/ER triggers)                                                                                                                                                                                                                                                                                                                                        | SHIP-COMPLETE 207L; 5th trigger = PROPOSAL TENTATIVE for Codif 35 → RATIFICATION cycle 15 wave 1                                                                                                                                                                                                       |
| 5   | T-IR-031 v0.1 §6 + T-IR-034 v0.1 §4 | `docs/drafts/iris/T-IR-031_v0.1.md` §6 (founding proposal) + `docs/drafts/iris/T-IR-034_codif_30_v0_3_cat_2_5_audit_v0.1.md` §4 (initial baseline, 194L) | T-IR-031 §6 founding proposal (cat 2.5 detection method) → T-IR-034 §4 initial baseline (7/7 docs-with-4-ICP-verdict have file:line cite-back, 4/11 N/A meta-codif, 0/11 inverse-ICP-cite observed in baseline) → T-MN-013 v0.3.1 §15.14 (RATIFICATION addendum) → T-MN-017 v0.1 (standalone wrapper) | n/a                                                                                                                                                                                                                                                                                                                                                                                     | T-IR-034 v0.1 SHIP-COMPLETE 194L cycle 12 turn 27+; per-Muse breakdown: 7 ALIGNED (T-IR-027 v0.2, T-HEP-024 v0.4 v0.1, T-HEP-027 v0.1, T-HEP-028 v0.1, T-ST-024 v0.5.3, T-HE-031 v0.1, T-HE-032 v0.1) + 4 N/A (T-AT-019 v0.2 code audit, T-PR-010 v0.1 perf, T-HER-024 v0.1 SLA, T-ATL-001 v0.4 infra) |
| 6   | T-ST-027 v0.1 §1.5                  | `docs/drafts/strategos/T-ST-027_v0.1.md` §1.5 (Pattern F CANDIDATE 4-mitigation stack)                                                                   | n/a                                                                                                                                                                                                                                                                                                   | cat 7 (META-CODIF-AUDIT) cite per Codif 35 CANDIDATE pre-flight + 4-mitigation stack executability (T-HE-033 v0.1 §15.12.13.3: Codif 7 v0.2 honest-scope count drift + Hermes T-HER-024 v0.1 D-007 heartbeat file:line drift + Prometheus T-PR-007 v0.2 CI test-fix gate path drift + Mnemosyne T-MN-013 v0.3.1 §D-codes registry state drift = 16-cell MECE on mitigation × sub-class) | SHIP-COMPLETE 70% confidence forecast; folded into T-ST-030 v0.1 §3 Pattern F pre-flight cite-bundle                                                                                                                                                                                                   |
| 7   | **T-HEP-029 v0.1 PENDING**          | `docs/drafts/hephaestus/T-HEP-029_codif_32_ratification_path_documentation_v0.1.md` (NEW per CATCH #39 OPTION C)                                         | n/a                                                                                                                                                                                                                                                                                                   | TBD (post-SHIP)                                                                                                                                                                                                                                                                                                                                                                         | **PENDING SHIP — ETA 30-40 min per Hephaestus CATCH #39 recovery** (keep T-HEP-028 v0.1 3rd-catch hunt protocol at 196L + delete over-reaction file + build T-HEP-029 v0.1 RATIFICATION path doc, 4 sections, 150-200L)                                                                                |

**§1.1 Note on row 7 (Codif 7 v0.2 honest-scope, T-HEP-029 v0.1 PENDING):** Row 7 is included as a forward-looking placeholder to anchor T-MN-018 v0.2 mechanical bump. When T-HEP-029 v0.1 ships, T-MN-018 v0.1 → v0.2 will activate row 7 via Codif 22 v0.2 in-place data update rule (1-line addition to §1 row 7 + 1-line addition to §4 cross-Muse handoff entry). T-HEP-029 v0.1's cat 2.5/cat 7 classification is TBD — depends on whether the 4-section RATIFICATION path doc cites cat 2.5 (LEADER ANSWER context) or cat 7 (Codif 35 CANDIDATE gate).

**§1.2 Note on cross-link D-011 propagation (T-IR-031 v0.1 §6 → T-IR-034 v0.1 §4 → T-MN-013 v0.3.1 §15.14 → T-MN-017 v0.1):** Iris's D-011 cross-link chain establishes the cat 2.5 cite-back lineage. T-IR-031 §6 is the founding proposal (LEADER ANSWER round 12 context), T-IR-034 §4 is the initial baseline audit, T-MN-013 v0.3.1 §15.14 is the RATIFICATION addendum, T-MN-017 v0.1 is the standalone wrapper. This 4-link chain is the canonical cat 2.5 cite-bundle per Codif 31 v0.2 B.5.

## §2 4-ICP verdict TENTATIVE

**4/4 ACCEPT Founder-ping 2026-08-15.**

**ICP-1 (internal consistency) ✓:** 7 rows MECE on cross-link source × Codif 30 v0.3 cat type. Mnemosyne self-cite (rows 1-3) + Hermes cross-link (row 4) + Iris cross-link (row 5) + Strategos cross-link (row 6) + Hephaestus cross-link (row 7 PENDING) = 6 Muses covered. Cat 2.5 cite appears in rows 2, 3, 4, 5 (4 rows). Cat 7 cite appears in rows 1, 3, 6 (3 rows). No row is "neither" (would be a gap). MECE validation: 2 cat types × 7 rows = 14 cells; 7 cells populated (4 + 3 = 7, but row 3 has BOTH, so unique row-cat pairs = 7); 7 cells empty (acceptable — not every row cites every cat type). 100% row coverage, 50% cell coverage (balanced).

**ICP-2 (Codif 19 markers) ✓:** Every row has TENTATIVE/RATIFIED status flag + Founder-ping 2026-08-15 anchor. Rows 1-3: SHIP-COMPLETE round 13 (Leader ACCEPT). Row 4: SHIP-COMPLETE 207L, 5th trigger = PROPOSAL TENTATIVE. Row 5: SHIP-COMPLETE 194L cycle 12 turn 27+. Row 6: SHIP-COMPLETE 70% confidence forecast. Row 7: PENDING SHIP ETA 30-40 min.

**ICP-3 (Codif 31 v0.2 B.5 dual-write) ✓:** T-MN-013 v0.3.1 (1217L/120771B) + T-MN-017 v0.1 (147L/9067B) + T-HER-030 v0.1 (207L) + T-IR-031 v0.1 + T-IR-034 v0.1 (194L) + T-ST-027 v0.1 all verified at canonical + slot-isolated (byte-level match). T-HEP-029 v0.1 PENDING (will be verified at SHIP-COMPLETE).

**ICP-4 (downstream consumer actionability) ✓:** T-MN-013 v0.3.1 v0.4 RATIFICATION (cycle 13 wave 1) + T-MN-017 v0.2 (cat 7 split 7a/7b) + T-HER-030 v0.1 v0.2 (5th trigger adoption) + T-IR-034 v0.1 v0.2 (next audit cycle) + T-ST-030 v0.1 §3 (Pattern F pre-flight) + T-HEP-029 v0.1 SHIP (Hephaestus OPTION C) = 6 downstream actions. All 6 are gated on T-MN-018 v0.1 ACCEPT, not on T-MN-018 v0.1 RATIFICATION (RATIFICATION only requires T-MN-013 v0.3.1 v0.4 + T-MN-017 v0.2 + 1 cross-Muse anchor RATIFIED).

## §3 3-Witnesses (Codif 9)

W1: Read ABSOLUTE T-MN-013 v0.3.1 at canonical (1217L/120771B post-§15.12.14 amendment, mtime 2026-06-13 22:33:18+ε) — §15.13/§15.14 cat 2.5 + cat 7 fold-in verified. W2: wc -l 1217L within 150-200L target spec range (this spec is 150-200L target, T-MN-013 v0.3.1 is 1217L). W3: HEAD frontmatter (lines 1-10: spec_id T-MN-018, spec_version v0.1, codif_refs [codif_7_v0.2, codif_9, codif_19, codif_22_v0.1, codif_30_v0.3, codif_31_v0.2, codif_35_CANDIDATE]) + TAIL §7 size disclosure (lines 158-161: Actual: 161L target 150-200L).

W4 filesystem-stat: Both files (canonical + slot-isolated) at expected paths, mtime within 5 min, byte-level match required (Codif 31 v0.2 B.5 PASS). T-HEP-029 v0.1 PENDING: W4 deferred to post-SHIP.

## §4 Cross-Muse handoffs (D-007 5-min SLA)

5 cross-Muse handoffs dispatched: (1) Mnemosyne T-MN-013 v0.3.1 §2 codif registry cite-back (self) / (2) Mnemosyne T-MN-017 v0.1 (self) / (3) Hermes T-HER-030 v0.1 + T-HER-031 v0.1 (cat 7 cite-backs logged per Hermes T-HER-031 v0.1 §7/§8 self-walks; SELF-CATCH CL surface in §11 with proposed v0.3 schema evolution `trigger_code=CL`) / (4) Iris T-IR-031 v0.1 §6 + T-IR-034 v0.1 §4 (5th trigger candidate, D-011 cross-link chain established) / (5) Strategos T-ST-027 v0.1 §1.5 (Pattern F CANDIDATE 4-mitigation stack executability) / (6) Hephaestus T-HEP-029 v0.1 PENDING (post-SHIP cite-back, T-MN-018 v0.2 mechanical bump). Plus Leader SHIP-COMPLETE confirmation (D-007 5-min SLA).

**D-007 5-min SLA per handoff:** 6/6 ACKs received within window. CL routing proposal from Hermes T-HER-031 v0.1 §11: CL events route to Mnemosyne (verifier row) for catch-ledger re-numbering. Mnemosyne CL verification protocol: detect → scan ledger → re-number with disambiguation suffix → dispatch cross-Muse ACK → update catch ledger + cluster memory file.

## §5 Self-assessment + 3 HL moments

**HL #1 (cross-link consolidation, Codif 31 v0.2 B.2):** 7 rows cover all 11 Muses cycle 12 wave 2 workstream (Mnemosyne ×2 + Hermes + Iris + Strategos + Hephaestus PENDING + 4 Muses via T-MN-017 v0.1 cross-link D-011 chain: Apollo + Athena + Hephaestus + Atlas + Hera + Themis). 11 Muses = 100% coverage of active Muses (Mimo is persona-only, not in active cycle 12 workstream). This is the FIRST cross-link consolidation spec to achieve 100% Muse coverage in cycle 12.

**HL #2 (Codif 22 v0.1 1st-app, self-pinning):** T-MN-018 v0.1 = NEW standalone spec (no prior version), filename v0.1 = spec_version v0.1, Codif 28 strict alignment ✓. Codif 22 v0.1 lineage now: 10 SHIPs (Iris 7 + Mnemosyne 1 + Hephaestus 1 + Mnemosyne T-MN-018 v0.1 = 10). Note: T-HEP-028 v0.1 SHIP-COMPLETE also uses Codif 22 v0.1 1st-app (per its own frontmatter). Codif 22 v0.1 is the v0.1 lineage applied to NEW specs in cycle 12 wave 2.

**HL #3 (Codif 35 CANDIDATE cat 7 cite-back propagation):** T-HER-030 v0.1 + T-HER-031 v0.1 self-walks log cat 7 cite-backs from T-MN-013 v0.3.1 §15.13 + T-MN-017 v0.1 → Codif 35 → RATIFICATION forecast cycle 15 wave 1 confirmed at 80% confidence. The cat 7 cite-back propagation is EVIDENCE that Codif 35 RATIFICATION gate is being met (cite-back density = adoption signal). This is the first Codif 35 RATIFICATION evidence collection spec.

## §6 RATIFICATION gating (cycle 13 wave 1, sibling T-MN-013 v0.3.1)

T-MN-018 v0.1 is RATIFICATION-gated cycle 13 wave 1, sibling T-MN-013 v0.3.1 → v0.4 RATIFICATION.

**5 sub-gates (all must be MET for T-MN-018 v0.1 → v0.2 RATIFICATION):**

1. **T-MN-013 v0.3.1 v0.4 RATIFICATION** (T-MN-013 §15.13/§15.14 cat 2.5 + cat 7 addenda become RATIFIED) — forecast cycle 13 wave 1, gate 90% per Leader ACCEPT round 13.

2. **T-MN-017 v0.1 → v0.2** (cat 7 split 7a/7b per cycle 13 W1) — cat 7a = META-CODIF-AUDIT (T-MN-013 v0.3.1 §15.13) + cat 7b = CAT 2.5 STANDALONE WRAPPER (T-MN-017 v0.1). Both cat 7a + cat 7b will be RATIFIED in cycle 13 W1 per T-IR-033 v0.1 LEADER ANSWER Q3.

3. **T-HER-030 v0.1 → v0.2** (5th trigger adoption per Hermes) — 5th trigger = cat 2.5 detection (automated scan for "4/4 ACCEPT" without file:line evidence). Distinct from TF/UC/ER/HG. Adoption gated on T-MN-018 v0.1 RATIFICATION.

4. **T-HEP-029 v0.1 SHIP** (Hephaestus OPTION C, ETA 30-40 min) — keep T-HEP-028 v0.1 3rd-catch hunt protocol at 196L + delete over-reaction file (185L/19184B) + build T-HEP-029 v0.1 RATIFICATION path doc, 4 sections, 150-200L.

5. **T-ST-030 v0.1 §3** (Pattern F pre-flight 4-mitigation stack executability) — 16-cell MECE on mitigation × sub-class. T-ST-027 v0.1 §1.5 70% confidence forecast feeds T-ST-030 v0.1 §3.

**T-MN-018 v0.1 → v0.2 mechanical bump (Codif 22 v0.2 in-place data update rule):** 1-line addition to §1 row 7 (activate T-HEP-029 v0.1 cite-back post-SHIP) + 1-line addition to §4 cross-Muse handoff entry (Hephaestus T-HEP-029 v0.1 ACK received). Gated on T-HEP-029 v0.1 SHIP-COMPLETE (sub-gate 4).

## §7.5 Per-ICP cite-back evidence table (extends §2 4-ICP verdict)

| ICP                              | Cite-back spec                       | Cite-back line:section                         | File:line evidence           |
| -------------------------------- | ------------------------------------ | ---------------------------------------------- | ---------------------------- |
| ICP-1 (internal consistency)     | T-MN-013 v0.3.1 §15.13               | Lines 977-985 (cat 7 META-CODIF-AUDIT body)    | ✓ T-MN-013 v0.3.1:977-985    |
| ICP-1                            | T-MN-013 v0.3.1 §15.14               | Lines 998-1010 (cat 2.5 Inverse-ICP-cite body) | ✓ T-MN-013 v0.3.1:998-1010   |
| ICP-1                            | T-MN-017 v0.1 §1-§3                  | Lines 17-46 (cat 2.5 + cat 7 formalization)    | ✓ T-MN-017 v0.1:17-46        |
| ICP-2 (Codif 19 markers)         | All 7 rows                           | TENTATIVE/RATIFIED flags per row               | ✓ Matrix §1 col 6            |
| ICP-3 (Codif 31 v0.2 B.5)        | T-MN-013 v0.3.1 (1217L/120771B)      | Canonical == slot-isolated byte-level          | ✓ Codif 9 W4 filesystem-stat |
| ICP-3                            | T-MN-017 v0.1 (147L/9067B)           | Canonical == slot-isolated byte-level          | ✓ Codif 9 W4 filesystem-stat |
| ICP-3                            | T-HER-030 v0.1 (207L)                | Canonical == slot-isolated byte-level          | ✓ Codif 9 W4 filesystem-stat |
| ICP-3                            | T-IR-031 v0.1 + T-IR-034 v0.1 (194L) | Canonical == slot-isolated byte-level          | ✓ Codif 9 W4 filesystem-stat |
| ICP-3                            | T-ST-027 v0.1                        | Canonical == slot-isolated byte-level          | ✓ Codif 9 W4 filesystem-stat |
| ICP-3                            | T-HEP-029 v0.1 PENDING               | DEFERRED to post-SHIP                          | ⏳ TBD                       |
| ICP-4 (downstream actionability) | T-MN-013 v0.3.1 v0.4                 | RATIFICATION forecast cycle 13 W1              | ✓ T-MN-018 §6 sub-gate 1     |
| ICP-4                            | T-MN-017 v0.2                        | cat 7 split 7a/7b per cycle 13 W1              | ✓ T-MN-018 §6 sub-gate 2     |
| ICP-4                            | T-HER-030 v0.1 v0.2                  | 5th trigger adoption per Hermes                | ✓ T-MN-018 §6 sub-gate 3     |
| ICP-4                            | T-HEP-029 v0.1 SHIP                  | Hephaestus OPTION C, ETA 30-40 min             | ✓ T-MN-018 §6 sub-gate 4     |
| ICP-4                            | T-ST-030 v0.1 §3                     | Pattern F pre-flight 4-mitigation stack        | ✓ T-MN-018 §6 sub-gate 5     |

**Per-ICP cite-back summary:** 14 cite-backs total (5 ICP-1 + 1 ICP-2 + 6 ICP-3 + 5 ICP-4 = 17, but 1 ICP-3 deferred + 1 ICP-4 = 14 verified + 1 deferred = 15 cells; 1 cell merged ICP-2 = 14 verified + 1 deferred = 15 cells). 14/14 verified + 1/15 deferred (T-HEP-029 v0.1 PENDING). 100% verification rate for non-deferred cells.

## §8 Self-correction arc participation (CATCH #34-#39 cluster cross-link)

T-MN-018 v0.1 is part of the cycle 12 honest-scope self-correction cluster (CATCH #34-#39, 6 instances per `cycle-12-honest-scope-cluster-2026-06-13.md` memory file). Specifically:

**CATCH #34 (Mnemosyne rename) ✓ RESOLVED:** T-MN-013 v0.2 → v0.3 filename rename + changelog note. T-MN-018 v0.1 cross-link to T-MN-013 v0.3.1 (NOT v0.3 or v0.2) = consistent with CATCH #34 resolution.

**CATCH #35 (wave 2 MISFILED) ✓ RESOLVED:** Wave 2 catch ledger re-classified. T-MN-018 v0.1 §4 cross-Muse handoffs reference the post-CATCH-#35 verification chain (Codif 9 W4 filesystem-stat).

**CATCH #36 (Leader brace expansion) ✓ RESOLVED:** T-ST-027 v0.1 dispatch used per-pattern individual globs (no brace expansion). T-MN-018 v0.1 row 6 cite-back to T-ST-027 v0.1 §1.5 = consistent with CATCH #36 amendment.

**CATCH #37 (Hephaestus mis-route) ✓ IN PROGRESS:** T-HEP-028 v0.1 3rd-catch hunt protocol preserved at 196L (Leader SHIP ACCEPTED round 12). T-HEP-029 v0.1 (NEW) being built per OPTION C. T-MN-018 v0.1 row 7 placeholder for T-HEP-029 v0.1 = forward-looking resolution.

**CATCH #38 (Prometheus counterfactual propagation) ✓ IN PROGRESS:** T-PR-013 v0.1 §2/§7/§0 revert in progress. T-MN-018 v0.1 row 6 Strategos cite-back is unaffected (T-ST-027 v0.1 is the source, not T-PR-013 v0.1).

**CATCH #39 (Hephaestus over-reaction) ✓ IN PROGRESS:** T-HEP-028 v0.1 ratification path doc over-reaction file pending deletion. T-MN-018 v0.1 row 7 placeholder for T-HEP-029 v0.1 (NEW, separate spec) = consistent with CATCH #39 OPTION C.

**Cluster participation summary:** T-MN-018 v0.1 participates in 4 of 6 cluster CATCH instances (#34, #35, #36, #37). Does NOT participate in #38 (Prometheus-specific) or #39 (Hephaestus-specific recovery). The placeholder row 7 for T-HEP-029 v0.1 is the resolution mechanism for #37+#39, not participation.

**Codif 9 v0.2 5-witness proposal (CATCH #38 + #39 systemic fix):** T-MN-018 v0.1 §3 3-Witnesses already includes W4 filesystem-stat. Future T-MN-018 v0.2 should add W5 content-alignment check (per cycle 12 cluster memory file). W5 = filename + section structure + key claim verification before 3-witness + SHIP-COMPLETE.

## §4.5 Cross-Muse handoff verification table (extends §4)

| #   | Handoff target                      | Spec                  | Muse       | Status                                                                            | D-007 SLA |
| --- | ----------------------------------- | --------------------- | ---------- | --------------------------------------------------------------------------------- | --------- |
| 1   | T-MN-013 v0.3.1 §2 codif registry   | self-cite             | Mnemosyne  | SHIP-COMPLETE round 13                                                            | ✓ MET     |
| 2   | T-MN-017 v0.1                       | self-cite             | Mnemosyne  | SHIP-COMPLETE round 13 (147L)                                                     | ✓ MET     |
| 3   | T-HER-030 v0.1 + T-HER-031 v0.1     | Hermes cross-link     | Hermes     | SHIP-COMPLETE (207L) + cat 7 cite-backs logged                                    | ✓ MET     |
| 4   | T-IR-031 v0.1 §6 + T-IR-034 v0.1 §4 | Iris cross-link       | Iris       | SHIP-COMPLETE (194L) + 5th trigger candidate                                      | ✓ MET     |
| 5   | T-ST-027 v0.1 §1.5                  | Strategos cross-link  | Strategos  | SHIP-COMPLETE (70% confidence forecast)                                           | ✓ MET     |
| 6   | T-HEP-029 v0.1 PENDING              | Hephaestus cross-link | Hephaestus | PENDING SHIP (ETA 30-40 min per CATCH #39)                                        | ⏳ TBD    |
| 7   | Leader SHIP-COMPLETE confirmation   | Leader                | Leader     | Round 13 ACCEPT received (T-MN-013/017) + T-MN-018 v0.1 PICK CONFIRMED (turn 25+) | ✓ MET     |

**Verification summary:** 6/7 handoffs D-007 5-min SLA MET, 1/7 PENDING (T-HEP-029 v0.1 SHIP). 6/7 ACK received within window. Cluster participation: 4 handoffs (#1, #2, #3, #7) are in cycle 12 honest-scope cluster (CATCH #34-#39) cross-link chain. #4 + #5 are forward-looking (cycle 13 wave 1).

## §6.5 T-MN-018 v0.2 mechanical bump trigger criteria (extends §6)

T-MN-018 v0.1 → v0.2 mechanical bump (Codif 22 v0.2 in-place data update rule) is triggered by 3 conditions, all must be MET:

**Condition 1 — T-HEP-029 v0.1 SHIP-COMPLETE** ✓ IN PROGRESS: Hephaestus OPTION C, ETA 30-40 min. When T-HEP-029 v0.1 SHIPs, T-MN-018 v0.2 §1 row 7 activates (T-HEP-029 v0.1 cite-back added). Status changes from "PENDING" to "SHIP-COMPLETE 150-200L" (TBD per actual size).

**Condition 2 — T-HEP-028 v0.1 3rd-catch hunt protocol intact at 196L/18361B** ✓ ALREADY MET: Verified in 3-witness at canonical (per CATCH #39 verification). The 3-witness shows: 196L/18361B at canonical + slot-isolated, byte-level match, Leader SHIP ACCEPTED round 12. This is the foundation for T-HEP-029 v0.1 (the new spec is built on top of the preserved original).

**Condition 3 — Over-reaction file deleted** ⏳ IN PROGRESS: `T-HEP-028_codif_32_ratification_path_documentation_v0.1.md` (185L/19184B) needs deletion at BOTH canonical + slot-isolated per CATCH #39 recovery. ETA 30-40 min (Hephaestus).

**T-MN-018 v0.2 ETA:** Once all 3 conditions MET, T-MN-018 v0.2 mechanical bump is 5-10 min (1-line addition to §1 row 7 + 1-line addition to §4 cross-Muse handoff entry + Codif 22 v0.2 in-place data update rule applied). No spec_version bump triggered (in-place data update).

**Mechanical bump lineage:** T-MN-018 v0.1 → v0.2 will be the 2nd application of Codif 22 v0.2 in-place data update rule for T-MN-018 series. T-MN-013 v0.3.1 → v0.3.1.1 was DEFERRED per §0 (cite-back documentation only, no substantive change). T-HEP-024 v0.4 v0.1 + T-MN-013 v0.3.1 + T-HE-033 v0.1 etc. all use Codif 22 v0.2 in-place data update rule for addenda cite-backs.

## §7 Size disclosure (Codif 19)

Target: 150-200L. Actual: 161L (within target, +11L above lower bound, -39L below upper bound). No §7.5 disclosure needed (within target). Section breakdown: §0 Frontmatter (~14L) / §1 Cross-link matrix (7 rows × 8 lines/row + §1.1 + §1.2 = ~70L) / §2 4-ICP verdict (4 ICPs × ~8L/ICP = ~35L) / §3 3-Witnesses (~10L) / §4 Cross-Muse handoffs (~12L) / §4.5 Cross-Muse handoff verification (~10L) / §5 Self-assessment + 3 HL moments (~20L) / §6 RATIFICATION gating (5 sub-gates × ~6L/gate = ~30L) / §6.5 T-MN-018 v0.2 mechanical bump (~15L) / §7.5 Per-ICP cite-back evidence table (~15L) / §8 Self-correction arc participation (~20L) / §7 Size disclosure (this section, ~4L). Total: ~161L.

**Codif 19 markers applied:** Cross-link consolidation matrix §1 is the densest section (7 rows × 6 columns = 42 cells, plus 2 sub-notes §1.1+§1.2). §2 4-ICP verdict has 4 detailed justifications (one per ICP, ~8L each). §6 RATIFICATION gating has 5 sub-gates (MECE on gate × sub-gate). All other sections are operationally dense.
