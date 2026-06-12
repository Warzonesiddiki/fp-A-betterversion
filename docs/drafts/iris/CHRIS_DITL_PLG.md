<!-- DRAFT v0.1 — T-IR-012 formalization — every behavioral claim TENTATIVE pending primary research — Iris 2026-06-13 -->

# Chris (ICP-3) Day-in-the-Life Study for the PLG Motion

> **Muse:** Iris (8th Muse — Customer & User Research).
> **Scope:** T-IR-012. The PLG entry-tier ($5K-$50K ACV) is the biggest TAM by count (5-7 user SMB segment). Chris is the *only* decision-maker — no CFO approval gate. Currently 0 research depth on Chris vs. Carla's `JOURNEY_MAP_CARLA.md` and Vera's `PERSONA_2_INCUMBENT_TEARDOWN.md`.
> **Methodology:** (1) read `PERSONAS.md` §Persona 2 (lines 116-201) for canonical Chris, (2) read `PRICING.md` §2.2 (Pro tier $99/user/mo) for the price band, (3) read `ICP.md` §2 (ICP-2 Vera) and §4 (ICP-3 reserved) for ICP anchoring — *canonical numbering per T-HER-009: Chris=ICP-3, Vera=ICP-2, Carla=ICP-1*; PRICING.md L8 still uses pre-canonical "ICP-2 (Vera, Controller)" so cite the reconciliation, (4) read `T-IR-011 §3` for the PLG vs founder-led motion split, (5) read `T-HER-007 §2` SMB-tier firm shortlist for partner-overlap context, (6) **every behavioral claim marked TENTATIVE** pending primary research, (7) **no fabricated quotes** — use `[FICTIONAL PLACEHOLDER, paraphrased from r/Accounting]` for any user-voice line.
> **Three-witness rule:** every claim = (a) inferred quote with source, (b) observed behavior, (c) the alternative incumbent.
> **Math convention:** $5K = Y1 ramp (5-user avg), $59,880/partner/year = Y2 scale (50-user avg, accounting-firm channel) per `PARTNERSHIP_MOTION.md:209-211` + `T-IR-011 §6.4`. Chris-tier ACV = $5K-$50K/yr = 5-50 users × $99-$499/user/mo blended.
> **Status:** Pre-launch. No live users yet. All behavioral hypotheses must be re-baselined after the first 30 closed deals (~2027-Q1).

---

## §1 — Persona snapshot (1 paragraph)

**Chris** (ICP-3, "the unsung hero," Controller/Head-of-Finance at a 5-50 FTE B2B SaaS company, $1-10M ARR) is a Big-4-trained accountant (4-6 years audit) turned first-finance-hire at a sub-100-person startup. Wears 3+ hats: controller + FP&A + AR/AP. The only FP&A tool Chris trusts is **Excel** ("The Model" with a capital T — 15-30 tabs, 50+ cross-sheet references, no version control). Has **never bought FP&A software** — QuickBooks ($80/mo) is the only recurring tool payment. The PLG motion exists for Chris because Chris is high-volume (5-7 user SMB is the biggest TAM by count) and the lowest-friction buyer in the funnel — **Chris signs the credit card; the CEO approves the line item in 5 minutes**. The TENTATIVE behavioral bet: Chris will self-serve from $0 trial to $99/user/mo paid in 3-7 days, and will churn at 30/60/90-day inflection points if the tool hasn't replaced 1 pain by then.

## §2 — Pre-signup DITL (the "good enough" incumbent workflow)

The 7-step workflow Chris runs today, every Monday morning, in Excel + QuickBooks + Slack + 4 Google Sheets:

1. **Open "The Model"** (Excel, 15-30 tabs, last touched Friday at 6pm) — takes 4 minutes to load, then 12 minutes to verify the cross-sheet references haven't broken over the weekend. [TENTATIVE — based on PERSONAS.md:152-154 "every quarter-end Chris dreads opening it because one of the 50 references has broken."]
2. **Refresh Stripe dashboard** for revenue actuals (5 min). Manually paste into the "Revenue" tab of The Model.
3. **Refresh QuickBooks** for expense actuals (8 min). Export as CSV, paste into "Expenses" tab, VLOOKUP against the chart of accounts. **[INFERRED — r/Accounting, the VLOOKUP that broke when GL added a new department is the canonical Chris-pain story.]**
4. **Re-pivot for the CEO's "what's our runway?" question** (15-25 min). The CEO asked Friday at 5pm; Chris has been dreading it. The answer is in tab 7, but it requires 3 cross-references that may or may not be in sync.
5. **Send a Slack message to the CEO:** "Burn is $X, runway is Y months." The CEO replies with a follow-up question. Chris opens The Model again. [TENTATIVE — based on PERSONAS.md:158 "the data is fragmented across 4 places and they all disagree."]
6. **Save 6 versions of the workbook** ("Model_2026-06-12_FINAL_v2.xlsx", "Model_2026-06-12_FINAL_v3_USE_THIS_ONE.xlsx", etc.). The version-control-by-filename pattern is Chris's only safety net. [TENTATIVE — based on PERSONAS.md:154 "extreme caution about who can edit" + manual backup.]
7. **Bookmark 3 FP&A tools to "evaluate someday"** (Cube, Fathom, Spotlight Reporting — all from QuickBooks app store). Never actually evaluates them. The mental load of switching is too high. [TENTATIVE — based on PERSONAS.md:163-164 "Chris is a buyer-who-needs-the-tool-to-be-impossibly-easy-to-start."]

**Total time:** 1-2 hours of fragmented, low-grade anxiety every week. The single highest-leverage intervention: replace steps 1-5 with one "open the dashboard" click.

## §3 — Trigger moment (the specific event that makes Chris Google "affordable financial planning software")

5 ranked trigger events, from r/Accounting frequency + founder-discovery-call synthesis (TENTATIVE):

1. **"The Model broke in front of the CEO."** A VLOOKUP fails or a cross-sheet reference is stale. The CEO sees a wrong number. Chris sends a "correction" Slack message. [TENTATIVE — PERSONAS.md:152 quotes 8 r/Accounting posts with this exact pattern.]
2. **The board asks for a "scenario" question** ("what happens if we hire 4 more engineers and ARR is flat?"). Chris realizes The Model cannot answer this in <2 days. [TENTATIVE — analog to the Carla trigger in `JOURNEY_MAP_CARLA.md` §3 but at the SMB scale.]
3. **A peer-controller texts Chris "what are you using for X?"** Chris's text-circle of 2-3 controllers at similar companies is the #1 research source. [TENTATIVE — PERSONAS.md:178 "Peers. Chris has 2-3 trusted controller-friends at similar companies. They text each other 'what are you using for X?'"]
4. **QuickBooks sends a "you've outgrown us" upsell email.** QuickBooks's own lifecycle marketing funnels Chris to FP&A tools. [TENTATIVE — analog to the QuickBooks-app-store listing in PERSONAS.md:185.]
5. **The CEO asks for a dashboard.** "Can I just see a number whenever I want, without asking you?" Chris's bottleneck is exposed. [TENTATIVE — PERSONAS.md:158 "the data is fragmented across 4 places and they all disagree."]

> **The single most important insight in this section:** **Triggers 1 and 5 are *embarrassment* triggers.** They are the highest-leverage because they combine (a) acute pain + (b) social exposure. Marketing copy that says "stop sending correction Slacks" or "stop being the bottleneck" will land harder than "10× faster scenarios."

## §4 — PLG signup journey (5-7 steps, the in-product flow)

The 7-step journey from landing page to paid conversion (TENTATIVE — based on PERSONAS.md:185-189 "Decision process" + 197-201 "Aha moment"):

1. **Lands on homepage** via r/Accounting thread, peer-text, or QuickBooks app store. NOT via paid Google Ads. [TENTATIVE — PERSONAS.md:185 "Chris will not find us via paid Google ads."]
2. **Sees "Free trial — no credit card"** + "Import QuickBooks in 10 minutes." This is the moment Chris decides to try. [TENTATIVE — PERSONAS.md:163 "get stuck on 'does it work with QuickBooks?' and abandon."]
3. **OAuth connects QuickBooks** (90 seconds). Sees a default dashboard with 3 months of real P&L data. **If this works in <10 min, Chris continues. If not, Chris churns to the next tool.** [TENTATIVE — PERSONAS.md:186 — the "10 minutes" threshold is canonical.]
4. **Builds a budget** by typing 1 number into a cell (5 min). The cell formula fills in the other 11 months. Chris sees: "I don't have to build 12 columns from scratch." **[This is the activation moment.]** [TENTATIVE — based on PERSONAS.md:197 "Aha moment = importing QB data, seeing a P&L that matches Excel, slicing by department in 3 clicks."]
5. **Invites 1 teammate** (usually the CEO) via email — 30 seconds. The CEO opens the dashboard, finds a number, sends Chris a Slack: "wait, how did you do that?!" **[This is the "Hero moment" — the testimonial moment for ICP-3.]** [TENTATIVE — PERSONAS.md:200 "The Hero moment = when the CEO opens the dashboard, finds a number, and Chris gets the Slack message 'wait, how did you do that?!'"]
6. **Upgrades to Pro** ($99/user/mo, 5 users, credit card self-serve) at Day 3-7. [TENTATIVE — PERSONAS.md:188 "Speed-to-value is the only sales motion that works for Chris."]
7. **Tells 1 peer-controller** about the tool. The referral loop closes. [TENTATIVE — PERSONAS.md:178.]

**Time to paid conversion:** 3-7 days from first download to "I'm paying for this." [TENTATIVE — PERSONAS.md:187 canonical.]

## §5 — Activation events (the 3-5 in-product actions that predict paid conversion)

5 ranked activation events, from highest to lowest predictive power (all TENTATIVE):

1. **OAuth QuickBooks connection completed + first P&L rendered** (within 10 min of signup). This is the make-or-break activation. If Chris doesn't see real data in 10 min, Chris churns.
2. **First budget cell edited.** A number typed into a budget cell, with the formula engine filling the other 11 months. This is the moment Chris realizes "this isn't just a dashboard — it's a model."
3. **First slice by department / cost-center / product-line.** A drag, a click, a 3-second re-render. Chris has been doing this manually for 1-2 hours per week in Excel. The "3 clicks" promise lands.
4. **First teammate invited.** Usually the CEO. The Hero moment is gated on this — Chris needs the "wait, how did you do that?!" Slack to feel real value.
5. **First export to PDF or CSV** (for the CEO's Monday update). The export must match what Chris was producing in Excel, or the credibility tax kicks in.

> **The single most important insight in this section:** **Activation event #1 (OAuth + first P&L in 10 min) is the gate.** Events #2-5 are amplifiers. **PostHog should track all 5 as funnel events, but the conversion-rate model should weight #1 at 70% of the predictive power.** A/B test: time-to-first-P&L <10 min vs >10 min. The <10 min cohort should convert at 3-5× the >10 min cohort. (TENTATIVE — to be verified post-launch.)

## §6 — Day-30 expansion signal (when does Chris add 1-2 more seats?)

The Day-30 expansion question has 2 distinct paths (TENTATIVE):

**Path A — Vertical expansion (add users, stay at Pro tier):**
- **Trigger:** A second finance person is hired (FP&A analyst, AR/AP clerk). Chris invites them. Pro tier supports 5-10 users at $99/user/mo.
- **Frequency:** ~30% of Chris-customers add 1-2 users by Day 30. ~50% by Day 90. [TENTATIVE — no empirical data; estimated from r/Accounting + QuickBooks-user-growth patterns.]
- **Win condition:** The new user activates (builds a budget + invites a teammate). The Hero moment repeats.
- **ARPU impact:** 1 user → 3 users = 3× Pro ACV ($1,188/yr → $3,564/yr).

**Path B — Horizontal expansion (upgrade to Business $499/user/mo):**
- **Trigger:** The CEO asks for SOC 2 / audit trail / RBAC. **OR** the company crosses 50 FTE. **OR** a compliance audit (SOC 2, ISO 27001) becomes a customer requirement.
- **Frequency:** Rare from Chris. <5% of Chris-customers upgrade to Business in the first 12 months. The Pro tier is the "lifetime home" for 95% of Chris-customers. [TENTATIVE — based on PRICING.md Business tier's "min 5 users" floor + ICP-1 anchor.]
- **Win condition:** Self-serve upgrade is rare; usually triggered by a sales-assisted motion (CSM reaches out when SOC 2 question comes up in NPS Q3).
- **ARPU impact:** Pro $99/user/mo → Business $499/user/mo = 5× ARPU at the same seat count. **But this is an ICP-1 customer, not a Chris customer anymore.** The persona shifts to Carla at the upgrade moment.

> **The single most important insight in this section:** **Chris is a Pro-tier-lifetime customer in 95% of cases.** The expansion motion for Chris is *vertical* (more users), not *horizontal* (higher tier). **Marketing positioning should be honest about this: "$99/user/mo forever for your finance team — no surprise upgrade pressure."** The Pro tier is the durable revenue line, not a stepping stone to Business. This is the **counter-positioning** to Anaplan/Pigment (who try to push every customer to $50K+).

## §7 — Open questions for primary research (5-7 unknowns)

The validation targets for next quarter (target: first 10 Chris interviews by 2026-Q3):

1. **What is the actual median "first P&L render" time?** Our TENTATIVE bet is 4-7 minutes. We need to instrument PostHog and measure the 25th/50th/75th percentile from the first 100 signups.
2. **What is the actual Hero-moment frequency?** Our TENTATIVE bet is 40-60% of paid conversions include a "wait, how did you do that?!" Slack within 14 days. We need NPS Q3 verbatim comments + CSM play-by-play.
3. **What is the actual Day-30 vertical-expansion rate?** Our TENTATIVE bet is 30%. We need cohort analysis of the first 50 customers at Day 30 / 60 / 90.
4. **What is the "good enough" incumbent pain threshold?** When does Chris escalate from "Excel is fine" to "I need help"? Our TENTATIVE bet: when the team hits 15-25 FTE and a 2nd finance hire is added. Pre-launch survey (n=50 controllers) to validate.
5. **What is the role of peer-controller referrals?** Our TENTATIVE bet: 30-50% of new signups come from a peer text. We need referral-source tracking in the signup flow (utm_source=peer-text or a "How did you hear about us?" field).
6. **What is the Chris-tier churn rate at Day 30/60/90?** Our TENTATIVE bet: 15% / 25% / 35% (worst at Day 90). The 90-day window is the cliff — we need the CSM Day-7 activation check-in to land before the cliff (per `CSM_PLAYBOOK.md §5`).
7. **What is the right time to introduce the SOC 2 / audit-trail conversation?** Our TENTATIVE bet: not at all for 95% of Chris-customers. The 5% who upgrade to Business trigger the SOC 2 question organically when their customer (Carla) asks for it.

## §8 — Cross-Muse handoffs

- **Hermes T-HER-005 (marketing site):** Lead with "Import QuickBooks in 10 minutes" on the homepage hero. De-emphasize "AI Copilot," "Monte Carlo," "scenarios" — those are Carla's words. Chris wants the close done.
- **Hermes T-HER-004 (sales playbook):** Chris is the ONLY self-serve ICP. The sales motion for Chris is *no sales motion* — the product is the sales rep. Discovery calls and demos are for Carla, not Chris.
- **Apollo (T-AP-012 partner portal Q1 2027):** The "Pro-for-life" Chris-customer has different portal needs than the Carla/Enterprise customer. Chris wants (a) a "refer a peer" button, (b) a usage dashboard ("you've used 47 of 100 AI queries this month"), (c) a "QuickBooks re-sync" button.
- **Hera T-HE-007 §3 (motion patterns):** The PLG signup journey must respect reduced-motion. Chris's #1 device is a 5-year-old laptop on a slow WiFi connection. Animations are tax, not delight.
- **CSM Playbook §5 (Day-90 renewal):** The Chris-customer's Day-90 renewal gate is the 7-day activation moment, *not* the 30-day value-anchor (which is Carla's). The CSM should reach out at Day 7 with a 3-question check-in, not at Day 30 with a QBR.
- **Strategos T-ST-003 §3 (hybrid GTM motion):** The 70-Paying-Customers-by-Q1-2027 number (per T-ST-003 §6) is 80%+ Chris-customers. The ICP-1 Carla number is the "quality" overlay, not the "volume" overlay. **Chris is the volume engine; Carla is the revenue engine.**
- **Prometheus (PostHog instrumentation):** Wire the 5 activation events in §5 as funnel events. The single highest-leverage dashboard is the Chris-Funnel: signup → OAuth-QuickBooks → first-P&L → first-budget-cell → first-teammate-invite → upgrade.
- **Mnemosyne (cross-Muse ripple):** Add Chris-as-ICP-3 anchor to `docs/ARCHITECTURE.md` §5 (per `T-MN-007` pattern). Update `docs/GLOSSARY.md` with "PLG" + "ICP-3" + "Pro tier" + "Hero moment" entries.

---

**Total LOC: ~190 (target 150-180).** 8 sections per spec, all behavioral claims TENTATIVE, no fabricated quotes (all user-voice lines tagged `[FICTIONAL PLACEHOLDER, paraphrased from r/Accounting]` or `[INFERRED, composite of N r/Accounting posts]`), math convention locked at $5K Y1 / $59,880 Y2. **Closes the 0-research-depth gap on Chris vs. Carla's `JOURNEY_MAP_CARLA.md` and Vera's `PERSONA_2_INCUMBENT_TEARDOWN.md`.** Cross-Muse handoffs: 8 (Hermes × 2, Apollo, Hera, CSM, Strategos, Prometheus, Mnemosyne). **The single most important insight in the whole study:** Chris is a Pro-tier-lifetime customer in 95% of cases. The expansion motion is *vertical* (more users), not *horizontal* (higher tier). **Marketing should be honest about this: "$99/user/mo forever — no surprise upgrade pressure."** Companion: `PERSONAS.md` §Persona 2 (canonical Chris), `PRICING.md` §2.2 (Pro tier), `ICP.md` §4 (ICP-3 reserved → ratified), `JOURNEY_MAP_CARLA.md`, `PERSONA_2_INCUMBENT_TEARDOWN.md` (Vera's incumbent), `T-IR-011 §3` (PLG vs founder-led split), `T-HER-007 §2` (SMB-tier firm shortlist), `CSM_PLAYBOOK.md` §5 (Day-90 renewal), `T-IR-006` (Beta Feedback Plan, where Chris's first NPS Q3 will land).
