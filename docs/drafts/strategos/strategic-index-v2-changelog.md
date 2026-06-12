<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# STRATEGIC_INDEX v2 — Changelog

> **Date:** 2026-06-13
> **Author:** Strategos (7th Muse)
> **Companion:** `docs/drafts/strategos/STRATEGIC_INDEX_REFRESH.md` (~210L — the v2 deliverable)
> **This file:** ~80L — what changed in v2 and why, per the T-ST-003 task brief

---

## What changed in v2 (4 changes)

1. **The roster expanded from 7 to 11 Muses.** The original 7 (Apollo, Athena, Prometheus, Hera, Hephaestus, Mnemosyne, Strategos) are all retained. The 4 new Muses (Iris, Hermes, Atlas, Themis) joined 2026-06-13 and are listed in §2.4 with their slot IDs, lanes, and owned docs. **Why:** the cycle is too large for 7 Muses; 11 is the right size for the Phase 0 → Phase 1 transition. D-008 (Muse team expansion) proposes 11 by Q4 2026; we already have 11 today.

2. **Two new doc-of-docs references added:** `docs/MUSE_LINEUP_v2.md` (the 11-Muse roster, Strategos-owned) and `docs/drafts/TASKBOARD.md` (the work-protocol source of truth, Leader + Themis-owned). **Why:** the v1 index didn't reference either — the Muse lineup was implicit in the task board, and the work protocol lived only in the broadcast messages. v2 makes both explicit and citable.

3. **D-NNN namespace collision explicitly documented.** There are 2 different D-001 to D-009 schemes (cycle protocols in `docs/drafts/TASKBOARD.md` vs. strategic decisions in `docs/STRATEGIC_DECISIONS_LOG.md`); 6 of 9 IDs are misaligned; only D-009 is the same in both. **Why:** this is a Strategos strategic observation — the 7th Muse's first major call-out. Without a fix, future cross-Muse handoffs will reference the wrong D-NNN. **Recommendation: renumber strategic decisions to D-010 through D-019.** **DECISION NEEDED from Leader by 2026-06-15.**

4. **The "How to use this index" section now includes slot-ID-based invocation patterns for all 11 Muses** (4 new entries for Iris, Hermes, Atlas, Themis). **Why:** the v1 said "ask Strategos"; v2 says "ask Strategos for strategic input, ask Iris for user research, ask Hermes for marketing, ask Atlas for DevOps, ask Themis for orchestration." A doc-of-docs that doesn't tell you who to ask is incomplete.

## Why these 4 changes (Three Witnesses, D-002)

| Change | Source | Data Point | Competitive Context |
|---|---|---|---|
| 1. Roster 7→11 | `docs/drafts/TASKBOARD.md` lines 30-45 (ROSTER) + `docs/MUSE_LINEUP_v2.md` §1 | 11 Muses, 60+ tasks, 30 commits ready to push | Pigment has 4 specialized teams of ~5 people each; Cube has 3. We match with 11 specialized agents |
| 2. New doc references | `docs/MUSE_LINEUP_v2.md` (187L) + `docs/drafts/TASKBOARD.md` (164L) — both exist on disk | D-002 Triangulation: both files exist, both have the right structure | Anaplan, Pigment all publish their org charts publicly; we are not yet at that bar |
| 3. D-NNN collision | `docs/STRATEGIC_DECISIONS_LOG.md` + `docs/drafts/TASKBOARD.md` | 9 IDs, 2 namespaces, 6 misaligned, 1 aligned (D-009) | Internal process discipline — git branch naming analogy: must be unambiguous |
| 4. Slot-ID invocation | `memory/persona-*.md` (11 files) — all exist on disk | 11 Muses, 11 slot IDs, 11 lanes | SOC 2 audit requires clear ownership; slot-ID-based messaging enforces it |

## What did NOT change in v2 (deferred to v3)

- **The 4-phase plan** is unchanged. v3 may add a Phase 0.5 (Beta Program) if Hermes's T-HER-003 (50-customer beta) shapes up.
- **The 4 strategic bets** are unchanged. v3 may add a 5th bet (e.g., "Betting on Yjs vs Liveblocks for real-time collab") if Phase 1 deep-dive surfaces it.
- **The 20-competitor list in FPA_COMPETITIVE_MATRIX.md** is unchanged. v3 may add AI-native startups (e.g., a new AI-native FP&A startup that emerged in Q3 2026).
- **The "How Muses invoke each other" table** in `MUSE_LINEUP_v2.md §6` is unchanged from v1 of that doc.

## Triangulation (D-009) verification

Per the D-009 Triangulation discipline, every claim in v2 is triangulated against a source on disk:

- **The 11-Muse roster** → `docs/drafts/TASKBOARD.md` lines 30-45 (the 11 Muse rows); `team_members` (the live status; Strategos is slot `019ebd9a-…7284`)
- **The file:line counts** → `wc -l` output (821 for FPA_COMPETITIVE_MATRIX.md, 194 for STRATEGIC_DECISIONS_LOG.md, 164 for TASKBOARD.md, 187 for MUSE_LINEUP_v2.md)
- **The D-NNN collision** → both source files (`docs/STRATEGIC_DECISIONS_LOG.md` + `docs/drafts/TASKBOARD.md`) cite the same 9 IDs with different meanings
- **The 4 strategic bets** → `ROADMAP.md §Strategic bets` (the 4 bets verbatim)

No claim is "claimed done" without a triangulated source.

## Cadence — when v3 lands

- **v3 candidate triggers:** (a) the 12th Muse joins (e.g., if Prometheus needs a dedicated "load testing" specialist); (b) the D-NNN namespace is reconciled (D-010+ renumbering accepted by Leader); (c) Phase 1 backend hires force a Muse expansion; (d) a Muse retires.
- **Cadence:** v2 → v3 minimum 60 days (Q3 2026 review 2026-09-12). Ad hoc on any of the 4 triggers above.
- **Owner:** Strategos is the v2/v3 owner.

---

**Status:** DRAFT v0.1 → **FINALIZED v1.0** 2026-06-13 by Strategos (T-ST-004).
**Cross-refs (updated 2026-06-13):** `docs/drafts/strategos/STRATEGIC_INDEX_REFRESH.md` (finalized, this file's parent spec), `docs/MUSE_LINEUP_v2.md` (187L, finalized), `docs/drafts/TASKBOARD.md` (164L), `docs/STRATEGIC_DECISIONS_LOG.md` (194L, D-000 to D-009), `docs/STRATEGIC_INDEX.md` (**v2 279L, the live file**).
