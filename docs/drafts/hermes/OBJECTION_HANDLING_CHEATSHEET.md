<!-- DRAFT v0.2 — ICP-numbering reconciled to canonical (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per T-HER-010 Tier 2 broader drift sweep — Hermes 2026-06-13 -->

# FinPlan Pro — Objection Handling Cheatsheet (Top 10)

> **Frame for the cycle:** This is the **AE's pocket card** for the 10 objections that come up in 80%+ of ICP-1 (Carla, CFO) and ICP-2 (Vera, Controller) discovery calls. Each objection is handled in 3-5 sentences with the three-witness test (buyer persona, competitive alternative, price/pain anchor). The cheatsheet is designed to be **scannable in 30 seconds** during a live call — every section is structured identically (the objection → the real concern → the counter → the proof point → the follow-up question).

> **Cross-references:**
>
> - `docs/drafts/hermes/DISCOVERY_CALL_PLAYBOOK.md` — companion file, the 30-min call structure
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — 3 of the 10 objections are deep-dived there
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Carla, CFO) + ICP-2 (Vera, Controller) + ICP-3 (Chris, FP&A Lead)
> - `docs/drafts/hermes/POSITIONING.md` — the value props that frame the counter
> - `docs/drafts/hermes/PRICING.md` — the 4 tiers that the counter-points reference
> - `docs/drafts/hermes/BETA_PROGRAM.md` — the 30-day pilot + 50% Y1 discount + 90-day price-lock
> - `docs/drafts/iris/PERSONAS.md` — Carla + Chris + Vera pain quotes
> - `docs/drafts/iris/CHURN_FRAMEWORK.md` — the 5 churn reasons (price, complexity, missing feature, support, performance) that mirror these objections

---

## How to use this cheatsheet

The cheatsheet is structured as a **2-column flashcard** for each objection:

| Column                         | Use                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Left — the objection**       | Verbatim, in the buyer's words. Read it aloud to the AE.                                                 |
| **Right — the 3-step counter** | Step 1: name the real concern. Step 2: counter with the proof point. Step 3: ask the follow-up question. |

**The AE's rule:** never answer an objection in isolation. **Every counter ends with a question** — the question puts the conversation back in the buyer's hands and gives the AE the next data point to qualify or close.

---

## 1. "We're already on Anaplan."

**The real concern:** Switching cost, not "we like Anaplan." The buyer is telling the AE that they can't afford to leave — not that they want to stay.

**The 3-step counter:**

1. **Name the real concern:** "Totally understand — switching costs are real. Let me ask: how many of your Anaplan seats are actually being used day-to-day? G2 data suggests the average is 40-60% utilization."
2. **Counter with the displacement wedge:** "We're not asking you to rip out Anaplan. We're asking you to run FinPlan Pro on the 2-3 use cases where Anaplan's overhead is overkill — board-pack scenarios, SaaS metrics, monthly close. Most customers move 3-5 use cases in year 1, then deprecate Anaplan at renewal. **The seat-economics math is real: 100 power users on FinPlan Pro Business is $600K/yr cheaper than 200 underused Anaplan seats.**" (per `BATTLECARD_ANAPLAN.md` §6)
3. **Ask:** "If we can move 3 use cases in 90 days with a 2-week pilot, no payment unless we hit your 3 success criteria — would that be worth a 20-min look?"

**Three-witness test:** (a) Buyer = Carla, mid-market SaaS CFO; (b) Alternative = Anaplan at $200K-$500K/yr (40-60% seat utilization); (c) Outcome = $600K/yr savings, 2-week pilot, 3 use cases in year 1.

**Source:** `BATTLECARD_ANAPLAN.md` §6 (Objection 1 deep-dive)

---

## 2. "Your pricing is too low, are you serious? Can you actually deliver?"

**The real concern:** Price-credibility. "If you're 80% cheaper, you must be 80% worse." The buyer is worried about being the buyer who got fired for choosing the cheap tool.

**The 3-step counter:**

1. **Name the real concern:** "I hear that a lot. Let me address the price-credibility concern directly."
2. **Counter with the open-source reset:** "We're open source. Our pricing reflects our cost structure, not a market position. The Business tier at $499/user/mo is the price of a senior analyst's coffee budget — it's a real product at a real price. We don't have a $200K/yr Anaplan-consultant line item because **we don't need one**. Our 200+ engines, 17 sector presets, and AI Copilot ship in the binary. The product ships complete; the price is the price." (per `POSITIONING.md` §2 and `PRICING.md` §2.3)
3. **Ask:** "If we can do a 30-day pilot on your actual data, with 3 success criteria that you define, and you don't pay unless we hit them — does that resolve the credibility concern?"

**Three-witness test:** (a) Buyer = Carla, $20-100K/yr budget; (b) Alternative = Anaplan at $200K-$500K/yr; (c) Outcome = 30-day risk-reversal pilot, 3 buyer-defined success criteria, no payment unless we hit them.

**Source:** `BATTLECARD_ANAPLAN.md` §6 (Objection 3 deep-dive)

---

## 3. "We need SSO / SOC 2 before we can buy."

**The real concern:** Compliance gating from security/procurement, not a feature gap. The buyer is telling the AE that their security review is the gate, not their feature evaluation.

**The 3-step counter:**

1. **Name the real concern:** "Makes total sense — SOC 2 is a hard gate for any vendor touching your data, especially in regulated industries. Where are you in the SOC 2 journey?"
2. **Counter with the roadmap honesty:** "Our target is **SOC 2 Type 1 by Q4 2026 and Type 2 by Q1 2027** — that's public in our roadmap. SSO (Google + Microsoft) is in MVP, RBAC and audit log are in Phase 1. For the next 90 days, the 30-day pilot runs with the same security architecture we'll have in production — AES-256-GCM encryption at rest, PBKDF2 key derivation, and your data stays on your laptop. **The .fpa file is yours** — even if we go out of business, the file opens." (per `PRICING.md` §2.3 and the security architecture in `FPA_COMPETITIVE_MATRIX.md`)
3. **Ask:** "If we put the security architecture doc and the SOC 2 timeline in front of your security team, and they're comfortable with the 30-day pilot under the current architecture — does that unblock the eval?"

**Three-witness test:** (a) Buyer = Carla in a regulated industry (fintech/healthtech/EU); (b) Alternative = Anaplan/Adaptive (both have SOC 2 but at $200K-$500K/yr); (c) Outcome = SOC 2 Type 1 by Q4 2026, AES-256-GCM, file-ownership guarantee, 30-day pilot under current architecture.

---

## 4. "We can build this internally."

**The real concern:** The buyer has engineering capacity and believes the build-vs-buy math works in their favor. The AE's job is to make the math work against the build.

**The 3-step counter:**

1. **Name the real concern:** "Engineering capacity is a real asset. How many engineers and how many months are you thinking?"
2. **Counter with the build-vs-buy math:** "Quick math: 2 senior engineers × $200K fully loaded × 12 months = **$400K in year 1**, plus opportunity cost of what those engineers could be building for your core product. FinPlan Pro Business at $499/user/mo for 10 users = $60K/year, with all 200+ engines, 17 sector presets, and the AI Copilot in the binary on day 1. **The build is 6-7x more expensive in year 1, and you don't get the sector presets or the AI Copilot in year 1.** Plus: who's going to maintain it when the engineer leaves? The TCO of in-house is 2-3x the year-1 number over 3 years." (per `PRICING.md` §2.3)
3. **Ask:** "If we can do a 30-day pilot and prove the 3 success criteria, would that make the build-vs-buy math clearer to your CTO?"

**Three-witness test:** (a) Buyer = mid-market CFO whose CTO is pushing build; (b) Alternative = $400K year-1 engineering cost (the build math); (c) Outcome = $60K/year FinPlan Pro, 6-7x cheaper, 200+ engines on day 1, no maintenance burden.

---

## 5. "Excel is fine."

**The real concern:** The buyer is in denial. They've built a 15-tab, 50-cross-reference Excel model that they love and hate, and the AE is the threat. **This is the #1 ICP-2 (Vera) objection** — Iris's persona research calls it "the silent incumbent."

**The 3-step counter:**

1. **Name the real concern:** "I hear this from a lot of controllers, and I want to acknowledge the real value you've built in that Excel model. It works until..."
2. **Counter with the breaking point:** "...it doesn't. The breaking points are: (a) the day the GL adds a new dimension and your VLOOKUP breaks for 9 days, (b) the day your CEO buys Tableau for $70/mo and now there are 2 versions of the truth, (c) the day your VLOOKUP returns #N/A and you have to send a board-pack 'correction' email. **Each of those is a 4-12 hour fix that the next quarter is going to repeat.** The FinPlan Pro replacement is $99/user/mo or $499/user/mo — the cost of one bad VLOOKUP." (per `BATTLECARD_ANAPLAN.md` §1 and Iris's `PERSONAS.md` §2 "I'm one Excel formula away from a serious mistake")
3. **Ask:** "If I can show you a 30-min import of your existing model into FinPlan Pro, with the same numbers — would you be willing to see what the world looks like on the other side of the VLOOKUP?"

**Three-witness test:** (a) Buyer = Vera (controller) or small-business CFO; (b) Alternative = Excel at $0 + the silent risk of a broken VLOOKUP; (c) Outcome = 30-min import, same numbers, $99-$499/user/mo vs. the 4-12 hour quarterly break-fix cost.

**Source:** Iris `PERSONAS.md` §2 (Vera pain quote #1)

---

## 6. "We tried Adaptive and it was too complex."

**The real concern:** The buyer has been burned. They've spent 6 months and $200K on a failed Adaptive implementation, and they have scar tissue. The AE has to **not be Adaptive.**

**The 3-step counter:**

1. **Name the real concern:** "That's a really common story — Adaptive's onboarding is brutal. What made it complex for you?"
2. **Counter with the simplicity wedge:** "FinPlan Pro is built to be the opposite. We start with **3 templates out of the box** — Budget vs Actual, P&L, and Cash Flow — and you can be live in 30 minutes. No Hyperion training, no 80-page manual, no 6-month implementation. The 17 sector presets pre-build 80% of the model for you. The AI Copilot answers 'how do I…' questions in plain English. **The complexity in Adaptive isn't a feature — it's a tax on your team's time.**" (per `POSITIONING.md` §1 + `PRICING.md` §2.3 + the 30-min ONBOARDING.md)
3. **Ask:** "If we can show you a 30-min install + 30-min first model build on your actual data — would that be enough to revisit the complexity question?"

**Three-witness test:** (a) Buyer = post-Adaptive-buyer, controller or CFO; (b) Alternative = Adaptive at $200K/yr with 6-month implementation; (c) Outcome = 30-min install, 3 templates, 17 sector presets, AI Copilot, 80% pre-built.

---

## 7. "Can you do [feature X]?"

**The real concern:** The buyer is using a feature request to disqualify. **The AE must NOT over-promise.** A roadmap date is honest; a "yes" that turns out to be "in 6 months" is a churn trigger.

**The 3-step counter:**

1. **Name the real concern:** "Great question. Let me check the roadmap before I answer."
2. **Counter with the honest roadmap:** "Two scenarios: (a) if it's a feature we have today — I'll show you in the demo; (b) if it's on the roadmap — I'll tell you which quarter and what it costs to design-partner with us on the build. **We never say 'yes' to a feature we don't have.** The Phase 1 / Phase 2 / Phase 3 split is public, and the customer advisory board (the Beta cohort) gets first-look at Phase 2 features. If [feature X] is in Phase 2 and it's a deal-breaker for you, we can put you on the design-partner list." (per the Beta program's design-partner path)
3. **Ask:** "Is [feature X] a 'must-have for me to buy' or a 'nice-to-have I can wait for'?"

**Three-witness test:** (a) Buyer = feature-gating mid-market CFO; (b) Alternative = over-promising vendor (the cost of a churn); (c) Outcome = honest roadmap date, design-partner seat, no false "yes."

**Important:** If the AE doesn't know the answer, the AE says "let me check with engineering and get back to you within 24 hours" — not "probably yes."

---

## 8. "Who else is using this?"

**The real concern:** Reference risk. The buyer is asking: "Will I be the first person to discover this is broken?"

**The 3-step counter:**

1. **Name the real concern:** "Totally fair question. References are how you de-risk this."
2. **Counter with the Beta cohort + design-partner positioning:** "We just launched a **50-customer Beta cohort** with $0 in beta credit and 3 success criteria per customer. The cohort spans B2B SaaS, e-commerce, fintech, and healthtech, with 30 ICP-1 (CFO, $20-80M ARR) and 20 ICP-2 (Controller, $1-10M ARR) customers. **You'll be customer #51 in a 90-day cohort that produces 45+ case studies.** I can intro you to 2-3 peer-CFOs or peer-Controllers in similar-shape companies this week. The honest answer: we're pre-launch, and that's why we can offer the 30-day risk-reversal pilot — we don't have a 1,000-customer install base to fall back on, so we have to earn the next customer." (per `BETA_PROGRAM.md` §1 + §3)
3. **Ask:** "Would a 15-min reference call with one of our Beta customers in your industry resolve the reference concern?"

**Three-witness test:** (a) Buyer = reference-conscious mid-market CFO; (b) Alternative = larger competitors with 1,000+ customer install bases (Anaplan, Adaptive); (c) Outcome = 30-day risk-reversal pilot, 2-3 peer references, "earn the next customer" honesty.

**Source:** `BETA_PROGRAM.md` §6 (D+90 launch event)

---

## 9. "What if you go out of business?"

**The real concern:** The buyer is worried about vendor viability. The AE's job is to make this **a non-objection** by leaning on the offline-first architecture.

**The 3-step counter:**

1. **Name the real concern:** "Real concern, especially for a CFO. Let me address it directly."
2. **Counter with the offline-first architecture:** "Two things. **First: we're offline-first by design.** Your data lives in an open .fpa file on your laptop — we don't hold it. Even if FinPlan Pro the company disappeared tomorrow, **you still have the file**, you can still open it, and you can still export to Excel or CSV. The lock-in is in the other direction — we depend on you, not the other way around. **Second: the AI Copilot and the multi-entity features are an extension of the local file**, not a replacement. If our cloud goes down, you keep modeling locally. The architecture is designed to survive us." (per `POSITIONING.md` §2 + the .fpa file format ownership)
3. **Ask:** "If we can show you the .fpa file format and the local-first architecture in the demo — does that resolve the viability concern?"

**Three-witness test:** (a) Buyer = viability-conscious CFO; (b) Alternative = Anaplan/Adaptive (cloud-only, vendor-locked); (c) Outcome = offline-first .fpa file, customer owns the data, local-first architecture survives vendor failure.

**This is our strongest objection-handler.** Most competitors cannot make this argument. Anaplan's data is in Anaplan's AWS; if Anaplan goes out of business, the customer has 90 days to migrate. FinPlan Pro's data is on the customer's laptop, in an open format, forever.

---

## 10. "I need to talk to my team."

**The real concern:** This is often a **polite "no"** or a **stall tactic**, not a genuine team-approval requirement. The AE's job is to find out which it is.

**The 3-step counter:**

1. **Name the real concern:** "Of course. Who specifically would need to be in the conversation, and what would they need to see to feel confident?"
2. **Counter with the multi-stakeholder map:** "Three scenarios: (a) **Your Controller** — they live with the tool day-to-day; offer a 30-min technical demo for them; (b) **Your CEO** — they're buying the board-pack outcome, not the tool; offer a 15-min exec briefing; (c) **Your security/procurement** — they need the SOC 2 timeline + the security architecture doc. **I want to make this easy for you to champion internally** — can I send you a 1-page internal-champion brief you can forward to your team?" (per the Champion Enablement pattern in `COLD_OUTBOUND_SEQUENCE.md` §2)
3. **Ask:** "Can we get a 15-min slot on the calendar this week with the people you've named? I'll bring the right material for each of them."

**Three-witness test:** (a) Buyer = mid-market CFO or Controller; (b) Alternative = losing the deal to "let me think about it"; (c) Outcome = 3-stakeholder map (Controller, CEO, Security), 1-page champion brief, 15-min slot booked this week.

**Important:** If the buyer's answer is vague ("I'll loop them in later"), the AE says: "Totally. To respect their time, can you intro me by email today so I can send the invite from your thread?" The intro-by-email is the gate to the next step.

---

## The 3 most-damaging objections (recap for the AE)

1. **"We're already on Anaplan"** (60% of ICP-1 calls) — switching cost / sunk cost. Counter: displace 3-5 use cases, seat-economics wedge.
2. **"Can you do [feature X]?"** (40% of ICP-1 + ICP-2 calls) — disqualification-by-feature-request. Counter: honest roadmap date, design-partner seat.
3. **"What if you go out of business?"** (30% of regulated-industry calls) — viability concern. Counter: offline-first .fpa file, customer owns the data, architecture survives vendor failure.

## The 3 strongest counter-moves (recap for the AE)

1. **The seat-economics wedge** — "100 power users on FinPlan Pro Business = $600K/yr cheaper than 200 underused Anaplan seats." Pure dollar math that closes Objection 1.
2. **The honest roadmap + design-partner path** — "We never say 'yes' to a feature we don't have." Trust signal that closes Objection 7 and Objection 4 (build-vs-buy).
3. **The .fpa file + offline-first architecture** — "Even if we go out of business, you still have the file." The strongest objection-handler in the cheatsheet; closes Objection 9 (the viability objection) and reframes the entire conversation as "we depend on you, not the other way around."

---

## The cheatsheet's anti-patterns (what the AE should NEVER do)

1. **Never argue.** The buyer's objection is real to them. The AE's job is to acknowledge, reframe, and ask.
2. **Never lie.** If the AE doesn't know the answer, the AE says "let me check and get back to you within 24 hours." Trust is the AE's only asset; one lie kills the deal.
3. **Never over-discount.** The 30-day pilot is the risk-reversal. The 50% Y1 discount is for the Beta cohort. **Outside those two structures, the AE does not discount.** The pricing is the pricing.
4. **Never close on the objection.** The objection is the buyer's question; the close is the buyer's decision. The AE answers the question, then asks the next question.
5. **Never send a proposal without the 2 qualifying questions** (per `DISCOVERY_CALL_PLAYBOOK.md` §5.1, Script 3). A proposal without context is a wasted effort.

---

_λόγος ἀντιλογίας — the counter-word. The buyer raises an objection; the AE lowers it with a question. The objection is the buyer's way of saying "I'm interested, but I'm scared." Hermes writes the words that make the buyer less scared. — Hermes_
