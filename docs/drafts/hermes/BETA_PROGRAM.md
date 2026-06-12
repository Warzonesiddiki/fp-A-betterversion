<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# FinPlan Pro — Beta Program Design (50-Customer Cohort)

> **Frame for the cycle:** The beta is the **pre-launch customer-development engine**. 50 customers, 90 days, $0 to launch credit. The output is (a) 50 activated users, (b) 25+ case-study-ready testimonials, (c) 1 public launch narrative, (d) a Pricing.md validated at 50-customer scale, (e) a churn framework with 90 days of telemetry. The beta is the **most-leveraged GTM asset** we will produce in 2026 — the case studies from this cohort become the foundation of every sales call, every cold email, every analyst brief, every PR pitch for the next 18 months.

> **Cross-references:**
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Sandra, mid-market CFO) + ICP-2 (Carlos, scrappy SaaS Controller)
> - `docs/drafts/hermes/POSITIONING.md` — value props + anti-positions
> - `docs/drafts/hermes/PRICING.md` — 4 tiers (OSS / Pro / Business / Enterprise)
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — sales playbook for ICP-1
> - `docs/drafts/iris/PERSONAS.md` — **Carla (ICP-1)**, **Chris (ICP-3)**, Vera (ICP-2 hybrid) — persona-validated language
> - `docs/drafts/iris/INTERVIEW_SCRIPT.md` — feeds the §5 feedback sessions
> - **Iris T-IR-003** — Journey Map for Carla (in_progress)
> - **Strategos** — competitive-matrix refresh (Phase 1 closure dates)

---

## §1 — Beta cohort definition (50 customers)

### 1.1 Cohort split (the headline number)

| Cohort | Personas | Tier | # customers | Avg users per customer | Total seats |
|---|---|---|---|---|---|
| **ICP-1: Mid-market CFO** | Carla (Iris §1) | **Business** ($499/user/mo, billed at $0 during beta) | **30** | 8-15 users | 240-450 seats |
| **ICP-2: Scrappy SaaS Controller** | Chris (Iris §2) | **OSS Free + Pro upgrade** ($99/user/mo, $0 during beta) | **20** | 3-8 users | 60-160 seats |
| **TOTAL** |  |  | **50** |  | **300-610 seats** |

**Why this split:** Carla drives 70-80% of the 90-day revenue opportunity (post-beta upgrade to Business at $499 × 12 users × 12 mo = **$71,880 ACV/customer × 30 customers = $2.16M ARR ceiling**). Chris drives the 50% top-of-funnel for next year's Pro tier ($99 × 5 users × 12 = $5,940/customer × 20 = $118K ARR ceiling) and is the **community + word-of-mouth engine** that no marketing dollar can buy.

### 1.2 Vera (ICP-2 hybrid, $50-300K ACV) — NOT in v0.1 beta

Iris's `PERSONAS.md` §3 surfaces a **third persona — Vera (VP Finance, $50-300K ACV, 6-9 month sales cycle)** who is the **credibility battleground** ("replaced 70% of Anaplan with my own team"). **Vera is intentionally excluded from the v0.1 beta** for two reasons:

1. **Sales-cycle mismatch:** Vera's 6-9 month sales cycle is incompatible with a 90-day beta. The case study we'd produce for Vera requires a 12-month "replaced Anaplan" narrative we cannot fabricate in 90 days.
2. **Reference-quality bar:** Vera's reference has to be **an Anaplan displacement**, not a greenfield adoption. The 90-day beta can produce a "switched from Excel" or "switched from Cube" case study, but not a "displaced Anaplan" case study. The latter requires 12+ months of post-migration evidence.

**Recommendation for v0.2 (Q3 2026):** Open a **separate Vera-track beta** of 10 customers with a 12-month runway, $0 in beta credit, and a 50% discount on Year 1 of the eventual Enterprise contract. Strategos to model the Vera-track unit economics.

### 1.3 Cohort constraints (the rules that keep the beta honest)

| Constraint | Value | Rationale |
|---|---|---|
| **Max customers from any one company** | **5** | Single-buyer concentration risk; if 5/50 are from one Fortune 1000, a single churn event kills 10% of the cohort. |
| **Max customers from any one industry vertical** | **15** (30% of cohort) | Avoid vertical monoculture; 17 sector presets, but the beta should sample at least 4 verticals in depth. |
| **Min customers from ICP-2** | **20** | The OSS funnel is the community engine; under-investing in ICP-2 starves the Pro upgrade path. |
| **Min customers from ICP-1** | **30** | The Business tier is the revenue engine; under-investing in ICP-1 starves the public-launch narrative. |
| **Min customers from non-US (UK/CA/EU/ANZ)** | **8** (16% of cohort) | The data-residency wedge for ICP-1 is global; need non-US signal in the case-study portfolio. |
| **Max customers from any one consulting / SI partner** | **5** | Avoid the "5 customers all from the same Deloitte contact" risk; ensures reference diversity. |
| **Min female buyers (self-identification, optional)** | **15** (30% of cohort) | The FP&A buyer is gender-imbalanced industry-wide; we over-index on the under-represented half because (a) it's the right thing to do and (b) Iris's research shows female CFOs are 2-3x more likely to evangelize peer-CFOs. |
| **Min customers with prior FP&A tool experience** | **35** (70% of cohort) | Buyers who have used Anaplan/Adaptive/Pigment/Cube give us **head-to-head comparison data**; first-time buyers give us **first-impression data**. The 70/30 mix is the right ratio. |
| **Min customers on regulated industries (fintech, healthtech, defense)** | **8** (16% of cohort) | The offline-first wedge is the regulated-industries message; we need case studies from at least 3 regulated verticals. |

### 1.4 Industry / vertical distribution (target vs. ceiling)

| Vertical | ICP-1 (Carla) | ICP-2 (Chris) | Total | Ceiling |
|---|---|---|---|---|
| **B2B SaaS** (horizontal SaaS, vertical SaaS) | 12 | 12 | **24** | 30 |
| **E-commerce / DTC** | 6 | 3 | **9** | 15 |
| **Professional services / agencies** | 4 | 2 | **6** | 10 |
| **Fintech / payments** | 3 | 1 | **4** | 8 |
| **Healthtech / digital health** | 2 | 1 | **3** | 5 |
| **Marketplace / gig economy** | 2 | 1 | **3** | 5 |
| **Other (edtech, climate, media, etc.)** | 1 | 0 | **1** | 5 |
| **TOTAL** | **30** | **20** | **50** |  |

### 1.5 Geography distribution (target)

| Region | ICP-1 (Carla) | ICP-2 (Chris) | Total | Rationale |
|---|---|---|---|---|
| **US (CA, NY, TX, MA, WA, IL)** | 18 | 12 | **30** | The core ICP-1 + ICP-2 belt |
| **US (other)** | 4 | 3 | **7** | Geographic diversity within US |
| **UK** | 3 | 2 | **5** | FCA-regulated buyers = offline-first wedge |
| **Canada** | 2 | 1 | **3** | Similar regulatory profile to US, easier procurement |
| **EU (DE, FR, NL)** | 2 | 1 | **3** | GDPR data-residency wedge |
| **AU / NZ** | 1 | 1 | **2** | ANZ SaaS-funder belt |

### 1.6 Company size distribution (target)

| Size | ICP-1 (Carla) | ICP-2 (Chris) |
|---|---|---|
| **10-25 FTE** | 0 | 8 |
| **25-50 FTE** | 0 | 12 |
| **50-100 FTE** | 6 | 0 |
| **100-250 FTE** | 14 | 0 |
| **250-500 FTE** | 8 | 0 |
| **500-1,000 FTE** (above ICP-1, but viable) | 2 | 0 |

### 1.7 Channel / sourcing (where the 50 come from)

| Channel | ICP-1 (Carla) target | ICP-2 (Chris) target | Notes |
|---|---|---|---|
| **Founder warm outreach** (founder's network) | 12 | 4 | Highest-conversion channel; ICP-1 buyers respond to founder-to-founder outreach at 15-25% rate. |
| **Cold outbound (T-HER-003 sequence)** | 8 | 8 | The cold-outbound sequence ships Day 0 of beta; convert at 1-2%. |
| **Inbound (HN / Twitter / Indie Hackers)** | 2 | 4 | Long-tail; lower volume but high-quality. |
| **Partner referrals** (Deloitte, Slalom, etc.) | 4 | 0 | Channel partner intros are slow but high-ICP-fit. |
| **Beta waitlist** (the in-product / landing-page CTA) | 4 | 4 | Self-selected; high intent. |
| **TOTAL** | **30** | **20** | |

---

## §2 — Scoring rubric (composite 0-10)

### 2.1 The two scores

| Dimension | 0 (Pass) | 5 (Strong invite) |
|---|---|---|
| **ICP fit (0-5)** — does the buyer match the persona? | Wrong industry, wrong size, wrong title, no budget | Clean persona match; CFO at $30-80M ARR SaaS, 8-15 users, board pack pain, $20-100K budget |
| **Willingness to evangelize (0-5)** — will they tell the story? | "I'll think about it" | "I will speak at your launch webinar, write a LinkedIn post, and give you 3 peer references" |

### 2.2 ICP fit scoring (0-5, granular)

| Sub-dimension | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **Industry** | Outside our 17 verticals | Adjacent | 1 of our verticals | Direct vertical match | — | — |
| **Company size** | < 5 FTE or > 5,000 FTE | 5-10 / 1,000-5,000 | 10-25 / 500-1,000 | 25-50 / 250-500 (right at boundary) | 50-250 (ICP-1 sweet spot) | 50-250 + high-growth |
| **Role / title** | No finance buyer | Analyst / Jr. analyst | Controller (in ICP-1) | CFO / VP Finance (in ICP-1) | CFO with board-pack pain | CFO with named trigger event (Series B, missed forecast, etc.) |
| **Budget** | "$0 for FP&A" | "$500-$2K/yr" | "$2K-$10K/yr" | "$10K-$30K/yr" | "$30K-$100K/yr" | "$100K+/yr" |
| **Pain signal** | No pain expressed | "We use Excel and it's fine" | "Excel is painful" | "Excel is painful and we're shopping" | "Excel is blocking a board-pack commitment" | "I just missed a board commitment because of the model" |

### 2.3 Willingness-to-evangelize scoring (0-5, granular)

| Sub-dimension | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **Public presence** | Anonymous, no LinkedIn | LinkedIn exists, < 100 connections | 100-500 connections, posts < 1×/quarter | 500-2,000 connections, posts ~1×/month | 2,000+ connections, posts ~1×/week, peer-CFO references visible | 2,000+ + active in CFO peer community (CFO Alliance, etc.) |
| **Peer reference network** | "I don't know other CFOs" | 1-2 peer-CFOs in their network | 3-5 peer-CFOs | 6-10 peer-CFOs in active Slack/community | 10+ peer-CFOs in a curated peer group | Runs a CFO peer group themselves |
| **Past advocacy** | Has never been a public reference | Was a reference once, was a bad experience | Was a reference once, neutral | Was a reference, positive | Regularly gives vendor references | Has spoken at a vendor conference, written a case study |
| **Trigger alignment** | No trigger | Trigger is "exploring tools" (low urgency) | Trigger is "actively shopping" | Trigger is "evaluating 2-3 vendors" | Trigger is "I will buy in the next 90 days" | Trigger is "I need this for a board meeting / fundraise / missed forecast" |
| **Beta enthusiasm** | "I'll try it if I have time" | "I'll try it on the weekend" | "I'll install it this week" | "I have a 30-min slot Tuesday to onboard" | "I will personally champion this internally" | "I will get my CEO and my peer-CFOs in the beta" |

### 2.4 Decision rule

| Composite score | Decision | Action |
|---|---|---|
| **9-10** | **Definite invite** | Personal email from founder; offer to fly in for an onboarding coffee |
| **7-8** | **Invite** | Standard invite email; offer 30-min onboarding call |
| **5-6** | **Waitlist** | Auto-add to waitlist; re-evaluate in 30 days as more slots open |
| **3-4** | **Pass (with grace)** | Polite "not a fit right now" + add to nurture list for Q4 2026 launch |
| **0-2** | **Pass** | No reply needed; data goes into the "anti-persona" feedback loop |

### 2.5 Worked examples

**Example 1 — Strong invite (composite 9):**
- Carla lookalike: CFO at $40M ARR vertical-SaaS, 180 FTE, 3-person FP&A team, currently on Anaplan at $280K/yr, missed Q2 board forecast, LinkedIn 1,800 connections, posts ~1×/month, active in CFO Alliance, has been a vendor reference 2× before.
- ICP fit: 5 (industry=direct, size=sweet spot, role=CFO+trigger, budget=$30-100K, pain=missed forecast)
- Willingness to evangelize: 4 (public presence=4, network=5, past advocacy=4, trigger=5, enthusiasm=4 → average = 4.4 → round to 4)
- Composite: **9** → Definite invite

**Example 2 — Invite (composite 7):**
- Chris lookalike: Controller at $4M ARR B2B SaaS, 22 FTE, no team, all-Excel, no prior FP&A tool, Reddit-active, 150 LinkedIn connections.
- ICP fit: 3 (industry=direct, size=ICP-2 small, role=Controller, budget=$500-$2K, pain=Excel pain)
- Willingness to evangelize: 4 (presence=2, network=3, past=3, trigger=4, enthusiasm=5 → avg=3.4 → round to 3; but the 5 on enthusiasm lifts to 4)
- Composite: **7** → Invite

**Example 3 — Pass (composite 3):**
- Pre-Series-A founder, $400K ARR, 4 FTE, no finance hire, no budget, no pain signal beyond "I should probably get an FP&A tool eventually."
- ICP fit: 1, Willingness: 2 → Composite **3** → Pass (with grace, add to nurture)

---

## §3 — Success criteria (3 per customer + bonus)

### 3.1 The 3 mandatory success criteria

Every beta customer must hit **all 3** to graduate to "validated case study" status:

| # | Success criterion | Definition | Measurement | Time window |
|---|---|---|---|---|
| **1** | **Activated within 7 days** | Signed NDA, installed FinPlan Pro, logged in, built first model (any model — even a sandbox) | `analytics.firstModelBuiltAt - analytics.installAt ≤ 7 days` | D-0 → D+7 |
| **2** | **Ran 1 scenario in FinPlan Pro within 30 days** | Used the scenario engine (not just the dashboard) on real data — not the sample dataset | `analytics.scenarioRuns ≥ 1` AND `analytics.scenarioData.isSample = false` | D-0 → D+30 |
| **3** | **Gave 1 feedback session (30 min, recorded, with consent)** | 30-min recorded Zoom call with Hermes/Iris/Apollo; transcript to `docs/research/interviews/`; consent form signed | `interviews.completed = true` AND `interviews.recordingStored = true` | D+14 → D+45 |

### 3.2 The 3 bonus success criteria (used for case-study tiering)

| # | Bonus criterion | Definition | Case-study tier upgrade |
|---|---|---|---|
| **B1** | **Brought 1 peer to a referral call** | Customer referred a peer (CFO or Controller) who also took a 30-min call with the team | "Gold" case study |
| **B2** | **Public post (LinkedIn, Twitter, or blog)** | Customer wrote a public post naming FinPlan Pro + their outcome | "Platinum" case study |
| **B3** | **Speaking slot at the launch webinar** | Customer commits to a 10-min speaking slot at the public-launch webinar | "Diamond" case study + launch-narrative anchor |

### 3.3 Tier mapping (drives the case-study publishing order)

| Tier | Mandatory | Bonus | Publish order | Asset |
|---|---|---|---|---|
| **Diamond** | 3/3 | 3/3 (B1+B2+B3) | D+90 (launch day) | Headline launch case study + webinar speaker |
| **Platinum** | 3/3 | 2/3 (B1+B2) | D+90 → D+120 | Marketing-site "Customer Stories" carousel |
| **Gold** | 3/3 | 1/3 (B1) | D+120 → D+180 | Sales-deck case-study slides + cold-email reference block |
| **Silver** | 3/3 | 0/3 | D+180+ | Sales-team reference list (anonymized if needed) |
| **Non-completer** | < 3/3 | n/a | Internal only; do not publish | Lessons-learned doc; churn framework input |

### 3.4 The 50-customer success math

If the beta hits industry benchmarks, the cohort yields:

- **45/50 (90%)** complete all 3 mandatory criteria
- **30/50 (60%)** complete at least 1 bonus
- **10-15/50 (20-30%)** complete all 3 bonus
- **3-5/50 (6-10%)** complete all 3 mandatory + 3 bonus = Diamond tier

This produces **45 case studies** in the asset library — 5 Diamond, 10 Platinum, 15 Gold, 15 Silver — which is the case-study portfolio that carries the next 18 months of sales and marketing.

### 3.5 The "what if they don't hit 3/3" contingency

If a customer is on track to miss any of the 3, the **Customer Success Lead** (CSL, see §5.4) intervenes at:

- **D+3** (4 days after install, no login) → Slack DM + email
- **D+5** (still no first model) → 15-min Zoom offer
- **D+10** (still no first model) → Founder DM
- **D+14** (no scenario) → Re-onboard with a guided 30-min walkthrough
- **D+25** (no scenario) → Schedule a "what's blocking you?" call; offer to extend beta or downgrade
- **D+45** (no feedback session) → Last-call; reschedule or graduate without

---

## §4 — NDA template (1-page mutual, 12-month, non-redistribution)

See companion file: `docs/drafts/hermes/BETA_NDA_TEMPLATE.md` (copy-paste ready, ~50L, legal-review-ready).

Key parameters:
- **Mutual NDA** — both parties protect each other's confidential information
- **12-month term** — confidentiality obligations survive termination for 12 months
- **Non-redistribution** — pre-release code, designs, financials, and customer lists cannot be redistributed outside the customer's organization
- **Beta data ownership** — the customer owns their data; FinPlan Pro may use anonymized, aggregated patterns (e.g., "the median ICP-1 customer runs 12 scenarios per week") for product development
- **No warranty** — beta software is provided "as-is," no SLA, no uptime commitment
- **Mutual indemnification** — capped at $5,000 (the $0-pricing-of-the-beta frames the liability ceiling)

---

## §5 — Feedback loop structure (the 4-cadence system)

### 5.1 Weekly office hours (every Wednesday 4-5pm PT, Zoom, recorded)

- **Who attends:** All 50 beta customers (optional); the founding team (Hermes, Iris, Apollo, Strategos, Mnemosyne) is on the call
- **Format:** 30-min open Q&A + 20-min "this week's deep dive" (a customer presents a use case, the team responds) + 10-min "what we shipped this week"
- **Recording:** Auto-uploaded to `docs/research/office-hours/` for any customer who missed
- **Output:** Every customer question is logged in `docs/drafts/hermes/feedback-log.md` with a 24-hour response SLA
- **Capacity:** Max 50 attendees (one per beta seat), so the room is intimate enough to ask a real question

### 5.2 Monthly NPS survey (1 question, 1-10, open comment, day-of-month = +30, +60, +90)

- **Question:** "On a scale of 0-10, how likely are you to recommend FinPlan Pro to a peer CFO / Controller?" (verbatim NPS framing)
- **Open comment:** "What's the #1 thing we could do to make this a 10?"
- **Cadence:** Day +30, +60, +90 (3 surveys per customer, ~150 total responses expected)
- **Target NPS:** **≥ 50** at D+90 (the SaaS category benchmark for "promoters"; below 40 is a churn warning)
- **Reporting:** Monthly NPS report to the founding team + Strategos; per-customer NPS trajectory in the CRM

### 5.3 Quarterly roadmap review (3 customers × 90 min, recorded, D+60, D+90, +ongoing)

- **Who attends:** 3 selected customers (rotated to give 15 different customers a "voice in the roadmap" over 90 days) + founding team
- **Format:** Walk through the next 90 days of planned features; customers react, prioritize, and flag what they'd be willing to pay extra for
- **Output:** A 1-page "roadmap validation" doc per session, archived to `docs/research/roadmap-reviews/`
- **Why quarterly, not weekly:** Customers have 30-90 min/week of attention for us; the roadmap review is the deep-focus time, the office hours are the tactical time

### 5.4 Shared Slack channel (#beta-finplan, 50 customers + team, async)

- **Channel:** `fpa-beta.slack.com` (Slack Connect with the customer's own Slack workspace, not our internal Slack)
- **Participants:** 50 customers (1-2 seats each) + founding team
- **Cadence:** Async; Hermes / Apollo / Iris commit to a 4-hour response window during business hours PT
- **Content:** Bug reports, feature requests, "how do I…" questions, "this just worked amazingly" testimonials
- **Output:** Every message is tagged (bug, feature, question, praise) and routed to the right owner
- **Capacity:** 50 customers × 2 seats = 100 participants, which fits within Slack Connect's per-channel limits

### 5.5 The 4-cadence summary

| Cadence | Frequency | Format | Who | Output |
|---|---|---|---|---|
| **Office hours** | Weekly (Wed 4pm PT) | Zoom, 60 min | All 50 + team | `feedback-log.md` (24-hr SLA) |
| **NPS survey** | Monthly (D+30, +60, +90) | 1-question email | Per customer | NPS report, per-customer trajectory |
| **Roadmap review** | Quarterly (D+60, D+90, ongoing) | Zoom, 90 min | 3 customers + team | `roadmap-reviews/YYYY-MM-DD.md` |
| **Slack** | Async, daily | Slack Connect | All 50 + team | Tagged, routed, response-windowed |

The four cadences cover **synchronous real-time, synchronous scheduled, async quantitative, async qualitative** — every customer has at least 2 channels they're active in within 14 days of install.

---

## §6 — Launch sequence (D-7 → D+90, the operational playbook)

### 6.1 The timeline (one-glance)

```
D-7   ┃ INVITE: NDA + 30-min onboarding call booking
D-3   ┃ REMINDER: 24-hour nudge for non-responders
D-0   ┃ ONBOARDING: 30-min Zoom + install + first model
D+1   ┃ WELCOME: Slack invite + office hours invite + first scenario prompt
D+3   ┃ CHECK-IN: Slack DM if no install
D+5   ┃ ESCALATE: founder DM if no install
D+7   ┃ ACTIVATION GATE: must hit "first model" by D+7
D+14  ┃ FEEDBACK SESSION BOOKING: 30-min slot sent
D+21  ┃ SCENARIO GATE: must hit 1 scenario by D+30
D+30  ┃ NPS #1 + FEEDBACK SESSION: 30-min recorded call
D+45  ┃ DEADLINE: feedback session must be complete
D+60  ┃ NPS #2 + CASE STUDY INTERVIEW BOOKING
D+75  ┃ CASE STUDY INTERVIEW: 60-min recorded call (longer than feedback)
D+90  ┃ NPS #3 + PUBLIC CASE STUDY LAUNCH + UPGRADE OFFER
D+120 ┃ GRADUATION: 100% of mandatory + bonus criteria met → case study tier
```

### 6.2 The day-by-day operational detail

#### D-7 — INVITE (founder-signed, warm)

- **Email from:** Founder / CEO (not a no-reply@ address, not an AE)
- **Subject:** "{{first_name}}, want to beta FinPlan Pro with us?"
- **Body (3 paragraphs):** Why we built it (your pain) → what we're inviting you to (50-customer beta, $0 during beta) → what we ask in return (3 success criteria + feedback)
- **CTA:** "Pick a 30-min onboarding slot: [calendar link]" + "Sign the mutual NDA: [DocuSign link]"
- **Volume:** All 50 invites go out D-7, single batch
- **Response SLA:** 48 hours; non-responders get the D-3 reminder

#### D-3 — REMINDER (24-hour nudge)

- **Email from:** Founder / CEO
- **Subject:** "{{first_name}}, last call for the FinPlan Pro beta"
- **Body (2 sentences):** "We're closing the cohort Friday. Want to join?" + the calendar link again
- **Volume:** Only to non-responders from D-7

#### D-0 — ONBOARDING (30-min Zoom, recorded with consent)

- **Attendees:** Customer + founder + Hermes (or designated CSL)
- **Agenda:**
  - 0-5 min: intros + "what's your #1 pain we're solving?"
  - 5-15 min: live install + first model
  - 15-25 min: tour of the sector preset + AI Copilot demo
  - 25-30 min: "what would make this a 10 for you?" + NDA-confirmed consent to record
- **Output:** Onboarding notes to `docs/research/onboarding/<customer>.md`; the customer is now in `#beta-finplan` Slack
- **Volume:** 3-5 onboardings per day for the first 17 days (50 customers / 17 days = 2.9/day, with buffer)

#### D+1 — WELCOME PACKET (Slack + email)

- **Slack invite** to `#beta-finplan` with a 2-min welcome video
- **Office hours calendar** (every Wed 4pm PT)
- **First scenario prompt** tailored to the customer's persona:
  - Carla (ICP-1): "Run a 3-scenario board pack for your next board meeting — base, downside, recession. Time yourself."
  - Chris (ICP-2): "Build your Monday-morning burn/runway report. Time yourself."

#### D+3 / D+5 / D+7 — ACTIVATION ESCALATION (only for non-activated customers)

- See §3.5 contingency ladder

#### D+14 — FEEDBACK SESSION BOOKING

- **Email:** "Pick a 30-min slot in the next 30 days for our first feedback session: [calendar]"
- **Pre-work:** Send the customer 3 questions to think about (drawn from `INTERVIEW_SCRIPT.md`)

#### D+30 — NPS #1 + FEEDBACK SESSION (DUAL MILESTONE)

- **NPS survey** sent at 9am PT (the "D+30" date)
- **Feedback session** scheduled within ±5 days of the NPS survey
- **Output:** NPS data in CRM; interview transcript to `docs/research/interviews/`

#### D+60 — NPS #2 + CASE STUDY INTERVIEW BOOKING

- **NPS survey** sent
- **Case study interview** offered to customers with NPS ≥ 8 (the "promoters")
- **Pre-work:** 5 questions on the customer's "before FinPlan Pro" vs "after" narrative

#### D+75 — CASE STUDY INTERVIEW (60-min recorded Zoom)

- **Format:** Founder-led, with Hermes / Iris present
- **Output:** Verbatim transcript + 1-page narrative pull-quote draft → customer review → publish-ready case study

#### D+90 — PUBLIC LAUNCH + UPGRADE OFFER (the graduation event)

- **Public launch:**
  - 3-5 Diamond-tier customers speak at the launch webinar
  - Case studies published to `marketing-site/customers/`
  - Press release to the founding team's network
  - LinkedIn / Twitter announcement with customer quotes
- **Upgrade offer (for ICP-1 Carla):**
  - Business tier at $499/user/mo with a **30-day money-back guarantee** (the risk-reversal from the cold-email sequence)
  - 50% discount on Year 1 if signed within 30 days of the public launch
  - 90-day "price-lock" guarantee: the Year 1 price holds for 90 days even if list price goes up
- **Upgrade offer (for ICP-2 Chris):**
  - Pro tier at $99/user/mo (or $83/user/mo annual, 2 months free) with the same 30-day money-back guarantee
  - OSS-to-Pro upgrade path is a 1-click in-app upgrade
  - 90-day price-lock

#### D+120 — GRADUATION (the asset handoff)

- All 50 customers are graded Diamond / Platinum / Gold / Silver / Non-completer
- Case studies published in tier order
- Slack channel stays open indefinitely (the alumni network)
- NPS report finalized; churn framework updated with 90-day telemetry
- Handoff: from "beta" mode to "customer" mode; the 50 customers become the founding customer base

### 6.3 The 90-day operational budget

| Resource | Time commitment | Owner |
|---|---|---|
| **Founder / CEO** | ~5 hrs/week (1:1 onboarding, escalation DMs, launch webinar) | Founder |
| **Hermes (CSL)** | ~10 hrs/week (50 customers × 5 min/week = 4 hrs; + office hours 1 hr; + case-study interviews 2 hrs; + admin 3 hrs) | Hermes |
| **Iris (research)** | ~4 hrs/week (interview synthesis, persona validation, journey-map updates) | Iris |
| **Apollo (engineering liaison)** | ~4 hrs/week (bug triage, Slack engineering response, weekly office hours attendance) | Apollo |
| **Strategos (competitive monitoring)** | ~2 hrs/week (NPS benchmarking, churn signal analysis) | Strategos |
| **Mnemosyne (docs)** | ~2 hrs/week (docs feedback synthesis, FAQ updates) | Mnemosyne |

**Total team time:** ~27 hrs/week across 6 Muses for the 90-day beta. This is the operational cost of the program; the **output** is the 50-customer case-study portfolio that drives the next 18 months of GTM.

---

## §7 — Open questions for the Leader / Strategos (post-launch iteration)

1. **Should the Vera-track beta (Iris's persona 3) launch in parallel, or wait for the Carla/Chris beta to graduate?** Strategos to model the Vera-track unit economics; the 12-month timeline suggests a Q3 2026 launch is realistic.
2. **Should the 50-customer cohort include 5-10 "shadow customers" — prospects we invite but don't publicly count?** Shadow customers give us a "second cohort" for A/B testing the launch messaging before the public cohort sees it.
3. **Should the upgrade offer (D+90) include a 90-day money-back guarantee, or a 30-day?** The 30-day is the SaaS standard; the 90-day is a bolder risk-reversal. Hermes recommends 30-day for ICP-1 (the buyers are sophisticated and don't need longer), 30-day for ICP-2 (Carlos won't churn at day 60 anyway if he's not churning at day 7).
4. **Should the case-study publishing order be strictly Diamond-first, or weighted by industry diversity?** Diamond from B2B SaaS + Platinum from fintech + Gold from healthtech is more narratively diverse than 5 Diamonds all from B2B SaaS. Strategos to model.
5. **Should we open the beta to 100 customers instead of 50, accepting lower per-customer attention?** The 50-customer cap is a quality choice; doubling to 100 would dilute the office-hours intimacy. Hermes recommends holding at 50 for v0.1 and doubling only after the operational playbook is proven.

---

_λαὸς πρῶτος — the first people. The beta is the first 50 believers; the launch is the first 5,000. Hermes writes the invitation; the cohort writes the company. — Hermes_
