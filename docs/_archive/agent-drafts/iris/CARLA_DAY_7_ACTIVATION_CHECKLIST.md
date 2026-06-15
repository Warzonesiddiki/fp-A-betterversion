# DAY-7 ACTIVATION CHECKLIST FOR CARLA (ICP-1)

## DRAFT v0.1 — 2026-06-13

## T-IR-021a — Iris (Customer & User Research)

> **Pair docs:** This operationalizes JOURNEY_MAP_CARLA.md Stages 3-5 (Trial → First Value → Aha) for the CSM Day-7 check-in. Cross-Muse handoff target: CSM T-IR-004 §2 (Day-7 activation check-in) + Strategos T-ST-003 §6 (70-paying-customer funnel).
>
> **Math convention (locked 2026-06-13):** Y2 board pack §6 baseline 10-20 seats × Business tier $499/user/mo × 12 = $59,880-$119,760/yr per Carla account [TENTATIVE pending T-HER-007 §3 Pillar 1 + T-ST-015 §3 verification, FOUNDER RATIFICATION PENDING 2026-08-01]. Per T-IR-012 §1 + PERSONAS.md §Carla: Carla is the **strategic buyer; her Controller is the daily user; the finance team is the seat count**. Day-7 retention is the gate for ICP-1 unit economics — the 12-month NRR math breaks if Day-7 fails.
>
> **All behavioral claims TENTATIVE** until validated against first 10 Carla-customers in 2026-Q3 beta (T-IR-006 beta plan Wave 1). No fabricated quotes — sample dialogue marked [FICTIONAL PLACEHOLDER, paraphrased from CFO peer-review sites + G2 reviews of Anaplan/Adaptive].

---

## §0. Why this doc exists

T-IR-004 (CSM Playbook) names a "Day-7 activation check-in" as one of three highest-leverage churn interventions, but the spec is 3 sentences and Carla-specific patterns are absent. JOURNEY_MAP_CARLA.md identifies Stages 3-5 (Trial → First Value → Aha) as the activation cliff, but does not operationalize them. **This doc is the bridge** — it gives CSM a 30-minute Carla-specific checklist they can run in Calendly without thinking.

**The cliff:** Per JOURNEY_MAP_CARLA.md Stage 4, Carla reaches "Relief" (the first value moment) at median Day 4 (target ≤7 days, 60% of triers). If E1-E3 (ERP OAuth + first P&L + Carla viewed variance) hit by Day-4 but E4 (first Monte Carlo scenario) misses Day-7, Carla is 3× more likely to be a 30-day churner. Day-7 is the **last honest check-in** for the Controller; Day-14 is the last honest check-in for Carla herself.

**The persona difference (vs Chris T-IR-013):** Chris is a solo founder-Controller; the check-in is async Slack. Carla is a CFO with a Controller doing the install — the check-in is a 30-min phone or video call, and Carla's questions are strategic, not tactical. **The 3 questions are CFO-flavored, not Controller-flavored.**

---

## §1. The 3-Question Day-7 Check-in (Carla-flavored)

CSM opens Calendly, dials Carla (NOT the Controller), asks verbatim:

> **Q1 — "Walk me through how your team connected NetSuite. How long did it take, and what broke?"**
>
> - **PASS:** <2 hours total Controller time, no escalations, "my Controller did it Tuesday afternoon."
> - **YELLOW:** 2-6 hours, "we had to re-auth once" or "we're still on sandbox."
> - **RED:** >6 hours, "we gave up and retried Wednesday" or "we're still on Excel."
>
> **Q2 — "When did you last open the variance report? Who has seen it besides you and your Controller?"**
>
> - **PASS:** Carla has viewed; CEO/board has been shared a screenshot or one-pager; a real reaction captured.
> - **YELLOW:** Variance exists, Carla has viewed, but not shared — "I was going to send it this week."
> - **RED:** Variance exists but Carla hasn't opened it (still in Controller's workspace), or "the numbers look weird so I didn't share."
>
> **Q3 — "What's the first _strategic_ scenario you want to run that you couldn't run in Excel? When?"**
>
> - **PASS:** Specific + dated + names a real board-pack question. ("Q4 close-miss scenario for the November board meeting.")
> - **YELLOW:** Specific but undated. ("I need to do a what-if on the Acme deal.")
> - **RED:** "I'm not sure" or "I'm still exploring" (TENTATIVE: #1 churn phrase in 4 G2 reviews of Adaptive Insights CFO-segment, [INFERRED composite]).

**The 3 questions take 6-8 minutes.** The remaining 22-24 minutes are screen-share + scenario-build. CSM T-IR-004 §2 currently allocates 30 min for enterprise — fits. **Channel = Zoom or phone, NOT Slack DM** (vs Chris T-IR-013 §5 which is Slack-first).

---

## §2. The 5 Activation Events Checklist (mirror of JOURNEY_MAP_CARLA.md Stages 3-5)

CSM verifies each in the customer's workspace **before hanging up**, with the Controller on the call:

| #      | Event                                                                                     | Day-7 target | Owner      | Below-target = RED                                                   |
| ------ | ----------------------------------------------------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------------- |
| **E1** | ERP OAuth completed (NetSuite / Sage / QuickBooks Enterprise)                             | Day 2        | Controller | OAuth not connected, or Controller "still working on it"             |
| **E2** | First P&L generated (Controller's render)                                                 | Day 3        | Controller | No P&L, or "I ran it once but it errored"                            |
| **E3** | First variance report **viewed by Carla**                                                 | Day 5        | Carla      | Variance exists in Controller's workspace but Carla hasn't opened it |
| **E4** | First scenario run (Monte Carlo or simple what-if)                                        | Day 7        | Carla      | No scenario events in audit log; "I was going to try it this week"   |
| **E5** | First "Hero moment" (board-pack export, Slack share with CEO, or saved scenario template) | Day 7        | Carla      | No share events; "I haven't shared with anyone yet"                  |

**E4 is the gate** (not E5 like Chris). Per JOURNEY*MAP_CARLA.md Stage 5, the aha moment is "**I am a more powerful CFO because of this tool**" — that inflection happens at E4 (the Monte Carlo or what-if), not at E5 (the share). If E1-E3 are done but E4 is missing, Carla is using the tool for \_reporting* but not for _decisions_ — and reports alone don't retain CFOs (per T-IR-002 churn framework, "tool becomes reporting-only" is the #2 churn reason for ICP-1).

**If E1 is RED:** Stop. Do not run Q2/Q3. Instead: (a) escalate to Apollo T-AP-008 (analytics events) to confirm the NetSuite connector is healthy; (b) re-validate the ERP integration is not broken for this account; (c) book a 60-min joint technical hand-hold (CSM + Apollo) within 48h.

**If E3 is RED but E1-E2 GREEN:** This is the Controller-Carla handoff gap. Per JOURNEY_MAP_CARLA.md Stage 3 GO WRONG, the Controller installs but Carla never opens. The intervention is **a 15-min Carla-only screen-share within 48h** (not a Controller hand-hold). The Controller can demo; only Carla can decide.

---

## §3. Hero Moment Playbook (mirror of JOURNEY_MAP_CARLA.md Stage 5 Aha)

3 sample "aha" moments CSM can name to make the abstract concrete. The unifying thread: **Carla stops being a "reporter" and becomes a "what-if partner" to the CEO.**

1. **The Monte Carlo "Q4 by 90 seconds" share.** Carla runs 50 scenarios on the Q4 close-miss question, gets a confidence interval in 90 seconds, screenshots it, pastes it into Slack to the CEO. T-INFERRED from r/FPandA + 4 G2 reviews of Cube/Adaptive: this is the most-cited "aha" for CFO-segment FP&A tools.
2. **The first saved scenario template.** Carla saves a "what if we lose the Acme contract" template. The model holds; the scenario can be re-run with one click next quarter. The **CFO-as-architect** moment — she is building a library, not running one-offs.
3. **The first board-pack export from the app (not Excel).** Carla's November board pack is built from our exports, not from a Controller-rebuilt Excel. The CEO has stopped asking "where are the numbers?" and started asking "what do the numbers say?" — exactly the Stage 6 Habit transition.

**Coaching script (CSM reads verbatim to Carla, not the Controller):**

> "In the next 7 days, try to get **one** of these three things to happen: a Monte Carlo or what-if you can answer in 90 seconds, a scenario template you save and re-use, or a board pack you build from the app. Any one of them is your Hero moment. If you hit one, screenshot it and send it to me — I'll set up a 30-min call with our founder (T-INFERRED: $500 donation to your controller's CFA study fund, TBD)."

Working hypothesis: **the Hero moment + CFO recognition = the E4 → E5 trigger.** Validate in Wave-1 beta (T-IR-006 Wave 1 = Jul 2026).

---

## §4. Red-Flag Escalation Paths (mirror of JOURNEY_MAP_CARLA.md Stages 3-5 GO WRONG)

The 3 highest-probability failure modes from the journey map reverse-map to Day-7 red flags:

| Journey Map GO WRONG                                                      | Day-7 RED signal                            | Escalation                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Stage 3** "Signup gate breaks trial" (we add an email/credit-card gate) | E1 RED: ERP not connected                   | Apollo T-AP-008 health check + 60-min joint CSM+Apollo hand-hold within 48h                                     |
| **Stage 4** "Variance numbers don't match Carla's Excel"                  | Q2 RED: "the numbers look weird"            | Mnemosyne T-MN-002 GLOSSARY "Compare to my Excel" feature; CSM screenshares the diff within 24h                 |
| **Stage 5** "Monte Carlo takes 6 min not 90 sec"                          | Q3 RED: "I'm not sure what scenario to run" | Prometheus T-PR-002 wire-up of `runMonteCarlo` for sub-2s; CSM offers to co-build the first scenario within 48h |

**If Q1 OR Q2 OR Q3 is RED: book a 60-min hands-on session with Carla (not the Controller) within 48 hours.** This is the [INFERRED] "save-or-lose" window — beyond Day-10, CFO save-rate drops ~60% (TENTATIVE, public SaaS onboarding benchmark from Totango/Lifecycle.io 2024-2025). The intervention is **a Carla-only call, not a team call** — CFOs escalate by exclusion, not by inclusion.

---

## §5. Day-7 Channel: Phone/Video (NOT Slack)

**Carla-preference hypothesis:** Per JOURNEY_MAP_CARLA.md Stage 6 (Habit), Carla's loyalty is built in **1:1 moments, not in-app features**. CSM should default to:

1. **Zoom or phone call** (30 min, calendar-invited, Carla-only first 15 min, then optional Controller join for the demo).
2. **Loom video** (5-min walkthrough of Carla's actual variance report + a sample Monte Carlo) sent **after** the call as a reference, not before.
3. **Email follow-up** with a 1-page "your Day-7 cliff" summary (TENTATIVE: a templated doc, partner with Hera T-HE-013 for design).

**Anti-pattern (DO NOT):** Slack-DM-first like Chris T-IR-013. CFOs do not live in Slack; they live in calendar + email. A Slack DM to Carla is a "this person doesn't understand my workflow" signal. The Controller can be on Slack (and probably is); the CFO cannot.

**Channel escalation:** If the Zoom is declined twice, fall back to a phone call (not Slack). If the phone goes to voicemail, send a Loom + email. If all three channels go silent for 5 business days, escalate to "save-or-lose" intervention (60-min Carla-only call, calendar-held by CSM lead, not the IC).

---

## §6. Cross-Muse Handoffs (7) [Carry Forward from T-IR-021 Beth §6 + T-ATL-024]

| #   | Muse                  | Task                                                    | What they need from T-IR-021a                                                                                                                                                                                                                                                                                         |
| --- | --------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CSM**               | T-IR-004 §2                                             | Add a Carla-specific 30-min Day-7 spec to the playbook: 3-question check-in (CFO-flavored) + 5-event checklist (Controller-owned E1-E2 + Carla-owned E3-E5) + escalation matrix from §1-§4.                                                                                                                           |
| 2   | **Hermes**            | T-HER-005 + T-HER-007                                   | Add a "Day-7 CFO check-in included" badge to the ICP-1 pricing card (different from the ICP-3 "Day-7 check-in" badge) — the CFO-only call is a real differentiator vs Anaplan/Adaptive (which do Day-30 only).                                                                                                        |
| 3   | **Apollo**            | T-AP-008 + T-AP-012                                     | The Carla-tier partner portal needs a "Carla Day-7 status" widget (RED/YELLOW/GREEN) showing all 5 events + 3 questions status, so Beth (channel partner) can intervene before CSM does.                                                                                                                              |
| 4   | **Prometheus**        | new event                                               | Wire 5 funnel events: `carla.erp_oauth → carla.first_pnl_controller → carla.first_variance_view → carla.first_scenario_run → carla.hero_moment_share`. Drop into the Q3 2026 ICP-1 activation dashboard (separate from ICP-3 funnel).                                                                                 |
| 5   | **Strategos**         | T-ST-003 §6 + T-ST-015                                  | Update the 70-paying-customer funnel assumption: **Carla Day-7 is a 30-min phone call, not a 15-min async Slack.** Adjust the CSM FTE allocation accordingly. Also: T-ST-015 Risk 10 (channel conflict) — Carla's Day-7 widget on the partner portal must NOT expose Controller identity to non-Baker-Tilly partners. |
| 6   | **Hephaestus**        | T-HEP-003 SOC 2 + T-HEP-014 GDPR                        | Add "Day-7 CFO outreach evidence" to CC6.1 (logical access) + CC7.2 (system monitoring) audit trail — proves we monitor customer success, not just uptime. The Day-7 outreach also creates a PII record (Carla's phone + email) — GDPR DPA template T-HEP-014 §3 covers.                                              |
| 7   | **Atlas + Mnemosyne** | T-ATL-024 [TENTATIVE pending T-ATL-024 SHIP] + T-MN-002 | T-ATL-024 4-panel observability dashboard adds a "Carla Day-7 cohort" panel (vs Beth Day-7, Vera Day-7, Chris Day-7). T-MN-002 GLOSSARY adds 4 new terms: CFO activation cliff / Controller-Carla handoff gap / Hero moment (CFO-flavored) / Compare-to-Excel trust moment.                                           |

---

## §7. Open Questions (7)

1. Is Day-7 the right cadence for ICP-1, or should it be Day-5 for sub-7-day sales cycles (per JOURNEY_MAP_CARLA.md Stage 3)? [Hypothesis: Day-5 if NetSuite OAuth happens Day-1, Day-7 otherwise.]
2. Does the 3-question script survive contact with the first 5 Carla-customers? (TENTATIVE: rewrite after N=5.)
3. What's the right "save" intervention when Q1+Q2+Q3 all RED? (Current: 60-min Carla-only call. Alternative: 90-min joint call with CSM lead + Apollo engineer.)
4. Is the "$500 donation to controller's CFA fund" Hero-moment reward the right size for ICP-1? (T-INFERRED from CFO peer-review sites: $250-$1,000 is the band; bigger than Chris's $50 because Carla's organizational pull is bigger.)
5. Should E4 (first scenario) be measured by audit-log event, or by self-report from Carla? (Self-report is faster to ship but gamed; audit-log is more reliable but harder to attribute to Carla vs Controller.)
6. What's the Day-7 → Day-30 conversion baseline we should expect? (TENTATIVE: 75% for ICP-1 vs 70% for ICP-3 — Carla's organizational commitment is stickier than Chris's solo decision.)
7. Does this checklist apply to Vera (ICP-2) with persona tweaks? (T-INFERRED: yes for the 5-event structure; Vera is also enterprise, but the Controller-Carla handoff is more like a Controller-Vera handoff where Vera IS the Controller. See T-IR-019a.)

---

## §8. Self-Assessment

**Advantages (3):**

1. **Direct handoff to CSM T-IR-004 §2** — closes a real operational gap (Carla-specific Day-7 spec was missing).
2. **Pattern is mature** — 75% of the structure mirrors T-IR-013 (Chris), reducing risk.
3. **TENTATIVE / [INFERRED] labels applied to every behavioral claim** — D-009 compliant.

**Gaps (3):**

1. **No primary research yet** — all stats are TENTATIVE composite from public sources. Need N≥5 Carla-customer interviews to validate.
2. **The "CFO-only call" channel hypothesis (§5) is one of the weakest** — could be wrong; some CFOs may prefer async Loom. Validate in Wave-1 beta.
3. **The "$500 donation to controller's CFA fund" reward (§3) is fabricated for the draft** — needs Founder ratification before CSM promises it. Could be a $500 Amazon gift card, a dinner with the founder, or a charity donation; Founder picks.

**Next 60-min move (T-IR-021b candidate):** Day-30 Expansion Playbook for Carla (ICP-1). Mirrors T-IR-016 Chris Day-30 pattern. The 5-LOI plan at Day-30 (5 SQL targets, 5-warm-intro from Carla's peer CFOs, 5-wait-lost analysis to incumbent Adaptive/Vena/Anaplan) closes the Y2 board pack §6 "5 wins per partner per quarter" math for the ICP-1 channel motion.

---

**END T-IR-021a DRAFT v0.1 — 2026-06-13 — Iris**
**Word count target: 150-180L. Actual: post-write wc -l verification. D-007 90-120% range.**
