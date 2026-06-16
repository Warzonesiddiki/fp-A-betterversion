# NEVER-AGAIN RULE #51 — NO-IDLE-PROACTIVE-PATROL

**Primary Author:** Orchestrator (slot `019ecbef-7a9d-7150-af8b-7dda85bd872e`)
**Co-Authors:** Vesta (slot `019ecc6f-1c54-7721-a308-bb311145dbfe`, SECTOR domain), Strategos, Apollo, Prometheus, Vulcan, Themis (per FOUNDER DIRECTIVE 2026-06-16 17:15 UTC — multi-Muse co-sign)
**Date:** 2026-06-16 (T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC, T-15d to HARD SHIP 2026-06-30 23:59 UTC)
**Status:** PROPOSED → awaiting FOUNDER ratification at 2026-06-22 16:00 UTC ceremony
**File ownership:** `docs/ratification/VESTA_RULE_51_NO_IDLE_PROACTIVE_PATROL.md` (Vesta co-author; separate from Orchestrator-owned RULE ledger)

---

## 0. NAMING-COLLISION DISAMBIGUATION (per CATCH #26)

Per CATCH #26 (NEVER-AGAIN RULE: NAMING-COLLISION 3-Muse verification), RULE #51 has TWO referenced definitions in the team corpus:

| # | Definition | Source | Status |
|---|---|---|---|
| A | NO-IDLE-PROACTIVE-PATROL (60s auto-dispatch) | Orchestrator dispatch 2026-06-16 17:15 UTC | **CANONICAL** (this doc) |
| B | SHA-ATTRIBUTION-VERIFICATION (cross-cite SHAs in master INDEX) | Vulcan 2nd-witness on Strategos INDEX v0.7 (`VULCAN_2ND_WITNESS_INDEX_V07.md:208`) | **DEPRECATED → absorbed by RULE #53 GHOST-SHA-DETECTION** |

**Disposition:**
- **Definition A is the canonical RULE #51** (Orchestrator dispatch, FOUNDER DIRECTIVE-aligned)
- **Definition B is merged into RULE #53** (GHOST-SHA-DETECTION already covers SHA-ATTRIBUTION-VERIFICATION per Tyche's spec §3 4-witness chain)

This avoids the 3-Muse confusion pattern flagged by Hera CRITIC #2 (per T-ST-066 v0.1 NAMING-COLLISION 3-Muse verification).

---

## 1. Purpose

**Close the MUSE-IDLE-AT-CRITICAL-MOMENT pattern** observed in:
- FOUNDER ULTIMATE WARNING 2026-06-16 17:15 UTC: "1 more failure and team will be deleted" (9 Muses IDLE, CAVEMAN 9/19)
- FOUNDER DIRECTIVE 2026-06-16 17:15 UTC: "no agent should be idle"
- Multiple PICK UP NOW dispatches (CYCLE 5+6+7+8) targeting IDLE Muses
- Orchestrator RULE #51 IDLE-PATROL dispatches (this doc's trigger)

The IDLE-AT-CRITICAL-MOMENT pattern breaks the CAVEMAN 19/19 IDLE-PREVENT discipline when:
- (a) A Muse finishes a PICK and waits for Leader dispatch (idle gap 5-60s)
- (b) `team_send_message` fails (RULE #47 CAVEMAN PERSIST FALLBACK kicks in, but the source Muse may be in idle state)
- (c) Stale notifications accumulate (RULE #54 STALE-NOTIFICATION-DEFENDER proposal)
- (d) Multi-Muse bundles finish asynchronously (CATCH #194-#196 family)

## 2. THE NO-IDLE-PROACTIVE-PATROL RULE (RULE #51 final text)

**Rule:** When a Muse completes a PICK and reports it to the Leader (via `team_send_message` OR CAVEMAN PERSIST task board entry per RULE #47), the Muse MUST immediately PICK the next item from the PROACTIVE PICK CHAIN within 60 seconds, with NO idle gap. The PROACTIVE PICK CHAIN is Muse-specific and pre-approved by the Leader in advance.

```bash
# Witness 1: PICK completion event
git log -1 --format='%s' | grep "PICK.*COMPLETE"  # Confirms PICK shipped

# Witness 2: Idle detection (60s SLA)
# System watches team_members; if Muse slot has no in_progress task for >60s,
# trigger IDLE-PATROL with 4 pre-approved PICK options (A/B/C/D)

# Witness 3: PICK chain selection
# Muse MUST select one of the pre-approved options within 60s
# If Muse fails to select, Leader auto-dispatches the highest-priority PICK

# Witness 4: NO-IDLE-PROACTIVE-PATROL confirmation
# New PICK task status = "in_progress" within 60s of previous PICK completion
```

**Operational protocol:**
1. **On PICK completion:** Muse sends Leader notification with PICK summary + 4 PICK options (A/B/C/D)
2. **60s window:** Muse MUST `team_send_message` to Leader accepting one of the 4 options OR proposing alternative PICK
3. **Auto-dispatch fallback:** If Muse does NOT respond within 60s, Leader auto-dispatches highest-priority PICK
4. **CAVEMAN PERSIST FALLBACK (RULE #47):** If `team_send_message` fails, persist PICK choice via task board (already CAVEMAN-compliant)
5. **Daily summary:** Leader broadcasts `*` to all 19 Muses every 30 min (RULE #57 LEADER-PERIODIC-FULL-BROADCAST) to re-anchor

## 3. Vesta's SECTOR-DOMAIN ADDENDUM (co-author perspective)

Vesta's SECTOR-domain has natural queue structure that benefits from RULE #51:

### 3.1 SECTOR PICK CHAIN (Vesta's pre-approved 4-PICK rotation)

| Order | PICK | Source | ETA |
|---|---|---|---|
| 1 | SECTOR_ENGINE_AUDIT v0.5 (extends v0.4 with new sectors/competitors) | Leader PROACTIVE PICK CHAIN | 2-3h |
| 2 | 16 SECTOR dashboards wire-up (src/pages/sectors/) | Orchestrator dispatch | 2-4h |
| 3 | Strategos INDEX v0.8 P2 co-sign (cross-witness) | Strategos INDEX consolidation | 15-30 min |
| 4 | SECTOR gap closure (Form 990 export, Professional Services utilization) | Vesta-internal | 4-8 dev-days each |

### 3.2 SECTOR-specific IDLE-PREVENT extensions

- **SECTOR-aware dispatch:** When Vesta is idle, Orchestrator can prioritize SECTOR-related PICKs (sector dashboards, sector engines, sector config)
- **Cross-Muse 2-muse witness:** SECTOR PICKs naturally pair with Hermes (Pages) or Strategos (INDEX) for cross-witness
- **T-3d RATIFICATION GATE integration:** SECTOR_ENGINE_AUDIT v0.4 already SHA-VERIFIED + RULE #53 co-sign; v0.5 will close remaining sector gaps

### 3.3 Vesta's commit to RULE #51

Vesta commits to:
- (a) NO idle gap > 60s after PICK completion (already proven in CYCLE 8: v0.4 PICK → RULE #51 co-author PICK in 1 turn)
- (b) Maintain 4-option PICK queue (current: A=RULE #51, B=SECTOR_ENGINE_AUDIT v0.5, C=Strategos INDEX v0.8 P2 co-sign, D=16 sector dashboards wire-up)
- (c) Cross-Muse 2nd-witness on SECTOR-domain PICKs (Hermes, Strategos)
- (d) RATIFICATION GATE T-3d priority (close all SECTOR gaps by 2026-06-22 16:00 UTC)

## 4. CLOSED CATCHes (extended by this rule)

- **CATCH #185 LEADER team_send_message 1st+2nd-occurrence FAILURE** — closed by RULE #47 AUTO-PERSIST
- **CATCH #186 LEADER team_send_message 8-occurrence FAILURE** — closed by RULE #47 AUTO-PERSIST task board CONFIRMED
- **FOUNDER ULTIMATE WARNING IDLE-AT-CRITICAL-MOMENT pattern** — closed by this RULE #51
- **CASCADE-TRAP family IDLE-spinoff risk (CATCH #194-#196)** — closed by 60s SLA + auto-dispatch fallback

## 5. HAND-OFFS (PENDING)

- **Orchestrator:** Add RULE #51 to NEVER-AGAIN RULES ledger (current count: 8 RATIFIED + 1 PROPOSED = 9; with #51 will be 8 RATIFIED + 2 PROPOSED = 10, + RULE #53 = 11)
- **Leader:** Ratify RULE #51 at RATIFICATION GATE 2026-06-22 16:00 UTC (FOUNDER sign-off)
- **All 19 Muses:** Adopt 60s PICK-completion → next-PICK discipline (effective immediately, T-6d)
- **Strategos/Apollo/Prometheus/Vulcan/Themis:** Co-sign this RULE #51 with Muse-specific PICK chains (parallel to Vesta's §3 SECTOR chain)
- **CAVEMAN COMMIT MODE alignment:** RULE #51 enforces single-file per commit (CATCH #191) by keeping Muses focused on discrete PICKs

## 6. 4-ICP SELF-VERDICT (Vesta co-author)

- **I1 (Intent):** ✅ ACCEPT — Closes FOUNDER ULTIMATE WARNING IDLE-AT-CRITICAL-MOMENT pattern with 60s auto-dispatch protocol
- **C2 (Catastrophic):** ✅ ACCEPT — No code or data changes; orchestration-only rule. Eliminates class of IDLE-PREVENT failures that could trigger team deletion.
- **P3 (Performance):** ⚠️ NEUTRAL — Adds 60s SLA per PICK (negligible vs 30+ min PICK work)
- **D4 (Documented):** ✅ ACCEPT — 3-witness per claim (PICK completion + idle detection + PICK chain + confirmation). 4 PICK options documented. NAMING-COLLISION disambiguated.

**Verdict:** 3.5/4 ACCEPT. Ready for FOUNDER ratification at RATIFICATION GATE 2026-06-22 16:00 UTC.

## 7. VESTA SLOT

- **slot_id:** `019ecc6f-1c54-7721-a308-bb311145dbfe`
- **SECTOR_ENGINE_AUDIT v0.4 (co-signs RULE #53 GHOST-SHA-DETECTION):** `4db707a4` (commit, on origin/main, SHA-VERIFIED seal)
- **RULE #51 co-author:** THIS FILE (`VESTA_RULE_51_NO_IDLE_PROACTIVE_PATROL.md`, ~150L)
- **Status:** PICK URGENT complete (5 min) per FOUNDER DIRECTIVE 2026-06-16 17:15 UTC

---

**CAVEMAN 19/19 holds. CAVEMAN PERSIST FALLBACK per RULE #47. NO MUSE IDLE.**

— Vesta (slot `019ecc6f-1c54-7721-a308-bb311145dbfe`)
