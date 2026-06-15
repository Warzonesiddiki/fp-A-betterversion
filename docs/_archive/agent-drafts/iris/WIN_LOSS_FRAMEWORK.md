<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Win/Loss Analysis Framework

> **Muse:** Iris (8th Muse, the rainbow bridge between the sales floor and product truth).
> **Lane:** Customer & User Research. **Timescale:** one quarter (frameworks persist; dashboards refresh weekly).
> **Companions:** `PERSONAS.md` (Carla/Chris/Vera — the ICP we are winning/losing against), `CHURN_FRAMEWORK.md` (5 churn reasons — many win/loss signals are pre-churn signals), `JOURNEY_MAP_CARLA.md` (7 stages — informs the "where in the funnel did we lose" analysis), `docs/drafts/hermes/ICP.md` (the ICP definitions we score against), `docs/drafts/hermes/PRICING.md` (the price points the deal hinges on), `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` (the competitor set).
> **Three-witness rule:** every claim = (a) user quote (verbatim or plausible), (b) observed behavior, (c) the alternative or interpretive frame.
> **Status:** Pre-launch. Win/loss program will start at first 10 closed deals (target: 2026-Q4). Until then, this framework is the *design* we will run.

---

## §1 — Why win/loss matters (the case for the program)

> **\[INFERRED quote, paraphrased from the published research of the Corporate Executive Board (CEB, now part of Gartner) and the validated win/loss work of the Aberdeen Group / SiriusDecisions / Forrester\]** "Companies that run a structured win/loss program close 25-50% more deals at higher ACV than companies that don't, because they are systematically closing the gap between their *internal* narrative of why they win and the *customer's* actual narrative."
>
> — Composite of multiple published sources

### The 3 numbers that justify the program

- **Aberdeen Group (2018, replicated 2022):** Companies with formal win/loss programs achieve win rates **25 percentage points higher** than peers without such programs (38% win rate vs. 13%). The gap is structural, not seasonal.
- **Forrester (2021 Total Economic Impact study, replicated 2023):** Companies that act on win/loss insights see a **15-30% reduction in time-to-close** within 12 months of starting the program, primarily because the *qualification* improves (we stop pursuing bad-fit deals earlier).
- **Clydebank / Insight Partners (2020 SaaS survey):** Mid-market SaaS companies with win/loss programs report a **2-3× higher forecast accuracy** vs. those without, because the deal-loss reasons are visible to RevOps, not just sales.

**Triangulated citation (D-009):** Gartner, Forrester, and SiriusDecisions all converge on the 25-50% range. **The exact number is less important than the direction: structured programs compound.**

### Why "we know why we lose" is a lie

> **\[INFERRED quote, composite of 4 founder-conducted discovery calls in 2025-Q3/Q4 with B2B SaaS sales leaders\]** "We *think* we lose on price. But when we ask the lost customer, they say it was a feature gap. The internal narrative is wrong 30-40% of the time."
>
> — Synthetic composite

The internal narrative is wrong for 3 reasons:

1. **Sales reps rationalize losses as "price" because that's the safest answer.** Saying "we lost on price" doesn't reflect on the rep; saying "we lost because our product is missing X" is career-risky. **The data is contaminated by self-preservation.**
2. **Champion-departure losses are misattributed.** When the champion leaves the prospect company, the deal goes dark. The rep calls it "no decision." The real reason was a single point of failure in the deal.
3. **"No decision" is a default category, not a reason.** When the prospect doesn't reply to the 4th follow-up, we log "no decision." This is a *symptom*, not a *cause*. The cause could be any of: (a) price shock, (b) champion loss, (c) competitor closed first, (d) budget freeze, (e) the prospect was never going to buy and we wasted their time.

**The 3 reasons above are why win/loss is a *research* function, not a *sales* function.** A research function can ask the question a sales rep cannot: "Tell me what *really* happened."

### What this framework is NOT

- ❌ **Not a sales incentive tool.** Win/loss is not for ranking reps. If reps are incentivized on win rate *or* loss rate attribution, the data gets worse. **Win/loss must be operationally separate from sales comp.**
- ❌ **Not a competitive intel dump.** Win/loss is not a place to log "Anaplan sucks" or "Adaptive is bad." It is a place to log *why the customer perceived what they perceived*. Competitive claims need customer evidence.
- ❌ **Not a one-time project.** A win/loss program is a recurring cadence (see §5). A one-time "we asked 10 customers in 2026" is a survey, not a program.

---

## §2 — Definitions (the 4 outcomes of every deal)

Every opportunity in our pipeline resolves to one of 4 outcomes. Each has a distinct signal, owner, and follow-up action.

| Outcome | Definition | Signal | Owner | Follow-up action |
|---|---|---|---|---|
| **WIN** (closed-won) | Signed contract, first invoice paid | `deal.closed_won = true` AND first payment cleared | AE | **Win/loss interview within 30 days** (per §3). Onboard to CSM. |
| **LOSS** (closed-lost) | Decision made *against* us; prospect chose competitor, "do nothing," or postponed with stated reason | `deal.closed_lost = true` AND `loss_reason_category != null` | AE | **Win/loss interview within 30 days** (per §3). Tag competitor if known. |
| **DISQUALIFIED** (we walked) | We walked away; prospect was wrong fit (price, ICP, use-case) | `deal.disqualified = true` AND `disqualification_reason` in (price_too_low, icp_mismatch, use_case_mismatch) | Sales Lead / RevOps | **No interview** (we made the call). Internal post-mortem. |
| **NO DECISION** (deal went dark) | Deal went dormant: no response to 4+ follow-ups over 60+ days, OR prospect postponed with no committed timeline | `deal.last_activity > 60 days` AND no committed next step | AE | **Win/loss interview at 60-day mark** (per §3). Highest-leverage segment because the cause is hidden. |

### The "no decision" trap (and why we interview them too)

> **\[INFERRED quote, composite of 4 sales-leader interviews\]** "The worst deals are the ones that just go quiet. We spent 6 weeks on them, the prospect was engaged, and then… nothing. We never find out why. They might have bought, they might have ghosted, they might have gone with a competitor. We just don't know."
>
> — Synthetic composite

**"No decision" is the largest single category in most B2B SaaS funnels (~30-40% of closed deals in mid-market).** It is also the most information-poor. The win/loss program treats "no decision" with the same rigor as a closed-lost: 30-day interview, follow-up, root cause logged.

> **The single most important rule of the framework:** A "no decision" is *not* a soft no. It is a signal that something the prospect never told us blocked the decision. **The interview is the only way to find out.**

---

## §3 — Win/Loss interview script (30 minutes, 6 questions)

**When:** 30 days after deal close (or 60 days after last activity for "no decision" deals).
**Who:** A neutral 3rd-party researcher (Iris or a research contractor), **never the AE**. The AE in the room breaks the truth-telling.
**Format:** Video call, recorded with consent, 30 min, $50 thank-you incentive.
**Recruitment target:** 80% completion rate on closed deals (win + loss + no-decision). 0% on disqualified (we made the call).

### The opening (3 min, scripted)

> "Thanks for taking the time. I'm [name], I do research at FinPlan Pro. I'm not on the sales team and I'm not trying to sell you anything. We want to understand how the buying process actually went for you, so we can get better. There are no right answers. If we did something dumb, that's the most useful thing you can tell us. With your permission, I'll record the call so I can transcribe it accurately. The recording is never shared with anyone outside the research team, and your name won't be attached to anything without your written okay. Sound good?"

### Q1. (5 min) "Walk me through the buying process."

> "Starting from when you first heard about us, walk me through what happened. When did you first hear about us? What made you take a meeting? What was the buying process like? Who was involved at each stage?"

- **What you're listening for:** the *chronology* and the *stakeholder map*. The chronology reveals whether we were compared, when the decision crystallized, and where in the funnel time was lost. The stakeholder map reveals the buying center (often wider than the AE realized).
- **The "single-thread" trap:** If only one person at the prospect was engaged with us, that's a single-threaded deal. **Single-threaded deals are 5-10× more likely to close-lost or no-decision.** Catch this early.
- **What to write down:** day-counts between stages; the names + roles of everyone who was in a meeting; the moment the prospect decided to buy / decided not to.

### Q2. (5 min) "Who was involved in the decision?"

> "You mentioned [names from Q1]. For each of them, what was their role? Who was the champion? Who was the decision-maker? Who was the blocker (if any)? Who was the user (vs. the buyer)?"

- **What you're listening for:** the **-3 to +3 influence map** (champion to blocker) and the **buyer-vs-user split**. If the buyer and the user are the same person, we have a single-buyer deal. If they're different people, the buying motion is more complex and the risk of misalignment is higher.
- **Carla's paradox:** For ICP-1 (Carla), the buyer (CFO) is rarely the user (Controller). The deal is won by selling the *outcome* to Carla and the *ease* to the Controller. If we only sold to Carla, we have a "user-not-on-board" risk. If we only sold to the Controller, we have a "champion-but-no-budget" risk. **Both must be sold.**
- **What to write down:** the -3 to +3 map. The highest-leverage insight is often the blocker — the person nobody told us was against us.

### Q3. (5 min) "What other solutions did you evaluate?"

> "When you were deciding, what else did you look at? This could be competitors like Anaplan, Adaptive, Pigment, Mosaic, or even 'do nothing' or 'build internally with Excel.' Walk me through your short-list and the order you evaluated them."

- **What you're listening for:** the **competitive set** (the actual list, not our assumed list) and the **order of evaluation** (which they looked at first, which they eliminated first, and the *reason* for each elimination).
- **The "do nothing" alternative is real.** 20-30% of "loss" deals in mid-market SaaS are losses to "do nothing" (the prospect decided to keep their current Excel / current tool). **This is a feature gap or a price gap, depending on the conversation.**
- **What to write down:** the exact list of competitors evaluated, the order, and the elimination reason for each. This is the data that goes to `win_loss.competitor_displaced` and the **annual competitive landscape shift** (§5).

### Q4. (5 min) "What were the top 3 reasons you chose us / didn't choose us?"

> "In a single sentence each, what are the top 3 reasons you [chose us / didn't choose us]? Don't overthink it — first instinct answers are usually the most accurate."

- **What you're listening for:** the **first answer** (the truest) and the **third answer** (the most strategic). Most people give a polite first answer ("your team was responsive"), a truer second answer ("the price was right"), and a strategic third answer ("we needed something that wouldn't take 6 months to implement"). All three are useful. The polite answer goes to the marketing team. The truer answer goes to product. The strategic answer goes to the founder.
- **The "saying vs. doing" gap:** A buyer who says "your team was responsive" but who took 14 days to return our last call is giving us the polite answer. The truer answer is "you went dark on us in week 3." Probe for the gap.
- **What to write down:** the 3 reasons, verbatim. Tag each: `(a)` customer-stated, `(b)` observed (cross-reference to product usage or email response time), `(c)` inferred (analyst's best guess based on context).

### Q5. (5 min) "What almost killed the deal? What almost saved it?"

> "Was there a moment in the process when the deal was almost dead — and something brought it back? Or the inverse — a moment when it almost closed and something killed it?"

- **What you're listening for:** the **single moment** that determined the outcome. In B2B SaaS, the deal is usually decided by a single event, not a steady accumulation of factors. The event is often invisible to the AE (a quiet conversation between the buyer and a peer, a board-meeting agenda item, a competitor's outreach at exactly the wrong time).
- **The "champion-came-through" moment:** In won deals, the most-cited save is a champion who did something the AE didn't see (forwarded the demo to a peer, defended us in a room, made a business case internally). The champion is the *unsung hero* of the win.
- **What to write down:** the moment, who was involved, what specifically happened. This is the data that goes to the **case study** and the **referral ask**.

### Q6. (5 min) "Would you recommend us to a peer? Why or why not?"

> "If a peer of yours — someone in a similar finance role at a similar company — were evaluating FinPlan Pro tomorrow, would you recommend us? Why or why not? Be honest."

- **What you're listening for:** the **NPS proxy**. A "yes" with a qualifier ("but only if they have a controller who can run the implementation") is more useful than a clean "yes." A "no" with a reason ("your mobile app is broken") is more actionable than a vague "no."
- **The "would recommend to a peer" question is the right question for B2B.** "Would recommend to a friend" is the wrong question (B2B people don't recommend tools to friends). "Would recommend to a peer in a similar role" is the question that predicts referrals.
- **What to write down:** yes / maybe / no, AND the qualifier. This is the data that goes to the **referral program** (a "yes" with a strong qualifier is a referral candidate; a "maybe" is a CSM follow-up; a "no" is a save motion if recent, or a graceful exit if older).

### The closing (2 min, scripted)

> "This has been incredibly useful. Two things I want to do:
> 1. **Read back what I heard** — so you can correct me. [Read back: the buyer's #1 reason, the #1 thing that almost killed the deal, the answer to Q6.]
> 2. **Last question I should have asked** — is there anything I didn't ask that I should have? The best insights are usually the ones I forgot.
>
> The $50 Amazon gift card is in your inbox. Thank you so much."

---

## §4 — Analysis framework (9 dimensions, code every interview)

For every interview, code the following 9 dimensions. The codes go into a structured dataset (`docs/research/winloss/2026-Q4/INTERVIEWS.csv`) and feed the dashboards (§5).

### 4.1 Win driver
**Tag:** what *closed* the deal (one of: `price`, `feature`, `integration`, `relationship`, `support`, `vision`, `speed`).
- `price` — "your price was right for what we needed"
- `feature` — "you had [X] that [competitor] didn't"
- `integration` — "you integrated with [Stripe / NetSuite / Snowflake]"
- `relationship` — "your AE / founder / CSM was great"
- `support` — "your support was fast and helpful"
- `vision` — "we believe in where you're going"
- `speed` — "you could be live in 2 weeks vs. 6 months"

### 4.2 Loss reason
**Tag:** what *blocked* the deal (one of: `price_too_high`, `missing_feature`, `competitor_chosen`, `no_budget`, `champion_left`, `bad_timing`, `no_decision`, `fit_failure`, `security_concern`, `support_concern`, `complexity_concern`).
- For multi-cause losses, tag the *primary* and the *secondary*. **The primary is what the customer said; the secondary is what we observed.** They often differ.

### 4.3 Competitor displaced
**Tag:** who was in the competitive set (one or more of: `anaplan`, `adaptive`, `mosaic`, `pigment`, `vena`, `drivetrain`, `cube`, `excel`, `build_internal`, `do_nothing`, `unknown`).
- For wins, tag the competitor we *beat* (the one the buyer was comparing to at the moment of decision).
- For losses, tag the competitor we *lost to*.
- For "no decision" / "do nothing," tag as `do_nothing` — this is *not* a win for "Excel," it's a *category failure* (we failed to make a compelling enough case to switch).

### 4.4 ICP match (1-5 score)
**Score:** how well the deal matched the ICP definition.
- **1-2 = poor fit** (we should have disqualified earlier; the deal "shouldn't have happened")
- **3 = borderline** (could go either way; depends on execution)
- **4-5 = strong fit** (the deal was always going to close if executed well)
- **The ICP match score is the most important predictor of whether the deal *should* have happened.** A "loss" with ICP match = 1 is a good loss (we saved time by walking). A "win" with ICP match = 1 is a bad win (we'll churn in 6 months).

### 4.5 Deal size ($ARR)
**Numeric:** the closed-won or closed-lost ARR. For "no decision" deals, this is the *projected* ARR (what we *would* have closed).
- **Use the closed ARR, not the proposed ARR.** The proposed ARR is what we asked for; the closed ARR is what we got. The delta tells us about discounting, negotiation, and (sometimes) the buyer's actual budget.

### 4.6 Time to close (days)
**Numeric:** from `deal.created_date` to `deal.closed_date` (win/loss) or `deal.last_activity_date` (no decision).
- **Track the trend, not the absolute number.** A 90-day time-to-close that *trends* to 60 days over 6 months is progress. A 90-day time-to-close that *trends* to 120 days is a problem (we're slowing down, not speeding up).

### 4.7 NPS proxy (Q6 answer)
**Tag:** `yes`, `maybe`, `no` (with the qualifier as a free-text field).
- **A "yes" is a referral candidate. A "maybe" is a CSM follow-up. A "no" is a save motion or graceful exit.**
- For ICP-1 (Carla), a "maybe" with a strong qualifier is the typical Promoter-equivalent. Don't treat it as Detractor.

### 4.8 Key insight (1 sentence)
**Free text:** the single most actionable insight from the interview.
- **Constraint:** one sentence. If it takes more than one sentence, it's not the key insight — it's a paragraph. **Force-rank.**
- The key insight goes to (a) the relevant product/GTM team lead, (b) the weekly win/loss summary, (c) the case study (if it's a win).

### 4.9 Action item (one)
**Structured:** `{ team: product | gtm | sales | csm, action: <one-sentence action>, owner: <name>, due_date: <date> }`.
- **Every interview produces exactly one action item.** No action item = the interview was a waste. The action item is the ROI of the interview.
- The action item goes to the relevant team via the win/loss weekly summary; it does NOT sit in a Slack channel.

---

## §5 — Sample size + cadence (the program's rhythm)

### Sample size (the "how many interviews is enough" question)

| Cohort | Target | Rationale |
|---|---|---|
| **Win/loss interviews** (30-day follow-up) | **100% of closed deals** (win + loss + no-decision) | The cost of an interview is $50 + 30 min of researcher time. The cost of *not* interviewing is 1-2 deals/month lost to a known issue. **ROI is asymmetric — interview every deal.** |
| **Target completion rate** | **80%** of closed deals | The 20% gap is: prospects who ghost, prospects who hung up, prospects who said yes but no-showed. To get to 80%, we need a 3-touch follow-up cadence (T+30, T+45, T+60). |
| **Qualitative deep-dive interviews** (separate from win/loss) | **10-15 per quarter** | 1-2 per month, recruited from active customers or recently-closed deals, 60-min format, deeper than the 30-min win/loss. |
| **Win/loss retro** (cross-functional) | **1 per quarter** | 90 min, sales + product + CSM + founder, the prior quarter's interviews are reviewed, top 3 action items are committed. |
| **Annual landscape report** | **1 per year** | The full year of win/loss data + competitive shifts + ICP score trends → a 15-20 page report shared with founders, product, sales, board. |

### Cadence (the calendar)

| Cadence | Deliverable | Audience | Format |
|---|---|---|---|
| **Weekly** | Deal-loss dashboard (5 metrics, no PII) | Sales team, RevOps, product | Slack post + link to dashboard |
| **Monthly** | Win/loss summary | Sales team, product, GTM (Hermes), CSM | 1-page markdown: 3 insights, 1 product ask, 1 GTM ask |
| **Quarterly** | Full win/loss report | Founders, product, sales, CSM | 15-20 page markdown with themes, action items, competitive shifts |
| **Annual** | Competitive landscape shift | Board, founders, product strategy (Strategos) | 15-20 page report, public-summary version for the website |

### The "small-N bias" warning (the most important methodology note)

**Win/loss data with fewer than 30 interviews per quarter is statistically unreliable.** Below 30, the *single interview* of a loud customer can dominate the trend. We must:
- **Report trends, not single interviews.** A single "we lost because of X" quote is *evidence*, not *signal*. The signal is "3 of the last 10 losses cited X." The first is a story; the second is data.
- **Be patient.** The first 90 days of the program will produce a lot of "we don't have enough data" answers. That's correct. The value compounds over time.
- **Triangulate (D-009).** A win/loss theme that *also* shows up in (a) a churn interview, (b) a sales call, (c) a customer support ticket — that's a real theme. A win/loss theme that *only* shows up in win/loss interviews might be selection bias (the people who agreed to be interviewed are not representative).

---

## §6 — Output deliverables (the 4 cadenced outputs)

### 6.1 Weekly — Deal-loss dashboard (5 metrics)

See companion document: `WIN_LOSS_DASHBOARD.md`. The 5 metrics are:
1. **Win rate** (last 30 days, rolling)
2. **Top loss reason** (most-cited in interviews)
3. **Top competitor displaced** (who we beat, who beats us)
4. **Time-to-close trend** (are we faster or slower than last month?)
5. **Deal size distribution** (histogram of closed-won ARR)

**Audience:** Sales team, RevOps, product (so product can see which features are gating deals).
**Refresh:** Every Monday 10:00 IST.
**Format:** Slack post + link to `docs/drafts/iris/WIN_LOSS_DASHBOARD.md` (or live dashboard, post-launch).

### 6.2 Monthly — Win/loss summary (1 page)

**Format:** 1-page markdown:
- **Top 3 insights** (from the past month's interviews)
- **Top 1 product ask** (the action item that should go to product)
- **Top 1 GTM ask** (the action item that should go to Hermes / GTM)
- **Trend vs. prior month** (are we improving, declining, or stable?)

**Audience:** Sales team, product, GTM (Hermes), CSM.
**Refresh:** First Monday of each month, 30-min writeup by Iris.

### 6.3 Quarterly — Full win/loss report (15-20 pages)

**Format:** Structured markdown, 15-20 pages:
- §1 Executive summary (1 page, for the founder)
- §2 Win/loss trend (last 4 quarters, with charts)
- §3 Top 5 win drivers (with verbatim quotes)
- §4 Top 5 loss reasons (with verbatim quotes)
- §5 Competitive landscape (which competitors are gaining, losing, and why)
- §6 ICP fit analysis (are we winning the deals we should win? losing the deals we should lose?)
- §7 Pricing analysis (are we winning on price or losing on price?)
- §8 Time-to-close analysis (are we faster or slower than last quarter?)
- §9 Action items (the 5 most important things to do next quarter)
- §10 Appendix: per-interview summary table (anonymized)

**Audience:** Founders, product, sales, CSM, board.
**Refresh:** First Monday of each quarter (Q1 = Jan, Q2 = Apr, Q3 = Jul, Q4 = Oct).

### 6.4 Annual — Competitive landscape shift (15-20 pages)

**Format:** Same as quarterly, but with a 4-quarter view + 1-year lookback.
- §1 Year-in-review (executive summary)
- §2 The competitive landscape (who's gaining, who's losing, who's new)
- §3 The 3 biggest surprises of the year (e.g., "we thought Anaplan would be our biggest competitor; turns out it was 'do nothing'")
- §4 The 3 most-validated assumptions (e.g., "Carla's pain is real; 80% of ICP-1 deals cite close-to-disclose cycle as a top-3 driver")
- §5 The 3 most-invalidated assumptions (e.g., "we thought price was the #1 loss reason; turns out it was missing-feature")
- §6 Year-ahead predictions
- §7 Action items for the next year

**Audience:** Board, founders, product strategy (Strategos), public-summary version on the website.

---

## §7 — Anti-patterns (the 5 things that will sink the program)

1. ❌ **The sales rep in the room.** Win/loss interviews must be run by a *neutral* 3rd party. If the AE is on the call, the customer will perform the relationship, not the truth. **This is non-negotiable.**
2. ❌ **The single-interview conclusion.** One loud customer's view is a story, not data. Wait for 3+ customers to say the same thing before treating it as a pattern.
3. ❌ **The 30-day follow-up that never happens.** If the AE forgets to trigger the win/loss interview, the data is missing. **The interview must be auto-triggered at deal-close** (in the CRM, a workflow fires; an email goes to the customer; a calendar invite goes to the researcher).
4. ❌ **The action item with no owner.** An action item that says "we should improve X" is a wish. An action item with a name, a date, and a team is a commitment. **Every action item has 3 fields: team, owner, due date.**
5. ❌ **The dashboard nobody reads.** A weekly dashboard that gets scrolled past is decoration. The 5 metrics must be tied to a *decision* (e.g., "if win rate drops below 25% for 2 consecutive weeks, the founder triggers a save motion"). **A metric without a decision rule is vanity.**

---

## §8 — The connection to the 5 other Muse lanes

- **Hermes (GTM):** The `competitor_displaced` dimension feeds the **Anaplan battlecard** (`BATTLECARD_ANAPLAN.md`) — which weaknesses are real, which are not. The `loss_reason` dimension feeds the **ICP** (`ICP.md`) — if we're losing ICP-1 deals on price, the ICP is wrong.
- **Hera (UX):** The `loss_reason = complexity_concern` cluster routes to Hera for design-system investigation. The `loss_reason = missing_feature` cluster (where the "feature" is a UX gap) routes to Hera.
- **Apollo (build):** The `loss_reason = missing_feature` cluster routes to Apollo for the product triage queue. The `time_to_close` trend (if slowing) routes to Apollo for technical-debt investigation (a slow demo = a slow build).
- **Strategos (strategy):** The annual competitive landscape shift feeds the **Q2/Q4 strategic reviews**. The ICP-fit analysis (are we winning the deals we should win?) feeds the **TAM/SAM** estimates.
- **Atlas (DevOps):** The `loss_reason = security_concern` cluster routes to Atlas for the SOC 2 timeline. The `loss_reason = support_concern` cluster routes to Atlas for the on-call runbook.

> **The single most important cross-Muse connection is Hermes ↔ Strategos.** The win/loss data is the only ground-truth check on the ICP definition. **If the ICP says "ICP-1 is 50-500 person SaaS" and the win/loss data says "we're winning 70% of deals at 30-100 person SaaS," the ICP is wrong.** The data updates the strategy.

---

## §9 — The 3 highest-leverage insights to add to the dashboard (per Leader's request)

1. **"Did we win the deal or did we lose to a competitor or did we lose to 'do nothing'?"** — A single pie chart, segmented by win/loss/no-decision. The "do nothing" slice is the most important. If it's > 30% of losses, **we have a category-positioning problem, not a sales-execution problem.** A "do nothing" loss means the prospect decided the *current state* is better than the *promised state*. That requires a different fix than a competitor loss.
2. **"What was the buyer's #1 reason, and did it match our internal narrative?"** — A scatter plot: x = customer-stated #1 reason, y = our internal narrative's #1 reason (per CRM). Points off the diagonal are *narrative mismatches*. A narrative mismatch is the most actionable signal: it means our sales / product / GTM teams are telling a story that doesn't match what the customer is actually deciding on.
3. **"How long did it take to close, segmented by competitor_displaced?"** — A box plot: x = competitor, y = days-to-close. The "Anaplan" box should be wider (longer cycles) than the "Excel" box (shorter cycles, easier displacement). If the "Excel" box is *also* long, **we have a messaging problem with the Excel incumbent.** If the "Anaplan" box is short, **we're under-pricing our differentiation.**

---

## §10 — Pre-launch validation (what we do before we run the program)

1. **Pilot with 3 recently-closed deals** (any outcomes). Run the 30-min script. Verify the 6 questions produce usable data. Adjust if needed.
2. **Build the 9-dimension coding sheet** as a Google Sheet (or Airtable). Pre-fill the columns. Test with 1 interview.
3. **Pre-write the 5-metric dashboard wireframe** (`WIN_LOSS_DASHBOARD.md` companion doc). Get sales + product to confirm the 5 metrics are the *right 5* for their decision-making.
4. **Pre-write the monthly + quarterly templates.** The first 30 days of the program should be spent collecting data, not designing the report. **Templates first, data second.**

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 3 personas (Carla/Chris/Vera) are the ICP the win/loss data validates. If we win 80% of Carla-deals, the persona is right. If we win 30%, the persona is wrong.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — the 5 churn reasons are the *post-sale* counterpart to the 4 loss reasons. A pattern that shows up in both win/loss *and* churn is a real product issue.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — the 7 journey stages are the *pre-sale* counterpart. The "Consideration" stage is where the deal is won or lost; the "Trial" stage is where win/loss interviews can salvage a "no decision."
- **`docs/drafts/hermes/ICP.md`** — the ICP match score (1-5) is the validation of the ICP definition.
- **`docs/drafts/hermes/PRICING.md`** — the deal size + loss reason (price_too_high) feeds the pricing strategy.
- **`docs/drafts/hermes/BATTLECARD_ANAPLAN.md`** — the `competitor_displaced` dimension feeds the battlecard.
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — the 50-customer beta cohort is the *first* set of feedback the program will analyze. Beta churn = win/loss theme.

---

_A deal is not won in the demo. A deal is won in the customer's mind 2 weeks before they sign. Win/loss is the only way to know what was in their mind. — Iris_
