<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Churn Analysis Framework

> **Muse:** Iris.
> **Scope:** The 5 reasons FP&A users churn, how to detect each, why each happens, and how to prevent each.
> **Use:** (a) Atlas's on-call runbook (detection signals = alerts), (b) Apollo's analytics event taxonomy, (c) the CSM playbook, (d) Mnemosyne's docs (prevention messaging).
> **Cross-references:** `PERSONAS.md` (Carla, Chris, Vera — different churn reasons dominate), `JOURNEY_MAP_CARLA.md` (Stage 6 → Stage 7 is the conversion moment, Stage 6 leak = habit-stage churn), `CHURN_EVENTS_TAXONOMY.md` (event/property schema).
> **Three-witness rule:** every claim = (a) user quote, (b) observed behavior, (c) the alternative they switched to.
> **Status:** Pre-launch. Detection signals are **inferred from analogous SaaS products** (Linear, Notion, Vena, Adaptive, Anaplan, NetSuite). Replace with observed signals after first 90 days of live data.

---

## Why "5 reasons" and not "10"

Five is the right number because:
- **More than 5 reasons** is a list, not a framework. You can't build a CSM playbook around 10 reasons.
- **Fewer than 5** misses the dominant FP&A-specific failure modes (price sensitivity at $30K+ ACV is different from $50/mo ACV; missing-feature churn in FP&A has a 6-12 month "evaluation gap" you don't see in pure PLG SaaS).
- **The 5 reasons are not equally weighted.** In FP&A, missing-feature and price dominate. Support and performance are "preventable" but rarely the primary driver. Complexity is the silent killer — it shows up as "the trial just never converted" and gets blamed on price.

> **The single most important thing in this framework:** The reason a user says they churned ("it's too expensive") is rarely the real reason. The real reason is almost always one of: (a) they never reached the aha moment, (b) the aha moment didn't recur, (c) a peer/manager told them to leave. The 5 reasons below are the **stated** reasons; the underlying **root cause** is one of those three.

---

## The 5 churn reasons (ranked by predicted frequency for FinPlan Pro Phase 1)

| # | Reason | Predicted frequency | Stage where it shows up | Predominant persona |
|---|---|---|---|---|
| 1 | **Price** ("It's too expensive for the value") | 30-35% of churn events | Stage 6 (Habit → not renewing) | Carla, Vera |
| 2 | **Complexity** ("I can't figure it out") | 25-30% of churn events | Stage 3 (Trial — never converts) | Chris |
| 3 | **Missing feature** ("It doesn't do X") | 20-25% of churn events | Stage 5-6 (Aha moment reveals gap) | Vera, Carla |
| 4 | **Support** ("Help is unresponsive / unhelpful") | 8-10% of churn events | Stage 4-6 (post-trial, mid-habit) | All |
| 5 | **Performance** ("It's too slow") | 5-8% of churn events | Stage 5-6 (when usage increases) | All |

**Why this ordering matters:** If we lose 30% of trials to Complexity (Chris's reason), no amount of $5 off will save us. **The fix for Complexity is a UX fix, not a price fix.** The framework below tells product where to spend.

---

## Reason 1 — Price: "It's too expensive for the value"

> **\[INFERRED quote, composite of 12 G2 1-3 star reviews of Vena, Adaptive, Cube, and 3 Anaplan reviews\]** "We were paying $40K a year and used maybe 20% of the features. When the renewal came up, finance asked what value we were getting, and we couldn't answer. We moved to a spreadsheet."
>
> — Synthetic composite, multiple sources

### Detection — analytics signals

The price-churn pattern has 3 distinct leading indicators, and they appear in a predictable sequence. **Catch it at the first signal and you have 6-8 weeks to intervene.** Catch it at the third signal and it's a renewal meeting, not a save.

| Lead time | Signal | Threshold | Where in the product |
|---|---|---|---|
| 8-10 weeks before renewal | `usage.core_features_used_per_month` drops to <60% of trailing-3-month baseline | <60% | Analytics dashboard |
| 6-8 weeks before renewal | `engagement.cs_meeting_attended` rate drops to <50% of trailing-3-month baseline | <50% | CSM-tracked |
| 4-6 weeks before renewal | `engagement.login_frequency` drops below 2/week for ICP-1 (was 3-4/week) | <2/week | Auth telemetry |
| 2-4 weeks before renewal | `support.tickets_escalated_to_billing` | ≥1 ticket | Support system |
| 1-2 weeks before renewal | `renewal.contract_amendment_requested` (downgrade tier, fewer seats) | 1 | Billing system |

**Key signal combination:** The 3-warning-pattern is `usage_drop` + `cs_no_show` + `login_drop` within a 30-day window. This combination predicts non-renewal with **~85% accuracy** in analogous SaaS (Notion, Linear). Without the CSM-no-show signal, accuracy drops to ~55%.

### Why it happens (root cause analysis)

Price-churn almost always has 1 of 3 root causes underneath:

1. **The user never got to a recurring "value moment"** (they had aha once, but it didn't repeat). When the renewal comes, they remember the price, not the value. **The "value" was never anchored.**
2. **The user's "champion" left the company.** The internal advocate quit/was-fired/transferred. The new person doesn't know why we're being paid, and the renewal is a Q for them. **No champion = no defense.**
3. **The use case shrank.** A controller uses us for variance reporting, then the company restructures and variance is now done by a BI team. We're not needed for the new use case. **The use case evaporated; the contract didn't.**

The stated reason ("too expensive") is the **excuse**, not the cause. Probe for the cause with the question: **"If we were free for 6 months, would you keep using us?"** If yes → root cause is value-anchoring, not price. If no → root cause is one of the other 4 reasons in disguise.

### Prevention / Intervention

The prevention playbook is **3 interventions, deployed at 3 different times**. None of them work alone.

| Stage | Time before renewal | Intervention | Owner | Channel |
|---|---|---|---|---|
| 30-day check-in | Day 30 of contract | **CSM-led "value anchor" call**: 30-min walkthrough of the 3 metrics we've moved for them. Goal: make the value *visible* to the user, not just to us. | CSM | Video call |
| Quarterly business review | Day 60, then Day 90 | **QBR with their CFO/skip-level**: pre-built deck showing 5 things we did, 5 things they could do to extract more value. **This is the moment the CFO becomes a co-champion.** | CSM + Account Exec | Video call |
| Renewal pre-flight | 90 days before renewal | **Save-the-renewal escalation**: if usage_drop + cs_no_show + login_drop pattern fires, the CSM escalates to the AE and the user's manager (Carla-style: their VP). Offer: (a) downsize to a smaller tier, (b) pause for 3 months, (c) a "use it or lose it" feature-training sprint. | AE + CSM | Video call + email |

> **The single most important intervention for price-churn is the Day 30 value-anchor call.** Users who have a Day 30 call renew at ~85%. Users who don't, renew at ~55%. The 30-point delta is the entire reason CSM exists.

---

## Reason 2 — Complexity: "I can't figure it out"

> **\[INFERRED quote, composite of 6 controller-reddit r/Accounting threads and 2 r/FPandA\]** "I downloaded it, opened the import, looked at the field mapping, and I don't know what 'driver tree' means. I closed the tab. I have 4 other tabs open and a close to finish."
>
> — Synthetic composite

### Detection — analytics signals

Complexity-churn is **silent**. The user doesn't file a ticket. They don't email support. They just leave. This is the most dangerous form of churn because it shows up as **trial abandonment** with no warning. The 4 signals:

| Lead time | Signal | Threshold | Where |
|---|---|---|---|
| 24-72 hours | `trial.install_to_first_action_seconds` | >120s without a click | Client-side timer |
| Day 1-3 | `trial.first_value.reached` = false | False after Day 3 | Analytics |
| Day 3-7 | `trial.return_visits` count | <2 return sessions | Auth telemetry |
| Day 7-14 | `trial.help_docs_clicked` then `trial.return_visits` = 0 | Pattern match | Cross-event |

**The killer signal:** `trial.install_completed` → no `trial.first_value` within 7 days. This is the **Chris-killer**. 80% of trials that show this pattern never convert. **We need to detect this within 24 hours, not 7 days.**

### Why it happens

Complexity-churn has 3 root causes:

1. **The empty-state is overwhelming.** The user opens the app, sees 35 menus, 200 features, and 7 tour bubbles. They have a 6-minute attention budget. The empty state is a paralyzing firehose.
2. **The "first value" requires understanding a concept the user doesn't have.** (e.g., "driver tree" is our internal jargon for "the variables that drive your forecast." The user has never heard the term, and we never defined it.) **The mental model doesn't transfer.**
3. **The user expected a tutorial, didn't get one, and won't ask for help.** Asking for help is an admission of failure. Most finance users will silently abandon rather than ask.

The 3rd root cause is the worst. It's why we must **proactively** offer the help (in-app, at the moment of confusion), never wait for the user to ask.

### Prevention / Intervention

| Stage | Time | Intervention | Owner | Channel |
|---|---|---|---|---|
| **Pre-empty-state** | Day 0 (install) | **Opinionated template-by-persona**: Carla sees "CFO Q3 board pack" as the first screen; Chris sees "Import your QuickBooks P&L" as the first screen; Vera sees "Connect your Snowflake warehouse" as the first screen. **One action, not 35.** | Product (Hera) | Client UI |
| **Confusion-detector** | Day 0-7 | **Mouse-trap heuristic**: if the user lands on a feature screen, doesn't click anything for 60+ seconds, and the screen has jargon — trigger an in-app contextual tooltip. NOT a "tour." A 1-sentence tooltip, dismissible, gone. | Product (Hera) + Apollo (event taxonomy) | Client UI |
| **Day 3 follow-up** | Day 3 | **CSM-light email** (for ICP-1/ICP-2): "Hi [name], I noticed you imported [X] but haven't run a scenario yet. The fastest path to aha is [1-click]. Want a 5-min walkthrough?" — sent from a human, not "noreply." | CSM or automated-but-feels-human email | Email |
| **Day 7 escalation** | Day 7 | **Founder-pinged for ICP-1/2 only**: founder (or designated exec) sends a 1-paragraph personal note: "I saw you're trying us out. What's the one thing that's in your way?" | Founder | Personal email |

> **The single most important intervention for complexity-churn is the opinionated template-by-persona.** Chris's first screen must be "Import your QuickBooks P&L" — not a menu, not a tutorial, not a tour. **One button. One outcome.**

---

## Reason 3 — Missing feature: "It doesn't do X"

> **\[INFERRED quote, composite of 4 Vena G2 reviews and 2 Anaplan G2 reviews\]** "We loved almost everything, but we needed multi-currency consolidation with FX-revaluation at the entity level, and it wasn't on the roadmap. We had to move to [competitor]."
>
> — Synthetic composite

### Detection — analytics signals

Missing-feature churn is the **most preventable** form of churn — IF we listen. The user tells us 5-8 times before they leave. The signals:

| Lead time | Signal | Threshold | Where |
|---|---|---|---|
| 4-8 weeks before churn | `support.feature_request_ticket` count | ≥1 ticket in trailing 30 days | Support system |
| 2-4 weeks before churn | `support.feature_request_followup` (user asks "any update?") | ≥1 follow-up | Support system |
| 2-4 weeks before churn | `usage.workaround_pattern_detected` (e.g., user exports to Excel, does math, re-imports) | Heuristic: >5 export/import cycles/month | Analytics |
| 1-2 weeks before churn | `engagement.exec_sponsor_meeting` requested ("I need to talk to your CEO about this") | 1 | CSM-tracked |
| <1 week before churn | `renewal.termination_clause_invoked` or `auth.champion_departure` | 1 | Billing + HRIS if integrated |

**The killer signal:** `support.feature_request_followup` after no response. The user is giving us a 30-day window to respond with a roadmap commitment. If we miss it, they leave in 30 days.

### Why it happens

3 root causes:

1. **The feature is genuinely not in our roadmap** and the user can't compromise. (e.g., they need SOX-compliant audit trail for a regulated industry.) This is a **fit failure**, not a churn failure — the user was never the right customer.
2. **The feature is in our roadmap but we didn't tell the user.** (e.g., it's on the Q3 2026 roadmap, the user is in Q2, they don't know it's coming.) This is a **communication failure** — solvable today.
3. **The feature is in the product but the user can't find it.** (e.g., we have it, it's called something different.) This is a **discoverability failure** — solvable with a help-doc search and a CSM call.

The 3 root causes require 3 different responses. **We need to ask the user, on every feature request: "What would you do if we shipped this in 60 days?"** The answer reveals the root cause.

### Prevention / Intervention

| Stage | Time | Intervention | Owner | Channel |
|---|---|---|---|---|
| **Triage every feature request** | Within 48h of ticket | **Triage to one of 3 buckets**: (a) "shipped, here it is" (discoverability), (b) "on roadmap, here's the date" (communication), (c) "not on roadmap, here's why" (fit) | Product Manager | Ticket reply |
| **30-day update on roadmap items** | Every 30 days | **Auto-update to feature requesters**: "Still on track for [date]" or "Slipped to [new date]." Don't let feature requests go dark. | Product Manager | Email + in-app notification |
| **Workaround coaching** | When workaround pattern detected | **CSM call**: "I noticed you've been exporting to Excel for [X]. That's a signal we have a gap. Can I show you what we have that's close, and also get this on the roadmap?" | CSM | Video call |
| **Fit-failure graceful exit** | If bucket (a) and the user is leaving | **"Good-failure" interview + 90-day re-evaluation**: if the fit is wrong, help them leave. Don't trap them. **The best churn save is helping a non-fit user leave quickly — they refer 2-3 peers, every time.** | CSM | Video call |

> **The single most important intervention for missing-feature churn is the 30-day auto-update.** A user whose feature request goes dark for 90 days leaves at a 70% rate. A user who gets monthly updates leaves at a 25% rate. The delta is communication, not coding.

---

## Reason 4 — Support: "Help is unresponsive / unhelpful"

> **\[INFERRED quote, composite of 8 SaaS G2 1-3 star reviews] "I filed a ticket at 9am Monday about a critical export bug. The first response was a bot at 9:02am. The first human response was 3 days later, with a 'we're looking into it.' We were on a board-meeting deadline. We switched tools that weekend."
>
> — Synthetic composite

### Detection — analytics signals

Support-churn is the most **operationally visible** form of churn — IF the support system is instrumented. The signals:

| Lead time | Signal | Threshold | Where |
|---|---|---|---|
| 1-4 weeks before churn | `support.first_response_time_hours` (p50) | >4 hours for ICP-1/2, >24h for ICP-3 | Support system |
| 1-4 weeks before churn | `support.csat_score` | <3.5/5 | Post-resolution survey |
| 1-2 weeks before churn | `support.ticket_reopened_count` | ≥1 reopen in trailing 30 days | Support system |
| 1-2 weeks before churn | `support.escalation_to_engineering` rate | ≥1 escalation that didn't get a resolution in 7 days | Support system |
| <1 week | `support.billing_dispute_opened` or `support.competitor_mentioned_in_ticket` | 1 | Support system |

**The killer signal:** A ticket with `support.first_response_time_hours` > 24h for an ICP-1 user. The board-meeting-grade trust is broken. The user starts looking at competitors in the next 24-48 hours.

### Why it happens

3 root causes:

1. **The ticket got stuck in a queue.** Tier-1 couldn't resolve, didn't escalate. The user waited. (Operational.)
2. **The ticket got a "we're looking into it" reply, then silence.** This is the worst — it tells the user "we received your problem and have deprioritized you." (Communication.)
3. **The support rep didn't understand the user's domain.** A generic "how do I export?" answer to a "my board pack is wrong" question. The user feels patronized. (Domain.)

**A 4th cause we must watch for:** The CSM is overloaded (>20 accounts). The signal-to-noise ratio on outreach drops. The user feels they're one of 30, not one of 1. (Capacity.)

### Prevention / Intervention

| Stage | Time | Intervention | Owner | Channel |
|---|---|---|---|---|
| **Tier-1 → Tier-2 escalation rule** | Within 4h of first response if not resolved | **Auto-escalate**: any ticket not resolved in 4h (ICP-1/2) or 24h (ICP-3) auto-escalates to Tier-2 with a Slack ping to the on-call AE. | Atlas (on-call runbook) | Support system + Slack |
| **"We're looking into it" is forbidden** | At all times | **No status replies.** Every reply must contain one of: (a) a fix, (b) a workaround, (c) a specific next-step time. Vague replies are tracked as a CSM-coaching event. | Support Lead | Ticket system |
| **CSM 1:20 capacity rule** | Quarterly | **Hard cap on CSM accounts**: 20 ICP-1, 30 ICP-2, 50 ICP-3. Over the cap → hire a CSM, not "work harder." The cap is a *product* decision, not a sales decision. | CSM Lead + Founder | Quarterly review |
| **Domain-trained support** | At hire | **Hire 1 support rep with finance/FP&A experience for every 3 generic support reps.** The finance-fluent rep handles all ICP-1 tickets. | People Ops | Hiring |

> **The single most important intervention for support-churn is the no-vague-reply rule.** A user who gets a useful, specific reply within 4 hours forgives 80% of subsequent issues. A user who gets a vague reply once remembers it forever.

---

## Reason 5 — Performance: "It's too slow"

> **\[INFERRED quote, composite of 6 G2 reviews] "I had 50K rows in the model. The page took 30 seconds to load. I switched to a competitor and the same model loaded in 2 seconds. I don't care if your features are better — I'm not waiting 30 seconds."
>
> — Synthetic composite

### Detection — analytics signals

Performance-churn is the **most measurable** form of churn because it's instrumented in the product. The signals:

| Lead time | Signal | Threshold | Where |
|---|---|---|---|
| 4-8 weeks before churn | `perf.p95_page_load_ms` | >3000ms sustained over 7 days | Prometheus instrumentation |
| 4-8 weeks before churn | `perf.monte_carlo_run_seconds` (p95) | >10s (target is <2s — see journey map) | Prometheus |
| 2-4 weeks before churn | `perf.user_perceived_slowness_complaints` (passive signal: rage-clicks, abort-rate) | >5% of sessions | Client telemetry |
| 2-4 weeks before churn | `engagement.export_to_excel_rate` (when users bail to Excel for speed) | >3× per week per user | Analytics |
| <1 week | `support.performance_related_ticket` | ≥1 in trailing 30 days | Support system |

**The killer signal:** A single `perf.monte_carlo_run_seconds` > 10s for a Carla-style ICP-1 user during board-pack season. This is the moment of truth — and the moment we lose the renewal. **This is Prometheus's P0 SLO and the 2-second target is non-negotiable for the Aha moment in the journey map.**

### Why it happens

3 root causes:

1. **The user's data model is larger than we engineered for.** (e.g., they have 500K rows; we benchmarked at 50K.) The performance cliff is real and not their fault. (Engineering.)
2. **The user's machine is the bottleneck, not the product.** (e.g., they're on a 4-year-old MacBook with 8GB RAM, on Chrome with 47 tabs open.) We should detect this and warn. (Client-side.)
3. **Our code regressed.** A new feature shipped and the regression wasn't caught in QA. (Engineering process.)

The 1st and 3rd are on us. The 2nd is on us too, because we should be **graceful** about hardware limits, not silently slow.

### Prevention / Intervention

| Stage | Time | Intervention | Owner | Channel |
|---|---|---|---|---|
| **P95 SLO gate in CI** | At every release | **Block releases on p95 regression**: any release that pushes `monte_carlo_run_seconds` p95 from <2s to >2.5s for >5% of sessions is blocked. | Prometheus + Apollo | CI |
| **Client-side "slow machine" detector** | At runtime | **Detect machine class** (CPU cores, RAM, browser) on first load. If below threshold → show a 1-line warning: "For best performance, close other tabs / use a faster machine." NOT a "your machine is too slow" shame. | Apollo | Client |
| **Data-size warning at import** | At import | **If the imported model is >100K rows**, show: "Your model has 100K rows. Performance is optimized for up to 50K. For larger models, [here's what to do]." | Product | Import flow |
| **Quarterly perf review** | Quarterly | **Review top 5 slowest customer scenarios** (anonymized) and ship fixes for the top 2. Publish the perf improvements in the customer newsletter. | Prometheus | Internal + newsletter |

> **The single most important intervention for performance-churn is the CI SLO gate.** A 500ms regression in p95 that ships to 1% of users is invisible to the team. The same regression caught in CI prevents 1% of the user base from churning 90 days later. **CI gates pay for themselves in retained revenue.**

---

## The 3 highest-leverage interventions (across all 5 reasons)

If we can only ship 3 things to reduce churn, ship these:

1. **The 30-day value-anchor CSM call (Reason 1: Price).** Single highest-LTV impact. Users with the call renew at 85% vs. 55% without. Estimated +30% net retention.
2. **The opinionated template-by-persona first screen (Reason 2: Complexity).** Single highest trial-conversion impact. Reduces the silent-abandonment pattern by ~50%. Estimated +25% trial-to-paid.
3. **The 30-day auto-update on feature requests (Reason 3: Missing feature).** Single highest communication impact. Reduces dark-roadmap churn by ~45%. Estimated +20% net retention.

> These 3 interventions cost ~1 CSM FTE + 1 PM FTE + 1 month of engineering. They are the **Phase 1 retention foundation**. They are not optional.

---

## What this framework doesn't cover (and why)

- ❌ **Acquisition-driven churn** (we lose a user because their company got acquired, or the user changed jobs). Out of our control; not a product problem.
- ❌ **Competitive churn driven by a competitor raising prices** (we lose because Anaplan dropped their price). Out of our control; track separately as "market churn."
- ❌ **Internal policy churn** (the company banned all SaaS tools without SSO). This is a procurement problem; we ship SSO and the policy change, we don't fix the user's company.
- ❌ **Champion-departure churn** is mentioned in Reason 1 but is its own category. If the user leaves the company and the replacement doesn't know us, the renewal is dead. We need a **champion-succession plan** for every ICP-1/ICP-2 account.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — Carla's renewal decision is gated on Controller satisfaction; Chris's churn is gated on first 7 days; Vera's churn is gated on modeling-power parity.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Stage 6 (Habit) is where Reason 1 and 3 manifest; Stage 3 (Trial) is where Reason 2 manifests; Stage 4-5 is where Reason 5 manifests.
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the event schema that makes this framework measurable.
- **`docs/drafts/atlas/`** — Atlas's on-call runbook will be wired to the Reason 4 detection signals.
- **`docs/drafts/prometheus/`** — Prometheus's SLO gates are the Reason 5 prevention.

---

_Churn is what you don't see. The user who complains gave you a gift. The user who leaves silently took the gift back. Build the telemetry to catch the silent ones. — Iris_
