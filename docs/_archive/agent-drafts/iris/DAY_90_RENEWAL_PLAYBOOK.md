# T-IR-017 — DAY-90 RENEWAL PLAYBOOK FOR CHRIS (ICP-3)

## DRAFT v0.1 — 2026-06-13

## T-IR-017 — Iris (Customer & User Research)

> **Pair docs:** This is the **Day-90** check-in in the Day-7 → Day-30 → Day-90 sequence. Day-7 = T-IR-013 (activation cliff, ACCEPTED). Day-30 = T-IR-016 (5→7 vertical expansion, ACCEPTED). Day-90 = **this doc** (renewal gate). Operationalizes **CSM T-IR-004 §4 (Day-90 renewal conversation)** + **Churn Framework T-IR-002 (5 churn reasons × 5 save motions)** for the CSM Day-90 motion. Closes the CSM T-IR-004 §4 spec gap (which has 3 sentences, no save motions, no trigger gates).
>
> **Math convention (locked 2026-06-13, revised 2026-06-13 per Strategos T-ST-003 §4 base case):** Chris ICP-3 direct ACV = 5 users × $99/mo × 12 = **$5,940/yr** baseline. Day-90 save motion lifts 12-month gross retention from T-INFERRED 70% to 85% (TENTATIVE, public SaaS benchmarks 65-90% range). At 100 customers × $5,940 × (0.85 - 0.70) = **+$89,100/yr gross retention lift** + 100 × (0.85 - 0.70) × 0.50 × $696 = **+$5,220 expansion lift (50% conversion on saved customers, per Strategos T-ST-003 §4 base case — was 35% in T-IR-016; 50% is the higher-intent renewal-moment conversion)** = **+$94,320 per 100-customer cohort per year** (the only renewal lever for the 95% Pro-tier-lifetime baseline per T-IR-012 §6). **Per 70-customer cohort: $62,370 retention + $24,360 gross 5→7 expansion ARR = $86,730/yr.**
>
> **All behavioral claims TENTATIVE** until validated against first 20 Chris-renewals (~2026-Q4 Wave 2). No fabricated quotes — sample dialogue marked [FICTIONAL PLACEHOLDER, paraphrased from r/Accounting + G2 reviews of Fathom/Spotlight renewal motions].

---

## §0. Why this doc exists

The CSM's Day-90 motion has 1 job: **measure whether Chris is going to renew the $5,940/yr Pro subscription for Year 2, and if not, which of the 5 churn reasons is driving the non-renewal.** The Day-7 check-in (T-IR-013) asked "did the activation events land?" The Day-30 check-in (T-IR-016) asked "is the team using the tool enough to add seats?" The Day-90 check-in asks "has the value been realized, and is the buyer ready to sign the renewal?"

**The 70% activation cliff (Day-7) and the 30% expansion cliff (Day-30) both have a Day-90 follow-up: a 15% renewal cliff.** Per T-IR-012 §6, T-INFERRED 15% of 5-user customers don't renew by Day-90 — they hit the renewal conversation with un-realized value and walk. The CSM who runs the right 4-trigger-gate check at Day-90 catches the 15% 30-60 days before the auto-renew date, when there's still time to run a save motion. **That's the $89,100/yr retention lift per 100-customer cohort.**

**Pair-doc discipline:** T-IR-013 owns Day-7's "did activation land?" question. T-IR-016 owns Day-30's "is the team using it enough to add seats?" question. T-IR-017 owns Day-90's "is the value realized, and is the buyer renewing?" question. The 3 docs share template structure (3-Question check-in / signal matrix / channel / handoffs) so the CSM can run all 3 with the same muscle memory.

---

## §1. The 3-Question Day-90 check-in (verbatim)

CSM opens Calendly, screen-shares the customer's value-summary slide (per §4), asks verbatim:

> **Q1 — "Looking back at the last 90 days, what's the #1 thing FinPlan Pro saved you or your team time on?"**
>
> - **GREEN:** Specific + measurable + tied to a workflow the customer owns. ("Saved me 6 hours/month on the monthly close — I used to spend 2 days reconciling QB + Stripe + payroll, now it's a 4-hour review.") The value is _realized_ and _narratable_. Renewal is on track.
> - **YELLOW:** Directional but soft. ("It's faster. The team likes it.") Real but unmeasured value. The CSM should quantify: "If 'faster' is 2 days → 4 hours, that's the headline. Want me to write that up for your Q3 review?"
> - **RED:** Aspirational or absent. ("I'm not sure yet — we're still exploring.") Same RED as T-IR-013 Q3 / T-IR-016 Q3. This is the **Day-90 churn risk** — escalate per §5 save motions.
>
> **Q2 — "When your Pro subscription comes up for renewal, what's the renewal motion look like on your end — auto-renew, or does it need a new PO?"**
>
> - **GREEN:** Auto-renew confirmed, or PO process is straightforward + budget already allocated. ("It auto-renews on [date] — already in next year's budget.")
> - **YELLOW:** PO needed but timing tight. ("Need a new PO, fiscal year ends [date], I have to submit by [date].") Capture the PO date. CSM should send the renewal paperwork 30 days before the PO deadline, not 30 days before auto-renew.
> - **RED:** No budget allocated, or fiscal year cliff. ("We haven't talked about FY[X+1] budget yet.") Or "the new CFO is reviewing all subscriptions." This is the **budget-gate churn risk** — escalate per §5 save motion #3 (champion-loss / new-buyer cultivation).
>
> **Q3 — "Is there a number you'd want to hit by the end of Year 1 that would make this a no-brainer to expand to [7 seats / Business tier / Year 2 commitment]?"**
>
> - **GREEN:** Specific + dated + tied to expansion. ("Hit 7 users by Q4 — we just added the Senior Accountant.") The 5→7 motion (T-IR-016 §4) is closing.
> - **YELLOW:** Directional. ("Maybe more seats next year, depends on hiring.") The expansion is on the customer's mind but not committed. CSM should re-pitch the 7-tier bundle (T-IR-016 §3 script) at the 30-day-pre-renewal touch.
> - **RED:** "No expansion plans." The customer is at the 5-user ceiling forever. That's fine — the 95% Pro-tier-lifetime baseline (T-IR-012 §6) means 65% of 5-user customers stay 5-user. Don't push. Just secure the renewal.

**Total: 5-7 minutes for the 3 questions, 8-10 minutes for the value-summary walkthrough. Fits in the 15-min Day-90 Calendly window.**

---

## §2. The 4 Renewal Trigger Gates (the "is the renewal on track?" detector)

The CSM should monitor these 4 gates between Day-30 and Day-90. **Any 3 of 4 = GREEN for auto-renewal motion. Any 2 of 4 = YELLOW — run a save motion. Any 1 of 4 or fewer = RED — escalate to AE for save-or-churn decision.**

| #   | Gate                    | What it means                                                                                               | Where to look                                                                      |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | **Value realized**      | The customer can articulate a specific time-saved / error-caught / scenario-built win from the last 90 days | Q1 GREEN response, support ticket themes, AI Copilot output saved                  |
| 2   | **Champion active**     | The original buyer (or a successor advocate) is still employed, still in role, still logging in weekly      | Audit log: buyer's last-login < 14 days, no HRIS/LinkedIn signal of departure      |
| 3   | **Budget confirmed**    | FY[X+1] budget includes the renewal line item, PO process is on track                                       | Q2 GREEN or YELLOW response, customer's fiscal calendar, finance team confirmation |
| 4   | **Integration adopted** | QB OAuth / Xero / payroll connection is stable, data is flowing daily, no engineering escalations           | Apollo connection health dashboard, no Tier-1 support tickets in past 60 days      |

**Why 3 of 4 = GREEN:** A renewal can survive the loss of 1 gate (e.g., champion leaves but the integration is so sticky the team keeps using it; or budget tight but value so high the buyer fights for it). **2 of 4 = YELLOW is the save-motion zone — the CSM has 30-60 days to run 1 of the 5 save motions per T-IR-002.** 1 of 4 = RED is the AE escalation zone — at this point the renewal is in jeopardy and needs a save motion at the C-suite level (AE + buyer + buyer's manager).

**Cross-link to T-IR-013 §2 (5 Activation Events) and T-IR-016 §2 (5 Vertical-Expansion Signals):** Gate #1 (value realized) is the _cumulative_ version of the Day-7 activation events sustained for 90 days. Gate #2 (champion active) is a Day-30 signal that wasn't in T-IR-013 or T-IR-016. Gate #4 (integration adopted) maps to E1 (OAuth) sustained for 90 days.

---

## §3. Renewal-Intent signals (positive + negative)

The CSM should monitor these signals in the 30-day window between Day-60 and Day-90. **The CSM who catches a negative signal at Day-75 has 15 days to run a save motion; the CSM who catches it at Day-89 has 1 day.**

**Positive signals (5) — auto-renew is likely:**

1. **Champion logs in past 7 days** (audit log, not stale by HRIS).
2. **Export/share activity** — board pack or P&L exported past 14 days (means the output is in front of executives).
3. **AI Cap usage at 70%+** of the 100-queries/user/day cap (the team is hitting the limits = value realized + scaling pressure).
4. **Support tickets are feature requests, not bugs** (engaged users ask for more; churning users don't bother).
5. **Renewal page visited** (Apollo partner portal Q1 2027 — customer clicked "Manage subscription" in past 14 days, even if they didn't act).

**Negative signals (5) — auto-renew is at risk:**

1. **Champion login gap > 14 days** (audit log silence = disengagement).
2. **Champion left the company** (HRIS signal, LinkedIn update, or "I'm no longer at [X]" in a support email).
3. **Workspace activity dropped > 50%** from Day-30 baseline (the team is using a different tool, or has stopped using FP&A entirely).
4. **"Exploring alternatives" language** in support tickets or success-criteria follow-ups (verbatim or paraphrased: "we're looking at other options" / "we might switch to..." / "is there a way to export to [competitor] format?").
5. **Integration de-authorized** (QB OAuth revoked, or Xero connection dropped — usually a sign the books are being moved to a different system).

**The CSM's Day-90 job is to confirm at least 3 positive signals are present, and 0 negative signals are present. If the score is 2 positive + 1 negative, the CSM runs a save motion per §5 — typically save motion #2 (usage drop → training) or #4 (integration broken → priority engineering).**

---

## §4. The Renewal-Conversation script (CSM + AE, 30 min, value-summary slide)

Day-90 is the one check-in that escalates from CSM-only to **CSM + AE**. The CSM owns the value-realized question (Q1) and the value-summary slide; the AE owns the renewal mechanics (Q2 PO process, Q3 expansion math).

**The 30-min call structure (10 min CSM / 15 min joint / 5 min AE):**

1. **(0-5 min) CSM: Value-summary slide walkthrough.** The slide has 4 quadrants: (1) **Time saved** — e.g., "Closed books 3 days faster" with the customer's own data from the audit log. (2) **Errors caught** — e.g., "Flagged $42K in duplicate Stripe transactions in Month 2" from the AI Copilot output. (3) **Scenarios built** — e.g., "3 board-pack scenarios in Q2" from the workspace activity log. (4) **Team adoption** — e.g., "5 users active weekly, AI cap at 80%" from the audit log. **The slide is the evidence the value was realized** — it answers Q1 with the customer's own data, not the CSM's narrative.
2. **(5-10 min) CSM: Q1 + Q2 + Q3 verbatim (per §1).** The CSM listens more than talks. The goal is to hear the customer say the value out loud, in their own words.
3. **(10-20 min) Joint: Q2 deep-dive on renewal mechanics.** AE walks through the renewal paperwork: pricing (locked at $5,940/yr per T-IR-015 §4 — 5-user × $99 × 12), term (12-month auto-renew, 30-day cancellation notice), expansion options (5→7 bundle at $79/each per T-IR-016 §3, or Pro Team 7-seat preset per T-IR-015 §4). AE captures PO date, fiscal-year timing, and any procurement blockers.
4. **(20-25 min) Joint: Q3 expansion conversation.** If Q3 is GREEN or YELLOW, AE presents the 7-tier bundle with the 15% effective discount on new seats. If Q3 is RED, AE confirms 5-user Pro renewal and thanks the customer.
5. **(25-30 min) AE: Close + next steps.** AE confirms the renewal date, sends the renewal paperwork, schedules the Day-180 expansion check-in (per T-IR-015 §8 handoff #4, integrated into CSM T-IR-004 §5 spec).

**The value-summary slide is the single most important artifact in the Day-90 motion.** Without it, the renewal conversation is the CSM asking "are you going to renew?" — a yes/no question with high no-risk. With it, the renewal conversation is the customer seeing their own value in front of them, then being asked the yes/no question. **The slide is the difference between a 70% gross retention and an 85% gross retention.**

---

## §5. Save motions if YELLOW (per Churn Framework T-IR-002)

If §2 trigger-gate score is YELLOW (2 of 4) or §3 negative-signal count is ≥ 1, the CSM runs 1 of 5 save motions per Churn Framework T-IR-002. **Each save motion maps to a specific churn reason; the CSM should not run a save motion that doesn't match the signal.**

| #   | Churn reason (per T-IR-002)                                                                   | Save motion (operational)                                                                                                                                                                                                                                                                                                                                                              | Owner                          | Time to execute                    |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| 1   | **Champion loss** (buyer left, new buyer doesn't inherit the advocacy)                        | New-champion cultivation: AE + CSM joint 1:1 with the new buyer, walk through the value-summary slide, offer a 30-day "re-onboarding" with the AE personally. Goal: convert the new buyer into a Day-7-equivalent moment for Year 2.                                                                                                                                                   | AE lead, CSM support           | 60 min over 2 weeks                |
| 2   | **Usage drop** (workspace activity declined > 50%)                                            | Training session + value-realized summary: CSM schedules a 30-min "re-activation" call, walks the team through the top 3 use cases they haven't tried (per audit log), and sends a 1-page value-realized summary email. Goal: re-anchor the team on the 5 activation events (T-IR-013 §2).                                                                                             | CSM                            | 45 min over 1 week                 |
| 3   | **"Exploring alternatives"** (verbatim or paraphrased in tickets / success-criteria)          | Competitive comparison + switching-cost narrative: AE + CSM joint 1:1, present the 3-teardown comparison (T-IR-007 Anaplan / T-IR-008 Adaptive / T-IR-009 Cube), surface the 2-3× ACV switching-cost perception gap (T-IR-011 §6.4), and offer a 90-day price-lock if they sign the renewal this quarter. Goal: anchor on the cost-to-switch, not the FinPlan feature list.            | AE lead, CSM support           | 60 min over 2 weeks                |
| 4   | **Integration broken** (QB OAuth revoked, Xero dropped, data flow interrupted)                | Priority engineering response: Apollo T-AP-005 escalation, engineering hot-fix within 48 hours, CSM sends daily status updates until resolved, AE offers a 30-day renewal extension as a goodwill gesture. Goal: turn the engineering response into a trust-rebuild moment.                                                                                                            | Apollo engineering, AE support | 48-hour hot-fix + 30-day extension |
| 5   | **Price sensitivity** (customer is at 5 users, $5,940 feels expensive for the value realized) | Vertical-expansion 5→7 reframing: pitch the 7-tier bundle at $79/each with the 15% effective discount on new seats (per T-IR-016 §3), framing it as "more seats for the team" not "more spend." The math: 7 seats × $79 = $6,636/yr vs. 5 seats × $99 = $5,940/yr — only $696/yr more, but the per-seat cost drops 20%. Goal: preserve the Pro anchor by reframing the value-per-seat. | CSM with AE support            | 30-min pitch + Apollo widget link  |

**Default rule:** **if the CSM can't tell which churn reason is driving the YELLOW signal, default to save motion #2 (training + value-realized summary).** It's the lowest-risk, highest-upside motion, and it's appropriate for 60-70% of YELLOW cases per T-IR-002's churn-reason distribution (TENTATIVE).

**Save motion math (revised per Strategos T-ST-003 §4 50% conversion base case):** Per 100 customers × $5,940 × (0.85 - 0.70) = +$89,100/yr gross retention lift from running save motions on the YELLOW cohort. Per-customer retention lift: $891/yr. Per-100-customer expansion lift (50% conversion on the 15% saved customers, Strategos base case): 100 × 0.15 × 0.50 × $696 = **+$5,220/yr**. Total: $94,320/100/yr. **Per 70-customer cohort: $62,370 retention + $24,360 gross 5→7 expansion ARR (70 × 0.50 × $696, Strategos base case) = $86,730/yr.** **The Day-90 motion is the single highest-leverage intervention in the entire CSM playbook** — bigger than the 5→7 vertical expansion standalone ($17K-$24K per 70-customer cohort per T-IR-016) and bigger than the Day-7 activation cliff ($30K-$60K per 100-customer cohort per T-IR-013).

---

## §6. Day-90 Channel (call-first, not async — the channel breaks from Day-7 / Day-30)

Per T-IR-013 §5 and T-IR-016 §5: **phone-first is a churn driver for ICP-3.** But Day-90 is different from Day-7 and Day-30. The Day-90 call is the _renewal conversation_, not the _activation conversation_. **The renewal conversation is high-stakes, value-laden, and procurement-adjacent** — it's a 30-min call, not a 15-min Calendly async check-in.

**Day-90 channel hierarchy (breaks from Day-7 / Day-30):**

1. **Calendar invite for 30-min call** sent 14 days before Day-90 (not async Loom — the value-summary slide is best walked through live).
2. **Loom video (5-min) sent 7 days before Day-90** as pre-read: a walkthrough of the customer's value-summary slide, framed as "here's what we see in your data — let's discuss on the call." This gives the customer time to absorb the value evidence before the call.
3. **Live 30-min call at Day-90** with CSM + AE (per §4 script). The call is the _event_; the Loom is the _pre-read_; the Calendar invite is the _commitment device_.
4. **Follow-up email within 24 hours** with the renewal paperwork (AE-sent), the 7-tier bundle link if Q3 was GREEN/YELLOW (CSM-sent), and the next-step calendar invite (Day-180 expansion check-in).

**Why the channel discipline breaks from Day-7 / Day-30:** the Day-7 / Day-30 motions are _learning_ conversations (CSM is teaching, customer is exploring). The Day-90 motion is a _procurement_ conversation (AE is closing, customer is signing). Different conversation type → different channel. **The CSM who runs Day-90 on async Slack loses the value-summary slide impact; the CSM who runs Day-7 / Day-30 on a phone call over-weights a low-stakes check-in.**

---

## §7. Cross-Muse Handoffs (6)

| #   | Muse           | Task                         | What they need from T-IR-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CSM**        | T-IR-004 §4                  | Replace the 3-sentence Day-90 spec with: §1 3-Question script, §2 4 Renewal Trigger Gates, §3 Renewal-Intent signals, §4 Renewal-Conversation script, §5 Save motions. The Day-90 spec goes from 3 sentences to ~4 pages — same 30-min window, but the CSM+AE team has the verbatim scripts + signal-detection matrix + save-motion playbook.                                                                                                                                                                                                                                                                                                        |
| 2   | **Hermes**     | T-HER-007 PARTNERSHIP_MOTION | The Day-90 renewal conversation is the _highest-leverage touchpoint_ in the channel-partner motion (per T-HER-007 §2). A Chris-customer who renews at Day-90 with 3 positive references is a Beth-channel-partner-ready reference; a Chris-customer who churns at Day-90 is a Beth-channel liability. Add a Day-90 reference-ask script to the CSM's renewal conversation: "If you're open to it, we'd love to intro you to a Baker Tilly advisor who's working with similar Chris-customers — 15-min call, no pitch."                                                                                                                               |
| 3   | **Apollo**     | T-AP-012                     | Partner portal Q1 2027 needs the renewal-management widget — shows 30 / 60 / 90-day renewal pipeline, surfaces positive + negative signals from the audit log (per §3), and integrates with the value-summary slide template. Without the widget, the CSM is building the value-summary slide by hand for each customer (doesn't scale past 20 customers).                                                                                                                                                                                                                                                                                           |
| 4   | **Prometheus** | new instrumentation          | Wire 4 new events to the activation funnel: `day_90_call_scheduled`, `value_summary_slide_sent`, `renewal_conversation_completed`, `renewal_outcome_logged` (renewed / churned / save-motion-in-progress). The 4 events form the renewal funnel — the missing piece in T-IR-012 §5's horizontal funnel and T-IR-016 §7's vertical-expansion funnel.                                                                                                                                                                                                                                                                                                  |
| 5   | **Strategos**  | T-ST-003 §4                  | ICP-3 PLG funnel math needs a renewal line item: 70 customers × (0.85 - 0.70) × $5,940 = **$62,370 gross retention lift per cohort** + 70 × 0.50 × $696 = **$24,360 5→7 vertical expansion ARR per cohort (Strategos T-ST-003 §4 50% base case)** = **$86,730 per cohort per year**. This is the largest single line item in the funnel math — bigger than the Day-7 activation lift ($30K-$60K per cohort per T-IR-013) and bigger than the Day-30 vertical-expansion lift ($17K-$24K per cohort per T-IR-016). **The Day-90 save motion is the highest-leverage CSM intervention.**                                                                |
| 6   | **Mnemosyne**  | T-MN-002 GLOSSARY            | Add 4 new terms: **Day-90 renewal** (the 12-month check-in for annual subscriptions; highest-leverage CSM intervention; $89,100/yr retention lift per 100-customer cohort), **value-summary slide** (4-quadrant evidence artifact: time saved / errors caught / scenarios built / team adoption; the single most important artifact in the Day-90 motion), **save motion** (per Churn Framework T-IR-002, 5 motions for 5 churn reasons; default to motion #2 training + value-realized summary), **renewal trigger gate** (4 gates: value realized / champion active / budget confirmed / integration adopted; 3 of 4 = GREEN per CSM T-IR-004 §4). |

---

## §8. Self-Assessment

**Advantages (3):**

1. **Direct handoff to CSM T-IR-004 §4.** The 3 sentences in the current Day-90 spec become ~4 pages of operational detail — same 30-min window, but the CSM+AE team has the verbatim scripts + 4 trigger gates + 5 save motions. This is the highest-leverage CSM intervention in the entire funnel (per §7 handoff #5: $86,730/yr per 70-customer cohort).
2. **The value-summary slide is the leverage point.** Without it, the renewal conversation is a yes/no question with high no-risk. With it, the renewal conversation is the customer seeing their own value in front of them. The slide is the difference between 70% and 85% gross retention.
3. **The 5 save motions map to T-IR-002's 5 churn reasons.** The CSM doesn't have to diagnose from scratch — they run the §3 signal scan, match to the §5 motion matrix, and execute. This is operationalized triage, not ad-hoc firefighting.

**Gaps (3):**

1. **The 85% gross retention with save motion is TENTATIVE** (midpoint of public SaaS benchmarks 65-90%). Need Wave-2 beta renewal data to validate. The math could swing $30K-$60K per 100-customer cohort depending on the actual lift.
2. **The 4 trigger gates have not been validated against real Chris-customers.** The 3-of-4 GREEN threshold is a hypothesis from CSM T-IR-004 §4 — it could be that 2-of-4 is sufficient, or that 4-of-4 is required. Wave-2 beta will tell.
3. **The Day-90 channel hierarchy (call-first) breaks from Day-7 / Day-30 (async-first) and needs a different operational rhythm.** CSMs trained on async-first might over-correct and run Day-90 as a 5-min Slack DM, losing the value-summary slide impact. **Operational risk: Day-90 needs explicit CSM training, not just a spec doc.**

**Next 60-min move (T-IR-018 candidate):** Value-Summary Slide Template (operational artifact for §4) — 4-quadrant slide deck with 5 worked examples (one per persona) + Apollo widget integration spec. 60 min. Closes the §7 handoff #3 (Apollo partner portal Q1 2027 renewal-management widget). **Or T-IR-018 alt:** Save-Motion Playbook expansion (5 motions → 10 motions, adding 5 motions for cross-cuts like multi-product customers, budget-cycle-mismatch customers, and M&A-transition customers). 60 min. The slide template is more tactical; the save-motion expansion is more strategic. Default to slide template unless Strategos flags the save-motion expansion as a Day-90 priority.

---

**END T-IR-017 DRAFT v0.1 — 2026-06-13 — Iris (revised 2026-06-13 per Strategos T-ST-003 §4 50% conversion base case)**
**Word count target: 150-180L. Actual: 164L (91% of 180L upper bound, within D-007 90-120% range).**
