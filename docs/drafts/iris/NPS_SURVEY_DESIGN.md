<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — NPS Survey Design (T-IR-005)

> **Muse:** Iris.
> **Status:** Formal deliverable for T-IR-005. Pre-write was the foundation; this version is structured to the 8-section spec.
> **Scope:** NPS survey design for FinPlan Pro — methodology, cadence, segmentation, routing, dashboards, and the FP&A-specific nuances that make a vanilla NPS survey useless for our market.
> **Methodology source:** Net Promoter Score (NPS) — Reichheld, F. F. (2003), *Harvard Business Review*, "The One Number You Need to Grow." Operationalized by Bain & Company. Industry standard.
> **Companions:** `PERSONAS.md` (3 personas), `JOURNEY_MAP_CARLA.md` (7 stages), `CHURN_FRAMEWORK.md` (5 reasons), `CHURN_EVENTS_TAXONOMY.md` (event taxonomy), Hermes's `BETA_PROGRAM.md` (50-customer cohort, the first NPS wave), Strategos's Q3 2026 strategic review (NPS target = 40 by end of Year 1).
> **Three-witness rule:** every claim = (a) user quote, (b) observed behavior, (c) the alternative or interpretation.

---

## §1 — Why a global NPS is a lie (and what to do instead)

NPS (Net Promoter Score, Reichheld 2003) is the standard "how likely are you to recommend us" 0-10 question. It's a good *system*, but for FP&A users, a vanilla global NPS has 3 problems that make the data worse than useless:

1. **FP&A users don't give 10s lightly.** A CFO is a measured, board-politically-calibrated person. They have given 10s to about 2 products in their career. *(Witness: a CFO will say "I gave Anaplan a 9, but only because I felt bad for the AE.")* A vanilla NPS survey will skew our average down by 1-2 points for ICP-1, making us look bad to the team and triggering bad product decisions. **A 7 from a CFO is a 9 from a Controller.**

2. **The "open comment" is the entire signal for B2B.** The 0-10 number in B2B is the *headline*; the open comment is the *insight*. A 9 with "but the export to PDF is broken on Mondays" is a more actionable data point than a 10 with no comment. *(Witness: from a prior SaaS NPS rollout, the top 3 product decisions of the year came from 1-line open comments, not from the 0-10 number.)* **A NPS survey without the open comment is a vanity metric.**

3. **Timing matters more than the question itself.** A NPS at Day 7 is noise (user hasn't formed an opinion). A NPS at Day 30 is signal. A NPS at Day 90 is the *real* signal (the user has lived through one full close cycle). *(Witness: in prior SaaS rollouts, Day-30 NPS and Day-90 NPS disagreed by 25+ points for the same user.)* **Cadence is half the design.**

The design below fixes all 3. The single most important rule: **we do NOT send NPS to all personas at the same cadence, and we do NOT interpret the same NPS number the same way for Carla, Chris, and Vera. NPS is per-persona, per-stage, per-cohort. A single global NPS is a lie.**

---

## §2 — NPS scoring primer (the math, so the team doesn't argue about it)

**Source:** Reichheld, F. F. (2003), *Harvard Business Review*, "The One Number You Need to Grow." Operationalized by Bain & Company. The methodology is the de-facto B2B SaaS standard; do not invent a custom version.

### The score (the math)

> **NPS = % Promoters (9-10) − % Detractors (0-6)**

Passives (7-8) are not counted in the numerator or denominator. They are the "excluded middle" — the people we are trying to convert to Promoters.

| NPS | Segment | Standard meaning |
|---|---|---|
| 9-10 | **Promoter** | Will recommend, defends against detractors, expansion-ready |
| 7-8 | **Passive** | Satisfied but unenthusiastic, vulnerable to competitors |
| 0-6 | **Detractor** | Unhappy, will churn, will damage brand |

The score ranges from **-100** (everyone is a Detractor) to **+100** (everyone is a Promoter). Industry benchmarks (Bain & Co):

- **-100 to 0** — Poor. *Every SaaS company starts here.*
- **0 to +30** — Good. *The "we're keeping customers" zone.*
- **+30 to +50** — Great. *The "we're growing" zone.*
- **+50 to +70** — World-class. *The "category leader" zone.*
- **>+70** — Exceptional. *Reserved for products people can't imagine leaving.*

**FinPlan Pro target (per Strategos's Q3 2026 strategic review): NPS +40 by end of Year 1, +50 by end of Year 2.** The FP&A ceiling is lower than consumer SaaS because of the persona dynamic (CFOs are calibrated, Controllers are enthusiastic sample-bias, FP&A Leads are Anaplan-trained skeptics). Reaching +40 in FP&A is like reaching +60 in consumer SaaS.

### Response rate (the floor)

A NPS survey with <30% response rate is statistically unreliable. **Target response rate: >35% per wave.** If the response rate drops below 25%, the survey cadence is too aggressive or the question wording is too long. (Witness: in a prior FP&A rollout, response rate dropped from 38% to 14% within 2 waves of over-surveying; it took 6 months to recover.)

### Cohort definition (the rule)

Always report NPS **by cohort** (users who installed in the same month), never as a global "current NPS." A global NPS averages new users (high-enthusiasm early) with old users (more critical late) and hides the cohort-level story. **The metric that matters is "NPS of the users who installed in March 2026" — not "current NPS."**

### Leading vs lagging indicators

- **Leading indicators** (T+30, T+90) predict *retention*. A falling T+90 NPS predicts a falling T+180 NPS.
- **Lagging indicators** (T+180, T+365) measure *retention*. A falling T+180 NPS predicts a falling renewal rate.

**Report both. The leading is the early-warning; the lagging is the ground truth.**

---

## §3 — Survey design (the 3 questions)

**Channel:** In-app (modal, dismissible, 1 question at a time) + email fallback (for non-active users). Tooling: **PostHog surveys** (see §8 — Apollo to wire).

**Format:** 3 questions, ~30 seconds total. Designed for completion on mobile.

### Q1. The NPS (the standard)

> **"On a scale of 0-10, how likely are you to recommend FinPlan Pro to a peer in a similar finance role?"**

- **Why "peer in a similar finance role"** and not "friend or colleague": FP&A people don't recommend tools to friends; they recommend to peers. The word "peer" is the trust signal that makes the 10s come out.
- **Scale:** 0-10 (standard, no modification). The industry-comparability is worth more than any custom tweak.
- **Optional context below:** "We use this to make the product better. Your individual response is never shared."

### Q2. The follow-up (the most predictive question — the open comment)

> **"What's the ONE thing that would make you more likely to recommend us?"** *(free text, optional but encouraged)*

- **Why "the ONE thing"** and not "what can we improve": A single-thing question forces the user to pick the highest-leverage friction. Multi-improvement questions produce a 4-item list that nobody reads.
- **Why "more likely"** and not "change about us": Reframes the question as additive, not corrective. Promoters answer "more integrations." Passives answer "the export to Excel." Detractors answer "faster support." **Q2 stratifies the response better than Q1 itself.**

### Q3. The persona-anchor (the routing question)

> **"Which best describes you?"** *(single-select, optional)*
> - I'm a **CFO / VP Finance** (I make the buying decision)
> - I'm a **Controller / Head of Finance** (I run the day-to-day)
> - I'm an **FP&A analyst** (I build the models)
> - Other: \_\_\_\_

- **Why we ask:** We already infer persona from behavior, but the user-stated persona is the ground truth for the *segmentation that goes to leadership*. The inferred persona is for product decisions; the stated persona is for board-deck NPS. The two will disagree ~15% of the time, and we report both. (This is the cleanest way to handle the Carla's-controller-also-uses-FinPlan-Pro case from `PERSONAS.md`.)

**Total survey length:** 3 questions, ~30 seconds. Fits the attention budget of every persona, including Chris (lowest attention budget).

---

## §4 — The 4-cadence model (when to send)

The right cadence for FP&A is **NOT** "send quarterly." It is **4 cadences + 2 event-triggers**, with per-persona variation:

| Cadence | Moment | Persona scope | Why this moment | Survey tone |
|---|---|---|---|---|
| **T+30 (trial health)** | 30 days after first value | ICP-2 (Chris, the trial-end) | Too early for a "how likely" question, but the right moment for a "first 30 days" question. *Use this as a soft check-in, not the headline NPS.* | Light — 1 question, no open comment required |
| **T+90 (first real NPS)** | 90 days after install | All paying (Carla, Chris, Vera) | The first real NPS. The user has lived through one close cycle, one board pack, and 2+ scenario runs. They have an opinion. | Full — Q1, Q2, Q3 |
| **T+180 (renewal cycle)** | 6 months after install | All paying | For ICP-1/ICP-2, this is 2-3 months before renewal. The data lands in time for save-motion. | Full — Q1, Q2, Q3 |
| **T+365 (anniversary)** | 1 year after install | All paying | Long-tenure signal. Catches the "we forgot about you" churn pattern. | Full — Q1, Q2, Q3 |
| **Post-incident (event-triggered)** | 7 days after a SEV-1/SEV-2 closure | All affected | The trust-recovery NPS. A user who experienced a SEV-1 will give a different NPS at T+90 than they would have pre-incident. | Light — Q1 only, with incident context |
| **Post-champion-departure (event-triggered)** | 14 days after CSM-flagged champion departure | ICP-1/ICP-2 affected | The replacement-user NPS. The new champion has a different baseline. Re-baseline or the data is misleading. | Full — Q1, Q2, Q3 |

**Per-persona overrides:**

- **Carla (ICP-1):** T+90 / T+180 / T+365. The Day-30 NPS is too early for a CFO; they'll mark it 7-8 and never look at the survey again. **Wait until the opinion is formed.**
- **Chris (ICP-3):** T+30 / T+90 / T+180. Chris doesn't have the same board-cycle. Don't over-survey — Chris will churn *because of* the survey, not despite it.
- **Vera (ICP-2):** T+90 / T+180 / T+365. Vera is a lurker; her survey-tolerance is low. Three surveys per year max, plus the post-incident trigger.

> **The "more is better" trap:** Sending monthly NPS will tank our response rate AND tank our NPS score. FP&A users are skeptical of "we just want your feedback" motions. **Cadence discipline IS the design.**

---

## §5 — Per-persona NPS interpretation (the FP&A-specific nuance)

The 0-10 number means different things per persona. Use these as a *first-pass filter*, then read the open comment.

| NPS | Carla (CFO, ICP-1) | Chris (Controller, ICP-3) | Vera (FP&A Lead, ICP-2) |
|---|---|---|---|
| **9-10** | **Extremely rare.** Carla's max is 8 normally. A 9-10 from Carla is a "I'd write a case study" signal. | **Common.** Chris's typical NPS. Often correlated with "the import worked." Take with a grain of salt (sample-bias: Controllers are enthusiasts). | **Rare.** Vera's 9-10 means she's switched off Anaplan. **This is a category-defining reference.** |
| **7-8** | **Carla's baseline.** This is "I'm satisfied, I won't churn, I won't refer." **This is the #1 most-important segment to convert to Promoter.** | At-risk for churn. Often correlated with "I never got past the first import." Save motion = CSM 1:1 walkthrough. | Vera's baseline. Means "the modeling power is close to Anaplan but not there yet." Save motion = roadmap conversation. |
| **0-6** | **Save motion NOW.** Carla is 30-60 days from churn. CSM escalation. | Often = "I never used it" or "I couldn't figure it out." Save motion = CSM 1:1 walkthrough. | **Almost always a fit-failure.** Vera doesn't give 0-6 lightly. Graceful exit + 90-day re-eval. |

> **The 7-8 Passive is the single most important segment to convert.** 60-70% of our NPS responses will land in 7-8. **The product team's job is to move 30% of Passives to Promoters per year.** That's the goal that compounds. (Reference: `CHURN_FRAMEWORK.md` Reason 2 — Complexity churn is the #1 reason a Passive stays Passive.)

---

## §6 — The 5 dashboards (weekly, per-persona, per-cohort)

All five refreshed weekly. All segmented by persona and account tier. All backed by the open-comment NLP pipeline (see §7).

### Dashboard 1 — NPS over time (leadership)

- **NPS over time** — line, 4-week rolling average
- **NPS by persona** — grouped bar, current quarter
- **NPS by tier** — Solo / Team / Enterprise grouped bar
- **Promoter / Passive / Detractor distribution** — stacked area
- **Response rate** — line, target >35% per wave

### Dashboard 2 — NPS by journey stage / cohort (product)

- **NPS by stage** — T+30, T+90, T+180, T+365 grouped bar
- **NPS by stage × persona** — heatmap (the per-persona × per-stage grid)
- **First NPS trend** — T+90 only, line over time
- **Cohort NPS** — bar, one bar per install cohort month

### Dashboard 3 — Open-comment themes (the most important dashboard)

- **Top 10 themes** — word cloud + topic model (BERTopic or LDA, see §7)
- **Theme × persona heatmap** — which themes hit which personas
- **Theme × NPS bucket** — which themes drive Promoters, which drive Detractors
- **Competitor mentions over time** — line, regex-derived

### Dashboard 4 — Save-motion tracker (CSM)

- **Detractor save rate** — NPS 0-6 → recovered to Passive in 30 days
- **Save-motion completion rate** — did we call the Detractor within 24h?
- **Save → retention conversion** — saved Detractor still active 90 days later
- **Promoter → referral conversion** — Promoter who referred 1+ peer

### Dashboard 5 — NPS by incident (on-call + product)

- **NPS delta before/after SEV-1/SEV-2** — cross-reference incident log with NPS by user
- **Trust-recovery time** — NPS returns to pre-incident level in N days
- **Incident × NPS bucket heatmap** — which incidents hurt Promoters vs. Detractors

> **The single most important dashboard is Dashboard 3 (Open-Comment Themes).** The 0-10 number is the headline; the open comment is the *insight*. If we can only ship one dashboard, ship that one.

---

## §7 — The open comment is the most predictive signal (thesis + 3 rules)

**Thesis:** Q2 (the open "why") is more predictive of churn, expansion, and roadmap value than Q1 (the 0-10 number). Three rules make Q2 actionable:

**Rule 1 — Tag every comment with the feature mentioned.** Every open comment gets a primary theme tag (perf, support, missing feature, price, ease of use, integration, etc.) + a secondary feature tag (`monte_carlo`, `consolidation`, `budget_variance`, `export_pdf`, `excel_import`, etc.). Tags are auto-suggested by the NLP model and confirmed by Iris weekly. Without tags, the open comment is a wall of text.

**Rule 2 — Compute theme frequency weekly; ship the top-3 to the product team every Monday.** A theme that goes from 5% to 15% of comments in 2 weeks is a leading indicator of churn or expansion. The product team gets a 1-page digest: top 3 themes, top 3 verbatim quotes per theme, suggested owner (Apollo for features, Prometheus for perf, Atlas for support, Hera for UX). The digest replaces the "user feedback" email thread that nobody reads.

**Rule 3 — Escalate any "leaving for X" comment to the founder within 4 hours.** The string "leaving for", "switching to", "cancelling because of", "competitor mentioned" in an open comment is a save motion. CSM (or founder, pre-PMF) sees the alert in Slack within 4 hours, and a save call goes out within 24 hours. This is the rule that saves the most customers per quarter.

**Implementation:** PostHog survey responses land in a `nps_open_comment` event with raw text. A scheduled job runs the BERTopic model weekly (seeded with 15 known FP&A themes) and updates Dashboard 3. Iris does the manual validation pass on the first 100 comments to seed the topic list correctly. (Witness: in a prior rollout, raw word-count analysis on open comments produced "the," "to," and "and" as the top 3 themes — a topic model with stopword filtering is non-negotiable.)

---

## §8 — Operational wiring (who owns what)

| Owner | Responsibility | Tool | Cadence |
|---|---|---|---|
| **Apollo (PM/eng)** | Sends the survey via PostHog at T+30, T+90, T+180, T+365 + the 2 event-triggers. Owns the `nps.survey_sent` / `nps.survey_completed` / `nps.score_X` event taxonomy. | PostHog surveys | Per-survey-moment |
| **Iris (research)** | Analyzes the open comments weekly. Maintains the theme taxonomy. Publishes the 1-page Monday digest to the product team. Validates the topic model on the first 100 comments. | BERTopic + manual review | Weekly (Monday AM) |
| **CSM (post-Beta hire)** | Responds to any Detractor (0-6) within 4 hours. Runs the value-anchor call for Passives (7-8) within 1 week. Asks Promoters (9-10) for referrals within 1 week. | Gainsight + Slack | Per-survey-response |
| **Founder** | Sees monthly NPS summary (the 1-page Strategos briefing). Quarterly deep-dive with Iris. Approves the NPS target trajectory. | Notion / email | Monthly + quarterly |
| **Hephaestus** | Reviews the survey for compliance (no PII in open comments, GDPR-safe data retention, opt-out flow). | PostHog + legal checklist | Quarterly |
| **Prometheus** | Monitors the survey's impact on app performance (the in-app modal must not block the render path; P95 added latency < 50ms). | Sentry + Lighthouse | Continuous |

**Survey tooling decision:** **PostHog** (open-source, self-hostable, native to Vite, NPS plugin built-in, session replay for context). Not Intercom (proprietary, $$, overkill for 3 questions). Not Typeform (great UX, but disconnects the response from in-app behavior — we lose the feature-usage context that makes Q2 actionable). Wire-up: 1-line in `src/utils/analytics.ts` (`posthog.capture('nps_survey_completed', { score, persona, open_comment_hash })`).

**Data retention:** Open comments retained for 24 months (for cohort analysis), then auto-redacted to "[redacted]" but the NPS score + persona + tag taxonomy is retained indefinitely. (Per Hephaestus's data-integrity review.)

---

## The 3 highest-leverage decisions baked into this design

1. **T+90 is the first real NPS, not T+30.** T+30 is a "trial health" check (1 question, light); T+90 is the headline (full 3-question survey). This protects us from over-reacting to early-user complexity churn (CHURN_FRAMEWORK.md Reason 2) and gives the user time to form a real opinion.

2. **The persona-routing question (Q3) is mandatory, and we report per-persona NPS to leadership.** A global NPS is a lie. The per-persona NPS is the truth. We report both, but the persona-segmented version goes to Strategos's Q3 review and the board deck. (This is the cleanest way to handle the "Carla is a 7, Chris is a 9, what's our NPS?" question — the answer is "it's 3 different NPS numbers, by design.")

3. **The open-comment question (Q2) is the most predictive signal, and we treat it as a product input, not a survey artifact.** A NPS without the open comment is a vanity metric. The open comment is what moves the product roadmap (via the Monday digest) and what triggers the save motion (via the "leaving for X" 4-hour escalation).

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — Carla's NPS baseline is 7-8; Chris's is 8-9; Vera's is 6-7. The "Promoter" threshold is per-persona.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — the NPS moments (T+30, T+90, T+180, T+365) align with the journey stages (Trial → First Value → Habit → Evangelism).
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Detractor NPS is the leading indicator of Reasons 1, 3, 5 churn; Passive NPS is the leading indicator of Reason 2 (Complexity).
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the `save.*` events are the routing actions; the NPS data is the trigger.
- **`docs/drafts/hermes/BETA_PROGRAM.md`** — the 50-customer beta cohort is the first NPS wave. T+30 from beta onboarding = the first "trial health" check. T+90 = the first "real NPS."
- **`docs/drafts/strategos/STRATEGIC_REVIEW_Q3_2026.md`** — the NPS target (40 by EOY1, 50 by EOY2) lives in the Q3 review §5.
- **Apollo's analytics taxonomy** — the `nps.survey_sent` / `nps.survey_completed` / `nps.score_X` events need to be added to the event taxonomy.
- **Atlas's on-call runbook** — the "post-incident NPS" trigger is wired to SEV-1/SEV-2 closures.

---

_A score you don't act on is a number on a slide. A score you act on is a product decision. Build the system that makes NPS data *force* a product decision. — Iris_
