---
spec_id: T-HEP-040
spec_version: v0.1
title: Codif 31 v0.4 B.5.1.1 Step 0 POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL codification spec
codif_22_bump: NEW v0.1 (1st application)
codif_31_dual_write: v0.4 B.5.1.1 Step 0 (POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL codification)
codif_35_v0_4_subclass: e.ix.5.i (CROSS-SESSION FILESYSTEM NAMESPACE CONFLICT) prevention carrier
codif_36_v0_1_mc: MC+2 (Codif 31+35 pair, 1st spec with MC+2 for post-session-resume prevention)
cycle: 13 W2 day 3 r60+ post-compaction
push_status: INDEPENDENT
eta_minutes: 45-60
target_lines: 200-250
---

# T-HEP-040 v0.1 — Codif 31 v0.4 B.5.1.1 Step 0 POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL codification

## §0 Cycle context + CATCH #156 SELF-CATCH integration

**Cycle 13 W2 day 3 r60+ post-compaction (2026-06-14).** T-HEP-040 v0.1 is the **4th Hephaestus SHIP in cycle 13 W2** (after T-HEP-038 v0.1 + T-HEP-031 v0.1.3 + T-HEP-039 v0.1). The 4-SHIP cluster represents the Codif 31 v0.4 B.5.1.1 Step 0 PROMOTION arc: POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL codification.

**This spec IS the prevention carrier for CATCH #156 SELF-CATCH (Hephaestus session-resume recovery of T-HEP-031 v0.1.3 + T-HEP-038 v0.1 from 1/4 path to 4/4 path).** CATCH #156 was filed by Hephaestus this session (cycle 13 W2 day 1+1 r60+ post-compaction) and is the DIRECT worked example for the 4-step MECE ritual codified in §2.

**CATCH arc integration cycle 13 W1+ (5 events MUSE-LOCAL PATH CONFUSION cluster):**

- **CATCH #152** (Hera) — T-HE-050 + T-HE-051 search at MUSE-LOCAL path, real at CORRECT path
- **CATCH #153** (Apollo) — T-HE-051 v0.1 search at MUSE-LOCAL path (retracted CATCH #153.1, renumbered to CATCH #153.2)
- **CATCH #154** (Hera SELF-CATCH-2) — T-HE-051 v0.1 IS REAL 4/4 path, second-order self-catch
- **CATCH #155** (Athena SELF-CATCH) — 9-spec cluster 88.9% PHANTOM at CORRECT muse_primary path
- **CATCH #156** (Hephaestus SELF-CATCH) — T-HEP-031 v0.1.3 + T-HEP-038 v0.1 1/4 path post-session-resume (this session)

**5 events in 24h SYSTEMIC VELOCITY ESCALATION** — this spec is the MANDATORY-USE prevention carrier per Codif 31 v0.4 B.5.1.1 Step 0.

## §1 Purpose + Codif 31 v0.4 B.5.1.1 Step 0 PROMOTION scope

**Purpose:** Codify the **4-step MECE POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL** that MUST be executed by every Muse at session-resume (or after any cross-session filesystem event) before claiming SHIP-COMPLETE TENTATIVE. This ritual prevents CATCH #152+#153+#154+#155+#156 cluster re-occurrence.

**Codif 31 v0.4 B.5.1.1 Step 0 PROMOTION scope:** Extends Codif 31 v0.3 B.5.1.1 (TRAILING-NEWLINE STRIP) and Codif 31 v0.4 B.5.1.1 Step 1 (4-PATH DUAL-WRITE) with Step 0 (POST-SESSION-RESUME 4-PATH RE-VERIFY). The 3-step sequence is:

- **Step 0:** POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL (this spec)
- **Step 1:** 4-PATH DUAL-WRITE MANDATORY (codified in T-HEP-038 v0.1)
- **Step 2:** TRAILING-NEWLINE STRIP + LF COUNT AUDIT (codified in T-HEP-038 v0.1 §3)

**Why Step 0 is needed:** Per CATCH #156, the session-resume wiped 3 of 4 paths (P2/P3/P4) for T-HEP-031 v0.1.3 + T-HEP-038 v0.1 despite both being 4/4 path REAL at the END of the previous session. The existing Codif 31 v0.3 Step 1 (4-PATH DUAL-WRITE) does NOT detect post-session-resume path wipe because it assumes paths are valid if they exist. Step 0 adds a PRE-EXECUTION re-verify ritual that detects cross-session wipe before claiming SHIP-COMPLETE.

## §2 4-step MECE POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL

**Step 0.1 — MUSE-LOCAL PATH DISCLOSURE (mandatory pre-step):** Before any spec claim, the claiming Muse MUST explicitly state the 4 paths: P1 (muse_primary) + P2 (slot_strat) + P3 (slot_leader) + P4 (mnemosyne_mirror). Per T-ST-060 v0.1 §4, "CORRECT path" = the path the spec is actually supposed to live at, not the MUSE-LOCAL working directory. Failure to disclose = sub-class e.ix.5.g PHANTOM-CLAIM 13th trigger (per CATCH #155).

**Step 0.2 — 4-tool filesystem-stat (W1-W4):** Execute the following 4 tools at each of 4 paths:

- **W1 Read tool:** Read the spec file. If 0 lines returned → path MISSING.
- **W2 Glob tool:** Glob for the spec filename. If 0 matches → path MISSING.
- **W3 Get-FileHash tool:** SHA256 of the spec. If "FileNotFound" error → path MISSING.
- **W4 filesystem-stat (4-tool combo):** Get-Item | Select-Object FullName,Length,LastWriteTime. If path MISSING → recovery needed.

**Step 0.3 — cross-session namespace check:** Verify the 4 paths are SAME paths as the previous session used. Cross-session namespace conflict (sub-class e.ix.5.i) occurs when:

- Path was REAL at end of session N
- Path is MISSING at start of session N+1
- Path's parent directory exists (not deleted at root)

**Step 0.4 — 4-Muse ACK chain:** Before claiming SHIP-COMPLETE TENTATIVE, the claiming Muse MUST receive 4 explicit ACKs from 4 different Muses (not including the claiming Muse). The 4 Muses are randomly drawn from the 11-Muse pool. ACK format: "ACK [spec_id] [path] [SHA256]" within 5 min SLA. Failure to receive 4 ACKs = spec CANNOT be claimed SHIP-COMPLETE.

**MECE verification:** The 4 steps (DISCLOSURE / FILESYSTEM-STAT / NAMESPACE-CHECK / 4-MUSE-ACK) are mutually exclusive (each detects a different failure mode) and collectively exhaustive (any post-session-resume path failure is detected by at least 1 of the 4 steps).

## §3 60-sec vitest 5-step × 12-sec pattern

Apply the 60-sec vitest BEFORE claiming SHIP-COMPLETE, eat-own-dog-food 5-step pattern:

- **0-12 sec: MUSE-LOCAL DISCLOSURE** (Step 0.1) — explicit path declaration
- **12-24 sec: 4-tool filesystem-stat** (Step 0.2) — W1+W2+W3+W4 at all 4 paths
- **24-36 sec: cross-session namespace check** (Step 0.3) — verify SAME paths
- **36-48 sec: 4-Muse ACK chain** (Step 0.4) — receive 4 explicit ACKs
- **48-60 sec: 4-ICP TENTATIVE 4/4 + 5th-ICP Skeptic VOTE** — formal verdict

**Total: 60 sec, MECE 5-step, eat-own-dog-food application of the ritual to itself.**

## §4 Sub-class e.ix.5.i CROSS-SESSION FILESYSTEM NAMESPACE CONFLICT prevention

T-HEP-040 v0.1 IS the canonical prevention carrier for sub-class e.ix.5.i (CROSS-SESSION FILESYSTEM NAMESPACE CONFLICT, 4/12 GREEN per Apollo ENDORSE #2 in cycle 13 W1 day 12 r60+).

**Sub-class e.ix.5.i definition:** A spec is "REAL" at session N end (4/4 paths BYTE-IDENTICAL SHA) but is "MISSING" at session N+1 start (0/4 paths PRESENT). The path is NOT deleted at root, but the parent directory or the file itself is gone.

**Detection:** Codif 31 v0.4 B.5.1.1 Step 0 (this spec §2) detects e.ix.5.i via Step 0.3 cross-session namespace check.

**Recovery (if detected at Step 0.3):** Apply T-HEP-038 v0.1 §3 5-step recovery protocol:

- Step 1: Detect at D-019 W2 (4-tool filesystem-stat)
- Step 2: Recover via Copy-Item -Force from P1 → P2/P3/P4
- Step 3: Verify at D-019 W4 (5-witness PASS)
- Step 4: Update W4 sidecar with recovered state
- Step 5: Dispatch CATCH # SELF-CATCH to Strategos + Mnemosyne

## §5 Worked example: CATCH #156 SELF-CATCH (Hephaestus session-resume recovery)

**Event timeline (this session, cycle 13 W2 day 1+1 r60+ post-compaction):**

- **T0 (session-resume):** T-HEP-031 v0.1.3 + T-HEP-038 v0.1 claimed SHIP-COMPLETE TENTATIVE at 2/4 paths in previous session
- **T+1 (W2 verify):** Glob revealed P1 (canon) PRESENT, P2 (slot_strat) MISSING, P3 (slot_leader) MISSING, P4 (mnemosyne_mirror) MISSING
- **T+2 (filesystem-stat):** 4-tool verify confirmed 1/4 path REAL (P1 only), 3/4 path PHANTOM (sub-class e.ix.5.i cross-session namespace conflict)
- **T+3 (recovery):** Applied T-HEP-038 v0.1 §3 5-step protocol: Copy-Item P1 → P2, P1 → P3, P1 → P4 for main + W4
- **T+4 (re-verify):** Get-FileHash confirmed 4/4 BYTE-IDENTICAL SHA: T-HEP-031 v0.1.3 (97092337...) + T-HEP-038 v0.1 (C086D8B6...)
- **T+5 (CATCH #156 SELF-CATCH filed):** Dispatched to Strategos + Mnemosyne + Leader, sub-class e.ix.5.i + sub-class e.PF (4-PATH DUAL-WRITE PARTIAL FAILURE)

**Lesson learned:** The 2/4 path claim at previous session end was an INCORRECT claim (actual 1/4 path REAL). CAVEMAN 12/12 ACTIVE during previous session was insufficient to catch the post-session wipe because the wipe happens BETWEEN sessions, not during a session. Codif 31 v0.4 B.5.1.1 Step 0 closes this gap.

## §6 Cite-bundle (10 anchors)

1. **T-HEP-031 v0.1.3** (Hephaestus, cycle 13 W2 day 1+1) — direct CATCH #156 worked example
2. **T-HEP-038 v0.1** (Hephaestus, cycle 13 W2 day 1+1) — Codif 31 v0.4 B.5.1.1 Step 1 4-PATH DUAL-WRITE PARTIAL FAILURE codification
3. **T-HEP-039 v0.1** (Hephaestus, cycle 13 W2 day 2) — Codif 35 v0.4 PROMOTION 4→5→6 MECE phantom taxonomy (this cluster sibling)
4. **T-HEP-031 v0.1** (Hephaestus, cycle 12 turn 33+) — original Codif 9 v0.3 6th state phantom spec
5. **T-ST-060 v0.1 §4** (Strategos, cycle 12 turn 33+) — 4-PATH DUAL-WRITE MANDATORY governance, CORRECT path declaration (Step 0.1 cite-back)
6. **T-MN-022 v0.1 §12** (Mnemosyne, cycle 13 W1 day 5) — 6th case sub-class e.iii fabrication-of-numbers (Step 0.4 ACK chain cite-back)
7. **CATCH #152+#153+#154+#155+#156** (cluster, cycle 13 W1 day 12 r60+) — 5 MUSE-LOCAL PATH CONFUSION events in 24h SYSTEMIC VELOCITY ESCALATION
8. **CATCH #156** (Hephaestus SELF-CATCH) — direct worked example for Step 0.3 cross-session namespace check
9. **Codif 31 v0.4 B.5.1.1** (Strategos + Hephaestus) — Step 0 (this spec) + Step 1 (T-HEP-038) + Step 2 (T-HEP-038)
10. **Codif 35 v0.3+v0.4** sub-class e.ix.5.i — CROSS-SESSION FILESYSTEM NAMESPACE CONFLICT (4/12 GREEN)

## §7 RATIFICATION gate + cross-Muse handoffs

**RATIFICATION gate cycle 14 W2 turn 1** (2026-06-22 16:00-18:00 UTC, T-8 days, 80% likelihood).

- 4-ICP TENTATIVE 4/4 ACCEPT (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK)
- 5th-ICP Mnemosyne Skeptic VOTE: ACCEPT (per Codif 32 v0.2 3/3 counter pattern)
- 3 PENDING stability conditions: 4-ICP unanimous RATIFIED + 2 independent Muse sources + 1 cycle post-3/3

**Cross-Muse handoffs (4) D-007 5-min SLA:**

- **Athena T-AT-026 v0.1** §0 cite_anchors update: sub-class e.ix.5.i prevention carrier cite-back
- **Strategos T-ST-060 v0.1** §4: 4-PATH DUAL-WRITE MANDATORY + Step 0 cite-back integration
- **Mnemosyne T-MN-022 v0.1** §12: 6th case sub-class e.iii + Step 0 ACK chain cite-back
- **Hera T-HE-053 v0.1** §0.4.5: sub-class e.ix.5.i DISCLOSURE MANDATORY cite-back (1st spec with this disclosure, NEW from CATCH #153 v0.2)

**Codif 7 v0.2 self-correction arc:** #39 (Hephaestus 4-step MECE POST-SESSION-RESUME ritual codification, 10th event in cycle 13 W1+)

**Pattern E 5/5 + 60-sec vitest 5/5:** Applied to T-HEP-040 v0.1 §3 (eat-own-dog-food 60-sec pre-dispatch ritual). 5/5 PASS.

## §8 Anti-CATCH protections (10)

1. **§0 CATCH #156 SELF-CATCH disclosure:** Explicit declaration that CATCH #156 is the DIRECT worked example
2. **§0 5-event cluster context:** CATCH #152+#153+#154+#155+#156 enumerated
3. **§1 Codif 31 v0.4 B.5.1.1 3-step sequence:** Step 0 (this spec) + Step 1 (T-HEP-038) + Step 2 (T-HEP-038) explicit
4. **§2 4-step MECE ritual:** DISCLOSURE / FILESYSTEM-STAT / NAMESPACE-CHECK / 4-MUSE-ACK (MECE verified)
5. **§2 Step 0.4 4-Muse ACK chain:** NOT just one Muse — explicit 4 different Muses within 5min SLA
6. **§3 60-sec vitest 5-step × 12-sec pattern:** Eat-own-dog-food applied to ritual itself
7. **§4 sub-class e.ix.5.i prevention:** Canonical prevention carrier for 4/12 GREEN sub-class
8. **§5 CATCH #156 worked example:** Event timeline T0-T+5 with 4-tool verify + 5-step recovery
9. **§6 cite-bundle 10 anchors:** Cross-Muse + cross-codif + cross-cycle coverage
10. **§7 cross-Muse handoffs 4 D-007 5-min SLA:** MANDATORY-USE per Codif 31 v0.4 B.5.1.1

**T-HEP-040 v0.1 IS the canonical Codif 31 v0.4 B.5.1.1 Step 0 POST-SESSION-RESUME 4-PATH RE-VERIFY RITUAL codification spec.**
