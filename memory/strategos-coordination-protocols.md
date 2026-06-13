---
name: strategos-coordination-protocols
description: Standing operational protocols for Strategos when shipping v0.X, coordinating with Themis/Leader/Athena, and managing the cycle board deck workstream. Captures 2026-06-13 Themis courtesy-ask + standing handoff patterns.
type: feedback
---

# Strategos Coordination Protocols

Established 2026-06-13 cycle-7 close. Codifies the operational protocols that emerged from 70+ ACCEPT cycle, the 4-Muse "honest labeling" cohort, and Themis's continuous-monitoring feedback.

## 1. Courtesy-ping protocol on v0.X ships (Themis ask, 2026-06-13)

When shipping **any** version-bump (v0.X) of a Strategos-owned deliverable, send a [SHIP] ping to BOTH:

- **Themis** (slot `019ebda3-cbaa-7282-9a87-aedf8eecb72e`) — for DASHBOARD.md + MONITORING_LOG real-time update
- **Leader** (slot `019ebcaa-14d3-7a20-82a6-91ce66970a39`) — for cycle-level ACK

**Format:**

```
[SHIP v0.X] FILE: <path> | SIZE: <XL/ΔL> | DELTA: <N lines> | D-002: <$X claim count> | D-009: <N file:line citations> | ETA to next: <N min>
```

This is a **courtesy ask, not a protocol requirement** (per Themis's verbatim). The work still counts as ACCEPT regardless of ping timing. But real-time pings keep the cumulative tracker honest and reduce Themis's silent-ship-detection overhead.

**Anti-pattern (what NOT to do):** Ship v0.X + only ping Leader. Themis detects "silent ship" via DASHBOARD drift, which adds 5-10 min of verification work for Themis. Avoidable.

## 2. Athena handoff pattern (T-AT-011 cycle)

When Strategos ships a board deck v0.X and Athena T-AT-011 v0.(X+1) is the next re-validation task:

1. Strategos ships v0.X with [SHIP] ping to Themis + Leader
2. Strategos sends direct trigger message to Athena slot `019ebcd6-43a4-7ea0-bf4f-22382c665bed` with:
   - File path
   - N fixes applied (with before/after)
   - D-009 verification hints
   - 12/12 APPLY target
3. Athena re-validates (~10 min for surgical NEEDS-FIX closure; 30+ min for full 12-section pass)
4. Strategos pings Themis with the verdict (ACCEPT or NEEDS-FIX with v0.(X+1) ETA)

**Standard Athena re-validation time:** 10 min for surgical closures (3 string + 2 doc-quality typical); 30 min for full 12-section pass.

## 3. Founder-ratification tag discipline

For any decision-packet Strategos produces (D-NNN tag), the structure is:

- §1 Why now (trigger)
- §2 Domain context (regulations/frameworks)
- §3 Options table (3+ options with $/yr/headcount)
- §4 Recommendation + Three-Witnesses
- §5 Founder-ratification tag with:
  - Proposed decision text (verbatim)
  - Cross-link targets (5+ downstream artifacts)
  - **Hard deadline** (e.g., 2026-09-15 before Beta launch)
  - Founder action checklist (5+ items)
  - Sign/date line

**Namespace policy (2026-06-13 Leader ratification, line 11 of STRATEGIC_DECISIONS_LOG.md):** D-000..D-009 grandfathered; next decision = D-010; increment by 1 per ratification.

## 4. v0.X ship discipline (the 4 "honest labeling" moves)

When a downstream Muses (Athena, Mnemosyne, Hephaestus, etc.) flags a NEEDS-FIX on a v0.(X-1) ship:

1. **Acknowledge the gap** in the [SHIP] ping: "v0.(X-1) had [N errors] found by [Muse] in v0.Y re-validation"
2. **Apply the fixes** with surgical Edit calls (not full rewrite)
3. **Bump to v0.X** with explicit changelog entry citing the upstream verdict (e.g., "v0.4 (2026-06-13): Athena T-AT-011 v0.2 NEEDS-FIX closure — (1) §5 L97 ...")
4. **Update header + footer** to v0.X (line 1 + last line)
5. **Grep-verify** the 5+ fixes with positive + negative evidence
6. **[SHIP] ping** with the D-009 evidence

**Anti-pattern:** Going from v0.(X-1) directly to v0.(X+1) without documenting the v0.X transition. The header + footer + changelog must be 3-of-3 consistent.

## 5. 4-Muse "honest labeling" cohort (maintain the standard)

The 4-Muse cohort as of 2026-06-13:

1. **Hephaestus** — T-HEP-005 pen-test gap (acknowledged "TO-BE-CREATED Phase 1" with date stamp)
2. **Strategos v0.2** — Felix removal (ICP-numbering reconciliation, not silent drop)
3. **Mnemosyne v0.3** — 4-question framework (TENTATIVE marker for any unverifiable claim)
4. **Strategos v0.3/v0.4** — count typo fix (192 pages / 274 components / 0 reports removed)

**Cohort principle:** When a deliverable has a gap, the gap is **labeled in the deliverable**, not hidden. The 4-Muse cohort is the gold standard; new "honest labeling" additions should be referenced in cross-Muse handoffs so the pattern propagates.

## 6. Standing handoff targets (cycle-7 final state)

| Muse       | Slot                                   | Re-ping on                                                                                              |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Leader     | `019ebcaa-14d3-7a20-82a6-91ce66970a39` | Every v0.X ship, every cycle close                                                                      |
| Themis     | `019ebda3-cbaa-7282-9a87-aedf8eecb72e` | Every v0.X ship (courtesy-ping), every D-NNN ratification                                               |
| Athena     | `019ebcd6-43a4-7ea0-bf4f-22382c665bed` | Board deck v0.X ship (T-AT-011 v0.(X+1) trigger), Q3 review v0.X ship (T-AT-011 v0.(X+1) re-validation) |
| Mnemosyne  | `019ebcd6-43a4-7ea0-bf4f-22382c665bed` | Cross-Muse ripple events (D-009 ICP-numbering fixes)                                                    |
| Hephaestus | `019ebcd6-4372-7a52-ba61-778372c520a0` | D-010 ratification (5 downstream artifact updates), ISO 27001 RFP handoff                               |
| Atlas      | `019ebd9c-bf19-7110-8710-864159fd33ba` | D-010 ratification (DR runbook L232 update), HSM 2027 handoff (Sc3 RTO update)                          |

## 7. Cycle board-deck workstream pattern (the closed loop)

```
Strategos ships v0.X (board deck)
    → Themis [SHIP] ACK
    → Athena T-AT-011 v0.(X+1) re-validates (10-30 min)
    → Athena verdict: 12/12 APPLY | NEEDS-FIX | HOLD
    → Strategos ships v0.(X+1) (if NEEDS-FIX) or marks cycle closed (if APPLY)
    → Themis [SHIP CLOSE] ACK
    → Leader cycle-close ACK
    → Cycle board-deck workstream CLOSED
```

**Standard cycle close time:** 30-45 min from Strategos v0.X ship to cycle closed (Athena 10 min re-validation + Strategos 5-10 min fixup if NEEDS-FIX + Themis ACK + Leader cycle close).

---

**Status:** v1.0 — established 2026-06-13 cycle-7 close, codifying Themis courtesy-ask + 4-Muse "honest labeling" cohort + 4 standing handoff patterns.

**Cross-refs:** `memory/persona-strategos.md` (Strategos persona), `docs/drafts/TASKBOARD.md` (cycle-7 next-wave), `docs/STRATEGIC_DECISIONS_LOG.md` line 11 (D-NNN namespace policy).
