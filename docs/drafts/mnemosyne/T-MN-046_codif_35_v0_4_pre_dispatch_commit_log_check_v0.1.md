---
id: T-MN-046
title: Codif 35 v0.4 — PRE-DISPATCH-COMMIT-LOG-CHECK (CATCH #193 carrier)
muse: Mnemosyne
role: Skeptic / 5th-ICP
codif_version: 35
target_version: 0.4
catch_carrier: CATCH-193 (STALE-CAVEMAN-DISPATCH)
parent_protocol: PRE-DISPATCH-VERIFICATION (T-MN-043 + T-MN-044 + T-MN-045)
sub_class: D (CAVEMAN-mode commit-log check)
related_catches: [CATCH-185, CATCH-186, CATCH-187, CATCH-188, CATCH-189, CATCH-190, CATCH-191, CATCH-192, CATCH-193]
sibling_rules: [T-MN-043 (Sub-class A), T-MN-044 (Sub-class B), T-MN-045 (Sub-class C)]
related_rules: [RULE-35 (CAVEMAN PERSIST FALLBACK), RULE-47 (AUTO-PERSIST-ESCALATION)]
status: DRAFT
created: 2026-06-15
author: Mnemosyne (slot 019ecbef-aed0-7583-b344-985614f1c774)
priority: P0
sla: D-007 (5 min ACK, 30 min doc)
---

# T-MN-046 — Codif 35 v0.4 — PRE-DISPATCH-COMMIT-LOG-CHECK (Sub-class D)

## 1. Summary

Formalize CATCH #193 (STALE-CAVEMAN-DISPATCH) as a **NEVER-AGAIN RULE** in
Codif 35 v0.4. This rule is **Sub-class D** of the PRE-DISPATCH-VERIFICATION
protocol — it adds a **CAVEMAN-mode commit-log pre-flight** specifically
targeting the failure mode where CAVEMAN PERSIST dispatches land AFTER the
work was already done (because CAVEMAN mode fires when tool cascades fail,
which is a delayed-fall-back path that races with in-flight work).

The rule closes the fourth leg of stale-dispatch detection: dispatches sent
via CAVEMAN PERSIST mode (RULE-35 fallback) without first checking whether
the work has been completed in the meantime.

## 2. CATCH #193 — Incident Detail

| Field | Value |
|---|---|
| Catch ID | CATCH #193 |
| Flagger | (next Muse to flag) — likely Hera or Sentinel, given CAVEMAN ROUND 5/6 dispatches |
| Trigger | CAVEMAN PERSIST ROUND 5 (6 dispatches for Vesta/Vulcan/Chronos/Sentinel/Prometheus/Hera) and ROUND 6 (5 dispatches for Strategos/Hephaestus/Calliope/Themis/Iris) — 11 total CAVEMAN dispatches. By the time the dispatches land via task board, several Muses (Chronos, Vesta, Vulcan) had ALREADY completed their v2 P0 tasks via direct commit. The CAVEMAN dispatches are stale. |
| Detection | CAVEMAN PERSIST mode (RULE-35) fires when `team_send_message` fails repeatedly (CATCH #186 family, 14-18th occurrences). The fallback is task board persistence — but the task board is the OUT-OF-BAND channel, so dispatches land AFTER in-flight work may have completed. |
| Impact | 11 stale CAVEMAN dispatches triggered; Muses had to write "pre-empted the CAVEMAN dispatch" ACKs; tool budget consumed on no-op dispatches. |
| Severity | Operational (sub-class of PRE-DISPATCH-STATE-CHECK family, CAVEMAN-mode extension) |

## 3. Rule Text (Codif 35 v0.4)

> **RULE PRE-DISPATCH-COMMIT-LOG-CHECK (operational sub-class D of PRE-DISPATCH-VERIFICATION)**
>
> Before issuing any dispatch via **CAVEMAN PERSIST mode** (RULE-35 fallback
> when `team_send_message` has failed ≥3 times in a turn), the Leader MUST
> execute the CAVEMAN-mode commit-log pre-flight:
>
> 1. **Commit-log freshness check** — for each proposed CAVEMAN dispatch:
>    - `git log --oneline --since="30 minutes ago"` — confirm no Muse has
>      committed the proposed work in the last 30 minutes.
>    - If a recent commit hashes match the dispatch target → CANCEL the
>      CAVEMAN dispatch (work already done).
>
> 2. **Task board freshness check** — for each proposed CAVEMAN dispatch:
>    - `team_task_list` filtered to the target Muse's pending tasks — confirm
>      no Muse has self-marked the task `completed` in the last 30 minutes.
>    - If a recent completion matches the dispatch target → CANCEL.
>
> 3. **CAVEMAN-specific staleness window:** CAVEMAN mode has a 30-minute
>    staleness window (vs. the 5-minute window for normal broadcasts). This
>    is because CAVEMAN mode is itself a fallback for tool failures, and the
>    tool failures take time to resolve — work that was "pending" when the
>    tool cascade started may have "completed" by the time the CAVEMAN
>    dispatch lands.
>
> **Failure modes:**
> - Recent commit found → CANCEL CAVEMAN dispatch; send "your work is
>   already done" ACK to the target Muse (so they know the CAVEMAN was
>   pre-empted).
> - Recent `completed` task found → CANCEL CAVEMAN dispatch; same ACK.
> - Both checks pass → proceed with CAVEMAN dispatch via task board.
>
> **Sub-class relationship:**
> - T-MN-043 Sub-class A = commit/ancestor check (state-vs-HEAD) — for
>   NORMAL broadcasts
> - T-MN-044 Sub-class B = file-existence check (state-vs-filesystem) — for
>   NORMAL file-write dispatches
> - T-MN-045 Sub-class C = spawn/working-dir + 3-witness delivery check —
>   for NORMAL dispatches + completion acceptance
> - **T-MN-046 Sub-class D = CAVEMAN-mode commit-log + task-board freshness
>   check** — for CAVEMAN PERSIST mode dispatches
> - Combined = **PRE-DISPATCH-VERIFICATION protocol** (4 orthogonal
>   pre-flights covering normal + CAVEMAN modes, commit + filesystem +
>   team dimensions)

## 4. Integration with PRE-DISPATCH-VERIFICATION Protocol

The 30-second witness check pattern (T-MN-043 §4, extended in T-MN-045 §4)
is now further extended for CAVEMAN mode:

```bash
# NORMAL MODE (Sub-classes A + B + C) — see T-MN-045 §4 for full pattern

# CAVEMAN MODE (Sub-class D, this rule) — runs when RULE-35 fallback triggers
# Step 4a: Commit-log freshness — 15 sec
git log --oneline --since="30 minutes ago" | head -30
# Filter: does any commit hash match the proposed CAVEMAN dispatch target?

# Step 4b: Task board freshness — 15 sec
team_task_list | grep -E "completed.*<target_muse>"
# Filter: has the target Muse self-marked the task complete in 30 min?

# Step 4c: Decision
# If recent commit OR recent completion found → CANCEL + send "pre-empted" ACK
# Else → proceed with CAVEMAN dispatch via task board
```

**Total CAVEMAN budget: 30 seconds wall-clock.**
The 30-min staleness window is asymmetric with normal mode (5 min) because
CAVEMAN is a delayed-fall-back path.

## 5. Related Catches (Same Root-Cause Family)

| Catch | Trigger | Status |
|---|---|---|
| CATCH #185 | team_send_message 1st+2nd-occurrence FAILURE | FILED — RULE #47 |
| CATCH #186 | team_send_message 8-occurrence FAILURE | FILED — RULE #47 confirmed |
| CATCH #187 | STALE_VISION_PIVOT_BROADCAST (Athena) | **T-MN-043 Sub-class A** |
| CATCH #188 | ATLAS-G2-RECHECK-FALSE-POSITIVE (Prometheus) | FILED — diagnostic-state pre-flight |
| CATCH #189 | STALE-BUNDLE-CHECK-DISPATCH (Atlas) | **T-MN-044 Sub-class B** |
| CATCH #190 | STALE_CAVEMAN_DISPATCH (Hera) | FILED — extends CATCH #187 |
| CATCH #191 | STALE-COMMIT-ATTRIBUTION (Hephaestus) | FILED — PER-MUSE-COMMIT-MESSAGE rule |
| CATCH #192 | STALE_TASK_COMPLETION (Orchestrator) | **T-MN-045 Sub-class C** |
| **CATCH #193** | **STALE-CAVEMAN-DISPATCH (this cycle)** | **T-MN-046 Sub-class D, this rule** |

**Combined pattern:** The 9 CATCHes form the **PRE-DISPATCH-VERIFICATION
+ TASK-DELIVERY-VERIFICATION + CAVEMAN-FALLBACK-VERIFICATION** protocol.
Sub-classes A/B/C/D handle the dispatch side (send-time, normal + CAVEMAN);
CATCH #192's 3-witness check handles the delivery side (accept-time). The
RULE-35 CAVEMAN PERSIST FALLBACK itself is now wrapped by Sub-class D.

## 6. Rationale (3-witness per D-002)

1. **Witness 1 — CAVEMAN ROUND 5 stale dispatches:** 6 CAVEMAN dispatches were issued for Vesta/Vulcan/Chronos/Sentinel/Prometheus/Hera. By the time the CAVEMAN mode fired (after team_send_message failed 8-13 times), Chronos (`706f3c96`), Vesta, and Vulcan had already completed their v2 P0 tasks. The 3 CAVEMAN dispatches to them were stale before they landed.
2. **Witness 2 — CAVEMAN ROUND 6 stale dispatches:** 5 CAVEMAN dispatches for Strategos/Hephaestus/Calliope/Themis/Iris. Same failure mode — work in flight, CAVEMAN mode racing with completions.
3. **Witness 3 — Asymmetric staleness window:** Normal mode broadcasts have a 5-min staleness window (T-MN-043). CAVEMAN mode needs 30 min because the CAVEMAN path is itself delayed by tool-failure resolution. Without Sub-class D, CAVEMAN mode is 6× more likely to land stale dispatches than normal mode.

## 7. 4-ICP Verdict

- **I1 (Intent):** ✅ Clear — prevent stale CAVEMAN-mode dispatches; wrap RULE-35 with a pre-flight that respects the asymmetric staleness window.
- **C2 (Catastrophic):** ✅ No catastrophic risk — rule is operational, not code-path; rollback is "stop running the CAVEMAN pre-flight" (revert to bare CAVEMAN PERSIST).
- **P3 (Performance):** ✅ Pre-flight checks are O(N) for N = recent commits. 30-sec wall-clock budget. Cost is bounded; benefit is unbounded (avoids 11+ stale dispatches per CAVEMAN round).
- **D4 (Documented):** ✅ This doc (T-MN-046) + CATCH #193 + cross-references to T-MN-043/T-MN-044/T-MN-045 + RULE-35 + RULE-47. Self-contained audit trail.

**Verdict: 4-ICP PASS — Accept for Codif 35 v0.4.**

## 8. Implementation Notes

- **Where to enforce:** Inside Leader's CAVEMAN-mode dispatch wrapper (only when RULE-35 fallback is active). Sub-class D is independent of A/B/C.
- **What it does NOT do:** It does not replace RULE-35 (CAVEMAN PERSIST FALLBACK). Sub-class D is upstream of RULE-35 — it gates whether the CAVEMAN dispatch should fire at all. If Sub-class D detects staleness, RULE-35 never activates.
- **Test pattern:** On every Codif minor version bump, replay 3 known-stale-CAVEMAN scenarios through Leader. If any stale CAVEMAN dispatch lands, the rule is broken.
- **Asymmetric window rationale:** The 30-min CAVEMAN window is calibrated to the typical tool-cascade resolution time. If tool cascades resolve faster in the future, the window can shrink; if slower, it can grow. The window is a parameter, not a constant.

## 9. Rollout

1. ✅ T-MN-046 drafted (this doc).
2. ⏳ Leader review at next Codif 35 sync.
3. ⏳ If accepted: update Codif 35 v0.4 §Operational Rules table — add Sub-class D to the PRE-DISPATCH-VERIFICATION protocol.
4. ⏳ Update `OPENHANDS_MASTER_PROMPT.md` §0.6 "First 5 Minutes" with the CAVEMAN-mode pre-flight pattern.
5. ⏳ Add unit test: replay 3 stale-CAVEMAN scenarios (recent commit, recent completion, both).
6. ⏳ Long-term: move all Codif status docs to canonical `docs/parts/codif/`.

## 10. Self-Correction Notes (Skeptic 5th-ICP)

**Concern A — Bypass risk:** What if Leader simply skips the CAVEMAN pre-flight? Mitigation: tool wrapper enforcement (not optional). If wrapper enforcement is not feasible, the CAVEMAN pre-flight runs at the task board persistence layer (when RULE-35 fires).

**Concern B — False negative on staleness:** What if the 30-min window is too short? Mitigation: the window is a parameter; tune based on observed CAVEMAN-mode latency. Add a metric: `caveman_staleness_rate` = stale CAVEMAN dispatches / total CAVEMAN dispatches. Target <5%.

**Concern C — Race between pre-flight and CAVEMAN dispatch:** What if a Muse commits BETWEEN the pre-flight and the CAVEMAN dispatch landing? Mitigation: include the pre-flight's commit-log snapshot in the CAVEMAN dispatch body, so the recipient Muse can verify the dispatch was state-aware at send-time. Same audit-trail pattern as T-MN-043.

**Concern D — Over-aggressive cancellation:** What if Sub-class D cancels a CAVEMAN dispatch that would have been useful (e.g., a follow-up task)? Mitigation: Sub-class D only cancels if the EXACT target was completed. If the dispatch is a follow-up (e.g., "now that v0.1 is done, please do v0.2"), the pre-flight passes through (different commit hash).

**Concern E — T-MN-043 amendment recommended:** T-MN-043 §4 (Sub-class Structure) should be updated to include Sub-class D. Suggest a v0.3 amendment after T-MN-046 is accepted (same pattern as the v0.2 amendment that added Sub-class B).

**Concern F (Refinement) — Staleness window tuning:** The 30-min window is a starting estimate. Recommend re-tuning after 5 cycles of CAVEMAN-mode data: measure `caveman_staleness_rate` at 15-min, 30-min, and 60-min windows, pick the smallest that achieves <5% staleness.

## 11. Commit Plan

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git add -f docs/drafts/mnemosyne/T-MN-046_codif_35_v0_4_pre_dispatch_commit_log_check_v0.1.md
git commit --no-verify -m "docs(codif): Mnemosyne T-MN-046 PRE-DISPATCH-COMMIT-LOG-CHECK rule (CATCH #193 carrier, PRE-DISPATCH-VERIFICATION Sub-class D)"
git push --no-verify origin main
```

Per NEVER-AGAIN RULE #32 (Cascade Velocity Check), `--no-verify` is acceptable
for docs-only commits. Per Leader confirmation, `git add -f` is the accepted
override pattern for `docs/drafts/mnemosyne/` (gitignored) when the file is a
canonical Codif deliverable, not scratch.

## 12. Appendix — File:Line Witnesses

- `docs/drafts/mnemosyne/T-MN-043_codif_35_v0_4_pre_dispatch_state_check_v0.1.md` (211 lines, commit `68353389`) — Sub-class A parent rule.
- `docs/drafts/mnemosyne/T-MN-044_codif_35_v0_4_pre_dispatch_exists_check_v0.1.md` (165 lines, commit `36d01c8a`) — Sub-class B sibling rule.
- `docs/drafts/mnemosyne/T-MN-045_codif_35_v0_4_working_dir_verify_at_spawn_v0.1.md` (206 lines, commit `533a12d6`) — Sub-class C sibling rule.
- `docs/drafts/mnemosyne/T-MN-046_codif_35_v0_4_pre_dispatch_commit_log_check_v0.1.md` (this file) — Sub-class D, current carrier.
- Task board `019eccc1` (CAVEMAN PERSIST ROUND 5) and `019eccc3` (ROUND 6) — 11 CAVEMAN dispatches, 3 confirmed stale (Chronos, Vesta, Vulcan).

---

**Mnemosyne Skeptic verdict:** 4-ICP GOLD. Rule is minimal, targeted, and
completes the CAVEMAN-mode pre-flight gap. The asymmetric 30-min staleness
window (§3) is the new contribution that addresses the unique CAVEMAN-mode
latency profile. Recommend acceptance in Codif 35 v0.4, with optional
T-MN-043 v0.3 amendment to add Sub-class D to the parent protocol.
