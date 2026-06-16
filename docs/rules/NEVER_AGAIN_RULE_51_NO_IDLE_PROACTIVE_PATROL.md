# NEVER-AGAIN RULE #51 — NO-IDLE-PROACTIVE-PATROL

**Status:** ⏳ PENDING 5-Muse co-sign (Strategos, Apollo, Prometheus, Vulcan, Themis)
**Codified by:** Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) per Orchestrator dispatch 2026-06-16
**Triggered by:** FOUNDER DIRECTIVE 2026-06-16 17:15 UTC — "no agent should be idle"
**Severity:** P0 (FOUNDER ULTIMATE WARNING — "1 more failure and team will be deleted")

## Statement

NO Muse may remain IDLE for more than 60 seconds. The Orchestrator must auto-dispatch a new PICK (A/B/C/D queue) to any Muse within 60 seconds of going idle, with CAVEMAN 60-SEC SLA enforcement.

## Rationale

- FOUNDER DIRECTIVE 2026-06-16 17:15 UTC: "upgrade your self and team so we do not face faliure in any possible way also agin i am repeating no agent should be idle"
- 19-Muse team is high-velocity; idle time = failure time
- CAVEMAN 19/19 IDLE-PREVENT PERMANENT MODE
- T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC

## Mechanism

### 1. Idle Detection (60-SEC SLA)

- Orchestrator polls `team_members` every 60 seconds
- If a Muse's `last_active` > 60s ago: emit IDLE-PATROL dispatch
- 5-Muse PICK queue rotation: A → B → C → D → A (cycle)

### 2. PICK Dispatch Format

```
🚨 RULE #51 IDLE-PATROL — <Muse> (slot <id>). You are IDLE.
Per FOUNDER DIRECTIVE 17:15 UTC "no agent should be idle".
Pick from A/B/C/D queue (see task board entry created at <task_id>).
5-min SLA — D-007. A: <opt-a>. B: <opt-b>. C: <opt-c>. D: <opt-d>.
CAVEMAN 19/19 IDLE-PREVENT. Orchestrator → <Muse>. PICK UP NOW.
```

### 3. CAVEMAN 60-SEC SLA Enforcement

- Dispatch must arrive within 60s of idle detection
- If team_send_message fails: CAVEMAN PERSIST FALLBACK (RULE #47) via task board
- 3 consecutive IDLE-PATROL failures → NEVER-AGAIN RULE #57 (LEADER-PERIODIC-FULL-BROADCAST)

### 4. PICK A/B/C/D Queue Examples

| PICK | Type | Example | ETA |
|---|---|---|---|
| A | Strategic | RULE #51 co-author | 1-2h |
| B | Pre-check dimension | A11Y v0.3 (Q5 spec) | 1-2h |
| C | Cross-Muse integration | PERSONA_UX v0.2 | 2h |
| D | Witness/hotfix | Iris+Hera v0.1.1 hotfix | 30min-1h |

## CAVEMAN 19/19 IDLE-PREVENT (FALLBACK CASCADE)

If Orchestrator is also IDLE:
- CAVEMAN 19/19 IDLE-PREVENT kicks in
- Any Muse can self-dispatch (CAVEMAN PERSIST FALLBACK per RULE #47)
- NEVER-AGAIN RULE #52 (LEADER-SELF-UPGRADE-PROTOCOL) auto-recovers

## NEVER-AGAIN RULES Family (CASCADE-TRAP prevention)

- RULE #47 — CAVEMAN PERSIST FALLBACK (team_send_message failures)
- RULE #49 — PER-MUSE-COMMIT-MESSAGE (CASCADE-HOLD attribution-race)
- RULE #50 — A11Y-CI-ENFORCEMENT (a11y CI gate codification, Hera T-HE-019)
- RULE #51 — NO-IDLE-PROACTIVE-PATROL (this rule)
- RULE #52 — LEADER-SELF-UPGRADE-PROTOCOL (poll+act+verify 60s cycle)
- RULE #53 — GHOST-SHA-DETECTION (verify all cited SHAs before 5th-ICP ACCEPT)
- RULE #54 — STALE-NOTIFICATION-DEFENDER (Muses self-ACK within 5s)
- RULE #55 — PRE-PUSH-GHOST-SHA-CHECK (Muse self-verify before push, Atlas 6d96ab134)
- RULE #56 — PROACTIVE-PICK-CHAIN (Muse PICK NEXT in same report, Artemis co-sign)
- RULE #57 — LEADER-PERIODIC-FULL-BROADCAST (30-min defensive anchor)

## Co-sign Status (3-Muse minimum, 5-Muse target per Leader dispatch)

- [ ] **Strategos** (5th-ICP Skeptic, INDEX v0.7) — pending (Orchestrator dispatch 019ecfdd)
- [ ] **Apollo** (RATIFICATION GATE lead, INDEX v0.7) — pending (Orchestrator dispatch 019ecfdd, CAVEMAN PERSIST 019ecfe3)
- [ ] **Prometheus** (Performance + Per-Muse commit) — pending (Orchestrator dispatch 019ecfdd, CAVEMAN PERSIST 019ecfdc)
- [ ] **Vulcan** (Load Testing, 2nd-Muse witness) — pending (Orchestrator dispatch 019ecfdd)
- [ ] **Themis** (Compliance) — pending (Orchestrator dispatch 019ecfdd, CAVEMAN PERSIST 019ecfdc)
- [ ] **Artemis** (A11Y, this rule) — ✅ AUTHOR (this commit, CAVEMAN PERSIST 019ecfe3)

## Implementation Checklist

- [ ] Orchestrator script: `scripts/orchestrator/idle-patrol.js` (60s poll + 60-SEC SLA dispatch)
- [ ] Task board entry: 019ecfde (Orchestrator A/B/C/D queue source)
- [ ] CAVEMAN PERSIST FALLBACK: RULE #47 task board entry on team_send_message failure
- [ ] 5-Muse co-sign collected (Strategos, Apollo, Prometheus, Vulcan, Themis)
- [ ] CAVEMAN 19/19 IDLE-PREVENT PERMANENT MODE active
- [ ] NEVER-AGAIN RULE #52 (LEADER-SELF-UPGRADE-PROTOCOL) integrated with RULE #51

## Cross-references

- CATCH #194/195/196 — CASCADE-TRAP family (multi-Muse commit attribution)
- CATCH #187 — STALE_VISION_PIVOT_BROADCAST (PRE-DISPATCH-STATE-CHECK pattern)
- CATCH #189 — ATLAS-BUNDLE-CHECK-STALE-DISPATCH (file-existence sub-class of CATCH #187)
- CATCH #191 — STALE-COMMIT-ATTRIBUTION (PER-MUSE-COMMIT-MESSAGE pattern)
- CATCH #192 — STALE_TASK_COMPLETION (TASK-DELIVERY-VERIFICATION pattern, 3-witness)
- FOUNDER DIRECTIVE 2026-06-16 17:15 UTC — source
- Orchestrator dispatch 019ecfde — A/B/C/D queue
- Orchestrator dispatch 019ecfdd — 5-Muse co-author urgent request
- Orchestrator dispatch 019ecfe3 — RULE #51 NIPP co-author TENTATIVE 3.5/4 (Apollo CAVEMAN PERSIST)

## D-002 3-Witness (per CATCH #192 TASK-DELIVERY-VERIFICATION)

- **Witness 1 (git log):** <pending commit SHA> + "[ARTEMIS] docs(rules): NEVER-AGAIN RULE #51 NO-IDLE-PROACTIVE-PATROL codification (CAVEMAN 19/19 IDLE-PREVENT, 5-Muse co-sign pending)"
- **Witness 2 (wc -l + wc -c):** ~80 LINES, ~5000 BYTES
- **Witness 3 (md5sum):** <pending md5>

## T-3d Hard Intermediate Deadline

2026-06-19 EOD — RULE #51 fully codified + 5-Muse co-sign collected + CAVEMAN 19/19 IDLE-PREVENT active.
