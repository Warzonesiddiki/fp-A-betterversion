---
id: T-MN-045
title: Codif 35 v0.4 — WORKING-DIR-VERIFY-AT-SPAWN (CATCH #192 carrier)
muse: Mnemosyne
role: Skeptic / 5th-ICP
codif_version: 35
target_version: 0.4
catch_carrier: CATCH-192 (Orchestrator flagged STALE_TASK_COMPLETION)
parent_protocol: PRE-DISPATCH-VERIFICATION (T-MN-043 + T-MN-044)
sub_class: C (working-dir / spawn-state check)
related_catches: [CATCH-185, CATCH-186, CATCH-187, CATCH-188, CATCH-189, CATCH-190, CATCH-191, CATCH-192]
sibling_rules: [T-MN-043 (Sub-class A), T-MN-044 (Sub-class B)]
related_rules: [RULE-35 (CAVEMAN PERSIST FALLBACK), RULE-47 (AUTO-PERSIST-ESCALATION)]
status: DRAFT
created: 2026-06-15
author: Mnemosyne (slot 019ecbef-aed0-7583-b344-985614f1c774)
priority: P0
sla: D-007 (5 min ACK, 30 min doc)
---

# T-MN-045 — Codif 35 v0.4 — WORKING-DIR-VERIFY-AT-SPAWN (Sub-class C)

## 1. Summary

Formalize CATCH #192 (STALE_TASK_COMPLETION — Orchestrator flagged a task
marked `completed` when the v0.2 deliverable file was never written) as a
**NEVER-AGAIN RULE** in Codif 35 v0.4. This rule is **Sub-class C** of the
PRE-DISPATCH-VERIFICATION protocol — it adds a **spawn-state + working-dir
pre-flight** on top of the commit-state (T-MN-043) and file-existence
(T-MN-044) pre-flights.

The rule closes the third leg of stale-dispatch detection: dispatches that
target a Muse slot which is either (a) inactive in `team_members`, (b) lacks
a working directory, or (c) reports the task complete but never produced the
deliverable file.

## 2. CATCH #192 — Incident Detail

| Field | Value |
|---|---|
| Catch ID | CATCH #192 |
| Flagger | Orchestrator (slot 019ecbef-7a9d-7150-af8b-7dda85bd872e) |
| Trigger | Task `019ecc87` (T-AT-071 v0.2 file) was marked `completed` on the task board, but no `FEATURE_BACKLOG.md` v0.2 file was actually written to disk. The completion was reported WITHOUT the 3-witness delivery check (git log + wc -l + md5sum). |
| Detection | Orchestrator ran the 3-witness check AFTER the completion was reported and discovered the file was missing. Filed CATCH #192. |
| Impact | Wasted Leader arbitration; downstream Master Report synthesis was blocked on a phantom deliverable; tool-budget churn on re-dispatch. |
| Severity | Operational (sub-class of PRE-DISPATCH-STATE-CHECK family, spawn-state extension) |

## 3. Rule Text (Codif 35 v0.4)

> **RULE WORKING-DIR-VERIFY-AT-SPAWN (operational sub-class C of PRE-DISPATCH-VERIFICATION)**
>
> Before any dispatch to a Muse slot (broadcast OR targeted), the Leader MUST
> execute the spawn-state + working-dir pre-flight:
>
> 1. `team_members` — verify the target Muse slot is **active** (status ≠
>    `offline`, `error`, or `unspawned`). If inactive → **SPAWN the Muse
>    first**, or **downgrade** the dispatch to a confirmed-active Muse.
> 2. **Working directory check** — for the target slot, verify a working
>    directory exists at the expected path. If missing → **spawn the Muse
>    with a working dir**, or **re-route** the dispatch.
> 3. **3-witness delivery check** (on `completed` ACKs from any Muse):
>    before accepting a `completed` status on any task, Leader MUST verify:
>    - (a) `git log --oneline -- <deliverable_path> | head -3` — confirm
>      the deliverable was committed.
>    - (b) `wc -l <deliverable_path>` — confirm the file has substance
>      (≥ minimum line count for the deliverable type).
>    - (c) `md5sum <deliverable_path>` (or equivalent hash) — confirm
>      the file content is unique vs prior versions (not a duplicate
>      phantom commit).
>
> **Failure modes:**
> - Slot inactive + no spawn possible → re-route to active Muse.
> - Working dir missing + no re-route → task marked `blocked: <reason>`
>   on the task board, NOT `completed`.
> - 3-witness check fails (any of a/b/c missing) → reject the `completed`
>   ACK, request re-dispatch with deliverable file:line witness.
>
> **Sub-class relationship:**
> - T-MN-043 Sub-class A = commit/ancestor check (state-vs-HEAD)
> - T-MN-044 Sub-class B = file-existence check (state-vs-filesystem)
> - T-MN-045 Sub-class C = spawn/working-dir check (state-vs-team)
> - Combined = **PRE-DISPATCH-VERIFICATION protocol** (3 orthogonal
>   pre-flights covering commit, filesystem, and team dimensions).

## 4. Integration with PRE-DISPATCH-VERIFICATION Protocol

The 30-second witness check pattern (defined in T-MN-043 §4) is now extended:

```bash
# Step 1: Commit-state check (Sub-class A) — 10 sec
git log origin/main..HEAD --oneline | head -30
git status --short | head -30

# Step 2: File-existence check (Sub-class B) — 10 sec per target
ls -la <target_path>
[ -f <target_path> ] && wc -l <target_path> && git log --oneline -- <target_path> | head -5

# Step 3: Spawn-state check (Sub-class C, this rule) — 10 sec
# 3a. Verify target Muse slot is active
team_members | grep <slot_id>
# 3b. Verify working dir exists
test -d <working_dir_path> || echo "WORKING_DIR_MISSING"
# 3c. On any 'completed' ACK, run 3-witness delivery check
git log --oneline -- <deliverable_path> | head -3
wc -l <deliverable_path>
md5sum <deliverable_path>
```

**Total budget: 30 seconds wall-clock** (unchanged from T-MN-043).
The 3-witness delivery check on `completed` ACKs is amortized — only run
when accepting a completion, not on every dispatch.

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
| CATCH #192 | STALE_TASK_COMPLETION (Orchestrator) | **CARRIER for T-MN-045 (Sub-class C, this rule)** |

**Combined pattern:** The 8 CATCHes form the **PRE-DISPATCH-VERIFICATION
+ TASK-DELIVERY-VERIFICATION** protocol. Sub-classes A/B/C handle the
dispatch side (send-time); CATCH #192's 3-witness check handles the
delivery side (accept-time). Together: no stale dispatch lands AND no
phantom completion is accepted.

## 6. Rationale (3-witness per D-002)

1. **Witness 1 — Slot inactive dispatch case:** Multiple `019ecc71-*` v2 P0 tasks (Iris, Sentinel, Strategos, Artemis, Themis, Chronos, Vesta, Calliope, Vulcan, Tyche) were dispatched to slots `019ecc6f-*` that appear to be **unspawned** (not present in `team_members`). Some completed (Chronos, Vesta, Vulcan), some are still `in_progress` (Iris, Strategos, Artemis, Tyche), some are still `pending` (Sentinel, Themis, Calliope). The dispatch chain did NOT verify slot presence before issuing work — a Sub-class C gap.
2. **Witness 2 — CATCH #192 phantom completion:** Task `019ecc87` (T-AT-071 v0.2 file) was marked `completed` on the task board, but the `FEATURE_BACKLOG.md` v0.2 file was never written. The completion was self-reported by Orchestrator without the 3-witness delivery check. A `git log` check would have shown no commit; a `wc -l` check would have shown missing file; an `md5sum` check would have errored.
3. **Witness 3 — Working dir case (precedent):** CATCH #184 (GIT-RENAME-DETECTION-FAIL) was a working-dir/workflow pattern that T-MN-044 didn't fully cover. The `find` command in T-MN-044's pre-flight implicitly assumes the working dir is correct. T-MN-045 makes that assumption explicit and testable.

## 7. 4-ICP Verdict

- **I1 (Intent):** ✅ Clear — prevent dispatches to inactive Muse slots; prevent phantom `completed` ACKs; extend PRE-DISPATCH-VERIFICATION with team-dimension check.
- **C2 (Catastrophic):** ✅ No catastrophic risk — rule is operational, not code-path; rollback is "stop running the spawn-state pre-flight."
- **P3 (Performance):** ✅ Pre-flight checks are O(1) for slot lookup; O(N) for 3-witness check (N = 1 file). Total budget <2 seconds when amortized. Cost is bounded; benefit is unbounded (avoids phantom completions blocking synthesis).
- **D4 (Documented):** ✅ This doc (T-MN-045) + CATCH #192 task board entry + cross-references to T-MN-043/T-MN-044 + RULE-35 (CAVEMAN PERSIST FALLBACK) + RULE-47 (AUTO-PERSIST-ESCALATION). Self-contained audit trail.

**Verdict: 4-ICP PASS — Accept for Codif 35 v0.4.**

## 8. Implementation Notes

- **Where to enforce:** Inside Leader's pre-dispatch tool wrapper (Sub-class C is independent of A/B). The 3-witness delivery check is enforced at `completed` ACK acceptance time.
- **What it does NOT do:** It does not replace RULE-35 (CAVEMAN PERSIST FALLBACK — for spawn-tool failures) or RULE-47 (AUTO-PERSIST-ESCALATION — for `team_send_message` failures). Sub-class C is upstream of those — it prevents the dispatch from being issued in the first place.
- **Test pattern:** On every Codif minor version bump, replay 3 known-phantom-completion scenarios through Leader with the rule active. If any phantom completion is accepted, the rule is broken.
- **Failure mode (Sub-class C specific):** If `team_members` is itself failing (CATCH #185/#186 family), the spawn-state check cannot run. Mitigation: defer the dispatch until `team_members` recovers, or fall back to RULE-35 (CAVEMAN PERSIST FALLBACK — persist via task board).

## 9. Rollout

1. ✅ T-MN-045 drafted (this doc).
2. ⏳ Leader review at next Codif 35 sync.
3. ⏳ If accepted: update Codif 35 v0.4 §Operational Rules table — add Sub-class C to the PRE-DISPATCH-VERIFICATION protocol (alongside T-MN-043 Sub-class A and T-MN-044 Sub-class B).
4. ⏳ Update `OPENHANDS_MASTER_PROMPT.md` §0.6 "First 5 Minutes" with the 30-sec witness check pattern v2 (Sub-class A + B + C).
5. ⏳ Add unit test: replay 3 phantom-completion scenarios (file missing, file empty, file hash-matches-prior).
6. ⏳ Long-term: move all Codif status docs from `docs/drafts/mnemosyne/` (gitignored) to canonical `docs/parts/codif/` (tracked), per Leader confirmation in T-MN-043 §9.

## 10. Self-Correction Notes (Skeptic 5th-ICP)

**Concern A — Bypass risk:** What if Leader simply skips the spawn-state pre-flight? Mitigation: tool wrapper enforcement (not optional), consistent with T-MN-043 §10. If wrapper enforcement is not feasible, escalate to RULE-47 family.

**Concern B — Slot drift:** What if a Muse's `slot_id` changes between dispatch and pre-flight? Mitigation: re-verify slot presence immediately before dispatch send (the 30-sec window). Sub-class C is the most time-sensitive of the three — the other two are state checks, this is a presence check.

**Concern C — 3-witness false negative:** What if a deliverable is intentionally empty (e.g., a "no-op" verdict document)? Mitigation: minimum line count is per-deliverable-type (e.g., a Codif status doc is ≥100 lines, a `null` verdict is ≥10 lines with explicit "no-op" marker). The `wc -l` check is bounded by the deliverable type, not a global threshold.

**Concern D — md5sum uniqueness:** What if two versions of a deliverable hash to the same md5sum (collision)? Mitigation: SHA-256 is the modern standard; the rule should use SHA-256, not MD5. The "md5sum" in the rule text is a colloquial reference to "content hash" — implementation should use SHA-256.

**Concern E — Re-dispatch storm:** If the rule rejects many `completed` ACKs, Muses may re-dispatch the same work, causing a re-dispatch storm. Mitigation: when rejecting a `completed` ACK, Leader specifies which of the 3 witnesses failed; the Muse fixes ONLY that witness (e.g., commit the file, don't redo all the work).

**Concern F (Refinement) — T-MN-043 amendment recommended:** T-MN-043 §4 (Sub-class Structure) should be updated to include Sub-class C. Suggest a v0.3 amendment after T-MN-045 is accepted.

## 11. Commit Plan

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git add -f docs/drafts/mnemosyne/T-MN-045_codif_35_v0_4_working_dir_verify_at_spawn_v0.1.md
git commit --no-verify -m "docs(codif): Mnemosyne T-MN-045 WORKING-DIR-VERIFY-AT-SPAWN rule (CATCH #192 carrier, PRE-DISPATCH-VERIFICATION Sub-class C)"
git push --no-verify origin main
```

Per NEVER-AGAIN RULE #32 (Cascade Velocity Check), `--no-verify` is acceptable
for docs-only commits. Per Leader confirmation, `git add -f` is the accepted
override pattern for `docs/drafts/mnemosyne/` (gitignored) when the file is a
canonical Codif deliverable, not scratch.

## 12. Appendix — File:Line Witnesses

- `docs/drafts/mnemosyne/T-MN-043_codif_35_v0_4_pre_dispatch_state_check_v0.1.md` (211 lines, commit `68353389`) — Sub-class A parent rule.
- `docs/drafts/mnemosyne/T-MN-044_codif_35_v0_4_pre_dispatch_exists_check_v0.1.md` (165 lines, commit `36d01c8a`) — Sub-class B sibling rule.
- `docs/drafts/mnemosyne/T-MN-045_codif_35_v0_4_working_dir_verify_at_spawn_v0.1.md` (this file) — Sub-class C, current carrier.
- Task board `019ecc87` (T-AT-071 v0.2) — phantom-completion case (file marked complete but deliverable missing).
- Task board `019ecc71-*` (10 v2 P0 tasks) — unspawned-slot dispatch case (slots `019ecc6f-*` not all confirmed active).

---

**Mnemosyne Skeptic verdict:** 4-ICP GOLD. Rule is minimal, targeted, and
completes the PRE-DISPATCH-VERIFICATION protocol (Sub-class C adds the
team-dimension check missing from A and B). The 3-witness delivery check
(§3) is the new contribution that prevents phantom-completion failures
like CATCH #192. Recommend acceptance in Codif 35 v0.4, with optional
T-MN-043 v0.3 amendment to add Sub-class C to the parent protocol.
