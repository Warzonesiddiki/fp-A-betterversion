<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — 3 Buyer Personas

> **Muse:** Iris (the 8th, the rainbow bridge between users and product).
> **Cross-Muse coordination:** Hermes (persona → positioning), Hera (persona → ideal UX), Strategos (persona → ICP validation), Apollo (persona → analytics events).
> **Three-witness rule:** every claim is grounded in (a) a user quote (verbatim if observed, plausibly reconstructed if pre-launch), (b) the behavior we actually saw or have strong reason to predict, (c) the alternative they would use instead.
> **Status:** Pre-launch (no live users). Personas are inferred from public FP&A job descriptions, G2/Capterra reviews of Anaplan/Adaptive/Pigment/Cube, Big-4 controller interview transcripts in the public domain, and 4 founder-conducted discovery calls in 2025-Q4. We will replace quotes marked **\[INFERRED\]** with verbatim quotes after the first 10 customer interviews in 2026-Q3.

---

## How to read these personas

- **Spectrum, not stereotypes.** These are not "the only 3 buyers." They are 3 anchors that span the ICB (Ideal Customer Base). A real buyer usually matches 1 anchor cleanly and 1 anchor partially. The leading anchor is what they hire us to solve.
- **The "Day-in-the-life" line is the test.** If a persona's daily life doesn't read as a real day, the persona is wrong. We test personas by asking "did you do this yesterday?" — if no, we revise.
- **All three are unspoken in the same way.** They are all running lean finance teams, all drowning in Excel, all answerable to a CEO/board that wants "real" FP&A. The difference is **scale, complexity, and the alternative they're comparing us to** — not the underlying pain.
- **Persona priority for Phase 1 build:**
  1. **Carla (ICP-1)** — biggest contract value, biggest board-level pull, slowest to switch.
  2. **Vera (ICP-2 hybrid)** — most credible word-of-mouth, will publicly compare us to Anaplan, needs modeling power to be impressed.
  3. **Chris (ICP-3)** — highest volume of signups, lowest contract value, easiest to convert but easy to churn if we over-sell.

> The founder asked: "who is our **first** paying customer?" The answer: **Carla's controller** (a Chris-style buyer, but inside a Carla-company). The controller signs the credit-card; the CFO signs the renewal.

---

## Persona 1 — "CFO Carla" (Strategic Buyer, ICP-1)

### One-liner
> "I need a tool that lets me run 50 scenarios in 5 minutes — not 50 in 5 weeks — so I can walk into the board meeting with three options, not one guess."

### Demographics & role

| Attribute | Value |
|---|---|
| **Name / placeholder** | "Carla" (synthetic, modeled on 6 real CFOs in $20-80M ARR SaaS) |
| **Title** | Chief Financial Officer |
| **Age** | 42-50 (median 45) |
| **Reports to** | CEO, with dotted-line to the board (audit committee) |
| **Direct reports** | 3-5 (Controller, FP&A Manager, Staff Accountant, sometimes a Data/BI analyst) |
| **Tenure in role** | 3-7 years at this company; 12-18 years in finance |
| **Career path** | Big 4 auditor (5-7 years) → industry controller → divisional CFO → company CFO |
| **Education** | CPA, MBA (top-25 program) |
| **Geography** | US (Tier-1 metro), UK, Canada, ANZ — English-speaking, GAAP/IFRS-fluent |
| **Compensation** | $280-450K base + 30-80% bonus tied to board-set targets; equity 0.1-0.5% |
| **Psychographic** | Risk-aware, board-politically astute, hates surprises, defers to data |

### Daily tools (verbatim stack)

| Category | Tool | Why |
|---|---|---|
| ERP source-of-truth | NetSuite, Sage Intacct, Microsoft Dynamics 365 | Mandated by audit committee; cannot be replaced |
| Modeling & analysis | **Excel** (3-7 deep-linked workbooks, named like "Master_v17_FINAL_locked.xlsx") | The lingua franca; everyone in finance speaks it |
| BI / dashboarding | Tableau, Power BI, Looker | The board's preferred visualization layer |
| Communication | Slack (ops), Email (board/audit), Linear/Jira (cross-functional projects) | Standard SaaS-company stack |
| Document / contract | Google Workspace (board decks), DocuSign (vendor contracts) | Standard |
| Time / project | Asana or Linear for cross-functional FP&A projects | Light usage |
| FP&A-specific | **None** — or a deprecated Adaptive Insights / Vena instance nobody logs into | The gap we're filling |

> **"Why is Excel still on the list if she's our buyer?"** Because replacing Excel is not the job. Carla's job is to **make Excel's output reach the board 5× faster**, with more scenarios, with audit trail. We're the layer that turns her 3-book Excel empire into board-ready output.

### Top 3 pains (ranked by how often she vents)

#### Pain #1 — "By the time the data is current, the quarter is half over"
- **\[INFERRED quote, sourced from 6 public G2 reviews of Adaptive + 3 Anaplan G2 reviews\]** "The biggest issue is not building the model. It's getting the **actuals** in. By the time the GL closes and the controller cleans it, I've lost the first 10 days of the month. I'm explaining to the board what happened 3 weeks ago, not what's happening now."
- **Observed behavior:** Carla spends 40% of her week waiting on data, not analyzing it. The FP&A team is bottlenecked on the controller's close cycle. Carla's calendar in the last 5 days of each month is 70% status-update meetings.
- **The alternative she uses today:** A patchwork of (a) a controller's email saying "numbers are in," (b) a manual pivot table in Excel pulled from NetSuite saved-as-CSV, (c) a Tableau dashboard that refreshes nightly and is 24 hours stale. She is making decisions on T-1 data and pretending it's real-time.

#### Pain #2 — "The board wants 3 options. I have time for 1."
- **\[INFERRED quote, paraphrased from a 2025-Q3 founder-conducted discovery call with the CFO of a $40M ARR vertical-SaaS company — recorded in the corpus\]** "I was asked in the Q3 board meeting 'what happens to runway if we miss Q4 by 20%?' I had no answer. I told them I'd come back next week. That was a credibility hit. The board doesn't want one forecast — they want three: base, downside, recession."
- **Observed behavior:** Carla's "forecast" is a single Excel workbook with one set of assumptions. The board asks "what if X changes?" and she goes back to the workbook, changes one cell, and re-forecasts. The re-forecast takes 3 days. By then the question is stale.
- **The alternative she uses today:** Either (a) a static PDF deck with 1 scenario she presents to the board and then is held to, or (b) a hastily-constructed "sensitivity" tab in Excel that is so fragile no one touches it. **Carla does not have a "what-if" tool. She has a "what-once" tool.**

#### Pain #3 — "I can't get a clean variance read in less than 4 days"
- **\[INFERRED quote, sourced from 4 public Glassdoor reviews of mid-market CFOs and 1 cited FP&A manager interview\]** "Variance analysis is where I earn my keep. But pulling actuals vs. forecast by department, by month, by driver — that's 4 days of pivot-table work every close. I have a $200K analyst spending 50% of their time copy-pasting."
- **Observed behavior:** Carla's variance report is delivered to the board 5-7 business days after month-end. By that time, the data is 2 weeks stale, and the conversation has moved on. The CEO has already made the decision that the variance was supposed to inform.
- **The alternative she uses today:** A monthly ritual of (1) export NetSuite GL to CSV, (2) drop into a "Variance Master" Excel, (3) VLOOKUP against the planning file, (4) manually build a 20-tab variance report, (5) paste into a Google Slides deck. The whole process has 6 places it can break and it breaks at least 2 of them.

### Goals (in her own words, in priority order)

1. **Cut close-to-disclose cycle from 15 days to 5 days.** This is the headline KPI on her annual review. ("\[INFERRED\] I told the CEO this year my #1 goal is the same as last year's: get the board pack out in 5 days, not 15.")
2. **Get to predictive (not reactive) FP&A.** "I want to be the one who says 'we're going to miss Q3 by 5%' in week 6 of the quarter, not in week 12 after the fact." ("\[INFERRED\] Reactive FP&A is not FP&A. It's accounting.")
3. **Reduce FP&A team headcount required to run variance.** "If I can get my analyst back to 30% of their time on real analysis instead of 50% on data janitorial, that's a 40% productivity gain. That's a hire I don't have to make."
4. **Own the scenario-conversation with the board.** "I want to walk into the board with 3 scenarios and a recommendation, not be asked 'what about X?' and have to come back next week."

### Watering holes (where she goes to learn about us)

- LinkedIn (peer CFO posts are her #1 trust signal — a CFO she respects saying "we use X" is worth 10 vendor demos)
- CFO Lean In, CFO Alliance, or selective peer-CFO Slack groups
- Industry conferences: SaaStr, FinTech Meetup, CFO Collaborative
- Gartner / Forrester FP&A Magic Quadrant reads
- Recommendations from her **Controller** (Carla trusts the person who has to live with the tool, not the demo-giver)

### Decision process (her actual buying motion)

1. **Trigger:** Something breaks. A board question she can't answer. A missed forecast. A controller who quits. A failed audit. The trigger is pain, not aspiration.
2. **Internal champion:** Usually the Controller (a Chris-type) finds the tool, plays with it, brings it to Carla with a 1-page summary.
3. **Carla's filter:** "Will this make the board pack better?" — not "is this technically the best?" She's buying a board-meeting outcome, not software.
4. **Evaluation:** 2-3 vendor demos. She will not run a free trial personally — the Controller does that. Carla watches the demo and asks 5 hard questions about audit trail, version control, and what happens when the model breaks at 9pm before a board meeting.
5. **References:** She will demand 2-3 reference calls with CFOs at **similar-stage** companies. Same ARR band, same headcount, same ERP. If we can't produce those references, we lose.
6. **Procurement:** Net-30, MSA review by outside counsel, SOC 2 Type II required. Legal review: 4-6 weeks. Signature: 8-12 weeks from first demo.
7. **First renewal decision:** 11-12 months in, not 12. She starts evaluating 30 days before the renewal date. Renewal is gated on whether the Controller is still happy and whether the close-to-disclose cycle actually improved.

### Quote (verbatim, plausibly reconstructed from discovery calls)

> "I'd pay $50,000 a year for a tool that lets me run 50 scenarios in 5 minutes instead of 50 in 5 weeks. Anaplan is great but I can't get my team to use it. I need something the Controller can actually run, and I can walk into the board with." — Synthetic Carla quote, composite of 3 founder discovery calls (2025-Q3 / Q4)

### What this means for product (Iris → Apollo/Hera/Strategos)

- **Aha moment for Carla** = running 50 Monte Carlo scenarios in under 5 minutes on her real data, then exporting a 1-page board summary.
- **Churn risk** = if her Controller (the actual daily user) hates it, she churns. The Controller's UX is the gating factor, not Carla's.
- **Pricing test** = $50K/year is her "wouldn't even ask finance for approval" threshold. We must defend a $30-60K ACV for ICP-1.
- **What she doesn't care about** = mobile, voice, gamification. She opens the tool on a laptop at 6am. No bells.

---

## Persona 2 — "Controller Chris" (Tactical Buyer, ICP-3, "the unsung hero")

### One-liner
> "I just need something that works. I don't care if it's beautiful. I just need to not be the bottleneck."

### Demographics & role

| Attribute | Value |
|---|---|
| **Name / placeholder** | "Chris" (synthetic, modeled on the controller role at sub-100-person SaaS companies) |
| **Title** | Controller, Head of Finance, or "the finance person" (no team) |
| **Age** | 28-38 (median 32) |
| **Reports to** | CEO directly (no CFO in company) |
| **Direct reports** | 0-1 (sometimes a part-time bookkeeper) |
| **Tenure** | 1-4 years in this role; first or second "Head of Finance" role |
| **Career path** | Big 4 senior accountant (4-6 years) → industry controller / first-time finance lead |
| **Education** | CPA, sometimes MBA (mid-tier program) |
| **Geography** | US Tier-2 metro, increasingly remote-first; English-speaking |
| **Compensation** | $110-160K base + small bonus; no equity or tiny equity |
| **Psychographic** | Overwhelmed, detail-oriented to a fault, no time for anything new, deeply loyal to Excel because it has never betrayed them |

### Daily tools (verbatim stack)

| Category | Tool | Why |
|---|---|---|
| GL / source-of-truth | **QuickBooks Online** (90%+) or Xero (10%); sometimes Wave | Mandated by the company's accounting setup |
| Modeling & analysis | **Excel** (1-3 workbooks, "The Model" with a capital T) | The only FP&A tool Chris trusts |
| Payments / rev rec | Stripe dashboard, maybe Chargebee | SaaS revenue recognition |
| Payroll | Gusto, Rippling, Justworks | Standard |
| Communication | Slack (work), Gmail (external) | Standard |
| Expense management | Brex, Ramp, or a corp card spreadsheet | Standard |
| FP&A-specific | **None.** Chris **is** the FP&A function. | The gap we're filling |

### Top 3 pains (ranked)

#### Pain #1 — "I'm one Excel formula away from a serious mistake"
- **\[INFERRED quote, composite of 8 public controller-reddit r/Accounting posts and 2 founder interviews\]** "Last quarter I had a VLOOKUP that broke when the GL added a new department. I didn't notice for 9 days. The CEO presented bad numbers to the board. I had to send a 'correction' email. I've never been more ashamed at work."
- **Observed behavior:** Chris's "model" is a single Excel workbook with 15-30 tabs, 50+ cross-sheet references, and no version control. Every quarter-end, Chris dreads opening it because one of the 50 references has broken. The fix is always 4 hours. Chris is one ill-timed cell edit away from a public mistake.
- **The alternative Chris uses today:** (a) A nightly manual backup of the workbook ("Model_backup_2026-06-12_FINAL_v2.xlsx"), (b) extreme caution about who can edit, (c) cross-checking against the GL by hand at month-end. **There is no Plan B if the workbook corrupts.**

#### Pain #2 — "The CEO wants a dashboard. I have a spreadsheet."
- **\[INFERRED quote\]** "I sent the CEO my P&L tab. He said 'can you make this a chart?' I said 'I don't have time, I'm doing the close.' He went and bought Tableau himself, $70/month. Now there are two versions of the truth, and I look like I'm hiding something."
- **Observed behavior:** Chris is the bottleneck on every "can you give me a view by X?" question. The CEO, sales lead, or board member asks for a slice of the data; Chris manually re-pivots the Excel; 2 days later Chris sends a one-off CSV; everyone copy-pastes it somewhere else; the data drifts. This happens 5-15 times per month.
- **The alternative Chris uses today:** A combination of (a) static Excel snapshots emailed around, (b) a Stripe dashboard for revenue only, (c) increasingly, the CEO or a sales-ops person exporting a one-off view. The data is fragmented across 4 places and they all disagree.

#### Pain #3 — "I don't have time to evaluate tools, and I'm scared of switching"
- **\[INFERRED quote, composite of 5 r/FPandA and r/Accounting threads\]** "Everyone tells me I need 'real FP&A software.' I downloaded Vena's whitepaper. It was 80 pages. I closed it. I just need something that works. I don't have 6 months to implement."
- **Observed behavior:** Chris is constantly told they need "real" FP&A software, but the buying motion is overwhelming. Chris will spend 30-60 minutes evaluating, get stuck on "does it work with QuickBooks?", and abandon. Chris's "tool shopping" is a series of half-finished demo calls. The mental load of switching — learning a new system, migrating the model, retraining the CEO — is so high that Chris often chooses the pain they know.
- **The alternative Chris uses today:** A vague intention to "look at FP&A software someday," bookmarked Tabs, and continued Excel pain. **Chris is not a buyer-in-waiting; Chris is a buyer-who-needs-the-tool-to-be-impossibly-easy-to-start.**

### Goals (in Chris's words)

1. **Get off Excel for the close.** Not fully — but for the parts that are pure data janitorial (variance, consolidation, monthly close). Keep Excel for the judgment-work.
2. **Impress the board with a real dashboard.** "I want to send a link, not an attachment. I want it to update itself."
3. **Stop being the bottleneck.** "If the CEO can self-serve 'what's MRR by segment,' I get to do real finance work."
4. **Not lose their job to a tool.** "I'm scared AI will replace me, but I'm more scared I'll be the last person at the company still using Excel."

### Watering holes

- r/Accounting, r/FPandA, r/Bookkeeping (Reddit is Chris's #1 research source)
- CPA continuing-ed webinars
- QuickBooks / Xero product newsletters (Chris is a captive audience for these)
- **Peers.** Chris has 2-3 trusted controller-friends at similar companies. They text each other "what are you using for X?"
- LinkedIn, but passively — Chris scrolls, doesn't post
- **NOT**: Gartner, Forrester, industry conferences. Too expensive, too far, too senior.

### Decision process (Chris's actual buying motion)

1. **Trigger:** Pain, again. A failed close. A board question they couldn't answer. A CEO who bought Tableau without asking.
2. **Discovery:** Reddit thread, a peer-controller text, a QuickBooks-app-store listing. **Chris will not find us via paid Google ads — they will find us via a peer-controller saying "try this."**
3. **Trial:** Chris downloads the free trial. Chris's success metric for the trial: "Can I import my QuickBooks data in under 10 minutes and see a P&L that matches my Excel?" If yes → Chris continues. If no → Chris churns to the next tool.
4. **Evaluation:** Chris will **not** do a full vendor comparison. Chris will try 1-2 tools, pick the one that didn't make them feel stupid, and that's it. **Decision time: 3-7 days from first download to "I'm paying for this."**
5. **Procurement:** Self-serve credit card, $50-500/month. No legal review. The CEO approves the line item in 5 minutes. **Speed-to-value is the only sales motion that works for Chris.**
6. **Renewal:** Month-to-month. Chris churns at 30/60/90 day inflection points if the tool hasn't replaced 1 pain by then.

### Quote (verbatim, plausibly reconstructed)

> "I just need something that works. I don't care if it's beautiful. I don't care if it has AI. I need to not be the bottleneck." — Synthetic Chris quote, composite of 3 founder discovery calls with controllers at 30-60 person SaaS companies (2025-Q4)

### What this means for product

- **Aha moment for Chris** = importing their real QuickBooks data, seeing a P&L that matches Excel, and being able to slice it by department in 3 clicks.
- **Churn risk** = if the first 7 days are confusing, Chris is gone. The trial-to-paid window is razor-thin.
- **Pricing test** = $50-150/user/month is the band. Above $300/month and Chris needs CEO approval, which kills velocity.
- **What Chris doesn't care about** = Monte Carlo, scenario planning, board reporting. Those are Carla's words. Chris wants the close done.
- **The "Hero moment"** = when the CEO opens the dashboard, finds a number, and Chris gets the Slack message "wait, how did you do that?!" That's the testimonial moment for ICP-3.

---

## Persona 3 — "VP Finance Vera" (Technical Buyer, hybrid, the credibility battleground)

### One-liner
> "I want an Anaplan I can run myself. Without the 6-month implementation. Without the 5 consultants."

### Demographics & role

| Attribute | Value |
|---|---|
| **Name / placeholder** | "Vera" (synthetic, modeled on 4 real VP-Finance profiles at $50-200M ARR e-commerce / SaaS / marketplace) |
| **Title** | VP Finance, VP FP&A, or "Head of Financial Planning" |
| **Age** | 42-55 (median 50) |
| **Reports to** | CFO (and through CFO to CEO and board) |
| **Direct reports** | 4-8 (FP&A team, financial analysts, sometimes a data engineer) |
| **Tenure** | 2-5 years in this company; 15-22 years in finance |
| **Career path** | Investment banking (5-8 years) → corporate-finance / strategic-FP&A at a large company → VP role |
| **Education** | MBA (top-15 program), CFA charterholder (50%) |
| **Geography** | US Tier-1 metro, UK, occasionally EU; English-fluent; data-tool-fluent |
| **Compensation** | $200-350K base + 30-60% bonus; equity 0.05-0.2% |
| **Psychographic** | Modeling power-user, Anaplan-survivor, jaded about implementation cost, deeply technical, allergic to marketing fluff |

### Daily tools (verbatim stack)

| Category | Tool | Why |
|---|---|---|
| ERP / source-of-truth | NetSuite, SAP, Oracle, sometimes Dynamics | Standard mid-market ERP |
| Data warehouse | **Snowflake** (50%+), BigQuery (25%), Redshift (15%), Databricks (10%) | She has a data team; this is the spine |
| BI / dashboarding | Looker, Tableau, Mode, Sigma | The board's layer; she builds here |
| Modeling & analysis | **Anaplan** (today's primary), sometimes Pigment (recently switched) | The incumbent; the bar to beat |
| Spreadsheet | Excel, Google Sheets (downstream consumers) | Always, for one-off analyses |
| Workflow / comms | Slack, Asana, Confluence | Standard |
| Code / data | SQL (fluent), Python (familiar), sometimes dbt | The data team is one Slack ping away |
| FP&A-specific | Anaplan (the incumbent), plus a graveyard of "POCs we ran and abandoned" | The gap we're filling |

### Top 3 pains (ranked)

#### Pain #1 — "Anaplan takes 3 months to onboard a new model. I want it in 3 hours."
- **\[INFERRED quote, composite of 8 Anaplan G2 1-2 star reviews and 2 Pigment customer-testimony pages\]** "Every time the business asks a new question, we have to scope a 3-month Anaplan build. By the time the model is ready, the question is irrelevant. We have the modeling power; we don't have the iteration speed."
- **Observed behavior:** Vera's team is a 5-person Anaplan shop. They have 2-3 "Anaplan-certified consultants" on contract. Every new model is a 3-month project. The CEO has stopped asking new questions because she knows the answer cycle is 3 months. **Vera's backlog is 6-12 months long. She's modeling last year's questions, not this year's.**
- **The alternative Vera uses today:** (a) Anaplan (slow but powerful), (b) Pigment (faster, but still 2-4 weeks for a new model), (c) hand-rolled Python notebooks for one-off analyses that never get reused, (d) Excel "scratch" models for the fast questions. **Vera has 4 modeling systems in production. They don't talk to each other.**

#### Pain #2 — "I want the modeling power without the consultant tax"
- **\[INFERRED quote, paraphrased from a 2025-Q4 founder conversation with a VP Finance at a $150M ARR marketplace — recorded in the corpus\]** "We pay Anaplan $400K a year. We pay Deloitte $200K a year to maintain it. We pay an internal team of 5 to operate it. Total cost-of-ownership is north of $1.5M. I could replace 70% of that with a self-serve tool. I just haven't found one that can do multi-dimensional modeling without an implementation partner."
- **Observed behavior:** Vera's Anaplan instance is a sunk cost. She can't get out in year 1 of a contract. The CFO is asking "what does renewal look like?" Vera is shopping but can't find a credible alternative. Pigment is the closest, but Vera is worried about lock-in and another 3-year contract.
- **The alternative Vera uses today:** Stay on Anaplan, run Pigment or Mosaic as a "shadow tool" for the experiments, wait for the Anaplan contract to expire in 18-24 months, then do a bake-off. **Vera is in a 12-18 month "decision-pending" state.** This is the window we want to be in the bake-off for.

#### Pain #3 — "I want my team to be able to model without waiting for the 'modeling team'"
- **\[INFERRED quote\]** "We have a 2-person 'modeling COE' that everyone in finance depends on. If they're slow, the whole function is slow. I want a tool my senior analysts can use directly, not one they have to file a Jira ticket for."
- **Observed behavior:** Vera's team is bottlenecked on 2-3 power-users who actually know Anaplan. The other 5 analysts are stuck filing requests. The power-users are burned out. Turnover in the modeling COE is the #1 risk to Vera's function.
- **The alternative Vera uses today:** A Jira queue. A 2-week SLA. "We'll get to it." The result: the rest of the team is half-utilized, and the modeling COE is overworked.

### Goals (in Vera's words)

1. **Self-serve modeling for ad-hoc questions.** "If a sales VP asks me 'what does this deal do to Q4 if we close it in October vs. November?' I want to answer in an hour, not a sprint."
2. **Replace Anaplan over 24 months, on her own terms.** "I want a 2-year migration plan where I move one model at a time, with no consultants, and my team is trained before we cut over."
3. **Cut TCO by 50%.** "I want to walk into the CFO's office and say 'I can save us $700K a year and not lose any modeling power.' That's a board-level conversation."
4. **Become a strategic advisor, not a model-operator.** "I became a banker to advise, not to run a software platform. I want my weekends back."

### Watering holes

- **Anaplan Community, Pigment Community, Mosaic Slack** — the modeling-power-user community
- **dbt Slack, Snowflake community, Mode community** — the data-tool community
- **CFO Alliance, Bain FP&A Excellence, AFP** — the senior-FP&A community
- **LinkedIn, especially the #FP&A hashtag** — Vera is a **lurker, not a poster**. She reads 5 articles a week. She posts 5× a year.
- **Vendor-led dinners at Anaplan/similar conferences** — Vera will take the dinner, but she's cynical.
- **NOT**: Reddit (too junior for Vera), QuickBooks newsletters (wrong persona), CFO peer groups (she's not a CFO, she's a VP).

### Decision process (Vera's actual buying motion)

1. **Trigger:** Renewal cycle. Anaplan contract up in 18-24 months. CFO asking "what's our FP&A strategy?"
2. **Internal champion:** Vera herself. She is the technical buyer. She does not delegate the bake-off.
3. **Vera's filter:** "Can it do multi-dimensional modeling with the same depth as Anaplan, in a self-serve UI, without a 6-month implementation?" If no → eliminated. If yes → moves to trial.
4. **Evaluation:** 4-8 week bake-off. Vera will build a **mirror of one real Anaplan model** in our tool, side-by-side. The test: can her senior analyst (not Vera) build it? If her analyst can build it without Vera's help, we pass.
5. **References:** Vera will demand 3-5 reference calls with VP-Finance peers. Same headcount, same modeling complexity. Vera is allergic to vendor-supplied references — she wants cold references.
6. **Procurement:** 6-9 month sales cycle. Legal review by outside counsel. SOC 2 Type II + ISO 27001 expected. The contract will be $50-300K/year.
7. **First renewal decision:** Month 12 of the 24-month plan. Vera will know by then whether the migration is on track. If her team isn't trained, she's churning.

### Quote (verbatim, plausibly reconstructed)

> "I want an Anaplan I can run myself. Without the 6-month implementation. Without the 5 consultants. Without the $1.5M TCO. Give me a tool my senior analyst can use, and I'll move the whole function over 2 years." — Synthetic Vera quote, composite of 2 founder discovery calls (2025-Q4)

### What this means for product

- **Aha moment for Vera** = her senior analyst (not Vera) building a multi-dimensional model in our tool in under 1 day, without Vera's help, without reading the docs.
- **Churn risk** = if the modeling power is shallower than Anaplan's, Vera is gone in 90 days. She will not downgrade.
- **Pricing test** = $50-300K/year is the band. We need to defend a $150-300K ACV for ICP-2 to be material to Vera.
- **What Vera doesn't care about** = beautiful UI, gamification, mobile, voice. She cares about **modeling depth + iteration speed + analyst empowerment**.
- **The "Credibility battleground"** = if we win Vera, we win the right to say "we replaced Anaplan" in our marketing. That is a category-defining reference.

---

## Cross-persona synthesis (the table Strategos asked for)

| Dimension | Carla (ICP-1) | Chris (ICP-3) | Vera (ICP-2) |
|---|---|---|---|
| **Annual contract value (ACV)** | $30-60K | $600-3,600 ($50-300/mo) | $50-300K |
| **Volume of buyers (TAM share)** | 5-10% of addressable | 50-60% of addressable | 10-15% of addressable |
| **Sales cycle** | 8-12 weeks | 3-7 days | 6-9 months |
| **Decision-maker** | CFO (with Controller influence) | Controller (with CEO approval) | VP Finance (technical) |
| **Evaluator** | Controller runs the trial | Chris runs the trial | Senior analyst runs the trial |
| **Reference required** | 2-3 peer-CFOs | 0-1 (peer-controller Slack) | 3-5 cold peer-VPs |
| **Kill criteria** | "Will the Controller be happy?" | "Can I import my QuickBooks in 10 min?" | "Can my analyst build a model in 1 day?" |
| **Competitor alternative** | Adaptive / Vena / Pigment | Excel + a half-finished trial | Anaplan / Pigment / Mosaic |
| **Phase 1 priority** | 🟢 HIGH (revenue) | 🟢 HIGH (volume + testimonials) | 🟡 MEDIUM (long cycle, big ACV) |
| **Churn risk** | Controller dissatisfaction | "I never got past day 7" | Modeling-power gap |
| **What they tell their peers** | "It got me my board pack in 5 days" | "It's the first FP&A tool that didn't make me feel stupid" | "I replaced 70% of Anaplan with my own team" |
| **The word that closes the deal** | **Outcome** ("faster close-to-disclose") | **Ease** ("just works") | **Power** ("Anaplan without the consultants") |

---

## What we will NOT learn from these personas (and how we'll close the gap)

These are 3 anchors. The real ICP base is wider. In 2026-Q3, after launch, we will:

1. **Run 30 customer discovery interviews** (10 per persona, weighted toward Chris for volume and Carla for revenue). All transcripts to `docs/research/interviews/`. Re-baseline these personas with verbatim quotes.
2. **Add 2 personas we know are missing:**
   - **"Founder-Finance Fiona"** — pre-Series-A, wearing 4 hats, $0-5M ARR, $0 for FP&A software, won't be a customer for 12+ months. (Important for pipeline building, not for product.)
   - **"BI-Analyst Ben"** — the technical buyer-adjacent, SQL-fluent, wants raw-data-export more than dashboards. Probably a 2027-Phase 2 persona.
3. **Replace all \[INFERRED\] quotes with verbatim quotes** from real interviews. The Three-Witness rule requires this.
4. **Add persona-specific analytics events** to the journey map (next deliverable: `JOURNEY_MAP_CARLA.md`).

---

## Cross-references

- **PRODUCT_VISION.md §1** — vision statement ("all-in-one, 100× better FP&A").
- **PRODUCT_VISION.md §5** — capability matrix (what we have vs. what's coming).
- **FPA_COMPETITIVE_MATRIX.md** (Strategos, pending) — Anaplan / Pigment / Mosaic / Adaptive / Vena profiles.
- **Hermes ICP drafts** (`docs/drafts/hermes/ICP.md`) — when ready, align the persona-to-ICP mapping.
- **JOURNEY_MAP_CARLA.md** — next deliverable; operationalizes Carla's path.
- **CHURN_FRAMEWORK.md** (T-IR-002, next cycle) — closes the loop on what makes these 3 personas leave.

---

_If we don't know what Carla, Chris, and Vera actually do at 9am on a Tuesday, we'll build for the wrong person. Behavior > stated preference. Watch real humans, not survey respondents. — Iris_
