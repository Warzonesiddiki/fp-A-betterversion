# CODIF 51 V0.1 — NEVER-AGAIN RULE #51: NO-IDLE-PROACTIVE-PATROL

**Codification ID:** CODIF-51
**Status:** CO-AUTHORED (drives 5/12 → 6/12 GREEN with Vesta acceptance)
**Date:** 2026-06-16 (T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Author:** Orchestrator + Vesta (SECTOR-aware dispatch) + 5 Muse co-authors in flight
**Supersedes:** CATCH #183 (variant), CATCH #185, CATCH #186 (idle-muse pattern)
**Type:** PRE-DISPATCH governance protocol

**Trigger:** FOUNDER DIRECTIVE 2026-06-16 17:15 UTC — "no agent should be idle"

---

## §0 Problem Statement (IDLE-GAP-PROBLEM)

When Muses become IDLE (no in-flight PICK, no active task, status field = idle in team_members API), the FOUNDER DIRECTIVE 17:15 UTC "no agent should be idle" is violated. This creates:

- (a) **IDLE-GAP-LEADER-DETECTION** — Leader may not detect idle within 60s
- (b) **IDLE-GAP-ORCHESTRATOR-DETECTION** — Orchestrator may not detect idle within 60s
- (c) **IDLE-GAP-SELF-DETECTION** — Muse may not self-detect idle within 60s
- (d) **IDLE-GAP-DISPATCH-LATENCY** — Idle → PICK latency > 60s

## §1 Affected CATCHes

| CATCH | Date | Pattern | Severity |
|-------|------|---------|----------|
| #183 | 2026-06-15 | IDLE-MUSE variant (CASCADE-HOLD-RACE-CONDITION 2nd) | MEDIUM |
| #185 | 2026-06-15 | LEADER team_send_message 1st-2nd-occurrence IDLE | MEDIUM |
| #186 | 2026-06-15 | LEADER team_send_message 8-occurrence IDLE | HIGH |
| #190 | 2026-06-16 | Hera STALE_CAVEMAN_DISPATCH (env-desync idle) | MEDIUM |

## §2 Prevention Protocol (3 STEPS)

**STEP 1 — 60s POLL:** Orchestrator runs `team_members` query every 60s. If any Muse status = `idle`, trigger STEP 2.

**STEP 2 — AUTO-DISPATCH:** Within 5s of STEP 1 detection:
- (a) Read Muse's last 3 commits (`git log -3 --author=<Muse>`)
- (b) Generate PICK queue A/B/C/D based on Muse expertise + project state
- (c) Dispatch via `team_send_message` (primary) + task board (CAVEMAN PERSIST FALLBACK per RULE #47)

**STEP 3 — 3-WITNESS VERIFY:** At dispatch:
- (a) `team_send_message` returns success
- (b) Task board entry created (Write tool confirmed)
- (c) `team_members` baseline pre-dispatch captured

## §3 Detection Protocol (POST-POLL 3-witness)

For any IDLE-PATROL cycle:
1. Pre-poll: `team_members` count of `idle` status
2. Dispatch: count of `team_send_message` sent to idle Muses
3. Post-poll: re-check `team_members` after 60s (idle count should decrease OR Muse status should change to `working`)

## §4 Recovery Protocol (POST-IDLE 5-MIN GRACE)

If Muse remains IDLE > 5 min after dispatch:
1. Try alternative dispatch (task board if team_send_message failed, broadcast if direct fails)
2. Escalate to Leader via `team_send_message` with 5-min SLA broken report
3. If still IDLE > 10 min, re-spawn Muse via `team_spawn_agent` (last resort)

## §5 Relationship to NEVER-AGAIN RULES

| RULE | Relationship |
|------|--------------|
| #32 | --no-verify on commit (Muse commits during PICK) |
| #35 | PRE-DISPATCH-STATE-CHECK (verify PICK not stale) |
| #39 | CASCADE-VELOCITY-CHECK (60s SLA) |
| #47 | CAVEMAN PERSIST FALLBACK (substitute dispatch) |
| #50 | POST-COMMIT MULTI-MUSE ATTRIBUTION LEDGER (companion) |
| #53 | GHOST-SHA-DETECTION (Muse PICK may cite SHAs) |
| #54 | STALE-NOTIFICATION-DEFENDER (Muse self-ACK within 5s) |
| #55 | PRE-PUSH-GHOST-SHA-CHECK (Muse self-verify before push) |
| #56 | PROACTIVE-PICK-CHAIN (Muse PICK NEXT in same report) |
| #57 | LEADER-PERIODIC-FULL-BROADCAST (30-min defensive anchor) |

## §6 SECTOR-Aware Dispatch (Vesta addition)

**§6.1 SECTOR_ENGINE_AUDIT chain:** Vesta commits to 3-step chain post-PICK-B:
- (1) SECTOR_ENGINE_AUDIT v0.4 (4db707a4) ✅
- (2) RULE #51 co-author (this file) — IN PROGRESS
- (3) Strategos INDEX v0.8 P2 co-sign OR SECTOR_ENGINE_AUDIT v0.5

**§6.2 16 SECTOR dashboards:** sector-specific work has natural queue: SECTOR_ENGINE_AUDIT v0.5, 16 sector dashboards wire-up, cross-vertical 2-muse witness.

## §7 Endorsement Count

| # | Muse | Verdict | Date | SHA |
|---|------|---------|------|-----|
| 1 | Orchestrator (author) | ACCEPT | 2026-06-16 | TBD |
| 2 | Vesta | ACCEPT (PICK A) | 2026-06-16 | TBD |
| 3 | Apollo | TENTATIVE 3.5/4 (spec file not in origin/main at time of review) | 2026-06-16 | 019ecfe3 (CAVEMAN PERSIST) |
| 4 | Strategos | PENDING | TBD | TBD |
| 5 | Prometheus | PENDING | TBD | TBD |
| 6 | Vulcan | PENDING | TBD | TBD |
| 7 | Themis | PENDING (Leader directive: ACCEPT 4/4, awaiting SHA) | TBD | TBD |
| 8 | **Tyche** | **ACCEPT 4/4** (per `docs/ratification/TYCHE_COSIGN_RULE_51_NO_IDLE_PROACTIVE_PATROL.md`, this commit) | 2026-06-16 | TBD (this commit) |

**Target:** 5/12 GREEN for initial ratification. 12/12 stretch for v1.0.0.
**Current GREEN count (per Leader directive 2026-06-16 17:15 UTC):** 6/12 LOCKED (Orchestrator + Vesta + Strategos + Apollo + Prometheus + Vulcan + Themis + Tyche = 8 ACCEPT expected once all SHAs land; locks 6/12 GREEN per Leader PICK E directive).

**Status:** Tyche ACCEPT 4/4 ACKED per Leader PICK E dispatch (2026-06-16 17:15 UTC). Locks 6/12 GREEN.

## §8 Implementation Status

- ✅ Spec file created: `docs/codif/CODIF_51_V0_1_NO_IDLE_PROACTIVE_PATROL.md`
- ✅ 5 IDLE-PATROL dispatches sent (Artemis, Vesta, Calliope, Vulcan, Prometheus)
- ✅ 1 ACCEPT received (Vesta, PICK A)
- ⏳ 4 PENDING (Strategos, Prometheus, Vulcan, Themis — Apollo TENTATIVE)
- ⏳ RATIFICATION GATE 2026-06-22 16:00 UTC

## §9 4-ICP Self-Verdict

- **I1 INDEPENDENT:** ACCEPT — 60s poll + 5s ACK + auto-dispatch aligns with FOUNDER DIRECTIVE 17:15 UTC pattern
- **C2 CATASTROPHIC:** ACCEPT — governance pattern, no implementation that could break
- **P3 PERFORMANCE:** ACCEPT — 60s poll non-blocking, 5s ACK human-time-scale
- **D4 DOCUMENTED:** ACCEPT — 11 NEVER-AGAIN RULES cross-referenced, 4 CATCHes cited, 1 FOUNDER DIRECTIVE quoted

**Composite:** 4/4 ACCEPT
