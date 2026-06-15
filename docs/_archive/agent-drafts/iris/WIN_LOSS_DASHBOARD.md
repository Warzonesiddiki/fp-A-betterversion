<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Win/Loss Dashboard (5-Metric Weekly)

> **Muse:** Iris.
> **Companion to:** `WIN_LOSS_FRAMEWORK.md` (the 6-section design).
> **Scope:** The wireframe for the 5-metric weekly dashboard. Pre-launch this is a markdown spec; post-launch it's a live Looker / Metabase / Mode dashboard.
> **Refresh cadence:** Every Monday 10:00 IST.
> **Audience:** Sales team, RevOps, product, GTM (Hermes), CSM, founder.

---

## The 5 metrics (the dashboard in one sentence)

> **"Last 30 days: we won X% of deals, we lost most often to Y, we beat Z most often, our time-to-close trended [faster/slower], and our closed-won ARR clustered around $[median]."**

If you can read that sentence off the dashboard in 5 seconds, the dashboard is working. If not, it's decoration.

---

## Metric 1 — Win rate (last 30 days, rolling)

**What it is:** % of opportunities that closed-won in the trailing 30 days.

**Formula:** `count(deal.closed_won in last 30d) / count(deal.closed in last 30d)` × 100

**Where the data comes from:** CRM (`deal.closed_won` + `deal.closed_lost` + `deal.no_decision`).

**Display:**
- **Big number** (top-left of dashboard, biggest font): current week's win rate, e.g., **"28%"**
- **Trend arrow**: ↗ (up vs. prior 30d) / ↘ (down) / → (flat). Color-coded: green up, red down.
- **Sparkline** (last 12 weeks of rolling 30-day win rate)

**Decision rule:**
- **Win rate < 20% for 2 consecutive weeks** → founder + sales lead trigger a save motion. Investigate: are we losing to a single competitor? Are ICP-1 deals stalling in stage 3?
- **Win rate > 40% for 2 consecutive weeks** → likely an ICP-fit problem (we're winning too easily because the deals are too easy; check the `icp_match` score on recent wins — if avg is < 3, we have a "bad wins" problem that will show up as churn in 6 months).

**Anti-pattern warning:** Win rate is the *most gamed metric in sales*. A team that narrows the pipeline to only "sure things" will spike the win rate while gutting the pipeline. **Always pair win rate with pipeline coverage.** If win rate is 40% but pipeline is empty, we're optimizing for the wrong thing.

---

## Metric 2 — Top loss reason (most-cited in interviews)

**What it is:** The single most-cited `loss_reason` in win/loss interviews completed in the trailing 30 days.

**Formula:** `mode(loss_reason) from interviews in last 30d` (with a minimum threshold of 3 interviews to be displayed)

**Where the data comes from:** `docs/research/winloss/2026-Q4/INTERVIEWS.csv`, the `loss_reason` column from §4.2 of the framework.

**Display:**
- **Big text** (top-right of dashboard, e.g., **"Missing feature: Multi-currency consolidation"**)
- **Horizontal bar chart** below: top 5 loss reasons, ranked by frequency, with the count of interviews citing each
- **Verbatim quote** (1-2 representative quotes from the most-cited reason, anonymized, with `[persona]` tag)

**Decision rule:**
- **Same loss reason cited in ≥ 30% of interviews for 2 consecutive months** → product triage. The PM owns the action item: ship-now, ship-next-sprint, or commit-to-date.
- **Same loss reason cited in ≥ 50% of interviews for 1 month** → founder escalation. This is a category-killer pattern (e.g., "every ICP-1 deal in the last month has cited 'no multi-entity consolidation'"). Without a fix, the ICP-1 pipeline is dead.

**Per-persona segmentation:** The top loss reason differs by ICP. Carla (ICP-1) might cite "missing SOC 2"; Chris (ICP-3) might cite "too expensive for the value." The dashboard should have **3 stacked horizontal bars**, one per persona.

---

## Metric 3 — Top competitor displaced (who we beat, who beats us)

**What it is:** The most-frequently-named competitor in the `competitor_displaced` field, segmented by won vs. lost deals.

**Formula:**
- **For wins:** `mode(competitor_displaced) from won deals in last 30d` — the competitor we *beat* most often
- **For losses:** `mode(competitor_displaced) from lost deals in last 30d` — the competitor we *lost to* most often

**Where the data comes from:** Same `INTERVIEWS.csv`, the `competitor_displaced` column from §4.3.

**Display:**
- **Two big text boxes** side-by-side:
  - Left: **"We beat [Anaplan] in N deals"** (the green box)
  - Right: **"[Pigment] beat us in M deals"** (the red box)
- **Stacked bar chart** below: full competitive set, with the green = wins / red = losses for each competitor
- **"Do nothing" highlighted separately** (in gray, not green/red) — this is a category failure, not a competitor loss

**Decision rule:**
- **Same competitor displaces us in ≥ 5 deals per month** → Hermes's battlecard for that competitor is updated. The `loss_reason` *for that competitor specifically* is the new content.
- **"Do nothing" > 30% of losses for 2 consecutive months** → founder + Hermes. **This is the highest-priority signal.** "Do nothing" means we failed to make the switching case. Fix: a new "switching from Excel" landing page, a new "ROI calculator" sales asset, a new case study (3-month + 5-model customer story).

**Anti-pattern warning:** "Do nothing" is *under-reported* in the win/loss interview because the prospect never names "do nothing" as a competitor. The interviewer must **ask explicitly** ("Did you consider staying with your current tool? What made you decide to switch / not switch?"). Without the explicit ask, the data is contaminated.

---

## Metric 4 — Time-to-close trend (are we getting faster or slower?)

**What it is:** Median days from `deal.created_date` to `deal.closed_date`, trailing 30 days, with trend vs. prior 30 days and vs. same period last year.

**Formula:** `median(deal.closed_date - deal.created_date) from closed deals in last 30d`

**Where the data comes from:** CRM timestamps.

**Display:**
- **Big number** (e.g., **"47 days median"**)
- **Trend arrow** (↗ / ↘ / →) with comparison: **"vs. 52 days prior 30d; vs. 64 days same period 2025"**
- **Line chart** (last 12 months of monthly median)
- **Segmented line chart** (3 lines, one per ICP): ICP-1 deals take longer than ICP-3 deals; this should be visible in the chart

**Decision rule:**
- **Time-to-close increased > 20% over 2 consecutive months** → founder + sales lead. The deal is slowing because (a) buyers are more cautious, (b) our demo is slower, (c) a new competitor is in the mix, or (d) our ICP definition is leaking (we're pursuing bad-fit deals that take longer). **Each cause has a different fix; the win/loss interview is the diagnostic.**
- **Time-to-close decreased > 20% over 2 consecutive months** → likely a *bad* signal, not a good one. Faster closes often mean (a) we're winning easier deals, (b) we're not running the full sales motion, (c) buyers are rushing (which means they might churn). **Pair with `deal_size` and `churn_rate_90d`** to validate.

**Anti-pattern warning:** Sales teams that are quota-pressured will sometimes "close early" by offering deep discounts or accepting bad terms. A faster time-to-close *with* a smaller deal size *and* a higher churn rate is a disaster pattern. **Always segment time-to-close by deal size.**

---

## Metric 5 — Deal size distribution (histogram of closed-won ARR)

**What it is:** The distribution of closed-won ARR in the trailing 30 days, as a histogram with 5 buckets (e.g., $0-10K, $10-30K, $30-60K, $60-100K, $100K+).

**Formula:** `histogram(deal.arr) from closed_won deals in last 30d`

**Where the data comes from:** CRM `deal.arr` (Annual Recurring Revenue, normalized).

**Display:**
- **Horizontal bar chart** (5 buckets, with the count + % of total in each)
- **Median line** (e.g., "Median: $32K ARR")
- **Trend annotation** (e.g., "Median up 18% vs. Q1 — driven by ICP-1 wins")

**Decision rule:**
- **Median deal size decreases for 2 consecutive months** → ICP problem. We're winning the *small* deals, not the *big* deals. Likely an ICP drift (we're pursuing too many ICP-3 deals because they're easier to close, even though the ACV is 5-10× lower). Fix: tighten ICP-1 sales motion, raise the bar on the qualification call.
- **Median deal size increases but win count decreases** → good (we're picking our spots). But verify churn rate hasn't increased (bigger deals that churn = bigger revenue loss).
- **One bucket dominates (> 60% of deals in one bucket)** → pipeline concentration risk. If $30-60K is 70% of wins and that bucket dries up, we have no fallback. Diversify.

**Anti-pattern warning:** A "deal size distribution" that is consistently bimodal (one peak at $5K, one peak at $80K) often means we're running two different sales motions that don't share learnings. **The ICP-1 motion and the ICP-3 motion should not be the same motion.**

---

## The dashboard layout (wireframe)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FINPLAN PRO — Win/Loss Dashboard                  Updated 2026-06-13│
│  Trailing 30 days · Refreshed Mon 10:00 IST · Source: CRM + W/L CSV │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────┐    ┌──────────────────────────────┐    │
│   │  1. WIN RATE         │    │  2. TOP LOSS REASON          │    │
│   │                      │    │                              │    │
│   │       28%            │    │  Missing feature:            │    │
│   │   ↗ +4pp vs prior    │    │  Multi-currency consol.      │    │
│   │                      │    │                              │    │
│   │  [sparkline, 12wk]   │    │  [5 bars + verbatim quote]   │    │
│   └──────────────────────┘    └──────────────────────────────┘    │
│                                                                     │
│   ┌──────────────────────┐    ┌──────────────────────────────┐    │
│   │  3. COMPETITOR       │    │  4. TIME-TO-CLOSE            │    │
│   │                      │    │                              │    │
│   │  We beat: Anaplan N  │    │       47 days median         │    │
│   │  We lost to: Pigent M│    │   ↘ -5 days vs prior         │    │
│   │                      │    │                              │    │
│   │  [stacked bar, 8]    │    │  [3 lines, 12mo, by ICP]     │    │
│   └──────────────────────┘    └──────────────────────────────┘    │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │  5. DEAL SIZE DISTRIBUTION (closed-won ARR)                  │ │
│   │                                                              │ │
│   │  $0-10K    ████ 4 (18%)                                      │ │
│   │  $10-30K   ██████ 6 (27%)                                    │ │
│   │  $30-60K   █████████ 9 (41%)                                 │ │
│   │  $60-100K  ███ 3 (14%)                                       │ │
│   │  $100K+    ░ 0 (0%)                                          │ │
│   │                                                              │ │
│   │  Median: $32K ARR · ↗ +18% vs Q1 (driven by ICP-1 wins)    │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ACTION ITEMS THIS WEEK                                              │
│  1. [Product] Multi-currency consol: 5 ICP-1 deals cited → ETA?    │
│  2. [GTM] Anaplan battlecard v2: 3 deals won, 1 lost (Pigment)    │
│  3. [Sales] ICP-3 deal size trending down — tighten qualification  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 5 anti-patterns to defend against

1. ❌ **Dashboard with no action items.** Every weekly refresh must have 1-3 action items. A dashboard with no actions is a report card with no grade.
2. ❌ **Dashboard with no PII discipline.** Customer names are never displayed. Quotes are anonymized ("CFO at 80-person SaaS"). Without this discipline, the dashboard won't get the data.
3. ❌ **Dashboard with 5 metrics and 50 sub-metrics.** The "5 metrics" rule is real. If you can't read the headline in 5 seconds, you've lost the audience. Sub-metrics go in drill-down views, not the top-level.
4. ❌ **Dashboard updated by hand.** A manual dashboard is 2 weeks stale within a month. The data must be wired to the CRM + INTERVIEWS.csv via SQL or a BI tool. Manual = dead.
5. ❌ **Dashboard that lives in a different tool than the CRM.** If the sales team has to switch tools to see the win/loss data, they won't. The dashboard must be in Slack (for the weekly post) and in the same tool as the CRM (for the drill-down).

---

## The 3 highest-leverage insights to add to the dashboard (per Leader's request)

1. **"Did we win, lose to a competitor, or lose to 'do nothing'?"** — A single pie chart, segmented by win/loss/no-decision. The "do nothing" slice is the *most actionable* signal. If it's > 30% of losses for 2 consecutive months, **we have a category-positioning problem, not a sales-execution problem.** A "do nothing" loss means the prospect decided the *current state* (Excel, current tool) is better than our *promised state*. That's a different fix than a competitor loss.
2. **"Did the buyer's #1 reason match our internal narrative?"** — A scatter plot: x = customer-stated #1 reason (from Q4 of the interview), y = our internal narrative's #1 reason (from the CRM `deal.primary_pitch`). Points off the diagonal are *narrative mismatches*. A narrative mismatch is the most actionable signal: it means our sales / product / GTM teams are telling a story that doesn't match what the customer is actually deciding on.
3. **"How long did it take to close, segmented by competitor_displaced?"** — A box plot: x = competitor, y = days-to-close. The "Anaplan" box should be *wider* (longer cycles) than the "Excel" box (shorter cycles, easier displacement). If the "Excel" box is *also* long, **we have a messaging problem with the Excel incumbent.** If the "Anaplan" box is *short*, **we're under-pricing our differentiation.**

---

## Cross-references

- **`docs/drafts/iris/WIN_LOSS_FRAMEWORK.md`** — the 6-section design this dashboard is a part of.
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the 5 win/loss metrics feed the same analytics taxonomy. The "save" motions connect to the "churn" events.
- **`docs/drafts/hermes/ICP.md`** — the ICP match score (from the framework) is the validation check for the ICP definition.
- **`docs/drafts/hermes/PRICING.md`** — the deal size distribution + the price_too_high loss reason feed the pricing strategy.
- **`docs/drafts/hermes/BATTLECARD_ANAPLAN.md`** — the `competitor_displaced` metric feeds the battlecard.
- **`docs/drafts/strategos/`** (Strategos, Phase 1 GTM T-ST-003) — the time-to-close trend + ICP match score feed the GTM sequencing.

---

_A dashboard without a decision rule is a report card. A dashboard *with* a decision rule is a control panel. Build the control panel. — Iris_
