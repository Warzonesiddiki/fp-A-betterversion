<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Beta-Customer Feedback Collection Plan

> **Muse:** Iris.
> **Status:** D-007 "pre-write next" draft — awaits formal task assignment; bridges to Hermes's T-HER-003 (Beta program design, in_progress) and Mnemosyne's GLOSSARY work.
> **Scope:** How we collect, route, and act on feedback from the 50-customer beta cohort (per Hermes's T-HER-003). Operationalizes the `INTERVIEW_SCRIPT.md` for live users.
> **Companions:** `PERSONAS.md` (30 ICP-1 + 20 ICP-3 cohort), `INTERVIEW_SCRIPT.md` (30-min format), `JOURNEY_MAP_CARLA.md` (7 stages), `CHURN_FRAMEWORK.md` (5 reasons), `NPS_SURVEY_DESIGN.md` (T+30/T+90/T+180 cadence), `docs/drafts/hermes/BETA_PROGRAM.md` (when ready).
> **Three-witness rule:** every claim = (a) user quote (when we have one, post-launch), (b) observed behavior, (c) the alternative or interpretation.

---

## Why a beta feedback plan is different from a research plan (and why we need both)

The 30 customer discovery interviews in `INTERVIEW_SCRIPT.md` are **research** — they extract *qualitative insight* about jobs, pains, and alternatives. The beta feedback collection is **product validation** — it extracts *quantitative signal* about whether the product is working for the 50 customers who have installed it.

| Dimension | Research interviews (T-IR-001 script) | Beta feedback (this plan) |
|---|---|---|
| **Goal** | Understand the *job* the user is hiring us to do | Understand whether *we* are doing the job |
| **Sample** | 30 users (10 Carla, 10 Chris, 10 Vera), some users some non-users | 50 users (30 ICP-1 Carla, 20 ICP-3 Chris), all users |
| **Cadence** | One 30-min conversation per user, one-time | 5 touchpoints per user over 90 days |
| **Output** | Quotes, themes, persona updates | Tickets, themes, product-decision triggers |
| **Owner** | Iris (research) | Iris + PM (research + product) |
| **Trust signal** | "We want to understand" | "We want to fix" |

**The two are complementary, not redundant.** Research interviews *before* launch (which we can't do) would be ideal; we don't have them. The beta is the next best thing — it's our first chance to validate the personas against observed behavior.

> **The single most important thing in this plan:** The beta is the **first real test of the 3 personas**. If the persona assumptions are wrong, the beta will tell us. If they're right, the beta will tell us *how right*. Either way, the personas get updated based on observed behavior, not inferred behavior. The `[INFERRED]` quotes in `PERSONAS.md` get replaced.

---

## §1 — The 4-wave feedback collection (5 touchpoints over 90 days)

The beta runs 90 days. We collect feedback at 5 specific moments. Each moment has a different *goal* — not "check in" but a specific validation question.

### Wave 0 — Day 0 (onboarding call, 30 min)

**Goal:** Establish the relationship, set expectations, capture the user's *predicted* jobs and pains (which we compare to their *actual* jobs/pains at Day 30+).

**Channel:** Video call, 1-on-1, CSM + user.

**Format:**
- 5 min: "What did you do yesterday? Walk me through your day" (same opener as `INTERVIEW_SCRIPT.md` Q1)
- 10 min: Show the user how to install + import their real data
- 5 min: User's first impression of the UI (record their reactions, not their words)
- 5 min: "What's the ONE thing you hope this tool does for you?" (predicted JTBD)
- 5 min: Set the Day 7 / Day 30 / Day 60 / Day 90 follow-ups; confirm contact preferences

**Output:** 1-page summary in `docs/research/beta/2026-Q4/summary-<user-id>-day0.md` — predicted JTBD, predicted pain, predicted aha moment.

**Owner:** CSM (with Iris observing 5-10 of the 50 calls for calibration).

---

### Wave 1 — Day 7 (first-value check, 15 min)

**Goal:** Validate that the user reached the aha moment. Identify the *actual* friction (vs. predicted).

**Channel:** Email (lightweight, with 1-click to a 15-min video call if the user wants).

**Format (email template):**
> "Hi [name] — quick check-in. Three questions:
> 1. Did you get a chance to import your data? (Yes / No / Got stuck at ___)
> 2. Did you run a scenario or look at the variance report? (Yes / No / Not yet)
> 3. Anything in your way that we should fix?
>
> Reply with one sentence per question. If you want a 15-min walkthrough, here's my calendar link: [link].
>
> — [CSM name]"

**Output:** 1-line response per user. Pattern-detection: if ≥3 users say "stuck on import," that's a P0 product fix.

**Owner:** CSM (automated-email-but-feels-human, with manual triage by Iris weekly).

---

### Wave 2 — Day 30 (the first real NPS, 30 min)

**Goal:** First real NPS score per the `NPS_SURVEY_DESIGN.md` cadence. Validate the persona assumption (does the user match the predicted persona?). Capture the *actual* JTBD (vs. predicted at Day 0).

**Channel:** Video call, 1-on-1, CSM + user. Plus the NPS survey in-app.

**Format:**
- 5 min: NPS survey (in-app, 3 questions, ~30 sec)
- 25 min: A trimmed version of `INTERVIEW_SCRIPT.md` Section 3 (pain points) — focused on what we *built*, not what they're doing in general. Question 9 ("show me the last scenario you built") is the centerpiece.

**Output:**
- NPS score (in the analytics event taxonomy)
- 1-page summary in `docs/research/beta/2026-Q4/summary-<user-id>-day30.md` — actual JTBD, actual aha moment, persona-fit verdict.

**Owner:** CSM (NPS + summary); Iris (calls the ICP-1 cohort, CSM calls the ICP-3 cohort).

---

### Wave 3 — Day 60 (the value-anchor call, 30 min)

**Goal:** Validate that the user has *recurring* value (the aha moment has repeated). Identify any *new* pains that emerged since Day 30.

**Channel:** Video call, 1-on-1, CSM + user.

**Format:**
- 5 min: "How often are you using FinPlan Pro now vs. Day 30?" (use the data, not the user's guess)
- 10 min: "Show me the 3 most useful things you did this month" (force-rank)
- 10 min: "What's the ONE thing that's getting in your way now?" (single-thing question)
- 5 min: Roadmap preview ("here's what we're shipping next month — does this address the thing?")

**Output:** Update to the Day 30 summary; routing tickets to product for the "ONE thing."

**Owner:** CSM (with AE joining for ICP-1).

---

### Wave 4 — Day 90 (the post-beta NPS + case study, 60 min)

**Goal:** The final NPS for the beta cohort. Capture a case study. Make the renewal/expansion ask.

**Channel:** Video call, 1-on-1, CSM + AE + user.

**Format:**
- 5 min: Final NPS survey
- 20 min: "Tell me the story of your 90 days with FinPlan Pro" (open-ended, recorded with consent)
- 15 min: "What would make this a 10 for you?" (the unblocker question)
- 10 min: Case study ask ("would you be willing to do a 30-min recorded case study?")
- 10 min: Renewal/expansion ask (handled by AE)

**Output:**
- Final NPS score
- Case study transcript (if user agrees)
- Renewal/expansion outcome (tracked by AE)

**Owner:** CSM + AE (with Iris calling 5-10 of the 50 calls for qualitative depth).

---

## §2 — Per-persona differences (the routing logic)

The 5-wave plan above is the *default*. Per-persona, we adjust:

| Wave | ICP-1 (Carla, 30 users) | ICP-3 (Chris, 20 users) |
|---|---|---|
| Day 0 | 30-min video call (CSM + user) | 15-min video call (CSM + user) — Chris's attention budget is shorter |
| Day 7 | Email (15-min if requested) | Email (no proactive 15-min offer — Chris will not opt in) |
| Day 30 | 30-min video call (CSM + Iris) | 15-min video call (CSM only — Iris skips Chris cohort to preserve rapport) |
| Day 60 | 30-min video call (CSM + AE) | **Skip.** Chris doesn't have a Day 60 attention budget. Send a 1-question email instead. |
| Day 90 | 60-min video call (CSM + AE + Iris) | 30-min video call (CSM + AE) |

> **The ICP-1 cohort is the "deep" cohort.** We invest 30+30+30+60 = 150 minutes of conversation per user. The ICP-3 cohort is the "wide" cohort: 15+15 = 30 minutes per user. The deep cohort gives us qualitative depth; the wide cohort gives us volume. **Both are needed; don't conflate them.**

---

## §3 — The routing & triage workflow (so feedback doesn't die in a Slack channel)

**The failure mode we are defending against:** Feedback is collected, but no one acts on it, and the user feels ignored. This is the #1 reason beta cohorts churn at Day 30.

### The triage flow (every Wave 1-4 response goes through this)

1. **CSM reads + tags within 24h.** Tag: `theme` (perf / support / ux / missing-feature / price) + `severity` (P0/P1/P2/P3) + `persona` (carla/chris/vera).
2. **Iris reviews weekly (Mondays 10:00 IST, 60 min).** Goal: identify cross-user patterns. If 3+ users say the same thing, it's a pattern. Patterns get a `theme_id` and a routing.
3. **PM triages the patterns (Tuesdays 10:00 IST, 60 min).** For each pattern: (a) ship-now, (b) ship-next-sprint, (c) on-roadmap-by-date, (d) not-on-roadmap-and-why.
4. **CSM follows up with the user (within 7 days of the PM triage).** "We heard you. We're doing [X]." The follow-up is the trust-recovery moment.
5. **Iris publishes the pattern catalog (Wednesdays).** `docs/research/patterns.md` (the doc I referenced in `INTERVIEW_SCRIPT.md`) gets updated weekly. **This is the living artifact the whole team reads.**

### The escalation rules (when does a pattern skip the queue?)

| Pattern severity | Escalation |
|---|---|
| **P0 (blocker)** — ≥1 user blocked from using the product | PM + Apollo + Iris + CSM meet same-day. Ship-now or temporary workaround. |
| **P1 (major friction)** — ≥3 users report it in 7 days | PM triages next Tuesday; ships in next sprint or commits to a date. |
| **P2 (minor friction)** — 1-2 users report it | PM triages monthly; backlog. |
| **P3 (cosmetic)** — 1 user, 1 occurrence | Backlog, no commitment. |

### The "user-stated vs. observed" rule (the most important rule)

A user saying "the export is broken" is **user-stated** signal. **We must verify before we act.** A user-stated P0 is not a P0 until we reproduce it.

> **The "I fixed it" trap:** A CSM hears "the export is broken." The CSM files a P0 ticket. The PM starts a fix. The fix is for a bug that doesn't exist — the user had a CSV-formatted cell that confused the export. The user-stated signal was real; the technical P0 was not. **The verification step (15 min) saves 5 hours of misdirected engineering.**

---

## §4 — The 3 artifacts (the living docs that make this work)

### Artifact 1 — `docs/research/beta/2026-Q4/TRACKER.md`

A spreadsheet-equivalent (markdown table) with one row per user, tracking:
- User ID, persona, install date
- Day 0 / 7 / 30 / 60 / 90 status (scheduled / completed / skipped)
- NPS score per wave
- Top-of-mind theme per wave
- Save motion triggered (Y/N)
- Renewal status (Day 90)

**Refresh:** After every wave (real-time).
**Audience:** CSM team, Iris, PM.

### Artifact 2 — `docs/research/patterns.md`

A living catalog of cross-user patterns. One bullet per pattern:
- `pattern_id` (e.g., `P-2026-Q4-007`)
- Date first observed
- # of users reporting it
- Severity (P0-P3)
- Theme
- Status (open / triaged / shipped / wontfix)
- Owner
- Link to the relevant ticket / commit / doc

**Refresh:** Weekly (Wednesdays, after the PM triage).
**Audience:** Whole team + leadership.

### Artifact 3 — `docs/research/beta/2026-Q4/summary-<user-id>-<wave>.md`

One per user per wave. 1-page format:
- Date, wave, channel
- Verbatim quotes (3-5 max)
- Observed behavior (what they actually did, not what they said)
- Pattern tags (`P-2026-Q4-XXX`)
- Follow-up action

**Refresh:** After every wave (real-time, by CSM with Iris review).
**Audience:** Iris, PM, leadership (for sampling).

---

## §5 — The connection to the 5 Muses (so feedback actually ships)

The feedback plan is only useful if the **themes → product** connection is real. The 5-way handoff:

1. **Iris (research) → PM (product):** The pattern catalog with severity tags. PM owns the triage.
2. **PM (product) → Apollo (build):** Triaged P0/P1 → Apollo's sprint. P2/P3 → Apollo's backlog.
3. **Apollo (build) → CSM (customer):** Shipped fix → CSM tells the user. The "we heard you" moment.
4. **Hera (UX) → Iris (research):** A11y / design system themes get routed to Hera. Hera ships the design system fix; Iris updates the pattern catalog.
5. **Hermes (GTM) → CSM (customer):** Beta-customer case studies → Hermes's marketing assets. The 50-customer beta is the *source* of the first 5 case studies.

> **The single most important handoff is Iris → PM → Apollo → CSM → user.** The loop must close. A feedback theme that doesn't ship is a tax on the user's trust. **Close the loop in 14 days max for P0; 30 days max for P1; 90 days max for P2.**

---

## §6 — The success criteria (how we know the plan is working)

| Metric | Target | Where measured |
|---|---|---|
| Wave completion rate | >85% per wave (per persona) | TRACKER.md |
| NPS response rate (Wave 2 + 4) | >35% per wave | Analytics |
| Pattern-to-shipped latency (P0) | <14 days median | patterns.md |
| Pattern-to-shipped latency (P1) | <30 days median | patterns.md |
| User satisfaction with the "we heard you" follow-up | >80% (post-follow-up CSAT) | CSM-tracked |
| Day 90 renewal/expansion rate | >70% for ICP-1, >50% for ICP-3 | AE-tracked |
| Case studies produced | ≥5 by Day 90 | Hermes-tracked |
| Quotes captured for `PERSONAS.md` update | ≥15 verbatim by Day 90 | Iris-tracked |
| `[INFERRED]` quotes replaced with verbatim | All 3 personas updated by Day 90 | Iris-tracked |

If we hit 6 of these 9 targets, the beta feedback plan worked. If we hit <4, we have a process problem and we re-design before the GA cohort.

---

## §7 — The 3 things this plan doesn't cover (and why)

- ❌ **In-app micro-surveys** (e.g., a 1-emoji scale after every scenario run). Different from NPS — they measure *moment-level* satisfaction. Out of scope here; covered in the broader analytics taxonomy.
- ❌ **Quantitative telemetry from the product itself** (button clicks, scenario runs, exports). The product's analytics event taxonomy (per `CHURN_EVENTS_TAXONOMY.md` + the broader taxonomy) is the *quantitative* counterpart. The feedback plan is the *qualitative* counterpart. Both ship.
- ❌ **Long-term retention tracking** (Day 180, Day 365). The beta is 90 days. Long-term retention is covered by the NPS cadence (T+180) + churn framework, not by the beta feedback plan.

---

## §8 — The 3 highest-leverage decisions baked into this plan

1. **5 waves, not "as needed."** The cadence is a forcing function. Without the cadence, feedback collection becomes ad-hoc, and the high-value early signals (Day 7, Day 30) get missed.
2. **The user-stated vs. observed rule.** We verify before we act. Saves engineering time and protects the user's trust in the feedback loop.
3. **The 5-way handoff to the Muses.** Feedback doesn't die in a Slack channel. Every theme has an owner; every shipped fix is communicated back to the user.

---

## §9 — Pre-launch validation (what we do before Day 0 of the beta)

We can validate this plan *before* the beta starts by:

1. **Walkthrough with the CSM team.** The CSM is the operator of this plan; if they don't believe in the cadence, the plan fails on Day 7.
2. **Template every email, every call agenda, every summary format.** The plan is the *intent*; the templates are the *execution*. Don't ship the plan without the templates.
3. **Test the routing on a single fake feedback.** Walk a fake "the export is broken" through the 5-step triage flow. Time it. If it takes >30 min, the flow is too heavy.

---

## §10 — The "what could go wrong" pre-mortem

| Pre-mortem | Symptom | Fix |
|---|---|---|
| Wave completion rate <50% | Users ignore the Day 7 email; CSM doesn't follow up | Cut Wave 1 to a 1-question email ("did you import your data? Y/N"). The Y/N is enough to start. |
| Pattern-to-shipped latency >30 days for P1 | PM is overwhelmed; Apollo is overloaded | Cap the active P1 patterns at 10. Beyond 10, queue for the next sprint. Visibility > throughput. |
| User feels "we heard you" follow-up is hollow | CSM says "we're working on it" without a date | The follow-up template *must* include a specific date: "We're shipping [X] by [date]." No date = hollow. |
| Beta cohort churns at Day 30 | ≥20% of the 50 users are inactive by Day 30 | The Wave 1 (Day 7) check is the warning. If the Day 7 completion rate is <60%, escalate to the founder before Day 30. |
| Iris can't keep up with the calls | Iris was planning to call all 50 users | Iris calls only the 10 ICP-1 cohort at Day 30 and Day 90. The rest is CSM-only. Iris reviews the summaries, not the calls. |

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 30 ICP-1 + 20 ICP-3 cohort comes from the persona definitions. The Day 90 call is the moment the `[INFERRED]` quotes become `[VERBATIM]`.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — the Wave 0 + Wave 2 + Wave 4 calls are trimmed versions of this script.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Wave 1 = Stage 3 (Trial), Wave 2 = Stage 4 (First Value), Wave 3 = Stage 5 (Aha Moment), Wave 4 = Stage 6 (Habit).
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Wave 1-3 are the early-warning system for Reasons 1-3 churn. Wave 4 is the conversion check.
- **`docs/drafts/iris/NPS_SURVEY_DESIGN.md`** — Wave 2 and Wave 4 are the first two NPS cadences (T+30 trial-health + T+90 first real NPS).
- **`docs/drafts/hermes/BETA_PROGRAM.md`** (in flight) — the 50-customer cohort + scoring rubric + success criteria come from Hermes's T-HER-003.
- **`docs/drafts/athena/`** — feedback themes that reveal code-quality issues route to Athena.
- **`docs/drafts/prometheus/`** — performance themes route to Prometheus.
- **`docs/drafts/hera/`** — UX / a11y themes route to Hera.

---

_The beta is the cheapest research we'll ever do. The users are paying us to learn. The 90 days are the most valuable 90 days of the company. Don't waste them on ad-hoc feedback. — Iris_
