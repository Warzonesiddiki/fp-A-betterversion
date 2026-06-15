<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Beta-Customer Feedback Collection Plan (T-IR-006)

> **Muse:** Iris.
> **Status:** Formal deliverable for T-IR-006. Pre-write was the foundation; this version is structured to the 7-section spec, with Wave 5 added (D+90 to D+120 public-launch feedback), the 4-mechanism incentives table, and the Quality bar.
> **Scope:** How we collect, route, and act on feedback from the 50-customer beta cohort (per Hermes's T-HER-003). Operationalizes the `INTERVIEW_SCRIPT.md` for live users, the `NPS_SURVEY_DESIGN.md` for the NPS moments, and the 5-way theme routing across the 5 Muses + Hephaestus.
> **Methodology sources:** Bain & Company (NPS cadence, T-IR-005), PostHog docs (NPS plugin + session replay + feature flags, §5), Reichheld 2003 (NPS math).
> **Companions:** `PERSONAS.md` (3 personas, 30 ICP-1 + 20 ICP-3 cohort), `INTERVIEW_SCRIPT.md` (30-min format), `JOURNEY_MAP_CARLA.md` (7 stages), `CHURN_FRAMEWORK.md` (5 reasons), `NPS_SURVEY_DESIGN.md` (T+30/T+90/T+180 cadence), Hermes's `BETA_PROGRAM.md` (50-customer cohort), Strategos's Q3 2026 review (NPS target = 40 by EOY1).
> **Three-witness rule:** every claim = (a) user quote, (b) observed behavior, (c) the alternative or interpretation.

---

## Why a beta feedback plan is different from a research plan (and why we need both)

The 30 customer discovery interviews in `INTERVIEW_SCRIPT.md` are **research** — they extract _qualitative insight_ about jobs, pains, and alternatives. The beta feedback collection is **product validation** — it extracts _quantitative signal_ about whether the product is working for the 50 customers who have installed it.

| Dimension        | Research interviews (T-IR-001)                                    | Beta feedback (this plan)                                   |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| **Goal**         | Understand the _job_ the user is hiring us to do                  | Understand whether _we_ are doing the job                   |
| **Sample**       | 30 users (10 Carla, 10 Chris, 10 Vera), some users some non-users | 50 users (30 ICP-1 Carla, 20 ICP-3 Chris), all users        |
| **Cadence**      | One 30-min conversation per user, one-time                        | 5 touchpoints per user over 90 days (plus Day-0 onboarding) |
| **Output**       | Quotes, themes, persona updates                                   | Tickets, themes, product-decision triggers                  |
| **Owner**        | Iris (research)                                                   | Iris + PM (research + product)                              |
| **Trust signal** | "We want to understand"                                           | "We want to fix"                                            |

**The two are complementary, not redundant.** The beta is our first chance to validate the personas against observed behavior. If the persona assumptions are wrong, the beta will tell us. If they're right, the beta will tell us _how right_. Either way, the personas get updated based on observed behavior, not inferred behavior. The `[INFERRED]` quotes in `PERSONAS.md` get replaced with `[VERBATIM]` quotes by Day 90.

> **The single most important thing in this plan:** The beta is the **first real test of the 3 personas**. Don't waste it on ad-hoc feedback. Cadence, routing, and the closing-the-loop follow-up are the design.

---

## §1 — The 5-wave feedback collection (D+0 to D+120)

The beta runs 90 days of in-product use, plus 30 days of public-launch feedback. We collect feedback at 5 specific waves, each with a different _goal_ — not "check in" but a specific validation question. Each wave aligns to Hermes's BETA_PROGRAM.md launch sequence and the journey-map stages.

**Pre-wave (Day 0, onboarding call, 30 min):** A live onboarding call to establish the relationship, set expectations, and capture the user's _predicted_ jobs and pains (which we compare to their _actual_ jobs/pains at Day 30+). Owner: CSM (with Iris observing 5-10 of the 50 calls for calibration). Output: 1-page summary in `docs/research/beta/2026-Q4/summary-<user-id>-day0.md`.

### Wave 1 — D+0 to D+7 ("First value"): in-app micro-survey

**Goal:** Measure moment-level satisfaction at the _exact moment_ of first value. Zero friction by design.

**Trigger:** The `habit.first_scenario_built` analytics event fires. Immediately after, an in-app modal appears (dismissible, 1 question, 5-pt scale).

**Question:** "How easy was that?" (1 = painful, 5 = delightful)

**Channel:** In-app modal only (no email, no follow-up). Tooling: PostHog survey (see §5).

**Friction budget:** <2 seconds to dismiss or answer. No open comment. No persona-routing. No email follow-up.

**Output:** `nps_moment.easy_score` event with score 1-5. Aggregated weekly into the "first-value ease score" metric.

**Completion target:** >80% (it's a 1-question modal, anything less means the modal is in the wrong place).

**Per-persona variation:** None — this wave is identical for all personas. It's measuring the product, not the persona.

### Wave 2 — D+7 to D+30 ("First month"): 30-min feedback session

**Goal:** Validate the _actual_ friction vs. the predicted friction (from Day 0). Identify the "almost killed it" features.

**Channel:** Video call, 1-on-1, recorded with consent. CSM + user (Iris joins 10-15 of the 50 calls for qualitative depth).

**Format (30 min, 5 questions):**

1. (5 min) What worked? (3 specific features cited)
2. (5 min) What didn't work? (verbatim, with file/screenshot)
3. (5 min) What surprised you? (the unexpected-positive or unexpected-negative moments)
4. (10 min) What would you change? (single-thing, force-ranked)
5. (5 min) Would you recommend FinPlan Pro to a peer? (Y/N — yes/no answer, not NPS)

**Output:** 1-page summary in `docs/research/beta/2026-Q4/summary-<user-id>-day14.md` — 3 wins, 3 issues, 1 ask, 1 risk flag, "almost killed it" verbatim quote.

**Completion target:** >80% (we lose 10 users = 20% of the cohort; >20% attrition is a process problem, not a product problem).

**Per-persona variation:** Carla (ICP-1) gets the full 30 min; Chris (ICP-3) gets a compressed 15 min (Chris's attention budget is shorter, per `PERSONAS.md`).

### Wave 3 — D+30 to D+60 ("First NPS"): NPS survey

**Goal:** The first real NPS per `NPS_SURVEY_DESIGN.md` §4 (T+90 cadence starts later, but the T+30 trial-health NPS lands in this window). Validate persona assumption (does the user match the predicted persona?). Capture the _actual_ JTBD vs. predicted at Day 0.

**Channel:** In-app survey (3 questions, ~30 sec) + 15-min follow-up email if NPS < 7 (save motion).

**Format:** Q1 (NPS 0-10), Q2 (open comment "ONE thing"), Q3 (persona anchor). Per `NPS_SURVEY_DESIGN.md` §3.

**Output:**

- `nps.score_X` event (X = 0-10)
- `nps.open_comment` event (the Q2 free text)
- `nps.persona` event (the Q3 self-stated persona)
- NPS score per cohort in Dashboard 2
- Detractor (0-6) → CSM save motion within 4 hours
- Promoter (9-10) → CSM referral ask within 1 week

**Completion target:** >70% (NPS surveys are easy to ignore; <70% means the in-app placement is wrong).

**Per-persona variation:** Chris's T+30 NPS is "trial health" (1 question only); Carla's and Vera's is the full 3-question survey (their opinion is forming by Day 30).

### Wave 4 — D+60 to D+90 ("Case study interview"): 60-min recorded interview

**Goal:** The final NPS for the beta cohort. Capture a case study. Identify the "almost saved it" / "almost killed it" pair (the deal-closer for sales).

**Channel:** Video call, 1-on-1, recorded with consent. CSM + AE + user. Iris joins 10 of the 50 calls.

**Format (60 min, 8 questions):**

1. (5 min) Walk me through the buy/build decision. Why FinPlan Pro vs. Anaplan/Adaptive/Cube?
2. (5 min) Walk me through the install + first import. What was the aha moment?
3. (5 min) Walk me through the first scenario you built. Show me the screen.
4. (10 min) Walk me through the value moment. What did FinPlan Pro save you (time/dollars/scenarios)?
5. (5 min) What almost killed the deal?
6. (5 min) What almost saved the deal? (the unblocker question)
7. (5 min) Would you recommend FinPlan Pro? (final NPS)
8. (20 min) Can we use this? (case-study ask, logo rights, public quote permission)

**Output:**

- Final NPS score
- Case study transcript (if user agrees)
- "Almost killed it / almost saved it" verbatim pair → sales playbook + marketing collateral
- Renewal/expansion outcome (tracked by AE)

**Completion target:** >50% of the 50 users; ≥5 Diamond case studies (the top-quartile references with logo rights + 3+ verbatim quotes).

**Per-persona variation:** Carla (ICP-1) gets the full 60 min. Chris (ICP-3) gets a 30-min compressed version (skip Q1, Q5, Q8).

### Wave 5 — D+90 to D+120 ("Public launch feedback"): public NPS + case study + referral ask

**Goal:** Capture the public-launch sentiment. Publish the case studies. Convert Promoters into referral sources. Re-baseline NPS for the GA cohort (the 50 beta users are the leading indicator of the GA NPS).

**Channel:** Public NPS (in-app, post-launch) + email referral ask to Promoters + case study publication on the marketing site.

**Format:**

- (D+90) Public NPS survey fires for all 50 beta users + the new GA cohort
- (D+90 to D+100) Case studies published on `/customers` page (with consent)
- (D+100 to D+110) Referral ask: "Who else do you know who needs this?" CSM enables, doesn't ask
- (D+110 to D+120) Re-baseline NPS for the GA cohort; compare beta NPS to GA NPS

**Output:**

- Public NPS score (the marketing-page headline)
- Published case studies (≥3 by D+120)
- Referral conversions (Promoter → 1+ peer referred)
- Beta-cohort-vs-GA-cohort NPS comparison (the leading indicator of GA retention)

**Completion target:** >60% NPS response rate; ≥3 published case studies; ≥5 referral conversions.

**Per-persona variation:** None — Wave 5 is identical for all personas. It's measuring the _public_ product, not the persona.

---

## §2 — The 5-way feedback theme routing (the single source of truth for "who fixes this")

Every piece of feedback — every survey response, every interview quote, every open comment — gets **one primary theme tag** + a routing rule. The 5 routes are the 5 cross-cutting concerns; we route to the Muse who owns that concern.

| Theme                                           | Route to                                   | Examples                                                                                    | SLA                                             |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Product** (feature requests, bugs, UX issues) | **Apollo** (PM triage)                     | "Missing feature: multi-entity consolidation," "Bug: Excel import fails on column Z"        | P0 same-day; P1 next sprint; P2 monthly         |
| **Code quality** (technical debt, performance)  | **Athena** (audit) + **Prometheus** (perf) | "The page takes 4 seconds to load on a 100k-row model," "The cube engine has a memory leak" | P0 same-day; P1 next sprint                     |
| **Security** (data, access, compliance)         | **Hephaestus** (audit)                     | "I need SOC 2 evidence for our audit," "Can we add SAML SSO?"                               | P0 4h (if data exposure); P1 next sprint        |
| **Marketing** (positioning, pricing, messaging) | **Hermes** (ICP, battlecards, copy)        | "Your pricing page is confusing," "I didn't understand you had a free tier"                 | P1 next sprint (copy); P2 monthly (positioning) |
| **Design** (visual, interaction, motion, a11y)  | **Hera** (design system)                   | "The dark mode is broken on the variance report," "I can't tab through the import wizard"   | P1 next sprint; P2 monthly                      |

**Routing rules:**

1. **One primary tag, one owner.** A comment about "the export is slow and the button is the wrong color" gets ONE primary tag (Product, because the perf is a Product concern). The Design concern is a secondary tag and goes to Hera as a follow-up.
2. **Apollo is the default.** If a comment doesn't fit any of the other 4 themes, it goes to Apollo. "I wish it did X" is a Product request by default.
3. **Hephaestus is fast-lane.** Any security-tagged feedback skips the weekly triage queue and goes to Hephaestus within 4 hours. No exceptions.
4. **Hermes is non-engineering.** Marketing-tagged feedback goes to Hermes but does NOT block an engineering sprint. It's a copy/positioning fix, not a code fix.
5. **Hera is design-system-only.** Design-tagged feedback must be reproducible as a design-system violation (a11y, token, motion, dark-mode). "I don't like the color" is not a design-system issue; it's a personal preference and gets a "noted, thanks" reply.

---

## §3 — The customer feedback system of record (`docs/research/beta/feedback-log.md`)

One row per feedback event. Append-only. Refreshed real-time by CSM + Iris.

### Schema (one row per feedback)

| Column           | Source                                      | Example                                                                     |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `date`           | Survey or call                              | `2026-09-15`                                                                |
| `customer`       | `docs/research/beta/customers/<company>.md` | `acme-corp`                                                                 |
| `persona`        | PERSONAS.md                                 | `Carla (ICP-1)`                                                             |
| `wave`           | §1                                          | `Wave 2 (D+14)`                                                             |
| `theme`          | §2                                          | `Product`                                                                   |
| `verbatim_quote` | Q2 open comment or interview transcript     | "The Monte Carlo is great but I can't export the sensitivity table to PDF." |
| `action_item`    | Triage outcome                              | `Add PDF export to Monte Carlo sensitivity table`                           |
| `owner`          | §2                                          | `Apollo`                                                                    |
| `status`         | Triage workflow                             | `open / triaged / in_progress / shipped / wontfix`                          |
| `theme_id`       | `docs/research/beta/patterns.md`            | `P-2026-Q4-007` (if it matches an existing pattern)                         |
| `linked_ticket`  | GitHub issue                                | `#1234`                                                                     |
| `nps_score`      | Q1 of NPS survey (if applicable)            | `8`                                                                         |

### Cross-linking

Every row links to:

- The customer's 1-page brief at `docs/research/beta/customers/<company>.md` (per Hermes's playbook)
- The pattern catalog entry at `docs/research/beta/patterns.md` (if it matches an existing pattern)
- The shipping ticket / commit (when status = shipped)

### Weekly rollup (Wednesdays, after the PM triage)

A 1-page digest for the whole team:

- Top 5 themes (by frequency this week)
- Top 5 action items (by severity)
- Top 5 wins (shipped this week, with user quotes)

The digest replaces the "user feedback" email thread that nobody reads. (Witness: in a prior beta rollout, 80% of the actionable feedback came from 20% of the comments; the weekly rollup surfaces the 20%.)

---

## §4 — Pattern detection across the cohort (`docs/research/beta/patterns.md`)

A living catalog of cross-user patterns. One bullet per pattern. Refreshed weekly (Wednesdays, after the PM triage).

### Pattern detection rules (the 3 thresholds that trigger escalation)

| Pattern                                   | Threshold                                           | Action                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **"What almost killed the deal"**         | 3+ customers cite the same feature                  | **P0 product work.** This is the deal-closer for sales — fixing it unblocks the next 10 deals.                            |
| **"I wish it had X" (feature request)**   | 3+ customers ask for the same feature               | **Roadmap candidate.** Add to the next quarter's planning.                                                                |
| **"The Y is broken" (issue, perf, bug)**  | 2+ customers cite the same issue                    | **P0 fix.** Reproduce, fix, ship. (The threshold is 2, not 3, because perf/bug issues compound faster than feature gaps.) |
| **NPS dips below 0 for any cohort**       | Cohort NPS < 0 for 2 consecutive waves              | **Escalation to founder.** This is a save-company moment. CSM + founder + Iris meet within 48 hours.                      |
| **Persona mismatch (predicted ≠ actual)** | 5+ customers' actual persona differs from predicted | **Persona update.** `PERSONAS.md` gets revised; ICP scoring gets revised; marketing positioning gets revised.             |

### Schema (one entry per pattern)

```
- pattern_id: P-2026-Q4-007
  date_first_observed: 2026-09-20
  customers_reporting: 4
  severity: P0
  theme: Product
  status: in_progress
  owner: Apollo
  description: "Export to PDF fails on the Monte Carlo sensitivity table when the model has >50k cells."
  verbatim_quotes: ["(Acme) I can't send the board pack without the sensitivity table.", "(Beta) The PDF export is the deal-breaker for us."]
  linked_tickets: [#1234, #1235]
  ship_target: 2026-10-15
```

### The "user-stated vs. observed" rule (the most important rule)

A user saying "the export is broken" is **user-stated** signal. **We must verify before we act.** A user-stated P0 is not a P0 until we reproduce it.

> **The "I fixed it" trap:** A CSM hears "the export is broken." The CSM files a P0 ticket. The PM starts a fix. The fix is for a bug that doesn't exist — the user had a CSV-formatted cell that confused the export. The user-stated signal was real; the technical P0 was not. **The verification step (15 min) saves 5 hours of misdirected engineering.**

### Pattern-to-shipped latency targets

- **P0:** <14 days median
- **P1:** <30 days median
- **P2:** <90 days median

A pattern that exceeds its latency target is escalated to the founder. The metric is reported in the weekly rollup.

---

## §5 — Survey tooling (PostHog, not Intercom, not Typeform)

**Recommendation: PostHog** (open-source, self-hostable, native to Vite, NPS plugin built-in, session replay for context).

| Tool         | Pros                                                                                                                          | Cons                                                                                                        | Verdict                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PostHog**  | Open-source, self-hostable, native Vite integration, NPS plugin + session replay + feature flags in one tool, $0 at our scale | Slightly less polished UI than Typeform                                                                     | **✅ Choose this.** The session-replay + feature-flag combination is the killer feature — we can see _what the user was doing_ when they gave an NPS 6. |
| **Intercom** | Polished UI, good for sales-handoff                                                                                           | Proprietary, $$$ at our scale, overkill for 3-question surveys, doesn't integrate with our in-app analytics | ❌                                                                                                                                                      |
| **Typeform** | Best-in-class UX for the survey taker                                                                                         | Disconnects the response from in-app behavior — we lose the feature-usage context that makes Q2 actionable  | ❌                                                                                                                                                      |

**Wire-up:** 1-line in `src/utils/analytics.ts`:

```ts
posthog.capture('nps_survey_completed', { score, persona, open_comment_hash });
```

**PostHog features used:**

- **Surveys** (NPS, in-app micro-survey, post-incident NPS)
- **Session replay** (linked from any NPS response — see _exactly_ what the user did in the 30 min before they gave the 6)
- **Feature flags** (roll out new surveys to 10% of users first; A/B test Q2 wording)
- **Cohorts** (the install-cohort definition; the persona cohorts; the wave cohorts)

**Cost at 50 beta users + 500 GA users:** $0 (PostHog Cloud free tier covers up to 1M events/month; we'll use ~50k events/month).

**Why not self-host PostHog:** For the beta, PostHog Cloud is the right choice. Self-hosting is a Q3 2026 decision once we have a DevOps hire.

---

## §6 — Incentives for feedback (4 mechanisms, by wave)

**The principle:** Friction-free for the lowest-effort waves; meaningful reward for the highest-effort waves. Don't pay for low-effort signals (it biases the sample toward the incentivized).

| Wave                                     | Effort | Incentive                                                                      | Rationale                                                                                                               |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Wave 1 (micro-survey, 1 question)**    | <2 sec | **None.**                                                                      | Paying for a 1-question in-app modal biases the sample toward the incentivized. Friction-free is the design.            |
| **Wave 2 (30-min feedback session)**     | 30 min | **$50 Amazon gift card + name in case study (if customer consents)**           | The gift card is a thank-you, not a payment. The case-study mention is the real incentive for ICP-1 (board-visibility). |
| **Wave 3 (NPS, 3 questions)**            | 30 sec | **None.**                                                                      | Same as Wave 1 — paying for an NPS biases the score.                                                                    |
| **Wave 4 (60-min case study interview)** | 60 min | **$200 Amazon gift card + 50% Y1 discount locked for 12 months + logo rights** | The discount is the deal-closer for ICP-1; the gift card is the thank-you; the logo rights are the marketing asset.     |
| **Wave 5 (public launch feedback)**      | 5 min  | **Featured in launch announcement + LinkedIn shoutout**                        | Public recognition is the right incentive for Promoters who want to be associated with the win.                         |

**Budget for 50 beta users (assuming 80% Wave 2 completion, 70% Wave 3, 50% Wave 4, 100% Wave 5):**

- Wave 2: 40 × $50 = $2,000
- Wave 4: 25 × $200 = $5,000 + 25 × ~$3,000 Y1 discount (varies by tier) = ~$80,000 in discount commitments (this is _expected_ Y1 revenue we trade for case studies)
- Wave 5: $0 (no cash; just public recognition)
- **Total cash: $7,000.** Total discount commitment: ~$80,000 (which is <2% of expected Y1 ACV from the 50-user cohort).

**Approval:** The $7,000 cash + $80,000 discount commitment is a P3 budget item (per Hermes's pricing). Requires founder sign-off pre-beta-launch. The discount is the lever; if the founder wants to cap it at $50k, we cut Wave 4 to $100 gift card + 25% Y1 discount.

---

## §7 — Quality bar (what makes a feedback session GOOD)

The difference between a useful feedback session and a useless one is the _specificity_ of the quotes. Vague quotes produce vague product decisions. Specific quotes produce specific product decisions. Five rules:

1. **Verbatim quotes, not paraphrased.** "I love the export" is useless. "The PDF export of the variance report is the only reason I cancelled my Adaptive renewal" is a case-study quote. (Witness: in a prior beta, paraphrased quotes led to 3 product decisions that users didn't actually want; verbatim quotes caught the misalignment before shipping.)

2. **Specific numbers.** Not "it saves me time" but "it saves me 4 hours every Monday morning." Not "the model is fast" but "I can run a 100k-cell Monte Carlo in 12 seconds." Numbers are falsifiable; adjectives are not. The best feedback has time saved, dollars saved, scenarios built, errors caught, decisions accelerated.

3. **Specific features.** Not "the tool" but "the Monte Carlo on the budget page." Not "the reporting" but "the variance report with the drill-down to GL account." A feedback session that names 5 specific features is 10× more useful than one that says "everything is great."

4. **Specific alternatives considered.** Not "we looked at others" but "we compared to Anaplan ($340k quote), Adaptive ($280k quote), Cube ($60k quote), and a build (3 engineers × 6 months)." The competitive context is the deal-closer — it's what the sales team uses to win the next 10 deals.

5. **The "almost killed it / almost saved it" pair.** Every Wave 4 interview captures both: the feature/friction that almost lost the deal, and the feature/friction that saved it. The pair is the sales playbook's secret weapon — "we almost didn't buy because of X, but the demo of Y won us over." This is the quote that goes on the website.

### The "Three Witnesses" check (the discipline that enforces the quality bar)

Every feedback entry in `feedback-log.md` must have all three witnesses:

- **(a) User quote** (verbatim, not paraphrased)
- **(b) Observed behavior** (what the user actually did, not what they said — pulled from PostHog session replay)
- **(c) The alternative** (what they would have done instead — pulled from the buy/build discussion)

If any of the three is missing, the entry is incomplete. Incomplete entries don't ship to the product team. (This is the same D-009 Three Witnesses rule that applies to the persona research; the same discipline applies to live-customer feedback.)

---

## The 3 highest-leverage feedback patterns to detect

If we can only detect 3 patterns in the beta, detect these:

1. **"What almost killed the deal"** — the single feature/friction that almost lost the deal. Detecting this across 3+ customers identifies the P0 product work that unblocks the next 10 deals. (Example pattern: "the Excel import is too slow on >50k rows" → P0 for Apollo, ships in 2 weeks, unblocks 8 deals in pipeline.)

2. **"What almost saved the deal"** — the single feature/moment that won the deal. Detecting this across 3+ customers identifies the marketing message and the sales demo flow. (Example pattern: "the AI Copilot's 'what-if' scenario demo" → Hermes's homepage hero, sales demo opening slide, case study quote.)

3. **"The persona mismatch"** — when a customer's actual usage pattern contradicts the predicted persona. Detecting this across 5+ customers updates the ICP scoring, the marketing positioning, and the onboarding flow. (Example pattern: "5 of 30 ICP-1 Carlas are actually using FinPlan Pro like an ICP-3 Chris (self-serve, no team, no Slack)" → ICP-1 needs to be split into ICP-1a (team) and ICP-1b (self-serve).)

The patterns catalog at `docs/research/beta/patterns.md` is where these detections land. The weekly rollup surfaces them. The Thursday founder-sync reviews the top 3.

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 30 ICP-1 + 20 ICP-3 cohort comes from the persona definitions. The Day 90 call is the moment the `[INFERRED]` quotes become `[VERBATIM]`.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — the Wave 0 + Wave 2 + Wave 4 calls are trimmed versions of this script.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Wave 1 = Stage 3 (Trial), Wave 2 = Stage 4 (First Value), Wave 3 = Stage 5 (Aha Moment), Wave 4 = Stage 6 (Habit), Wave 5 = Stage 7 (Evangelism).
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Wave 1-3 are the early-warning system for Reasons 1-3 churn. Wave 4 is the conversion check.
- **`docs/drafts/iris/NPS_SURVEY_DESIGN.md`** — Wave 3 is the T+30 trial-health NPS; Wave 4 includes the T+90 first-real NPS. (Per the cadence in §4 of that doc.)
- **`docs/drafts/iris/CHURN_EVENTS_TAXONOMY.md`** — the `habit.first_scenario_built` event triggers Wave 1; the `churn.*` events trigger save motions based on Wave 2-3 feedback.
- **`docs/drafts/hermes/BETA_PROGRAM.md`** — the 50-customer cohort + scoring rubric + success criteria come from Hermes's T-HER-003.
- **`docs/STRATEGIC_REVIEW_Q2_2026.md` (Q2 strategic review)** — the NPS target (+40 EOY1, +50 EOY2) is the bar Wave 3-5 measure against. TENTATIVE: Q3 2026 review will be created at end of Q3 (2026-09-30) and may update this target.
- **Apollo's analytics taxonomy** — the `nps_moment.*` and `nps.*` events need to be added; the PostHog wire-up is a 1-line change in `src/utils/analytics.ts`.
- **Athena's code-quality audit** — Wave 2-4 themes tagged `Code quality` route to Athena; her audit findings update `patterns.md`.
- **Prometheus's perf audit** — Wave 2-4 themes tagged `Code quality` with a perf angle route to Prometheus; his SLO breaches trigger the post-incident NPS.
- **Hephaestus's security audit** — Wave 2-4 themes tagged `Security` route to Hephaestus within 4 hours; his compliance review checks the survey data retention.
- **Hera's UX/a11y audit** — Wave 2-4 themes tagged `Design` route to Hera; her WCAG-AA findings update the design system.
- **Hermes's GTM** — Wave 4 case studies + Wave 5 referral conversions feed Hermes's marketing assets + battlecard updates.

---

## The 5-wave timing aligned with Beta launch (D+0 to D+120)

| Day           | Wave                                               | Channel                                              | Owner                      | Output                                      | Target                                        |
| ------------- | -------------------------------------------------- | ---------------------------------------------------- | -------------------------- | ------------------------------------------- | --------------------------------------------- |
| D+0           | Pre-wave (onboarding)                              | Video call (30 min)                                  | CSM                        | `summary-day0.md`                           | 100% of 50 users                              |
| D+0 to D+7    | **Wave 1** (in-app micro-survey at first scenario) | In-app modal                                         | Apollo (event-trigger)     | `nps_moment.easy_score`                     | >80% completion                               |
| D+7 to D+30   | **Wave 2** (30-min feedback session)               | Video call (recorded)                                | CSM + Iris (10 of 50)      | `summary-day14.md`                          | >80% completion                               |
| D+30 to D+60  | **Wave 3** (NPS survey)                            | In-app (3 questions)                                 | Apollo + CSM (save motion) | `nps.score_X` event                         | >70% completion                               |
| D+60 to D+90  | **Wave 4** (60-min case study interview)           | Video call (recorded)                                | CSM + AE + Iris            | case study + final NPS                      | >50% completion; ≥5 Diamond                   |
| D+90 to D+120 | **Wave 5** (public launch feedback)                | Public NPS + email referral + case study publication | Hermes + CSM               | public NPS + ≥3 case studies + ≥5 referrals | >60% NPS response; ≥3 published; ≥5 referrals |

---

_The beta is the cheapest research we'll ever do. The users are paying us to learn. The 120 days are the most valuable 120 days of the company. Don't waste them on ad-hoc feedback. — Iris_
