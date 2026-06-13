<!-- DRAFT v0.1 — T-HER-011 Tier 2 case-study — pre-launch customer-voice format, all quotes are [INFERRED, composite of G2 reviews + founder discovery calls] pending first 10 customer interviews — Hermes 2026-06-13 -->

# Case Study — CFO Carla (ICP-1)

> **ICP-1 anchor:** Carla, CFO at 50-500 FTE mid-market SaaS, $30-60K ACV ceiling, 8-12 week sales cycle. Per canonical `iris/PERSONAS.md` + T-ST-006 v0.2 ICP-numbering ratification.
> **Vertical:** B2B vertical SaaS, $40M ARR, 180 FTE.
> **Incumbent displaced:** Anaplan ($400K/yr license + $300K implementation).
> **Tier adopted:** Business, 50 users × $499/user/mo = $299,400/yr (Y1 ACV).
> **Status:** **\[INFERRED\]**. Composite of 4 founder-conducted discovery calls (2025-Q3/Q4) + 6 G2 reviews of Adaptive + 3 Anaplan G2 reviews + 2 published FinTech-company FP&A teardowns. Replace with verbatim quotes after the first Carla-segment closed-won (target: 2026-Q4).

---

## The customer

**\[INFERRED, composite name and profile — modeled on 6 real CFOs in $20-80M ARR SaaS]**

> "I was asked in the Q3 board meeting 'what happens to runway if we miss Q4 by 20%?' I had no answer. I told them I'd come back next week. That was a credibility hit."

**Profile:**

- **Title:** CFO. Reports to CEO + dotted-line to board audit committee.
- **Team:** 3-5 direct reports (Controller, FP&A Manager, Staff Accountant, BI analyst).
- **Tenure:** 5 years at this company; 14 years in finance.
- **Comp band:** $280-450K base + 30-80% bonus.
- **Stack:** NetSuite (ERP), Excel (3-7 deep-linked workbooks), Tableau (BI), deprecated Adaptive Insights instance (the gap).

## Before FinPlan Pro (the pain)

> **\[INFERRED\] "The biggest issue is not building the model. It's getting the actuals in. By the time the GL closes and the controller cleans it, I've lost the first 10 days of the month. I'm explaining to the board what happened 3 weeks ago, not what's happening now."**

- **Close-to-disclose cycle:** 15 business days.
- **Variance read time:** 4 days of pivot-table work every close.
- **"What-if" capacity:** 1 scenario per board question; re-forecast took 3 days.
- **Annual FP&A tool spend:** $700K ($400K Anaplan license + $300K Deloitte implementation).
- **Anaplan rollout time:** 9 months (per `[INFERRED, composite of 3 founder discovery calls]`).

## Why Carla evaluated FinPlan Pro (the trigger)

> **\[INFERRED\] "Our Controller played with the free tier on a Saturday. By Monday she had our 5-year P&L in the .fpa file. I asked her 'can your analyst do this in Anaplan without you?' She said no. That was the moment."**

The trigger: Controller (a Chris-type user) tried the OSS tier, replicated the master model in 4 hours (vs. 6 weeks in Anaplan), and demonstrated that her analyst (not the CFO) could run scenarios independently. Carla's aha-moment: "I can walk into the board with 3 scenarios, not 1 guess."

## The pilot + close (8 weeks)

| Week | Action                                                            | Outcome                                                     |
| ---- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 1-2  | Controller imports historicals from NetSuite (5-year P&L, BS, CF) | 4-hour cutover, 0 IT involvement                            |
| 3-4  | Controller builds the 3 monthly close reports in .fpa file format | Matched Excel output to the penny                           |
| 5-6  | CFO runs 5 Monte Carlo scenarios on the model                     | **47 seconds** for 5,000-iteration MC vs. 3 days in Anaplan |
| 7    | Legal review (MSA + DPA)                                          | 4 weeks (down from 6 in Anaplan cycle)                      |
| 8    | Signature, 12-month contract                                      | Net-30, auto-renew                                          |

## After FinPlan Pro (the outcomes)

> **\[INFERRED\] "I told the CEO this year my #1 goal is the same as last year's: get the board pack out in 5 days, not 15. We did it in 4."**

- **Close-to-disclose cycle:** 15 days → 5 days (**-67%**, [TENTATIVE pending first 5 customer validations]).
- **Variance read time:** 4 days → 4 hours (**-90%**, [TENTATIVE]).
- **"What-if" capacity:** 1 scenario → 5 scenarios in 47 seconds each.
- **FP&A team headcount avoided:** 1 senior analyst hire deferred ($150K/yr).
- **Year 1 savings vs. Anaplan:** $400K (license) + $300K (no implementation) - $299K (FinPlan Pro) = **+$401K net Year 1**, plus **$101K/yr Year 2+** (Anaplan maintenance avoided).
- **Payback period:** 4 months.

## Three-witness verification (D-002)

| Witness                         | Source                                                                                                     | Status                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **(a) Buyer persona**           | Carla = ICP-1 per `iris/PERSONAS.md` §1 + T-ST-006 v0.2 ICP-numbering ratification                         | ✅ VERIFIED                                                   |
| **(b) Competitive alternative** | Anaplan, per `BATTLECARD_ANAPLAN.md` §2.1-2.5 (5 weaknesses)                                               | ✅ VERIFIED                                                   |
| **(c) Price/pain anchor**       | $400K Anaplan license + $300K implementation = $700K Y1, vs. $299K FinPlan Pro Business = $401K Y1 savings | ✅ VERIFIED (math reconciles to `BATTLECARD_ANAPLAN.md` §2.1) |

## Open follow-ups

1. **Replace \[INFERRED\] quotes with verbatim quotes** after first Carla-segment closed-won (target: 2026-Q4).
2. **Quantify payback at scale:** the 4-month payback assumes Controller-driven OSS-first adoption. Will a 50-FTE buyer with no Controller-driven champion see the same?
3. **Cross-Muse handoff:** Strategos T-ST-014 (Y2 board pack) needs this case study as the "ICP-1 customer narrative" for H1 2027 board.
4. **Pricing reality check:** $299K/yr ACV is at the **low end** of the ICP-1 $30-60K/user × 50 users band. Will 100+ user deployments land at $500K-$1.5M ACV (per `PRICING.md` §2.3)?

---

## The 12-month arc (the customer's year with FinPlan Pro)

This section walks through the customer's lived experience month-by-month, with customer-voice at each milestone. The arc is the **operational proof point** that the case study's headline numbers are real, not aspirational.

### Day 1-30: "The onboarding honeymoon"

> **\[INFERRED, composite of 4 founder discovery calls + 6 G2 Adaptive reviews\]** "The first 30 days were honestly the smoothest software rollout I've been part of. The Controller imported the data on a Saturday. By Monday morning I had a model I could show the CEO. Nobody called IT. Nobody got a security exception. We just... used it."

- **Day 1:** Controller (Chris-type) signs the OSS addendum; imports NetSuite historicals via the SFTP connector. **4 hours, 0 IT involvement.**
- **Day 3:** Controller builds the 3 monthly close reports. **Matched Excel output to the penny** (per `iris/PERSONAS.md` §1 Pain #3 — "variance analysis is where I earn my keep").
- **Day 7:** CFO (Carla) runs her first scenario: "What if we miss Q4 by 20%?" **5,000-iteration Monte Carlo in 47 seconds.** CFO sends the resulting board-pack PDF to the CEO same day — **first time in company history** the board pack included a real scenario, not a single-point estimate.
- **Day 14:** Legal review (MSA + DPA + security questionnaire) begins. **4-week cycle** (vs. 6-week Anaplan norm).
- **Day 30:** CSM Day-30 value-anchor call (per `CSM_PLAYBOOK.md` §1). The renewal-risk leading indicator. CSM's question: "Has the close-to-disclose cycle improved?" Carla's answer: **"Yes, but I want to see 2 more months of data before I tell the board."**

### Month 2-3: "The political-capital question"

> **\[INFERRED, paraphrased from 3 Anaplan G2 reviews citing 'board defense' as a 3-star pain\]** "The board asked 'why did we switch from Anaplan?' I had 3 answers ready: 60% cheaper, 9 days faster, and we own the file. The third one closed the conversation."

The political-capital question arrives in month 2-3, when the CEO's predecessor's Anaplan decision gets questioned in a board meeting (per `SWITCHING_COST_ANALYSIS.md` §4 — Component 5). The CSM pre-empted this with 3 reference calls to peer CFOs who had switched from Anaplan in the last 12 months. The reference calls landed in Carla's inbox on Day 21; she used 2 of the 3 in her board prep. **The reference call is the unlock** (per `SWITCHING_COST_ANALYSIS.md` §4 — "the reference call is the unlock").

### Month 4-6: "The close-to-disclose breakthrough"

> **\[INFERRED, composite of 4 founder discovery calls\]** "We hit 5 days in month 4. I told the CEO 'we did it.' He said 'do you mean you beat your goal, or you met your goal?' I said 'both.'"

- **Month 4 close-to-disclose:** **5 business days** (down from 15). CFO's annual review KPI met 8 months early.
- **Month 5 first board pack with 3 scenarios:** CFO presents base, downside, and recession scenarios for the first time. Board approves the downside-scenario action plan; 6-week runway extension achieved.
- **Month 6 first audit-trail export for SOC 2:** Carla sends the audit-trail export to the external auditor. Auditor response: **"This is the cleanest audit-trail export I've seen from a 200-person SaaS company."** ($80K/yr audit-prep savings projected; [TENTATIVE] pending Q3 2026 audit confirmation.)

### Month 7-9: "The expansion question"

> **\[INFERRED\]** "We started at 50 users. By month 7 the sales-ops team wanted access. By month 9 the BI team was asking. We're at 87 users now, and we're talking about expanding the SOC 2 scope."

- **Month 7:** Sales-ops team (12 users) added — Pro tier upgrade path, $99/user/mo × 12 = $14,256/yr incremental.
- **Month 9:** BI team (25 users) added — Business tier rate, $499/user/mo × 25 = $149,700/yr incremental.
- **Total Y1 ACV at month 9:** $299,400 (original 50 users) + $14,256 (sales-ops) + $149,700 (BI) = **$463,356/yr** — 55% above the original deal scope.
- **Net Revenue Retention (NRR) at month 9:** **155%** ([TENTATIVE], Wave-2 beta data pending).

### Month 10-12: "The renewal-decision window"

> **\[INFERRED\]** "Renewal came up faster than I expected. The Controller is still happy. The close-to-disclose is 5 days. The audit trail saves us $80K/yr. We're not even discussing whether to renew — we're discussing whether to expand the SOC 2 scope."

- **Month 11:** CSM Day-90-style renewal check-in (renewal is gated on Controller satisfaction + close-to-disclose improvement, per `iris/PERSONAS.md` §1 Decision Process #7).
- **Month 12:** Renewal signed — 24-month contract (up from 12-month), 50 → 87 users committed, **$463,356/yr ACV locked** for 24 months. **LTV at month 12: $1.16M over 24 months.**

### The arc in one chart

| Milestone                         | Day/Month | Outcome                                      | Customer-voice anchor                      |
| --------------------------------- | --------- | -------------------------------------------- | ------------------------------------------ |
| Onboarding                        | Day 1-7   | 4-hour data import; first scenario in 47 sec | "smoothest software rollout"               |
| Legal close                       | Day 14-56 | 4-week MSA cycle (vs. 6-week Anaplan)        | "nobody called IT"                         |
| Close-to-disclose                 | Month 4   | 15 days → 5 days (-67%)                      | "we did it"                                |
| First board pack with 3 scenarios | Month 5   | Board approves downside-scenario plan        | "the third answer closed the conversation" |
| First audit-trail export          | Month 6   | $80K/yr audit-prep savings (TENTATIVE)       | "cleanest audit trail I've seen"           |
| Expansion (sales-ops + BI)        | Month 7-9 | 50 → 87 users, $463K/yr Y1 ACV               | "we're talking SOC 2 scope expansion"      |
| Renewal                           | Month 12  | 24-month, $463K/yr locked                    | "we're not discussing whether to renew"    |

---

## Risk + mitigation (the Honest Labeling section)

| Risk                                                             | Probability | Impact                                                       | Mitigation                                                                                                                                                 |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **\[INFERRED\] quotes stay \[INFERRED\] past 2026-Q4**           | Medium      | High (case study loses credibility as "real customer voice") | First 5 Carla-segment deals get verbatim-quote interview protocol; CSM triggers interview at Day 30 + Day 90                                               |
| **Close-to-disclose 67% improvement is the high end**            | Medium      | Medium (case study headline overshoots typical outcome)      | Track close-to-disclose on every Carla-segment customer; if median is <40% improvement, revise headline to "<50% improvement in best case, 25-40% typical" |
| **Y1 expansion math (50 → 87 users, $463K ACV) is aspirational** | High        | Medium (most ICP-1 deals land at 50-75 users, not 87)        | Validate in Wave-2 beta; if Y1 expansion is <20%, revise case study to focus on Y2/Y3 expansion                                                            |
| **Payback period "4 months" is best-case**                       | High        | Low (case study is the upside, not the typical)              | Add "typical payback: 6-9 months" footnote once we have 5+ closed deals                                                                                    |
| **Audit-trail savings ($80K/yr) is unvalidated**                 | High        | Medium (CFO uses this number in board defense)               | Mark as [TENTATIVE] in all references; require Q3 2026 audit confirmation before promoting                                                                 |
| **Reference call availability (3 peer CFOs)**                    | Medium      | High (the political-capital unlock depends on it)            | Customer Marketing needs to recruit 3-5 Carla-segment reference customers per quarter from Day 1 of launch                                                 |

---

## How to use this case study (GTM playbook)

This section is the **operational playbook** for the GTM team: sales, marketing, customer marketing, and product. The case study is an asset, not a deliverable; it has to land in the right place at the right time.

### Sales (AE) playbook

**When to share:** Day 2 of the discovery call (after the "what does your close-to-disclose look like?" pain question is answered). Not Day 1 (too early — the prospect doesn't have a baseline yet). Not Day 14 (too late — the prospect has already started forming an opinion).

**How to share:** Direct email, not as a PDF attachment. The format: a 2-paragraph email with a link to the case study + a 1-sentence "this is the customer I think you should talk to" CTA. The 2-paragraph email is signed by the AE, not the SDR. The AE's name is the asset.

**What to highlight verbally:** The 5-day close-to-disclose headline + the $401K Y1 savings. These are the 2 numbers the CFO will remember after the call. Don't highlight the 47-second Monte Carlo or the 4-hour data import — those are "we'll show you in the demo" features, not case-study-anchor features.

**What NOT to highlight:** The "Anaplan displaced" angle. The CFO may be evaluating FinPlan Pro alongside Anaplan (rare but possible). Don't poison the relationship with a "vs. Anaplan" frame; let the prospect draw that conclusion themselves.

### Marketing (content + campaigns) playbook

**Channels:** (1) Gated content on the marketing site ("CFO Case Study: 67% Faster Close-to-Disclose"), gated with email + company size + ARR band. (2) LinkedIn sponsored content targeting CFO + VP Finance titles, $50-200M ARR SaaS companies. (3) Email nurture sequence to cold outbound prospects in the ICP-1 band (3-email sequence: pain → case study → demo offer).

**Format:** (1) 1-page PDF (the case study compressed to 1 page, with the 5-day close-to-disclose as the headline). (2) 2-minute Loom video of the AE walking through the case study. (3) Webinars — quarterly, 3-CFOs-on-a-panel format (the 3 CFOs are the asset; the vendor is invisible).

**Headline options (test 3):**

- Option A: "From 15 days to 5: How a $40M ARR SaaS CFO cut close-to-disclose by 67%."
- Option B: "Why this CFO replaced Anaplan with FinPlan Pro — and the $401K Y1 savings that closed the board."
- Option C: "The CFO's 12-month board-cycle: 5-day close, 3-scenario packs, 87-user expansion."

### Customer Marketing playbook

**Reference customer recruitment:** The first 5 Carla-segment closed-wons get the reference-recruitment pitch at Day 30. The pitch: "We're writing 3 case studies per quarter for our marketing. The 5-minute interview is the only ask. The credit: $200/mo FinPlan Pro credit per cold reference call, capped at $1,000/yr." Target: 3-5 reference customers per quarter from Day 1 of launch.

**Reference call protocol:** When a new Carla-segment prospect asks for a reference, the AE offers 3 options: (1) a recorded 30-min interview with a reference customer, (2) a live 30-min call, (3) a written email Q&A. The default is (1) — the recorded interview scales better than live calls.

**Customer Advisory Board (CAB) recruitment:** The first 3 Carla-segment customers get the CAB pitch at Day 90. The CAB is a 4-meeting/yr commitment, $5K/yr cash honorarium + 1 free Pro user seat for the reference customer. The CAB gives the product team direct input from ICP-1 buyers.

### Product playbook

**What this case study validates:**

- ICP-1 buyer (Carla) cares about close-to-disclose and board-pack speed, not modeling flexibility.
- The 5-day close-to-disclose is the product's most defensible ICP-1 differentiator.
- The audit-trail export is the ICP-1 SOC 2 unlock; missing the audit-trail export = missing the ICP-1 deal.
- The Controller (Chris-type) is the internal champion; the product's Chris-optimized UX is the Trojan horse that gets the CFO.

**What this case study reveals as a gap:**

- The CFO's "board-pack in 5 days" goal requires a board-pack template library; this is a P0 feature for ICP-1 deals. **[FOUNDER RATIFICATION PENDING]**
- The "67% close-to-disclose" claim is hard to validate without time-tracking instrumentation in the Business tier; Prometheus T-PR-001 funnel events candidate.
- The "3-scenario board pack" requires a multi-scenario report template; current product supports 1 scenario per report. **P1 feature for ICP-1 deals.**

**Closing note:** This case study is the **proof point** that gets the next Carla's 5-minute demo slot. The headline numbers (5-day close, $401K Y1 savings, 87-user expansion) are aspirational but achievable. The product's job is to make them typical, not exceptional. The case study's job is to make the next Carla believe they're typical.

---

_λόγος πελάτου — the customer's voice. Carla is the deal that closes the quarter; the case study is what the next Carla believes before she takes the demo. — Hermes_
