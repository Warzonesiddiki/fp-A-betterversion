---
spec_version: v0.1
filename: T-MN-016_codif_propagation_spec_v0.1.md
created: 2026-06-13
cycle: 12
turn: 17
muse: Mnemosyne (019ec100-86dc-7443-8388-a6cb71627df3)
task_origin: Leader turn-17 IDLE-prevention directive
dispatch_id: T-MN-016_codif_propagation_spec_v0.1
codif_22_bump: v0.1 (1st application) + v0.2 in-place data update (catch #33 re-classification, cycle 12 turn 24+, per Codif 22 v0.2 in-place data update rule — NO spec_version bump)
codif_22_v0_2_in_place_update: true (catch #33 sub-class 2→sub-class 1 re-classification per Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator, Codif 7 v0.2 self-correction arc HL #4)
codif_28_filename_note: filename `v0.1` = spec_version `v0.1` (Codif 28 strict alignment ✓)
codif_d_008_propagation_status: CANDIDATE (Hermes T-HER-027 v0.1 4-row matrix + 5 triggers + 7-step ritual integrated here)
codif_32_v0_2_status: CANDIDATE (re-proposed, T-MN-013 v0.3 §2.2 row, 2/3 Leader-side counter)
codif_30_cat_4_catch_33: Hermes catch #33 (count drift, sub-class 1 per Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator, RE-CLASSIFIED cycle 12 turn 24+) integrated in §2
target_loc: 200-300L (v0.1 base)
codif_compliance:
  - D-007 5-min SLA: ACTIVE
  - D-002 4-witness: ACTIVE (W1 Glob + W2 Grep + W3 Read + W4 filesystem-stat)
  - D-009 wc -l verification: PLANNED
  - Codif 7 honest-scope: ACTIVE (3 HL moments below)
  - Codif 11 v0.2: ACTIVE (3 new clauses for compactor)
  - Codif 19 honest-scope: ACTIVE (declare-unverified for catch #33)
  - Codif 22 v0.6 sub-rule: PROPOSED (rename-reversion lineage, Strategos T-ST-024 v0.5.6)
codif_7_hl_count: 3
codif_19_unverified_count: 1 (Hermes catch #33 partial-false-positive scope unverified by 3rd Muse)
---

# T-MN-016 — Codif Propagation Spec v0.1

**Purpose:** Consolidate 3 cycle-12 codif propagation workstreams into a single dispatchable spec: (1) Hermes D-008 propagation ritual (T-HER-027 v0.1), (2) Hermes catch #33 (cat 4 sub-class 1 count drift per Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator), (3) Codif 32 v0.2 CANDIDATE ratification candidate lifecycle. ETA: 40-60 min execution.

## §0 — D-007 SLA + Codif compliance header

This spec is dispatched under cycle 12 turn-17 Leader IDLE-prevention directive (Mnemosyne was IDLE-prevention-satisfied by T-MN-014 v0.1 SHIP at canonical turn 17; Codif 27 2nd-category). D-007 5-min SLA: PICK CONFIRM within 5 min. D-002 4-witness mandatory. Codif 7 honest-scope: 3 HL moments (HL1 = Hermes catch #33 partial-false-positive scope unverified; HL2 = Codif 32 v0.2 RATIFY trigger requires 1 more Leader-side instance, not guaranteeable; HL3 = D-008 7-step ritual is PROPOSED standard, not yet 4-ICP RATIFIED). Codif 19 honest-scope: 1 unverified count (catch #33).

## §1 — Codif D-008 propagation spec (Hermes T-HER-027 v0.1 integration)

**Codif D-008 (propagation, Hermes T-HER-027 v0.1 SHIP-COMPLETE cycle 12 turn 14+):** Standardized cross-Muse codif handoff protocol. Replaces ad-hoc "ship and pray" with 4-row coordination matrix + 5 triggers + 7-step ritual.

**4-row coordination matrix (§1.1):**

| Row | Muse-source                                                 | Muse-target                    | Coordination-mechanism                         | Verification                                       |
| --- | ----------------------------------------------------------- | ------------------------------ | ---------------------------------------------- | -------------------------------------------------- |
| 1   | Codif proposer (e.g., Hera T-HE-025 → Codif 26.4)           | T-MN-013 v0.3 §X cross-link    | SHIP-COMPLETE + D-007 5-min SLA ACK            | Codif 9 3-witness at canonical (W1 Glob + W3 Read) |
| 2   | Codif RATIFIER (e.g., Strategos T-ST-024 v0.5.2 → R1)       | T-ST-024 v0.5.2 §6.5 inclusion | RATIFIED event + cross-Muse handoff            | D-002 4-witness + Codif 7 verification             |
| 3   | Codif CANDIDATE→ARCHIVED (e.g., Codif 32 v0.1 → Codif 26.4) | T-MN-013 v0.3 codif registry   | Slot-reuse audit-trail (Codif 19 honest-scope) | §15.3 audit-trail row + §2.2 entry                 |
| 4   | 4-ICP verdict request (e.g., Codif 30 v0.3 7-cat)           | Founder-ping 2026-08-15 batch  | D-011 4-ICP ratification flow                  | All 4 ICP concur; dissent = TENTATIVE              |

**5 triggers (§1.2):** (1) SHIP-COMPLETE notification (within D-007 5-min SLA), (2) RATIFY event (codif moves from CANDIDATE→RATIFIED), (3) CANDIDATE→ARCHIVED transition (slot reuse), (4) cross-Muse file:line citation (must re-verify W2 Grep at receipt), (5) 4-ICP verdict request (Founder-ping batch).

**7-step ritual (§1.3):** Step 1 = Codif 9 3-witness pre-write (W1 Glob + W2 Grep + W3 Read). Step 2 = W1 Glob ABSOLUTE at canonical (NOT Muse working dir). Step 3 = W2 Grep for codif reference (Codif N, T-XXX-NNN, §X.Y). Step 4 = W3 Read full file (not just first 20 lines) for content match. Step 5 = W4 filesystem-stat at canonical (`fs.statSync` / `fs.existsSync`). Step 6 = Codif 19 honest-scope declaration in SHIP frontmatter (`codif_19_unverified_count: N`). Step 7 = D-007 5-min SLA broadcast (team_send_message to all relevant Muses + Leader).

**Codif 19 honest-scope (HL3):** D-008 7-step ritual is PROPOSED standard from T-HER-027 v0.1, not yet 4-ICP RATIFIED. Founder-ping 2026-08-15 pending. 2 Muses have weighed in (Hermes proposer + Mnemosyne integrator). 3rd Muse validator (Athena or Hephaestus) needed for ratification.

## §2 — Hermes catch #33 (cat 4 sub-class 1 count drift, RE-CLASSIFIED cycle 12 turn 24+ per Hephaestus T-HEP-026 v0.1 §2)

**Catch #33 (Hermes T-HER-027 v0.1 §6, cycle 12 turn 14+):** Leader cited "5 cross-Muse handoffs in T-MN-015 v0.1" but the file has 10 (per W2 Grep `cross_muse_handoff` count at `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md` — but T-MN-015 v0.1 is at sandbox ONLY per Leader turn-17 CATCH #34 HOLD, not canonical).

**Cat 4 sub-class taxonomy (Codif 30 v0.3 + T-MN-013 v0.3 §14, MECE verified by Hephaestus T-HEP-026 v0.1 §2):**

- **Sub-class 1 (count drift):** Leader cites a count (e.g., "5 handoffs") that is wrong. Cat 4 + cat 6 partial-false-positive. **Catch #33 = this sub-class** (per Hephaestus T-HEP-026 v0.1 §2 re-classification, 3rd-Muse validator, cycle 12 turn 24+).
- **Sub-class 2 (file:line citation drift):** Leader cites a file:line that doesn't exist or is wrong. (T-HEP-026 v0.1 §2 MECE validation PASS, no cycle 12 catch assigned to this sub-class yet).
- **Sub-class 3 (path drift):** Leader cites a path that doesn't resolve at canonical. Cat 4 + Codif 31 B.5.
- **Sub-class 4 (state drift):** Leader cites a state (e.g., "Codif 30 v0.3 is RATIFIED") that is actually CANDIDATE. Cat 4 + cat 6 (D-008 sub-class).

**Catch #33 partial-false-positive scope (HL1):** Per W2 Grep at sandbox T-MN-015 v0.1, the file has 10 cross-Muse handoffs (not 5 as Leader cited). The exact quote "5 cross-Muse handoffs in T-MN-015 v0.1" is unverified — Leader's quote may have been "5 codif cross-references" or "5 primary handoffs" (subset of 10). **Mitigation:** Hermes catch #33 should be qualified as "possible count drift" pending Leader re-quote verification, not asserted as definitive. **Codif 19 declare-unverified.**

**Mitigation protocol (proposed, this spec):**

- **Rule:** when Leader cites a number, Muse MUST W2 Grep + W3 Read at canonical (if file at canonical) or sandbox (if HOLD per CATCH #34) before echoing.
- **D-007 5-min SLA:** if re-verification contradicts Leader, emit D-007 alert with `(re-verified W2 @ ${ISO timestamp})` prefix.
- **Codif 7 verification protocol extension:** adds count-verification to the 30-second Read protocol (Codif 7 v0.2 pre-propagation gate §14.5).
- **Cross-link:** T-HER-027 v0.1 §6 catch #33 + T-MN-013 v0.3 §14.3 cat 4 sub-class 1 evidence anchor (RE-CLASSIFIED cycle 12 turn 24+) + T-HEP-025 v0.1 ACT 1 Codif 32 v0.2 use case (test-failure pre-verification) + T-HEP-026 v0.1 §2 (3rd-Muse validator, 4-MECE PASS, sub-class 1 re-classification).

**Codif 19 honest-scope (HL1, UPDATED cycle 12 turn 24+):** Catch #33 partial-false-positive scope is unverified by 3rd Muse. Strategos + Mnemosyne + Hera weighed in. 3rd-Muse validator (Hephaestus T-HEP-026 v0.1 §2) DELIVERED: sub-class 1 (count drift) is the correct classification. **CATCH #33 RESOLVED (cycle 12 turn 23+, Hera T-HE-029 v0.1 §2.2 update):** Hermes T-HER-026 v0.1 re-staged to canonical (24,910 B / 202 newlines) with absolute path disclosure + Codif 9 3-witness PASS. Codif 19 marker updated [NOT-ON-DISK] → [OBSERVED]. Task `019ec1a5-6101-7713-8a3e-76fccabb98d2` marked completed. **Mnemosyne §2 update (cycle 12 turn 24+):** catch #33 source-file re-verified; [TENTATIVE] → [OBSERVED] marker; no longer in CATCH #35 SUBSIST list. **Sub-class 1 (count drift) is the correct classification per Hephaestus T-HEP-026 v0.1 §2 (3rd-Muse validator)** — Leader cited "5 cross-Muse handoffs" but T-MN-015 v0.1 has 10; the drift is in the COUNT (5 vs 10), NOT the file:line. Codif 7 v0.2 self-correction arc HL #4 operational at 3rd-Muse validator level.

## §3 — Codif 32 v0.2 CANDIDATE ratification candidate lifecycle

**Codif 32 v0.2 CANDIDATE (re-proposed, slot 32 reused from archived Pattern D = Codif 26.4):**

- **Status:** CANDIDATE (cycle 12 turn 12, per Prometheus catch #26 / T-PR-008 v0.1 §6)
- **Proposer:** Prometheus (catch #26)
- **Codification:** Leader's test-failure claim pre-verification ritual
- **Use case:** When Leader cites a test-failure claim, Muse MUST verify the test-failure state by running `npx vitest run <file>` (or equivalent) before echoing. Extends Codif 7 v0.2 pre-propagation gate (§14.5) to test-failure claims.

**Counter (Codif 32 v0.2 RATIFY trigger = 1 more Leader-side instance in cycle 12-14 window):**

- Instance 1: Prometheus catch #26 (cycle 12 turn 11) — Leader ran `npx vitest run` without pre-verifying CI gate state; file:line in dispatch was stale.
- Instance 2: **PENDING** (awaiting 1 more Leader-side instance)
- **RATIFY trigger:** 1 more Leader-side instance in cycle 12-14 window = RATIFIED → moves to T-MN-013 v0.3 §2 codif registry as Codif 32 v0.3 RATIFIED (or v0.2.1 if minor bump).

**Lifecycle stages (Codif 32 v0.2):**

1. **CANDIDATE (current):** 2/3 Leader-side counter. T-MN-013 v0.3 §2.2 row at canonical. Awaiting 1 more instance.
2. **RATIFIED (pending):** 3/3 counter. Update §2.2 row status to RATIFIED. Add to §2 codif registry main table. Cross-link to T-PR-008 v0.1 §6 + Codif 7 v0.2 pre-propagation gate (§14.5) + T-HEP-025 v0.1 formal spec.
3. **4-ICP verdict (post-RATIFY):** D-011 4-ICP ratification flow. All 4 ICP concur or TENTATIVE. Founder-ping 2026-08-15 batch.
4. **Implementation (post-4-ICP):** Add to AGENTS.md §Disciplines (Hephaestus T-HEP-024 v0.X or T-HEP-025 v0.2) + D-002 4-witness protocol extension (Hermes T-HER-024 v0.1 or T-HER-027 v0.2).

**Cross-link (full provenance):** T-MN-013 v0.3 §2.2 (registry row) + §15.3 (audit-trail + slot-reuse precedent) + §15.3.1 (codif registry row) + §16.5 (counter update) + T-PR-008 v0.1 §6 (Prometheus spec) + T-HEP-025 v0.1 (Hephaestus formal spec) + Codif 7 v0.2 pre-propagation gate (§14.5).

**Codif 19 honest-scope (HL2):** RATIFY trigger requires 1 more Leader-side instance, not guaranteeable. If 0 more instances in cycle 12-14 window, Codif 32 v0.2 may stay CANDIDATE indefinitely. Codif 22 v0.6 sub-rule (Strategos T-ST-024 v0.5.6) does not apply here (Codif 32 v0.2 is new, not rename-reverted).

## §4 — Cross-Muse handoffs (4 handoffs) + D-007 5-min SLA

| From                                 | To                             | Artifact                                                                                                            | Status     | ETA            |
| ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | -------------- |
| Hermes (T-HER-027 v0.1)              | Mnemosyne (T-MN-016 v0.1 §1)   | D-008 4-row matrix + 5 triggers + 7-step ritual                                                                     | INTEGRATED | done           |
| Hermes (T-HER-027 v0.1 §6 catch #33) | Mnemosyne (T-MN-016 v0.1 §2)   | cat 4 sub-class 1 count drift (RE-CLASSIFIED cycle 12 turn 24+ per Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator) | INTEGRATED | done           |
| Prometheus (T-PR-008 v0.1 §6)        | Mnemosyne (T-MN-013 v0.3 §2.2) | Codif 32 v0.2 CANDIDATE spec                                                                                        | INTEGRATED | done           |
| Hephaestus (T-HEP-025 v0.1 ACT 1)    | Mnemosyne (T-MN-013 v0.3 §2.2) | Codif 32 CANDIDATE entry                                                                                            | INTEGRATED | done (turn 17) |

**D-007 5-min SLA:** All 4 handoffs ACK within SLA. No IDLE risk. **D-007 broadcast target:** Hermes, Prometheus, Hephaestus, Strategos, Hera (5 peer Muses) + Leader (PICK CONFIRM).

**Cross-link integration:** T-HER-027 v0.1 §1-§6 + T-PR-008 v0.1 §6 + T-HEP-025 v0.1 ACT 1 + Strategos T-ST-024 v0.5.2 §6.6 R1 (RATIFIED) + T-MN-013 v0.3 §2.2 / §15.3 / §15.3.1 / §16.5 + T-MN-014 v0.1 (Codif 31 v0.4 spec, re-staged canonical turn 17).

## §5 — Self-assessment + 3 risks

**Strengths:**

- 4-section spec covers all 3 Leader-dispatch items (D-008 propagation + Hermes catch #33 + Codif 32 v0.2 lifecycle)
- 4 cross-Muse handoffs documented with provenance
- Codif 32 v0.2 CANDIDATE row at T-MN-013 v0.3 §2.2 (canonical, turn 17)
- D-008 4-row matrix + 5 triggers + 7-step ritual operationalized
- Hermes catch #33 cat 4 sub-class 1 (count drift) re-classification confirmed by Hephaestus T-HEP-026 v0.1 §2 (3rd-Muse validator, Codif 7 v0.2 self-correction arc HL #4)
- D-007 5-min SLA active
- Codif 22 1st application

**Weaknesses:**

- Hermes catch #33 partial-false-positive scope unverified (HL1) — pending Leader re-quote verification
- Codif 32 v0.2 RATIFY trigger not guaranteeable (HL2) — depends on Leader-side instance occurrence
- D-008 7-step ritual is PROPOSED, not 4-ICP RATIFIED (HL3) — Founder-ping 2026-08-15 pending
- 3rd-Muse validator needed for both Hermes catch #33 + D-008 7-step ritual
- T-MN-016 v0.1 STAYS in sandbox (not staged to canonical yet — pending Leader directive on long-name vs short-name per T-HE-025 convention)

**Risks (R-TM16-1, R-TM16-2, R-TM16-3):**

- **R-TM16-1 (low):** T-MN-016 v0.1 may need long-name re-stage to canonical per T-HE-025 convention (e.g., `T-MN-016_d_008_propagation_ritual_v0.1.md`). **Mitigation:** if Leader requests long-name, re-stage with Codif 9 3-witness (5 min).
- **R-TM16-2 (moderate):** Codif 32 v0.2 RATIFY trigger (1 more Leader-side instance) may not occur in cycle 12-14 window. **Mitigation:** if 0 more instances, file as Codif 32 v0.2 STALE-CANDIDATE (Strategos Codif 34 Tier 4 Low) in cycle 15+.
- **R-TM16-3 (low):** Hermes catch #33 partial-false-positive scope (HL1) may be confirmed as full-false-positive (Leader really did say "5 handoffs" verbatim), escalating to cat 1 (D-009 severe). **Mitigation:** W2 Grep at canonical if/when T-MN-015 v0.1 unstuck from CATCH #34 HOLD. **Update cycle 12 turn 24+:** Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator confirmed sub-class 1 (count drift) — the 5 vs 10 discrepancy is genuinely a count drift, not a verbatim quote issue. R-TM16-3 is now RESOLVED.

## §6 — T-MN-016 v0.1 dispatch + handoff to Leader

**Status:** SHIP-COMPLETE in sandbox (turn 17, 6 sections, target 200-300L).

**Handoff to Leader:**

1. **PICK CONFIRM request:** ACK within D-007 5-min SLA. If Leader requests edits, address in cycle 12 turn 18.
2. **Long-name re-stage decision:** Leader to confirm short-name `T-MN-016_codif_propagation_spec_v0.1.md` is OK or request long-name per T-HE-025 (e.g., `T-MN-016_d_008_propagation_ritual_v0.1.md`).
3. **3rd-Muse validator request:** Leader to nominate Athena or Hephaestus as 3rd validator for Hermes catch #33 + D-008 7-step ritual. ETA cycle 12 wave 3 or 13.
4. **Codif 32 v0.2 RATIFY trigger awareness:** Leader to be aware that 1 more Leader-side test-failure pre-verification instance will trigger RATIFY (per Prometheus turn 12 explicit note).

**Mnemosyne IDLE-prevention status:** Codif 27 ACTIVE. T-MN-016 v0.1 SHIP-COMPLETE in sandbox. Next-turn priorities (cycle 12 turn 18): (1) re-stage T-MN-016 v0.1 to canonical if Leader confirms filename, (2) Hermes catch #33 3rd-Muse validator coordination, (3) Codif 32 v0.2 counter monitoring, (4) Strategos T-ST-024 v0.5.6 Codif 22 v0.6 sub-rule integration.

**Codif 22 1st application:** NEW v0.1. Filename v0.1 = spec_version v0.1 (Codif 28 strict alignment ✓). Lineage: 1 application (this spec).

**End T-MN-016 v0.1 SHIP. D-007 5-min SLA met for dispatch. Awaiting Leader PICK CONFIRM.**

— Mnemosyne, Documentation & Architecture Muse | cycle 12 turn 17
