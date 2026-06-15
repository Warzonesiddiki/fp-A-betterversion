<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — 30-min User Interview Script

> **Muse:** Iris.
> **Audience:** Anyone at FinPlan Pro conducting a customer discovery interview.
> **Format:** Semi-structured, 30 minutes, video (Zoom/Meet). Always two interviewers: one asks, one takes notes.
> **Recruitment target:** 30 interviews in 2026-Q3 — 10 Carla, 10 Chris, 10 Vera (see `PERSONAS.md`). Recruit via LinkedIn, FP&A Slack/Discord communities, peer-CFO intros, and a $100 Amazon gift card incentive.
> **Recording consent:** Required. Send consent form 48 hours in advance. Transcripts stored in `docs/research/interviews/2026-Q3/`. **No PII shared externally; no names in public artifacts without explicit written permission.**
> **Output per interview:** (1) raw transcript, (2) 1-page summary in `docs/research/interviews/2026-Q3/summary-<interviewee-id>.md` using the 3-witness template (quote / behavior / alternative), (3) one new pattern OR contradiction appended to `docs/research/patterns.md`.

---

## Pre-interview checklist (10 min, before call starts)

- [ ] Read this script out loud once.
- [ ] Read the persona file the recruit matches.
- [ ] Re-read the **last 3 summaries** in `docs/research/interviews/` for that persona — DO NOT ask questions they've already answered.
- [ ] Open the **tracker** in another tab: `docs/research/interviews/TRACKER.md`. Pre-fill name, date, persona match.
- [ ] Test the recording (with consent). Test the auto-transcription.
- [ ] Close Slack / email / notifications. The recruit will notice if you're distracted.
- [ ] Have 3 backup questions ready in case the interview runs long or short.
- [ ] **Mindset: you are not selling. You are not validating. You are listening.** The best insight is the one you didn't ask for.

---

## The opening (2 minutes, scripted)

> "Thanks so much for taking the time. We're talking to finance leaders and operators like you to understand how work actually gets done — not to sell you anything, and not to validate a feature we're already building. There are no right answers. If something is broken, weird, or embarrassing, that's the most useful thing you can tell us.
>
> I'm [interviewer 1 name], I'm the head of research here. I'm joined by [interviewer 2], who will be taking notes so I can stay focused on you.
>
> We'll go for 30 minutes. If at any point you want to skip a question, just say so. If we run out of time, you can always email me a thought later.
>
> With your permission, I'll record this so I can transcribe it accurately. We never share recordings or names without your written okay.
>
> Sound good? Okay — let's start with yesterday."

---

## Section 1 — Role & Context (5 minutes)

The goal: ground the conversation in their actual day. The first question is the most important question in the whole interview. Most people have never been asked "walk me through your day" in a research context. Their answer will reveal what they think their job IS — which is not always what their job actually is.

### Q1. "Walk me through your day yesterday. What FP&A tasks did you do?"

- **What you're listening for:** the **gap** between their official job description and what they actually did. A "CFO" who spent 3 hours on customer escalations and 0 hours on strategy is telling you their real job is ops, not finance.
- **Follow-up (only if they say "nothing FP&A-related"):** "Walk me through what you DID do, even if it doesn't feel finance-y. Some of the most important finance work is hidden inside other tasks."
- **What to write down (in tracker):** their first 3 tasks of yesterday, in order. Do this BEFORE the call ends — memory fades.

### Q2. "How big is your team? Who reports to you?"

- **What you're listening for:** whether the org chart matches the work. A "team of 5" where 3 of them are doing the same task is a team of 1 with 4 helpers, not a team of 5. A "team of 1" who mentions 6 other people they "borrow" is a team of 7 in disguise.
- **Follow-up:** "Is there anyone outside your team whose work you depend on? Like a data engineer, or a controller, or a sales-ops person?"
- **What to write down:** org-chart sketch. The dotted-line dependencies are more important than the solid lines.

### Q3. "What's your monthly close cycle? What's the longest it has ever been?"

- **What you're listening for:** **the gap between the official close and the real close.** Almost everyone says "5 business days" and then pauses. The pause is where the truth lives. The longest-ever number is the **outlier** that reveals the **tail risk** (bad-audit-year, post-acquisition, COVID quarter).
- **Follow-up:** "When it was longest, what was the cause? What had to happen to get back to normal?"
- **What to write down:** the official number AND the longest-ever number. The delta is the **unmet need** we can name.

---

## Section 2 — Current Tools (5 minutes)

The goal: understand the **stack of sticks** they use to get work done. Most finance teams use 8-15 tools. The tool they use most is rarely the one they love. The tool they complain about most is rarely the one they'd replace first.

### Q4. "Show me the spreadsheet or model you use most. Walk me through it."

- **What you're listening for:** the **narrative** they tell. Is it "this is my masterpiece" (resilient) or "this is a nightmare" (brittle)? How many tabs? How many cross-sheet references? How many cells are highlighted yellow (a "do not touch" warning)? A workbook with 30 tabs and 200 yellow cells is a system in crisis.
- **Follow-up (technical buyers only):** "Is there a part of this model you wish was automated but isn't? Walk me through it."
- **What to write down:** tab count, "yellow cell" count, last-saved filename (the date in the filename is a time-capsule of pain).

### Q5. "What do you LIKE about your current setup?"

- **What you're listening for:** the **anti-features** we must NOT break. If they love that "Excel is offline," our cloud-only architecture is a non-starter for them. If they love that "the data lives in one place," our multi-source imports need to centralize the same way. **Things they love are sacred.**
- **Follow-up:** "If you had to start over, would you keep any of these things? What would you change first?"
- **What to write down:** a literal list of loved things. We will compare this list across all 30 interviews and look for the **top 3 sacred things**.

### Q6. "What do you HATE? (push for specifics)"

- **What you're listening for:** the **specific verb** they use. "It's slow" is a feeling. "It takes 4 days to refresh the variance tab" is a pain we can solve. Push past adjectives. Get numbers, durations, frequencies.
- **Follow-up:** "How often does that happen? What's the workaround you use?"
- **What to write down:** the verbs, the numbers, the frequencies. We will use these exact words in our marketing.

---

## Section 3 — Pain Points (10 minutes)

The goal: this is the **heart of the interview**. The previous sections set context; this section extracts the **JTBD (jobs-to-be-done)**. A job is not a feature ("I want dashboards"). A job is a situation + motivation + outcome ("When the board asks me a question I can't answer, I want to come back next week with 3 options, so I can keep my credibility as a strategic advisor").

### Q7. "Tell me about a time you wished you could do X but couldn't."

- **What you're listening for:** the **specific moment** they tell you about. The time-stamp is gold. "Last Tuesday at 4pm" is 100× more useful than "often." The bigger the time gap between the moment and the interview, the more abstract the answer — push for the recent ones.
- **Follow-up:** "What did you do instead? What was the cost — to you, to the team, to the decision?"
- **What to write down:** the date, the trigger, the workaround, the cost. The cost is the price anchor for our pricing.

### Q8. "If you had a magic wand for FP&A, what's the ONE thing you'd change?"

- **What you're listening for:** the **first thing** they say. Most people will give a polished answer first ("I'd love better scenario planning"), then a **truer** second answer ("Honestly, I just want to stop being the bottleneck"). Note both. The polished answer is what they say to their boss. The truer answer is what they say to themselves.
- **Follow-up:** "If I could only ship ONE feature in the next 90 days, which one would matter most?"
- **What to write down:** the polished answer AND the truer answer. **Always read both back to them at the end of the interview** — it's a powerful trust-building moment.

### Q9. "Show me the last scenario you built. How long did it take? What was hard?"

- **What you're listening for:** the **gap between the question and the answer**. A 3-day build for a "what-if" question is a 1-day-too-long cycle. The hard part is rarely the math; it's the **assumption-setting** ("what growth rate do I use?") and the **presentation** ("how do I show this to the CEO?"). These are the hidden jobs.
- **Follow-up:** "What assumptions did you change? How did you know which ones to change?"
- **What to write down:** build time, the 3 hardest steps, the assumptions they had to defend.

---

## Section 4 — Decision Process (5 minutes)

The goal: understand the **buying motion** for this person. The 3 personas buy differently. If we don't know how Chris actually buys (3-7 day self-serve), we'll send him a 6-month enterprise sales motion and lose.

### Q10. "If you were to evaluate a new FP&A tool tomorrow, who'd be in the room?"

- **What you're listening for:** the **influence map** vs. the **decision-maker map**. The person in the room is not always the person with the credit card. The person whose opinion matters most is not always the loudest. Probe for the **veto holders** — the people who can kill the deal even if they're not the buyer.
- **Follow-up:** "Of those people, who would champion the tool internally? Who would oppose it?"
- **What to write down:** names, roles, and the **-3 to +3** influence score per person (champion to blocker).

### Q11. "What would make you say 'this is worth a demo' vs 'pass'?"

- **What you're listening for:** the **qualifier vs. disqualifier**. Qualifier = "must have X" (everyone has it, no one differentiates on it). Disqualifier = "if it doesn't have Y, I won't even take the call" (rare, gold, we must have it).
- **Follow-up:** "Has there been a tool you passed on recently? Why?"
- **What to write down:** the disqualifiers. We will use them as the **must-have checklist** for the product team.

### Q12. "What's your budget cycle? When could you sign a contract?"

- **What you're listening for:** the **real** budget, not the official one. Most people don't have a line item. Most CFOs can find $30K for a tool that solves a board-level problem; the budget is political, not financial.
- **Follow-up:** "Is there a hard deadline, like a fiscal year-end or a board meeting, that would force a decision?"
- **What to write down:** the **decision deadline**. This is when our sales team needs to be in the room. Missing the deadline means waiting a quarter.

---

## Section 5 — Pricing Sensitivity (5 minutes)

The goal: anchor our **pricing strategy** with **their numbers**, not ours. People lie about willingness to pay; they don't lie about the alternatives they currently pay for. Start with what they pay, not what we charge.

### Q13. (For each tier) "If I told you FinPlan Pro had [feature X] and cost $Y/user/mo, would you evaluate it?"

- **The 3 tiers to test (one at a time, ~90 sec each):**
  1. **Solo / Starter:** $99/user/mo — "1 seat, Excel import, scenario planning, board-ready exports"
  2. **Team:** $299/user/mo — "Up to 5 seats, multi-dimensional modeling, 2 ERP integrations, audit trail"
  3. **Enterprise:** $999/user/mo — "Unlimited seats, all 178+ engines, SOC 2, SSO, dedicated CSM"
- **What you're listening for:** the **gut reaction**. Look for the body language: the head-nod, the "hm," the eye-roll. The instant reaction is the **real** reaction. The considered answer (after they "think about it") is the **polite** answer. **Always trust the gut.**
- **Follow-up:** "What would you compare that to — what does your current tool cost per user?"
- **What to write down:** the **yes/maybe/no** per tier, AND the comparison tool they named. The comparison tool tells us who they think we are.

### Q14. "Free vs paid — what changes your decision?"

- **What you're listening for:** the **trust gap** that "free" creates. Some buyers trust free ("I'll try anything free"). Some distrust free ("if it's free, I'm the product"). Some have a procurement rule ("we can't use free tools for compliance reasons"). We need to know which persona is which.
- **Follow-up:** "Is there a free tier below which you wouldn't take us seriously? A free tier above which you'd start to worry?"
- **What to write down:** the **trust threshold** for "free." This drives our free-tier design.

### Q15. (Last question) "Who else should I talk to?"

- **What you're listening for:** the **referral network**. Most finance people know 5-10 peers at similar companies. The first name they give is their **closest** peer. The 3rd-5th names are the **broader network**. Always ask for the email or LinkedIn; warm intros convert 5-10× cold outreach.
- **Follow-up:** "Of those people, who is most like you? Who is least like you? Why?"
- **What to write down:** the names AND the "most/least like you" reason. The least-like-you is the next persona to interview.

---

## The closing (2 minutes, scripted)

> "This has been incredibly useful. Two things I want to do:
>
> 1. **Read back to you what I heard**, so you can correct me if I got it wrong. [Read back: their #1 pain, their #1 JTBD, the magic wand polished answer + truer answer.]
>
> 2. **Ask if there's anything I didn't ask that I should have.** The most valuable insights in these interviews come from questions I forgot to ask.
>
> Last thing: I noticed you mentioned [X] a few times. I'm going to send you a follow-up email with one specific question about that, and I'll happily buy you a coffee for the answer. Cool?
>
> Thank you so much. The $100 Amazon card is in your inbox already."

---

## Post-interview checklist (within 24 hours)

- [ ] Stop the recording. Upload to the secure drive.
- [ ] Run the auto-transcription. **Manually correct names and numbers** — auto-transcription gets these wrong.
- [ ] Write the 1-page summary in `docs/research/interviews/2026-Q3/summary-<id>.md` using the **3-witness template** (quote / behavior / alternative).
- [ ] Append 1 new pattern OR contradiction to `docs/research/patterns.md`. If the interview confirmed an existing pattern, mark it. If it contradicted, flag it loudly — **contradictions are gold, they tell us we're wrong about something.**
- [ ] Update the tracker: `docs/research/interviews/TRACKER.md`.
- [ ] Send the thank-you email + Amazon card. Include the follow-up question if you promised one.
- [ ] If they gave a referral, send the warm intro within 48 hours (slack: "Hey, our researcher Iris is great — take the call, it's worth your time").

---

## Anti-patterns (don't do these)

- ❌ **Don't ask leading questions.** "Would you use a tool that does scenario planning?" is leading. "Tell me about the last scenario you built" is not.
- ❌ **Don't validate your roadmap.** "We're building X — would you use it?" is a sales motion, not a research motion. The recruit will say yes to be polite.
- ❌ **Don't fill silence.** A 4-second pause after a question often elicits the truest answer. Count to 7 in your head before you rephrase.
- ❌ **Don't take notes during their answer.** Note-taker should be a second person. Note-taker NEVER talks.
- ❌ **Don't demo.** If the recruit asks "so what does your tool do?" defer: "I'd love to demo, but I want to keep this hour focused on you. I'll send a separate demo link after."
- ❌ **Don't share the recording externally.** Not even with the marketing team. PII discipline is a 1-strike-and-out rule.
- ❌ **Don't trust stated preference over behavior.** "I'd pay $50K" means nothing if they're not actually paying. **Watch what they do, not what they say.**

---

## Cross-references

- **`docs/drafts/iris/PERSONAS.md`** — the 3 personas this script was designed for. Read the persona before the call.
- **`docs/research/patterns.md`** — running list of cross-interview patterns. Read the latest before each call.
- **`docs/research/interviews/TRACKER.md`** — recruitment status, completed interviews, outstanding follow-ups.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — the journey map that operationalizes Carla's path. The "Magic Wand" question (Q8) is the seed for the "Aha Moment" stage of the journey.

---

_If we don't know what they actually do at 9am, we don't know what to build. The script is a guide, not a cage. When the recruit says something that doesn't fit the script, follow the recruit. — Iris_
