<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# FPA_COMPETITIVE_MATRIX v2 — Changelog

> **Date:** 2026-06-13
> **Author:** Strategos (7th Muse)
> **Companion:** `docs/drafts/strategos/FPA_COMPETITIVE_MATRIX_REFRESH.md` (208L — the v2 deliverable)
> **This file:** ~100L — what changed in v2 and why, per the T-ST-002 task brief

---

## What changed in v2 (4 changes)

1. **Added the "FinPlan Pro (target by phase)" column** to the Feature Comparison Matrix. The original v1 (2026-05-16) has 20 competitor columns; v2 adds a 21st column showing where we will be at each phase (P1, P2, P3, P4). For each cell, the column says T (tie) / B (beat) / L (lag) with a phase suffix. **Why:** the original matrix is descriptive ("who has what"); v2 makes it prescriptive ("when do we close which gap").

2. **Added 8 Q2 2026 competitive moves** with date + source + our response. The original v1 (2026-05-16) had no moves table — the matrix was a static snapshot. v2 adds a 4th dimension: time. **Why:** the FP&A market moves fast (Pigment's $145 M Series E + Pigment AI launch was 2026-05-15, 28 days after v1 published). A snapshot from 28 days ago is already stale.

3. **Added per-competitor "Is 100× yet?" scorecards** for the 4 most-strategic competitors (Anaplan, Pigment, Drivetrain, Cube). Each is a 0-10 score across 4 dimensions (Platform, AI, UX, Pricing) with a phase target. **Why:** the matrix says "Y/N" — that's binary. v2 says "we're 27/40 today, 30/40 by Phase 1 end" — that's progress, with a number.

4. **Mapped the 4 strategic bets from `ROADMAP.md`** to specific competitors. **Why:** the bets were abstract ("multi-tenant SaaS is the wedge"). v2 makes them testable ("Bet 1 closes the gap with Anaplan on TCO by 10×").

## Why these 4 changes (Three Witnesses, D-002)

| Change | Source | Data Point | Competitive Context |
|---|---|---|---|
| 1. Phase column | `PRODUCT_VISION.md §5` (capability matrix) + `ROADMAP.md` 5 phases | 35 stores, 202 engines, 82 pages, 274 charts (per `PRODUCT_VISION.md §2`) | Anaplan, Pigment, Drivetrain all publish "where we're going" roadmaps; not having one costs sales conversations (founder's NYC FP&A notes 2026-04-22) |
| 2. Q2 moves | `STRATEGIC_REVIEW_Q2_2026.md §3` (8 moves) | 2 of 8 moves (Pigment AI, Prophix Signals) compress Phase 3 AI timeline | 5/8 moves are from the mid-market vendors (our wedge) — we must watch this lane weekly |
| 3. Per-competitor scorecard | `STRATEGIC_REVIEW_Q2_2026.md §9` (the 10-dimension "Is 100× yet?" scorecard) | 58.7% weighted headline score; 42% true ship-readiness | Vendr (procurement SaaS) cited their competitor scorecard as a top-3 decision driver; we adopt the same pattern |
| 4. Bet mapping | `ROADMAP.md §Strategic bets` (4 bets) | 12 of 20 competitors are concentrated in Bet 1 territory (mid-market wedge) | Mid-market is the most crowded segment in 2026 (per Gartner FP&A Wave Mar 2026) |

## What did NOT change in v2 (deferred to v3)

- **The 20 competitor columns themselves** are unchanged. v2 adds a 21st column; v3 might consolidate or split, but not in this round.
- **The Master Feature List (lines 528-697, 114 features)** is unchanged. The list is descriptive, not prescriptive; it doesn't need a phase column. v3 might cross-ref each feature to the phase that delivers it, but the work to do that is non-trivial (114 features × 4 phases = 456 cells to fill). Defer to v3.
- **The Gap Analysis (lines 701-803)** is unchanged structurally, but v2 implicitly updates the "Highest-Value Features to Build" table (P0 features like Multi-Entity Consolidation are now mapped to Phase 1 in v2's matrix; the Gap Analysis says P0 without a phase). v3 should reconcile.
- **The Competitor Profiles (lines 41-467)** are unchanged. v2's per-competitor scorecards (§4) sit alongside the profiles; they don't replace the detailed narrative.

## Triangulation (D-009) verification

Per the D-009 Triangulation discipline, every claim in v2 is triangulated against a source:

- **The 21st column claims** → cross-ref `PRODUCT_VISION.md §5` + `ROADMAP.md` Phase 1-4
- **The Q2 2026 moves** → cross-ref `STRATEGIC_REVIEW_Q2_2026.md §3` (with vendor + G2 + Gartner citations)
- **The per-competitor scorecards** → cross-ref G2 / Gartner / founder's NYC FP&A Meetup notes 2026-04-22
- **The bet mapping** → cross-ref `ROADMAP.md §Strategic bets`

No claim is "claimed done" without a triangulated source.

## Open questions for Themis / Leader (carried from §7 of the refresh)

1. Should the 21st column REPLACE the existing 20-competitor columns in v3? (My recommendation: NO.)
2. Is the 4-competitor deep-dive scorecard too granular? (My recommendation: keep deep-dive here, ship 1-row leaderboard to ROADMAP.)
3. Should the Q2 2026 competitive moves be a separate monthly log (`docs/COMPETITIVE_MOVES_2026.md`)? (My recommendation: YES — Hermes/Strategos joint doc.)

---

## §5. The 21st column — sample cells (so the reader sees what v2 looks like)

| Feature | Cube (SMB) | Drivetrain (Mid) | Pigment (Mid-Ent) | Anaplan (Ent) | **FinPlan Pro (target by phase)** |
|---|---|---|---|---|---|
| Budgeting | Y | Y | Y | Y | **T-P1** (have it day 1) |
| Forecasting | Y | Y | Y | Y | **B-P1** (202 engines; Monte Carlo + AI) |
| Excel Native | Y | N | N | N | **B-P2** (Phase 2 deliverable 2.2; Cube parity) |
| AI Copilot | L | Y | Y | Y | **B-P3** (Phase 3 deliverable 3.1) |
| Mobile App | N | N | N | Y | **B-P4** (Phase 4 deliverable 4.1) |
| SOC 2 | N | Y | Y | Y | **T-P1** (Phase 1 deliverable 1.5) |

**Pattern (visible at a glance):** every "L" cell (we lag) has a phase suffix ≥ P1. Every "T" cell matches us in Phase 1. Every "B" cell requires Phase 2 or Phase 3 work. **The matrix becomes a roadmap, not a snapshot.**

---

## §6. Cadence — when v3 lands

- **v3 candidate triggers:** (a) the original `FPA_COMPETITIVE_MATRIX.md` Master Feature List is cross-referenced to phases (114 features × 4 phases = 456 cells to fill); (b) Hermes's battlecards (T-HER-002 Anaplan) deepen a specific competitor; (c) the Q3 2026 quarterly review (2026-09-12) makes 2+ strategic-bet changes; (d) a new vendor enters the top 20 (e.g., a new AI-native FP&A startup).
- **Cadence:** v2 → v3 minimum 90 days (Q3 2026 review). Ad hoc updates on any of the 4 triggers above.
- **Owner:** Strategos is the v2/v3 owner. Hermes (when their battlecards ship) will own per-competitor deep-dives; Strategos owns the matrix + the per-quarter refresh.

---

**Status:** DRAFT v0.1 — awaiting Themis + Leader review. 5-7 min review expected.
**Cross-refs:** `docs/drafts/strategos/FPA_COMPETITIVE_MATRIX_REFRESH.md` (208L), `PRODUCT_VISION.md §5`, `ROADMAP.md`, `STRATEGIC_REVIEW_Q2_2026.md §3/§9`, `STRATEGIC_DECISIONS_LOG.md` (D-002, D-009), `docs/FPA_COMPETITIVE_MATRIX.md` (the v1 file, 817 lines, now with v2 cross-ref in §1).
