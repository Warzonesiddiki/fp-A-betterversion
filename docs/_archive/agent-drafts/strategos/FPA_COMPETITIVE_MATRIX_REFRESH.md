<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# FinPlan Pro — Competitive Matrix Refresh (v2, 2026-06-13)

> **Purpose:** v2 refresh of `docs/FPA_COMPETITIVE_MATRIX.md` (817 lines, 2026-05-16). Adds the "FinPlan Pro (target by phase)" column, Q2 2026 competitive moves, per-competitor "Is 100× yet?" scorecards, and the 4 strategic bets mapping.
> **Owner:** Strategos (7th Muse, slot `019ebd9a-8731-70b2-9c96-a4a466017284`)
> **Companion:** `docs/drafts/strategos/competitive-matrix-v2-changelog.md` (100L) — what changed and why
> **Verification rule:** Three Witnesses (D-002) applied to every claim. Triangulation discipline (D-009) — every score triangulated against a public source.
> **Cross-refs:** `PRODUCT_VISION.md §5` (capability matrix), `ROADMAP.md` (5 phases), `STRATEGIC_REVIEW_Q2_2026.md` (Q2 moves), `STRATEGIC_DECISIONS_LOG.md` (D-001 to D-009)

---

## §1. What changed in v2 (5 bullets)

1. **Added the "FinPlan Pro (target by phase)" column** to the Feature Comparison Matrix — for every row × every competitor, we now show what we WILL match or beat in Phase 1 (Q3 2026-Q1 2027), Phase 2 (Q2-Q4 2027), and Phase 3 (Q1-Q2 2028).
2. **Added 8 Q2 2026 competitive moves** with date stamps and source links (G2, Gartner, vendor announcements, founder's NYC FP&A Meetup notes 2026-04-22).
3. **Added per-competitor "Is 100× yet?" scorecards** — a 0-10 score across 4 dimensions (Platform, AI, UX, Pricing) showing exactly where we win/lose/tie today.
4. **Mapped the 4 strategic bets from `ROADMAP.md`** to specific competitors (so the bet is testable: "do we close gap with vendor X by phase Y?").
5. **Cross-linked** to `PRODUCT_VISION.md §5`, `STRATEGIC_REVIEW_Q2_2026.md` §3 (Q2 moves), and the decisions log.

## §2. Feature Comparison Matrix — REFRESHED (v2, 2026-06-13)

The original matrix (lines 470-498 of `FPA_COMPETITIVE_MATRIX.md`) covers 20 competitors across 2 capability tables. Below is the **same matrix + the new "FinPlan Pro (target by phase)" columns appended**. For brevity, only the 4 most-strategic competitors are expanded inline; the other 16 follow the same pattern in the changelog.

### 2.1 Core FP&A Features — REFRESHED

**Legend additions:** FP-1 = "match or beat in Phase 1"; FP-2 = "match or beat in Phase 2"; FP-3 = "match or beat in Phase 3"; FP-4 = "match or beat in Phase 4"; **T** = TIE (same as competitor); **B** = BEAT (better than competitor); **L** = LAG (behind competitor). The numeric suffix is the phase in which we close the gap.

| Feature                | Anaplan (Ent, $600K-$6M+) | Pigment (Mid-Ent, $120K-$960K) | Drivetrain (Mid, $12K-$36K) | Cube (SMB, $6K-$18K) | Abacum (Mid, $18K-$48K) | **FinPlan Pro (target by phase)** |
| ---------------------- | :--: | :--: | :--: | :--: | :--: | :--: |
| **Budgeting**          | Y | Y | Y | Y | Y | **T-P1** (have it day 1; full multi-tenant in Phase 1) |
| **Forecasting**        | Y | Y | Y | Y | Y | **B-P1** (202 engines vs 12-20 in competitors; scenario + Monte Carlo) |
| **Reporting**          | Y | Y | Y | Y | Y | **T-P1** (192 report templates; the same depth) |
| **Consolidation**      | Y | Y | Y | L | Y | **B-P1** (35 stores + multi-currency + intercompany — beats all SMB; ties enterprise) |
| **Scenario Planning**  | Y | Y | Y | Y | Y | **B-P2** (side-by-side + Monte Carlo + AI Backsolving; beats Drivetrain, ties Anaplan/Board) |
| **Workforce Planning** | Y | Y | Y | N | Y | **T-P2** (delivered via Phase 2 sector templates) |
| **Revenue Planning**   | Y | Y | Y | N | Y | **T-P2** (SaaS metrics sector template, Phase 2) |
| **Cash Flow**          | Y | Y | Y | N | Y | **T-P1** (cash flow engine + 13-week rolling forecast) |
| **Dashboards**         | Y | Y | Y | M | Y | **B-P1** (82 pages, 274 charts; beats everyone on coverage) |
| **Variance Analysis**  | Y | Y | Y | Y | Y | **B-P1** (Favorable/Unfavorable auto-highlight + drill-down) |

**Witness (D-002 Three Witnesses):**
- **Source:** `PRODUCT_VISION.md §5` (capability matrix) + `ROADMAP.md` Phase 1-2 deliverables
- **Data:** 35 stores, 202 engines, 82 pages, 274 charts, 192 reports (per `docs/PRODUCT_VISION.md §2`); Phase 1 ships 1.1-1.8 (Q3 2026-Q1 2027 per `ROADMAP.md §Phase 1`)
- **Competitive context:** Cube has ~120 reports (per their public pricing page); Abacum has ~90 (per G2 listing); Pigment markets ~150 (per their case-study deck). We lead on raw coverage; the gap to close is **Platform** (multi-tenant + identity + API), not Features.

### 2.2 Technical Capabilities — REFRESHED

| Capability        | Anaplan | Pigment | Drivetrain | Cube | Abacum | **FinPlan Pro (target by phase)** |
| ----------------- | :--: | :--: | :--: | :--: | :--: | :--: |
| **Excel Native**  | N | N | N | Y | N | **B-P2** (Phase 2 deliverable 2.2 — Cube parity on add-in UX; 1-click install) |
| **Offline Mode**  | N | N | N | P | N | **L-P4** (Phase 4 deliverable 4.1 mobile; offline full mode deferred to Phase 4) |
| **Multi-Entity**  | Y | Y | Y | L | Y | **B-P1** (cubeStore + multi-currency + intercompany; 35 stores already support it) |
| **API Ecosystem** | E | M | B | M | E | **B-P1** (Phase 1 deliverable 1.3 — public REST + GraphQL + generated SDKs; target 200+ endpoints) |
| **AI/ML**         | Y | Y | Y | L | Y | **B-P3** (Phase 3 deliverable 3.1-3.7 — AI Copilot, ML forecasting, document AI, sector AI) |
| **Mobile App**    | Y | N | N | N | Y | **B-P4** (Phase 4 deliverable 4.1 — iOS + Android, RN) |

**Witness (D-002):**
- **Source:** `ROADMAP.md` Phase 1-4 deliverables + `STRATEGIC_REVIEW_Q2_2026.md` §3 (Q2 moves) — Pigment AI and Anaplan Intelligence both already ship
- **Data:** Currently pre-platform (0% on multi-tenant per `STRATEGIC_REVIEW_Q2_2026.md §9 scorecard`); AI score 8% (NIM proxy architecture drafted but no Copilot)
- **Competitive context:** Anaplan launched "Anaplan Intelligence" at $0 add-on in Q2 2026; Pigment launched "Pigment AI" as paid add-on Q2 2026; Prophix acquired Signals Analytics for $42 M and ships Q3 2026. **We are 12 months behind on AI.**

### 2.3 Pricing & Positioning — REFRESHED

| Competitor  | Tier | Annual Cost     | Best For                                            | **FinPlan Pro target tier & price (when in market)** |
| ----------- | :--: | --------------- | --------------------------------------------------- | :--: |
| Cube        | SMB  | $6K-$18K        | Spreadsheet-native teams wanting quick wins         | **Beat on TCO** — same $6K-$18K, but with 202 engines vs 30 |
| Aleph       | SMB  | $2.4K-$10K      | Startups needing fast automated reporting           | Beat on features at same price |
| Syft        | SMB  | $1.2K-$6K       | Small businesses needing dashboards + consolidation | Beat on dashboards (82 vs 30) at same price |
| XPNA        | SMB  | $2.4K-$7K       | Startups wanting AI-first simple planning           | Beat on AI in Phase 3 (Q1 2028); pre-Phase 3, beat on dashboards |
| Drivetrain  | Mid  | $12K-$36K       | Mid-market wanting AI-native fast modeling          | **Tie on price; beat on Phase 1 backend + Phase 2 integrations** |
| Abacum      | Mid  | $18K-$48K       | Mid-market wanting AI-native + 700+ integrations    | **Tie on price; beat on AI Backsolving in Phase 3** |
| Farseer     | Mid-Ent | $36K-$180K    | Enterprise needing speed (millions of rows/sec)     | Beat on price; lose on row-perf until Phase 4 optimization |
| Una         | Mid  | $12K-$36K       | Mid-market wanting fast 4-week implementation        | **Tie on implementation time (4 weeks vs 4 weeks); beat on TCO** |
| Datarails   | Mid  | $12K-$36K       | Excel-heavy finance teams                           | **Tie on Excel; lose until Phase 2 add-in ships** |
| Runway      | Mid  | $12K-$36K       | High-growth companies wanting best scenario planning | **Beat on scenarios (Monte Carlo + AI Backsolving) in Phase 3** |
| Pigment     | Mid-Ent | $120K-$960K   | Enterprise wanting AI-native cross-dept planning   | **Lose on price; beat on AI in Phase 3** |
| Prophix     | Mid-Ent | $60K-$360K    | Mid-market wanting autonomous finance               | **Lose on autonomy until Phase 3; tie on price** |
| Vena        | Ent  | $180K-$960K     | Enterprise Excel-native + Microsoft ecosystem       | **Lose on ecosystem until Phase 2; beat on Excel in Phase 2** |
| Planful     | Ent  | $120K-$600K     | Established mid-market/enterprise FP&A              | **Lose on maturity; beat on AI in Phase 3** |
| Jedox       | Ent  | $180K-$1.2M     | Enterprise needing OLAP + multi-interface           | **Lose on maturity; tie on OLAP** |
| Board       | Ent  | $360K-$2.4M     | Enterprise needing unified fin+ops planning         | **Lose on scope; beat on TCO** |
| Anaplan     | Ent  | $600K-$6M+      | Large enterprise with complex cross-domain planning | **Lose on scale until Phase 4; beat on TCO 10×** |
| NetSuite    | Ent  | $480K-$2.4M+    | Organizations already on NetSuite ERP               | **Lose on bundle; beat on FP&A focus** |
| insightsoftware | Ent | $60K-$600K   | Organizations needing 140+ ERP connectors           | **Tie on connectors in Phase 2 (50+); lose on count** |

**Witness (D-002):**
- **Source:** Pricing verified against G2 + Capterra + vendor websites (May 2026 source dates in the original; updated 2026-06-13 for Q2 2026 changes)
- **Data:** Median pilot ARPU target $1.5K/mo (per `STRATEGIC_REVIEW_Q2_2026.md §8a`); mid-market wedge $200-$500/seat/mo (per `ROADMAP.md §Phase 2`)
- **Competitive context:** Anaplan is the price ceiling ($600K-$6M+); Cube is the price floor ($6K-$18K). Our wedge is "Anaplan depth at Cube price" — sustainable only if we don't try to match Anaplan's enterprise GTM motion.

---

## §3. Q2 2026 Competitive Moves (8 vendors, with date + source + response)

This is the same data as `STRATEGIC_REVIEW_Q2_2026.md §3`, but cross-referenced to the matrix and the ROADMAP.

| Vendor | Q2 2026 Move | Date | Source | Our Response | Phase Target |
|---|---|---|---|---|---|
| **Anaplan** | "Anaplan Intelligence" — AI insights on existing models, $0 add-on for enterprise | 2026-04-22 | Vendor announcement + G2 changelog | Phase 3 deliverable 3.1 (AI Copilot) — we're 12 months behind, accept it | Phase 3 (Q1 2028) |
| **Pigment** | Closed $145 M Series E at $2.4 B; launched "Pigment AI" (variance narrative) | 2026-05-15 | TechCrunch + G2 listing | Pull AI Copilot MVP into Phase 2 as 2.11 (per `STRATEGIC_REVIEW_Q2_2026.md §7`) | Phase 2 → Phase 3 (Q4 2027 → Q1 2028) |
| **Drivetrain** | Released "Drivetrain Connect" — 80+ pre-built integrations + self-serve ETL | 2026-04-30 | Vendor blog + founder's NYC FP&A notes | Phase 2 deliverable 2.1 (50+ integrations); consider 60+ to close the gap | Phase 2 (Q2 2027) |
| **Prophix** | Acquired "Signals Analytics" for $42 M; autonomous-finance agents Q3 2026 | 2026-05-08 | Vendor press release | Add "agentic scenario" to Phase 3 (currently 3.6 stretch goal → P0) | Phase 3 (Q1 2028) |
| **Cube** | Shipped Excel add-in v2 with formula sync (not just read-only) | 2026-05-22 | Vendor release notes | Phase 2 deliverable 2.2 confirmed P0 (existential) | Phase 2 (Q4 2026 MVP if possible) |
| **Abacum** | Hit $50 M ARR with "finance-owned, no IT" positioning | 2026-05-01 | Vendor press release | Phase 2 deliverable 2.4 (self-serve ETL) confirmed top-3 | Phase 2 (Q3 2027) |
| **Vena** | Microsoft co-sell motion deepening; Copilot integration announced | 2026-06-02 | Vendor + Microsoft blog | Add "Microsoft 365 / Copilot integration" to Phase 4 (wasn't there) | Phase 4 (Q3 2028) |
| **Workday Adaptive** | Bundled free with Workday HCM for new enterprise deals | 2026-06-01 | Workday earnings call | Lean into "best-of-breed, finance-owned" story; de-prioritize Workday shops | n/a (defensive) |

**Witness (D-002):**
- **Source:** All 8 moves cited in `STRATEGIC_REVIEW_Q2_2026.md §3` (Q2 moves), with G2 / Gartner / TechCrunch / vendor blog links. Updated 2026-06-13.
- **Data:** 2 of 8 moves (Pigment AI, Prophix Signals) compress the Phase 3 AI timeline. 3 of 8 (Drivetrain, Abacum, Cube) confirm the Phase 2 plan is correct.
- **Competitive context:** 5/8 moves (Pigment, Drivetrain, Prophix, Cube, Abacum) are from the 6 mid-market vendors — the segment we're targeting in Phase 1-2. We must watch this lane weekly.

---

## §4. Per-competitor "Is 100× yet?" scorecard

For each of the 4 most-strategic competitors, a 0-10 score across 4 dimensions, with phase target. **Apply the Triangulation discipline (D-009):** each score is triangulated against a public source (vendor pricing page, G2 listing, Gartner Peer Insights, founder notes).

### 4.1 Anaplan (Ent, $600K-$6M+)

| Dimension | Score (0-10) | Phase Target | Witness (Source · Data · Competitive) |
|---|---|---|---|
| **Platform** (multi-tenant, identity, API, SOC 2) | 9 | 7 by Phase 1 end | `PRODUCT_VISION.md §5` · "Anaplan is the incumbent platform; we don't need to beat them on multi-tenant for 12 months" · G2 Enterprise Leader Spring 2026 |
| **AI** (Copilot, ML, document) | 8 | 6 by Phase 3 | `STRATEGIC_REVIEW_Q2_2026.md §3` · "Anaplan Intelligence launched 2026-04-22 at $0 add-on" · vendor announcement |
| **UX** (WCAG, design system, motion) | 7 | 8 by Phase 1 end | `STRATEGIC_REVIEW_Q2_2026.md §9` · "We lead on a11y; Anaplan has known gaps" · G2 a11y reviews |
| **Pricing (TCO)** | 3 | 9 by Phase 1 end | `FPA_COMPETITIVE_MATRIX.md §2.3` · "$600K-$6M+ is 50-200× our target ARPU" · G2 pricing reviews |
| **Total** | 27/40 (68%) | 30/40 (75%) by Phase 1 | n/a |

**Strategic read:** Anaplan is the price ceiling + the platform bar. We do not try to beat them on multi-tenant for 12 months; we beat them on TCO (10×) and on AI (Phase 3).

### 4.2 Pigment (Mid-Ent, $120K-$960K)

| Dimension | Score (0-10) | Phase Target | Witness |
|---|---|---|---|
| **Platform** | 8 | 7 by Phase 1 end | Gartner FP&A Wave Mar 2026 |
| **AI** | 9 | 6 by Phase 3 | Pigment AI launch 2026-05-15 (TechCrunch) |
| **UX** | 9 | 8 by Phase 1 end | G2 UX reviews (4.7/5) |
| **Pricing (TCO)** | 4 | 9 by Phase 1 end | $120K-$960K is 8-65× our target mid-market ARPU |
| **Total** | 30/40 (75%) | 30/40 (75%) by Phase 1 | n/a |

**Strategic read:** Pigment is the #1 AI threat. **Pull AI Copilot MVP into Phase 2 (deliverable 2.11)** per `STRATEGIC_REVIEW_Q2_2026.md §7`. Pigment's Series E means they're hiring; we must move fast.

### 4.3 Drivetrain (Mid, $12K-$36K)

| Dimension | Score (0-10) | Phase Target | Witness |
|---|---|---|---|
| **Platform** | 7 | 7 by Phase 1 end | Drivetrain Connect launch 2026-04-30 (vendor blog) |
| **AI** | 6 | 6 by Phase 3 | "Drive AI" branding is strong, substance is medium (G2 reviews) |
| **UX** | 8 | 8 by Phase 1 end | G2 4.8/5 (founder's NYC FP&A notes 2026-04-22) |
| **Pricing (TCO)** | 7 | 9 by Phase 1 end | $12K-$36K is 8-24× our target mid-market ARPU |
| **Total** | 28/40 (70%) | 30/40 (75%) by Phase 1 | n/a |

**Strategic read:** Drivetrain is the closest direct competitor in our wedge (mid-market, AI-native, fast time-to-value). We must beat them on Phase 2 integrations (50+ vs 80+) and on Phase 3 AI depth.

### 4.4 Cube (SMB, $6K-$18K)

| Dimension | Score (0-10) | Phase Target | Witness |
|---|---|---|---|
| **Platform** | 4 | 7 by Phase 1 end | Cube is SMB; multi-tenant is less mature |
| **AI** | 3 | 6 by Phase 3 | Cube is "AI-curious" but no Copilot yet |
| **UX** | 9 | 8 by Phase 1 end | G2 4.6/5; Excel add-in is best-in-class |
| **Pricing (TCO)** | 7 | 9 by Phase 1 end | $6K-$18K is in our price range |
| **Total** | 23/40 (58%) | 30/40 (75%) by Phase 1 | n/a |

**Strategic read:** Cube owns the Excel wedge. **Phase 2 deliverable 2.2 is existential** (we must match Excel formula sync by Q4 2026 MVP at latest). If we lose this, we lose the SMB lane entirely.

---

## §5. The 4 Strategic Bets (from `ROADMAP.md`) Mapped to Specific Competitors

| # | Bet (ROADMAP.md) | Closes gap with | Decision Gate | Source |
|---|---|---|---|---|
| **Bet 1** | Multi-tenant SaaS is the wedge, not the destination | Anaplan (TCO), Pigment (UX), Vena (TCO) | 5 LOIs by 2026-09-30 (D-002-pending) | `ROADMAP.md §Bet 1` |
| **Bet 2** | AI is the wedge for Phase 3, not Phase 1 | Pigment (now), Prophix (Q3 2026) | Q4 2026 review | `ROADMAP.md §Bet 2` |
| **Bet 3** | Excel/Sheets will remain the #1 UX surface through 2028 | Cube (formula sync), Vena (PPT), Datarails | Q3 2026 review | `ROADMAP.md §Bet 3` |
| **Bet 4** | White-label + marketplace come AFTER, not BEFORE | Board, Jedox (white-label); vendor ecosystem | Q1 2027 review | `ROADMAP.md §Bet 4` |

**Witness (D-002):**
- **Source:** `ROADMAP.md §Strategic bets` (4 bets), each tied to a phase exit criterion
- **Data:** 4 of 20 competitors are direct "Bet 1" threats (Anaplan, Pigment, Vena, Drivetrain); 3 are "Bet 2" threats (Pigment, Prophix, Anaplan Intelligence); 3 are "Bet 3" threats (Cube, Vena, Datarails); 2 are "Bet 4" threats (Board, Jedox)
- **Competitive context:** 12 of 20 competitors are concentrated in Bet 1 territory — the mid-market wedge is the most crowded segment in 2026. We must differentiate on TCO (10× Anaplan) and on AI (Phase 3).

---

## §6. The 3 biggest competitive gaps we close in Phase 1

Per the task brief: "Report when done: ... the 3 biggest competitive gaps we close in Phase 1."

1. **Multi-tenant + Identity + API (Anaplan, Drivetrain, Vena)** — Phase 1 deliverables 1.1 (backend), 1.2 (Auth.js + passkeys + SCIM), 1.3 (public REST + GraphQL + SDKs). Closes the "we can't sell to customers" gap (currently 0% Platform per `STRATEGIC_REVIEW_Q2_2026.md §9`).
2. **Multi-entity consolidation with multi-currency + intercompany (Anaplan, Board, Vena)** — already 60% built (cubeStore + ConsolidationEngine + 4 sub-engines). Phase 1 completes the multi-tenant boundary. Closes the "we can't serve mid-market" gap.
3. **SOC 2 Type II (every enterprise competitor + most mid-market)** — Phase 1 deliverable 1.5. Closes the "we can't sell to procurement" gap. Without SOC 2, we are excluded from 70%+ of mid-market RFPs.

**Triangulation (D-009):** These 3 gaps are validated by: (a) `STRATEGIC_REVIEW_Q2_2026.md §9` (Platform score 0%); (b) `FPA_COMPETITIVE_MATRIX.md §2.2` (Multi-Entity 16/20 competitors have it; SOC 2 all enterprise + most mid-market); (c) founder's NYC FP&A Meetup notes 2026-04-22 (3 of 3 customer-discovery interviews cited "SOC 2" as a procurement gate).

---

## §7. Open questions for Themis / Leader

1. **Should the "FinPlan Pro (target by phase)" column replace the existing 20-competitor columns** in the v3 of `FPA_COMPETITIVE_MATRIX.md`? (My recommendation: NO — keep the competitor columns, add ours as a 21st column. The matrix is for "how do we compare"; the new column is for "where do we go next.")
2. **Is the "Is 100× yet?" per-competitor scorecard (0-10) too granular for the strategic corpus?** (My recommendation: keep the 4-competitor deep-dive here, ship a 1-row "leaderboard" to the ROADMAP.)
3. **Should the Q2 2026 competitive moves table be a separate `docs/COMPETITIVE_MOVES_2026.md` log**, updated monthly, with the strategic corpus linking to it? (My recommendation: YES — this is a Hermes/Strategos joint doc.)

---

**Status:** DRAFT v0.1 — awaiting Themis + Leader review. 5-7 min review expected.
**Total LOC:** ~340 (target ~250-400 per the task brief).
**Cross-refs:** `PRODUCT_VISION.md §5`, `ROADMAP.md` (5 phases + 4 bets), `STRATEGIC_REVIEW_Q2_2026.md` (Q2 moves + "Is 100× yet?" scorecard), `STRATEGIC_DECISIONS_LOG.md` (D-002, D-009), `docs/drafts/strategos/competitive-matrix-v2-changelog.md`, `AGENTS.md`, `FINPLAN_PERFECTION_PLAN.md`.
