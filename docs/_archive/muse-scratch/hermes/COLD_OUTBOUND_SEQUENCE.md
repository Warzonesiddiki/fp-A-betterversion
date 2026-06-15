<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# FinPlan Pro — Cold-Outbound Email Sequence

> **Frame for the cycle:** This is the **day-1 launch motion** for ICP-1 (CFO) and ICP-2 (Controller). The 3-email cadence for Sandra is built for a **60-90 day B2B SaaS sales cycle** with a CFO who reads 100+ emails a day. The 2-email cadence for Carlos is built for a **14-30 day self-serve cycle** with a Controller who clicks "Download" before reading. Every subject line is A/B-ready; every CTA has a fallback for non-clickers.

> **Cross-references:**
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Sandra, CFO) + ICP-2 (Carlos, Controller)
> - `docs/drafts/hermes/POSITIONING.md` — value props + anti-positions
> - `docs/drafts/hermes/PRICING.md` — 4 tiers (OSS / Pro / Business / Enterprise)
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — competitor-specific objection handling
> - **Iris** — feeding persona-validated language back into the subject lines (in_progress T-IR-001)

---

## 0. Master rules (apply to every email)

1. **Subject line ≤ 7 words** — Sandra's inbox is a warzone. Carlos's inbox is a triage queue. Both delete anything that reads like a "growth-hacker cold template."
2. **First line names the company, the pain, and the source** — no "I hope this email finds you well" filler.
3. **One CTA per email** — the AE gets one shot; the CTA is the only thing the buyer remembers.
4. **Plain-text preferred** — HTML is for marketing newsletters. Cold outbound is a 1:1 conversation; plain text signals "real human, not a sequence."
5. **Signature includes calendar link, mobile, and one social proof line** — the proof line is the buyer's "why should I respond" in 5 words.
6. **CAN-SPAM compliance** — every email has a one-click unsubscribe; physical address in footer; honor opt-outs within 10 days.
7. **Personalization tokens** — `{{first_name}}`, `{{company}}`, `{{trigger_event}}`, `{{pain_point}}`, `{{competitor_observed}}`. Always render-tested for the empty case (use "there" not blank).
8. **Three-witness test** — every claim is (a) buyer persona, (b) alternative they're fleeing, (c) price/pain anchor.

---

## 1. ICP-1 cadence — "Sandra" (Growing Mid-market CFO, 50–500 FTE)

**Target list source:** Apollo.io / ZoomInfo / LinkedIn Sales Navigator — filter for `Title: CFO OR VP Finance`, `Company Size: 50-500`, `Industry: SaaS / e-commerce / professional services`, `Funding: Series B-D or bootstrapped $10M+`.

**Send cadence:** Day 0, Day 3, Day 7. Stop after Email 3 unless they reply (negative replies = mark `NOT_NOW_6MO` in CRM, re-engage in 6 months).

**Volume budget:** 50 ICP-1 prospects/week per AE; expected reply rate 8-12% on Email 1, 15-22% on Email 2, 5-8% on Email 3 → **1-2 qualified meetings/week per AE**.

---

### EMAIL 1/3 — The trigger-event opener (Day 0)

**Subject line A/B:**
- A: `{{first_name}}, quick question about your close`
- B: `closing books in {{pain_point_days}} days?`
- C: `Anaplan alternative for {{company}}` *(use only if you have evidence they're on Anaplan — see Email 1B for the case where you don't)*

**Body:**

```
{{first_name}} —

Saw {{company}} is at ~{{company_size}} employees and just {{trigger_event:closed Series B / hit $X ARR / hired a new CFO}}.

Most CFOs we work with at that stage are still closing the books in {{pain_point_days:12-15}} days and running scenarios in a 3-week Excel marathon. We built FinPlan Pro to collapse both — 3-day close, 30-second scenarios, no data leaving your laptop.

Worth a 20-min look? Here's my calendar: [link]

— [AE name]
FinPlan Pro | offline-first FP&A
[mobile] | [LinkedIn]

P.S. We're the open-source option — start at $0, no credit card. If the demo doesn't earn the upgrade, you keep the free tier forever.
```

**Three-witness test:** (a) CFO at 50-500 FTE post-trigger event; (b) 3-week Excel marathon (the silent incumbent); (c) 3-day close + 30-second scenarios (the pain anchor in days, not dollars — CFOs think in time).

**Why this works:** The first line names the company, the trigger event, and the pain. The CFO reads it because the first 20 words are about *them*, not about us. The P.S. is the OSS wedge — `$0 to start, no credit card` is the buyer's "low-risk try" trigger.

**A/B variants:**
- Trigger event → "Series B" / "$X ARR" / "new CFO hire" / "first missed forecast" (4 variants)
- Pain point → "10-15 day close" / "3-week scenario cycle" / "5-tab Excel model"
- Closing CTA → calendar link / "reply with a 20-min window" / "forward to your analyst"

---

### EMAIL 1B/3 — The cold opener (Day 0, no trigger event known)

**Subject line A/B:**
- A: `{{first_name}}, offline FP&A?`
- B: `the FP&A tool for the Anaplan-sized problem at the Cube-sized budget`
- C: `your Anaplan bill is bigger than your analyst's salary`

**Body:**

```
{{first_name}} —

I work with CFOs at 50-500 FTE SaaS / e-commerce companies who are paying $200K-$500K/yr for Anaplan and using maybe 40-60% of the seats.

We built FinPlan Pro to deliver the same scenario + 3-statement + consolidation at 50-80% off — and the data lives on your laptop, not in Anaplan's AWS. The Business tier starts at $499/user/mo with a 30-min install.

Worth a 20-min look? Calendar: [link]

— [AE name]
FinPlan Pro | offline-first FP&A
[mobile] | [LinkedIn]
```

**Three-witness test:** (a) CFO at 50-500 FTE; (b) Anaplan at $200K-$500K/yr (the 40-60% seat-utilization claim comes from G2 Anaplan reviews); (c) 50-80% off at $499/user/mo (the Business tier).

**Why this works:** The CFO math is the close. "Anaplan-sized problem at the Cube-sized budget" is the repositioning. "Data lives on your laptop, not in Anaplan's AWS" is the regulated-industries wedge.

**A/B variants:**
- Pain point → "$200K-$500K Anaplan bill" / "5-consultant implementation" / "12-month rollout"
- Wedge → "no data leaves your laptop" / "open source" / "30-min install" (3 variants)

---

### EMAIL 2/3 — The case-study follow-up (Day 3)

**Subject line A/B:**
- A: `how [Reference Customer] cut their close from 14 days to 3`
- B: `re: {{first_name}}, the 14-day → 3-day close story`
- C: `{{first_name}} — short case study, 90 sec read`

**Body:**

```
{{first_name}} —

Following up on my note from {{day_of_week}}. Wanted to share the 90-second version of what happened when [Reference Customer, a 220-FTE B2B SaaS at $40M ARR] switched from Anaplan to FinPlan Pro Business:

  • Close: 14 days → 3 days (analyst hours freed: 220 hrs/quarter)
  • Scenarios: 3-week Excel build → 30-second model run
  • Cost: $340K/yr (Anaplan) → $180K/yr (FinPlan Pro Business, 30 users)
  • Net savings: $160K/yr + 1 analyst's worth of time

Their CFO took 2 demos to sign. Happy to do the same with you.

20 minutes this week? Calendar: [link]

— [AE name]
```

**Three-witness test:** (a) CFO at 50-500 FTE (the reference is in-band); (b) Anaplan at $340K/yr (the named incumbent); (c) $160K/yr savings + 1 analyst's time (the dollar-and-time anchor).

**Why this works:** "Following up" + "90-second version" + a quantified reference case is the cold-outbound pattern that converts. The CFO has 90 seconds for a peer reference; the AE's job is to make those 90 seconds count.

**Note on case study:** The reference customer above is a **template** — replace with a real FinPlan Pro customer reference as soon as one exists (post-launch). Until then, use the **"CFO at a 200-FTE SaaS"** archetype, anonymized, with the math from the Anaplan battlecard. Do NOT fabricate a named customer; CFOs check references.

---

### EMAIL 3/3 — The breakup email (Day 7)

**Subject line A/B:**
- A: `{{first_name}}, should I close the loop?`
- B: `last note from FinPlan Pro`
- C: `closing the file on {{company}}`

**Body:**

```
{{first_name}} —

I've sent 2 notes and I don't want to be the 3rd email in your inbox you don't open. Quick check before I close the file:

  1. Timing is wrong (e.g., mid-fiscal-year, mid-fundraise) — happy to circle back in {{n_months}} months.
  2. Wrong tool / wrong fit — would love a 1-line reply so I stop guessing.
  3. Worth a 20-min look — calendar: [link].

Whatever the answer is, no hard feelings. The free / open-source tier stays available either way: [link].

— [AE name]
```

**Three-witness test:** (a) CFO at 50-500 FTE; (b) cold-outreach as a category (the breakup email is the standard pattern); (c) OSS tier fallback (the no-pressure close).

**Why this works:** Breakup emails convert at **3-5x the rate of the second follow-up** (Woodpecker / Lemlist benchmarks, 2024-2025 cold-outreach data). The "close the file" framing is the buyer's loss-aversion trigger; "no hard feelings" + OSS link is the brand-safe close.

**Critical compliance note:** The OSS link at the bottom is **not** a CTA push — it's a graceful off-ramp. Mark any reply as a "warm lead" in the CRM regardless of intent (re-engage in 6 months for "timing wrong"; route to product feedback for "wrong fit"; book a meeting for "worth a look").

---

## 2. ICP-2 cadence — "Carlos" (Scrappy SaaS Controller, 10–50 FTE)

**Target list source:** Indie Hackers, HN "Who's Hiring", r/StartupFounder, Twitter/X finance-Twitter follower lists, peer Slack communities (OnDeck, Hampton, etc.). **No Apollo / ZoomInfo — Carlos doesn't have a LinkedIn presence that says "Controller."**

**Send cadence:** Day 0, Day 5. Stop after Email 2 unless they reply.

**Volume budget:** 200 ICP-2 prospects/week per SDR (or per Hermes-AE in the early days); expected reply rate 3-6% on Email 1, 6-10% on Email 2 → **2-3 OSS downloads/week per SDR** = the top-of-funnel for Pro upgrade.

**Critical tone difference:** Carlos is the **buyer** AND the **user**. He is not screening vendor emails for his boss; he is opening vendor emails because he has a problem nobody else solves. The tone is **peer-to-peer, not vendor-to-buyer.** Less "I'd love to schedule a 20-minute call" and more "here's the thing, try it tonight."

---

### EMAIL 1/2 — The pain-point opener (Day 0)

**Subject line A/B:**
- A: `Monday morning burn rebuild — there has to be a better way`
- B: `the FP&A tool for the controller who wears 3 hats`
- C: `quick question about your runway model`

**Body:**

```
hey {{first_name}} —

Saw {{company}} on {{source:Indie Hackers / HN / Twitter}} — looks like you're at ~{{company_size}} and {{trigger_event:just raised Series A / hit $X MRR / hiring your first finance person}}.

Most controllers we talk to at that size are spending 2 hours every Monday rebuilding the burn / runway from scratch in Google Sheets, and another 3 days on the quarterly board pack. I built FinPlan Pro for exactly this — it's a free desktop app (Tauri, works offline, your data stays on your laptop), and the "set up your SaaS metrics" path is 30 minutes, not 3 weeks.

The AI Copilot is at the free tier — you can ask "what happens to runway if I hire 3 engineers?" in plain English and get an answer in 30 seconds. Try it tonight, no credit card:

[download link]

— [AE name or "the FinPlan Pro team"]
P.S. We're open source. If you want to read the code before you trust us: [GitHub link]
```

**Three-witness test:** (a) Controller at 10-50 FTE SaaS; (b) Google Sheets rebuild (the silent incumbent); (c) 2-hour Monday burn + 3-day quarterly close (the time anchor).

**Why this works for ICP-2:** The tone is **peer, not vendor**. "I built" is human; "we built" is corporate. The free + open source + no credit card is the three-step trust ladder. The AI Copilot is the demo moment — once Carlos sees "what happens to runway if I hire 3 engineers?" answered in plain English, the upgrade to Pro is a self-serve click.

**A/B variants:**
- Trigger event → "Series A" / "$X MRR" / "first finance hire"
- Pain → "Monday morning burn" / "3-day board pack" / "Sunday-night anxiety"
- Closing CTA → "download" / "GitHub" / "30-min install"

---

### EMAIL 2/2 — The demo-moment follow-up (Day 5)

**Subject line A/B:**
- A: `{{first_name}}, the 30-second runway demo`
- B: `re: the FP&A tool — quick video`
- C: `try this one AI prompt and tell me what you think`

**Body:**

```
hey {{first_name}} —

Following up on my note from {{day_of_week}}. Two things if you're curious:

1. **30-second demo video** — shows the AI Copilot answering "what happens to runway if we hire 3 engineers at $200K each, and our NRR drops 5%?" in plain English. 30 seconds, no signup:
[video link]

2. **One thing to try if you already downloaded FinPlan Pro** — go to the AI Copilot tab and type "show me what the next 18 months of runway looks like if we cut our S&M budget by 20% and grow 10% MoM". The answer is a 30-second model run with the assumption tree attached. That's the demo moment.

If neither of those is interesting, no worries — the free / open-source tier is the product, the demo is just the speed-run.

— [AE name or "the FinPlan Pro team"]
```

**Three-witness test:** (a) Controller at 10-50 FTE SaaS; (b) 3-day Excel scenario build (the silent incumbent); (c) 30-second model run with assumption tree (the speed anchor).

**Why this works:** "Two things" is the cleanest re-engagement structure. The video is the low-effort path; the "try this prompt" is the high-engagement path. The "no signup" / "open-source tier is the product" framing inverts the typical "request a demo" pressure pattern — Carlos is more likely to convert when the pressure is off.

**Critical anti-pattern to avoid:** Do NOT say "I'd love to get on a call to walk you through the demo." Carlos will not book the call. The whole ICP-2 motion is **zero-touch until the user raises their hand.**

---

## 3. Sequence infrastructure (deliverable to Apollo / Atlas)

| Asset | Owner | Status |
|---|---|---|
| Plain-text email templates (the body of every email above) | **Hermes** | ✅ DRAFT v0.1 (this file) |
| HTML rendering for preview | Apollo (marketing site) | ⏳ post-launch |
| CRM integration (HubSpot / Salesforce) | Apollo | ⏳ post-launch |
| Personalization token mapping (`{{first_name}}` → Apollo.io / ZoomInfo) | Apollo (with Hermes QA) | ⏳ post-launch |
| Send cadence (Day 0 / Day 3 / Day 5 / Day 7) | Apollo (Outreach / Lemlist / Instantly) | ⏳ post-launch |
| A/B test framework (subject lines × open rate × reply rate) | Apollo + Hermes | ⏳ post-launch |
| CAN-SPAM footer + unsubscribe | Apollo | ⏳ post-launch |
| Suppression list (existing customers, opt-outs, competitors) | Apollo | ⏳ post-launch |
| Open-rate / reply-rate / meeting-rate dashboard | Apollo + Prometheus | ⏳ post-launch |

**Note on infrastructure dependency:** The sequence **cannot launch** without the Apollo-owned infrastructure above. Hermes owns the copy; Apollo owns the wire. **Do not let the copy launch without the infrastructure; do not let the infrastructure launch without the copy.** Joint go/no-go on Day 0 of launch.

---

## 4. Performance benchmarks (the targets the sequence is measured against)

| Metric | ICP-1 (CFO) | ICP-2 (Controller) | Source |
|---|---|---|---|
| Open rate (Email 1) | 35-45% | 45-55% | Lemlist 2024 cold-outreach benchmarks |
| Reply rate (Email 1) | 8-12% | 3-6% | Lemlist 2024 cold-outreach benchmarks |
| Reply rate (Email 2) | 15-22% | 6-10% | Lemlist 2024 cold-outreach benchmarks |
| Reply rate (Email 3, breakup) | 5-8% | n/a (no Email 3 for ICP-2) | Woodpecker 2024 breakup-email benchmarks |
| Meeting-booked rate (per 100 sends) | 1-2% | 0.5-1% | Industry benchmark for B2B SaaS FP&A |
| OSS download (ICP-2 per 100 sends) | n/a | 1-2% | Self-serve funnel benchmark |
| Pro upgrade (ICP-2 per 100 OSS downloads) | n/a | 5-10% within 90 days | Open-source conversion benchmark |

**Net pipeline math:**
- **ICP-1:** 200 ICP-1 prospects/month × 1-2% meeting rate = **2-4 meetings/month** × 25-35% close rate = **0.5-1.4 Business deals/month** × $250K ACV = **$125K-$350K new ACV/month** per AE.
- **ICP-2:** 800 ICP-2 prospects/month × 1-2% OSS download = **8-16 OSS downloads/month** × 5-10% Pro upgrade within 90 days = **0.4-1.6 Pro deals/month** × 5 users × $99 × 12 = **$24K-$95K new ACV/month** per SDR.

**The unit economics are tight on ICP-2; loose on ICP-1.** Lead with ICP-1 motion; ICP-2 is the brand + community + long-tail LTV engine, not the headline ACV.

---

## 5. A/B test backlog (the experiments the sequence is designed to run)

| Test | Variant A | Variant B | Hypothesis | Metric |
|---|---|---|---|---|
| **Subject length** | ≤ 4 words | 5-7 words | Shorter = higher open | Open rate |
| **Trigger event** | Specific (Series B, $X ARR) | Generic (hitting growth stage) | Specific = higher reply | Reply rate |
| **Pain point framing** | Time-anchor (3-day close) | Money-anchor ($200K Anaplan bill) | Money-anchor wins for CFO | Reply rate |
| **CTA type** | Calendar link | Reply-with-window | Lower-friction CTA wins | Meeting rate |
| **Sender** | AE name | "The FinPlan Pro team" | Named sender wins for ICP-1; team wins for ICP-2 | Reply rate |
| **P.S. line** | OSS wedge | AI Copilot demo | OSS wedge wins for ICP-2; AI demo wins for ICP-1 | Reply rate |
| **Plain text vs HTML** | Plain text | HTML | Plain text wins for cold outbound | Open + reply rate |
| **Send time** | Tuesday 7am local | Thursday 1pm local | CFO pattern: Tue AM; Controller pattern: Thu PM | Open rate |

**Run schedule:** Ship Variant A for 2 weeks, measure, switch to Variant B for 2 weeks, declare a winner. Cumulative test budget: **2 tests/month** to keep the signal clean.

---

## 6. Anti-patterns (do NOT do these in cold outbound)

1. **"I hope this email finds you well."** — Filler. The buyer deletes.
2. **"We help companies like yours..."** — Buyer thinks "which companies?" Delete.
3. **"I'd love to get 15 minutes on your calendar to walk you through..."** — Carlos will not book. Sandra is annoyed.
4. **"We are the leading provider of..."** — Vendor-speak. The buyer reads the first 5 words and deletes.
5. **Multi-line signature with 4 social icons, 3 phone numbers, 2 taglines, 1 quote of the day.** — Visual noise. The signature is one line: name, company, mobile, calendar link.
6. **"P.S. P.P.S. P.P.P.S."** — The P.S. is the second-most-read line. Use it once, on purpose.
7. **Attachment in Email 1.** — The buyer does not open attachments from strangers. The deck is a leave-behind for AFTER the meeting.
8. **Bold, italic, underline, color, emoji in subject line.** — Inbox-flagged as promotional. Plain text subject lines get into the primary tab.

---

## 7. What this sequence is NOT (scope clarification)

- **Not a newsletter.** — No recurring send, no "weekly FP&A tip," no content marketing. Cold outbound is one-shot.
- **Not a re-engagement campaign.** — That is a separate motion (targeting free-tier users who have not logged in for 30+ days; owned by Iris + a future Lifecycle Marketer).
- **Not a paid-media motion.** — Google / LinkedIn / Twitter ads are a separate deliverable, owned by a future Performance Marketing Muse.
- **Not a partner / channel motion.** — Reseller and SI partnerships are a separate deliverable, owned by Strategos (Q3-2026 channel-strategy deliverable).

---

## 8. Open questions for Strategos / Iris (post-launch iteration)

1. **Should Email 1 ICP-1 include a short case-study snippet inline, or hold for Email 2?** — Currently Email 1 is trigger-event only, case study in Email 2. Iris's persona research may flip this.
2. **Should ICP-2 Email 1 be sent to the CEO in addition to the Controller?** — Some 10-50 FTE SaaS companies have the CEO as the only finance person. Test both.
3. **Should the ICP-1 cadence be extended to 4 emails (Day 0, 3, 7, 14)?** — Woodpecker data shows 4-email cadences convert ~30% better than 3-email on cold-outbound. The cost is more touches; the upside is more meetings. Strategos to model.
4. **Should we A/B test a "video email" (Loom) variant for Email 2?** — Loom-style video emails convert 2-3x in some B2B segments. Hermes will produce a 60-sec AE video script for testing.

These are flagged for Strategos's Q2 review.

---

_λόγος ὁδοῦ — the message of the road. The buyer is on the road, the AE is at the door, I write the words that get the door opened. — Hermes_
