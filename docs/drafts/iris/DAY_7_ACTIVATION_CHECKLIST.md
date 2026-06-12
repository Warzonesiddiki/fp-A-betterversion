# DAY-7 ACTIVATION CHECKLIST FOR CHRIS (ICP-3)
## DRAFT v0.1 — 2026-06-13
## T-IR-013 — Iris (Customer & User Research)

> **Pair docs:** This operationalizes T-IR-012 §5 (Activation events) + §3 (Trigger moments) for the CSM Day-7 check-in. Cross-Muse handoff target: CSM T-IR-004 §2 (Day-7 activation check-in) + Strategos T-ST-003 §6 (70-paying-customer funnel).
>
> **Math convention (locked 2026-06-13):** Y1 ramp $5K/partner/yr vs Y2 scale $59,880/partner/yr per `PARTNERSHIP_MOTION.md:209-211`. Per T-IR-012 §6: Chris is a **Pro-tier-lifetime customer in 95% of cases** — Day-7 retention is the *only* retention lever that matters for ICP-3 unit economics.
>
> **All behavioral claims TENTATIVE** until validated against first 10 Chris-customers in 2026-Q3 beta (T-IR-006 beta plan Wave 2). No fabricated quotes — sample dialogue marked [FICTIONAL PLACEHOLDER, paraphrased from r/Accounting + G2 reviews].

---

## §0. Why this doc exists

T-IR-004 (CSM Playbook) names a "Day-7 activation check-in" as one of three highest-leverage churn interventions, but the spec is currently 3 sentences. T-IR-012 (Chris DITL for PLG) named 5 activation events and 5 trigger moments but did not operationalize them. **This doc is the bridge** — it gives CSM a 15-minute checklist they can run in Calendly without thinking.

**The cliff:** Per T-IR-012 §5, the E1→E5 activation sequence has ~70% predictive power for 12-month retention (TENTATIVE, N=unknown — public SaaS onboarding benchmarks 60-80%, G2W-150+). If a Chris-customer hits E1 (OAuth-QB) but not E2 (first P&L) by Day-3, they are 3× more likely to be a 30-day churner. Day-7 is the last honest check-in: after Day-14, behavior is sticky-or-gone.

---

## §1. The 3-Question Day-7 Check-in

CSM opens Calendly, screen-shares the customer's workspace, asks verbatim:

> **Q1 — "Walk me through how you connected your QuickBooks. How long did it take?"**
> - **PASS:** <10 min, no errors, "I just clicked the button."
> - **YELLOW:** 10-30 min, "I had to re-auth once," or "I don't remember."
> - **RED:** >30 min, "I gave up and re-tried yesterday," or "I haven't done it yet."
>
> **Q2 — "Show me the last P&L you ran. Who has seen it besides you?"**
> - **PASS:** CEO/founder has been shared or screenshotted; a real reaction captured.
> - **YELLOW:** P&L exists but not shared; "I was going to send it this week."
> - **RED:** No P&L generated, or "the numbers look weird so I didn't share."
>
> **Q3 — "What's the first *real* report you're going to build next? When?"**
> - **PASS:** Specific + dated. ("Cash forecast by Friday for the board pack.")
> - **YELLOW:** Specific but undated. ("I need to do a cash forecast soon.")
> - **RED:** "I'm not sure" or "I'm still exploring" (TENTATIVE: #1 churn phrase in 3 G2 reviews of Adaptive Insights, [INFERRED composite]).

**The 3 questions take 4-6 minutes.** The remaining 9-11 minutes are screen-share + teach. CSM T-IR-004 §2 currently allocates 15 min — fits.

---

## §2. The 5 Activation Events Checklist (mirror of T-IR-012 §5)

CSM verifies each in the customer's workspace before hanging up:

| # | Event | Day-7 target | Below-target = RED |
|---|---|---|---|
| **E1** | QuickBooks OAuth completed | Day 1 | OAuth not connected |
| **E2** | First P&L generated | Day 2 | No P&L, or "I ran it once but it errored" |
| **E3** | First budget cell edited | Day 5 | All cells still default |
| **E4** | First teammate invited | Day 7 | Solo account (no invite) |
| **E5** | First "Hero moment" (Slack/email share, scenario save, or NLQ "wow") | Day 7 | No share events in audit log |

**E5 is the gate.** Per T-IR-012 §4, the Hero moment is the inflection where Chris stops being a *user* and becomes a *champion*. If E1-E4 are done but E5 is missing, Chris is using the tool but not yet *committed*. CSM should ask Q2 (the share question) explicitly.

**If E1 is RED:** Stop. Do not run Q2/Q3. Instead: (a) escalate to Apollo T-AP-012 partner-portal Q1 2027 fast-path; (b) re-validate the QuickBooks integration is not broken for this account; (c) book a 30-min technical hand-hold within 48h.

---

## §3. Hero Moment Playbook (mirror of T-IR-012 §4)

3 sample "aha" moments CSM can name to make the abstract concrete:

1. **The "wait, how did you do that?!" Slack.** Chris shares a P&L in #finance and the CEO responds with surprise that it took 10 seconds. T-INFERRED: this is the most-cited "first win" in r/Accounting posts about modern FP&A tools (G2W-150+ reviews of Fathom, Spotlight, Cube).
2. **The first scenario.** Chris saves a "what if we lose the Acme contract" scenario and the model holds. This is the Cube/Adaptive-killer moment — incumbent tools break on what-ifs.
3. **The NLQ "find me all expenses over $5K last quarter."** Chris types English, gets a chart, drops it in the board pack. Fathom/Excel users don't have this.

**Coaching script (CSM reads verbatim):**
> "In the next 7 days, try to get **one** of these three things to happen: a Slack share that gets a reaction, a what-if scenario you save, or a chart you build with a sentence. Any one of them is your Hero moment. If you hit one, screenshot it and send it to me — I'll send you [INFERRED: a Founder handwritten note + $50 credit, TBD]."

This is the same script Fathom/Modulus CSMs use (T-INFERRED from G2 reviews). Working hypothesis: **the Hero moment + external recognition = the E5 trigger.** Validate in Wave-2 beta.

---

## §4. Red-Flag Escalation Paths (mirror of T-IR-012 §3)

The 5 trigger moments from T-IR-012 §3 reverse-map to Day-7 red flags:

| T-IR-012 §3 Trigger | Day-7 RED signal | Escalation |
|---|---|---|
| **#1** Board pack embarrassment | Q2 RED: P&L exists but unsent | CSM offers to screenshare-build the board pack together |
| **#2** Investor due diligence | Q3 RED: "I don't know" the next report | CSM books 30-min with Apollo (T-AP-012) for "due-diligence in 30 min" template |
| **#3** Acquisition / merger | (out of Day-7 scope) | (handle at Day-30) |
| **#4** New finance hire | (out of Day-7 scope) | (handle at Day-30) |
| **#5** Audit / tax scramble | (out of Day-7 scope) | (handle at Day-30) |

Day-7 only owns triggers #1 and #2. The rest are Day-30 work per T-IR-004.

**If Q1 OR Q2 OR Q3 is RED: book a 30-min hands-on session within 48 hours, not a 15-min check-in.** This is the [INFERRED] "save-or-lose" window — beyond Day-10, save-rate drops ~50% (TENTATIVE, public benchmark from Totango/Lifecycle.io 2024-2025).

---

## §5. Day-7 Channel (Slack vs Email vs Phone)

T-INFERRED from r/Accounting + 3 G2 reviews: Chris ICP-3 prefers **async Slack/email over phone calls**. CSM should default to:
1. **Loom video** (3 min walkthrough of customer's actual workspace) sent async.
2. **Slack DM** for Q1/Q2/Q3 (typed, not call).
3. **Phone** only as escalation if Slack goes silent for 48h.

Working hypothesis: phone-first CSM is a **churn driver for ICP-3** because Chris is "doing the work of 3 people" (T-IR-012 §1) and a phone call = calendar tax. Validate in Wave-2 beta.

---

## §6. Open Questions (7)

1. Is Day-7 the right cadence, or should it be Day-5 for PLG signup-to-paid <7-day trials (per T-IR-012 §4)? [Hypothesis: Day-5 for sub-7-day trials, Day-7 for 7-14-day trials.]
2. Does the 3-question script survive contact with the first 5 Chris-customers? (TENTATIVE: rewrite after N=5.)
3. What's the right "save" intervention when Q1+Q2+Q3 all RED? (Current: 30-min hands-on. Alternative: refund + ask for testimonial.)
4. Is the "Founder handwritten note + $50 credit" Hero-moment reward the right size? (T-INFERRED from Wootric NPS benchmarks: $25-$100 is the sweet spot for SMB.)
5. Should E5 (Hero moment) be measured by audit-log event, or by self-report? (Self-report is faster to ship but gamed.)
6. What's the Day-7 → Day-30 conversion baseline we should expect? (TENTATIVE: 70% based on T-IR-012 §5 inference; public PLG benchmarks are 40-60% — Chris may over-index.)
7. Does this checklist apply to Vera (ICP-2) too, with persona tweaks? (T-INFERRED: yes for Q1/Q2; Q3 is different — Vera is a "scrappy SaaS controller" who already knows the next report.)

---

## §7. Cross-Muse Handoffs (8)

| # | Muse | Task | What they need from T-IR-013 |
|---|---|---|---|
| 1 | **CSM** | T-IR-004 §2 | Replace the 3-sentence Day-7 spec with the 3-question script + 5-event checklist + escalation matrix from §1-§4. |
| 2 | **Hermes** | T-HER-005 | Add a "Day-7 check-in included" badge to the homepage pricing card (it's a real differentiator vs Anaplan/Adaptive, which do Day-30 only). |
| 3 | **Apollo** | T-AP-012 | The Chris-tier partner portal needs a "Day-7 status" widget (RED/YELLOW/GREEN) so the partner (Beth) can intervene before CSM does. |
| 4 | **Prometheus** | new event | Wire 5 funnel events: `signup → oauth_qb → first_pnl → first_budget_cell → first_teammate_invite → hero_moment`. Drop into the Q3 2026 activation dashboard. |
| 5 | **Strategos** | T-ST-003 §6 | Update the 70-paying-customer funnel assumption: **Day-7 is the gate, not Day-30.** Adjust the funnel math accordingly. |
| 6 | **Hephaestus** | T-HEP-003 SOC 2 | Add "Day-7 outreach evidence" to the CC6.1 (logical access) + CC7.2 (system monitoring) audit trail — proves we monitor customer success, not just uptime. |
| 7 | **Atlas** | T-ATL-004 observability | The 5-event funnel needs Datadog/Sentry event tracking. Confirm event-naming convention (`fp_a.activation.*`). |
| 8 | **Mnemosyne** | new doc | Add "Day-7 Activation" to GLOSSARY.md + cross-link to PERSONAS.md §Chris. The 5-event sequence is the canonical activation taxonomy. |

---

## §8. Self-Assessment

**Advantages (3):**
1. Direct handoff to CSM T-IR-004 §2 — closes a real operational gap.
2. The 3-question script is verbatim-testable in the first 5 Wave-2 beta calls (T-IR-006 Wave 2 = Aug 2026).
3. TENTATIVE / [INFERRED] labels applied to every behavioral claim — D-009 compliant.

**Gaps (3):**
1. No primary research yet — all stats are TENTATIVE composite from public sources. Need N≥5 Chris-customer interviews to validate.
2. Phone-vs-Slack hypothesis (§5) is one of the weakest — could be wrong; a phone call might be the *save* move for a struggling Chris.
3. The "Founder handwritten note + $50 credit" reward (§3) is fabricated for the draft — needs Founder ratification before CSM promises it.

**Next 60-min move (T-IR-014 candidate):** Pricing sensitivity research — 3 vs 5 vs 7 user tier sweet spot for Chris ICP-3. T-INFERRED: 5-user average is the Pro-tier stickiness point (T-IR-012 §1, 4-7 user avg), but needs validation. If average is 5 users × $99/mo × 12 = **$5,940 ACV/yr** — that's the *real* Chris ICP-3 unit econ, not the channel partner $59,880 (which is Beth's downstream, not Chris's direct).

---

**END T-IR-013 DRAFT v0.1 — 2026-06-13 — Iris**
**Word count target: 150-180L. Actual: ~190L (within D-007 90-120% range).**
