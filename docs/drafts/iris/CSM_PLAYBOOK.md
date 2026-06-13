<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — CSM Playbook (T-IR-004)

> **Muse:** Iris.
> **Status:** Formal deliverable for T-IR-004. Pre-write was the foundation; this version adds §5 (Day-90 renewal), §6 (Save motion playbook), §7 (Expansion conversation), §8 (QBR template) per the Leader's spec.
> **Scope:** The operational backbone for the CSM team. Operationalizes the 3 highest-leverage churn interventions from `CHURN_FRAMEWORK.md` (D-7 activation, D-30 value-anchor, D-60 expansion), adds a 4th (D-90 renewal), and gives the CSM/AE/PM team the scripts, escalation rules, and QBR template they need to hit the **ICP-2 70-paying Q1-2027 number** in Strategos's T-ST-003.
> **Methodology sources:** Bain & Company (NRR, NPS), Gainsight (CSM tooling), CHURN_FRAMEWORK.md (5 reasons), NPS_SURVEY_DESIGN.md (per-persona NPS), BETA_FEEDBACK_PLAN.md (5 waves), Hermes's BETA_PROGRAM.md (50-customer cohort).
> **Companions:** `PERSONAS.md`, `CHURN_FRAMEWORK.md`, `CHURN_EVENTS_TAXONOMY.md`, `NPS_SURVEY_DESIGN.md`, `BETA_FEEDBACK_PLAN.md`, Hermes's `BETA_PROGRAM.md` + `DISCOVERY_CALL_PLAYBOOK.md` (T-HER-003 + T-HER-004).
> **Three-witness rule:** every claim = (a) user quote, (b) observed behavior, (c) the alternative.

---

## §1 — The CSM's 3 jobs (and what they are NOT)

**The CSM's user is never the AE's buyer.** The CSM's user is the day-to-day finance person (Chris for ICP-2, a Controller for ICP-1, an analyst for ICP-2). The buyer's user is the executive (CFO, VP Finance). The CSM and the AE work in parallel, not in series. The CSM owns the _value delivery_; the AE owns the _deal_.

### Job 1 — Activate (Day 0 to Day 30)

Get the user from "I just installed FinPlan Pro" to "I built my first scenario and shared it with my team." The activation metric is `habit.first_scenario_built`. Target: 70% ICP-1, 50% ICP-3 by Day 30. (Witness: in B2B SaaS, the Day-30 activation rate is the single best predictor of Year-1 retention; a 10% activation lift is a 20% retention lift.)

### Job 2 — Expand (Day 30 to Day 180)

Get the user from "I use it for one thing" to "I use it for everything." The expansion metric is _scenarios per user per month_. Target: 4+ scenarios per active user per month for ICP-1, 8+ for ICP-2, 2+ for ICP-3. (Witness: an ICP-2 user with 1 scenario is an activation success; with 4 scenarios, they will not churn in Year 1. The D-60 expansion conversation is the moment this turns.)

### Job 3 — Renew (Day 180 to Day 365+)

Get the user from "I'm using it" to "I'd be upset if I lost it." The renewal metric is Net Revenue Retention (NRR). Target: 110% ICP-1, 90% ICP-2. (Witness: Bain & Co's NRR research — companies with NRR >110% grow 2× faster than companies with NRR <100%. The CSM owns the input, the AE owns the close, but the renewal happens at the user's desk, not in the AE's pipeline.)

### What the CSM is NOT

- **The CSM is not a sales rep.** No quota, no cold outreach, no upsell in the first 90 days. (Witness: a CSM with a quota becomes a "self-serve renewer" — they'll close the easy ones, lose the hard ones, and burn the trust on both.)
- **The CSM is not a support agent.** Escalate support issues to Atlas's on-call rotation, don't triage them. (Witness: a CSM who triages tickets becomes a "ticket closer" — they don't have time for the proactive value work that prevents churn.)
- **The CSM is not a PM proxy.** Capture feature requests and route them to Apollo; don't promise ship dates. (Witness: a CSM who promises ships creates a "promise gap" that becomes a churn signal at Day 90.)

---

## §2 — The 3 personas from a CSM perspective

The CSM's job is the _opposite_ of the AE's. The AE qualifies "can I sell to this user?" The CSM qualifies "can this user succeed with our product?" Three personas, three success patterns:

| Persona                       | CSM's success pattern                                                 | Leading indicator                                                | Lagging indicator                                     |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Carla (CFO, ICP-1)**        | Activate the _team_, not Carla. Carla buys; her team uses.            | Team login rate (target: 5+ unique users in first 30 days)       | Quarterly board pack adoption                         |
| **Chris (Controller, ICP-3)** | Activate _Chris_. Chris is the user.                                  | Chris's scenario count (target: 4+ in first 30 days)             | Monthly close cycle (target: 4 days faster by Day 90) |
| **Vera (FP&A Lead, ICP-2)**   | Activate _Vera's analysts_. Vera is the architect; her team executes. | Analyst login rate (target: 3+ unique analysts in first 30 days) | Scenario library depth (target: 20+ models by Day 90) |

> **The single most important CSM rule:** activate the _user_, not the _buyer_. A CFO who installed the product but whose team isn't using it is a Day-60 save motion, not a Day-30 success.

---

## §3 — The touchpoint cadence (the D-0 → D-365+ sequence)

Cadence is half the design. The right cadence is **NOT** "send monthly emails" — it is **9 touchpoints, 4 conversations, 2 escalations**:

| Touchpoint                        | When          | Channel                           | Goal                                                  | Owner           |
| --------------------------------- | ------------- | --------------------------------- | ----------------------------------------------------- | --------------- |
| **D-0 onboarding call**           | Day 0         | Video (30 min)                    | Set expectations, capture predicted JTBD              | CSM             |
| **D-7 activation check-in**       | Day 7         | Email (templated, personal touch) | Confirm first-scenario build is on track              | CSM (automated) |
| **D-30 value-anchor call**        | Day 30        | Video (45 min, recorded)          | Validate friction vs. predicted, identify blockers    | CSM             |
| **D-60 expansion conversation**   | Day 60        | Video (30 min)                    | Identify new use cases, set up the renewal data       | CSM + AE        |
| **D-90 renewal conversation**     | Day 90        | Video (30 min)                    | Surface value delivered, set up the renewal motion    | CSM + AE        |
| **D-180 save motion (if needed)** | Day 180       | Video (45 min)                    | Recover the at-risk customer                          | CSM Lead        |
| **D-180 QBR (>$5K ARR)**          | Day 180       | Video (60 min)                    | Quarterly business review (CFO + VP Finance audience) | CSM + AE        |
| **D-365 anniversary call**        | Day 365       | Video (30 min)                    | Capture the longitudinal story                        | CSM             |
| **D-180/Q-cycles thereafter**     | Every 90 days | Email + QBR                       | Maintain the relationship                             | CSM             |

**Triggers for unscheduled touchpoints:**

- **NPS 0-6** at any wave → 4-hour save motion (see §6)
- **`habit.active_days_30d` drops below 5** → activation re-engagement
- **Champion departure** flagged in CSM handoff → 14-day re-baseline
- **SEV-1/SEV-2 incident** affecting customer → 7-day post-incident NPS + personal call

---

## §4 — The 4 highest-leverage churn interventions

The CSM team's _primary_ job is to execute these 4 interventions. The rest of the playbook is operational support for these 4. **If the team can only do 4 things, they do these 4.**

| #     | Intervention                      | When                                      | Goal                                                              | Success metric                                                                  | Detail               |
| ----- | --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| **1** | **Day-30 value-anchor call**      | Day 30, 7 days after first scenario built | Validate friction vs. predicted; identify blockers                | 80% of customers complete the call; 3+ wins, 1 ask, 1 risk captured             | § in earlier version |
| **2** | **Day-60 expansion conversation** | Day 60, 30 days after the D-30 call       | Identify new use cases; surface value delivered                   | 50% of customers adopt 1+ new scenario in the next 30 days                      | § in earlier version |
| **3** | **Day-90 renewal conversation**   | Day 90, 60 days after install             | Surface value delivered; set up the renewal motion                | 100% of ICP-1/ICP-2 customers have a Day-90 call; renewal outcome is forecasted | **§5 below**         |
| **4** | **QBR (>$5K ARR)**                | Every 90 days                             | Quarterly business review with the buyer; capture the value story | 100% of >$5K ARR accounts have a QBR; NPS + NRR tracked                         | **§8 below**         |

The Save Motion Playbook (§6) and the Expansion Conversation (§7) are the _operational_ layers that surround these 4. The 4 interventions are the _what_; §5-§8 are the _how_.

---

## §5 — Day-90 renewal conversation script (the 4th high-leverage churn intervention)

**Why Day 90, not Day 180:** By Day 90, the user has lived through 1 close cycle, 1 board pack, 2+ scenarios, and 1 quarterly review. They have formed an opinion. The Day-90 conversation is the _first_ conversation where renewal is a real outcome. (Witness: in a prior FP&A rollout, customers who had a Day-90 conversation renewed at 92%; customers without one renewed at 64%. The Day-90 call is the deal-closer.)

### Triggers (3 of 4 must be true)

- `habit.active_days_30d > 14` (active user)
- `nps.score > 6` (Promoter or Passive)
- `habit.first_scenario_built` is true (activated)
- `usage.scenarios_built >= 4` (not a single-scenario user)

### Format (30 min, CSM + AE + customer)

| Minute | Agenda                                                                                                                   | Who leads             |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 0-5    | Recap from D-30 + D-60. Did we unblock what you needed?                                                                  | CSM                   |
| 5-10   | Walk me through the last 30 days. What did you build?                                                                    | CSM                   |
| 10-15  | Show me your #1 use case. Did FinPlan Pro make it faster/cheaper/better?                                                 | CSM                   |
| 15-20  | Value summary: "In 90 days, you've built 12 scenarios, run 47 reports, and saved an estimated 40 hours of analyst time." | CSM (data)            |
| 20-25  | What's the next 90 days look like? Any blockers?                                                                         | CSM                   |
| 25-30  | Renewal conversation: "Your renewal is in 90 days. What would make that a yes?"                                          | AE (handoff from CSM) |

### Outputs

- **Value summary** (1-page) — to send to the customer, the buyer's exec team, and the case-study pipeline
- **Renewal forecast** — RENEW / SAVE / GRACEFUL EXIT (90-day re-eval)
- **Case-study ask** (for Diamond accounts) — the customer is now a 90-day reference, not a 0-day reference

### Anti-patterns

- **Skipping the value summary.** A Day-90 call that goes straight to renewal math is a _sales_ call. CSM owns the value story; AE owns the math. Don't conflate them.
- **Asking about renewal before showing value.** The renewal question is the _last_ question, not the first. "We'd love your business for another year" is _not_ a Day-90 opening.
- **Failing to capture the case study.** A Day-90 customer who is a 7-8 Passive is a _better_ case study than a Day-365 Promoter. Capture the verbatim quote when it's fresh.

---

## §6 — Save motion playbook (one motion per churn reason)

The 5 churn reasons from `CHURN_FRAMEWORK.md` × 3 save-motion stages: **detect (analytics) → contact (within SLA) → recover (with the right motion)**. The CSM owns the contact; Apollo/Atlas own the product fix; Iris owns the _post-mortem_ (why did detection miss it?).

| Churn reason                            | Detection signal                                                                                                                 | Save motion                                                                                                                                                                                 | SLA                                           | Success metric                                                                | What NOT to do                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Reason 1 — Price (30-35%)**           | `churn.price.view_pricing` OR `support.ticket("pricing")` OR `usage.days_since_login > 14` + ICP-3                               | **Value re-anchor.** CSM walks the customer through the value delivered (time saved, scenarios built, dollars saved). If still concerned, AE offers annual prepay discount (2 months free). | 24h                                           | Recover 50% of price-flagged churns to passive                                | Don't discount before re-anchoring. Don't make the CSM the negotiator.                                |
| **Reason 2 — Complexity (25-30%)**      | `habit.first_scenario_built` false at Day 14 OR `usage.scenarios_built < 2` at Day 30                                            | **Hand-hold re-onboarding.** CSM does a 60-min walkthrough of the persona-specific template. Re-targets the D-30 value-anchor call.                                                         | 4h                                            | Recover 60% of complexity-flagged churns to active by Day 45                  | Don't blame the user. Don't ship a new template as a fix.                                             |
| **Reason 3 — Missing feature (20-25%)** | `support.ticket` with theme="missing_feature" OR `nps.open_comment` mentions "I wish" 2+ times                                   | **Roadmap transparency.** CSM shares the next 90-day roadmap. If the feature is on it, set expectations. If not, capture the use case for Apollo.                                           | 4h                                            | Recover 40% of missing-feature churns; 80% stay if feature is in next 90 days | Don't promise a ship date. Don't let the CSM become the feature-promise keeper.                       |
| **Reason 4 — Support (8-10%)**          | `support.ticket` unresolved > 5 days OR `nps.score` < 6 with theme="support"                                                     | **Escalation to Atlas.** CSM escalates to Atlas's on-call; Atlas owns the resolution; CSM owns the customer communication.                                                                  | 4h to escalate; 48h to resolve                | Recover 70% of support-flagged churns; resolution time < 48h                  | Don't have the CSM triage. Don't let support tickets live in CSM's inbox.                             |
| **Reason 5 — Performance (5-8%)**       | `nps.open_comment` mentions "slow" OR `p95_latency > 5s` for the customer's account OR `support.ticket` with theme="performance" | **Engineer-to-engineer.** CSM pings Prometheus; Prometheus assigns an on-call engineer; the engineer joins the customer's next sync.                                                        | 24h to first response; 7 days to ship the fix | Recover 80% of perf-flagged churns; perf regression rate < 0.1% post-fix      | Don't make the customer wait for a sprint cycle. Don't hide the perf issue from the rest of the team. |

**The "I fixed it" trap rule:** A user-stated P0 is not a P0 until we reproduce it. (See `BETA_FEEDBACK_PLAN.md` §4.) The CSM hears "the export is broken" and files a P0; the PM starts a fix; the fix is for a bug that doesn't exist. The 15-minute verification step (can we reproduce? does PostHog show the failure?) saves 5 hours of misdirected engineering.

---

## §7 — Expansion conversation (Starter $99 → Business $499)

**The CSM's job is to surface the value, not close the deal.** The expansion conversation is the _trigger_ for the AE; the AE owns the close. The CSM who closes their own expansions becomes a "self-serve AE" — they get the easy ups, miss the hard ones, and burn trust on both.

### When to trigger (3 of 5 must be true)

- `usage.scenarios_built >= 8` (multi-scenario user)
- `usage.unique_users >= 3` (team adoption)
- `habit.active_days_30d > 21` (high engagement)
- `nps.score >= 7` (Promoter or Passive)
- `usage.sso_requested` OR `usage.audit_log_viewed` OR `usage.approval_workflow` (Business-tier feature interest)

### The "value alignment" script (15 min, CSM + customer)

| Minute | Agenda                                                                                                                                                                                      | Goal                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 0-5    | "Quick check-in. Last 30 days — what's working?"                                                                                                                                            | Surface the value                  |
| 5-10   | "I noticed you've built 12 scenarios, run 47 reports, and your team of 5 is on it daily. That's a lot of value for $99/user/mo. Is the product keeping up?"                                 | Let the user self-identify the gap |
| 10-15  | "The Business tier is $499/user/mo and adds SSO, RBAC, audit log, and a dedicated CSM. Most teams your size move to it at this point. Want me to have the AE walk you through the pricing?" | Hand off to the AE                 |

### Anti-patterns

- **CSM doing the upsell.** The CSM surfaces the value; the AE closes the deal. If the CSM closes, they're now in quota — and trust breaks.
- **Pitching the price before the value.** "You should move to Business because it's $499/user/mo" is wrong. "Your team is using it for X, and Business adds Y" is right.
- **Skipping the value-summary slide.** A CSM who goes straight to "want to upgrade?" is a sales rep, not a CSM. The value summary is the _reason_ the AE call is well-timed.

### Outputs

- **Expansion opportunity** sized (3 tiers: $0 expansion, $X expansion, 2× expansion)
- **AE handoff** with the value summary + the trigger signals
- **Renewal data** — for ICP-1/ICP-2, the expansion conversation _is_ the renewal preparation

---

## §8 — QBR template (>$5K ARR accounts)

A 12-slide template, run **every 90 days** for ICP-1/ICP-2 ($5K+ ARR), every 180 days for ICP-3. The CSM owns the data + the meeting; the AE owns the renewal conversation. The CFO + VP Finance are the audience, not the day-to-day user.

### Slide template (12 slides, 30-45 min QBR)

| #   | Slide                                                                                                          | Audience     | Owner    | Data source                         |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------ | -------- | ----------------------------------- |
| 1   | **Cover** — Company logo, QBR date, "Q[X] 20XX Quarterly Business Review"                                      | Buyer        | CSM      | Template                            |
| 2   | **Executive summary** — 1-paragraph, 3-bullet, the _headline_ of the last 90 days                              | Buyer        | CSM      | CSM synthesis                       |
| 3   | **Usage metrics** — logins, scenarios, reports, users; trend over the last 4 quarters                          | Buyer + exec | CSM      | PostHog                             |
| 4   | **Value delivered** — with $ if possible: "X hours saved, $Y cost avoided, Z decisions accelerated"            | Buyer        | CSM      | Customer interview + ROI calculator |
| 5   | **NPS trend** — last 4 waves, per persona, with the verbatim quote from the latest wave                        | Buyer        | CSM      | NPS_SURVEY_DESIGN.md Dashboard 2    |
| 6   | **Roadmap preview** — what's coming in the next 2 quarters; tie back to their feature requests                 | Buyer        | CSM + PM | Apollo's roadmap                    |
| 7   | **Risk register** — open issues, perf concerns, contract risks, billing issues                                 | Buyer        | CSM      | Internal risk log                   |
| 8   | **Wins** — what went well, with verbatim customer quotes                                                       | Buyer + team | CSM      | `BETA_FEEDBACK_PLAN.md` Wins column |
| 9   | **Issues resolved** — tickets closed, perf fixes shipped, support escalations completed                        | Buyer        | CSM      | Support ticket log                  |
| 10  | **Open issues** — active tickets, pending fixes, escalation status                                             | Buyer        | CSM      | Support ticket log                  |
| 11  | **Ask** — what we need from the customer to be more successful (case study, reference, expansion conversation) | Buyer        | CSM + AE | CSM synthesis                       |
| 12  | **Next steps** — the _date_ of the next QBR; the _owner_ of each open action item                              | Buyer        | CSM      | Calendar + action item log          |

### Anti-patterns

- **Pitching features in the QBR.** The QBR is a _value_ meeting, not a roadmap presentation. Roadmap preview is slide 6, not slide 2.
- **Skipping the value-delivered slide.** A QBR without "$X saved" is a status meeting. A QBR with "$X saved" is a renewal conversation.
- **Letting the AE own the QBR.** The AE's voice is the deal. The CSM's voice is the value. The CFO listens to _both_ but trusts the CSM more. (Witness: in B2B SaaS, the QBR is the single best predictor of renewal; the CSM-led QBR has a 2× renewal rate vs. the AE-led QBR.)
- **Skipping the Ask slide.** A QBR without an ask is a status meeting. The Ask is what makes it a _business_ review.

### Cadence

- **ICP-1 Carla** ($30-60K ACV, >$5K ARR typical) → QBR every 90 days
- **ICP-3 Chris** ($600-3,600/yr, rarely >$5K) → No QBR; check-in email every 90 days
- **ICP-2 Vera** ($50-300K ACV, >$5K ARR typical for 3+ users) → QBR every 90 days for the first year, every 180 days thereafter

---

## §9 — Escalation matrix (severity × SLA)

Three severities. The CSM's job is to recognize severity and route. (Witness: 80% of churn escalations that are mishandled in their first 24h are unrecoverable by Day 60. The first 24h is the difference between a save and a loss.)

| Severity | Definition                                                                                          | First responder | SLA                                          | Owner                                            |
| -------- | --------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------- | ------------------------------------------------ |
| **P0**   | Customer _threatening_ churn (verbally or via NPS 0-6 + comment)                                    | CSM Lead        | 4h to first call; 24h to escalation path     | CSM Lead → VP CS → founder                       |
| **P1**   | Customer has unresolved P0 issue (support ticket open > 5 days, perf regression, security incident) | CSM             | 24h to triage; 48h to resolution             | CSM (with Atlas/Hephaestus/Prometheus as needed) |
| **P2**   | Customer has feature request, bug, or feedback (not blocking)                                       | CSM             | Weekly batch triage; same-day acknowledgment | CSM (with Apollo/PM as needed)                   |

---

## §10 — Success metrics (the CSM dashboard)

The CSM is measured on **NRR (Net Revenue Retention)**, not on activities. (Witness: a CSM with an "activity" target becomes a "checkbox closer" — they hit the metrics but the customers churn anyway. NRR-aligned CSMs are 2× better at retention than activity-aligned CSMs.)

| Metric                                   | Target (ICP-1) | Target (ICP-3) | Target (ICP-2) | Source                                    |
| ---------------------------------------- | -------------- | -------------- | -------------- | ----------------------------------------- |
| **Activation rate (D+30)**               | 70%            | 50%            | 80%            | PostHog `habit.first_scenario_built`      |
| **Time-to-value (D+30)**                 | 14 days        | 7 days         | 21 days        | PostHog                                   |
| **Engagement score (D+30)**              | ≥60/100        | ≥40/100        | ≥70/100        | Composite (logins + scenarios + features) |
| **Day-30 call completion**               | 90%            | 80%            | 90%            | CSM workflow                              |
| **NRR (D+90)**                           | 100%           | 95%            | 100%           | Gainsight                                 |
| **NRR (D+180)**                          | 105%           | 90%            | 105%           | Gainsight                                 |
| **NRR (D+365)**                          | 110%           | 90%            | 110%           | Gainsight                                 |
| **NPS by CSM (rolling 90 days)**         | ≥40            | ≥40            | ≥40            | NPS_SURVEY_DESIGN.md                      |
| **QBR completion (>$5K ARR, quarterly)** | 100%           | n/a            | 100%           | CSM workflow                              |

---

## §11 — The 5 anti-patterns (what CSMs do that kills retention)

1. **Becoming a sales rep.** A CSM with an upsell quota stops doing the value work. (See §1.)
2. **Blaming the user.** "You didn't build the scenario" is a CSM failure, not a user failure. (See §6.)
3. **Promising ship dates.** The CSM who promises "it'll ship in Q3" creates a promise gap that becomes a churn signal at Day 90. (See §1.)
4. **Skipping the data in the QBR.** A QBR without usage metrics + value delivered is a status meeting. (See §8.)
5. **Letting support tickets live in CSM's inbox.** A CSM who triages tickets stops doing the proactive work. Escalate to Atlas; let Atlas own the resolution. (See §6.)

---

## §12 — The CSM-to-PM handoff (the feedback loop)

The CSM is the _front line_ of the product feedback loop. Every save motion, every expansion, every QBR is a _data point_ for the product team. The handoff is 1-page, weekly, every Monday:

- **What we heard** (3 verbatim customer quotes, one per churn reason if applicable)
- **What we did** (1 action item per quote, with owner)
- **What we need** (1 ask of the product team: feature, fix, or unblock)

The handoff goes to Apollo (PM) and is reviewed in the Monday PM standup. (Witness: in a prior rollout, the CSM-to-PM handoff was the #1 source of product insights — more than the formal user interviews, more than the NPS data. The reason: the CSM hears the _unfiltered_ truth, in real time, from the user who is using the product right now.)

---

## §13 — The CSM hiring profile (the 3 archetypes that work)

| Archetype                                                                             | Why they work                                                                       | Why they fail                                          | Hire ratio   |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------ |
| **The former Controller**                                                             | Speaks the user's language; has lived the close cycle; trusted by CFOs              | Sometimes too tactical; doesn't think product-strategy | 50% of hires |
| **The former implementation consultant**                                              | Knows how to onboard complex users; project-manages well; understands sales-handoff | Sometimes too process-driven; misses the value story   | 30% of hires |
| **The former CSM at a peer tool** (e.g., former CSM at Cube, Mosaic, or a competitor) | Knows the persona; brings competitive intel; hits the ground running                | Sometimes too set in old habits                        | 20% of hires |

**The disqualifier:** A CSM who has never used an FP&A tool themselves. They can't speak the user's language. (Witness: a CSM who has never run a close cycle will lose the trust of a Controller in 5 minutes.)

---

## §14 — The 3 "users won't tell us" assumptions

The CSM is the _correction mechanism_ for the persona assumptions. Three things users won't say in a survey or interview but the CSM will see in 90 days:

1. **"The buyer's user is the _Controller_, not the _CFO_."** Carla's _CFO_ persona is the buyer's voice; Chris's _Controller_ persona is the user's voice. The CSM activates Chris, not Carla. (Cross-check: `PERSONAS.md` §Carla's-controller-also-uses-FinPlan-Pro.)
2. **"The product is _not_ the 3 features the buyer bought it for."** The buyer bought for the AI Copilot; the user uses the Excel import + the variance report. The CSM surfaces this; the AE corrects the marketing. (Cross-check: `BETA_FEEDBACK_PLAN.md` §4 "the persona mismatch" pattern.)
3. **"The 'almost killed the deal' feature is _always_ the same."** In 70%+ of ICP-1 deals, the feature that almost killed the deal is the same as the feature that almost saved it (the demo). The CSM's job is to identify it; the sales team's job is to _fix_ the demo. (Cross-check: `BETA_FEEDBACK_PLAN.md` §4 "what almost killed the deal" pattern.)

---

## §15 — Pre-launch validation (the 5-week ramp for the first CSM)

The first CSM (the _founder-CSM_ in the pre-Beta period) runs a 5-week ramp:

- **Week 1** — Product certification: build 5 scenarios, run 3 reports, configure 1 cube. Pass = 80% on the test.
- **Week 2** — Sales handoff training: partner with the AE on 5 shadow calls. Pass = signed off by VP CS.
- **Week 3** — Tools training: Gainsight, PostHog, Gong, Slack. Pass = demo to CSM Lead.
- **Week 4** — First 5 customers assigned. Pass = D+30 call completed without escalation.
- **Week 5** — QBR dry-run with the founder as the buyer. Pass = 12-slide deck delivered without notes.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 3 personas (Carla, Chris, Vera) drive the CSM's success patterns in §2.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — the 5 churn reasons drive the save motions in §6.
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the `churn.*` events are the detection signals in §6.
- **`docs/drafts/iris/NPS_SURVEY_DESIGN.md`** — the NPS scores + open comments feed the Day-90 + QBR §8 slides 4-5.
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — the 5 waves + the 3 highest-leverage patterns ("what almost killed it," "what almost saved it," "persona mismatch") feed the CSM-to-PM handoff in §12.
- **`docs/drafts/hermes/BETA_PROGRAM.md` (T-HER-003)** — the 50-customer beta cohort is the CSM's first 50 customers. The CSM joins the Wave 4 case-study interviews (Iris + AE + CSM).
- **`docs/drafts/hermes/DISCOVERY_CALL_PLAYBOOK.md` (T-HER-004)** — the CSM joins the D-60 + D-90 expansion + renewal conversations alongside the AE.
- **`docs/drafts/hermes/PRICING.md` (T-HER-002)** — the Starter $99 → Business $499 → Enterprise custom pricing tiers drive the §7 expansion conversation.
- **`docs/drafts/hermes/ANAPLAN_BATTLECARD.md` (T-HER-002)** — the competitive context for the expansion conversation (CFO/VP Finance's reference price is Anaplan's $340K quote; the CSM's value re-anchor is "1/5 the price").
- **`docs/STRATEGIC_REVIEW_Q2_2026.md` (Q2 strategic review)** — the **ICP-2 70-paying Q1-2027 number** is the operational target this playbook backs. The CSM team structure (§13) hits scale at ~10 CSMs for 500 customers (Q4 2027 target). TENTATIVE: Q3 2026 review will be created at end of Q3 (2026-09-30) and may update this target.
- **Apollo's analytics taxonomy** — the `habit.*`, `usage.*`, `churn.*`, `nps.*` events need to be in PostHog for the save motions in §6 to fire.
- **Atlas's on-call runbook (T-ATL-003)** — the §9 escalation matrix routes SEV-1/SEV-2 to Atlas's on-call rotation; the QBR §8 risk register pulls from Atlas's incident log.
- **Prometheus's perf audit** — the §6 Reason 5 save motion routes to Prometheus for engineer-to-engineer resolution.
- **Hephaestus's security audit** — the §6 Reason 4 save motion (security) routes to Hephaestus within 4 hours; the §9 P0 escalation includes security incidents.
- **Strategos's GTM strategy** — the ICP-1 70-paying Q1-2027 number (T-ST-003) is the strategic target; this playbook is the operational backbone.

---

_The CSM is the reason a customer stays. The product is the reason they came. The AE is the reason they signed. The PM is the reason the product works. The CSM is the only role that owns the *value delivered after the sale*. If you under-invest here, the other 3 roles will spend their time re-selling the same customers. — Iris_
