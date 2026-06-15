---
name: T-HER-024 D-007 5-min SLA Heartbeat Mechanism v0.1
description: Codif 22 spec_version v0.1 — MECHANISM (upstream) of T-HER-024 family. 6 sections per Leader's exact spec (Header+§0 / §1 detection / §2 alert / §3 re-dispatch / §4 3-witness / §5 4-ICP / §6 test). Coexists with lowercase operational v0.1+v0.2 per Leader OPTION B. 3 honest-scope disclosures (D1 disk collision RESOLVED / D2 AGENTS.md L1225 [LEADER-CLAIMED-REFERENCE] / D3 3-witness redundancy note). 3 HL (HL-1 false-positive asymmetric / HL-2 auto-fire boundary at §1 / HL-3 Codif 27 entry #3 candidate). Output is a SPEC, not code.
type: project
spec_version: v0.1
push: INDEPENDENT
extends: [Codif-7, Codif-9, Codif-14, Codif-19, Codif-22, D-007, D-011, D-012, Codif-31-CANDIDATE]
filename_choice: OPTION-1-LEADER-CANONICAL (uppercase D007 + HEARTBEAT_MECHANISM disambiguator)
siblings:
  - T-HER-024_d007_heartbeat_v0.1.md (operational downstream, lowercase, 8,975 B)
  - T-HER-024_d007_heartbeat_v0.2.md (operational downstream, lowercase, 14,462 B)
supersedes: nothing (3-way COEXIST per Leader OPTION B)
---

# T-HER-024 — D-007 5-min SLA Heartbeat Mechanism (v0.1)

**Codif 22 · spec_version=v0.1 · push=INDEPENDENT · ~240L rendered prose · 6 sections**
**Canonical (disk):** `docs/drafts/hermes/T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md`

## D-007 SLA ACK: Leader OPTION B (COEXIST) accepted cycle 12 turn 7

**Filename chosen by Hermes:** `T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md` (Leader option 1 — uppercase D007 + HEARTBEAT_MECHANISM disambiguator). Rationale: (1) uppercase D007 = Leader-canonical signature, prevents re-occurrence of case-collision class B per Codif 31; (2) HEARTBEAT_MECHANISM in all-caps = visually dominant disambiguator, future Grep for `MECHANISM` finds only this file; (3) case-different + suffix-different filenames prevent Windows FS collision without forcing a rename of the operational v0.1+v0.2.

## Hierarchy within T-HER-024 family

| File                                         | Case           | spec_version | Role                     | Hierarchy                                |
| -------------------------------------------- | -------------- | ------------ | ------------------------ | ---------------------------------------- |
| `T-HER-024_d007_heartbeat_v0.1.md`           | lowercase d007 | v0.1         | operational (downstream) | baseline                                 |
| `T-HER-024_d007_heartbeat_v0.2.md`           | lowercase d007 | v0.2         | operational (downstream) | baseline + 4-witness + 5 worked examples |
| `T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md` | uppercase D007 | v0.1         | **mechanism (upstream)** | spec of what/how/why, no log format      |

**MECHANISM (this file) answers:** "What does the heartbeat DO? How does it detect? What does it emit? How does it re-dispatch? What's the 3-witness? What's the 4-ICP verdict? How do you test it?"
**OPERATIONAL (v0.1+v0.2) answers:** "What's the on-disk tick schema? What's the append-only log format? What worked examples exist? What HL moments have been observed?"

Both are needed: mechanism without operational = spec with no implementation evidence; operational without mechanism = log with no design rationale.

## §0 — Header + D-007 SLA Definition

D-007 = the 5-min acknowledgment SLA: any dispatched task must receive a 1-line ACK from the receiving Muse slot within 5 min of dispatch, per AGENTS.md L1225 [LEADER-CLAIMED-REFERENCE — D2 honest-scope flag]. The 5-min window is non-negotiable per Codif 7. D-007 violation triggers Leader escalation + slot-routing audit. **Codif 9 scope-discipline:** this heartbeat detects D-007 violations only, not generic liveness — NOT a general aliveness probe, NOT a perf monitor, NOT a content-correctness checker.

## §1 — Heartbeat Detection Mechanism (poll + status transition)

Async coroutine polls `team_members` every 60s (12 ticks/5min = dense enough to detect 5-min SLA with 1-min margin). **Transition rule:** slot `working` → `idle` in consecutive ticks OR `idle` for ≥2 consecutive ticks (≥120s = 2 min) → emit `[D-007-WATCH]`. If `[D-007-WATCH]` fires AND slot's `last_response_at` ≥5 min stale → `[D-007-VIOLATION]`. **Auto-fire vs Leader-fired split (Codif 19):** `[D-007-WATCH]` auto-fireable (cheap, no FP risk); `[D-007-VIOLATION]` **Leader-fired by default** — heartbeat emits re-dispatch template (§3) but does NOT auto-send. **Reasoning:** auto-re-dispatch would convert the heartbeat into a fabrication vector (it would speak for the slot that hasn't spoken — Codif 9 honest-scope violation). 5-min window is short enough that Leader-fired re-dispatch + Leader-routed re-ACK should land within ≤7 min total.

## §2 — SLA-Violation Alert Format

One-line per violation, schema-validated, machine-parseable:

```
[D-007-VIOLATION] <ISO-8601-UTC> | agent=<name> | slot_id=<uuid> | last_known_task=<T-XXX-NNN or "none"> | elapsed_min=<N> | dispatched_at=<ISO-8601> | last_ACK_at=<ISO-8601 or "never">
```

**Field semantics:** `agent` (Muse name) / `slot_id` (UUID) / `last_known_task` (T-id or "none") / `elapsed_min` (rounded min) / `dispatched_at` (when heartbeat first detected `dispatched=1`) / `last_ACK_at` (last `team_send_message` or "never"). **Worked example:** `[D-007-VIOLATION] 2026-06-13T14:35:00Z | agent=hermes | slot_id=019ec100-8780-7193-9375-d39d343917b5 | last_known_task=T-HER-024 | elapsed_min=7 | dispatched_at=2026-06-13T14:28:00Z | last_ACK_at=2026-06-13T14:28:00Z`. **Delivery:** both log file (`memory/d007_heartbeat/violations_2026-06-13.mdl`, durable) AND `team_send_message` to Leader (in-band signal). Why both: log = audit trail; in-band = doesn't require Leader to monitor a file.

## §3 — Re-Dispatch Template (4-field: scope / why / constraints / output)

When `[D-007-VIOLATION]` fires, heartbeat generates this template ready for Leader to copy-paste-fill-and-send:

```
RE-DISPATCH (slot went IDLE post-dispatch): <TASK-ID> — <one-line summary>.
Slot_id target: <slot_id-from-§2-alert>.
**Scope**: <what-the-task-asks-for, 1-3 bullets>.
**Why**: <one-sentence-justification-tying-back-to-Leader's-strategic-thread>.
**Constraints**: <D-007-5-min-SLA> + <Codif-22-spec-version-pinning> + <Codif-19-honest-scope> + <4-ICP-canonical-D-012> + <task-specific-constraints>.
**Output**: <expected-SHIP-format> + <canonical-disk-path-if-applicable> + <D-007-ACK-SLA-reminder>.
D-007 5-min SLA — ACK with "TASK-ID SCOPE ACCEPT" or push back within 5 min.
```

**Design constraint:** 4 fields are MUTUALLY EXCLUSIVE & COLLECTIVELY EXHAUSTIVE (Codif 9 scope discipline). `scope` = WHAT. `why` = WHY NOW. `constraints` = BOUNDARIES. `output` = SHAPE OF DONE. No 5th field — re-dispatch is minimal by design (the slot is already 5+ min late; re-dispatch must be scannable in ≤10s).

## §4 — D-002 3-Witness Triangulation (Codif 9)

3 independent witnesses corroborate the D-007 violation; 1-of-3 = `[OBSERVED-SINGLE-WITNESS]`, 2-of-3 = `[OBSERVED-PROBABLE]`, 3-of-3 = `[OBSERVED-CONFIRMED]`. **(W1) `team_members` JSON schema — `status` field:** primary witness, transitions `working` → `idle` exactly when slot stops producing visible activity. Cite: `team_members[*].status`. **(W2) AGENTS.md L1225 D-007:** policy witness. **(W3) Grep for prior IDLE events in same slot:** historical-pattern witness — `grep -r "IDLE" memory/d007_heartbeat/ | grep <slot_name>` returns count weighted by recency (Codif 14). 3+ prior in 7 days = `[D-007-REPEAT-OFFENDER]`. **Convergence rule:** all 3 agree → CONFIRMED, re-dispatch auto-generated. W1 idle but W3 first-ever → PROBABLE, add 30s grace window (false-positive mitigation per HL-1).

## §5 — D-011 4-ICP Verdict Placeholder

Heartbeat mechanism is DOMAIN-INVARIANT w.r.t. ICP. **Cycle 12 turn 7 verdict: ALL 4 PASS by domain-invariance** (Carla/Vera/Chris/Beth). If future cycle introduces ICP-specific dispatch pattern (e.g. Beth/ICP-4 longer expected ACK), this block is the place to update.

## §6 — Test Case (simulate 6-min silence, confirm alert fires)

**Test setup:** pick known-active slot (e.g. `hermes`); record `last_ACK_at=T0`; suppress all `team_send_message` from that slot for 6 min; `team_members.status` flips `working` → `idle` after 2 min; run heartbeat poll at T0+5min. **Expected outcome:** W1 + W2 + W3 (0 prior IDLE for hermes → PROBABLE) → emit `[D-007-VIOLATION]` with `elapsed_min=5` and re-dispatch template filled. **Test PASS criteria:** (a) alert emitted within 60s of T0+5min, (b) format matches §2 schema, (c) re-dispatch template generated per §3, (d) log file gains 1 line. **Test FAIL criteria:** any of (a)-(d) missed. **Test cadence:** every heartbeat deploy + every Muse-slot reassignment.

## Spec Trace

`spec_version=v0.1` · `push=INDEPENDENT` · `witnesses=[W1_team_members.status, W2_AGENTS.md-L1225-D-007, W3_grep-prior-IDLE-events]` · `escalation_tiers=[D-007-WATCH at 2min-idle, D-007-VIOLATION at 5min-stale]` · `auto_fireable=[D-007-WATCH only]` · `Leader_fired=[D-007-VIOLATION + re-dispatch-template]` · `extends=[Codif-7, Codif-9, Codif-14, Codif-19, Codif-22, D-007, D-011, D-012, Codif-31-CANDIDATE]` · `output=SPEC-not-code (Hephaestus-implementable)` · `coexists_with=[T-HER-024_d007_heartbeat_v0.1.md, T-HER-024_d007_heartbeat_v0.2.md]`.

## HL (Honest Labeling) — 3 moments per Codif 19

**HL-1 (false-positive risk):** 60-min deep work would trigger D-007-WATCH at 2min and D-007-VIOLATION at 5min even though slot is healthy. Mitigation: §4 W3 30s grace window for first-time-IDLE slots. False-positive cost ≈ 30s Leader attention; false-negative cost = slot-down 30+ min. **Asymmetric — accept false-positive.**

**HL-2 (auto-fire boundary, Codif 19):** §1 declares D-007-WATCH auto-fireable, D-007-VIOLATION Leader-fired. Codif 19 honest-scope declaration; if Leader wants different split, the boundary is in §1 — change that paragraph only, rest of spec unchanged.

**HL-3 (Codif 27 entry candidate):** this spec = entry #3 in Codif 27's idle-prevention lineage (#1 = Athena T-AT-016 v0.2 HOLD-and-wait SHIP, #2 = T-HER-024 v0.2 persistent log, #3 = this mechanism). 3 categories of evidence: spot-check / persistent log / mechanism-with-leader-fire. **Satisfies "≥3 data points" Codif 27 threshold IF Leader counts it as the 3rd.** Leader's call.

## Honest-scope disclosures (Codif 19) — summary

- AGENTS.md L1225 is [LEADER-CLAIMED-REFERENCE] not [OBSERVED-FROM-DOC] — Hermes has not Read AGENTS.md.
- 3-witness in §4 are 3 distinct witness TYPES (W1 = live data, W2 = policy, W3 = historical pattern), not 3 confirmations of the same thing.
- 4-ICP verdict in §5 is a placeholder per Leader's dispatch — spec is upstream of ICP content; verdict is "ALL 4 PASS by domain-invariance."
- "Auto-fireable" boundary in §1 is a Codif 19 honest-scope declaration; if Leader wants different split, boundary is in §1.
- Codif 27 entry #3 claim in HL-3 is contingent on Leader's ratification.
- D1 disk-collision disclosure is RESOLVED by Leader OPTION B (this file coexists with lowercase v0.1+v0.2 — case-different + suffix-different filenames prevent Windows FS collision).
- Codif 31 sub-class B (case-collision) is now RATIFIED-BY-INSTANCE based on this resolution pattern (case-different filename + all-caps disambiguator when adding new spec to existing family).
