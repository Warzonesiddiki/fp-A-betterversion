<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — CSM Playbook (Customer Success Manager Operations Manual)

> **Muse:** Iris (8th Muse, the rainbow bridge between research and the field).
> **Lane:** Customer & User Research. **Timescale:** one quarter (the playbook is a living doc; updates after every 5th save motion).
> **Audience:** CSM team (the operator), AE team (the partner), PM team (the consumer of CSM-tracked themes), founder (the escalator).
> **Companions:** `CHURN_FRAMEWORK.md` (5 reasons + 3 highest-leverage interventions), `NPS_SURVEY_DESIGN.md` (the 4 cadences), `WIN_LOSS_FRAMEWORK.md` (the 4 outcomes + 5-metric dashboard), `BETA_FEEDBACK_PLAN.md` (the 5-wave beta collection), `PERSONAS.md` (the 3 personas from a CSM perspective).
> **Three-witness rule:** every claim = (a) user quote / behavior, (b) observed pattern, (c) the alternative or interpretation.
> **Status:** Pre-launch. Playbook will be tested on the 50-customer beta cohort in 2026-Q4.

---

## §1 — The CSM's 3 jobs (what success looks like)

A CSM is not a support rep. A CSM is not an AE. A CSM is the **person who makes the customer successful on the product, before the renewal conversation happens.** If a CSM does their job well, the renewal is a 5-min conversation, not a 30-min negotiation.

### Job 1 — Make the user competent (so they can do their job)

The CSM's first job is to make the user *able* to do their job in FinPlan Pro. **This is not "show them a feature tour."** This is: when a Controller has a real P&L to build on Day 7, the CSM helps them build it. The user's *first real artifact* in the product is the moment competence clicks.

> **\[INFERRED quote, composite of 8 founder-conducted CSM-hiring interviews\]** "The best CSMs I've hired were former Controllers, not former support reps. They know what a real close looks like. They know when a model is wrong. They know the difference between a 'feature gap' and a 'user error' — and they can tell the user the truth without making them feel stupid."
>
> — Synthetic composite

### Job 2 — Make the value visible (so the user can defend us internally)

The CSM's second job is to make the value *visible to the user's boss*. Most CSMs talk to the user; the best CSMs *brief the user's boss*. A Controller (Chris) is happy with our product, but the CFO doesn't know we exist. **The day the CFO asks "what does FinPlan Pro do for us?" and the Controller has a 1-sentence answer, that's a CSM save motion that prevented a churn event 6 months out.**

> **\[INFERRED quote\]** "The biggest reason a renews doesn't happen is that the buyer never knew we were useful. The user knew. The buyer's CFO never heard our name. By the time renewal comes, the CFO's mental model is 'what is this thing we're paying for?' — and the answer is silence."
>
> — Synthetic composite

### Job 3 — Catch the churn signal before the user catches themselves (so the save motion has time)

The CSM's third job is to *see the churn signal before the user does*. By the time the user files a "we're not renewing" ticket, the save motion is too late. **The CSM must catch the `churn.price.usage_drop` pattern 8-10 weeks before renewal** (per `CHURN_EVENTS_TAXONOMY.md`). This is not prediction; this is *pattern-recognition on the data the CSM has access to*.

> **\[INFERRED quote\]** "A CSM who is reactive is just a support rep with a fancier title. A CSM who is proactive is the difference between a 60% net retention and an 85% net retention. The 25-point delta is the entire reason CSM exists."

---

## §2 — The 3 personas from a CSM perspective (not a buyer's perspective)

The CSM's view of the 3 personas is *different* from the AE's view. The AE sees the buyer's decision-making process. The CSM sees the *user's daily friction*.

| Persona | AE sees | CSM sees | The CSM's #1 risk to defend against |
|---|---|---|---|
| **CFO Carla** (ICP-1, strategic buyer) | The buyer, the renewal signatory, the champion-of-the-champions | **Rarely the user.** The CSM's *real* user is Carla's Controller (a Chris-type). | Carla's Controller (the actual daily user) is unhappy. Carla churns not because she hated us, but because her Controller did. **The CSM must brief the Controller weekly, not Carla.** |
| **Controller Chris** (ICP-3, tactical buyer) | The day-to-day user, the trial evaluator, the credit-card-on-file | **The user AND the buyer.** Chris is the single person doing both jobs. | Chris is overwhelmed, doesn't ask for help, silently abandons. The CSM must *proactively offer help at the moment of confusion*, not wait for Chris to ask. |
| **VP Finance Vera** (ICP-2, technical buyer) | The technical evaluator, the modeling power-user, the "build the model in 1 day" test | **The user AND the buyer.** Vera's *real* user is her senior analyst. | Vera's senior analyst (the actual model-builder) is stuck. Vera churns not because of the modeling depth but because *her analyst can't build a model without Vera's help* — which defeats the "self-serve" pitch. The CSM must train the analyst, not Vera. |

> **The single most important persona-CSM insight: the CSM's user is *never* the AE's buyer.** The CSM is responsible for the person who *lives in the product*, not the person who *paid for the product*. When these diverge (and they often do), the CSM's success is measured by the user's happiness, not the buyer's satisfaction.

---

## §3 — The touchpoint cadence (5 waves over the first year)

Per the NPS design + beta feedback plan, every customer gets 5 waves of structured touchpoints. The CSM owns the execution.

| Wave | When | Duration | Goal | Format | Owner |
|---|---|---|---|---|---|
| **Day 0** | Install day | 30 min | Establish relationship, capture predicted JTBD, set expectations for Days 7/30/60/90 | Video call (1:1) | CSM |
| **Day 7** | First-value check | 15 min | Validate aha moment reached; identify early friction; offer 15-min walkthrough if needed | Email (1:1) | CSM (or automated-but-feels-human) |
| **Day 30** | First real NPS + first JTBD validation | 30 min | First NPS score; compare predicted vs. actual JTBD; update persona-fit verdict | Video call (1:1) + NPS survey in-app | CSM (ICP-3) or CSM + Iris (ICP-1) |
| **Day 60** | Value-anchor call | 30 min | Validate recurring value; identify new pains; preview roadmap; introduce QBR cadence | Video call (1:1) | CSM (ICP-3) or CSM + AE (ICP-1) |
| **Day 90** | Post-beta NPS + case study + renewal ask | 60 min | Final NPS for cohort; case study; renewal/expansion | Video call (1:1) | CSM + AE + (Iris for ICP-1 sampling) |
| **Day 180** | Renewal-cycle NPS | 15 min (or 30 if NPS < 8) | The "save motion" point if NPS is low; the "expansion ask" if NPS is high | Email + conditional video call | CSM + AE |
| **Day 365** | Anniversary NPS | 30 min | Long-tenure signal; reference ask; case study refresh | Video call (1:1) | CSM + AE |

> **For ICP-3 (Chris):** cut Day 60 and Day 365 to a 1-question email. Chris's attention budget doesn't support 30-min video calls every quarter. The CSM's job with Chris is to be *available*, not *proactive*. Chris will ask when they need help; the CSM responds within 1 hour, every time.

> **For ICP-1 (Carla):** the *user* is the Controller (a Chris-type), not Carla. The CSM's Day 0/7/30/60 calls are with the Controller, NOT Carla. Carla gets a *separate* QBR cadence (every 90 days, 60-min, with the AE) where the CSM is a silent partner providing data on the Controller's usage.

> **For ICP-2 (Vera):** the *user* is Vera's senior analyst. The CSM's Day 0/7/30 calls are with the analyst, not Vera. Vera gets a quarterly business review (QBR) every 90 days, 60-min, with the AE. The CSM briefs the analyst on the modeling-depth questions *before* the QBR so the analyst can answer them in real-time.

---

## §4 — The 5 save motions (the 5 churn reasons, CSM-executed)

The CSM owns the *execution* of the 5 save motions from the churn framework. The PM owns the *triage*; the CSM owns the *customer-facing action*.

### Save motion 1 — Price churn (the 30-45 day save window)

- **Detection signal:** `churn.price.combined_pattern` (usage_drop + cs_no_show + login_drop in 30 days)
- **CSM action:** Day -90 (90 days before renewal): "value-anchor" call with the user. Day -60: QBR with the user's boss. Day -30: escalation to AE; offer (a) tier downgrade, (b) 3-month pause, (c) feature-training sprint. Day -14: founder-pinged for ICP-1/2 only.
- **Success metric:** Save rate (NPS 0-6 → recovered to Passive in 30 days). Target: >40%.
- **What the CSM does NOT do:** discount. Discount is a 1-time concession that becomes expected. The CSM offers *value* (training, pause, downgrade), not price.

### Save motion 2 — Complexity churn (the 0-7 day save window)

- **Detection signal:** `churn.complexity.first_value_not_reached` (false after Day 3) or `churn.complexity.install_no_action` (>120s idle on first screen)
- **CSM action:** Day 0: opinionated template-by-persona first screen (Carla sees CFO Q3 board pack, Chris sees Import QuickBooks P&L, Vera sees Connect Snowflake). Day 1-3: 1-line in-app contextual tooltip when jargon-hit detected. Day 3: CSM-light email ("I noticed you imported X but haven't run a scenario. The fastest path to aha is [1-click]."). Day 7: founder-pinged for ICP-1/2.
- **Success metric:** Trial-to-paid conversion. Target: >25% (per the persona + churn framework).
- **What the CSM does NOT do:** add a tutorial. **Every tutorial is friction.** The opinionated first screen + 1-line tooltip is the right intervention.

### Save motion 3 — Missing-feature churn (the 14-30 day save window)

- **Detection signal:** `churn.feature_gap.followup` (user asks "any update?") or `churn.feature_gap.workaround_pattern` (Excel-bailout)
- **CSM action:** Within 48h of feature request: triage to (a) shipped, (b) on roadmap, (c) not on roadmap. **Within 30 days: auto-update the requester.** If fit-failure (the user needs a feature we won't build): "good-failure interview + 90-day re-eval." If communication-failure (feature is in the product but user can't find it): CSM walkthrough. If discovery-failure: help-doc search + coach the user.
- **Success metric:** Save rate (feature-gap user → retained 90 days). Target: >60% for communication/discovery failures; >20% for fit failures.
- **What the CSM does NOT do:** lie. If a feature is not on the roadmap and won't be, say so. **The user can handle truth; they cannot handle a fake promise.** A 90-day re-eval after a graceful exit is worth 2-3 peer referrals.

### Save motion 4 — Support churn (the 0-7 day save window)

- **Detection signal:** `churn.support.first_response_slow` (>4h for ICP-1/2; >24h for ICP-3) or `churn.support.competitor_mentioned`
- **CSM action:** If ticket is ICP-1/2 and > 4h with no resolution: CSM takes ownership of the ticket, escalates to engineering, gives the user a specific next-step time. **The "we're looking into it" reply is forbidden.** Every reply must be (a) a fix, (b) a workaround, or (c) a specific next-step time.
- **Success metric:** First-response p50 (target: <2h for ICP-1/2, <12h for ICP-3). CSAT (target: >4.2/5). Save rate (post-bad-support user → retained 90 days). Target: >70%.
- **What the CSM does NOT do:** be the *only* support. CSMs are the escalation path, not the front line. The front line is the support team; CSM owns the *relationship*, not the *ticket queue*.

### Save motion 5 — Performance churn (the 7-day save window)

- **Detection signal:** `churn.perf.monte_carlo_slow` (p95 > 2s) or `churn.perf.excel_bailout` (>3 exports/week)
- **CSM action:** Within 7 days: CSM calls the user, acknowledges the slowness, and offers a specific workaround. "I noticed your model is [X] rows; we're optimizing for up to 50K. For your use case, [here's a 3-step workaround]. We've escalated the perf optimization to our engineering team — ETA [date]." The user accepts the workaround *if* the ETA is specific.
- **Success metric:** Save rate (perf-churn user → retained 90 days). Target: >50%. CI SLO gate (target: 100% of releases pass p95 < 2.5s).
- **What the CSM does NOT do:** blame the user's machine. "Your machine is too slow" is condescending. The right framing: "We're optimizing for [use case] and your use case is at the edge. Here's the workaround + here's our roadmap ETA."

---

## §5 — The escalation matrix (who to call for what)

The CSM does not own every problem. The escalation matrix is the contract between CSM, AE, support, PM, and the founder.

| Severity | Trigger | First responder | Escalates to | Within |
|---|---|---|---|---|
| **SEV-1** | ICP-1/2 customer-down, churn-imminent | CSM | AE + founder + PM | 24h |
| **SEV-2** | ICP-1/2 feature-blocking bug, save-motion-blocking | CSM | PM + engineering | 48h |
| **SEV-3** | Performance regression, recurring confusion | CSM | PM | next sprint triage |
| **SEV-4** | Cosmetic, doc drift, lint warning | PM | (no escalation) | backlog |

### The 4 escalation rules

1. **CSMs can escalate to founder for SEV-1 only.** The founder is the only person who can override pricing, contracts, or product roadmap. Use this escalation sparingly (1-2× per quarter).
2. **CSMs can escalate to PM at any time.** The PM is the CSM's partner in the product. The CSM should have a weekly 30-min sync with the PM to review themes.
3. **AEs own the renewal conversation.** The CSM hands the renewal off to the AE 60-90 days before the renewal date. The CSM's job is to make the AE's renewal conversation a 5-min formality.
4. **Support owns the ticket queue.** The CSM does not take tickets. The CSM owns the *relationship*; the support team owns the *ticket*. When a ticket becomes a relationship issue, the support team escalates to the CSM.

---

## §6 — The success metrics (how we know the CSM team is working)

| Metric | Target | Source | Cadence |
|---|---|---|---|
| **Net retention** (renewal + expansion - churn) | >100% by month 12, >110% by month 24 | Billing + CRM | Monthly |
| **Save rate** (Detractor → retained 90 days) | >40% (Reason 1) / >25% (Reason 2) / >60% (Reason 3) / >70% (Reason 4) / >50% (Reason 5) | Win/loss + churn events | Monthly |
| **CSM-1:20 capacity** | All CSMs at < 20 ICP-1 / 30 ICP-2 / 50 ICP-3 accounts | CRM | Quarterly |
| **Wave completion rate** (per the §3 cadence) | >85% per wave | CSM-tracked | Weekly |
| **NPS response rate** (T+30, T+90, T+180) | >35% per wave | Analytics | Per wave |
| **QBR completion** (per ICP-1/2) | 100% of accounts have a QBR every 90 days | CSM-tracked | Quarterly |
| **Case studies produced** | ≥5 by Day 90 of every cohort | Hermes-tracked | Per cohort |
| **CSM satisfaction** (the CSM's own NPS) | >7/10 | Quarterly survey | Quarterly |

> **The single most important CSM metric is the QBR completion rate for ICP-1/2.** The QBR is where the value is *visible* to the buyer. If 100% of ICP-1/2 accounts have a QBR every 90 days, retention follows. If < 80%, the renewals will surprise us.

---

## §7 — The 5 anti-patterns (the 5 things that will sink the CSM program)

1. ❌ **The CSM as a glorified support rep.** A CSM who answers tickets is a wasted CSM. The CSM owns *relationships*; the support team owns *tickets*. **If the CSM is the front line, hire a support rep instead.**
2. ❌ **The CSM as an AE in disguise.** A CSM who is closing expansion deals is a wasted CSM. The CSM *enables* the AE's expansion conversation; the AE *runs* it. **If the CSM is doing renewals, hire an AE instead.**
3. ❌ **The CSM as a passenger in the QBR.** A CSM who is silent in the QBR is a wasted seat. The CSM brings the *user* data (last 90 days of usage, NPS, themes) and the *user's* perspective. The AE brings the *deal* data. **Both voices must be in the room.**
4. ❌ **The CSM who is overloaded.** A CSM with 30+ ICP-1 accounts is a CSM on the path to burnout. **Hard cap: 20 ICP-1 / 30 ICP-2 / 50 ICP-3.** The cap is a *product* decision (when the team is small, ICP-1 cap is lower; when we hire, ICP-1 cap rises).
5. ❌ **The CSM who doesn't have the data.** A CSM who doesn't see the `churn.*` events is a CSM flying blind. **The CSM dashboard must surface the 5 churn signals (per `CHURN_EVENTS_TAXONOMY.md`) in real-time.** Without the data, the save motion is too late.

---

## §8 — The CSM-to-PM handoff (the feedback loop that compounds)

The CSM is the *primary customer-facing feedback channel*. The CSM-to-PM handoff is the contract.

| Trigger | CSM action | PM action |
|---|---|---|
| **3+ users report the same friction** in 30 days | File a `pattern_id` in `docs/research/patterns.md` | Triage in next Tuesday review |
| **1 user has a SEV-1 problem** | Escalate same-day | Acknowledge within 4h, ship or workaround within 24h |
| **A roadmap item gets ≥ 5 mentions** in 30 days | Add a count to the `roadmap_demand` column | Triage to commit-to-date or wontfix |
| **A competitor's new feature is cited in 3+ interviews** | Add to `competitor_intel` channel | Triage to roadmap or to "we won't compete on this" |
| **A user reports a missing a11y/UX** | Route to Hera | Hera triages |

> **The single most important CSM-to-PM handoff is the pattern catalog.** If the CSM is filing patterns and the PM is triaging them weekly, the product roadmap is *evidence-driven*, not opinion-driven. If the handoff is broken, the product roadmap is whatever the loudest person in the room said last.

---

## §9 — The CSM hiring profile (what to look for)

The CSM is not interchangeable with a support rep or an AE. The hiring profile is specific:

| Trait | Why it matters | How to test |
|---|---|---|
| **Domain-fluent** (former Controller, former FP&A analyst, or former finance consultant) | They know what a real close looks like; they can spot a "feature gap" vs. "user error" | "Walk me through the last close you ran. What was the hardest part?" |
| **Empathetic without being a pushover** | They need to tell the user the truth (no, we won't build that) without making the user feel stupid | "Tell me about a time you had to say no to a customer. How did you do it?" |
| **Pattern-recognition on data** | The save motion is data-driven (`churn.combined_pattern` is the trigger) | "Here's a 90-day usage dataset. What do you see? What would you do?" |
| **Comfortable with a 1:20 account load** | The job is relationship-density, not ticket-density | "You have 20 ICP-1 accounts. Walk me through your week. How do you prioritize?" |
| **Has read `CHURN_FRAMEWORK.md`** | The CSM who understands the 5 reasons catches the signal earlier | Pre-hire: send the doc, ask them to summarize in 1 paragraph |

> **The single most important trait is domain-fluency.** A CSM who has never built a P&L will not catch the `churn.complexity.first_value_not_reached` signal early — they won't recognize the friction. **Hire former Controllers, not former support reps.** The market is full of unemployed Controllers; the market is short of patient support reps. **The CSM is closer to the Controller than to the support rep.**

---

## §10 — The 3 "users won't tell us" assumptions (this cycle)

1. **"The CSM is the user's advocate" is a lie if the CSM is measured on the wrong metric.** A CSM measured on *retention* will fight to keep every user, even the bad-fit ones, because losing a user is a personal failure. **The right CSM metric is "value delivered" (NPS, save rate, expansion) — not "users retained."** A CSM who helps a bad-fit user leave gracefully *and* gets 2-3 peer referrals is a 10× CSM. **Measure accordingly.**
2. **"The user is the buyer" is the most expensive CSM misconception.** In ICP-1 (Carla), the buyer is Carla, the user is the Controller. If the CSM treats the Controller as the buyer, they over-rotate on user-friction and miss the buyer's strategic questions. **The CSM serves the user's daily needs AND briefs the buyer's strategic questions. Both voices.**
3. **"Save motion = discount" is the laziest CSM play.** Discounting a 0-6 NPS user trains them to threaten churn to get a discount. **Save motion = value-added (training, downgrade, pause) — not price-cutting.** A CSM who offers a 30% discount to keep a user is a CSM who will lose them at the next renewal *and* have trained the rest of the book to expect the same.

---

## §11 — Pre-launch validation (what we do before we hire the first CSM)

1. **Pilot the playbook on the 50-customer beta cohort.** The beta is the test. Run the playbook; debrief weekly; revise.
2. **Pre-build the CSM dashboard.** The 5 churn signals (from `CHURN_EVENTS_TAXONOMY.md`) + the 7-day/30-day/60-day/90-day usage data + the NPS scores, all in one surface. The CSM should not have to assemble the data on the fly.
3. **Pre-write the email templates.** The 5 waves have predictable email patterns. Pre-write the templates; customize at send-time.
4. **Pre-write the QBR deck.** A 12-slide QBR template (company, our usage, value delivered, roadmap preview, ask). The CSM customizes; the structure is consistent.
5. **Hire the CSM team against this profile.** A CSM who hasn't read this playbook on day 1 is a CSM who won't catch the signals on day 30.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 3 personas from a CSM's perspective. The CSM's user is rarely the AE's buyer.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — the 5 reasons + 3 highest-leverage interventions; this playbook is the execution.
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the 30+ events the CSM must see in real-time. The dashboard contract.
- **`docs/drafts/iris/NPS_SURVEY_DESIGN.md`** — the 4 cadences that the CSM triggers.
- **`docs/drafts/iris/WIN_LOSS_FRAMEWORK.md`** — the 4 outcomes; CSM owns the post-win/loss handoff.
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — the 5-wave beta collection; the CSM executes.
- **`docs/drafts/hermes/BETA_PROGRAM.md`** — the 50-customer cohort; the CSM serves all 50.
- **`docs/drafts/atlas/ON_CALL_RUNBOOK.md`** — the SEV-1/2/3/4 routing; the CSM escalates into this matrix.
- **`docs/drafts/prometheus/`** — the perf SLOs (Monte Carlo p95 < 2s) are the CSM's perf-churn signal source.
- **`docs/drafts/hera/`** — the a11y/UX themes route to Hera; the CSM is the front-line reporter.

---

_The CSM is the most expensive line item in a SaaS P&L. A great CSM is worth 30% in net retention. A bad CSM is a cost center that drives churn. The difference is *proactive pattern-recognition on the data*, not *reactive ticket-answering*. Hire for the former. — Iris_
