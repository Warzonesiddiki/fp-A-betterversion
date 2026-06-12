<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — NPS Survey Design (T-IR-003)

> **Muse:** Iris.
> **Status:** D-007 "pre-write next" draft — awaiting T-IR-003 task creation in the system task board.
> **Scope:** NPS survey design for FinPlan Pro — methodology, cadence, segmentation, routing, dashboards, and the FP&A-specific nuances that make a vanilla NPS-survey useless for our market.
> **Companions:** `PERSONAS.md` (3 personas), `JOURNEY_MAP_CARLA.md` (7 stages), `CHURN_FRAMEWORK.md` (5 reasons), `CHURN_EVENTS_TAXONOMY.md` (event taxonomy).
> **Three-witness rule:** every claim = (a) user quote, (b) observed behavior, (c) the alternative or interpretation.

---

## Why a vanilla NPS survey fails for FP&A (and what to do instead)

NPS (Net Promoter Score, Reichheld 2003) is the standard "how likely are you to recommend us" 0-10 question. It's a good *system*, but for FP&A users, a vanilla NPS survey has 3 problems that make the data worse than useless:

1. **FP&A users don't give 10s lightly.** A CFO is a measured, board-politically-calibrated person. They have given 10s to about 2 products in their career. A vanilla NPS survey will skew our average down by 1-2 points for ICP-1, making us look bad to the team and triggering bad product decisions.

2. **The "open comment" is the entire signal for B2B.** The 0-10 number in B2B is the *headline*; the open comment is the *insight*. A 9 with "but the export to PDF is broken on Mondays" is a more actionable data point than a 10 with no comment. **A NPS survey without the open comment is a vanity metric.**

3. **Timing matters more than the question itself.** A NPS at Day 7 is noise (user hasn't formed an opinion). A NPS at Day 30 is signal. A NPS at Day 90 is the *real* signal (the user has lived through one full close cycle). **Cadence is half the design.**

The design below fixes all 3.

> **The single most important thing in this design:** We do NOT send NPS to all personas at the same cadence, and we do NOT interpret the same NPS number the same way for Carla, Chris, and Vera. **NPS is per-persona, per-stage, per-cohort.** A single global NPS is a lie.

---

## §1 — The 3 questions (the actual survey)

**Channel:** In-app (modal, dismissible, 1 question at a time) + email fallback (for non-active users).

**Format:** 3 questions, ~30 seconds total. Designed for completion on mobile.

### Q1. The NPS (the standard)

> **"On a scale of 0-10, how likely are you to recommend FinPlan Pro to a peer in a similar finance role?"**

- **Why "peer in a similar finance role"** and not "friend or colleague": FP&A people don't recommend tools to friends; they recommend to peers. The word "peer" is the trust signal that makes the 10s come out.
- **Scale:** 0-10 (standard, no modification). The industry-comparability is worth more than any custom tweak.
- **Optional:** Add a one-line context below the question: "We use this to make the product better. Your individual response is never shared."

### Q2. The follow-up (the most predictive question — the open comment)

> **"What's the ONE thing that would make you more likely to recommend us?"** *(free text, optional but encouraged)*

- **Why "the ONE thing"** and not "what can we improve": A single-thing question forces the user to pick the highest-leverage friction. Multi-improvement questions produce a 4-item list that nobody reads.
- **Why "more likely"** and not "change about us": Reframes the question as additive, not corrective. Users who are already Promoters (9-10) answer "more integrations." Users who are Passives (7-8) answer "the export to Excel." Users who are Detractors (0-6) answer "faster support." **The follow-up question stratifies the response better than the 0-10 number itself.**

### Q3. The persona-anchor (the routing question)

> **"Which best describes you?"** *(single-select, optional)*
> - I'm a **CFO / VP Finance** (I make the buying decision)
> - I'm a **Controller / Head of Finance** (I run the day-to-day)
> - I'm an **FP&A analyst** (I build the models)
> - Other: \_\_\_\_

- **Why we ask this:** We already infer persona from behavior, but the user-stated persona is the ground truth for the *segmentation that goes to leadership*. The inferred persona is for product decisions; the stated persona is for board-deck NPS. The two will disagree ~15% of the time, and we report both.

**Total survey length:** 3 questions, ~30 seconds. Fits in the attention budget of every persona, including Chris (lowest attention budget).

---

## §2 — Survey cadence (per persona, per stage)

The right cadence for FP&A is **NOT** "send quarterly." It is:

| Moment | Persona | When | Why this moment |
|---|---|---|---|
| **T+30 (Day 30)** | All | 30 days after first value | **Too early for a "how likely" question, but the right moment for a "first 30 days" question.** *Use this as a soft check-in, not a true NPS.* |
| **T+90 (Day 90)** | All | 90 days after install | **The first real NPS.** The user has lived through one close cycle, one board pack, and 2+ scenario runs. They have an opinion. |
| **T+180 (Day 180)** | All | 6 months after install | **The renewal-cycle NPS.** For ICP-1/ICP-2, this is 2-3 months before renewal. The data lands in time for save-motion. |
| **T+365 (Day 365)** | All | 1 year after install | **The anniversary NPS.** Long-tenure signal. Catches the "we forgot about you" churn pattern. |
| **Post-incident (event-triggered)** | All | 7 days after a SEV-1/SEV-2 incident | **The trust-recovery NPS.** A user who experienced a SEV-1 will give a different NPS at T+90 than they would have pre-incident. This is the way to measure trust recovery. |
| **Post-champion-departure (event-triggered)** | ICP-1/2 | 14 days after a CSM-flagged champion departure | **The replacement-user NPS.** The new champion has a different baseline. Re-baseline or the data is misleading. |

**For ICP-3 (Chris):** T+30 / T+90 / T+180 only. Chris doesn't have the same board-cycle. Don't over-survey — Chris will churn *because of* the survey, not despite it.

**For ICP-1 (Carla):** T+90 / T+180 only. The Day 30 NPS is too early for a CFO; they'll mark it 7-8 and never look at the survey again. **Wait until the opinion is formed.**

**For ICP-2 (Vera):** T+90 / T+180 / T+365. Vera is a lurker; her survey-tolerance is low. Three surveys per year max, plus the post-incident trigger.

> **The "more is better" trap:** Sending monthly NPS will tank our response rate AND tank our NPS score. FP&A users are skeptical of "we just want your feedback" motions. **Cadence discipline IS the design.**

---

## §3 — Segmentation (Promoter / Passive / Detractor)

### The standard segmentation (don't change it — comparability matters)

| NPS | Segment | Standard meaning | FinPlan Pro meaning |
|---|---|---|---|
| 9-10 | **Promoter** | Will recommend, defends against detractors, expansion-ready | Will refer, will case-study, will speak at our customer dinner |
| 7-8 | **Passive** | Satisfied but unenthusiastic, vulnerable to competitors | At-risk for churn; will not refer; needs value-anchor call |
| 0-6 | **Detractor** | Unhappy, will churn, will damage brand | **Save motion NOW** OR **graceful exit interview** |

### The per-persona interpretation (the FP&A-specific nuance)

The 0-10 number means different things per persona. Use these as a *first-pass filter*, then read the open comment.

| NPS | Carla (ICP-1) | Chris (ICP-3) | Vera (ICP-2) |
|---|---|---|---|
| 9-10 | **Extremely rare.** Carla's max is 8 normally. A 9-10 from Carla is a "I'd write a case study" signal. | **Common.** Chris's typical NPS. Often correlated with "the import worked." Take with a grain of salt. | **Rare.** Vera's 9-10 means she's switched off Anaplan. **This is a category-defining reference.** |
| 7-8 | **Carla's baseline.** This is "I'm satisfied, I won't churn, I won't refer." **This is the #1 most-important segment to convert to Promoter.** | At-risk for churn. Often correlated with "I never got past the first import." | Vera's baseline. Means "the modeling power is close to Anaplan but not there yet." Save motion = roadmap conversation. |
| 0-6 | **Save motion NOW.** Carla is 30-60 days from churn. CSM escalation. | Often = "I never used it" or "I couldn't figure it out." Save motion = CSM 1:1 walkthrough. | **Almost always a fit-failure.** Vera doesn't give 0-6 lightly. Graceful exit + 90-day re-eval. |

> **The 7-8 Passive is the single most important segment to convert.** 60-70% of our NPS responses will land in 7-8. **The product team's job is to move 30% of Passives to Promoters per year.** That's the goal that compounds.

---

## §4 — Routing logic (what happens after the survey is submitted)

The routing logic is **automatic** for low-touch actions and **CSM-triggered** for high-touch.

### Auto-routing (no human)

| NPS | Open comment sentiment | Action |
|---|---|---|
| 9-10 | Positive | Add to **referral-program list** (CSM triggers in week 1); fire `evangelism.case_study_eligible` event |
| 9-10 | Negative or mixed | Flag for **CSM review** — a 10 with a negative comment is a confused Promoter; get the comment into the product team's triage |
| 7-8 | Positive | Add to **value-anchor call list** (CSM-trigger, 30-min, "what would make this a 9?") |
| 7-8 | Negative | Add to **product-triage queue** with high priority; route by topic (perf → Prometheus, support → Atlas, UX → Hera) |
| 0-6 | Any | **CSM escalation within 24h** — see churn framework Reason 1 and 3 prevention; this is a save motion |

### CSM-triggered (high-touch)

| Trigger | Action | Owner | Channel |
|---|---|---|---|
| NPS 0-6 from ICP-1/ICP-2 | **Save call within 24h**: 30-min CSM + AE. Goal: prevent churn. Reference `CHURN_FRAMEWORK.md` Reason 1, 3, 5. | CSM + AE | Video call |
| NPS 0-6 from ICP-3 | **CSM-light 1:1 within 48h**: 15-min "what got in the way?" Goal: convert Detractor to Passive via UX fix. | CSM | Video call |
| NPS 9-10 from any persona | **Referral ask within 1 week**: "Who else do you know who needs this?" CSM enables, doesn't ask. | CSM | 1:1 video or personal email |
| NPS 7-8 from Carla | **QBR invitation**: invite Carla to the next quarterly business review. Frame as "we want to show you the 5 things we're shipping next." | CSM + AE | Email |
| Open comment contains "competitor" | **AE save motion within 48h**: "I noticed you mentioned [competitor] — can we show you what we have that they don't?" | AE | Video call |
| Open comment contains "feature" or "missing" | **Product triage within 1 week**: route to PM queue with NPS context. | PM | GitHub issue |

### The "do nothing" trap

The default for a 7-8 should be **value-anchor call**, not "wait for the next survey." A Passive who is not engaged is a churn event waiting to happen. **The CSM queue is the lifeblood of the NPS system; without it, the survey is decoration.**

---

## §5 — The dashboard (per-persona, per-cohort, per-quarter)

Five dashboards, refreshed weekly. All segmented by persona and account tier.

### Dashboard 1 — Overall NPS Trend (for the leadership team)

| Chart | Source | Cadence |
|---|---|---|
| NPS over time (line, 4-week rolling) | All responses | Weekly |
| NPS by persona (grouped bar, current quarter) | All responses | Weekly |
| NPS by tier (Solo / Team / Enterprise) | All responses | Weekly |
| Promoter / Passive / Detractor distribution (stacked area) | All responses | Weekly |
| Response rate (line, target >35% per survey wave) | Survey system | Weekly |

### Dashboard 2 — NPS by Journey Stage (for the product team)

| Chart | Source | Cadence |
|---|---|---|
| NPS by stage (T+30, T+90, T+180, T+365) | All responses, grouped by survey moment | Weekly |
| NPS by stage × persona (heatmap) | All responses | Weekly |
| The "first NPS" trend (T+90 specifically) | All responses, filtered to first NPS only | Weekly |

### Dashboard 3 — The Open-Comment Themes (for the product team)

| Chart | Source | Cadence |
|---|---|---|
| Top 10 themes (word cloud / topic model) | Open comments, NLP-clustered | Weekly |
| Theme × persona (heatmap) | Cross-tab | Weekly |
| Theme × NPS bucket (which themes drive Promoter, which drive Detractor) | Cross-tab | Weekly |
| "Competitor mentions" over time (line) | Open comments, regex | Weekly |

### Dashboard 4 — The Save-Motion Tracker (for the CSM team)

| Chart | Source | Cadence |
|---|---|---|
| Detractor save rate (NPS 0-6 → recovered to Passive in 30 days) | CSM-tracked | Weekly |
| Save-motion completion rate (did we call the Detractor within 24h?) | CSM-tracked | Weekly |
| Save-motion → retention conversion (saved Detractor still active 90 days later) | CSM-tracked | Weekly |
| Promoter → referral conversion (Promoter who referred 1+ peer) | CSM-tracked | Weekly |

### Dashboard 5 — NPS by Incident (for the on-call team)

| Chart | Source | Cadence |
|---|---|---|
| NPS delta before/after SEV-1/SEV-2 incidents | Cross-reference incident log with NPS by user | Per-incident |
| Trust-recovery time (NPS returns to pre-incident level in N days) | Cross-reference | Monthly |
| Incident × NPS bucket heatmap | Cross-reference | Monthly |

> **The single most important dashboard is Dashboard 3 (Open-Comment Themes).** The 0-10 number is the headline; the open comment is the *insight*. If we can only ship one dashboard, ship that one.

---

## §6 — The methodology (so the team doesn't argue about math)

### NPS Score (the math)

> **NPS = % Promoters (9-10) − % Detractors (0-6)**
>
> Passives (7-8) are not counted in the numerator or denominator. They are the "excluded middle" — the people we are trying to convert.

The score ranges from **-100** (everyone is a Detractor) to **+100** (everyone is a Promoter). For B2B SaaS, a "good" NPS is **+30 to +50**; "great" is **+50 to +70**; "exceptional" is **>+70**. **For FP&A specifically, our target NPS is +40 by end of Year 1** (the FP&A ceiling is lower than consumer SaaS because of the persona dynamic — see §3).

### Response rate (the floor)

A NPS survey with <30% response rate is statistically unreliable. **Target response rate: >35% per wave.** If the response rate drops below 25%, the survey cadence is too aggressive or the question wording is too long.

### Cohort definition (the rule)

Always report NPS **by cohort** (users who installed in the same month), never as a global "current NPS." A global NPS averages new users (high-enthusiasm early) with old users (more critical late) and hides the cohort-level story. **The metric that matters is "NPS of the users who installed in March 2026" — not "current NPS."**

### The "leading vs lagging" distinction

- **Leading indicators** (T+30, T+90) predict *retention*. A falling T+90 NPS predicts a falling T+180 NPS.
- **Lagging indicators** (T+180, T+365) measure *retention*. A falling T+180 NPS predicts a falling renewal rate.

**Report both. The leading is the early-warning; the lagging is the ground truth.**

---

## §7 — The "what could go wrong" pre-mortem (the 5 things that will sink this if we don't catch them)

### Pre-mortem 1: Response rate tanks because the survey is too aggressive

- **Symptom:** T+30 response rate drops from 35% to 15% after the first wave.
- **Cause:** Survey is too long, or sent too often, or worded like a sales motion.
- **Fix:** Cut the survey to 1 question (Q1 only) for the first wave. Add Q2 and Q3 only if Q1 response rate is >30%. **Cut first, expand later.**

### Pre-mortem 2: NPS is low because we're surveying the wrong moment

- **Symptom:** T+30 NPS is -10, T+90 NPS is +25, T+180 NPS is +45.
- **Cause:** We're over-indexing on early users (still in the "complexity churn" pattern from `CHURN_FRAMEWORK.md` Reason 2).
- **Fix:** Report T+90 and T+180 as the *real* NPS, and T+30 as a "trial health" metric. Don't put T+30 in the headline NPS chart.

### Pre-mortem 3: The open-comment NLP is too crude

- **Symptom:** The "top themes" dashboard shows "the," "to," "and" as the top 3 themes.
- **Cause:** No stopword filtering, no stemming, no topic model. Raw word counts are noise.
- **Fix:** Use a proper topic-modeling tool (e.g., LDA, BERTopic). Manually seed the topic list with the 15 most-likely themes (perf, support, missing feature, price, ease of use, etc.). Don't trust the model until a human has validated it on the first 100 comments.

### Pre-mortem 4: The CSM queue overflows

- **Symptom:** Detractor save calls are 3+ days late because the CSM has 40+ open NPS follow-ups.
- **Cause:** The "Detractor save within 24h" rule is not staffed. CSM is at capacity.
- **Fix:** Either (a) hire a CSM dedicated to NPS-driven saves, or (b) cap the CSM load at 20 ICP-1 / 30 ICP-2 / 50 ICP-3 accounts (per the churn framework Reason 4 prevention). The cap is a *product* decision, not a sales decision.

### Pre-mortem 5: The NPS becomes a vanity metric (worst outcome)

- **Symptom:** NPS is reported to the board, but no product decision has been changed by it in 6 months.
- **Cause:** NPS data is collected but not connected to the roadmap.
- **Fix:** Make NPS-driven decisions visible. Once per quarter, the product team publishes: "This quarter, we shipped [X] because NPS theme [Y] was the #1 Detractor theme." If the product team can't point to NPS-driven decisions, the survey is decoration.

---

## §8 — Pre-launch validation (what we do before we go live)

We can validate the survey *before* launch by:

1. **Cognitive walkthrough with 5 FP&A friends-of-the-founder.** Show them the 3 questions. Ask: "What does this measure?" If they can't tell us, the question is unclear.
2. **A/B test the open-comment question wording** (Q2). "What's the ONE thing..." vs. "What would make this a 10 for you?" — same intent, different wording. We want the one that produces a higher comment rate (a 25%+ comment rate is the target).
3. **Sanity check the persona routing** (Q3). Make sure the 3 persona options match the actual user base. If our beta cohort is 50% Chris and 20% Carla, the 4th option (Other) should be larger than expected, and the persona routing might need a 4th option.

---

## §9 — What this design doesn't cover (and why)

- ❌ **In-product micro-surveys** (e.g., a 1-emoji scale after every scenario run). These are different from NPS — they measure *moment-level satisfaction*, not *relationship-level satisfaction*. Different design, different cadence. **Out of scope.**
- ❌ **Customer Effort Score (CES)** — a "how easy was it to do X" 1-7 scale. Useful for specific interactions (e.g., "how easy was the import?") but not a replacement for NPS. Could be added as Q4 in a future iteration.
- ❌ **CSAT (Customer Satisfaction)** — a 1-5 star rating. Mostly redundant with NPS for our use case. Skip.
- ❌ **NPS for the *internal* team** (our engineers' NPS on their tools). Different audience, different design. **Out of scope.**

---

## §10 — The 3 highest-leverage decisions baked into this design

1. **T+90 is the first real NPS, not T+30.** T+30 is a "trial health" check; T+90 is the headline. This protects us from over-reacting to early-user complexity churn (Reason 2 in the churn framework).
2. **The persona-routing question (Q3) is mandatory.** A global NPS is a lie. The per-persona NPS is the truth. We report both, but the persona-segmented version goes to leadership.
3. **The open-comment question (Q2) is the most predictive signal.** A NPS without the open comment is a vanity metric. The open comment is what moves the product roadmap.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — Carla's NPS baseline is 7-8; Chris's is 8-9; Vera's is 6-7. The "Promoter" threshold is per-persona.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — the NPS moments (T+30, T+90, T+180, T+365) align with the journey stages (Trial, Habit, Evangelism).
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Detractor NPS is the leading indicator of Reasons 1, 3, and 5 churn; Passive NPS is the leading indicator of Reason 2 (Complexity).
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the `save.*` events are the routing actions; the NPS data is the trigger.
- **`docs/drafts/hermes/BETA_PROGRAM.md`** — the 50-customer beta cohort is the first NPS wave. Cadence starts T+30 from beta onboarding.
- **Atlas's on-call runbook** — the "post-incident NPS" trigger is wired to SEV-1/SEV-2 closures.
- **Apollo's analytics taxonomy** — the `nps.survey_sent` / `nps.survey_completed` / `nps.score_X` events need to be added to the event taxonomy.

---

_A score you don't act on is a number on a slide. A score you act on is a product decision. Build the system that makes NPS data *force* a product decision. — Iris_
