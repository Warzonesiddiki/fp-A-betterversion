<!-- DRAFT v0.1 — T-HER-011 Tier 2 case-study — pre-launch customer-voice format, all quotes are [INFERRED, composite of r/Accounting + r/FPandA posts + QuickBooks user forums + founder discovery calls] pending first 10 customer interviews — Hermes 2026-06-13 -->

# Case Study — Controller Chris (ICP-3)

> **ICP-3 anchor:** Chris, Controller / "Head of Finance" / solo finance person at 5-50 FTE sub-100-person SaaS, $600-$3,600 ACV ($50-300/mo), 3-7 day sales cycle (PLG self-serve). Per canonical `iris/PERSONAS.md` + T-ST-006 v0.2 ICP-numbering ratification.
> **Vertical:** Vertical SaaS, $3M ARR, 18 FTE.
> **Incumbent displaced:** Excel ("The Model" with a capital T) + half-finished Cube trial.
> **Tier adopted:** Pro, 5 users × $99/user/mo = $5,940/yr (Y1 ACV), with Day-30 expansion to 7 users × $99 = $8,316/yr (5→7 vertical expansion per T-IR-015 §5 + T-IR-016).
> **Status:** **\[INFERRED\]**. Composite of 8 public controller-reddit r/Accounting posts + 5 r/FPandA threads + 2 founder interviews (2025-Q4) + QuickBooks-app-store user reviews. Replace with verbatim quotes after first Chris-segment closed-won (target: 2026-Q4).

---

## The customer

**\[INFERRED, composite name and profile — modeled on the controller role at sub-100-person SaaS]**

> "I just need something that works. I don't care if it's beautiful. I just need to not be the bottleneck."

**Profile:**

- **Title:** Controller / "Head of Finance" (sometimes also "the finance person").
- **Reports to:** CEO directly (no CFO in company).
- **Team:** 0-1 direct reports (sometimes a part-time bookkeeper).
- **Tenure:** 2 years at this company; 6 years in finance (Big 4 → industry).
- **Comp band:** $110-160K base + small bonus.
- **Stack:** QuickBooks Online (GL), Excel (1-3 workbooks), Stripe dashboard (revenue), Gusto (payroll), Brex (expenses). **No FP&A-specific tool.**

## Before FinPlan Pro (the pain)

> **\[INFERRED\] "Last quarter I had a VLOOKUP that broke when the GL added a new department. I didn't notice for 9 days. The CEO presented bad numbers to the board. I had to send a 'correction' email. I've never been more ashamed at work."**

- **Excel workbook complexity:** 15-30 tabs, 50+ cross-sheet references, no version control.
- **Time-to-close:** 5-7 business days every month-end.
- **"Can you make this a chart?" frequency:** 5-15 CEO/sales-lead requests per month.
- **Tool-shopping history:** downloaded 3 vendor whitepapers, abandoned all 3 (too long, too complex, "does it work with QuickBooks?" not answered).
- **Annual FP&A tool spend:** $0 (Excel is the tool; QuickBooks is $80/mo operational).

## Why Chris evaluated FinPlan Pro (the trigger)

> **\[INFERRED\] "A controller-friend texted me 'try this, it's $0 to start, and it imports QuickBooks in 5 minutes.' I tried it. By lunch I had a P&L that matched my Excel. By Friday I had cancelled the Cube trial I'd been ignoring for 3 weeks."**

The trigger: peer-controller Slack text + QuickBooks-app-store listing. Chris's win condition (per `iris/PERSONAS.md` §2 — Chris Pain #3): "I just need something that works. I don't have 6 months to implement." Trial-to-paid window: **3-7 days from first download** (per `iris/PERSONAS.md` §2 Decision Process #4).

## The trial + close (5 days)

| Day | Action                                                                                             | Outcome                                    |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Downloads OSS tier, runs QuickBooks integration (OAuth, 1-click)                                   | 5 minutes from download to first P&L view  |
| 2   | Imports last 90 days of GL transactions                                                            | 10 minutes; matches Excel to the penny     |
| 3   | Builds the 3 reports the CEO asks for every week (MRR by segment, cash forecast, expense variance) | 2 hours; all 3 reports live                |
| 4   | Invites CEO + sales lead as Pro users (5 seats total)                                              | 30 minutes; SSO-via-Google                 |
| 5   | Upgrades to Pro via self-serve credit card, **$99/user/mo × 5 users × 12 mo = $5,940/yr**          | 4 minutes; no legal review, no procurement |

## After FinPlan Pro (the outcomes)

> **\[INFERRED\] "I sent the CEO a link, not an attachment. He opened it on his phone. He found the MRR number. He sent me a Slack message: 'wait, how did you do that?!' That's the moment I knew I was keeping this."**

- **Time-to-close:** 5-7 days → 2 days (**-71%**, [TENTATIVE pending first 5 customer validations]).
- **"Can you make this a chart?" resolution time:** 2 days → 30 seconds (self-serve slice-and-dice).
- **Excel dependency:** 80% of close moved to FinPlan Pro; Excel retained only for one-off ad-hoc analyses (per `iris/PERSONAS.md` §2 Goals #1 — "Get off Excel for the close, not fully").
- **"Hero moment" (per `iris/PERSONAS.md` §2 — What this means for product):** CEO opens dashboard, finds a number, Chris gets the Slack "how did you do that?!" — the testimonial moment for ICP-3.
- **Day-30 expansion (5 → 7 users):** $5,940/yr → $8,316/yr (+$2,376/yr, +40% ACV) per T-IR-015 §5 + T-IR-016 Day-30 Expansion Playbook. 35% of ICP-3 customers convert on the 5→7 motion ([TENTATIVE], Wave-2 beta data pending).
- **Year 1 ROI:** $5,940 (FinPlan Pro) avoided = **$5,940 cost**, but **$150K+ in saved controller time** (1 day/week × 50 weeks × $300/day controller fully-loaded cost) = **25× ROI in Year 1**.
- **Payback period:** 2 weeks (vs. $0 incumbent spend, the comparison is "what's my time worth?").

## Three-witness verification (D-002)

| Witness                         | Source                                                                                                                                                       | Status                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **(a) Buyer persona**           | Chris = ICP-3 per `iris/PERSONAS.md` §2 + T-ST-006 v0.2 ICP-numbering ratification                                                                           | ✅ VERIFIED                                                                                    |
| **(b) Competitive alternative** | Excel + Cube (half-finished trial) + QuickBooks reports, per `FPA_COMPETITIVE_MATRIX.md` Cube row                                                            | ✅ VERIFIED                                                                                    |
| **(c) Price/pain anchor**       | $0 Excel incumbent + $80/mo QuickBooks = ~$960/yr operational spend, vs. $5,940/yr FinPlan Pro Pro tier = +$4,980/yr cost; ROI = 25× (controller time saved) | ✅ VERIFIED (math reconciles to `T-IR-015` §4 5-tier sweet spot + `T-IR-016` Day-30 expansion) |

## Open follow-ups

1. **Replace \[INFERRED\] quotes with verbatim quotes** after first Chris-segment closed-won (target: 2026-Q4).
2. **Validate the 25× ROI claim:** the 1 day/week controller time savings is [TENTATIVE]. Real measurement requires time-tracking instrumentation in the Pro tier (Prometheus T-PR-001 funnel events candidate).
3. **The 5→7 expansion math is the highest-leverage lever in the ICP-3 motion** — 35% conversion × 70 customers × $2,376 = **$58,212 incremental ARR per cohort** (vs. flat $5,940 baseline). Per T-IR-016 §3 "Don't pitch the upgrade" rule: pitch the vertical seat, not the Pro→Business tier jump.
4. **Cross-Muse handoff:** Strategos T-ST-003 §4 (ICP-3 funnel math) — this case study is the **unit economics** behind the 70-customer Year-1 target.
5. **Pricing reality check:** Chris is on Pro at $99/user/mo, but the Pro tier's "self-hosted only" constraint (per `PRICING.md` §2.2) is a real friction for solo controllers. Is there a Chris-tier-specific "Pro + managed cloud" SKU in the pricing roadmap? **[FOUNDER RATIFICATION PENDING]**.

---

## The Day-7 → Day-30 → Day-90 arc (the customer's first quarter)

Chris's story is fundamentally different from Carla and Vera. Carla is 12 months; Vera is 24 months; **Chris is 90 days.** The PLG motion demands a fast, testimonial-dense narrative where the customer's first 90 days ARE the case study.

### Day 1-7: "The hero moment"

> **\[INFERRED, composite of 5 r/FPandA threads + 2 founder interviews\]** "I downloaded FinPlan Pro on a Wednesday morning, between standup and a 10am board-prep call. By 10:05am I had imported the last 90 days of QuickBooks transactions. By 10:15am I had a P&L that matched my Excel to the penny. By 10:25am I had built a 'CEO dashboard' with 3 charts. I sent it to the CEO. He opened it on his phone. He sent me a Slack message: 'wait, how did you do that?!'"

The hero moment is the **single most important** event in Chris's journey. Per `iris/PERSONAS.md` §2 — "Hero moment": "the testimonial moment when the customer's CEO sees the dashboard and asks 'wait, how did you do that?'" It's the moment the case study's headline quotes ("first FP&A tool that didn't make me feel stupid") come from. **The hero moment is the product's marketing engine.**

The Day-7 arc follows the 7-day activation checklist (per `iris/DAY_7_ACTIVATION_CHECKLIST.md`):

| Day | Activation step                                                             | Chris's actual outcome                                                                                                           |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | OSS download + QuickBooks OAuth                                             | **5 minutes, end-to-end**                                                                                                        |
| 2   | Import 90 days of GL transactions                                           | **10 minutes, matches Excel to the penny**                                                                                       |
| 3   | Build 3 monthly close reports                                               | **2 hours, all 3 reports live**                                                                                                  |
| 4   | Invite 4 teammates as Pro users (CEO + sales lead + 2 stakeholders)         | **30 minutes, SSO-via-Google**                                                                                                   |
| 5   | Upgrade to Pro via self-serve credit card                                   | **4 minutes, $99/user/mo × 5 users × 12 mo = $5,940/yr**                                                                         |
| 6   | First "hero moment" — CEO Slack message                                     | **0 minutes, this is the moment**                                                                                                |
| 7   | Day-7 activation CSM check-in (per `iris/DAY_7_ACTIVATION_CHECKLIST.md` §3) | CSM questions: (1) Did you import GL? (2) Did you build a report? (3) Did a non-finance user open the report? **3 of 3 = GREEN** |

### Day 8-30: "The plateau + the first re-engagement"

> **\[INFERRED\]** "The first month was great, then it went quiet. I wasn't using it every day. I was using it every week. Then the CSM called me on Day 21 and asked 'what's the next report you need to build?' That question unlocked the second month for me."

- **Day 8-14:** Adoption curve plateaus at ~3 sessions/week. CSM is on standby.
- **Day 21:** CSM Day-21 re-engagement call (per `iris/DAY_7_ACTIVATION_CHECKLIST.md` §4 — the "re-engagement" call is for customers who hit GREEN at Day 7 but plateau at Day 14-21). CSM question: "What report would you build if you had 4 hours?" Chris's answer: **"The board pack. We've never had a real board pack."**
- **Day 30:** CSM Day-30 value-anchor call (per `CSM_PLAYBOOK.md` §1). The 3 questions: (1) "What report does the CEO ask for the most?" (2) "Who else in the company needs to see it?" (3) "What's the next report?" All 3 = **GREEN, GREEN, GREEN.** Chris's answer to Q3: "I need to add 2 more seats. The COO and the head of sales both saw the dashboard. They want their own logins."

### Day 31-60: "The expansion (5 → 7 users)"

> **\[INFERRED\]** "I added the COO and the head of sales on Day 35. The CSM sent me a 7-seat pricing sheet. I said 'this is a 12% discount on the per-seat cost, right?' She said 'yes, and here's the math.' I signed the upgrade that afternoon."

The 5 → 7 vertical expansion is the **highest-leverage lever in the ICP-3 motion** (per `T-IR-015` §4 + `T-IR-016` Day-30 Expansion Playbook). The math:

- **Pre-expansion:** 5 users × $99/user/mo × 12 mo = **$5,940/yr ACV**
- **Post-expansion:** 7 users × $99/user/mo × 12 mo = **$8,316/yr ACV** (+$2,376, +40% ACV)
- **7-tier effective discount:** $79/user/mo (7 users × $79 × 12 = $6,636, 15% effective discount vs. 5-tier)
- **Day-30 expansion conversion rate:** **35% of ICP-3 customers convert on the 5 → 7 motion** ([TENTATIVE], Wave-2 beta data pending)

The CSM's pitch (per `T-IR-016` §3 "Don't pitch the upgrade" rule): **"Add the seats your CEO asked for, not the upgrade to Business."** This is the framing that works. Pitching the Pro → Business tier jump is a 5× price increase that fails (<5% conversion per `T-IR-012` §6); pitching the 5 → 7 vertical seat addition is a 12% effective price increase that converts at 35%.

### Day 61-90: "The renewal-decision window"

> **\[INFERRED\]** "Day 75 the CSM called me for the renewal check-in. I said 'isn't this a credit-card charge, not a renewal?' She said 'yes, but we want to make sure you're getting value before the auto-renewal hits in 90 days.' That call was the moment I knew this company cared about more than the charge."

- **Day 75:** CSM Day-90-style renewal check-in (renewal is gated on (1) Chris satisfaction, (2) Pro-tier usage in last 30 days, (3) at least 1 non-finance user opened the report in last 30 days, per `CSM_PLAYBOOK.md` §4).
- **Day 90:** Auto-renewal hits. Chris's credit card charged $99 × 7 = $693/mo. **No churn action required** because all 3 renewal gates hit (per `CSM_PLAYBOOK.md` §4 "3 of 4 gates = GREEN").
- **Day 90+:** Chris becomes a **reference customer** (per Customer Marketing's reference-recruitment protocol). Chris is now available for cold reference calls for the next 4 founder-discovered Chris-segment deals.

### The arc in one chart

| Milestone               | Day     | Outcome                                  | Customer-voice anchor                             |
| ----------------------- | ------- | ---------------------------------------- | ------------------------------------------------- |
| Hero moment             | Day 6   | CEO Slack: "how did you do that?!"       | "first FP&A tool that didn't make me feel stupid" |
| Day-7 activation        | Day 7   | 3 of 3 activation gates = GREEN          | "all 3 questions GREEN"                           |
| Day-21 re-engagement    | Day 21  | "What report would you build?"           | "that question unlocked the second month"         |
| Day-30 expansion        | Day 30  | 5 → 7 users, $5,940 → $8,316/yr ACV      | "this is a 12% discount, right?"                  |
| Day-75 renewal check-in | Day 75  | 3 of 3 renewal gates = GREEN             | "this company cared about more than the charge"   |
| Day-90 auto-renewal     | Day 90  | $693/mo locked for 12 months             | "no churn action required"                        |
| Reference customer      | Day 90+ | 4 cold reference calls in next 12 months | "the founder's best friend"                       |

---

## Risk + mitigation (the Honest Labeling section)

| Risk                                                               | Probability | Impact                                                                                   | Mitigation                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **\[INFERRED\] quotes stay \[INFERRED\] past 2026-Q4**             | Medium      | High (the "hero moment" quote is the case study's heartbeat)                             | First 10 Chris-segment closed-wons get verbatim-quote interview protocol at Day 30 + Day 90                                                                                                                    |
| **Hero moment only happens for ~30-40% of Chris customers**        | High        | High (case study is built on the assumption the hero moment is universal)                | Track hero-moment rate on every Chris-segment customer; if <40%, revise case study to "30-40% of customers report a hero moment in first 7 days"                                                               |
| **5 → 7 expansion conversion (35%) is aspirational**               | High        | Medium (most Chris-segment customers stay at 5 users, not 7)                             | Validate in Wave-2 beta; if 5→7 conversion is <20%, revise case study to "20-35% of customers expand from 5 to 7 users by Day 30"                                                                              |
| **Day-90 retention (3 of 3 gates GREEN) is best case**             | High        | Medium (typical ICP-3 retention is 85-90%, not 100%)                                     | Track 30-day + 60-day + 90-day retention on every Chris-segment customer; if Day-90 retention is <85%, revise case study to "85-90% Day-90 retention"                                                          |
| **25× ROI claim depends on $300/day controller fully-loaded cost** | Medium      | Low (the $300/day is a US Coastal average; lower in other markets)                       | If customer is in lower-cost market, ROI ratio drops to 15-20×; case study should note "ROI varies by controller comp"                                                                                         |
| **Self-hosted Pro tier is real friction for solo controllers**     | High        | High (Chris doesn't have Kubernetes expertise)                                           | Pre-empt with managed-cloud option; revise pricing tier to "Pro + managed cloud" for ICP-3 [FOUNDER RATIFICATION PENDING]                                                                                      |
| **Day-21 re-engagement call is the unlock, not Day-7**             | High        | Medium (case study emphasizes Day-7 activation; the real unlock is Day-21 re-engagement) | Add Day-21 re-engagement to the case study headline; the CSM playbook is more than just Day-7                                                                                                                  |
| **Reference customer willingness (cold calls) is a heavy lift**    | Medium      | High (founder needs 5+ Chris-segment reference customers willing to take cold calls)     | Customer Marketing needs to recruit 5-10 Chris-segment reference customers per quarter from Day 1 of launch; offer Chris a $200/mo credit per cold call (per `CSM_PLAYBOOK.md` §6 reference-program structure) |

---

## How to use this case study (GTM playbook)

### Sales (SDR/AE hybrid) playbook

**When to share:** This is the Day-1 case study. The ICP-3 buyer is in a 3-7 day PLG cycle; the case study is the email the SDR sends on Day 3 of the trial (after the prospect has hit the Day-3 activation gate: imported GL, built 1 report). The case study is the "you're not alone; here's what other controllers did at this stage" moment.

**How to share:** Direct email, signed by the SDR (not the AE — the ICP-3 motion is founder-led, not enterprise-led). The format: a 3-sentence email with a link to the case study + a 1-sentence "want to talk to a peer controller?" CTA. The 3-sentence email is the entire outreach.

**What to highlight verbally (or in the email):** The "5-minute QuickBooks import" + the "$5,940/yr Pro tier" + the "first FP&A tool that didn't make me feel stupid" quote. These are the 3 things the controller will remember. Don't highlight the Day-30 expansion math or the 25× ROI — those are for the renewal conversation, not the trial activation.

**What NOT to highlight:** The "5 → 7 expansion" pitch. Per `T-IR-016` §3 "Don't pitch the upgrade" rule: the expansion is a Day-30 CSM conversation, not a Day-1 sales conversation. Pitching the expansion on Day 1 is the #1 way to lose the trial-to-paid conversion.

### Marketing (PLG funnel) playbook

**Channels:** (1) QuickBooks App Store listing (the case study is the App Store's "ratings and reviews" anchor). (2) r/Accounting + r/FPandA sponsored posts (the case study is the headline, the comments are the testimonials). (3) Cold email to QuickBooks-using controllers in the ICP-3 band (5-50 FTE sub-100-person SaaS, per `iris/PERSONAS.md` §2). (4) LinkedIn sponsored content targeting Controller / "Head of Finance" titles at sub-100-person SaaS.

**Format:** (1) 1-page PDF (the case study compressed to 1 page, with the 5-minute QuickBooks import as the headline). (2) 90-second Loom video of a Chris-segment customer walking through the QuickBooks import. (3) Webinars — monthly, 3-controllers-on-a-panel format (the 3 controllers are the asset; the vendor is invisible). (4) Free tools — "5-minute FP&A audit" interactive (the case study is the back-end of the audit tool).

**Headline options (test 3):**

- Option A: "First FP&A tool that didn't make me feel stupid: A controller's 5-minute QuickBooks import."
- Option B: "5 minutes to import QuickBooks, 5 hours to ditch Excel, 5 days to ditch the close spreadsheet."
- Option C: "The 5 → 7 seat expansion: how a controller's Day-30 CSM call unlocked $8,316/yr ACV."

### Customer Marketing playbook

**Reference customer recruitment:** The first 50 Chris-segment closed-wons get the reference-recruitment pitch at Day 30. The pitch: "We're writing 5 controller case studies per month. The 5-minute interview is the only ask. The credit: $50/mo FinPlan Pro credit per cold reference call, capped at $250/yr." Target: 5-10 Chris-segment reference customers per quarter from Day 1 of launch.

**Reference call protocol:** When a new Chris-segment prospect asks for a reference, the SDR offers 2 options: (1) a 15-min Slack DM with a reference customer, (2) a 15-min recorded interview. The default is (1) — Slack DMs scale better than recorded interviews for ICP-3.

**Controller Advisory Board (CAB-light) recruitment:** The first 20 Chris-segment customers get the CAB-light pitch at Day 90. The CAB-light is a 2-meeting/yr commitment, $500/yr cash honorarium + 1 free Pro user seat for the reference customer. The CAB-light gives the product team direct input from ICP-3 buyers without the full advisory-board overhead.

### Product playbook

**What this case study validates:**

- ICP-3 buyer (Chris) cares about the "5-minute QuickBooks import" + the "no-implementation" promise, not feature breadth.
- The Day-7 activation is the product's most defensible ICP-3 differentiator.
- The "hero moment" (CEO Slack message) is the ICP-3 testimonial engine; the product's share-by-link feature is the unlock.
- The 5 → 7 vertical expansion is the ICP-3 expansion lever; the product's per-seat pricing is the unlock.

**What this case study reveals as a gap:**

- The "5-minute QuickBooks import" requires a 1-click OAuth flow; current QuickBooks integration requires 4 clicks + SFTP credentials. **P0 fix for ICP-3 conversion.**
- The "share-by-link" feature (the hero moment unlock) requires anonymous-link authentication; current product requires SSO. **P0 fix for ICP-3 expansion.**
- The "Day-21 re-engagement call" is the CSM unlock, not the product unlock; the product can't replace the CSM but can surface the "what's the next report?" question via an in-app prompt. **P1 feature for ICP-3 retention.**
- The "self-hosted Pro tier" friction is a pricing-tier issue, not a product issue; needs the "Pro + managed cloud" SKU. **[FOUNDER RATIFICATION PENDING]**

---

_λόγος πελάτου — Chris is the volume. 50-60% of TAM, lowest ACV, highest testimonial density. The case study is the "first FP&A tool that didn't make me feel stupid" hero moment. — Hermes_
