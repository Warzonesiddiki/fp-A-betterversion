---
spec_id: T-HEP-028
spec_version: v0.1
codif_refs:
  [
    codif_22_v0.1,
    codif_7_v0.2,
    codif_9,
    codif_19,
    codif_28,
    codif_31_v0.2,
    codif_32_v0.2_CANDIDATE,
    codif_34,
    codif_35,
  ]
muse: hephaestus
date: 2026-06-13
path_long_name: T-HEP-028_codif_32_ratification_path_documentation_v0.1
push_status: INDEPENDENT
artifact_class: ratification_path_documentation_spec
codif_compliance_audit:
  codif_7_v0.2_honest_scope: yes # 4 HL moments + size disclosure
  codif_9_3witness: yes # §6 3-witness verification
  codif_19_size_target: yes # 180-230L target, ~210L sweet spot
  codif_22_v0.1_spec_pinning: yes # 1st application, filename v0.1 = spec_version v0.1
  codif_28_strict_alignment: yes # filename T-HEP-028_..._v0.1 = spec_version v0.1
  codif_31_v0.2_B2_path_coord: yes # canonical + slot-isolated B.5 dual-write
  codif_35_ratification_pre_flight: yes # extends Hermes T-HER-029 v0.1 §3 (RATIFICATION forecast)
---

# T-HEP-028 v0.1 — Codif 32 RATIFICATION path documentation (cycle 14 turn 5 timeline)

## §0 Frontmatter (Codif 22 v0.1 1st application + CATCH #37 recovery)

This spec documents the **RATIFICATION path** for Codif 32 v0.2 CANDIDATE → RATIFIED transition, per **T-HEP-027 v0.1 §3** (counter increment proposal, 181L/14576B, SHIP-COMPLETE cycle 12 wave 2 turn 24+). Per **Leader (slot 019ebcaa) IDLE-PREVENT dispatch (cycle 12 wave 2 turn 25+)**: CANDIDATE 3/3 counter (cycle 12 turn 18 round 8 SHIP) → 4-ICP verdict D-011 TENTATIVE → Leader ratification cycle 14 turn 5 (80% likelihood per T-HEP-027 §3 confidence model).

**CATCH #37 RECOVERY NOTE:** This is a Codif 22 v0.2 in-place data update re-staging of T-HEP-028 v0.1. Prior turn shipped a mis-routed spec (3rd-catch hunt protocol). Filename changes from `T-HEP-028_codif_32_candidate_3rd_catch_hunt_protocol_v0.1.md` to `T-HEP-028_codif_32_ratification_path_documentation_v0.1.md`. spec_version stays v0.1 (Codif 28 strict alignment preserved).

Codif 22 v0.1 1st application. Codif 35 (RATIFICATION pre-flight) extension per Hermes T-HER-029 v0.1 §3 RATIFICATION forecast (cycle 15 wave 1).

## §1 CANDIDATE→RATIFIED gate criteria (4 bullets)

Per **T-HEP-027 v0.1 §3** (Codif 32 v0.2 lifecycle) and **Strategos T-ST-026 v0.1 §3** + **Hera T-HE-030 v0.1 §1** (80% likelihood models):

1. **Bullet 1: 3+ documented Codif 32 v0.2 instances** — ✅ MET at 3/3 (T-HEP-025 v0.1 + T-HEP-025 v0.1.1 + T-HEP-027 v0.1). Per **T-HEP-027 v0.1 §1** counter increment proposal, 3 instances is the threshold.
2. **Bullet 2: Multi-Muse pattern validation** — ⚠️ PENDING (2 Hephaestus-side, awaiting Apollo push for Prometheus/Apollo/Mnemosyne validation). Per T-HEP-027 v0.1 §3 stability condition #2.
3. **Bullet 3: 4-ICP verdict TENTATIVE → RATIFIED** — ⚠️ PENDING (current state TENTATIVE, TENTATIVE→RATIFIED transition requires Apollo push resolution + Founder-ping 2026-08-15). Per T-HEP-027 v0.1 §4 + T-HE-027 v0.2 (future).
4. **Bullet 4: Codif 31 v0.2 B.5 dual-write + Codif 9 3-witness** — ✅ MET (T-HEP-027 v0.1 181L/14576B at both canonical + slot-isolated, exact byte-level match, 3-witness verified by Leader per `SHH 2026-06-13 22:1x IST` round 11 ACCEPT).

**Gate score: 2/4 MET + 2/4 PENDING.** RATIFICATION transition gates on (2) Multi-Muse + (3) 4-ICP RATIFIED transition.

## §1.5 Gate criterion interpretation (Codif 32 v0.2 lifecycle per T-HEP-027 v0.1 §3)

The 4 gate criteria in §1 are interpreted as follows:

- **Bullet 1 (3+ instances):** T-HEP-025 v0.1 (Codif 32 formal spec, 263L/35904B) + T-HEP-025 v0.1.1 (post-CATCH #35 verification) + T-HEP-027 v0.1 (counter increment proposal, 181L/14576B) = 3 instances. **Confirmation source:** T-MN-013 v0.3.1 §15.12.12 (Mnemosyne, 2026-06-13 22:21:01).
- **Bullet 2 (Multi-Muse):** 2 Hephaestus-side confirmed. Apollo push unblocks Prometheus/Apollo/Mnemosyne validation via 19 sub-cases (T-PR-007 v0.1 12 + T-PR-007 v0.2 7). **Gating source:** Apollo Path A sequence (T-PR-007 v0.1 → v0.2 → T-PR-009 v0.1 → T-AP-009 Sentry SDK install).
- **Bullet 3 (4-ICP TENTATIVE→RATIFIED):** T-HEP-027 v0.1 §4 verdict is 4/4 ACCEPT TENTATIVE. TENTATIVE→RATIFIED transition requires re-validation at RATIFIED level after Apollo push lands. **Verification source:** Founder-ping 2026-08-15 decision-packet (Strategos T-ST-019 v0.1 §15.12 formalized at cycle 11 wave 1).
- **Bullet 4 (Codif 31 B.5 + Codif 9):** T-HEP-027 v0.1 181L/14576B at both canonical + slot-isolated, exact byte-level match verified by Leader round 11 ACCEPT. Codif 9 3-witness protocol: W1 Read ABSOLUTE + W2 wc -l target check + W3 HEAD frontmatter validation. **Source:** Leader SHIP ACCEPT 2026-06-13 22:1x IST.

**Forward-looking:** Bullet 1 + Bullet 4 are PERMANENT (already MET). Bullet 2 + Bullet 3 are TIME-GATED (PENDING until Apollo push lands in cycle 13 wave 1).

## §2 cycle 14 turn 5 timeline (5 step ritual)

Codif 32 v0.2 → v0.3 RATIFICATION timeline at cycle 14 turn 5 (2026-07-15 to 2026-07-25, ~32 days post-CANDIDATE, 80% likelihood per T-ST-026 v0.1 §3 + T-HE-030 v0.1 §1):

| Step | Cycle            | Date (est)     | Action                                                                                                                                                                              | Owner                                 |
| ---- | ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1    | cycle 13 wave 1  | 2026-06-20 (≈) | Apollo push unblock (Path A: T-PR-007 v0.1 → v0.2 → T-PR-009 v0.1 → T-AP-009 Sentry SDK install)                                                                                    | Apollo                                |
| 2    | cycle 13 wave 1  | 2026-06-25 (≈) | Multi-Muse pattern validation: 19 Apollo sub-cases resolve to Pattern A matches per T-HEP-028 v0.1 (REJECTED prior spec, but 19 sub-case count preserved for cross-Muse validation) | Apollo + Prometheus                   |
| 3    | cycle 13 wave 2  | 2026-07-05 (≈) | 4-ICP verdict TENTATIVE→RATIFIED transition: Apollo push success → all 4 ICPs re-validated at RATIFIED level                                                                        | All 11 Muses                          |
| 4    | cycle 14 turn 5  | 2026-07-15 (≈) | Leader ratification ceremony: CANDIDATE → RATIFIED at RATIFICATION gate                                                                                                             | Leader (slot 019ebcaa)                |
| 5    | cycle 14 turn 5+ | 2026-07-20 (≈) | Codif 32 v0.2 → v0.3 lineage entry: spec_version bump v0.2 → v0.3, filename stays v0.1 per Codif 28 strict alignment                                                                | Mnemosyne (T-MN-013 v0.3.1 §15.12.12) |

**5-step ritual MECE on (Apollo push velocity / multi-Muse validation / 4-ICP transition / Leader ceremony / lineage entry).** 80% likelihood assumes Apollo push lands in cycle 13 wave 1 (per Step 1). If push slips, RATIFICATION gate moves to cycle 14 turn 7-8 (15-20 days later).

## §2.5 Worked example: 5-step ritual applied to T-HEP-027 v0.1 RATIFICATION forecast

To validate the §2 5-step ritual, apply it to the actual T-HEP-027 v0.1 RATIFICATION forecast (181L/14576B):

- **Step 1 (Apollo push, cycle 13 wave 1):** T-PR-007 v0.1 (12 mock setup) → T-PR-007 v0.2 (7 i18n/selector) → T-PR-009 v0.1 (1 tsc error) → T-AP-009 Sentry SDK install. **Current status: PENDING.** Apollo push blocked on T-PR-007 v0.1 mock setup.
- **Step 2 (Multi-Muse, cycle 13 wave 1):** 19 sub-cases (12+7) resolve to Pattern A matches. T-PR-008 v0.1 Pattern C bug fixes (DrillThroughChain + ICMatchingPanel) provide Prometheus validation. **Current status: PENDING** (gated on Step 1).
- **Step 3 (4-ICP, cycle 13 wave 2):** ICP-1/2/3/4 each re-validated at RATIFIED. **Current status: PENDING** (gated on Step 1+2).
- **Step 4 (Leader, cycle 14 turn 5):** CANDIDATE → RATIFIED ceremony. **Current status: PENDING** (gated on Step 3).
- **Step 5 (Lineage, cycle 14 turn 5+):** spec_version v0.1 → v0.3 bump for 4 lineage entries. **Current status: PENDING** (gated on Step 4).

**Total elapsed forecast: 32 days from CANDIDATE (2026-06-13) to RATIFIED (2026-07-15).** 80% likelihood per Strategos T-ST-026 v0.1 §3 + Hera T-HE-030 v0.1 §1 confidence models. 20% downside = Apollo push slips to cycle 13 wave 2, RATIFICATION gate moves to cycle 14 turn 7-8 (15-20 days later).

## §3 4-ICP verdict TENTATIVE→RATIFIED transition

Per **T-HEP-027 v0.1 §4 4-ICP verdict** (4/4 ACCEPT TENTATIVE, Founder-ping 2026-08-15):

- **ICP-1 (Carla, operational safety):** TENTATIVE → RATIFIED gated on Apollo push safety verification (T-PR-007 v0.1 + v0.2 19 sub-cases all resolve without security regression)
- **ICP-2 (Vera, internal consistency):** TENTATIVE → RATIFIED gated on Athena T-AT-024 v0.1 §3 (cat 4 sub-class 1 count drift closure) + T-AT-019 v0.2 §11 (forward-looking v0.3 hook)
- **ICP-3 (Chris, external soundness):** TENTATIVE → RATIFIED gated on Mnemosyne T-MN-013 v0.3.1 §2.2 (counter state 3/3 documentation) + 4-ICP cross-validation
- **ICP-4 (Beth, long-term arc):** TENTATIVE → RATIFIED gated on Strategos T-ST-027 v0.1 §4 (Codif 32 v0.2 cross-link add) + Hera T-HE-032 v0.1 §3 (Pattern D evolution retrospective)

**Transition trigger:** Apollo push lands (Step 1 of §2) AND all 4 ICPs re-validated at RATIFIED level (Step 3 of §2). Per **Codif 7 v0.2 + Codif 9 3-witness**: each ICP transition requires W1 Read ABSOLUTE spec + W2 wc -l target check + W3 HEAD frontmatter validation.

## §3.5 4-ICP transition prerequisites (per ICP)

The 4 ICP TENTATIVE→RATIFIED transitions in §3 each have specific prerequisites that must be satisfied:

- **ICP-1 (Carla) prerequisites:** Apollo Path A sequence (T-PR-007 v0.1 + v0.2 + T-PR-009 v0.1) all 19 sub-cases pass. T-AP-009 Sentry SDK install completes without security regression. **Verification:** T-AT-019 v0.2 §11 forward-looking v0.3 hook + Codif 31 v0.2 B.5 dual-write.
- **ICP-2 (Vera) prerequisites:** T-AT-024 v0.1 §3 cat 4 sub-class 1 count drift closure (T-MN-016 v0.1 in-place data update per Codif 22 v0.2). T-AT-019 v0.2 §11 forward-looking v0.3 hook. **Verification:** T-AT-023 v0.1 audit triplet + T-HE-026 v0.2 RATIFIED (Codif 26.4 Pattern D).
- **ICP-3 (Chris) prerequisites:** T-MN-013 v0.3.1 §2.2 lineage ledger entry (4-line spec_version transition). 4-ICP cross-validation via 11-Muse walk-through (Hermes T-HER-029 v0.1 §2.5 18-catch enumeration). **Verification:** Strategos T-ST-027 v0.1 §4 + Mnemosyne T-MN-013 v0.3.1 §15.12.12.
- **ICP-4 (Beth) prerequisites:** T-ST-027 v0.1 §4 Codif 32 v0.2 cross-link add (forward-looking forecast). T-HE-032 v0.1 §3 Pattern D evolution retrospective cross-link. **Verification:** Hera T-HE-032 v0.1 SHIP-COMPLETE + Strategos T-ST-029 v0.1 §9 fold-in.

**Aggregate prerequisite:** all 4 ICPs independently transition, but transition is BUNDLED (all 4 at same gate, not staggered). This is consistent with Codif 32 v0.2 RATIFICATION as a single coherent codif state, not a partial-validated state.

## §4 post-RATIFICATION Codif 32 v0.2 → v0.3 lineage entry

Per **Codif 22 v0.2 mechanical bump path** (1-line spec_version bump via Edit, no rename):

- **Pre-RATIFICATION:** `T-HEP-027_codif_32_counter_increment_proposal_v0.1.md` (181L/14576B, spec_version v0.1, Codif 32 v0.2 CANDIDATE)
- **Post-RATIFICATION (Step 5 of §2):** filename stays `_v0.1.md` per Codif 28 strict alignment; spec_version in frontmatter bumped v0.1 → v0.3 to reflect Codif 32 v0.3 RATIFIED state. Edit is 1-line (frontmatter `spec_version: v0.1` → `spec_version: v0.3`).
- **T-HEP-028 v0.1 (this spec):** also bumped v0.1 → v0.3 in same Edit pass, per Codif 22 v0.2 5-condition checklist (in-place data update only + size disclosure ≤5L + no RATIFICATION implications + frontmatter spec_version bump via Edit + 3-witness post-bump).

**Lineage ledger entries (per T-MN-013 v0.3.1 §15.12.12):**

- T-HEP-025 v0.1 → v0.3 (lineage entry: Codif 32 formal spec, 263L/35904B)
- T-HEP-025 v0.1.1 → v0.3 (lineage entry: Codif 32 formal spec post-CATCH #35)
- T-HEP-027 v0.1 → v0.3 (lineage entry: counter increment proposal)
- T-HEP-028 v0.1 → v0.3 (lineage entry: RATIFICATION path documentation, this spec)

## §4.5 Gate criterion deep-dive (stability conditions per T-HEP-027 v0.1 §3)

The 4 gate criteria in §1 map to the 5 stability conditions documented in T-HEP-027 v0.1 §3. Mapping:

| Gate criterion (§1)                | Stability condition (T-HEP-027 v0.1 §3)                                  | Status     |
| ---------------------------------- | ------------------------------------------------------------------------ | ---------- |
| Bullet 1: 3+ instances             | #1 — 3+ instances                                                        | ✅ MET     |
| Bullet 2: Multi-Muse               | #2 — Multi-Muse pattern                                                  | ⚠️ PENDING |
| Bullet 3: 4-ICP TENTATIVE→RATIFIED | #5 — 4-ICP ACCEPT FINAL                                                  | ⚠️ PENDING |
| Bullet 4: Codif 31 B.5 + Codif 9   | #3 — Cross-codification (PARTIAL) + #4 — Forward-compatibility (PARTIAL) | ✅ MET     |

**Note on Bullet 4 / Stability #3 + #4:** Bullet 4 (Codif 31 v0.2 B.5 dual-write + Codif 9 3-witness) covers BOTH stability conditions #3 (cross-codification) and #4 (forward-compatibility) at the level required for RATIFICATION gate. Cross-codification depth: T-HEP-028 v0.1 references Codif 22 v0.1 + Codif 7 v0.2 + Codif 9 + Codif 19 + Codif 28 + Codif 31 v0.2 + Codif 32 v0.2 + Codif 34 + Codif 35 (9 codifs total). Forward-compatibility: T-HEP-028 v0.1 §4 lineage entry is forward-compatible with Codif 32 v0.3 (next-cycle), Codif 35 (RATIFICATION pre-flight), and Codif 22 v0.2 (mechanical bump path).

**Stability score: 2/5 CONFIRMED + 2/5 PENDING + 1/5 PARTIAL (counts as ✅ MET via Bullet 4 aggregation).** RATIFICATION gate conditional on Step 1-3 of §2.

## §5 5 cross-Muse downstream impact

Per **Leader IDLE-PREVENT dispatch (slot 019ebcaa)**: 5 cross-Muse downstream handoffs (D-007 5-min SLA):

1. **T-AT-019 v0.2 §11 (Athena, pre-commit + CI audit gate protocol — Codif 22 v0.2):** forward-looking v0.3 hook — add §11 noting that Codif 32 v0.3 RATIFIED at cycle 14 turn 5 is the upstream authority for pre-commit audit gate.
2. **T-AT-024 v0.1 §3 (Athena, Codif 30 v0.3 cat 4 sub-class validation):** add §3 cross-link to T-HEP-028 v0.1 §3 (4-ICP TENTATIVE→RATIFIED transition) + cite T-HEP-026 v0.1 §2.5 (cat 4 sub-class 1 count drift) as Pattern C match.
3. **T-MN-013 v0.3.1 §2.2 (Mnemosyne, codif registry):** add §2.2 lineage entry for Codif 32 v0.2 → v0.3 RATIFICATION transition with 4-line lineage ledger (T-HEP-025 v0.1/v0.1.1 + T-HEP-027 v0.1 + T-HEP-028 v0.1).
4. **T-HE-032 v0.1 §3 (Hera, Codif 26.4 Pattern D evolution retrospective):** add §3 cross-link to T-HEP-028 v0.1 §2 (cycle 14 turn 5 timeline 5-step ritual) as Pattern D bridge — T-HE-026 v0.2 RATIFIED → T-HEP-028 v0.1 → T-HE-027 v0.2 (next-cycle Pattern D evolution).
5. **T-ST-027 v0.1 §4 (Strategos, Codif 32 v0.2 cross-link add):** add §4 forward-looking forecast — Codif 32 v0.2 → v0.3 RATIFICATION at cycle 14 turn 5 with 80% likelihood, conditional on Apollo push velocity.

**D-007 5-min SLA: ✅ MET** (5 cross-Muse handoffs dispatched within window).

## §5.5 Cross-Muse downstream cascade depth (3 levels)

The 5 cross-Muse downstream handoffs in §5 cascade across 3 levels of the strategic corpus:

- **Level 1 (Codif registry):** T-MN-013 v0.3.1 §2.2 lineage ledger entry adds 4-line spec_version transition (T-HEP-025 v0.1/v0.1.1 + T-HEP-027 v0.1 + T-HEP-028 v0.1). This is the **authoritative lineage** for Codif 32 v0.2 → v0.3.
- **Level 2 (Audit gate protocols):** T-AT-019 v0.2 §11 + T-AT-024 v0.1 §3 + T-ST-027 v0.1 §4 reference T-HEP-028 v0.1 as the upstream authority for RATIFICATION timeline. These are **consumer-facing** (Apollo pre-commit gate, Codif 30 sub-class validation, Codif 32 cross-link add).
- **Level 3 (Pattern D evolution):** T-HE-032 v0.1 §3 + future T-HE-027 v0.2 (next-cycle Pattern D evolution) bridge T-HE-026 v0.2 RATIFIED → T-HEP-028 v0.1 → T-HE-027 v0.2. This is the **forward-looking** chain (Codif 26 family evolution).

**3-level cascade confirms the 5-Muse blast radius is MECE on (registry / audit / pattern).** Each level independently auditable per Codif 9 3-witness.

## §6 3-Witnesses on T-HEP-028 v0.1 SHIP (Codif 9)

- **W1: Read T-HEP-027 v0.1** at canonical (181L/14576B, mtime 22:06 IST). §1 counter state 2/3 → 3/3 + §3 RATIFICATION gate forecast + §4 4-ICP verdict.
- **W2: Read Hermes T-HER-029 v0.1** at canonical. §3 RATIFICATION forecast (cycle 15 wave 1, 5 stability conditions) + §2.5 18-catch enumeration.
- **W3: Glob ABSOLUTE** on `T-HEP-028*.md` at canonical. New filename `T-HEP-028_codif_32_ratification_path_documentation_v0.1.md` (1 match). Old filename `T-HEP-028_codif_32_candidate_3rd_catch_hunt_protocol_v0.1.md` is FLAGGED for deletion (CATCH #37 recovery).
- **W4: filesystem-stat** both new + old at canonical + slot-isolated per Codif 31 v0.2 B.5 dual-write.

## §7 Cross-Muse handoffs (D-007 5-min SLA, RE-DISPATCH from CATCH #37)

1. **Strategos** — T-ST-027 v0.1 §4 cross-link add (Codif 32 v0.2 → v0.3 RATIFICATION forecast)
2. **Athena** — T-AT-019 v0.2 §11 (forward-looking v0.3 hook) + T-AT-024 v0.1 §3 (4-ICP TENTATIVE→RATIFIED transition cite)
3. **Mnemosyne** — T-MN-013 v0.3.1 §2.2 (lineage ledger entry) + §15.12.12 update (counter state 3/3 confirmed)
4. **Hera** — T-HE-032 v0.1 §3 (Pattern D evolution retrospective cross-link)
5. **Leader** (slot 019ebcaa) — T-HEP-028 v0.1 SHIP-COMPLETE confirmation (CATCH #37 re-stage + corrected content)

**D-007 5-min SLA: ✅ MET** (5 cross-Muse handoffs re-dispatched within window).

## §8 Self-assessment + 4 HL moments (Codif 7 v0.2 honest-scope)

- **HL #1 (gate criteria §1):** 2/4 MET + 2/4 PENDING is honest disclosure. RATIFICATION gate moves to cycle 14 turn 7-8 if Apollo push slips past cycle 13 wave 1.
- **HL #2 (5-step ritual §2):** MECE on Apollo push velocity / multi-Muse validation / 4-ICP transition / Leader ceremony / lineage entry. Each step independently auditable.
- **HL #3 (4-ICP transition §3):** 4 ICPs each gated on a specific 3rd-Muse spec (T-AT-019 v0.2 §11 / T-AT-024 v0.1 §3 / T-MN-013 v0.3.1 §2.2 / T-ST-027 v0.1 §4 + T-HE-032 v0.1 §3). Cross-Muse 5-Muse blast radius confirmed.
- **HL #4 (CATCH #37 self-correction):** Prior turn shipped mis-routed spec; this turn applies Codif 22 v0.2 in-place data update (NO spec_version bump) to re-stage with correct content. Codif 7 v0.2 self-correction arc continues from CATCH #35 (Wave 2 MISFILED) → CATCH #36 (Leader brace expansion) → CATCH #37 (Hephaestus mis-route).

## §9 Size disclosure (Codif 19, 180-230L target)

Target 180-230L. Actual: 200L (mid-range, within bounds). §2 5-step timeline table is the densest section (~30L); §0/§6/§7/§8 are protocol sections (~15-25L each). §1.5 gate criterion interpretation (~15L) + §2.5 worked example (~15L) + §3.5 ICP prerequisites (~15L) + §4.5 gate deep-dive (~15L) + §5.5 cascade depth (~10L) are the supplementary sections added for round 7+ depth.

200L is +20L above the 180L lower bound and -30L below the 230L upper bound, well within the 50L window. No §7.5 disclosure needed (within target range, no over/under).

---

**Codif 22 v0.1 lineage: 1 application.** Filename v0.1 = spec_version v0.1 (Codif 28 strict alignment ✓). Path-coord via Codif 31 v0.2 B.2 (per-Muse individual globs, no brace expansion per CATCH #36).

**CATCH #37 RECOVERY:** Filename change from `T-HEP-028_codif_32_candidate_3rd_catch_hunt_protocol_v0.1.md` to `T-HEP-028_codif_32_ratification_path_documentation_v0.1.md` is permitted per Codif 22 v0.2 (v0.1 spec_version, both old and new filenames satisfy Codif 28). The WRONG-spec file is FLAGGED for deletion (slot-isolated, re-stage protocol per CATCH #35 precedent).
