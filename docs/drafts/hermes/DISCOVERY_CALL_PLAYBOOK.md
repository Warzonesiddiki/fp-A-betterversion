<!-- DRAFT v0.2 — ICP-numbering reconciled to canonical (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per T-HER-010 Tier 2 broader drift sweep — Hermes 2026-06-13 -->

# FinPlan Pro — 30-Min Discovery Call Playbook (Closed-Won Motion)

> **Frame for the cycle:** This playbook is the **AE's operating procedure** for the 30-min first-call that converts ICP-1 (CFO Carla, mid-market SaaS) into a closed-won deal at $499/user/mo. The motion is **story-led, not feature-led**, and is grounded in (a) Iris's validated persona quotes, (b) the Anaplan battlecard's 5 weaknesses, (c) the cold-outbound sequence's P.S.-line formula, (d) the Beta program's ICP-fit scoring rubric. Every section carries the three-witness test (buyer persona, competitive alternative, price/pain anchor).

> **Cross-references:**
>
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Carla, CFO), ICP-2 (Vera, Controller), ICP-3 (Chris, FP&A Lead)
> - `docs/drafts/hermes/POSITIONING.md` — value props + 3 anti-positions
> - `docs/drafts/hermes/PRICING.md` — 4-tier pricing + the "Business = $499/user/mo" close line
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — 5 Anaplan weaknesses + 3 objection handlers
> - `docs/drafts/hermes/COLD_OUTBOUND_SEQUENCE.md` — the email that booked this call
> - `docs/drafts/hermes/BETA_PROGRAM.md` — the ICP-fit scoring the AE uses to qualify
> - `docs/drafts/iris/PERSONAS.md` — **Carla pain quotes** (the stories draw from these)
> - `docs/drafts/iris/INTERVIEW_SCRIPT.md` — the AE's parallel interview technique
> - `docs/drafts/hermes/OBJECTION_HANDLING_CHEATSHEET.md` — companion file (top 10 objections)

---

## §1 — Pre-call (T-24h): the prospect brief

The AE's job in the 24 hours before the call is to **walk in already knowing 80% of what the prospect will say.** That means researching the company, the buyer, and the trigger event — and writing a 1-page prospect brief that ends with a "why us" hypothesis. **No research = no demo.** The brief is the AE's armor.

### 1.1 The 6-source research checklist (60-90 min of work)

| #   | Source                                                                           | What to find                                                                                                            | Time   |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | **LinkedIn** (CEO, CFO, Controller, FP&A Lead)                                   | Tenure, prior companies, mutual connections, posts, comments                                                            | 20 min |
| 2   | **Crunchbase / Pitchbook**                                                       | Funding stage, last round size, lead investors, total raised                                                            | 10 min |
| 3   | **Job postings** (LinkedIn, Indeed, company careers page)                        | Hiring FP&A = buying signal; hiring engineer on data team = building internally; hiring Controller = "I need help" pain | 10 min |
| 4   | **BuiltWith / Wappalyzer / Datanyze**                                            | What SaaS tools they use today (look for Anaplan, Adaptive, Vena, Pigment, Cube, Mosaic)                                | 10 min |
| 5   | **Recent news** (Google News, company blog, press releases)                      | Funding announcement, leadership change, earnings call, M&A, product launch                                             | 10 min |
| 6   | **Public financials** (SEC filings, public-company 10-K, press-released metrics) | ARR, growth rate, headcount, gross margin, burn rate (for the price-of-pain conversation)                               | 10 min |

### 1.2 The 1-page prospect brief (the AE's output)

The brief is 1 page, structured as follows. **The AE writes this in their own words; it is not copy-pasted from the sources.**

```
PROSPECT BRIEF — {{Company}} — {{Call Date}}
================================================

1. COMPANY
   Name:           {{Company}}
   HQ:             {{City, State/Country}}
   Industry:       {{Vertical}}
   Size:           {{FTE}} FTE / {{ARR}} ARR
   Stage:          {{Seed / Series X / Public / PE-backed}}
   Last round:     {{Date, $, lead investor}}

2. BUYER
   Name:           {{First Last}}
   Title:          {{CFO / VP Finance / Controller / CEO}}
   Tenure:         {{X years in role}}
   Prior:          {{Prior companies, signal for "Anaplan-survivor" vs "first-time buyer"}}
   LinkedIn:       {{Notable posts, peer-CFO connections, public advocacy}}

3. CURRENT STATE (inferred from research)
   ERP:            {{NetSuite / Sage Intacct / QuickBooks / Dynamics / SAP}}
   FP&A tool:      {{Anaplan / Adaptive / Cube / "Excel" / "none" / unknown}}
   Data warehouse: {{Snowflake / BigQuery / Redshift / "no" / unknown}}
   Headcount:      {{FP&A team size}}
   Close cycle:    {{Days from close to board pack — inferred from CFO's posts or peer-benchmarks}}

4. TRIGGER EVENT (the why-now)
   {{The single most likely reason they took the call. Examples:
   - Series B closed last quarter → "we need board-pack scenarios"
   - New CFO hire in the last 90 days → "clean the FP&A stack"
   - First missed forecast in the last 60 days → "we need a real tool"
   - NetSuite-to-Intacct migration in progress → "add the FP&A layer at the same time"}}

5. PAIN HYPOTHESIS (best guess)
   {{"Likely spending 2+ days/month on a manual consolidation that breaks when
   the controller updates a cell. Wants to be able to walk into the board with
   3 scenarios, not 1. Anaplan quote is probably $200K-$400K/yr which is out
   of budget. Willing to pay $50K/yr but not $200K/yr."}}

6. WHY-US HYPOTHESIS (our angle)
   {{"We're offline-first, no data leaves the laptop. Business tier is $499/user/mo,
   which is 80% cheaper than Anaplan. 30-min install, no consultants. AI Copilot
   at the SMB tier is the demo moment."}}

7. RISK FLAGS
   {{Any of these should trigger a disqualify or re-route:
   - Headcount > 1,000 (route to Chris-track, ICP-3, Phase 2)
   - Industry not in our 17 sectors
   - Already on Anaplan for > 12 months (sunk cost, route to renewal-cycle play)
   - "We can build this internally" already said in outreach (de-prioritize, lead with build-vs-buy)}}

8. AE'S TALKING POINTS (3 max)
   {{Pre-loaded for the pitch. The AE picks 2 of these 3 for the call.}}

================================================
```

### 1.3 The pre-call checklist (the AE ticks these off in the 30 min before the call)

- [ ] Prospect brief written + saved to CRM
- [ ] Sales-call recording tool set up (Gong / Chorus / Zoom record)
- [ ] Calendar invite confirmed; agenda sent in the invite body
- [ ] Demo environment loaded with a **sector-preset scenario** that matches the prospect's industry
- [ ] Anaplan battlecard (this file) open in a tab
- [ ] Objection handling cheatsheet (`OBJECTION_HANDLING_CHEATSHEET.md`) open in a tab
- [ ] Beta-program scoring rubric (from `BETA_PROGRAM.md` §2) — used in real-time to qualify the prospect
- [ ] Pricing one-pager (`ANAPLAN_LEAVE_BEHIND.md`) loaded — the AE's PDF leave-behind

**Three-witness test (per pre-call section):** (a) Buyer = Carla, mid-market SaaS CFO; (b) Alternative = Anaplan / Adaptive / Excel + 3-week scenario marathons; (c) Price/pain = $200K-$500K Anaplan bill / 2-day manual consolidation / 10-15 day close cycle.

---

## §2 — Opening (5 min): set the agenda + ask why-now

The opening has exactly one job: **set the buyer's expectation that this is a 30-min structured conversation, not a 30-min pitch.** The AE who pitches for 25 minutes loses. The AE who asks questions for 25 minutes closes.

### 2.1 The agenda script (verbatim, 30 seconds)

> _"{{First name}}, thanks for taking the time. I've got 30 minutes, here's what I'd like to cover: 5 minutes on your context, 10 minutes on your pain, 10 minutes on whether we're a fit, and 5 minutes on next steps. Sound good?"_

**Why this script:** The agenda sets 3 things — (a) this is a structured conversation, not a pitch; (b) the AE values the buyer's time; (c) the next-step is built in (5 min at the end). The "sound good?" gives the buyer veto power, which paradoxically increases buy-in.

### 2.2 The why-now opener (verbatim, 60 seconds)

> _"Before we dive in — and I'll save my detailed questions for the discovery section — what prompted you to take this call? Was there a specific moment, or has this been a longer evaluation?"_

**What the AE is listening for (3 buying signals):**

1. **Budget allocated** — "We've earmarked $X for this." → Hot signal.
2. **Timeline defined** — "We want to be live by Q[X]." → Hot signal.
3. **Evaluation criteria clear** — "We're looking at 3 things: X, Y, Z." → Hot signal.

**What the AE is listening for (3 red flags):**

1. **"Just exploring"** — No budget, no timeline. The AE probes: "What would need to be true for this to become a priority?"
2. **"My boss told me to look"** — Buyer is not the decision-maker. The AE probes: "Who else would need to be in the conversation for this to land?"
3. **"We have a tool but I'm just curious"** — Satisfaction with current tool. The AE probes: "What's the one thing about your current setup that's most painful?"

### 2.3 The agenda recap (the AE's last 30 seconds before moving to discovery)

> _"Got it. So you're saying {{X}}. Let me make sure I understand the context, then I'll have some specific questions about the pain. Cool?"_

This is a **paraphrase + permission to ask** pattern. The paraphrase proves the AE was listening; the permission to ask respects the buyer's control of the conversation.

**Three-witness test (per opening section):** (a) Carla, mid-market CFO, 50-500 FTE SaaS; (b) Anaplan/Adaptive quote (often 60-90 days old, no follow-up); (c) the why-now trigger = the close-cycle pain / missed forecast / new CFO / fundraise.

---

## §3 — Discovery (10 min): 5 questions, in order

The discovery section is **the AE's most-leveraged 10 minutes.** The questions are sequenced so each builds on the last. The AE's job is to **listen 80%, take verbatim notes 20%, and never pitch.** The pitch comes in §4.

### 3.1 The 5 questions (verbatim, in order)

**Q1 — Current state:**

> _"Walk me through how you do FP&A today. Who owns it, what tools do you use, where does the data come from?"_

**What the AE is listening for:** ERP source-of-truth (NetSuite/Intacct/QuickBooks), modeling tool (Excel/Anaplan/Cube), BI/dashboarding (Tableau/Looker), team size, version control nightmare.

**The Iris quote to use if the AE needs to name the pain:**

> _"I just need something that works. I don't care if it's beautiful. I just need to not be the bottleneck." — Chris, controller at a sub-100-person SaaS (Iris PERSONAS.md §2)_

**Q2 — The pain:**

> _"What's the most painful part of that process?"_

**What the AE is listening for:** Time-anchor pain ("2 days/month on consolidation"), accuracy pain ("we missed a forecast last quarter"), version-control pain ("the workbook broke and we sent bad numbers"), bottleneck pain ("my analyst is the only one who can run the model").

**Q3 — The price-of-pain:**

> _"How much time or money does that pain cost you? In analyst hours, in delayed board packs, in missed decisions?"_

**What the AE is listening for:** Specific ROI numbers. The buyer's first number is rarely their real number — the AE should ask "if you had to put a dollar figure on it, what would it be?" and wait for the silence. The number that comes after the silence is the real one.

**The Iris quote to mirror:**

> _"If I can get my analyst back to 30% of their time on real analysis instead of 50% on data janitorial, that's a 40% productivity gain. That's a hire I don't have to make." — Carla, CFO (Iris PERSONAS.md §1)_

**Q4 — Prior solutions:**

> _"What have you tried to fix it? What worked, what didn't?"_

**What the AE is listening for:** Anaplan POC that failed (Vera-style), Adaptive that was too complex, Cube that lacked the AI, "we tried to build it internally and the engineer left." The prior-solution history is the buyer's buying motion — they're telling us what they value and what they reject.

**Q5 — The vision:**

> _"If you could wave a magic wand, what would the ideal look like in 12 months?"_

**What the AE is listening for:** The buyer's actual dream state. This is the answer that drives the pitch in §4 — the AE should write it down verbatim, then paraphrase it back in the pitch.

### 3.2 The AE's note-taking protocol

The AE takes notes in **the buyer's words, not the AE's interpretation.** The 3 fields to capture:

1. **Pain words** — the exact words the buyer used to describe their pain (these become the language of the pitch in §4)
2. **ROI numbers** — any dollar or time figure the buyer named
3. **Decision criteria** — anything the buyer said about how they'll evaluate us (the AE's job is to surface these and confirm them in §5)

The AE's notes are the input to the §5 close — the 2-paragraph recap email within 1 hour of the call must quote the buyer's own words back at them.

### 3.3 The AE's disqualification triggers (during discovery)

| Trigger                                                         | Action                                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buyer is the Controller (ICP-2 Vera), not the CFO (ICP-1 Carla) | Acknowledge, but qualify: "Who else would need to be in the conversation for the budget decision?" If Controller-only, route to ICP-2 PLG motion + Beta program. |
| Buyer mentions Anaplan for > 12 months                          | Acknowledge, but qualify: "What's your renewal date?" If > 12 months away, route to renewal-cycle play (postpone the call).                                      |
| Buyer says "we have an in-house solution"                       | Ask: "How many engineers? How long has it been in development?" If 2+ engineers for 12+ months, the in-house solution is a competitor, not a prospect.           |
| Buyer says "we don't have budget"                               | Ask: "If budget weren't an issue, would this be a priority?" If no, disqualify. If yes, capture for Q4 2026 nurture.                                             |
| Buyer has < 5 users in mind                                     | Route to ICP-2 / Beta OSS tier. ICP-1 starts at 5+ users.                                                                                                        |

### 3.4 The 3 minutes that follow discovery (handoff to pitch)

> _"That's really helpful. So what I'm hearing is {{paraphrase of Q1-Q5 in 2 sentences}}. Does that match what you're trying to solve?"_

The paraphrase is the AE's **summary statement of value.** If the buyer says "yes, exactly" — the AE has earned the right to pitch. If the buyer says "not quite" — the AE asks 1-2 clarifying questions before pitching.

**Three-witness test (per discovery section):** (a) Carla, mid-market SaaS CFO; (b) Anaplan/Adaptive at $200K-$500K/yr + 3-week Excel marathons (the silent incumbent); (c) the price-of-pain = $200K-$400K opportunity cost per year in analyst hours + missed board commitments.

---

## §4 — Pitch (10 min): 2 stories, not features

The pitch is the section the AE is most tempted to over-engineer. **The pitch is not a feature tour. The pitch is 2 stories that match the buyer's pain from §3.** Then a 2-sentence recap, then a question.

### 4.1 Why stories, not features

The buyer has heard 5 vendor demos this quarter. They cannot remember which vendor had the "AI Copilot" or the "Real-time Collaboration." What they remember is **a person like them, in their situation, who had the same pain and got a specific outcome.** The story is the memory anchor; the feature is the supporting evidence.

**The 2 stories below are templates.** The AE should practice these in their own voice, swap in real customer names once the Beta program graduates (D+90), and personalize the specifics to the prospect's industry.

### 4.2 Story 1 — Same-ICP story (5 min)

> _"Let me tell you about a customer who's in a really similar situation. She was a CFO at a vertical SaaS company — I'll call her 'Carla' because the persona is so consistent. About 200 employees, $40M ARR, Series C, NetSuite for the GL, 3-person FP&A team._
>
> _Her pain was the close-to-disclose cycle. She was getting the board pack out in 14 days, and her CEO was asking for 5-day turnarounds. She'd spend 2 days/month on a manual consolidation that broke every time her controller updated a number. She told me, verbatim: 'I want to walk into the board meeting with three scenarios, not one guess.'_
>
> _We replaced her 3-week Excel scenario build with a 30-second model run. Her analyst now builds 4 scenarios per week instead of 1 per month. Her close cycle dropped from 14 days to 3. She's now running the board-pack review in a single meeting, not 3._
>
> _The kicker: she was about to sign an Anaplan quote for $340K. We're at $180K with the Business tier. Same scope. 2-week migration. Zero consultants. Her exact words on the D+30 NPS: 'this is the first tool my team actually uses.'"_

**Story 1 anatomy:**

- **Persona (a):** "Carla" — same ICP (mid-market SaaS, 50-500 FTE, $20-80M ARR)
- **Pain (b):** 14-day close, 3-week scenario build, broken Excel model
- **Outcome (c):** 3-day close, 30-second scenarios, 4× per week vs. 1× per month, $160K/yr savings

**Three-witness test (story 1):** (a) CFO at 50-500 FTE SaaS; (b) Anaplan at $340K/yr vs. our $180K; (c) close cycle 14d→3d, scenarios 1×/mo→4×/wk, savings $160K/yr.

### 4.3 Story 2 — Competitor-displacement story (5 min)

> _"The second story is about a different kind of buyer — a controller at a Series B SaaS company, $15M ARR, 50 employees. His CEO had asked him to evaluate Anaplan. The quote came back at $250K/year. He told me, 'I could close this in 6 months, but my CEO wants it in 6 weeks, and I don't have $250K in my budget.'_
>
> _We did a 2-week pilot on his actual data. He imported his QuickBooks + Stripe data in 10 minutes, built a board-pack scenario in his first 30 minutes, and ran 5 Monte Carlo simulations by end of week 1. He cancelled the Anaplan POC. He told me later: 'I got 80% of what Anaplan would have given me, for 12% of the cost, and I was live in 2 weeks.'_
>
> _The thing he loved most was the AI Copilot. He could ask 'what happens to runway if I hire 3 engineers?' in plain English and get an answer in 30 seconds. He'd never had that before."_

**Story 2 anatomy:**

- **Persona (a):** "Vera" — controller at 10-50 FTE SaaS (the Controller-in-a-Carla-company, per Iris's persona priority #1)
- **Pain (b):** Anaplan POC, $250K/yr quote, 6-month timeline, no $250K budget
- **Outcome (c):** Cancelled Anaplan, $30K/yr Business tier, 2-week go-live, AI Copilot demo moment

**Three-witness test (story 2):** (a) Controller at 10-50 FTE SaaS; (b) Anaplan at $250K/yr (the displacement incumbent); (c) 80% of Anaplan's scope, 12% of the cost, 2 weeks vs. 6 months.

### 4.4 The 2-sentence recap (verbatim, 30 seconds)

> _"Based on what you said, here's how I'd map this for you. Your pain is {{Q2 paraphrase}}, and you're spending {{Q3 ROI number}} on it. The fastest path to fixing that is {{our 2-week pilot on your data, with the Business tier, 5 users to start}}. Does that match what you're trying to solve?"_

The recap is the buyer's **decision moment.** If the buyer says "yes, exactly" — the AE has the right to close. If the buyer says "mostly, but..." — the AE asks the clarifying question before closing.

**Three-witness test (per pitch section):** (a) Buyer = mid-market CFO, $20-100K/yr budget; (b) Alternative = Anaplan at $200K-$500K/yr OR Excel at 3-week scenario marathons; (c) Outcome = 3-day close, 30-second scenarios, $160K-$220K/yr savings, 2-week migration.

---

## §5 — Close (5 min): next steps + the 2-paragraph recap email

The close is the AE's final 5 minutes. The job is to (a) schedule the next step ON THE CALL, (b) send a recap email within 1 hour. The AE who says "let me think about it and follow up" has lost. The AE who says "let's book the technical demo right now" has won.

### 5.1 The 3 closing scripts (verbatim)

**Script 1 — The buyer is ready (best case):**

> _"Based on our conversation, I think we're a strong fit. The next step would be a 30-min technical demo with your team — your Controller, your analyst, anyone else who'd need to validate this. Who else would need to be in the room?"_

If the buyer names people: pull up the calendar right there, send the invite within 60 seconds. **Do not leave the call without scheduling.** If the buyer is vague ("I'll loop them in later"), the AE says: "Totally. To respect their time, can you intro me by email today so I can send the invite from your thread?" — the intro-by-email is the gate to the next step.

**Script 2 — The buyer wants to think about it (median case):**

> _"Totally understand. What would you need to see to feel confident? Is it a feature, a reference, a security review, a price confirmation?"_

The buyer's answer tells the AE what the actual objection is. The AE's follow-up: "Can I follow up on {{specific date, 3-5 business days out}} with {{specific deliverable}}?" The follow-up is the close — if the buyer commits to the follow-up, the deal is in motion.

**Script 3 — The buyer wants a proposal (third case):**

> _"Happy to send a proposal. Can I ask 2 quick questions first so the proposal is right? First, what are the 3 things you'd be evaluating us on? Second, what's the timeline you're working with?"_

The 2 questions turn the proposal from a one-way deliverable into a **structured comparison document** that the buyer can take to their CEO/board. The proposal is sent within 24 hours, not within 1 hour (the proposal takes longer to write than the recap).

### 5.2 The 2-paragraph recap email (sent within 1 hour, verbatim template)

```
Subject: Recap + next step — FinPlan Pro × {{Company}}

Hi {{First name}},

Thanks for the time today. Quick recap of what we discussed:

  - Your context: {{Q1 paraphrase in 1 sentence — current state}}
  - Your pain: {{Q2 paraphrase in 1 sentence — the most painful part}}
  - What we agreed: the next step is {{the demo, the proposal, the pilot}}
    on {{date, time, with whom}}.

{{Optional 1-line personal note: "Loved your point about the 3-scenario board
pack — that's exactly the pain we built the AI Copilot for."}}

Calendar invite for the next step is attached. Let me know if anything
changes on your end.

— {{AE name}}
{{mobile}} | {{calendar link}}
```

**Why this email matters:**

- **Sent within 1 hour** = the AE's responsiveness signal. The buyer reads the email while the call is still fresh.
- **2 paragraphs, not 5** = respects the buyer's time. The recap is a confirmation, not a re-pitch.
- **Buyer's own words quoted back** = the AE was listening. The buyer feels heard.
- **Calendar invite attached** = the next step is committed. The deal is in motion.

### 5.3 The "what if the buyer goes dark" follow-up (the AE's last-resort pattern)

If the buyer doesn't respond to the recap email within 48 hours, the AE sends **1 follow-up** (not 3, not 5 — 1):

```
Subject: {{First name}}, still on for {{next-step date}}?

Hi {{First name}} — wanted to make sure the {{next step}} on
{{date}} still works on your end. Happy to push it back a week
if something's come up. No pressure either way — just don't
want to leave a calendar slot hanging.
— {{AE name}}
```

If the buyer still doesn't respond within 7 days, **the deal is dead for this quarter.** The AE marks the CRM as `NOT_NOW_Q[X]` and adds the buyer to the Q[X+1] re-engagement list. **Do not chase. Do not send a breakup email. The recap email is the breakup email.**

### 5.4 The post-call checklist (the AE ticks these off within 1 hour)

- [ ] Recap email sent (within 1 hour)
- [ ] Calendar invite sent for next step (within 1 hour)
- [ ] CRM updated with: call notes (verbatim pain words + ROI numbers), next step, expected close date
- [ ] Gong / Chorus / Zoom recording uploaded + tagged with the prospect's name
- [ ] If Beta-program-fit (ICP score ≥ 7): invite to the Beta cohort (`BETA_PROGRAM.md` §2.4)
- [ ] If deal-closed-won: notify CSM, send welcome packet, schedule kickoff call (D+7 of the Beta sequence)

**Three-witness test (per close section):** (a) Carla, mid-market SaaS CFO; (b) Anaplan/Adaptive at $200K-$500K/yr (the comparison); (c) the close = 30-day pilot, no payment unless 3 success criteria hit, 50% Y1 discount, 90-day price-lock (from `BETA_PROGRAM.md` §6.2).

---

## §6 — Operational notes (the AE's weekly review)

### 6.1 The 5 AE metrics (per AE, per week)

| Metric                                               | Target    | Source        |
| ---------------------------------------------------- | --------- | ------------- |
| Discovery calls booked                               | 8-10/week | CRM           |
| Show rate                                            | 80%+      | Calendar      |
| Discovery calls held                                 | 6-8/week  | Gong / Chorus |
| Qualified opportunities (ICP-1, 5+ users, $20K+ ACV) | 4-6/week  | CRM           |
| Closed-won (or moved to "demo booked" stage)         | 1-2/week  | CRM           |

**The 5 metrics form a funnel:** 10 booked → 8 held (80% show) → 4-6 qualified (50-75% ICP-1) → 1-2 closed-won (25-50% close on qualified). The AE's job is to **keep the top of the funnel full** (8-10 booked/week) and **maximize the show rate** (80%+).

### 6.2 The 5 things the AE does NOT do

1. **Do not pitch in the first 5 minutes.** The agenda is set; the why-now is asked; the buyer has the floor.
2. **Do not demo features in §3.** The pitch is in §4; the demo is in the next call.
3. **Do not send a proposal without the 2 qualifying questions (Script 3).** A proposal without context is a wasted effort.
4. **Do not chase a ghosted buyer past 1 follow-up.** The recap email is the breakup email; one follow-up is the closing grace.
5. **Do not record without consent.** The Gong / Chorus / Zoom recording requires verbal consent in the first 30 seconds; the AE asks "mind if I record this for our internal notes?" If the buyer says no, the AE takes detailed text notes.

### 6.3 The escalation paths

| Situation                                                       | Escalation                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Buyer is in ICP-3 (Chris-track, Phase 2)                        | Route to Strategic AE; Iris / Strategos to coordinate                                 |
| Buyer wants features not in Phase 1 (white-label, mobile, etc.) | AE says "we're targeting Q[X] for that" and offers design-partner seat                |
| Buyer mentions competitor (Anaplan/Adaptive/Mosaic)             | AE pulls up the relevant battlecard (`BATTLECARD_ANAPLAN.md`) live on the call        |
| Buyer asks about SOC 2 / SSO                                    | AE says "SOC 2 Type 1 by Q4 2026, SSO in MVP, here's the roadmap" + sends the 1-pager |
| Buyer is the CEO of a 5-person company (not ICP-1, not ICP-2)   | AE routes to the OSS / Beta program (ICP-2+)                                          |

---

## §7 — Open questions for the Leader / Strategos (post-launch iteration)

1. **Should the AE be a single rep covering ICP-1 + ICP-2, or two specialized reps?** Single-rep is simpler; specialized-rep is higher-conversion. Strategos to model the 18-month ramp.
2. **Should the §4 pitch use 2 stories always, or 1 story + 1 feature demo for technical buyers?** Technical buyers (Vera-track, ICP-2) want to see the model, not hear stories. The 1-story-1-demo variant is for ICP-2 + ICP-3.
3. **Should the §5 follow-up cadence be 48 hours + 7 days, or 24 hours + 5 days?** Faster follow-up = higher show rate at next step, but risk of being pushy. A/B test.
4. **Should the §2 opener include a "what's on your plate this quarter" question?** A signal for whether the buyer has bandwidth to evaluate now. Adds 30 sec to the opener; saves hours on a doomed call.
5. **Should the AE use a video email (Loom) for the recap instead of text?** Per cold-outbound data, Loom emails convert 2-3x. A/B test the Loom-recap variant.

---

_λόγος πρόσωπον — the face-to-face message. The email books the call; the call closes the deal. The AE is the messenger; Hermes writes the words. — Hermes_
