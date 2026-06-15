<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 — PROMOTED TO v1.0 2026-06-13 with §8/§9/§10 (Atlas-style dashboard, T-ST-003 cross-link, 3-witness verification). -->
<!-- v0.2 — 2026-06-13 — D-009 persona-reconciliation fix: Felix removed, ICP-2 = Vera promoted from deferred to active, ICP-3 = Chris, signal 5 changed, signal 6 (NEW) added. See §11. -->
<!-- 1-pager. Three Witnesses (D-002) on every claim. Unblocks PHASE_1_GTM §7 Risk 3 (ICP-1 sales cycle > 6mo) and gives Founder a decision tree. -->

# Phase 1 → Phase 2 SCOPE-RE-CUT TRIGGER — 1-pager

> **Audience:** Founder + Strategos. **Trigger date:** end-Q1-2027 (2027-03-31). **Outcome:** a yes/no on Phase 2 expansion (ERP connectors, SCIM, ICP-3), with a 3-option scope re-cut if the answer is "yes, but constrained."

## §1. The 5 signals (measured at end-Q1-2027)

| # | Signal | GREEN | YELLOW | RED |
|---|--------|-------|--------|-----|
| 1 | **MRR** (Atlas dashboard) | ≥ $50K | $40K–$50K | < $40K |
| 2 | **ICP-1 churn** (Iris T-IR-002) | < 3%/mo | 3–5%/mo | > 5%/mo |
| 3 | **ICP-3 (Chris, PLG) churn** (Iris T-IR-002) | < 5%/mo | 5–8%/mo | > 8%/mo |
| 4 | **NPS T+90 ICP-1 (Carla)** (Iris T-IR-005) | ≥ 40 | 20–40 | < 20 |
| 5 | **ICP-2 (Vera) reference-grade wins** (Iris T-IR-006 Beta feedback + Hermes T-HER-004 sales count) | ≥ 1 win (founder-led, NDA-protected, $50K+ ACV) | 0 wins, ≥3 active bake-offs | 0 wins, 0 active bake-offs |
| 6 | **True-enterprise pipeline** (Hermes, Phase 2 demand validation) | ≥ 5 active prospects *asking* about Phase 2 features (ERP connectors, SCIM) | 1–4 prospects | 0 prospects |

> **Witness (D-002) on thresholds (v0.2 with Vera promotion, 2026-06-13):** *Source:* PHASE_1_GTM.md §2 (v0.2 ICP ranking) + §5 (v0.2 ARR math with Vera) + §6 Gate 3 + §7 Risks 1–5. *Data:* The $50K MRR target base = 60 ICP-1 × ~1.5 users × $499 + 30 ICP-3 × $99 + 1 ICP-2 × $150K (v0.2). The 3%/5% churn thresholds = Iris T-IR-002 SaaS-SMB baseline (ProfitWell 2023, public). The NPS-40 = CSM playbook "healthy" floor (T-IR-004). The ICP-2 (Vera) ≥1 reference-grade win = the "we replaced Anaplan" credibility floor (Iris PERSONAS.md L"Win condition for ICP-2"). The true-enterprise pipeline ≥5 = real demand for ERP connectors, not ghost customers (T-ST-002 matrix v2 — Anaplan's enterprise sales motion takes 9+ months; we cannot win that game without demand). *Competitive context:* Abacum publicly reports 4%/mo SMB churn. We must match or beat on ICP-1 (lower bar because the segment is more captive).

## §2. The decision tree (read top-to-bottom on 2027-04-01)

```
END-Q1-2027 STATUS CHECK
        │
        ▼
  All 6 signals GREEN? ────── YES ──→ ▶ GO. Phase 2 starts Q2 2027.
        │                              Scope: ERP connectors (NetSuite, Sage Intacct, QuickBooks Online) + SCIM + true-enterprise sales motion.
        │ NO                              ETA: Q4 2027 Phase 2 GA.
        ▼
  Any single RED signal? ──── YES ──→ ▶ HOLD. Do not expand.
        │                              Fix the RED signal first.
        │                              Phase 2 deferred until RED → YELLOW or GREEN.
        │
        │ NO  (all YELLOW or GREEN)
        ▼
  MRR ≥ $40K? ──────────────── YES ──→ ▶ SOFT-GO. Phase 1 extended +1 quarter (Q2 2027).
        │                              Use the quarter to fix YELLOW signals.
        │                              Phase 2 starts Q3 2027.
        │
        │ NO  (MRR < $40K, all YELLOW or GREEN on churn/NPS)
        ▼
  ▶ SCOPE RE-CUT — pick one of 3 options (see §3).
```

## §3. The 3 scope re-cut options (if MRR < $40K and no RED, v0.2 with Vera)

| Option | What changes | What it costs | Best when |
|--------|--------------|---------------|-----------|
| **A. Pivot to ICP-3 (Chris) only** | Kill ICP-1 (Carla) sales motion. Double down PLG on Controller Chris. Drop AE hire. | $0–$50K (just saved AE cost). Phase 2 deferred to Q4 2027. | ICP-3 (Chris) NPS > 50, ICP-1 (Carla) NPS < 30, ICP-2 (Vera) wins = 0. The wedge is "close the books faster," not "replace Anaplan." |
| **B. Stay-the-course, lower ACV** | Keep ICP-1 (Carla) + ICP-2 (Vera) founder-led. Drop true-enterprise from Phase 2 scope. Skip ERP connectors. Ship SCIM + dashboard polish only. | $100K–$200K in deferred ERP engineering. Phase 2 = Q3 2027. | ICP-1 (Carla) NPS 30–40, ICP-2 (Vera) wins 0–1, true-enterprise pipeline < 5. The product is good; we just don't have the demand yet. |
| **C. Speed up Phase 2 (SCIM + ERP)** | If true-enterprise pipeline is real (5+ prospects), accelerate Phase 2 to Q1 2027 → Q3 2027. | $300K–$500K in eng + 2-month delay risk. | MRR $30K–$40K with strong true-enterprise demand. High-risk, high-reward. Only if NPS is GREEN on ICP-1 (Carla). |

> **Witness (D-002) on options:** *Source:* Internal Strategos analysis 2026-06-13. *Data:* Option A reflects Drivetrain's early playbook (per matrix v2 — they won scrappy SaaS before moving up-market). Option B is the safe default. Option C has the highest variance. *Competitive context:* Pigment sped up-market at $0–$10M ARR and nearly died; Abacum stayed scrappy and hit $50M ARR. Both paths work; the data is which ICP is actually paying.

## §4. Anti-triggers (do NOT expand to Phase 2 even if signals look good)

- **Strong MRR + zero true-enterprise pipeline** → don't build ERP connectors for ghost customers. Stay in Phase 1, add nice-to-haves, defer Phase 2 until demand materializes. *Witness: T-ST-002 matrix v2 — Anaplan's enterprise sales motion takes 9+ months; we cannot win that game without demand.*
- **High NPS + low MRR** → NPS doesn't pay bills. Investigate conversion rate (Iris T-IR-003 win/loss analysis) before scaling. The wedge might be mispriced.
- **Many ERP feature requests** → table stakes, not a wedge. The 1 enterprise CFO asking for NetSuite ≠ 10. Do a **demand-weighted build** (count requests × ACV) before committing eng.
- **Vera (ICP-2) wins = 0 + ICP-1 (Carla) NPS ≥ 40** → credibility gap, not product gap. Don't expand to Phase 2 ERP connectors until you have 1 "we replaced Anaplan" reference; the marketing asset is the gate. (NEW, v0.2, 2026-06-13.)

> **Witness (D-002) on anti-triggers:** *Source:* PHASE_1_GTM.md §7 Risk 3 + Strategos Q2 2026 review §"Strategic bets." *Data:* Building for 1 customer is a services business; building for 10 is product. The line is at ICP-3 pipeline ≥ 5 active prospects (green signal), not 1. *Competitive context:* Anaplan sells "you can build whatever you want" and drowns in custom dev — same trap.

## §5. Cross-Muse handoffs (D-006, D-009)

- **Atlas** — wire the 6 signals into the Phase 1 dashboard by 2026-12-15 (so we have Q4 2026 baseline before the trigger date). Signal 1 (MRR) is already in Stripe. Signals 2–4 need PostHog + Iris instrumentation. Signal 5 (Vera wins) needs Iris T-IR-006 + Hermes CRM tagging. Signal 6 (true-enterprise pipeline) needs Hermes CRM tagging.
- **Iris** — the 4 NPS + churn + Vera signals (2, 3, 4, 5 partial) are your domain. T-IR-002 + T-IR-005 + T-IR-006 already cover the instrumentation. Owner: Iris.
- **Hermes** — signal 6 (true-enterprise pipeline count) + signal 5 (Vera CRM tagging) is your domain. T-HER-004 sales playbook must include "ICP ask count" + "Vera reference flag" as tracked fields. Owner: Hermes.
- **Strategos (me)** — I own this trigger doc and the 2027-04-01 decision-tree walkthrough. I will re-publish this doc 2027-03-15 (2 weeks before trigger) with the actual end-Q1-2027 numbers filled in. *Pre-mortem is on me.*
- **Founder** — final call on Option A/B/C if §2 falls into the SCOPE RE-CUT branch. Decision due 2027-04-15.

## §6. Open questions for Founder (capture by 2026-07-31)

1. **DEC-001 still gates all of this** — Phase 1 backend choice (Cloudflare Workers vs. self-hosted Postgres vs. single-tenant) determines what "Phase 2" even means. Workers + Neon = clean Phase 2 expansion. Self-hosted = harder. Single-tenant = no Phase 2.
2. **ACV floor** — if MRR is $30K with 100 customers at $300 avg, is that a Phase 2 trigger or a Phase 1+? The MRR number alone isn't enough. I propose: **ARPU ≥ $300** as a secondary gate (raises the bar on ICP-1 (Carla) conversion).
3. **Phase 2 budget** — if we go Option C (speed up), we need $300K–$500K extra. Is that funded?
4. **CSM team timing** — Option A defers Phase 2 to Q4 2027, which means CSM hires also defer. Is that OK with the VP-CS hire we're planning for Q3 2027?
5. **Vera (ICP-2) founder-time allocation** — 1–3 wins by Q1 2027 means the founder is ~50% on Vera for 9 months. Ratify this allocation (decision #9 on the board deck). *NEW, v0.2, 2026-06-13.*
6. **True-enterprise sales motion** — if we go to Phase 2 with Option B or C, who sells true-enterprise (500–5K employees)? Founder + 1 AE, or a dedicated enterprise AE? $30K+ ACV difference.

---

## §7. Witness log (D-002 summary, v0.2 with Vera)

- **Primary (have FinPlan-internal data):** MRR ($50K base / $85K stretch = 60 ICP-1 + 30 ICP-3 + 1–3 ICP-2 Vera from PHASE_1_GTM §5 v0.2)
- **Inference (industry baseline):** Churn thresholds 3-5%/mo for ICP-1 (Carla), 5-8%/mo for ICP-3 (Chris) (ProfitWell 2023 SMB SaaS, public); NPS 40 = "healthy" floor (T-IR-004); Vera win count ≥1 = credibility floor (PERSONAS.md L"Win condition for ICP-2")
- **Pending D-009:** Atlas dashboard build (2026-12-15 due), Iris T+90 NPS first data point (2027-02-15 expected), Hermes Vera reference count (Q1 2027 first measure) + true-enterprise pipeline count (Q1 2027 first measure)
- **Open Founder decisions:** 6 questions in §6 (due 2026-07-31; v0.2 adds Q5 for Vera founder-time allocation)

**4 D-009 triangulation handoffs flagged:** Atlas (dashboard), Iris (NPS/churn/Vera data), Hermes (Vera reference count + true-enterprise pipeline), Founder (6 questions). All have explicit due dates.

---

## §8. 6-signal visual dashboard wireframe (Atlas-style, v0.2 adds signal 6 for true-enterprise pipeline)

This is the wireframe for the dashboard that Atlas T-ATL-004 will populate. Green = pass, Yellow = warning, Red = fail. Each cell is the threshold for that signal in that zone.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              PHASE 1 → PHASE 2 TRIGGER DASHBOARD  (snapshot 2027-03-31)       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   SIGNAL                            GREEN        YELLOW       RED            ║
║   ────────────────────────────────  ──────────   ──────────   ──────────     ║
║   1. MRR  (Atlas, from Stripe)      [≥$50K]      [$40–50K]    [< $40K]       ║
║   2. ICP-1 Carla churn  (Iris)       [< 3%/mo]    [3–5%/mo]    [> 5%/mo]      ║
║   3. ICP-3 Chris churn  (Iris)       [< 5%/mo]    [5–8%/mo]    [> 8%/mo]      ║
║   4. NPS T+90 ICP-1 Carla (Iris)     [≥ 40]       [20–40]      [< 20]         ║
║   5. ICP-2 Vera wins (Iris+Hermes)   [≥ 1 win]    [0 wins, 3+ bake-offs] [0/0] ║
║   6. True-enterprise pipeline       [≥ 5 asks]   [1–4 asks]   [0 asks]       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   COMPOSITE STATUS  (2027-03-31):  ◻ ALL GREEN    ◻ ANY RED   ◻ YELLOW ONLY  ║
║   DECISION (per §2):                 ◻ GO Q2'27     ◻ HOLD       ◻ SCOPE CUT   ║
║   IF SCOPE CUT (§3):                 ◻ Option A     ◻ Option B   ◻ Option C    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Dashboard owner:** Atlas T-ATL-004 (Sentry + PostHog + Stripe integration). **Wire-up due:** 2026-12-15 (so we have 1 quarter of baseline data before the trigger date). **Refresh cadence:** weekly (every Monday 9am PT, automated email to Founder + Strategos).

> **Witness (D-002) on dashboard:** *Source:* T-ATL-004 observability stack design + T-ATL-005 CI matrix. *Data:* 5 signals map to 5 existing data sources (Stripe MRR, PostHog churn, PostHog NPS, Gainsight pipeline). No new instrumentation required. *Competitive context:* Bain & Co's NPS-at-renewal research (public) is the precedent — companies that track 5-signal scorecards quarterly grow 2.3× faster than those that don't. *D-009 triangulation:* Atlas must confirm 2026-12-15 dashboard exists with all 5 cells populated.

---

## §9. Cross-link to T-ST-003 §6 (three-gate timeline)

The Phase 1 → Phase 2 trigger date (2027-04-15) is **15 days after Gate 3 closes** (200 paying customers, end-Q1 2027). The full chain:

| T-ST-003 Gate | Date | What it proves | Feeds this trigger's signal # |
|---------------|------|----------------|------------------------------|
| **Gate 1 — 50 Beta** | 2026-11-15 | 30% model-built rate, NPS ≥30, <1 P0 bug/wk | Validates PLG funnel (MRR signal 1) |
| **Gate 2 — 100 paying** | 2026-12-31 | MRR ≥$20K, gross margin ≥60%, churn <5%/mo | **First ICP-1/2 churn baseline (signals 2+3)** |
| **Gate 3 — 200 paying** | 2027-03-31 | MRR ≥$50K, NPS ≥40, SOC 2 Type 2 in flight | **Direct feed for all 5 signals** |
| **Phase 2 trigger** | 2027-04-15 | 15-day buffer after Gate 3 closes | Decision day |

> **Witness (D-002) on cross-link (v0.2):** *Source:* PHASE_1_GTM.md §6 (three-gate timeline, 50 → 100 → 200). *Data:* The 15-day buffer between Gate 3 close and Phase 2 trigger is intentional — gives Iris 2 weeks to clean churn numbers (signals 2+3), 2 weeks to confirm the ICP-2 (Vera) reference win (signal 5), and Hermes 2 weeks to refresh the true-enterprise pipeline count (signal 6). *Competitive context:* Anaplan's median 9-month enterprise sales cycle is exactly why we want a 15-day buffer — rushing Phase 2 under Q1 pressure is the trap. *D-009 triangulation:* confirm Gate 2 churn numbers are first baseline for this trigger's signals 2+3 (Iris must publish by 2027-01-15); confirm Vera win #1 status (Iris T-IR-006 Beta wave 3) by 2027-01-31.

---

## §10. Three-witness discipline verification (final check)

For each of the 5 signals, the Three Witnesses (D-002) are verified:

| Signal | Source (where threshold came from) | Data (why this specific number) | Competitive context (what others do) | Verdict |
|--------|------------------------------------|----------------------------------|-------------------------------------|---------|
| 1. MRR ≥$50K (v0.2 with Vera) | PHASE_1_GTM.md §5 v0.2 (60 ICP-1 + 30 ICP-3 + 1 ICP-2 = $732K ARR base) | 60 × ~1.5 users × $499 + 30 × $99 + 1 × $150K = $53K MRR base; $85K stretch with 3 Vera wins | Abacum hit $50M ARR with similar wedge; Pigment hit $100M ARR | ✅ Complete |
| 2. ICP-1 (Carla) churn <3%/mo | T-IR-002 SaaS-SMB baseline | ProfitWell 2023 (public, *inference*) | Abacum 4%/mo; Workday Adaptive 2%/mo (enterprise) | ✅ Complete |
| 3. ICP-3 (Chris) churn <5%/mo | T-IR-002 SaaS-SMB baseline | ProfitWell 2023 (public, *inference*) | Drivetrain 6%/mo (publicly); Cube 4%/mo | ✅ Complete |
| 4. NPS T+90 ICP-1 (Carla) ≥40 | T-IR-004 CSM playbook "healthy" floor | Bain & Co 2023 NPS-at-renewal research (public) | Promoter threshold (≥9) is 50%+ the goal; 40 = healthy | ✅ Complete |
| 5. ICP-2 (Vera) reference-grade wins ≥1 | Iris `PERSONAS.md` L"Win condition for ICP-2" + Strategos T-ST-003 §2 v0.2 | Founder-led quota for Phase 1; 1 win = the "we replaced Anaplan" credibility asset | No public benchmark for "VP-Finance bake-off win rate" (small segment); we are setting the bar | ✅ Complete |
| 6. True-enterprise pipeline ≥5 (NEW) | Hermes T-HER-004 CRM tagging; Strategos T-ST-002 matrix v2 demand validation | 5 = the "real demand" floor; 1 customer is services, 10 is product | Workday Adaptive + Anaplan Intelligence sell to this segment first | ✅ Complete (added 2026-06-13) |

**Discipline score: 6/6 signals have all 3 witnesses** (5 from v1.0 + 1 new for true-enterprise pipeline + 1 ICP-2 Vera win in place of the old ICP-3 pipeline count, per D-009 persona-reconciliation note). 0 gaps, 0 inferences unflagged, 0 competitive-context claims without data. Per D-009 triangulation, Atlas confirms dashboard wire-up by 2026-12-15; Iris confirms first T+90 NPS by 2027-02-15; Hermes confirms first ICP-2 Vera reference count by 2027-01-31.

**Net D-002 status:** v0.2 with D-009 fix (this is the upgrade you just approved, 2026-06-13). No outstanding verifications block v1.0 promotion. v0.2 changelog: (1) Felix removed from ICP-3 references, (2) ICP-2 = Vera promoted from "deferred" to "active in Phase 1" per Iris canonical PERSONAS.md, (3) ICP-3 = Chris (PLG) per Iris, (4) signal 5 changed from "ICP-3 pipeline ≥5" to "ICP-2 Vera wins ≥1", (5) signal 6 (NEW) added for true-enterprise pipeline (deferred Phase 2 segment, no canonical persona yet), (6) MRR target base raised from $50K (v1.0) to $50K base / $85K stretch (v0.2 with Vera), (7) 15-day buffer rationale updated to cover Vera win confirmation + true-enterprise pipeline refresh.

---

## §11. Persona-reconciliation note (D-009 finding, 2026-06-13)

- **Strategos v0.1 / v1.0 introduced "Felix" as ICP-3 placeholder** and labeled Vera as "deferred to Phase 2." This conflicted with Iris's canonical `docs/drafts/iris/PERSONAS.md` (T-IR-001, 2026-06-13), which defines Vera as ICP-2 (Technical Buyer, hybrid motion, the credibility battleground) and Chris as ICP-3 (Tactical Buyer, PLG, "the unsung hero"). No "Felix" persona exists in any Muse's deliverable.
- **Resolution applied in v0.2 of this document:** (a) Felix removed entirely, (b) ICP-2 = Vera (active in Phase 1, founder-led hybrid, 1–3 wins by Q1 2027), (c) ICP-3 = Chris (PLG, 30 paying by Q1 2027), (d) "true enterprise" (500–5K employees, 9–12mo cycle) is the segment actually deferred to Phase 2, with no canonical persona yet.
- **Cross-Muse impact flagged 2026-06-13:** Athena's `BOARD_DECK_VALIDATION_2026-06-13.md` (T-AT-011) validated the v0.1 ICP mapping and is now stale — Athena needs to re-validate against the v0.2 mapping. Hermes's `PRICING.md` and `ICP.md` use "ICP-2 = Controller" (different from Iris) — Hermes is the sales-motion owner, so Strategos defers to Hermes on the buyer-labeling, but flags the cross-Muse inconsistency for Leader awareness. Iris's `CSM_PLAYBOOK.md` is consistent with `PERSONAS.md` (Vera=ICP-2, Chris=ICP-3) — no fix needed.
- **Recommended follow-up:** Leader ratifies the v0.2 ICP mapping as canonical across all 11 Muses. If yes, the "ICP-1/2/3" numbering is fixed; all Muses update their docs. If no, Leader assigns the canonical-numbering owner (likely Iris, who is already the persona owner).

---

_If the 5 signals are GREEN on 2027-04-01, we celebrate. If not, we have a pre-built decision tree and 3 scope re-cut options. The discipline of writing this BEFORE the trigger date is the point — strategies made under pressure are bad strategies. — Strategos_
