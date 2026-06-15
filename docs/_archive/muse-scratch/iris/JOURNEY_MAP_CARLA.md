<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Journey Map (CFO Carla's Path to First Value)

> **Muse:** Iris.
> **Subject:** CFO Carla (ICP-1, Strategic Buyer). See `PERSONAS.md` for full persona detail.
> **Scope:** The 7 stages from "never heard of us" to "I'm telling my peer CFOs about this." Each stage has 4 lenses: **DO** (behavior), **FEEL** (emotion), **GO WRONG** (friction / drop-off), **MEASURE** (analytics event we'd want).
> **Use:** This map feeds (a) Hermes's marketing site copy, (b) Hera's onboarding UX, (c) Apollo's analytics event taxonomy, (d) Strategos's GTM sequencing.
> **Status:** Pre-launch. Behavior predictions are inferred from peer-CFO G2 reviews of Anaplan/Adaptive and founder discovery calls. Replace with observed behavior after first 10 paying customers (2026-Q4).
> **Conventions:**
> - **DO** = what Carla is actually doing (not what we wish she was doing).
> - **FEEL** = the dominant emotion. Always 1 word if possible. The emotion drives conversion, not the feature.
> - **GO WRONG** = the single highest-probability failure mode per stage. We can only defend against one — pick the one that costs us the most.
> - **MEASURE** = the analytics event that tells us whether the stage "worked." If we can't measure the stage, we can't optimize it.

---

## Stage 1 — Awareness

> **Carla's trigger (3 weeks ago):** A board meeting where she couldn't answer the "what if we miss Q4 by 20%?" question. The CEO looked at her like she was hiding something. She's been quietly Google-stalking "FP&A software" ever since.

| Lens | Description |
|---|---|
| **DO** | Sees a peer-CFO's LinkedIn post (Sat morning, scrolling phone in bed). Post says: "Finally found a tool that runs 50 scenarios in 5 minutes. The Monte Carlo alone is worth the price." Carla clicks the link. Lands on our homepage. Reads the headline. Checks the pricing page. Reads 2 customer logos. Closes the tab. Googles the company name 3 days later to confirm it's real. |
| **FEEL** | **Cautiously curious.** Not yet hopeful. The FP&A-software market has burned her before (Vena demo was 90 minutes, Adaptive required a sales call before she could see a screenshot). She's skeptical. |
| **GO WRONG** | The LinkedIn post looks like a paid promotion (sponsored, with a "Learn More" CTA that goes to a generic landing page). Peer-CFO trust is the only trust signal that works for Carla; if the post looks fake, she's gone. **Defend with: real-customer LinkedIn posts, no paid amplification on customer testimonials, organic-only distribution on customer logos.** |
| **MEASURE** | `awareness.linkedin_post_clickthrough` (UTM-tagged), `awareness.homepage_visit`, `awareness.pricing_page_visit`, `awareness.brand_search` (Google "FinPlan Pro" — the 3-day-later signal). **KPI: % of pricing-page visitors who do a brand search within 7 days.** If this is <10%, the brand isn't sticking. |

---

## Stage 2 — Consideration

> **Carla's situation:** It's a Tuesday. She has 20 minutes between meetings. She bookmarks our pricing page. She doesn't have time to do a real evaluation, but she wants to know "is this worth a demo?" She's looking for 3 things: (1) is the price defensible to her CFO-self, (2) is the security story good enough for the audit committee, (3) is there a customer that looks like her company.

| Lens | Description |
|---|---|
| **DO** | Reads the ICP-1 page (the page we wrote for her, not the generic "for finance teams" page). Skims the SOC 2 + ISO 27001 badges. Looks for a customer with similar ARR band, similar headcount, similar ERP (NetSuite, in her case). Sends the link to her Controller (Chris-type) with a Slack message: "Can you check this out and tell me if it's real?" |
| **FEEL** | **Hopeful but guarded.** She wants this to be real. She is also pre-emptively disappointed, because every "this is the one" moment in the last 3 years has been a letdown. |
| **GO WRONG** | The ICP-1 page is generic. It says "for CFOs and finance leaders" but doesn't mention NetSuite, doesn't mention board-pack cycle time, doesn't mention audit committee. Carla bounces in 30 seconds. **Defend with: persona-specific landing pages (ICP-1 page for CFO, ICP-3 page for Controller) with concrete outcomes ("close-to-disclose in 5 days"), not feature lists.** |
| **MEASURE** | `consideration.icp1_page_visit` (the specific URL), `consideration.soc2_badge_click`, `consideration.controller_forward` (track the Slack-share pixel if we can; or instrument a "share with my team" CTA), `consideration.time_on_page`. **KPI: controller-forward rate. If <15% of ICP-1 visitors forward to a teammate, the page isn't compelling enough to share.** |

---

## Stage 3 — Trial (the moment of truth)

> **Carla's situation:** Her Controller (a Chris-type) has poked around the website and says "this looks downloadable, not a sales call." Carla is intrigued. She asks the Controller to install it on a sandbox. The Controller downloads the offline-first desktop app, double-clicks the .dmg, sees the splash screen in 30 seconds.

| Lens | Description |
|---|---|
| **DO** | Controller installs the desktop app offline (no signup, no credit card, no email gate — this is the rule). Imports their existing Excel P&L (drag-and-drop, no transformation). Sees the P&L render in 5 seconds. Sends Carla a Slack message: "uh, you need to see this." Carla opens it on her laptop the next morning. The data is there. She is **startled**. |
| **FEEL** | **Startled, then cautiously delighted.** The "no signup" rule is what makes this work. Every other tool asks for an email, a credit card, a sales call. We don't. **The delight is not the feature; the delight is the absence of friction.** |
| **GO WRONG** | We add a "Sign up to save your work" gate before the first import. Carla (or her Controller) hits the gate, drops their email, gets a 14-day trial timer, and never comes back. The 14-day timer is a psychological tax that 80% of trial users don't pay. **Defend with: offline-first, no signup, no trial timer for the first 30 days. Work is saved locally; the signup gate is at the "share with my team" action, not the "open the app" action.** |
| **MEASURE** | `trial.install_completed`, `trial.first_excel_import`, `trial.first_render_seconds` (target: <5s for 95th percentile), `trial.signup_gate_shown` (if shown, it's a failure), `trial.controller_to_carlo_handoff` (the Slack message). **KPI: install-to-first-import conversion >70%. If <50%, the import UX is broken.** |

---

## Stage 4 — First Value

> **Carla's situation:** It's been 4 days since the install. The Controller has imported 3 months of actuals and 2 of forecast. Carla opens the app on a Monday morning, looks at the variance tab, and sees the variance she was going to spend 4 days building in Excel — already there, current, and segmented by department.

| Lens | Description |
|---|---|
| **DO** | Opens the app. Looks at the variance report. Sorts by absolute variance. Drills into "Customer Success" — the department she was worried about. Sees the forecast vs. actual gap, with a driver-tree breakdown. **Exhales audibly.** This is the first time in 18 months the data is current AND trustworthy. |
| **FEEL** | **Relief.** Not joy, not excitement. **Relief.** The weight of the "is the data right?" anxiety is lifted. The first value is not a new capability; it's the **removal of a chronic low-grade fear.** |
| **GO WRONG** | The variance numbers don't match what Carla's Excel said. Even by $200. Carla loses trust instantly, and trust is recovered at 1/10th the speed it was lost. **Defend with: a "Compare to my Excel" feature in the import flow. Show Carla the diff between our numbers and her spreadsheet. If there's a delta, explain it. If we can't explain it, we're wrong.** |
| **MEASURE** | `first_value.variance_viewed`, `first_value.drivers_drilled_into`, `first_value.excel_diff_requested` (the trust-building moment), `first_value.days_since_install` (target: median 4 days). **KPI: % of triers who reach first value within 7 days. Target >60%. Below 40%, the trial is failing.** |

---

## Stage 5 — Aha Moment (the conversion event)

> **Carla's situation:** It's been 2 weeks. The Controller has been using the app daily. Carla is at her desk, and a sales VP pings her on Slack: "If we close the Acme deal in October instead of November, what does that do to Q4?" This is the exact question that, 2 weeks ago, would have triggered a 3-day Excel rebuild.

| Lens | Description |
|---|---|
| **DO** | Opens the app. Goes to the scenario planner. Changes one assumption: "Acme deal closes Oct 15 instead of Nov 1." Runs a 50-scenario Monte Carlo on the Q4 forecast. **Sees the result in 90 seconds.** Sees a confidence interval: "Q4 ARR: $14.2M (90% CI: $13.6M-$14.8M)." She screenshots it. She pastes it into Slack to the CEO. **She has not opened Excel in 11 days.** |
| **FEEL** | **Powerful.** Not just relieved. **Powerful.** This is the first time in her career she's answered a CFO question in the time it takes to drink a coffee. The aha moment is not "the tool is cool." The aha moment is "**I am a more powerful CFO because of this tool.**" |
| **GO WRONG** | The Monte Carlo takes 6 minutes instead of 90 seconds. The 50-scenario run is queued, not interactive. The confidence interval is shown as a number, not a chart. Carla's aha is a yawn. **Defend with: Monte Carlo MUST be sub-2-seconds for 50 scenarios on real data. The result MUST be a chart, not a number. The "share to Slack" button MUST be 1 click, not 3.** |
| **MEASURE** | `aha.monte_carlo_run_started`, `aha.monte_carlo_run_completed_seconds` (target: <2s for p95), `aha.confidence_interval_viewed`, `aha.slack_share_clicked`, `aha.excel_last_opened` (the "Excel retirement" signal — this should be >7 days post-install). **KPI: % of triers who run a Monte Carlo within 14 days. Target >40%. Below 25%, the aha isn't landing.** |

---

## Stage 6 — Habit (the retention event)

> **Carla's situation:** It's been 4 weeks. The Controller uses the app every day. Carla uses it 3-4 times a week, mostly for the variance report and the ad-hoc scenarios. The board pack is being built from our exports. The CEO has stopped asking "where are the numbers?" and started asking "what do the numbers say?"

| Lens | Description |
|---|---|
| **DO** | Opens the app 3-4 times/week. Runs 2-3 scenarios/week. Exports the board pack from our template. The Controller has stopped opening Excel for the close. **Carla tells 2 peer CFOs about it.** One is a CFO she met at a SaaStr dinner; the other is a former Big-4 colleague. The tell is a 1:1 coffee, not a LinkedIn post. |
| **FEEL** | **Loyal.** Not yet evangelical. Loyal. The way you're loyal to your accountant who finally understands your business. The way you're loyal to a vendor who picked up the phone at 9pm. **Loyalty is built in 1:1 moments, not in-app features.** |
| **GO WRONG** | We send Carla a "how likely are you to recommend us?" NPS survey in week 5. She ignores it. We never know she told 2 peer CFOs. We miss the warm-intro moment. **Defend with: in-person / video conversations at day 30, day 60, day 90. NOT a survey — a real call. The CSM asks "who else do you know who needs this?" The CSM enables the warm intro, doesn't ask for it.** |
| **MEASURE** | `habit.weekly_active_days` (target: 3+ for ICP-1, 5+ for the Controller), `habit.scenario_runs_per_week`, `habit.board_pack_exported` (the "I trust this for the board" signal), `habit.peer_intro_made` (CSM-tracked, not self-reported). **KPI: weekly active rate at day 30. Target >70% for ICP-1. If <50%, we're losing to a competitor that became the daily habit instead of us.** |

---

## Stage 7 — Evangelism (the referral event)

> **Carla's situation:** It's been 4 months. Carla has now told 5 peer CFOs about us. 2 of them have installed. 1 of them has converted to paid. Carla has agreed to do a 30-min case-study call with our marketing team. She is on the customer-advisory-board invite list. She is starting to think of us as "her tool" — she has skin in the game.

| Lens | Description |
|---|---|
| **DO** | Joins the customer community (Slack). Writes a 200-word case study (we provide the template; she provides the words). Refers 5 more CFOs over the next 6 months. Speaks at our quarterly customer dinner. Is the first person our marketing team calls when a CFO-tier prospect asks for a reference. |
| **FEEL** | **Pride.** "I found this. I was early. I helped shape it." Evangelists are not compensated with discounts; they are compensated with **status** (early access, advisory-board seat, the "we couldn't have done this without you" moments from our CEO). |
| **GO WRONG** | We treat the case study as marketing collateral. We edit Carla's words to fit our messaging. We use her name without permission. We ask her to do 4 case-study calls in a month. **She fires us as a reference within 90 days.** **Defend with: 1 case study per quarter, Carla's words verbatim, name used only with explicit written permission, status signals (early access, advisory board) over discount signals.** |
| **MEASURE** | `evangelism.case_study_published`, `evangelism.referral_made` (CSM-tracked), `evangelism.advisory_board_joined`, `evangelism.community_posts_per_month`. **KPI: referral-to-paid conversion. If >20% of Carla's referrals convert, she's a Tier-1 advocate. If <5%, we have a satisfaction problem we're not seeing.** |

---

## The funnel in one view (for Apollo's analytics taxonomy)

| Stage | Name | Primary KPI | Drop-off we're defending against |
|---|---|---|---|
| 1 | Awareness | Brand-search within 7 days of post-click | Fake-looking promotion |
| 2 | Consideration | Controller-forward rate from ICP-1 page | Generic page that doesn't speak to her |
| 3 | Trial | Install-to-first-import conversion | Signup gate before first value |
| 4 | First Value | % reaching first value in 7 days | Variance mismatch with Excel |
| 5 | Aha Moment | % running Monte Carlo in 14 days | Monte Carlo > 2 seconds |
| 6 | Habit | Weekly active at day 30 | NPS survey in week 5 |
| 7 | Evangelism | Referral-to-paid conversion | Treating her as a marketing asset |

---

## The 3 places Carla is most likely to leak (the 3 highest-leverage interventions)

1. **Stage 3 → 4 (Trial → First Value).** If we lose her here, we never get the aha. The single biggest lever is the **"Compare to my Excel" diff** at import. If we show the diff and it matches, trust is built in 1 step. If we don't show the diff, trust is built (or lost) over weeks.
2. **Stage 5 → 6 (Aha → Habit).** The aha is a moment; the habit is a system. The single biggest lever is the **weekly board-pack export workflow**. If the export is 1-click and the template is board-ready, the habit forms around it. If the export is 5-clicks, the habit forms around Excel and we're a one-time aha.
3. **Stage 6 → 7 (Habit → Evangelism).** Evangelism is the highest-leverage growth channel we have. The single biggest lever is the **CSM-triggered peer-CFO warm intro** at day 30. Not a referral link — a real call. The CSM enables it; Carla delivers it. Every CFO Carla refers has a 5-10× higher conversion rate than a cold outbound lead.

---

## What we will NOT measure (and why)

- ❌ **NPS score in the first 30 days.** Way too early. Carla's NPS is noise in week 4 and signal in month 6.
- ❌ **Daily active users (DAU) for Carla.** She's a 3-4 times/week user. DAU will look bad and we'll panic. **Weekly active is the right metric for ICP-1.**
- ❌ **Feature usage breadth.** If Carla uses 2 features (variance + scenarios), that's perfect. The "use more features" metric is for consumer apps, not for CFOs.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — Carla's full persona.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — Q8 ("magic wand") is the seed for the Aha Moment stage.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** (T-IR-002, next cycle) — what makes Carla churn at Stage 6 or 7.
- **Hermes ICP drafts** — Stage 2's ICP-1 page is the page Hermes is writing.
- **Hera UX spec** — Stages 3, 4, 5 are the onboarding UX Hera is designing.
- **Apollo analytics taxonomy** — the `MEASURE` column feeds the event taxonomy Apollo will instrument.
- **Strategos GTM sequencing** — the 7 stages map 1:1 to the 7 GTM motions (LinkedIn → landing page → offline trial → variance import → Monte Carlo → board-pack export → case study).

---

_The journey is not a funnel. It's a story. The story has 7 chapters. Each chapter has a feeling. Build for the feeling, not the chapter. — Iris_
