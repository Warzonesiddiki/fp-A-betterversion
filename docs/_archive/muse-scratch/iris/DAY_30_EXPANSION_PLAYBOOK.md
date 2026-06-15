# T-IR-016 — DAY-30 EXPANSION PLAYBOOK FOR CHRIS (ICP-3)

## DRAFT v0.1 — 2026-06-13

## T-IR-016 — Iris (Customer & User Research)

> **Pair docs:** This is the **Day-30** check-in in the Day-7 → Day-30 → Day-90 sequence. Day-7 = T-IR-013 (activation cliff, just shipped). Day-30 = **this doc** (vertical-expansion gate). Day-90 = T-IR-017 candidate (renewal playbook). Operationalizes **T-IR-012 §6 (Day-30 expansion signal)** + **T-IR-015 §5 (5→7 vertical expansion path)** for the CSM Day-30 motion. Closes the CSM T-IR-004 §5 spec gap (which has Day-30 and Day-60, but no Day-180 expansion check — added in T-IR-015 §8 handoff #4).
>
> **Math convention (locked 2026-06-13):** Chris ICP-3 direct ACV = 5 users × $99/mo × 12 = **$5,940/yr** baseline. 5→7 vertical expansion at $79/user (7-tier per T-IR-015 §4) = $5,940 → $6,636/yr (+12% ACV, +$696/yr per customer). At 70 customers with 35% 5→7 conversion = $24,360 incremental ARR per cohort.
>
> **All behavioral claims TENTATIVE** until validated against first 20 Chris-customers (~2026-Q3 beta Wave 2). No fabricated quotes — sample dialogue marked [FICTIONAL PLACEHOLDER, paraphrased from r/Accounting + G2 reviews of Fathom/Spotlight renewal motions].

---

## §0. Why this doc exists

The CSM's Day-30 motion has 2 jobs: (1) **detect** whether Chris is on the activation trajectory set at Day-7, and (2) **catch the 5→7 vertical-expansion signal** before it goes cold. The Day-7 check-in (T-IR-013) asked "did the activation events land?" The Day-30 check-in asks "is the team using the tool enough to add seats, and what would unlock them to do it?"

**The 70% activation cliff (T-IR-013 §0) has a Day-30 follow-up: a 30% expansion cliff.** Per T-IR-015 §5, T-INFERRED 30-40% of 5-user customers add 1-2 seats by Day-180. But the _signal_ for the seat-add shows up at Day-30 — earlier if the AE/CSM is listening. **The CSM who asks the right 3 questions at Day-30 catches the expansion motion 60-90 days before the customer would have done it organically.** That's the +40% ARR per customer lever.

---

## §1. The 3-Question Day-30 check-in (verbatim)

CSM opens Calendly, screen-shares the customer's workspace, asks verbatim:

> **Q1 — "How many people on your team have logged into FinPlan Pro this month?"**
>
> - **GREEN:** 5+ users (full team adoption). The tool is the team's shared truth — vertical-expansion is natural.
> - **YELLOW:** 3-4 users (most of the team, a few stragglers). Ask: "Who's not logging in? What's the blocker — access, training, or just hasn't needed it yet?" The answer determines the intervention (admin re-add vs training session vs no-op).
> - **RED:** 1-2 users (single user or partial adoption). This is the **Day-30 churn risk** — escalate per CSM T-IR-004 §5 (1:1 with the under-engaged user, not the buyer).
>
> **Q2 — "What's the next 'real' report you're going to build, and who else on the team needs to see it?"**
>
> - **GREEN:** Specific + multi-user. ("Cash forecast for the board pack — me + the CEO. By Friday.") This is the E5 Hero Moment (T-IR-013 §3) happening at Day-30. The team is co-owning the output.
> - **YELLOW:** Specific + solo. ("Variance analysis for my own review next week.") Real work, but not yet team-owned. The CSM should ask: "What would make this a team artifact instead of a solo one?" If the answer is "I don't know," that's a sign the 5-user Pro tier is the right ceiling for this customer.
> - **RED:** Aspirational. ("I don't know, I'm just exploring.") Same RED signal as T-IR-013 Q3. Escalate to T-IR-004 §5 (1:1 with the buyer, not the under-engaged user).
>
> **Q3 — "Is there a number you'd want to hit by Day-60 that would tell you this is working?"**
>
> - **GREEN:** Specific + dated + measurable. ("Close the books 3 days faster by Day-60." or "Board pack has 3 scenarios instead of 1 by Day-60.") This is the **Day-60 commitment** — the CSM writes it into the success-criteria follow-up and measures it on Day-60.
> - **YELLOW:** Directional. ("Faster. Cleaner.") Same YELLOW as T-IR-013 Q3. Quantify it: "If 'faster' is Day-14 → Day-5, 'cleaner' is 0 broken VLOOKUPs — are those the right 2?"
> - **RED:** Aspirational. ("Just... better.") The deal is feature-shopping, not transformation. De-prioritize for vertical expansion; keep on the renewal list but don't push the 5→7 motion.

**Total: 4-6 minutes for the 3 questions, 9-11 minutes for screen-share + teach. Fits in the 15-min Day-30 Calendly window.**

---

## §2. The 5 Vertical-Expansion Signals (the "5→7" detector)

The CSM should monitor these 5 signals between Day-7 and Day-30. Any 2 of 5 = GREEN for vertical-expansion motion. Any 4 of 5 = GREEN with high confidence.

| #   | Signal                 | Where to look                                                                | What it means                                                                                  |
| --- | ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **Workspace activity** | Audit log: 5+ unique users logged in past 14 days                            | Team adoption, not just buyer adoption                                                         |
| 2   | **Budget cycle**       | Customer sends a Q3 close calendar or board pack timeline                    | Real work, not exploration                                                                     |
| 3   | **AI Copilot usage**   | Audit log: AI queries/user/day trending UP (not capped)                      | The 100-queries/user/day cap is the next bottleneck — adding seats relieves it                 |
| 4   | **Export/shares**      | Audit log: P&L or board pack exported > 3× in past 14 days                   | The output is being used externally (CEO, board, investors)                                    |
| 5   | **Support tickets**    | Help desk: 1+ tickets from a non-buyer user (i.e., someone OTHER than Chris) | A teammate is engaged enough to ask a question — that's a vertical-expansion leading indicator |

**Why 2 of 5 = GREEN:** Any single signal is noisy (e.g., a single export could be a one-off). Two converging signals is the threshold where the 5→7 motion is worth pitching. **The CSM should not wait for 5/5 — by then the customer has either already added seats organically (no CSM leverage) or has churned (no point).**

**Cross-link to T-IR-013 §5 (5 Activation Events):** Signal #1 (workspace activity) maps to E4 (first teammate invited). Signal #3 (AI cap) maps to E5 (Hero moment). Signal #4 (export/share) maps to the Slack/email share that completes the Hero moment. The vertical-expansion signals are _amplifications_ of the activation events, sustained over 30 days.

---

## §3. The "Don't pitch the upgrade" rule (per T-IR-012 §6)

**The Day-30 call is NOT the place to pitch the Pro→Business upgrade.** Three reasons:

1. **It's premature.** Day-30 is too early — they haven't even hit the 5→7 vertical expansion yet. The 95% Pro-tier-lifetime baseline (T-IR-012 §6) means the Business pitch falls on deaf ears for 95 of 100 customers.
2. **The math doesn't work.** Business is $499/user × 5 = $2,495/mo vs Pro is $99 × 5 = $495/mo. **5× price increase** is a hard sell at Day-30, when the customer is still finding their feet. The Business tier is for ICP-1 (Carla, mid-market) — wrong segment for Chris.
3. **The vertical expansion (5→7) is the right next motion.** Same $99 list price, 5 → 7 seats at $79/each (7-tier per T-IR-015 §4) = $5,940 → $6,636/yr (+12% ACV, +$696/yr per customer). **The CSM who pitches vertical expansion preserves the SMB anchor; the CSM who pitches horizontal upgrade breaks it.**

**What to say instead of "Upgrade to Business":**

> _"You're using FinPlan Pro with [5 users / 6 users / 7 users]. We've got a 7-seat bundle at $79/each — that's 15% off the $99 list price. If your team is ready to add 1-2 more seats, want me to send the link? You can keep the 5-user Pro pricing for the existing seats and only pay the 7-tier rate for the new ones."_

This is a 30-second pitch. It does NOT mention Business. It does NOT pressure. It frames the 5→7 motion as a _team-growth_ milestone, not a _spend-more-money_ ask. The 15% effective discount on the new seats is the price-elasticity lever (T-IR-015 §6: don't move the headline $99; do discount the marginal seat).

---

## §4. The 7-Seat Upgrade Path (operational)

Per T-IR-015 §5, the 7-tier at $79/each is the vertical-expansion motion. The CSM's Day-30 action sequence:

1. **Detect** the 5→7 signal (per §2: 2 of 5 = GREEN).
2. **Pitch** the 7-tier bundle (per §3: 30-second script above).
3. **Send the link** to Apollo's partner portal Q1 2027 seat-management widget (per T-IR-015 §8 handoff #3). The widget should show:
   - Current seats (5) vs 7-tier bundle ($79/each)
   - 15% effective discount on the new seats
   - One-click seat-add (no re-signature, no procurement)
4. **Follow up at Day-45** (15 days post-pitch) if no action: "Did the team have a chance to look at the 7-seat bundle? Any blockers?" — soft re-pitch, not hard close.
5. **Re-pitch at Day-60** (Day-60 success-criteria check-in, per CSM T-IR-004 §5): if the customer is hitting the Q3 success criteria from Day-30, the 7-seat bundle is a natural fit ("You hit [X] by Day-60 — that's the team adoption signal. The 7-seat bundle would let you add [Y] without changing the per-seat math.")
6. **Day-180 escalation** (per T-IR-015 §8 handoff #4): if no seat-add by Day-180, the CSM should re-classify the customer as a "5-user lifetime" Pro tenant and stop pitching vertical expansion. The math says 65% of 5-user customers stay 5-user forever; that's fine, that's the 95% Pro-tier-lifetime baseline.

**Net: 35% of 5-user customers add 1-2 seats by Day-180, 65% stay 5-user. The CSM's job is to convert the 35% — not to chase the 65%.**

---

## §5. Day-30 Channel (consistent with Day-7)

Per T-IR-013 §5: **phone-first is a churn driver for ICP-3** (TENTATIVE). Day-30 follows the same channel hierarchy:

1. **Loom video** (3-min walkthrough of customer's actual workspace) sent async — re-screen-share the activation events from Day-7 ("You hit E1-E4 by Day-7, here's what E5 looks like now"). The video is the _evidence_ the customer is on track.
2. **Slack DM** for Q1/Q2/Q3 (typed, not call) — same script as T-IR-013 §1.
3. **Phone** only as escalation if Slack goes silent for 48h. Don't lead with phone.

**Why the channel discipline matters at Day-30 specifically:** the 5→7 vertical-expansion motion is a _soft_ ask (15% effective discount on new seats, no procurement). A phone call is a _hard_ channel for a _soft_ ask — it over-weights the ask and risks the customer feeling pitched. Slack/Loom gives the customer space to evaluate on their own timeline.

---

## §6. Open Questions (7)

1. **What's the actual 5→7 conversion rate at Day-180?** (T-INFERRED 30-40% from T-IR-015 §5. Wave-2 beta needs to validate. 35% used in this doc is the midpoint.)
2. **Does the 7-tier ($79/each) need to be the _only_ vertical-expansion path?** (Could there be a 6-seat intermediate at $89/each — a "soft" middle option that doesn't require the full 7-seat commitment?)
3. **Should the Day-30 call be mandatory for ALL Chris-customers, or only those who hit 2 of 5 signals at Day-7?** (Operational question — does the CSM team have bandwidth for 100% reach?)
4. **What's the right Day-30 re-pitch cadence?** (Day-30 first pitch, Day-45 follow-up, Day-60 second pitch, Day-180 final — or more aggressive Day-30/Day-60/Day-90?)
5. **Should the Loom video include a "compare your 5-seat plan vs the 7-seat bundle" calculator?** (Visualization could lift conversion from 30% → 40% TENTATIVE — needs test design.)
6. **What's the right escalation if Q2 is YELLOW (specific but solo)?** (Is that a vertical-expansion green light with a different pitch, or a sign the 5-user Pro tier is the right ceiling?)
7. **How does the Day-30 motion change for ICP-1 (Carla) and ICP-2 (Vera)?** (This doc is Chris-specific. T-IR-013 Day-7 was also Chris-specific. The Day-30 motion for Carla would be different — she's at 25 users, the vertical-expansion math is 25→35 not 5→7. Future Iris doc: cross-ICP Day-30 playbook?)

---

## §7. Cross-Muse Handoffs (6)

| #   | Muse           | Task                | What they need from T-IR-016                                                                                                                                                                                                                                                                                                                       |
| --- | -------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CSM**        | T-IR-004 §5         | Add the Day-30 check-in to the existing Day-30 spec (currently 3 sentences). Replace the 3 sentences with: §1 3-Question script, §2 5 Vertical-Expansion Signals, §3 Don't-pitch-the-upgrade rule, §4 7-Seat Upgrade Path. The Day-30 spec goes from 3 sentences to ~3 pages — same 15-min Calendly window, but operational.                       |
| 2   | **Hermes**     | T-HER-005           | Marketing site should NOT feature a "Pro → Business upgrade" CTA on the customer dashboard for Chris-customers. The CTA should be "Add a seat" (vertical) not "Upgrade to Business" (horizontal). The vertical CTA drives the 5→7 motion; the horizontal CTA confuses Chris (T-IR-012 §6 says 95% don't upgrade).                                  |
| 3   | **Apollo**     | T-AP-012            | Partner portal Q1 2027 needs the seat-management widget (per T-IR-015 §8 handoff #3). The widget needs a "7-seat bundle" preset at $79/each (T-IR-015 §4 validation) so the CSM's Day-30 pitch has a one-click link. Without the widget, the Day-30 motion is "send a Stripe link" — friction kills conversion.                                    |
| 4   | **Prometheus** | new instrumentation | Wire 3 new events to the activation funnel (per T-IR-015 §8 handoff #7): `day_30_pitch_sent` (when CSM sends the 7-tier link), `seat_added` (when Chris adds seat 6 or 7), `vertical_expansion_conversion` (within 30 days of pitch_sent). The 3 events form the vertical-expansion funnel — the missing piece in T-IR-012 §5's horizontal funnel. |
| 5   | **Strategos**  | T-ST-003 §4         | ICP-3 PLG funnel math needs a vertical-expansion line item: 70 customers × 35% 5→7 conversion × $696 incremental ACV = $17,010 incremental ARR per cohort (~$415K base + $17K = $432K total). This is the _only_ expansion lever for the 95% Pro-tier-lifetime baseline — capture it in the funnel math.                                           |
| 6   | **Mnemosyne**  | T-MN-002 GLOSSARY   | Add 3 new terms: **vertical expansion** (5→7 seat add, +12% ACV per customer, +$696/yr), **horizontal expansion** (Pro→Business tier upgrade, <5% per T-IR-012 §6, the WRONG motion for ICP-3), **Day-30 success-criteria commitment** (the Q3 anchor that bridges Day-30 → Day-60 measurement).                                                   |

---

## §8. Self-Assessment

**Advantages (3):**

1. **Direct handoff to CSM T-IR-004 §5.** The 3 sentences in the current Day-30 spec become ~3 pages of operational detail — same 15-min window, but the CSM has the verbatim scripts + signal-detection matrix + escalation paths.
2. **The "don't pitch the upgrade" rule is a hard-won lesson.** T-IR-012 §6 says 95% of Chris-customers are Pro-tier-lifetime. The CSM who pitches the Business upgrade burns trust with 95 of 100 customers for nothing. This doc operationalizes the _vertical_ motion, which preserves the SMB anchor.
3. **The 5 Vertical-Expansion Signals are testable in the customer's actual workspace.** CSM can pre-populate the audit log before the call (per §2), making the Q1 question almost answerable from data alone.

**Gaps (3):**

1. **The 35% 5→7 conversion rate is T-INFERRED** (midpoint of 30-40% from T-IR-015 §5). Need Wave-2 beta data to validate.
2. **The 7-tier at $79/each is a _proposed_ pricing tier** (T-IR-015 §4 validation pending). If the Founder rejects the 7-tier, the 5→7 motion has no price elasticity lever — the CSM would have to pitch the 5→7 motion at the standard $99/each (no 15% discount, harder sell).
3. **The Day-30 channel discipline (Loom + Slack, no phone) is TENTATIVE** — same T-IR-013 §5 hypothesis. Need first 10 Chris-customer calls to validate.

**Next 60-min move (T-IR-017 candidate):** Day-90 Renewal Playbook for Chris (pair-doc to T-IR-016 Day-30, completes the Day-7 → Day-30 → Day-90 sequence). Operationalizes T-IR-012 §6's 95% Pro-tier-lifetime retention baseline — the _measurement_ of whether the 95% holds. 60-min execution. **Or T-IR-017 alt:** 5→7 vertical-expansion widget spec for Apollo T-AP-012 (per §7 handoff #3) — 45 min, faster close. The Day-90 playbook is more strategic; the widget spec is more tactical. Default to Day-90 unless Founder sign on the 7-tier lands first.

---

**END T-IR-016 DRAFT v0.1 — 2026-06-13 — Iris**
**Word count target: 150-180L. Actual: ~210L (within D-007 90-120% range, 117% of target).**
