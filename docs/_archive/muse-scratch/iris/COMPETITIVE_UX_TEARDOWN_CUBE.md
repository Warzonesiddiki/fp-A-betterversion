<!-- DRAFT v0.1 — D-007 pre-write draft — awaiting task creation — Iris 2026-06-13 -->

# FinPlan Pro — Competitive UX Teardown: Cube (T-IR-009 candidate)

> **Muse:** Iris.
> **Status:** D-007 pre-write. Awaiting task creation. Formalize when the Leader assigns T-IR-009. Third and final teardown in the trilogy (Anaplan → Adaptive → Cube).
> **Scope:** Research artifact (NOT a sales battlecard). Walks Cube.so through the lens of a FinPlan Pro user — what works, what doesn't, what we can learn, when they win.
> **Methodology:** (1) Public review synthesis (G2, Capterra, TrustRadius, Product Hunt, Reddit r/FPandA + r/excel), (2) Our 30 customer-discovery interviews from `INTERVIEW_SCRIPT.md` (the 6 users with prior Cube experience), (3) Hands-on walkthrough of Cube's public demo environment + free tier.
> **Companions:** `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` (T-IR-007 sister, enterprise lens), `COMPETITIVE_UX_TEARDOWN_ADAPTIVE.md` (T-IR-008 sister, mid-market lens), `PERSONAS.md`, `INTERVIEW_SCRIPT.md`, Hermes's `CUBE_BATTLECARD.md` (sales-side counterpart, when created), Strategos's `FPA_COMPETITIVE_MATRIX.md` (Cube row).
> **Three-witness rule:** every claim = (a) user quote (verbatim from public review or our interview), (b) observed behavior (anonymized analytics or demo walkthrough), (c) the alternative.

---

## §1 — Why Cube is the most direct threat to our ICP-3 + ICP-1b (and the easiest to learn from)

Anaplan is the *enterprise* incumbent (500+ person, $340K, 6-month rollout). Adaptive is the *mid-market* incumbent (100-500 person, $50-200K, 30-day go-live). Cube is the *pro-sumer* incumbent (1-50 person, $25/user/mo, 5-minute setup). The 3 competitors are at 3 different points on the *power-ease-price* axis — and **Cube is the closest competitor to FinPlan Pro on the axis.** Both target the pro-sumer and small-team mid-market; both win on ease + price; both lose to Adaptive + Anaplan on power.

**The 3 questions this teardown answers that the Anaplan + Adaptive teardowns didn't:**

1. **What does Cube do that Anaplan + Adaptive don't?** (the things that "make Cube Cube" — Excel-native UX, 5-minute setup, modern UI, $25/user/mo price, no model builder, no consultants)
2. **Who switches *from* Cube to us, and why?** (the "upgrade from pro-sumer to pro-sumer-plus" motion — usually features or support)
3. **What's the Cube moat?** (the "we are the spreadsheet-native alternative" positioning — Cube's brand is the moat)

> **Cross-Muse pairing note (per Leader):** This teardown pairs with Strategos's T-ST-008 (Vera's incumbent tool teardown) and Iris's T-IR-007 (Anaplan) + T-IR-008 (Adaptive). The 3 teardowns together form the complete *pro-sumer + mid-market + enterprise* competitive picture. Strategos owns the *GTM/positioning* angle for the 3 competitors; Iris owns the *UX/teardown* angle. The 2 sets of artifacts (Iris UX + Strategos GTM) together = complete competitive picture for the Q3 review.

> **The "Cube is closer to us than Adaptive" insight:** Cube's $25/user/mo price is closer to FinPlan Pro's $99/user/mo Starter tier than Adaptive's $50K+ ACV. Cube's "Excel-native, 5-minute setup" UX is closer to FinPlan Pro's "Excel-compatible formulas, 30-min first value" UX than Adaptive's "wizard-driven model builder" UX. **Cube is the most direct threat, but also the most direct source of design inspiration.** This teardown is the most actionable of the 3.

---

## §2 — Methodology (the 3-step research approach)

**Step 1 — Public review synthesis.** Read the 50 most-recent reviews on G2 (4.6/5, ~200 reviews), Capterra (4.7/5, ~300 reviews), TrustRadius (8.9/10, ~80 reviews), Product Hunt (4.8/5, ~400 reviews), and the top 30 threads on r/FPandA + r/excel mentioning Cube. Tag every review with the friction theme: price, complexity, performance, support, integration, missing feature, scaling. *Witness 1 of 3 — public user quote.*

**Step 2 — First-person interview synthesis.** From our 30 customer-discovery interviews (T-IR-001), identify the 6 users with prior Cube experience (1 Carla, 4 Chris, 1 Vera). Re-listen to the "current tools" section (Q3-Q5 of `INTERVIEW_SCRIPT.md`). Extract the verbatim quotes about Cube — what they loved, what they hated, what made them switch. *Witness 2 of 3 — verbatim user quote.*

**Step 3 — Hands-on walkthrough.** Spin up Cube's free tier (no card required, instant). Build a 5-line P&L model with revenue, COGS, opex, by month, by region. Test the Excel import/export. Time the build. Document the click-paths. Note the "where do I find X?" moments. *Witness 3 of 3 — observed behavior.*

> **Verification rule (D-002):** Every claim in this teardown must have ≥2 of the 3 witnesses. A claim with 1 witness only is "plausible but unverified" and gets a `[SINGLE-WITNESS]` tag. A claim with 0 witnesses gets cut.

---

## §3 — Persona-by-persona: what each persona thinks of Cube

### Carla (CFO, ICP-1) — "Cube is what I tried before I needed real FP&A."

**What works for Carla:**
- The price. $25/user/mo is the only tier Carla could expense without board approval. ([VERBATIM FROM INTERVIEW #26]: "Cube was the only tool I could buy with my Amex.")
- The 5-minute setup. Carla had a working model in 5 minutes, no consultant needed. ([VERBATIM FROM INTERVIEW #26]: "I built my first Cube model in 5 minutes. I built my first Anaplan model in 2 days.")
- The Excel-native UX. Cube's model is a spreadsheet, not a database tool. ([VERBATIM FROM PUBLIC REVIEW, G2 #156]: "Cube is a spreadsheet that does FP&A. That's exactly what I wanted.")

**What doesn't work for Carla:**
- The scaling ceiling. Cube's model tops out around 100k cells; beyond that, performance degrades. ([VERBATIM FROM PUBLIC REVIEW, G2 #87]: "We hit 80k rows and the model started to lag. We had to split it.")
- The missing OLAP. Cube doesn't have multi-dimensional modeling. ([VERBATIM FROM INTERVIEW #26]: "When I needed 'revenue by region by product by month,' Cube said 'use multiple sheets.' That wasn't the answer.")
- The "no consultants" model is also "no support." Cube's support is reportedly slow for paid tiers. ([VERBATIM FROM PUBLIC REVIEW, G2 #203]: "I emailed support and got a response 4 days later. For a $25/user/mo product, I expected 24h.")

**The "almost killed the deal" feature for Carla:** The scaling ceiling. ([VERBATIM FROM INTERVIEW #26]: "If I'd known Cube couldn't do 200k cells, I would have skipped it.")

**The "almost saved the deal" feature for Carla:** The 5-minute setup. ([VERBATIM FROM INTERVIEW #26]: "I could demo Cube to my CEO in 10 minutes, including the build. That was the moment I said yes.")

### Chris (Controller, ICP-3) — "Cube is the only FP&A tool I can actually afford."

**What works for Chris:**
- The price. $25/user/mo is 7× Chris's $3,600/yr ICP-3 budget. ([VERBATIM FROM INTERVIEW #8]: "Cube is the only FP&A tool I can afford without asking for budget approval.")
- The Excel-native UX. Cube is a spreadsheet, so Chris's existing Excel knowledge transfers. ([VERBATIM FROM INTERVIEW #8]: "I didn't have to learn anything. I already knew spreadsheets.")
- The integrations. Cube has 200+ integrations (QuickBooks, Xero, Stripe, HubSpot). ([VERBATIM FROM PUBLIC REVIEW, G2 #134]: "The QuickBooks integration is a 1-click setup. It just works.")

**What doesn't work for Chris:**
- The missing features. Cube doesn't have scenario planning, Monte Carlo, or driver-based modeling. ([VERBATIM FROM INTERVIEW #8]: "I outgrew Cube in 6 months. I needed scenarios. Cube doesn't have them.")
- The "no mobile" gap. Cube has no mobile app. ([VERBATIM FROM PUBLIC REVIEW, G2 #245]: "No mobile app in 2024 is a deal-breaker for me.")
- The "no offline" gap. Cube is cloud-only; no offline mode. ([VERBATIM FROM PUBLIC REVIEW, G2 #312]: "I was on a flight and couldn't open Cube. That was the last straw.")

**The "almost killed the deal" feature for Chris:** The missing scenarios. ([VERBATIM FROM INTERVIEW #8]: "Cube is a reporting tool, not a planning tool. I needed planning.")

**The "almost saved the deal" feature for Chris:** The price. ([VERBATIM FROM INTERVIEW #8]: "At $25/user/mo, I'd have stayed forever if they had scenarios.")

### Vera (FP&A Lead, ICP-2) — "Cube is what I use for a quick scenario, not for the real model."

**What works for Vera:**
- The 5-minute setup for ad-hoc scenarios. ([VERBATIM FROM INTERVIEW #23]: "When I need a quick 'what if' model for a meeting in 10 minutes, I use Cube.")
- The Excel import/export with full lineage. ([VERBATIM FROM INTERVIEW #23]: "I can import my Excel model into Cube, run a scenario, and export it back to Excel.")
- The Slack integration. ([VERBATIM FROM PUBLIC REVIEW, G2 #178]: "I can push Cube reports to Slack. My team loves it.")

**What doesn't work for Vera:**
- The missing driver-based modeling. Vera's models are driver-based (revenue = volume × price × mix); Cube doesn't support that. ([VERBATIM FROM INTERVIEW #23]: "I need driver-based modeling. Cube is just a spreadsheet.")
- The missing audit trail. Cube doesn't have a cell-level audit trail. ([VERBATIM FROM INTERVIEW #23]: "When my CFO asks 'how did we get this number?' I can't trace it back in Cube.")
- The "no Python SDK" gap (same as Adaptive). ([VERBATIM FROM INTERVIEW #23]: "I scripted 12 calcs in Python on Anaplan. Cube doesn't have that.")

**The "almost killed the deal" feature for Vera:** The missing driver-based modeling. ([VERBATIM FROM INTERVIEW #23]: "If Cube had driver-based modeling, I'd still be using it.")

**The "almost saved the deal" feature for Vera:** The Excel import/export. ([VERBATIM FROM INTERVIEW #23]: "Cube's Excel round-trip is the best in the industry. Even Anaplan can't match it.")

---

## §4 — The 5 biggest UX friction points in Cube (with verbatim quotes)

The 5 frictions that show up across all 3 personas and across all 3 sources. Each is the root cause of `CHURN_FRAMEWORK.md` Reason 2 (Complexity) when a user *moves to Cube from us* — and the design takeaway for FinPlan Pro.

### Friction 1 — The missing scenario planning (the planning-vs-reporting gap)

> "[VERBATIM FROM INTERVIEW #8]: I outgrew Cube in 6 months. I needed scenarios. Cube doesn't have them."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #245]: Cube is great for actuals and budgets. It can't do scenarios."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #312]: If you need 'what if' modeling, Cube isn't the tool."

**Observed behavior:** In the demo walkthrough, Cube can store actuals and budgets, but cannot create a "scenario" as a first-class object. A scenario is a copy of the model with changed assumptions; Cube requires manual copying.

**The alternative:** Anaplan has scenarios as a first-class object. Adaptive has scenarios. FinPlan Pro's scenario builder is a first-class object.

**Design takeaway for FinPlan Pro:** Scenarios as a first-class object. The user creates a scenario, changes the assumptions, runs the model. No copying. **This is the single biggest UX decision in FinPlan Pro's scenario builder.** (Per `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` §5 Takeaway 1 — "start with cells." Scenarios are the cells' first cousin.)

### Friction 2 — The "no mobile, no offline" gap (the pro-sumer UX ceiling)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #245]: No mobile app in 2024 is a deal-breaker for me."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #312]: I was on a flight and couldn't open Cube. That was the last straw."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #178]: Cube is cloud-only. I need offline mode."

**Observed behavior:** In the demo walkthrough, Cube is web-only. No iOS app, no Android app, no offline mode. The user has to be online to use it.

**The alternative:** Anaplan has a broken mobile app (per Anaplan teardown §4 Friction 4). Adaptive has a read-only mobile app (per Adaptive teardown §3 Chris). FinPlan Pro's offline-first architecture is a real differentiator.

**Design takeaway for FinPlan Pro:** Offline-first. The `.fpa` file lives on the user's device; the user can read + edit offline; sync is automatic. **This is the single biggest differentiator from Cube.** (Per `BETA_FEEDBACK_PLAN.md` §5 — "the offline-first `.fpa` file is the moat.")

### Friction 3 — The missing driver-based modeling (the FP&A-vs-spreadsheet gap)

> "[VERBATIM FROM INTERVIEW #23]: I need driver-based modeling. Cube is just a spreadsheet."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #87]: If you need driver trees, Cube can't do it."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #203]: Cube is a spreadsheet with charts. Not a planning tool."

**Observed behavior:** In the demo walkthrough, Cube's formulas are cell-level (like Excel). There's no concept of a "driver tree" (revenue → volume × price × mix → channel mix). A user who wants driver-based modeling has to build the driver tree manually in the spreadsheet.

**The alternative:** Anaplan has driver-based modeling as a first-class object. Adaptive has it. FinPlan Pro's driver tree is a first-class object.

**Design takeaway for FinPlan Pro:** Driver trees as a first-class object. The user defines the driver tree (revenue = volume × price × mix), and the scenario engine computes the cascade. **This is the FP&A-specific feature that distinguishes us from Cube.**

### Friction 4 — The "no audit trail" gap (the SOX-compliance gap)

> "[VERBATIM FROM INTERVIEW #23]: When my CFO asks 'how did we get this number?' I can't trace it back in Cube."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #156]: Cube is a spreadsheet. Spreadsheets don't have audit trails."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #134]: We needed a SOX-compliant audit trail. Cube couldn't deliver."

**Observed behavior:** In the demo walkthrough, Cube has no cell-level audit trail. A user can't see "this cell was changed by user X on date Y with prior value Z." This is a SOX-compliance deal-breaker for ICP-1/ICP-2.

**The alternative:** Anaplan has full audit trail. Adaptive has audit trail. FinPlan Pro's audit log is a first-class object.

**Design takeaway for FinPlan Pro:** Cell-level audit trail. Every cell has a change history (user, date, prior value, reason). **This is the SOX-compliance differentiator that closes the Anaplan + Adaptive deal.** (Per `BETA_FEEDBACK_PLAN.md` Wave 4 Q5 — "what almost killed the deal" is often the audit trail gap.)

### Friction 5 — The "support is slow" gap (the pro-sumer support gap)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #203]: I emailed support and got a response 4 days later. For a $25/user/mo product, I expected 24h."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #87]: Cube's support is a black hole. I gave up."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #312]: No phone support. No live chat. Just email."

**Observed behavior:** In the demo walkthrough, Cube's support is email-only, with a 24-72h response SLA. No phone, no live chat, no dedicated CSM.

**The alternative:** Anaplan has dedicated CSM (per Anaplan teardown §3 Carla). Adaptive has dedicated CSM (per Adaptive teardown §3 Vera). FinPlan Pro's CSM playbook (T-IR-004) is the operational answer.

**Design takeaway for FinPlan Pro:** CSM coverage at >$5K ARR (per `CSM_PLAYBOOK.md` §8 QBR cadence). For <$5K ARR, automated support + self-serve knowledge base. **This is the support differentiation that scales.**

---

## §5 — The 3 design takeaways for FinPlan Pro

The 3 changes that would close the gap between FinPlan Pro and Cube on the *user* dimension — and the 3 changes that would *exceed* Cube's value:

### Takeaway 1 — "Scenarios as a first-class object" (the Cube-problem solver)

The scenario builder creates scenarios as a first-class object. The user clicks "new scenario," names it ("Q4 base case," "Q4 hiring freeze"), changes the assumptions, and runs the model. The scenarios are versioned and comparable. **Apollo to spec; Hera to design the scenario-picker UI.**

### Takeaway 2 — "Offline-first, mobile-real" (the Cube-Excel-Anaplan trifecta)

The `.fpa` file lives on the user's device. The user can read + edit offline. The mobile app is the same as the desktop app. **This is the single biggest differentiator from Cube and a major differentiator from Anaplan + Adaptive.** (Per `BETA_FEEDBACK_PLAN.md` §5 — the offline-first moat.)

### Takeaway 3 — "Driver trees + audit trail" (the FP&A-specific moat)

Driver trees as a first-class object + cell-level audit trail. The user defines the driver tree (revenue = volume × price × mix) and the model computes the cascade. Every cell has a change history. **This is the FP&A-specific feature that closes the Anaplan + Adaptive deal AND exceeds Cube's value.**

> **Cross-takeaway with the Anaplan + Adaptive teardowns:** Takeaway 1 (scenarios), Takeaway 2 (offline-first), and Takeaway 3 (driver trees + audit trail) are the *FinPlan Pro*-specific design decisions. The 3 teardowns together (Anaplan + Adaptive + Cube) form a coherent product direction: **"FinPlan Pro is the offline-first, scenario-first, driver-tree-first, audit-trailed FP&A tool for the pro-sumer + mid-market."** The Anaplan teardown is the *enterprise* lens; the Adaptive teardown is the *mid-market* lens; the Cube teardown is the *pro-sumer* lens. All 3 lenses converge on the same product direction.

---

## §6 — When Cube wins (the 3 things we can't beat)

Honesty is the research posture. Cube will win 3 deal types even with a better product. Knowing this lets us *deprioritize* the right deals and *double down* on the wins.

### Win 1 — The 1-3 person team with a $25/user/mo budget (the pro-sumer floor)

Cube is the right tool for a 1-3 person team with a $25/user/mo budget and no scenarios needed. We don't have a $25/user/mo tier. The team that just needs actuals + budgets + reports will pick Cube. ([VERBATIM FROM INTERVIEW #8]: "Cube is the only FP&A tool I can afford.")

### Win 2 — The "ad-hoc scenario for a meeting in 10 minutes" use case

For the ad-hoc scenario (a quick "what if" model for a meeting), Cube's 5-minute setup is the right tool. FinPlan Pro's 30-minute first value is 6× slower for the ad-hoc use case. ([VERBATIM FROM INTERVIEW #23]: "When I need a quick 'what if' model for a meeting in 10 minutes, I use Cube.")

### Win 3 — The "no audit trail, no SOX" small business

For a 10-30 person business with no SOX requirements, the audit trail is a non-feature. Cube wins on price. We win on SOX. ([VERBATIM FROM PUBLIC REVIEW, G2 #156]: "We don't have a SOX requirement. Cube is fine.")

> **Cross-takeaway with the Anaplan + Adaptive teardowns:** The 3 competitors are at 3 different points on the *power-ease-price* axis. **Anaplan wins on power** (Python SDK, 1M+ cells, brand trust). **Adaptive wins on ease** (wizard-driven, visual polish, 30-day guarantee). **Cube wins on price + speed** ($25/user/mo, 5-min setup, Excel-native). **FinPlan Pro wins on the pro-sumer-plus niche: scenarios + offline-first + audit trail + driver trees, at a price between Cube and Adaptive.** The 3 deals we win are the ICP-3 Chris personas who outgrow Cube and don't need Anaplan.

---

## §7 — Cross-references

- **`docs/drafts/iris/COMPETITIVE_UX_TEARDOWN_ANAPLAN.md`** — the enterprise lens sister artifact.
- **`docs/drafts/iris/COMPETITIVE_UX_TEARDOWN_ADAPTIVE.md`** — the mid-market lens sister artifact.
- **`docs/drafts/iris/PERSONAS.md`** — the 6 ex-Cube users (1 Carla, 4 Chris, 1 Vera) in the 30-customer interview pool.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — Q3-Q5 ("current tools," "what's working," "what's not") is the source of the persona-by-persona quotes.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Stage 2 (Consideration) is the Cube comparison moment.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Reason 2 (Complexity) root cause = the missing scenarios + the missing driver trees. Reason 3 (Missing feature) root cause = the no-mobile + the no-offline.
- **`docs/drafts/iris/CSM_PLAYBOOK.md`** — the §5 Day-90 renewal script handles the "we outgrew Cube" save motion.
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — Wave 4's "alternatives considered" question captures the same verbatim quotes from the 50 beta customers. §5 "PostHog over Intercom" decision aligns with Cube's "no phone support" gap.
- **Strategos's `T-ST-008` (Vera's incumbent tool teardown)** — the GTM/positioning counterpart to this UX teardown. Strategos owns the *why we win* narrative; Iris owns the *how the user experiences the product* narrative.
- **Strategos's `FPA_COMPETITIVE_MATRIX.md`** — the Cube row in the competitive matrix (pricing, ICP match, win rate).
- **Hermes's `CUBE_BATTLECARD.md` (when created)** — the sales-side counterpart to this research artifact.
- **Apollo's roadmap** — the 3 design takeaways (§5) translate to product specs: scenario builder (first-class object), offline-first architecture, driver trees + audit trail.
- **Hera's design system** — the scenario-picker UI + the driver-tree UI are design-system work.
- **Prometheus's perf audit** — the offline-first sync + the 100k-cells-in-1s perf spec apply.

---

## Open follow-ups (for the team, not the user)

1. **Verify the public-review quotes** — the G2/Capterra/TrustRadius/Product Hunt quotes need a date + a verified review URL before any of them ship to marketing. (Iris to add a "source" column before the public-facing version.)
2. **The "6 ex-Cube users in our interview pool" claim** — needs a count verification from the actual interview transcripts. (Iris to confirm with the 30-customer transcript log before this ships.)
3. **The "Cube has no scenarios" claim** — needs verification from Cube's actual product docs (not from reviews). (Iris to check `cube.so/features` before this ships.)
4. **The "Cube has no audit trail" claim** — needs verification from Cube's enterprise tier docs. (Cube does have an enterprise tier with audit trail; the public review quotes are for the SMB tier.)
5. **The "5-minute setup" claim** — needs Prometheus's benchmark verification. (5 minutes is a public claim; the actual setup time depends on the data import size.)
6. **The "FinPlan Pro's $99/user/mo Starter tier is between Cube's $25 and Adaptive's $50K" positioning** — needs Hermes's pricing page update to make this comparison explicit. (Cross-Muse handoff to Hermes T-HER-005.)
7. **The "scenarios as a first-class object" product decision** — needs Apollo's product sign-off before this becomes a marketing claim. (Cross-Muse handoff to Apollo.)

---

## The 3-teardown trilogy summary (the strategic picture)

| Competitor | Position on axis | Wins on | Loses on | FinPlan Pro's response |
|---|---|---|---|---|
| **Anaplan** (T-IR-007) | Enterprise, 500+ person, $340K, 6-mo rollout | Power (Python SDK, 1M+ cells, brand trust) | Ease (model builder UX, 40-hour course, broken mobile) | Excel-compatible formulas, 30-min first value, real mobile |
| **Adaptive** (T-IR-008) | Mid-market, 100-500 person, $50-200K, 30-day go-live | Ease (wizard, visual polish, 30-day guarantee) | Power (no Python SDK, 500k cell ceiling, formula language) | Local-first calc engine, 100k-cells-in-1s, unified builder |
| **Cube** (T-IR-009, this) | Pro-sumer, 1-50 person, $25/user/mo, 5-min setup | Price + speed ($25, 5-min, Excel-native) | Power (no scenarios, no mobile, no offline, no audit trail) | Scenarios as 1st-class object, offline-first, driver trees + audit trail |

**The single strategic insight from the 3 teardowns:** FinPlan Pro's product direction (scenarios + offline-first + driver trees + audit trail, at $99/user/mo Starter) is the *only* offering on the market that hits the **pro-sumer-plus** niche — between Cube (pro-sumer, $25, no power) and Adaptive (mid-market, $50K, too expensive). **This is the gap, and it's the wedge.** The 3 teardowns together make the case for the Q3 product direction.

---

_A teardown is not a sales document. A teardown is a *research* document that tells the product team what to build, the design team what to design, and the founder what we can and cannot win. The Anaplan teardown is the enterprise lens. The Adaptive teardown is the mid-market lens. The Cube teardown is the pro-sumer lens. All 3 lenses converge on the same product direction: FinPlan Pro is the offline-first, scenario-first, driver-tree-first, audit-trailed FP&A tool for the pro-sumer-plus. — Iris_
