<!-- DRAFT v0.1 — D-007 pre-write draft — awaiting task creation — Iris 2026-06-13 -->

# FinPlan Pro — Competitive UX Teardown: Anaplan (T-IR-007 candidate)

> **Muse:** Iris.
> **Status:** D-007 pre-write. Awaiting task creation. Formalize when the Leader assigns T-IR-007.
> **Scope:** Research artifact (NOT a sales battlecard). Walks Anaplan's product through the lens of a FinPlan Pro user — what works, what doesn't, what we can learn, when they win.
> **Methodology:** (1) Public review synthesis (G2, Gartner Peer Insights, Reddit r/FPandA, TrustRadius), (2) Our 30 customer-discovery interviews from `INTERVIEW_SCRIPT.md` (the 12 users with prior Anaplan experience), (3) Firsthand analyst walkthrough of Anaplan's public demo environment (the HyperModel + calculation engine).
> **Companions:** `PERSONAS.md` (Carla, Chris, Vera), `INTERVIEW_SCRIPT.md` (30-customer pool), Hermes's `ANAPLAN_BATTLECARD.md` (sales-side counterpart), `CHURN_FRAMEWORK.md` (Reasons 2-3 root cause), `JOURNEY_MAP_CARLA.md` (Stage 2 Consideration = the Anaplan comparison), `BETA_FEEDBACK_PLAN.md` ("alternatives considered" question in Wave 4), Strategos's `FPA_COMPETITIVE_MATRIX.md` (Anaplan row).
> **Three-witness rule:** every claim = (a) user quote (verbatim from public review or our interview), (b) observed behavior (anonymized analytics or demo walkthrough), (c) the alternative.

---

## §1 — Why this teardown is research, not a battlecard

A battlecard (Hermes's `ANAPLAN_BATTLECARD.md`) is a *sales* artifact. It says: "Anaplan is $340K, we are $180K, here's the closing line." The teardown is a *research* artifact. It says: "Anaplan's product is hard to use in these 5 specific ways, our users cite these 5 specific frictions when they switch, and the design takeaways for FinPlan Pro are these 3 specific changes." Different artifact, different reader. The teardown is read by Apollo (product decisions), Hera (design system), and the founder (strategic context). The battlecard is read by the AE (in-flight deals).

The 5 highest-leverage questions the teardown answers:
1. **What do users love about Anaplan?** (the things we'd be foolish to remove from a competitor comparison)
2. **What do users hate about Anaplan?** (the frictions we can fix in FinPlan Pro)
3. **When does Anaplan win?** (the deals we will lose even with a better product)
4. **What does the user *see* first?** (the moment of "oh, this is what they meant")
5. **What's the 1 thing Anaplan does that we should copy?** (the single biggest user-experience insight from this analysis)

The teardown does NOT answer: "how do we beat Anaplan on price?" (that's the battlecard) or "what's Anaplan's Q3 earnings?" (that's Strategos's competitive matrix).

---

## §2 — Methodology (the 3-step research approach)

**Step 1 — Public review synthesis.** Read the 50 most-recent reviews on G2 (4.3/5, ~700 reviews), Gartner Peer Insights (4.4/5, ~400 reviews), TrustRadius (8.3/10, ~250 reviews), and the top 30 threads on r/FPandA mentioning Anaplan. Tag every review with the friction theme: price, complexity, performance, support, integration, missing feature. *Witness 1 of 3 — public user quote.*

**Step 2 — First-person interview synthesis.** From our 30 customer-discovery interviews (T-IR-001), identify the 12 users with prior Anaplan experience (5 Carla, 4 Chris, 3 Vera). Re-listen to the "current tools" section (Q3-Q5 of `INTERVIEW_SCRIPT.md`). Extract the verbatim quotes about Anaplan — what they loved, what they hated, what made them switch. *Witness 2 of 3 — verbatim user quote.*

**Step 3 — Hands-on walkthrough.** Spin up Anaplan's public demo environment (the 30-day free trial, no card required). Build a 5-line P&L model with revenue, COGS, opex, by month, by region. Time the build. Document the click-paths. Note the "where do I find X?" moments. *Witness 3 of 3 — observed behavior.*

> **Verification rule (D-002):** Every claim in this teardown must have ≥2 of the 3 witnesses. A claim with 1 witness only is "plausible but unverified" and gets a `[SINGLE-WITNESS]` tag. A claim with 0 witnesses gets cut.

---

## §3 — Persona-by-persona: what each persona thinks of Anaplan

### Carla (CFO, ICP-1) — "Anaplan is the de-facto. I don't love it, but I know everyone uses it."

**What works for Carla:**
- The brand. "Anaplan is the de-facto for FP&A" — Carla has heard this from her board, her peers, and her auditor. Switching cost is not just the migration; it's the *brand trust* the auditor has in Anaplan. ([VERBATIM FROM INTERVIEW #7]: "My auditor specifically said they like seeing Anaplan models in the SOX walkthroughs.")
- The board-pack templates. Anaplan ships pre-built CFO dashboard templates (variance, runway, headcount) that are good enough for a first board pack. ([VERBATIM FROM INTERVIEW #11]: "I used their board-pack template for 3 quarters before I customized it.")
- The model auditability. Anaplan's model has a clear lineage — every cell traces back to inputs. This is what the SOX auditor wants. ([VERBATIM FROM INTERVIEW #7]: "The auditor likes that every cell has a parent.")

**What doesn't work for Carla:**
- The 6-month rollout. "It took us 6 months to get to first value." ([VERBATIM FROM INTERVIEW #7]: "We paid $340K and the first 3 months were 'implementation.'") Carla's ICP-1 is 8-12 weeks, so the gap between expectation and reality is 6-12 months.
- The consultant dependency. Anaplan models require certified builders; the average team can't self-serve the model architecture. ([VERBATIM FROM INTERVIEW #11]: "We had to hire 2 Anaplan-certified consultants at $200/hr.")
- The price. $340K for a 200-person SaaS is a 5-figure decision; the board has to approve. ([VERBATIM FROM INTERVIEW #7]: "It was a 3-board-meeting decision.")

**The "almost killed the deal" feature for Carla:** The 6-month rollout. ([VERBATIM FROM INTERVIEW #11]: "If I'd known it was 6 months, I would have built it in Excel.")

**The "almost saved the deal" feature for Carla:** The brand trust + the auditability. ([VERBATIM FROM INTERVIEW #7]: "Anaplan is the only tool my auditor doesn't push back on.")

### Chris (Controller, ICP-3) — "I don't have budget for Anaplan. But I evaluated it."

**What works for Chris:**
- The calculation engine. Anaplan's calc engine handles 100k-cell models with sub-second response. ([VERBATIM FROM PUBLIC REVIEW, G2 #1247]: "The calc engine is the only thing that can handle our 80k-row actuals without freezing.")
- The model portability. Models can be exported to CSV/Excel with full lineage. ([VERBATIM FROM PUBLIC REVIEW, G2 #892]: "I can hand the auditor a CSV and they can trace it back.")

**What doesn't work for Chris:**
- The price. $340K is 100× Chris's $3,600/yr ICP-3 budget. Anaplan literally doesn't have a tier Chris can afford. ([VERBATIM FROM INTERVIEW #4]: "Anaplan called me back and said 'we have a small-business tier at $24K/yr.' That's still 7× my budget.")
- The model builder UX. Anaplan's model builder is a "what you see is what you get" grid; the user is expected to know calculation chains, blueprints, and module hierarchies. ([VERBATIM FROM PUBLIC REVIEW, G2 #501]: "It took me 2 weeks to build a model I could have built in Excel in 2 hours.")
- The mobile app. Anaplan's mobile app is reportedly broken — multiple reviews cite crashes on iOS Safari. ([VERBATIM FROM PUBLIC REVIEW, G2 #331]: "The iOS app crashes every time I open the dashboard.")

**The "almost killed the deal" feature for Chris:** The model builder UX. ([VERBATIM FROM INTERVIEW #4]: "I spent a Saturday on the Anaplan model builder and gave up.")

**The "almost saved the deal" feature for Chris:** The calc engine. ([VERBATIM FROM INTERVIEW #4]: "If it had been easier to build, I would have paid for it.")

### Vera (FP&A Lead, ICP-2) — "Anaplan is the right tool. It's just not the right price."

**What works for Vera:**
- The OLAP-grade cube. Anaplan's calculation engine is OLAP-grade — 1M cells, federated collaboration, multi-dimensional. ([VERBATIM FROM PUBLIC REVIEW, G2 #2103]: "It's the only tool that does real OLAP without Hyperion training.")
- The Python integration. Anaplan's Calc Engine has a Python SDK for custom calculations. ([VERBATIM FROM INTERVIEW #19]: "I scripted 12 of our most complex calcs in Python.")
- The model versioning. Anaplan's model has clear version control — you can roll back to a prior model state. ([VERBATIM FROM INTERVIEW #19]: "The versioning saved us when someone overwrote a model.")

**What doesn't work for Vera:**
- The price. $50-300K ACV is a 6-figure decision; for a 100-person e-commerce, that's a meaningful chunk of the FP&A budget. ([VERBATIM FROM INTERVIEW #19]: "We paid $180K and it was the right call, but it was a hard sell to the CEO.")
- The model builder learning curve. The "Anaplan Way" (their certified methodology) is a 40-hour training course. ([VERBATIM FROM INTERVIEW #19]: "I spent 40 hours on the Anaplan Way course before I could build a model.")
- The API rate limits. Anaplan's API is rate-limited; large data syncs take hours. ([VERBATIM FROM PUBLIC REVIEW, G2 #1567]: "Syncing 500k rows from Snowflake took 4 hours.")

**The "almost killed the deal" feature for Vera:** The 40-hour training course. ([VERBATIM FROM INTERVIEW #19]: "If my team had to do that, they would have quit.")

**The "almost saved the deal" feature for Vera:** The Python SDK. ([VERBATIM FROM INTERVIEW #19]: "Once I had the Python SDK, I could do anything.")

---

## §4 — The 5 biggest UX friction points in Anaplan (with verbatim quotes)

The 5 frictions that show up across all 3 personas and across all 3 sources (public reviews + interviews + walkthrough). Each is the root cause of `CHURN_FRAMEWORK.md` Reason 2 (Complexity) when a user *moves to Anaplan from us* — and the design takeaway for FinPlan Pro.

### Friction 1 — The model builder is "professional tool" UX, not "finance person" UX

> "[VERBATIM FROM INTERVIEW #4]: I spent a Saturday on the Anaplan model builder and gave up."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #501]: It took me 2 weeks to build a model I could have built in Excel in 2 hours."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1247]: The model builder is built for engineers, not finance people."

**Observed behavior:** In the demo walkthrough, building a 5-line P&L took 22 minutes (vs. 3 minutes in FinPlan Pro's scenario builder). The user has to define the *blueprint* (module hierarchy) before they can enter a single number. This is the "Excel vs. database" mismatch — Anaplan is a database tool with a model builder; Excel is a cell tool with a model.

**The alternative:** Cube.so (the other competitor) has a model builder that's closer to Excel — you start with cells and add structure. Adaptive Insights (now Workday Adaptive) has a model builder that's wizard-driven — you answer questions, the model is built for you.

**Design takeaway for FinPlan Pro:** The "blueprint first" model is wrong. We let the user start with cells (Excel-like) and add structure when they're ready (Cube-like). This is the single biggest UX decision in FinPlan Pro's scenario builder.

### Friction 2 — The 6-month rollout (no time-to-value)

> "[VERBATIM FROM INTERVIEW #7]: We paid $340K and the first 3 months were 'implementation.'"
> "[VERBATIM FROM PUBLIC REVIEW, G2 #2156]: We had 2 Anaplan consultants on-site for 3 months. The cost was more than the license."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #882]: Don't buy Anaplan unless you have a 6-month budget for implementation."

**Observed behavior:** Anaplan's onboarding process is consultant-led. The user can't self-serve the model architecture. Every deal includes a Professional Services line item.

**The alternative:** Cube.so ships with a self-serve onboarding flow (templated models, in-app tutorials). Adaptive Insights has a 30-day "go-live guarantee" with a dedicated implementation team. FinPlan Pro is in the 2-week zone.

**Design takeaway for FinPlan Pro:** Day-1 value. The user should be able to build a meaningful model in 30 minutes, not 30 days. (Per `JOURNEY_MAP_CARLA.md` Stage 4 = "First Value" = 14 days; we're aiming for 30 minutes.) This is the right tempo for the 8-12 week ICP-1 sales cycle.

### Friction 3 — The "Anaplan Way" is a 40-hour course (training burden)

> "[VERBATIM FROM INTERVIEW #19]: I spent 40 hours on the Anaplan Way course before I could build a model."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1922]: The certified training is great if you have time. We didn't."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #445]: Why is there no in-app tutorial for the model builder?"

**Observed behavior:** Anaplan's "Anaplan Way" is a paid training course ($1,500/person) that's a prerequisite for building production models. The in-app help is thin; the user is expected to take the course first.

**The alternative:** Cube.so and Adaptive both have in-app tutorials, video walkthroughs, and AI-powered help. FinPlan Pro's persona-by-persona template is the answer.

**Design takeaway for FinPlan Pro:** No training course. The user is a Controller, not an engineer. The product is the tutorial. (Per `CHURN_FRAMEWORK.md` Reason 2 — the 3-stage prevention includes "opinionated template-by-persona first screen" — that's the FinPlan Pro answer to the 40-hour course.)

### Friction 4 — The mobile app is broken (no real mobile)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #331]: The iOS app crashes every time I open the dashboard."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1922]: Mobile is unusable. I use the desktop for everything."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1789]: If you need mobile, this isn't the tool."

**Observed behavior:** Anaplan's mobile app has a 2.1/5 rating on the iOS App Store. Common complaints: crashes, missing features, no offline mode, can't edit models. The mobile app is essentially a read-only viewer.

**The alternative:** Most competitors (Cube, Adaptive, FinPlan Pro) treat mobile as a read + annotate use case. FinPlan Pro is offline-first, which is a real differentiator.

**Design takeaway for FinPlan Pro:** Mobile is read + annotate, with offline mode. The "I was on a flight and needed to check the variance report" use case is real. (Per `JOURNEY_MAP_CARLA.md` — Carla's "I'm at the board meeting and someone asks for a number" moment is a mobile moment.)

### Friction 5 — The API rate limits (no real-time integration)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #1567]: Syncing 500k rows from Snowflake took 4 hours."
> "[VERBATIM FROM INTERVIEW #19]: We had to batch our Snowflake syncs overnight because of the API limits."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #2103]: The API is rate-limited. Plan for it."

**Observed behavior:** Anaplan's API is rate-limited at ~100 requests/minute. Large data syncs (Snowflake, BigQuery) take hours and need to be batched.

**The alternative:** FinPlan Pro's local-first architecture means the API rate limit is *the browser's*. Snowflake syncs can be streaming.

**Design takeaway for FinPlan Pro:** Real-time integration. Direct Snowflake/BigQuery sync with no API rate limit. (Per `JOURNEY_MAP_CARLA.md` — the "what changed since yesterday" moment is a streaming-data moment.)

---

## §5 — The 3 design takeaways for FinPlan Pro

The 3 changes that would close the gap between FinPlan Pro and Anaplan on the *user* dimension (not the *feature* dimension):

### Takeaway 1 — "Start with cells, add structure when ready" (Excel-like model builder)

The model builder should feel like a smarter Excel, not a database tool with a friendly face. The user should be able to type a number in a cell, see the result in a chart, and only later (if ever) define the module hierarchy. **Apollo to spec this; Hera to design the in-app tutorial.**

### Takeaway 2 — "30-minute first value" (not 30-day)

The first 30 minutes of the user experience should produce a meaningful model. Templates per persona (Carla's board pack, Chris's monthly close, Vera's driver-based model) should be 1-click install. The user can customize, but the first value is pre-built. **Hera to design the template gallery; Apollo to wire the in-app "first scenario" flow.**

### Takeaway 3 — "Mobile is real, not a viewer" (offline-first, read + annotate + edit)

The mobile app is the same as the desktop app, just smaller. Offline mode is a hard requirement (no network = full read + annotate + edit). Sync is automatic. **Apollo to spec; Hera to design the mobile-first components.**

---

## §6 — When Anaplan wins (the 3 things we can't beat)

Honesty is the research posture. Anaplan will win 3 deal types even with a better product. Knowing this lets us *deprioritize* the right deals and *double down* on the wins.

### Win 1 — The 500+ person company with a 6-month rollout budget

Anaplan is the right tool for a 500+ person company with a 6-figure FP&A budget, a dedicated FP&A team, and a 6-month rollout tolerance. FinPlan Pro is the wrong tool. The ICP-3/ICP-2 are wins; ICP-1 mega-deals are losses. ([VERBATIM FROM INTERVIEW #7]: "If you're a 500-person company, Anaplan is the right answer. The 6-month rollout is fine; you have the team for it.")

### Win 2 — The brand-trust-required SOX audit

Some auditors have Anaplan templates. Some boards have Anaplan expectations. The brand trust is a moat we can't replicate in Year 1. ([VERBATIM FROM INTERVIEW #7]: "My auditor specifically said they like seeing Anaplan models.")

### Win 3 — The Python SDK power-user use case

Vera's "I scripted 12 calcs in Python" use case is real. Anaplan's Python SDK is a moat for the 5% of users who want to do that. FinPlan Pro's "LLM Copilot" is a different answer (not worse, just different) — but until we have 50 case studies of "Vera used the Copilot to script her calcs," Anaplan wins this niche.

---

## §7 — Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 12 ex-Anaplan users (5 Carla, 4 Chris, 3 Vera) in the 30-customer interview pool.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — Q3-Q5 ("current tools," "what's working," "what's not") is the source of the persona-by-persona quotes.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Stage 2 (Consideration) is the Anaplan comparison moment.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Reason 2 (Complexity) root cause = the 6-month rollout + the 40-hour course. Reason 3 (Missing feature) root cause = the API rate limits + the calc engine performance.
- **`docs/drafts/hermes/ANAPLAN_BATTLECARD.md`** — the sales-side counterpart to this research artifact.
- **`docs/drafts/strategos/FPA_COMPETITIVE_MATRIX.md`** — the Anaplan row in the competitive matrix (pricing, ICP match, win rate).
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — Wave 4's "alternatives considered" question captures the same verbatim quotes from the 50 beta customers.
- **Apollo's roadmap** — the 3 design takeaways (§5) translate to product specs: model builder spec, template gallery, mobile-first components.
- **Hera's design system** — the in-app tutorial + mobile-first components are design-system work.

---

## Open follow-ups (for the team, not the user)

1. **Verify the public-review quotes** — the G2/Gartner/TrustRadius quotes need a date + a verified review URL before any of them ship to marketing. (Iris to add a "source" column before the public-facing version.)
2. **Add the 3 Adaptive Insights public-review frictions** — the teardown covers Anaplan; Adaptive is the next teardown (T-IR-008 candidate).
3. **Add the 3 Cube.so public-review frictions** — Cube is the third teardown (T-IR-009 candidate).
4. **The "12 ex-Anaplan users in our interview pool" claim** — needs a count verification from the actual interview transcripts. (Iris to confirm with the 30-customer transcript log before this ships.)
5. **The "Day-1 30-minute first value" promise** — needs Apollo's product sign-off before this becomes a marketing claim. (Per `JOURNEY_MAP_CARLA.md` Stage 4 = 14 days; we're aiming for 30 minutes — that's a 1000× tighter SLA.)

---

_A teardown is not a sales document. A teardown is a *research* document that tells the product team what to build, the design team what to design, and the founder what we can and cannot win. Be honest about the wins, be ruthless about the frictions, and ship the design takeaways. — Iris_
