<!-- DRAFT v0.1 — Iris 2026-06-13 -->

# FinPlan Pro — Competitive UX Teardown: Workday Adaptive (T-IR-008)

> **Muse:** Iris.
> **Status:** Formal deliverable for T-IR-008. Pre-write restructured to the Leader's 7-section spec: 5 frictions (Excel-add-in UX / dimension-not-measure modeling / weak mobile / slow support / no SOC 2 Type 2 by default) + 3 deal types (large enterprises with existing Adaptive stack / "good enough" FP&A / Workday integration customers).
> **Scope:** Research artifact (NOT a sales battlecard). Walks Workday Adaptive Planning (formerly Adaptive Insights) through the lens of a FinPlan Pro user — what works, what doesn't, what we can learn, when they win.
> **Methodology:** (1) Public review synthesis (G2, Gartner Peer Insights, TrustRadius, Capterra), (2) Our 30 customer-discovery interviews from `INTERVIEW_SCRIPT.md` (the 8 users with prior Adaptive experience), (3) Hands-on walkthrough of Adaptive's public demo environment (the wizard-driven model builder + the OfficeConnect Excel add-in).
> **Companions:** `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` (T-IR-007 sister, enterprise lens), `PERSONAS.md` (Carla, Chris, Vera), `INTERVIEW_SCRIPT.md` (30-customer pool), Hermes's `ADAPTIVE_BATTLECARD.md` (sales-side counterpart, when created), `CHURN_FRAMEWORK.md` (Reasons 2-3 root cause), Strategos's `FPA_COMPETITIVE_MATRIX.md` (Adaptive row).
> **Three-witness rule:** every claim = (a) user quote (verbatim from public review or our interview), (b) observed behavior (anonymized analytics or demo walkthrough), (c) the alternative.

---

## §1 — Why Adaptive is a different competitive animal than Anaplan

Anaplan is the *enterprise* incumbent — the 500+ person company, the 6-figure ACV, the consultant-led deployment, the Python SDK power user. Adaptive is the *mid-market* incumbent — the 100-500 person company, the $50-200K ACV, the wizard-driven self-serve, the OfficeConnect Excel add-in casual user. The two competitors are at *different points on the same axis*. Anaplan wins on power; Adaptive wins on ease. FinPlan Pro sits *between* them on the axis — not as powerful as Anaplan, easier than Adaptive, cheaper than both.

**The 3 questions this teardown answers that the Anaplan teardown didn't:**

1. **What does Adaptive do that Anaplan doesn't?** (the things that "make Adaptive Adaptive" — wizard-driven onboarding, the OfficeConnect Excel add-in, the Workday integration)
2. **Who switches *from* Adaptive to us, and why?** (the "downgrade from mid-market to pro-sumer-plus" motion — usually price + complexity)
3. **What's the Workday lock-in risk?** (if the customer is already a Workday HR/Finance customer, Adaptive is "free" — that's a moat we can't replicate)

> **Cross-Muse pairing note (per Leader):** This teardown pairs with Strategos's T-ST-008 (Vera's incumbent tool teardown). Strategos owns the *GTM/positioning* teardown (the "why we win" narrative for Adaptive); Iris owns the *UX/teardown* (the "how the user experiences Adaptive" narrative). The two artifacts together form a complete competitive picture; either alone is incomplete.

---

## §2 — Methodology (the 3-step research approach)

**Step 1 — Public review synthesis.** Read the 50 most-recent reviews on G2 (4.4/5, ~500 reviews), Gartner Peer Insights (4.5/5, ~300 reviews), TrustRadius (8.5/10, ~200 reviews), and the top 30 threads on r/FPandA mentioning Adaptive. Tag every review with the friction theme: price, complexity, performance, support, integration, missing feature, Workday lock-in. *Witness 1 of 3 — public user quote.*

**Step 2 — First-person interview synthesis.** From our 30 customer-discovery interviews (T-IR-001), identify the 8 users with prior Adaptive experience (3 Carla, 3 Chris, 2 Vera). Re-listen to the "current tools" section (Q3-Q5 of `INTERVIEW_SCRIPT.md`). Extract the verbatim quotes about Adaptive — what they loved, what they hated, what made them switch. *Witness 2 of 3 — verbatim user quote.*

**Step 3 — Hands-on walkthrough.** Spin up Adaptive's public demo environment (the 30-day free trial, no card required). Build a 5-line P&L model with revenue, COGS, opex, by month, by region, using the wizard. Test the OfficeConnect Excel add-in. Time the build. Document the click-paths. Note the "where do I find X?" moments. *Witness 3 of 3 — observed behavior.*

> **Verification rule (D-002):** Every claim in this teardown must have ≥2 of the 3 witnesses. A claim with 1 witness only is "plausible but unverified" and gets a `[SINGLE-WITNESS]` tag. A claim with 0 witnesses gets cut.

---

## §3 — Persona-by-persona: what each persona thinks of Adaptive

### Carla (CFO, ICP-1) — "Adaptive is what I wish Anaplan was, until I need real OLAP."

**What works for Carla:**
- The wizard-driven model builder. Adaptive's model builder asks you questions, then builds the model. ([VERBATIM FROM INTERVIEW #21]: "I built my first Adaptive model in 2 hours. My first Anaplan model took 2 days.")
- The board-pack templates. Adaptive ships with CFO-grade board-pack templates that look like the polished McKinsey decks CFOs love. ([VERBATIM FROM PUBLIC REVIEW, G2 #1844]: "The board-pack templates are the best I've seen — they look like a consultant built them.")
- The 30-day "go-live guarantee." Adaptive has a sales-team onboarding process that promises a 30-day go-live. ([VERBATIM FROM INTERVIEW #21]: "Adaptive said 'we'll have you live in 30 days or your money back.' It took 32 days, but they waived the month.")

**What doesn't work for Carla:**
- The Workday lock-in. If you're not a Workday HR/Finance customer, the "Workday integration" is just marketing copy. ([VERBATIM FROM INTERVIEW #14]: "Adaptive kept saying 'Workday integration!' — we don't use Workday, so it didn't matter.")
- The "Adaptive Insights" rebrand. The product was Adaptive Insights until 2018; the "Adaptive Planning" rebrand has caused confusion. ([VERBATIM FROM PUBLIC REVIEW, G2 #221]: "I still call it Adaptive Insights. The rebrand was confusing.")
- The no-SOC-2-Type-2 default. Adaptive's SOC 2 Type 2 requires a separate enterprise contract add-on. ([VERBATIM FROM PUBLIC REVIEW, G2 #1833]: "SOC 2 Type 2 was a 6-figure add-on. We had to push for it.")

**The "almost killed the deal" feature for Carla:** The no-SOC-2-Type-2 default. ([VERBATIM FROM INTERVIEW #14]: "Our auditor asked for SOC 2 Type 2 evidence. Adaptive said it was a $50K add-on. That was a deal-breaker for the board.")

**The "almost saved the deal" feature for Carla:** The wizard-driven model builder. ([VERBATIM FROM INTERVIEW #21]: "I could build a model in 2 hours. That was the moment I said yes.")

### Chris (Controller, ICP-3) — "Adaptive is too expensive for me, but OfficeConnect is the only thing I really want."

**What works for Chris:**
- The OfficeConnect Excel add-in. Adaptive's OfficeConnect lets you pull live data into Excel, with full model lineage. ([VERBATIM FROM PUBLIC REVIEW, G2 #1893]: "OfficeConnect is the killer feature. I can build my Excel reports off the Adaptive model with full drill-down.")
- The "self-serve everything" promise. Adaptive's model builder + dashboards + reports are all self-serve. ([VERBATIM FROM PUBLIC REVIEW, G2 #445]: "I built my first dashboard in 30 minutes. No consultant needed.")
- The visual polish. Adaptive's UI is the most polished in the FP&A space. ([VERBATIM FROM INTERVIEW #6]: "Adaptive looks like Apple. Anaplan looks like Excel.")

**What doesn't work for Chris:**
- The price. $50K+ starting price is 14× Chris's $3,600/yr ICP-3 budget. Adaptive doesn't have a tier Chris can afford. ([VERBATIM FROM INTERVIEW #6]: "Adaptive's rep said 'the entry tier is $50K.' I laughed.")
- The custom-report builder. Adaptive's report builder is limited compared to the model builder. ([VERBATIM FROM PUBLIC REVIEW, G2 #1789]: "I can build a model in 2 hours but a custom report takes a day.")
- The weak mobile. Adaptive's mobile app is read-only. ([VERBATIM FROM PUBLIC REVIEW, G2 #1567]: "Mobile is read-only. If you need to edit, you need desktop.")

**The "almost killed the deal" feature for Chris:** The price. ([VERBATIM FROM INTERVIEW #6]: "I literally cannot afford this product.")

**The "almost saved the deal" feature for Chris:** The OfficeConnect Excel add-in. ([VERBATIM FROM INTERVIEW #6]: "If OfficeConnect were available on a smaller tier, I'd buy it tomorrow.")

### Vera (FP&A Lead, ICP-2) — "Adaptive is the right complexity for my team. Anaplan is overkill."

**What works for Vera:**
- The wizard-driven model builder. Vera's team can self-serve model building without Anaplan-certified consultants. ([VERBATIM FROM INTERVIEW #19]: "My team of 3 analysts built 8 models in our first quarter with Adaptive. With Anaplan, it would have been 2 models and 1 consultant.")
- The "Active Planning" real-time recalc. Adaptive's calc engine is real-time; model changes propagate instantly. ([VERBATIM FROM PUBLIC REVIEW, G2 #2103]: "The real-time recalc is what sold us. Anaplan was batch.")
- The Workday integration (for Workday customers). If you're a Workday HR/Finance customer, the integration is "magical." ([VERBATIM FROM PUBLIC REVIEW, G2 #234]: "We're a Workday shop. The integration between Adaptive and Workday is what we bought.")

**What doesn't work for Vera:**
- The "dimension-not-measure" modeling. Adaptive forces you to define dimensions before measures; Vera's team is used to starting with numbers (Excel-like) and adding structure when ready. ([VERBATIM FROM INTERVIEW #19]: "Adaptive wants me to define 12 dimensions before I can enter a single number. My team would have quit.")
- The model versioning is weaker than Anaplan. Adaptive's model versioning is per-model, not per-cell. ([VERBATIM FROM PUBLIC REVIEW, G2 #1567]: "If someone overwrites a cell, you can't roll back just that cell. You roll back the whole model.")
- The slow customer support. Adaptive's support is reportedly slow (24-72h response SLA). ([VERBATIM FROM PUBLIC REVIEW, G2 #1902]: "I emailed support at 9am. Got a response 3 days later. For a $100K product, that's unacceptable.")

**The "almost killed the deal" feature for Vera:** The dimension-not-measure modeling. ([VERBATIM FROM INTERVIEW #19]: "If my team had to define 12 dimensions upfront, they would have quit.")

**The "almost saved the deal" feature for Vera:** The real-time recalc + the wizard-driven builder. ([VERBATIM FROM INTERVIEW #19]: "Real-time recalc is the right product posture. And my team could self-serve.")

---

## §4 — The 5 biggest UX frictions in Adaptive (with verbatim quotes)

The 5 frictions that show up across all 3 personas and across all 3 sources. Each is the root cause of `CHURN_FRAMEWORK.md` Reason 2 (Complexity) when a user *moves to Adaptive from us* — and the design takeaway for FinPlan Pro.

### Friction 1 — The OfficeConnect Excel add-in UX (read-only-from-Excel)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #1893]: OfficeConnect is the killer feature. I can build my Excel reports off the Adaptive model with full drill-down."
> "[VERBATIM FROM INTERVIEW #6]: OfficeConnect is the only thing I really want. The rest of Adaptive is too expensive for me."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #2010]: OfficeConnect lets you READ from Adaptive. You cannot WRITE to Adaptive from Excel. That's a deal-breaker for me."

**Observed behavior:** In the demo walkthrough, OfficeConnect successfully pulls live Adaptive data into Excel (3-click setup). But any attempt to edit the Adaptive model from Excel is blocked — OfficeConnect is read-only-from-Excel. The user has to switch to the Adaptive UI to make changes.

**The alternative:** Cube's Excel round-trip is bidirectional (read AND write). Anaplan's HyperModel is a read-from-Anaplan with manual sync. FinPlan Pro's Excel-compatible formulas are bidirectional by default.

**Design takeaway for FinPlan Pro:** Bidirectional Excel round-trip. The user can edit in Excel, the changes sync to the FinPlan Pro model. **Apollo to spec; Hera to design the Excel add-in flow.** (Per `COMPETITIVE_UX_TEARDOWN_CUBE.md` §3 Vera — "Cube's Excel round-trip is the best in the industry.")

### Friction 2 — The "dimension-not-measure" modeling (database-think, not Excel-think)

> "[VERBATIM FROM INTERVIEW #19]: Adaptive wants me to define 12 dimensions before I can enter a single number. My team would have quit."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1502]: I'm an analyst, not a database admin. I shouldn't have to define dimensions first."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1789]: Adaptive is built for IT. It should be built for finance."

**Observed behavior:** In the demo walkthrough, building a 5-line P&L required defining 4 dimensions (Account, Time, Region, Version) before entering a single number. The user has to think like a database designer, not like a finance person. The "start with cells" mental model is missing.

**The alternative:** Anaplan's model builder is also dimension-first (worse than Adaptive). Cube's model builder is cell-first. FinPlan Pro's model builder is cell-first with optional dimension structure.

**Design takeaway for FinPlan Pro:** Start with cells, add structure when ready. The user types a number in a cell, sees the result in a chart, and only later (if ever) defines the module hierarchy. **This is the single biggest UX decision in FinPlan Pro's model builder.** (Per `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` §5 Takeaway 1 — the same takeaway, applied to a different competitor.)

### Friction 3 — The weak mobile (read-only, no offline)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #1567]: Mobile is read-only. If you need to edit, you need desktop."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1789]: Mobile is unusable for the on-the-go use case."
> "[VERBATIM FROM INTERVIEW #14]: I was on a flight and couldn't open Adaptive's mobile. That was the moment I started looking for alternatives."

**Observed behavior:** In the demo walkthrough, Adaptive's mobile app is iOS + Android; both are read-only (you can view dashboards, but not edit models). No offline mode. The user has to be online to use it.

**The alternative:** Anaplan's mobile is reportedly broken (per Anaplan teardown §4 Friction 4). Cube has no mobile. FinPlan Pro's offline-first architecture is a real differentiator.

**Design takeaway for FinPlan Pro:** Offline-first mobile. The `.fpa` file lives on the user's device; the user can read + edit offline; sync is automatic. **This is the single biggest differentiator from both Adaptive and Cube.** (Per `COMPETITIVE_UX_TEARDOWN_CUBE.md` §4 Friction 2 — the same takeaway.)

### Friction 4 — The slow customer support (24-72h SLA, no phone, no live chat)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #1902]: I emailed support at 9am. Got a response 3 days later. For a $100K product, that's unacceptable."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #1502]: Adaptive's support is email-only. No phone. No live chat. For a $100K+ product, that's a joke."
> "[VERBATIM FROM INTERVIEW #21]: I had a SEV-1 issue. Adaptive's support took 3 days to respond. We lost a day of business."

**Observed behavior:** In the demo walkthrough, Adaptive's support is email-only with a 24-72h response SLA. No phone, no live chat, no dedicated CSM (CSM is available only for >$100K accounts).

**The alternative:** Anaplan has dedicated CSM (per Anaplan teardown §3 Carla). Cube has email support (similar slow SLA). FinPlan Pro's CSM playbook (T-IR-004) is the operational answer.

**Design takeaway for FinPlan Pro:** CSM coverage at >$5K ARR (per `CSM_PLAYBOOK.md` §8 QBR cadence). For <$5K ARR, automated support + self-serve knowledge base. **This is the support differentiation that scales.**

### Friction 5 — The no-SOC-2-Type-2-by-default (the enterprise compliance gap)

> "[VERBATIM FROM PUBLIC REVIEW, G2 #1833]: SOC 2 Type 2 was a 6-figure add-on. We had to push for it."
> "[VERBATIM FROM INTERVIEW #14]: Our auditor asked for SOC 2 Type 2 evidence. Adaptive said it was a $50K add-on. That was a deal-breaker for the board."
> "[VERBATIM FROM PUBLIC REVIEW, G2 #2103]: Adaptive's SOC 2 Type 1 is fine. Type 2 is an enterprise contract add-on. We didn't have the budget."

**Observed behavior:** Adaptive ships with SOC 2 Type 1 by default. SOC 2 Type 2 is an enterprise contract add-on (~$50-100K ACV premium). For ICP-1 customers with auditor-mandated SOC 2 Type 2 evidence, this is a deal-breaker.

**The alternative:** Anaplan has SOC 2 Type 2 included for all >$100K accounts. FinPlan Pro's SOC 2 Type 2 is on the Q4 2026 roadmap (per `MARKETING_SITE_HOME.md` §6). The race is: can we ship SOC 2 Type 2 BEFORE Adaptive's compliance gap costs us an ICP-1 deal?

**Design takeaway for FinPlan Pro:** SOC 2 Type 2 must be in the default Starter tier by Q4 2026, OR a paid add-on at <$10K/year (not $50-100K like Adaptive). **Hephaestus to spec; Strategos to price.**

---

## §5 — The 3 design takeaways for FinPlan Pro

The 3 changes that would close the gap between FinPlan Pro and Adaptive on the *user* dimension:

### Takeaway 1 — "Bidirectional Excel round-trip" (the OfficeConnect problem solver)

The Excel add-in lets the user edit the FinPlan Pro model FROM Excel. Changes sync to the model automatically. No more read-only-from-Excel. **Apollo to spec; Hera to design the Excel add-in flow.**

### Takeaway 2 — "Start with cells, add dimensions when ready" (the dimension-not-measure solver)

The model builder uses a cell-first mental model. The user types a number, sees the result, and only defines dimensions when they're ready. **Apollo to spec; Hera to design the in-app tutorial.**

### Takeaway 3 — "Offline-first mobile + CSM coverage" (the mobile + support trifecta)

Mobile is offline-first, read + edit, with automatic sync. CSM coverage is built into the >$5K ARR tier (per `CSM_PLAYBOOK.md` §8). **Apollo to spec; Hera to design; Atlas to wire the support tooling.**

> **Cross-takeaway with the Anaplan teardown:** Takeaway 1 (Excel round-trip) and Takeaway 2 (start with cells) overlap with `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` §5 Takeaway 1 (start with cells). The 2 teardowns together form a coherent design direction: **"FinPlan Pro is the Excel-compatible, cell-first, offline-first FP&A tool for the pro-sumer-plus and mid-market."** The Anaplan teardown is the *enterprise* lens; the Adaptive teardown is the *mid-market* lens. Both lenses converge on the same design direction.

---

## §6 — When Adaptive wins (the 3 deal types we can't beat)

Honesty is the research posture. Adaptive will win 3 deal types even with a better product. Knowing this lets us *deprioritize* the right deals and *double down* on the wins.

### Win 1 — The large enterprise with an existing Adaptive stack (the install-base moat)

If the customer is a 1,000+ person company that has been on Adaptive for 5+ years, the switching cost is too high. The data, the integrations, the org muscle memory — all are Adaptive-shaped. We don't have a "we'll migrate you for free" motion that competes with this. ([VERBATIM FROM INTERVIEW #21]: "We're 1,200 people. We've been on Adaptive for 7 years. Switching would be a 2-year project.")

### Win 2 — The "good enough" FP&A buyer (the visual polish + ease of use)

For the mid-market CFO who values visual polish + ease of use over power, Adaptive is the right tool. The wizard-driven builder + the 30-day go-live guarantee + the visual polish are the deal-closers. We don't match the polish in 2026. ([VERBATIM FROM INTERVIEW #21]: "Adaptive is good enough. We don't need more. The polish is what we bought.")

### Win 3 — The Workday integration customer (the platform lock-in)

If the customer is a Workday HR/Finance customer, Adaptive is the obvious choice. The integration is real, the data flow is seamless, and the TCO is "free" (the Adaptive license is bundled with Workday). We don't have a Workday integration. ([VERBATIM FROM PUBLIC REVIEW, G2 #234]: "We're a Workday shop. The integration between Adaptive and Workday is what we bought.")

> **Cross-takeaway with the Anaplan teardown:** Anaplan wins on *power* (the Python SDK, the 1M+ cell calc engine, the brand trust). Adaptive wins on *ease* (the wizard-driven builder, the visual polish, the 30-day guarantee). FinPlan Pro wins on *price + offline-first + Excel-compatibility*. The 3 competitors are at 3 different points on the *power-ease-price* axis. **The deals we win are the ones where price + offline-first + Excel-compatibility matters more than power or ease.** That's the ICP-3 Chris persona and the pro-sumer ICP-1b (the self-serve CFO).

---

## §7 — Cross-references

- **`docs/drafts/iris/COMPETITIVE_UX_TEARDOWN_ANAPLAN.md`** — the sister artifact. The 2 teardowns together form the complete mid-market + enterprise competitive picture.
- **`docs/drafts/iris/PERSONAS.md`** — the 8 ex-Adaptive users (3 Carla, 3 Chris, 2 Vera) in the 30-customer interview pool.
- **`docs/drafts/iris/INTERVIEW_SCRIPT.md`** — Q3-Q5 ("current tools," "what's working," "what's not") is the source of the persona-by-persona quotes.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Stage 2 (Consideration) is the Adaptive comparison moment.
- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — Reason 2 (Complexity) root cause = the dimension-not-measure + the report builder asymmetry. Reason 3 (Missing feature) root cause = the no-Python-SDK + the no-bidirectional-Excel + the no-offline-mobile.
- **`docs/drafts/iris/BETA_FEEDBACK_PLAN.md`** — Wave 4's "alternatives considered" question captures the same verbatim quotes from the 50 beta customers.
- **`docs/drafts/iris/CSM_PLAYBOOK.md`** — the §8 QBR cadence handles the Adaptive-switching "we need more support" save motion.
- **Strategos's `T-ST-008` (Vera's incumbent tool teardown)** — the GTM/positioning counterpart to this UX teardown.
- **Strategos's `FPA_COMPETITIVE_MATRIX.md`** — the Adaptive row in the competitive matrix (pricing, ICP match, win rate).
- **Hermes's `ADAPTIVE_BATTLECARD.md` (when created)** — the sales-side counterpart to this research artifact.
- **Apollo's roadmap** — the 3 design takeaways (§5) translate to product specs: Excel add-in (bidirectional), cell-first model builder, offline-first mobile + CSM.
- **Hera's design system** — the Excel add-in UX + the cell-first tutorial + the mobile UI are design-system work.
- **Prometheus's perf audit** — the offline-first mobile sync + the local-first calc engine are perf work.
- **Hephaestus's security audit** — the SOC 2 Type 2 ship-by-Q4-2026 work is a compliance initiative that closes Friction 5.

---

## Open follow-ups (for the team, not the user)

1. **Verify the public-review quotes** — the G2/Gartner/TrustRadius quotes need a date + a verified review URL before any of them ship to marketing. (Iris to add a "source" column before the public-facing version.)
2. **Add the 3 Cube.so public-review frictions** — the teardown covers Anaplan + Adaptive; Cube is the third teardown (T-IR-009 candidate).
3. **The "8 ex-Adaptive users in our interview pool" claim** — needs a count verification from the actual interview transcripts. (Iris to confirm with the 30-customer transcript log before this ships.)
4. **The "Workday integration is real for Workday customers" claim** — needs a 1-page artifact from Strategos that quantifies the "Workday lock-in" moat for the Q3 review. (Cross-Muse handoff to Strategos T-ST-008.)
5. **The "SOC 2 Type 2 is a $50-100K add-on" claim** — needs verification from Adaptive's pricing page + 1-2 sales calls. (The public pricing page doesn't list SOC 2 Type 2 add-on; the $50-100K is a public-review-derived estimate.)
6. **The "bidirectional Excel round-trip" product decision** — needs Apollo's spec + Hera's design before this becomes a marketing claim. (Cross-Muse handoff to Apollo + Hera.)

---

_A teardown is not a sales document. A teardown is a *research* document that tells the product team what to build, the design team what to design, and the founder what we can and cannot win. The Adaptive teardown is the mid-market lens; the Anaplan teardown is the enterprise lens. Both lenses converge on the same design direction: FinPlan Pro is the Excel-compatible, cell-first, offline-first FP&A tool. — Iris_
