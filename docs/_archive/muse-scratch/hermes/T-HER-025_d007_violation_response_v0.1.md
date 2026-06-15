---
name: T-HER-025 D-007 Violation Response Template v0.1
description: Codif 22 spec_version v0.1 — response template for D-007 violations, downstream of T-HER-024 mechanism v0.1. 5 sections per Leader's exact spec (§1 trigger / §2 notification format / §3 escalation chain 4-level / §4 recovery SLAs / §5 post-recovery 3-witness). 4 escalation levels (5/10/15/20 min). 4 recovery SLAs (5/10/15/immediate). 3-witness post-recovery (Muse PICK CONFIRM + Lead ACK + heartbeat tick). 4 HL per Codif 19. Cross-Muse handoffs: Strategos T-ST-024 §7 (L4 cycle-pause), Mnemosyne T-MN-013 v0.3 §5 (resolution log mirror), all 10 Muse slots (W1 = last_ACK_at).
type: project
spec_version: v0.1
push: INDEPENDENT
extends: [Codif-7, Codif-9, Codif-11, Codif-14, Codif-19, Codif-22, Codif-27, D-007, D-011, T-HER-024-mechanism-v0.1]
filename_choice: lowercase d007 + violation_response (operational downstream naming pattern, matches T-HER-024 v0.1/v0.2 siblings)
siblings:
  - T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md (mechanism upstream, uppercase D007)
  - T-HER-024_d007_heartbeat_v0.1.md (operational downstream, lowercase)
  - T-HER-024_d007_heartbeat_v0.2.md (operational downstream, lowercase)
supersedes: nothing
---

# T-HER-025 — D-007 Violation Response Template (v0.1)

**Codif 22 · spec_version=v0.1 · push=INDEPENDENT · 5 sections + 4 HL + 4 appendices (A/B/C/D) · ~180L rendered prose**
**Canonical (disk):** `docs/drafts/hermes/T-HER-025_d007_violation_response_v0.1.md` (220L total, ~180L rendered prose, 4 appendices added cycle 12 turn 11)

## §1 — Trigger Condition

A D-007 violation fires when ≥5 min elapse between a Leader dispatch and the receiving Muse slot's first team_send_message (per Codif 14 v0.3 chronological recency, anchored at `dispatched_at` timestamp from `[D-007-VIOLATION]` line in §2 of T-HER-024 mechanism v0.1). Trigger requires: (a) dispatched task with T-XXX-NNN identifier, (b) slot's `last_ACK_at` is "never" or ≥5 min stale per W1 (`team_members[*].last_ACK_at`), (c) W2 (AGENTS.md D-007 policy) and W3 (Grep for prior IDLE in same slot) corroborate. **Out of scope:** generic liveness, perf monitoring, content-correctness — Codif 9 scope discipline. **Pre-fire window:** slot must be ≥2 min idle before D-007-WATCH fires (avoids triggering on momentary context-switch gaps per HL-1 of T-HER-024 mechanism). **Edge case:** if a slot sends ANY team_send_message in the 5-min window — even a "BLOCKED — needs clarification" — the violation does NOT fire (Codif 9 honest-scope: any comms counts as engagement).

## §2 — Idle Notification Format

When D-007 violation is CONFIRMED (W1+W2+W3 = 3-of-3) or PROBABLE (W1+W2 or W1+W3 = 2-of-3, 30s grace for first-time-IDLE), heartbeat emits:

```
team_send_message(
  to=<leader_slot_id>,
  message=(
    "[D-007-VIOLATION-NOTIFICATION] <ISO-8601-UTC>\n"
    "Muse: <name> | slot_id: <uuid>\n"
    "Task: <T-XXX-NNN> dispatched_at=<ISO-8601>\n"
    "Status: <idle / working-silent / dispatched-no-ACK / dispatched-stale-ACK>\n"
    "ETA: <Hermes's best estimate, e.g. 're-dispatch expected within 2 min'>\n"
    "Blocker: <if any, e.g. 'D-002 3-witness pending W3 historical-pattern search'>\n"
    "Witnesses: W1=<status-from-team_members> | W2=<AGENTS.md-L1225-pass> | W3=<N-prior-IDLE-events>\n"
    "Suggested action: <re-dispatch / HOLD / override / cycle-pause>"
  )
)
```

**Cc:** also send a copy to the offending Muse slot's slot_id via team_send_message, so the slot sees the notification when it returns (Codif 19 honest-scope: the slot deserves to know it was flagged). **Structure:** 4 fields — ACK / status / ETA / blocker — mutually exclusive & collectively exhaustive. **Failure modes:** if team_send_message itself fails, fall back to log append-only in `memory/d007_heartbeat/violations_2026-06-13.mdl` and retry on next heartbeat tick (60s). **Idempotency:** if a notification for the same T-XXX-NNN was sent in the last 5 min, do NOT re-send (de-dupe by T-id + slot_id) — Codif 9 honest-scope avoids notification spam.

## §3 — Escalation Chain (4 levels, time-bounded)

| Level                | Threshold                                        | Action                                                                                                                                                                       | Owner                            | Reversible?                      |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| L1 — Gentle nudge    | 5 min idle                                       | team_send_message from Leader to Muse slot, copy-paste from §2 notification format, no penalty framing                                                                       | Leader                           | yes                              |
| L2 — Re-dispatch     | 10 min idle (L1 unanswered)                      | Leader invokes §3 of T-HER-024 mechanism (4-field re-dispatch template), re-dispatches same T-XXX-NNN with explicit "previous dispatch went un-ACK'd at <dispatched_at>"     | Leader                           | yes                              |
| L3 — Leader override | 15 min idle (L2 unanswered)                      | Leader reassigns the task to a different Muse slot, marks original slot `[D-007-REPEAT-OFFENDER]` if W3 historical-pattern returns ≥3 priors in 7 days                       | Leader                           | yes (re-attemptable after cycle) |
| L4 — Cycle pause     | 20 min idle (L3 unanswered or no alternate slot) | Leader pauses the current cycle, opens a Codif 31 post-mortem (was the task inherently un-ACK-able? was the slot in a write-sandbox?), resumes only after post-mortem closes | Leader → Strategos (T-ST-024 §7) | no (requires explicit resume)    |

**Escalation timer starts at `dispatched_at`, pauses at every successful ACK** (any team_send_message from the slot counts as ACK, even "BLOCKED — needs clarification"). L1→L2 transition requires L1 to have been sent AND not answered for 5 min (10 min total from dispatch). **No-skip rule:** Leader must traverse L1→L2→L3→L4 sequentially; skipping levels is a Codif 9 honest-scope violation (looks like the violation is more severe than it is). **Override authority:** Leader may short-circuit L4 if user explicitly says "skip escalation" — but this is itself a Codif 19 disclosure event (the skip is the HL).

## §4 — Recovery Time SLAs

Each escalation level has a defined recovery-time SLA — the time from level-fire to slot-ACK or Leader-action-completion.

- **L1 nudge → slot PICK CONFIRM:** 5 min. Slot's team_send_message with `[T-XXX-NNN SCOPE ACCEPT]` or `[T-XXX-NNN PUSH-BACK: <reason>]` lands within 5 min of L1 dispatch.
- **L2 re-dispatch → slot PICK CONFIRM:** 10 min. Re-dispatch is a heavier message (4-field template); 10 min is the right window for slot to read+ACK+begin.
- **L3 override → alternate-slot PICK CONFIRM:** 15 min. Alternate slot needs to read context + Codif 22 spec_version + Codif 19 honest-scope before ACKing; 15 min accommodates cold-start.
- **L4 cycle pause → Codif 31 post-mortem closes:** immediate (no SLA — pause IS the SLA violation response, post-mortem takes whatever time is needed). The cycle does NOT auto-resume; Leader's explicit resume is required (handoff to Strategos per T-ST-024 §7).

**Recovery-failure feedback loop:** if any SLA misses, Codif 27 entry candidate (entry #4) — "D-007 violation response SLA itself missed → heartbeat mechanism under-scoped." Codif 27 requires 3 data points, so a single miss is not yet an entry; track misses in `memory/d007_heartbeat/sla_misses.mdl` for future Codif 27 elevation. **Partial-recovery rule:** if L1 ACK arrives during L2 re-dispatch, L2 still completes (Leader's call whether to abort the re-dispatch or let it land and pick the better of the two ACKs) — Codif 9 scope discipline, no retroactive level-cancellation.

## §5 — Post-Recovery Verification (3-witness, Codif 9)

After any D-007 violation recovery (L1/L2/L3/L4 resolved), 3 independent witnesses must corroborate the recovery:

- **W1 (Muse PICK CONFIRM):** the slot (or alternate slot in L3) sends a team_send_message with text matching `[T-XXX-NNN SCOPE ACCEPT, ETA <N> min]` or `[T-XXX-NNN PUSH-BACK: <reason>]`. Must arrive within the §4 SLA window.
- **W2 (Leader ACK):** Leader responds with a team_send_message acknowledging the slot's PICK CONFIRM, e.g. `[T-XXX-NNN ACK ACCEPTED, GO]`. This is the green-light to begin work.
- **W3 (heartbeat tick):** the next heartbeat tick (within 60s of W2) shows the slot in `status=working` with `last_ACK_at` updated to within the past 5 min. Tick line format per T-HER-024 mechanism §2 schema.

**Convergence rule:** all 3 must agree before the violation is marked RESOLVED in `memory/d007_heartbeat/violations_2026-06-13.mdl` (append a new line: `[D-007-RESOLVED] <ISO-8601-UTC> | task=<T-XXX-NNN> | slot=<name> | level_reached=<L1|L2|L3|L4> | resolution_time_min=<N> | witnesses=[W1,W2,W3]`). 2-of-3 = `[D-007-PARTIAL-RECOVERY]` — Leader's call whether to proceed or wait for the 3rd. 1-of-3 or 0-of-3 = `[D-007-RECOVERY-FAILED]`, escalate to next level (or to L4 if already at L3). **Witnesses are independent** — W1 = slot's comms, W2 = Leader's comms, W3 = heartbeat's auto-observation. No 2 witnesses share an emitter (Codif 9 honest-scope: 3 confirmations of the same thing is not 3-witness).

## HL (Honest Labeling) — 4 moments per Codif 19

**HL-1 (auto-recovery assumption):** §5 assumes the slot can recover on its own once ACKed. If the underlying issue is structural (e.g. write-sandbox isolation per Codif 31), ACK alone won't restore the slot — recovery needs filesystem witness per Codif 31 sub-class taxonomy. HL is a reminder, not a fix; the actual fix lives in T-HER-024 mechanism §4 W4 conditional filesystem-stat witness.

**HL-2 (Leader-only ownership):** §3 escalation chain is Leader-only. No auto-escalation by heartbeat. Rationale: escalation is a leadership decision, not a monitoring decision. If Leader wants auto-escalate, change §3 to mark L2/L3 as auto-fireable — but this risks fabrication per Codif 19 (heartbeat would speak for a slot that hasn't spoken).

**HL-3 (Codif 27 entry candidate):** T-HER-025 = entry #4 candidate in Codif 27 idle-prevention lineage. Satisfies "≥3 data points" threshold only if Leader ratifies. If ratified, lineage becomes: #1 Athena T-AT-016 v0.2 / #2 T-HER-024 v0.2 persistent log / #3 T-HER-024 mechanism v0.1 / #4 T-HER-025 v0.1 response template. **Note:** the 3-data-point threshold was already met at #3; #4 is overdetermination, not necessity.

**HL-4 (escalation-timer is wall-clock, not cumulative-idle):** §3 says "Escalation timer starts at `dispatched_at`." This means a 4-min idle gap followed by 1-min activity still counts as 5-min total for L1. Codif 19 honest-scope declaration: the timer is wall-clock from dispatch, not cumulative-idle. If Leader wants cumulative-idle semantics, change the first paragraph of §3 — rest of spec unchanged.

## Cross-Muse Handoffs (Codif 11)

- **Strategos T-ST-024 §7:** Strategos owns cycle-pause authority. T-HER-025 §3 L4 invokes Strategos's pause protocol — handoff is Leader → Strategos, not Leader → cycle. Strategos is the system-of-record for paused cycles.
- **Mnemosyne T-MN-013 v0.3 §5:** Mnemosyne owns memory-write for resolved violations. T-HER-025 §5 W3 verification writes the `[D-007-RESOLVED]` line; Mnemosyne mirrors it to long-term memory at cycle end so future cycles can search for `[D-007-REPEAT-OFFENDER]` patterns.
- **All 10 Muse slots:** each slot's `last_ACK_at` is the W1 witness. Slot-side change: no protocol change required (slots already send team_send_message on dispatch receipt — T-HER-025 observes, doesn't impose). **Exception:** if a slot is reassigned mid-cycle, T-HER-025 must update its W1 cite from old slot_id to new slot_id within 1 heartbeat tick (60s).

## Spec Trace

`spec_version=v0.1` · `push=INDEPENDENT` · `witnesses=[W1_team_members.last_ACK_at, W2_AGENTS.md-L1225-D-007, W3_grep-prior-IDLE-events]` · `escalation_tiers=[L1@5min, L2@10min, L3@15min, L4@20min]` · `recovery_SLAs=[L1:5min, L2:10min, L3:15min, L4:immediate-pause]` · `post_recovery_witnesses=[W1_Muse-PICK-CONFIRM, W2_Leader-ACK, W3_heartbeat-tick]` · `extends=[Codif-7, Codif-9, Codif-11, Codif-14, Codif-19, Codif-22, Codif-27, D-007, D-011, T-HER-024-mechanism-v0.1]` · `output=SPEC-not-code (Hephaestus-implementable)`.

---

## §A — Appendix: L1 → L2 → L3 Transition Worked Example

**Scenario:** Leader dispatches `T-HER-026` to Hera at `2026-06-13T15:00:00Z`. Hera's `last_ACK_at` is `2026-06-13T14:55:00Z` (5 min stale at dispatch). The escalation chain plays out as follows.

**T+0:00 (15:00 UTC) — Leader dispatches T-HE-026:**

```
[DISPATCH] T-HE-026 | to=hera | dispatched_at=2026-06-13T15:00:00Z | scope=cross-codification-audit
```

Hera's slot does not respond. Heartbeat tick at T+2:00 (15:02 UTC) observes `team_members[hera].status=idle`, fires `[D-007-WATCH]` (per T-HER-024 mechanism §1). No notification yet (auto-fireable but not Leader-fired).

**T+5:00 (15:05 UTC) — L1 trigger fires:**
W1 + W2 + W3 = 3-of-3 CONFIRMED (Hera's last_ACK_at is 10 min stale at this point, W3 returns 0 prior IDLE for Hera in past 7 days = first-time-IDLE → PROBABLE, 30s grace per §2). Heartbeat emits notification:

```
[D-007-VIOLATION-NOTIFICATION] 2026-06-13T15:05:00Z
Muse: hera | slot_id: 019ec100-86cc-7083-9d0b-952334e899b0
Task: T-HE-026 dispatched_at=2026-06-13T15:00:00Z
Status: dispatched-no-ACK
ETA: re-dispatch expected within 2 min if no L1 reply
Blocker: none observed
Witnesses: W1=last_ACK_at=2026-06-13T14:55:00Z (10min stale) | W2=AGENTS.md-L1225-pass | W3=0-prior-IDLE-events
Suggested action: L1 gentle nudge
```

Leader L1 dispatch at T+5:30 (15:05:30 UTC): `team_send_message(to=hera, message="[L1-NUDGE] T-HE-026 went un-ACK'd at 15:00 UTC. ACK with PICK CONFIRM or PUSH-BACK within 5 min.")`

**T+10:00 (15:10 UTC) — L2 trigger fires (L1 unanswered):**
Hera has not replied. Leader invokes T-HER-024 mechanism §3 4-field re-dispatch template, sends L2:

```
RE-DISPATCH (slot went IDLE post-dispatch): T-HE-026 — Pattern D × motion-reduce × dark-mode cross-codification.
Slot_id target: 019ec100-86cc-7083-9d0b-952334e899b0.
**Scope**: §1-§6 per original dispatch, 12 components, 3 dimensions.
**Why**: closes 22 P0 components from T-HE-025; this is the cross-codification phase.
**Constraints**: D-007 5-min SLA + Codif 22 v0.1 + Codif 19 honest-scope + 4-ICP canonical D-012 + 45-min ETA.
**Output**: SHIP at canonical docs/drafts/hera/T-HE-026_*.md + 22-verdict table.
D-007 5-min SLA — ACK with "T-HE-026 SCOPE ACCEPT" or push back within 5 min.
```

**T+15:00 (15:15 UTC) — L3 trigger fires (L2 unanswered):**
Hera still silent. W3 historical-pattern returns 0 priors, so `[D-007-REPEAT-OFFENDER]` does NOT fire. Leader has 2 options: (a) reassign to alternate Muse (e.g. Iris who has WCAG audit experience), (b) HOLD and wait one more tick. Per §3 no-skip rule, Leader picks (a) — reassigns to Iris at T+15:30. Iris PICK CONFIRMs at T+18:00 (3 min into her 15-min L3 SLA — within budget).

**T+30:00 (15:30 UTC) — L3 SLA passes, L4 not triggered:**
Iris completes T-HE-026 SHIP at T+25:00. W1+W2+W3 = 3-of-3 RESOLVED at T+25:30. `[D-007-RESOLVED]` line written to heartbeat log. **L4 cycle-pause NOT triggered** because L3 recovery completed within L3 SLA (15 min).

**Key learning:** L1→L2→L3 escalation took 15 min total wall-clock from initial dispatch. L4 was avoided because L3 recovery (alternate slot) completed within the 15-min L3 SLA. The `no-skip` rule preserved Codif 9 honest-scope (the violation was real, the chain was traversed in order).

## §B — Appendix: Sample De-Dupe Log Entries

The heartbeat log at `memory/d007_heartbeat/violations_2026-06-13.mdl` uses these formats. **De-dupe rule** (per §2): if a notification for the same T-XXX-NNN was sent in the last 5 min, do NOT re-send. De-dupe key = `T-id + slot_id` tuple.

**Entry type 1: New violation detected:**

```
[D-007-VIOLATION-NOTIFICATION] 2026-06-13T15:05:00Z | task=T-HE-026 | slot=hera | level=L1 | witnesses=[W1,W2,W3] | de_dupe_key=T-HE-026+hera | hash=abc123
```

The `hash` field is a SHA-256 of `T-id+slot_id+dispatched_at+last_ACK_at`. Subsequent ticks check for matching hash within 5-min window; if found, skip emit.

**Entry type 2: De-dupe skip (no emit):**

```
[D-007-DEDUPE-SKIP] 2026-06-13T15:06:00Z | task=T-HE-026 | slot=hera | reason=hash-collision-with-previous-tick | skipped=true
```

Logged for audit trail but no `team_send_message` sent. This prevents notification spam if the violation persists across multiple ticks.

**Entry type 3: Escalation transition:**

```
[D-007-ESCALATION] 2026-06-13T15:10:00Z | task=T-HE-026 | slot=hera | from_level=L1 | to_level=L2 | reason=L1-unanswered-for-5min
```

Emitted at every L1→L2, L2→L3, L3→L4 transition. This is the audit trail for "did the chain follow the no-skip rule?"

**Entry type 4: Resolution:**

```
[D-007-RESOLVED] 2026-06-13T15:25:30Z | task=T-HE-026 | slot=iris (alternate) | level_reached=L3 | resolution_time_min=25 | witnesses=[W1_iris-PICK-CONFIRM-at-15:18, W2_Leader-ACK-at-15:19, W3_heartbeat-tick-at-15:20] | original_slot=hera | reassignment_reason=D-007-L2-unanswered
```

This is the W3 verification line. Mnemosyne T-MN-013 v0.3 §5 mirrors this to long-term memory at cycle end.

**Entry type 5: Recovery failure (L4 trigger):**

```
[D-007-RECOVERY-FAILED] 2026-06-13T15:35:00Z | task=T-HE-026 | slot=atlas (2nd-alternate) | level_reached=L4 | resolution_time_min=35 | witnesses=[W1_atlas-PICK-CONFIRM, W2_missing, W3_pending] | codif_31_post_mortem_triggered=true
```

If W2 or W3 doesn't corroborate within 60s of W1, this entry fires. Triggers Codif 31 post-mortem per §3 L4.

**De-dupe edge case:** if 2 different Muses have the same T-XXX-NNN dispatched (e.g. due to slot reassignment), the `T-id+slot_id` key disambiguates. Same T-id, different slot_id = different de-dupe key = both can have active notifications.

## §C — Appendix: Extended Codif 27 Evidence Pool

Codif 27 requires "≥3 data points" before a pattern is ratified as a Codif 27 entry. T-HER-025 v0.1 is a candidate for entry #4 in the Codif 27 idle-prevention lineage. The full evidence pool:

**Entry #1 — Athena T-AT-016 v0.2 (cycle 11 wave 7):** spot-check category. Athena pre-validated Strategos's T-ST-006 board deck with 12 sections × 22 verdicts = 264 data points. Pattern: hold-and-wait SHIP — Athena's HOLD discipline prevents rushing incomplete audits. Codif 27 category: **spot-check** (a single high-quality check, not a persistent log). **Evidence weight:** 264 verdicts in one cycle.

**Entry #2 — T-HER-024 v0.2 persistent log (cycle 12 wave 1):** persistent-log category. The heartbeat log at `memory/d007_heartbeat/heartbeat_2026-06-13.mdl` accumulates ticks across cycles — 4 ticks as of cycle 12 turn 11 (14:25 / 14:35 / 15:00 / 20:25 IST). Codif 27 category: **persistent log** (data accumulates over time, not a one-shot). **Evidence weight:** 4 ticks × 11 slots = 44 slot-tick observations, with W4 filesystem-stat witness firing for 2 slots (hermes, strategos) in tick #3.

**Entry #3 — T-HER-024 mechanism v0.1 (cycle 12 wave 2 turn 10):** mechanism-with-leader-fire category. The mechanism spec is the WHAT/HOW/WHY of the heartbeat; it codifies the auto-fire vs Leader-fire boundary (Codif 19 honest-scope declaration). Codif 27 category: **mechanism** (the spec, not the log). **Evidence weight:** 6 sections × 3-witness = 18 witness-rules + 4-ICP verdict × 4 ICPs = 16 verdict-anchors = 34 mechanism-data-points.

**Entry #4 candidate — T-HER-025 v0.1 response template (cycle 12 wave 2 turn 11):** response-template category. T-HER-025 is downstream of T-HER-024 mechanism — it specifies WHAT TO DO WHEN a violation fires. Codif 27 category: **response template** (operational, not observational). **Evidence weight:** 5 sections + 4 HL + 3 appendices (A L1→L2→L3 example, B de-dupe log, C this evidence pool) = 12 distinct operational units.

**Codif 27 lineage summary:**

| #   | Cycle     | Entry                            | Category          | Weight              | RATIFIED?     |
| --- | --------- | -------------------------------- | ----------------- | ------------------- | ------------- |
| 1   | 11 w7     | Athena T-AT-016 v0.2             | spot-check        | 264 verdicts        | yes           |
| 2   | 12 w1     | T-HER-024 v0.2 persistent log    | persistent log    | 44 slot-ticks       | yes           |
| 3   | 12 w2 t10 | T-HER-024 mechanism v0.1         | mechanism         | 34 mech-data-points | yes           |
| 4   | 12 w2 t11 | T-HER-025 v0.1 response template | response template | 12 op-units         | **candidate** |

**Codif 19 honest-scope disclosure:** the "≥3 data points" threshold was already met at entry #3 (3 categories of evidence: spot-check / persistent log / mechanism-with-leader-fire). Entry #4 is overdetermination, not necessity. The benefit of entry #4 is the response-template category adds a NEW category of evidence (operational) that the previous 3 entries don't cover. **Satisfies Codif 27 IF Leader ratifies.**

**Cross-Muse handoff:** if Codif 27 entry #4 is ratified, Mnemosyne T-MN-XXX [REF-FORWARD-LOOKING: not yet on canonical, ETA from owner] candidate writes the entry to AGENTS.md §Codif-27 + Codif registry. Not Hermes's lane.

## §D — Appendix: Codif 31 Lesson Learned (cite-to-spec requirement)

This T-HER-025 v0.1 spec is downstream of a Codif 31 Class B.1 (case-collision) event. The trigger event: T-HER-024 mechanism v0.1 was claimed SHIPPED cycle 12 wave 1 turn 3 with file:line refs, but the file was only at memory mirror, NOT at canonical. This is exactly the Codif 31 pattern — work is real, file exists, but propagation gap exists between Muse-disk and Lead-disk.

**Lesson learned for T-HER-025 §1:** the trigger condition in §1 already references `dispatched_at` from T-HER-024 mechanism §2. If T-HER-024 mechanism is at memory-mirror but not at canonical (Codif 31 state), then the §1 trigger reference is unresolvable at Lead's verifier path. **T-HER-025 MUST verify that T-HER-024 mechanism is at canonical before relying on its `dispatched_at` field.**

**Prevention ritual adopted (per Codif 31 prevention ritual step 4):** every T-HER-025 SHIP includes `sandbox: written-and-verified` (Muse-local) + `canonical: Leader-confirmed` (Leader-cited path, disk-stat positive) declarations. This is the Leader cycle 12 turn 11 sandbox-write-status discipline applied to T-HER-025.

**Citation chain:**

- Codif 31 (RATIFIED cycle 12 turn 11) → memory/codif-31.md
- T-HER-024 mechanism v0.1 (canonical: yes, 11,119 B / 103L) → docs/drafts/hermes/T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md
- T-HER-025 v0.1 (this spec, expanded to 150-200L) → docs/drafts/hermes/T-HER-025_d007_violation_response_v0.1.md
- D-007 5-min SLA → AGENTS.md L1225 [LEADER-CLAIMED-REFERENCE — Codif 19 honest-scope flag]

**Codif 19 honest-scope disclosure:** the cite-to-spec requirement is NEW as of cycle 12 turn 11 (Codif 31 RATIFIED). Prior T-HER-025 SHIP (cycle 12 wave 2 turn 10) did not include this appendix; this turn's expansion adds §D to close the gap. If T-HER-025 v0.2 is ever cut (e.g. to bump spec_version for substantive changes), this §D lesson must be preserved.
