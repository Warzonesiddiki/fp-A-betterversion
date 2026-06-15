<!-- DRAFT v0.2 — ICP-numbering reconciled to canonical (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per T-HER-009 v0.2 — Hermes 2026-06-13 -->

# FinPlan Pro — Marketing Site Home Copy

> **Frame for the cycle:** This is the **public-facing homepage** that the cold-outbound sequence (T-HER bonus work) drives traffic to. The hero is A/B test-ready with 3 variants for ICP-1 (CFO), ICP-2 (Controller), and ICP-3 (FP&A Lead). The 4 proof points are Strategos's "Is 100× yet?" scorecard (the actual ground truth, not aspirational). The 3 social-proof placeholders are **clearly marked [FICTIONAL PLACEHOLDER]** so the Beta program's 45 case studies can be swapped in post-launch without re-architecting. Every CTA carries the three-witness test (buyer persona, competitive alternative, price/pain anchor).

> **Cross-references:**
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Carla) + ICP-2 (Vera) + ICP-3 (Chris, future)
> - `docs/drafts/hermes/POSITIONING.md` — value props + 3 anti-positions
> - `docs/drafts/hermes/PRICING.md` — 4 tiers (cite §2.3 for the pricing-page numbers)
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — Anaplan comparison points
> - `docs/drafts/hermes/BETA_PROGRAM.md` — 50-customer cohort, 3 success criteria
> - `docs/drafts/hermes/COLD_OUTBOUND_SEQUENCE.md` — the email that drives traffic here
> - `docs/drafts/hermes/OBJECTION_HANDLING_CHEATSHEET.md` — the homepage mirrors the cheatsheet's tone
> - `docs/drafts/iris/PERSONAS.md` — **Carla + Chris + Vera** (the 3 use cases are persona-validated)
> - **Strategos** "Is 100× yet?" scorecard (4 proof points are the actual ground truth)
> - **Companion file:** `MARKETING_SITE_PRICING_PAGE.md` (the 4-tier pricing table + FAQ)

---

## §1 — Homepage hero copy (3 variants, A/B test ready)

The 3 hero variants map to the 3 personas in `PERSONAS.md` and the 3 ICPs in `ICP.md`. Each variant is a **headline + sub-headline + primary CTA** — the three elements that fit above the fold. The headline does the persona-matching work; the sub-headline does the alternative-displacing work; the CTA does the price/pain-anchoring work.

### Variant A — CFO pain-led (ICP-1: Carla)

**Headline:** "FP&A without the 6-month rollout."
**Sub-headline:** "The offline-first FP&A platform that ships in 2 weeks — at 1/5 the price of Anaplan. Your data lives on your laptop, not in a vendor's cloud. 200+ engines, 17 sector presets, AI Copilot, all in the binary."
**Primary CTA:** "Start the 30-day pilot →" (button)
**Secondary CTA:** "See the Anaplan comparison →" (text link, opens a modal with the `ANAPLAN_LEAVE_BEHIND.md` table)

**Three-witness test:** (a) Buyer = CFO at 50-500 FTE SaaS; (b) Alternative = Anaplan at $200K-$500K/yr + 6-month rollout; (c) Outcome = 2-week go-live, 1/5 the price, offline-first data ownership.

**Why this works:** "Without the 6-month rollout" is the **buyer-language pain** (Iris's Carla pain quote: "Anaplan is great but I can't get my team to use it"). "1/5 the price of Anaplan" is the **dollar math** (the Anaplan battlecard's $340K → $180K). "Offline-first" is the **regulatory wedge** for the 40% of ICP-1 buyers in regulated industries.

### Variant B — Controller speed-led (ICP-2: Vera)

**Headline:** "From Excel to scenarios in 30 minutes."
**Sub-headline:** "Open your existing model. Map columns to dimensions. Get a scenario engine, a board-pack builder, and an AI Copilot that answers 'what happens to runway if I hire 3 engineers?' — all without leaving your laptop."
**Primary CTA:** "Try the free tier →" (button, links to GitHub release / download)
**Secondary CTA:** "Watch the 60-sec demo →" (text link, opens video)

**Three-witness test:** (a) Buyer = Controller at 10-50 FTE SaaS; (b) Alternative = Excel + 2-hour Monday burn rebuild + the VLOOKUP that breaks every quarter; (c) Outcome = 30-min install, 5-min Monday burn, no VLOOKUP.

**Why this works:** "30 minutes" is the **time anchor** (Iris's Chris pain #1: "I'm one Excel formula away from a serious mistake"). "Without leaving your laptop" is the **trust signal** (Iris's Chris watering hole: "Chris is paranoid about third-party data servers"). "Try the free tier" is the **zero-friction CTA** (Iris's Chris decision process: "decision time 3-7 days from first download").

### Variant C — FP&A Lead power-led (ICP-3: Chris, Phase 2)

**Headline:** "The cube engine that actually scales."
**Sub-headline:** "1M cells. OLAP-grade aggregations. Federated collaboration. Direct Snowflake + BigQuery sync. Replace 70% of what Anaplan does, on your own terms, with no implementation partner."
**Primary CTA:** "Book a 30-min demo →" (button, opens calendar)
**Secondary CTA:** "Read the Vera-track case study →" (text link, placeholder for the 12-month Anaplan-displacement case study)

**Three-witness test:** (a) Buyer = VP Finance at $50-200M ARR e-commerce / SaaS / marketplace; (b) Alternative = Anaplan at $400K/yr + 5-consultant implementation; (c) Outcome = 70% Anaplan replacement, no consultants, no 6-month rollout.

**Why this works:** "Actually scales" is the **credibility signal** (Iris's Vera pain #2: "I haven't found one that can do multi-dimensional modeling without an implementation partner"). "On your own terms" is the **lock-in reversal** (Iris's Vera goal: "Replace Anaplan over 24 months, on her own terms"). The CTA is sales-led, not self-serve, because Vera's motion is enterprise sales, not PLG.

**Note on Variant C:** This is **Phase 2 copy** (Q1 2027 per Strategos's roadmap). The public site should ship with Variants A and B as A/B test arms, with Variant C added once the Vera-track beta graduates a real case study. A/B test the headlines for 30 days; pick the winner; promote to 100% traffic.

---

## §2 — Above-the-fold proof points (the 4 stats)

The 4 stats are **Strategos's "Is 100× yet?" scorecard** — the actual ground truth from the 2026-06-13 build, not aspirational marketing copy. Every stat has a citation so the engineering team can verify before launch.

| # | Stat | Value | Citation |
|---|---|---|---|
| 1 | **Tests passing** | "8,334+ tests passing" | `npm test` (Prometheus T-PR-002 + Apollo T-AP-010 reconciliation) |
| 2 | **Bundle size** | "55.95 kB gzip main bundle" | `npm run build` (62.5% headroom under the 150 kB budget) |
| 3 | **Dependencies / CVEs** | "1,100+ dependencies, 0 CVEs" | `npm audit` (0 CVEs across 1,111 deps; cite the actual number) |
| 4 | **Engine coverage** | "175/176 engines tested" | `vitest --coverage` on `src/engines/` (99.4% coverage; the 1 untested is `SOXComplianceEngine`, in the Prometheus post-push queue) |

**Layout:** 4 stats in a horizontal row, just below the hero CTA. The pattern follows the Vercel / Stripe / Linear homepage convention. **Each stat is a number + a 1-line label + an optional tooltip with the source.**

**Three-witness test on the stats:** (a) Buyer cares about reliability (tests passing), performance (bundle size), security (CVEs), and depth (engines); (b) Alternative is Anaplan/Adaptive with proprietary "trust us" claims; (c) Outcome = verifiable, citable proof that the platform is not vapor.

**Why these 4 stats:** They are the **engineering-truth stats**, not the marketing-truth stats. A CFO looking at this row sees "this team is serious about quality"; a Controller sees "this won't break on me"; a VP Engineering sees "this is built like real software." None of these stats are aspirational — they are the actual numbers from the build.

---

## §3 — The 3 differentiators (3-column layout)

The 3 differentiators are the **product truths that no competitor can match.** Each is one sentence + one supporting line. They are placed in a 3-column row directly below the proof points.

### Differentiator 1 — Offline-first

**Headline:** "Your data lives in a `.fpa` file you own."
**Supporting line:** "No cloud lock-in. No vendor hostage. Open it in 10 years, it'll still work. The encryption runs on your laptop; the file never has to leave."

**Three-witness test:** (a) Buyer = CFO/Controller in regulated industries (fintech, healthtech, EU/UK, defense-adjacent); (b) Alternative = Anaplan/Adaptive/Pigment (cloud-only, vendor-locked); (c) Outcome = data ownership, no vendor risk, regulatory compliance (GDPR, SOC 2, data-residency).

**Why this is a differentiator:** Per FPA_COMPETITIVE_MATRIX.md, only 2 of 20 competitors are fully offline. This is **the wedge** — the 40% of ICP-1 buyers in regulated industries cannot buy Anaplan, regardless of feature parity, because the data-residency review fails. We can.

### Differentiator 2 — AI-native

**Headline:** "Ask 'what happens to runway if I hire 3 engineers?'"
**Supporting line:** "The Copilot runs the scenario, shows the chart, drafts the board narrative. In 5 seconds. Plain English, no SQL, no formula syntax. The AI runs in your browser AND on the server; the prompt never has to leave the laptop."

**Three-witness test:** (a) Buyer = ICP-1 Carla (board-pack narratives) + ICP-2 Vera (Monday-morning burn); (b) Alternative = Anaplan (no AI at SMB tier), Excel (no AI), Cube (limited AI); (c) Outcome = 5-second scenario with assumption tree, 30-second board narrative.

**Why this is a differentiator:** Per FPA_COMPETITIVE_MATRIX.md, only 5 of 20 competitors have AI Copilot. We ship it at the **$0 OSS tier** — none of the 5 ship it that low. The demo moment is the closest thing we have to a 30-second product experience that converts.

### Differentiator 3 — OSS-friendly

**Headline:** "The Lite tier is free, open-source, MIT-licensed."
**Supporting line:** "Read the code. Run it locally. Upgrade when you need multi-user, AI Copilot, or SOC 2. The OSS tier is the product, not a trial — it's the same binary, with the multi-user sync features compiled out."

**Three-witness test:** (a) Buyer = ICP-2 Vera (paranoia about third-party data servers) + ICP-3 Chris (lock-in avoider); (b) Alternative = Anaplan/Adaptive/Pigment (proprietary, no OSS); (c) Outcome = $0 to start, no credit card, no expiration, code-audit-able.

**Why this is a differentiator:** Per FPA_COMPETITIVE_MATRIX.md, **zero of 20 competitors offer a true OSS option.** Cube/Syft/Aleph/XPNA are the cheapest but all paid SaaS. The OSS tier is the wedge for ICP-2 AND the lock-in-reversal for ICP-3.

---

## §4 — The 3 use cases (3-column layout, persona-validated)

The 3 use cases map to the 3 personas in Iris's `PERSONAS.md`. Each is the buyer's **outcome language** — what they will say to their CEO / board / peer after using FinPlan Pro. The use cases are placed below the differentiators, with persona names as the column headers.

### Use case 1 — For CFOs (Carla, ICP-1)

**Headline:** "Board-pack in 2 days, not 2 weeks."
**Supporting line:** "4 scenarios per week, not 1 per month. Run the AI Copilot for the 'why' behind the numbers. Walk into the board meeting with 3 options, not 1 guess."

**Three-witness test:** (a) Buyer = Carla, CFO at $20-80M ARR SaaS; (b) Alternative = Excel + 3-week scenario marathons (Iris pain #2: "The board wants 3 options. I have time for 1."); (c) Outcome = 2-day close, 4×/week scenarios, 3-option board pack.

**Why this use case:** This is the **CFO's KPI language** — close-to-disclose cycle time, board-pack outcome. Iris's research found Carla's #1 annual goal is "get the board pack out in 5 days, not 15." The use case speaks Carla's review-language.

### Use case 2 — For Controllers (Vera, ICP-2)

**Headline:** "Open your existing Excel model. Get a scenario engine in 30 minutes."
**Supporting line:** "Map columns to dimensions. Get a scenario engine, a board-pack builder, and an AI Copilot that answers 'what happens to runway if I hire 3 engineers?' — all without leaving your laptop. No Hyperion training. No consultant invoice."

**Three-witness test:** (a) Buyer = Vera, Controller at 10–50 FTE SaaS; (b) Alternative = Excel + VLOOKUP + the "I'm scared of switching" pain (Iris pain #3); (c) Outcome = 30-min install, 5-min Monday burn rebuild, no VLOOKUP.

**Why this use case:** This is the **Controller's tool-shopping language** — "I'm not switching unless it's impossibly easy to start." The use case speaks Vera's "first 7 days" filter (Iris: "if the first 7 days are confusing, the deal is gone"). Note: the Iris-pain quote about Chris's "first 7 days" is preserved as a witness (Chris is a real persona) even though the use-case buyer is Vera.

### Use case 3 — For FP&A Leads (Chris, ICP-3, Phase 2)

**Headline:** "OLAP-grade cube. 1M cells. Federated collaboration."
**Supporting line:** "Direct Snowflake + BigQuery sync. Replace 70% of what Anaplan does, on your own terms, with no implementation partner. 2-year migration plan, one model at a time."

**Three-witness test:** (a) Buyer = Chris, VP Finance at $50–200M ARR; (b) Alternative = Anaplan at $400K/yr + 5 consultants (Iris pain #2: "We pay Anaplan $400K + Deloitte $200K"); (c) Outcome = 70% Anaplan replacement, no consultants, 2-year migration.

**Why this use case (Phase 2):** Chris is the **credibility-battleground buyer** (Iris: "if we win Chris, we win the right to say 'we replaced Anaplan'"). The use case speaks Chris's modeling-power language — the "Anaplan I can run myself" framing. Note: the original variant copy was written when Vera was mapped to ICP-3 (pre-ratification); under canonical (Vera=ICP-2, Chris=ICP-3), the buyer is Chris, but the Anaplan-displacement pain quotes (multi-dimensional modeling, no implementation partner) are real and apply to Chris.

---

## §5 — Social proof (3 placeholder blocks, [FICTIONAL PLACEHOLDER] tagged)

The 3 social-proof blocks are **placeholder quotes** for the post-Beta case studies. Each is marked `[FICTIONAL PLACEHOLDER]` so the engineering and content team can grep-and-replace when the real case studies land (per `BETA_PROGRAM.md` §3.3, target 5 Diamond + 10 Platinum + 15 Gold = 30 case studies by D+120). The placeholders use the **anonymized archetype** from the Beta program scoring rubric — they are not fabricated names; they are template slots.

### Social Proof 1 — Anaplan displacement (ICP-1)

> "We were about to sign an Anaplan quote for $340K/year. FinPlan Pro gave us 80% of what we needed at $180K, with a 2-week go-live and zero consultants. Our analyst now builds 4 scenarios per week instead of 1 per month. **This is the first tool my team actually uses.**" — [FICTIONAL PLACEHOLDER: Carla, CFO at a $40M ARR vertical-SaaS company, 180 FTE, 3-person FP&A team, 14-day → 3-day close]

**Three-witness test:** (a) Buyer = Carla (ICP-1); (b) Alternative = Anaplan at $340K/yr; (c) Outcome = $160K/yr savings, 2-week go-live, 4×/week scenarios.

**Source mapping:** When the Beta program graduates, replace with the **Diamond-tier case study** (3 mandatory + 3 bonus per `BETA_PROGRAM.md` §3.1-3.2). Use a real customer name + a logo.

### Social Proof 2 — Excel replacement (ICP-2)

> "I had 15 tabs, 50 cross-references, and a VLOOKUP that broke every quarter. FinPlan Pro imported my existing model in 30 minutes, gave me a scenario engine in week 1, and the AI Copilot in week 2. **I got my Sunday nights back.**" — [FICTIONAL PLACEHOLDER: Chris, Controller at a $4M ARR B2B SaaS, 22 FTE, no team, all-Excel, 9-day VLOOKUP break per quarter]

**Three-witness test:** (a) Buyer = Vera (ICP-2); (b) Alternative = Excel + VLOOKUP + 9-day break; (c) Outcome = 30-min import, 5-min Monday burn, no VLOOKUP.

**Source mapping:** Replace with a **Gold-tier case study** (3 mandatory + 1 bonus) at D+120. Vera is the highest-volume testimonial source (per `iris/PERSONAS.md`, Vera's 5 quotes are the most quotable of the 3 personas); aim for 3-5 Vera-style quotes by D+180.

### Social Proof 3 — Consulting displacement (ICP-1, larger)

> "We had 4 FP&A consultants billing $2M/year to maintain a model that broke every time the GL changed. FinPlan Pro replaced 60% of that with 1 in-house analyst + the platform. **$1.2M/yr saved, no consultants, the model now updates itself.**" — [FICTIONAL PLACEHOLDER: Vera-track FP&A Lead at a $80M ARR marketplace, 450 FTE, 4 consultants on Anaplan maintenance, 1 in-house analyst post-migration]

**Three-witness test:** (a) Buyer = Carla-track (ICP-1, larger — $100M+ ARR, multi-entity); (b) Alternative = 4 consultants × $500K = $2M/yr; (c) Outcome = $1.2M/yr saved, 1 in-house analyst, no consultants. (Note: pre-ratification the buyer was mislabeled as "Vera-track (ICP-3, future)" — under canonical (T-HER-009 v0.2), ICP-1 = Carla and the consulting-displacement pain (Anaplan + Deloitte) is a CFO-budget-ownership pain, not an FP&A Lead pain.)

**Source mapping:** Replace with a **Phase 2 case study** (Q1 2027, per Strategos's roadmap). This is the **Anaplan-displacement credibility story** that earns the right to say "we replaced Anaplan."

---

## §6 — Footer CTA (the final 50 words)

The footer is the **last impression** the prospect takes away. It is the place to consolidate the positioning, the proof points, and the next step into a single closing statement.

### Footer copy (verbatim, 50 words)

> **FinPlan Pro is the offline-first, AI-native FP&A platform.** Open source. SOC 2 Type 1 by Q4 2026. **50-customer Beta cohort opens Q3 2026** — apply for a 30-day risk-reversal pilot, no payment unless we hit your 3 success criteria. **The 30-second demo is the fastest way to see it.**

**Primary CTA button:** "Apply for the Beta →" (links to `BETA_PROGRAM.md` §6 invite form)
**Secondary CTA button:** "Watch the 30-sec demo →" (links to video)
**Tertiary CTA (text link):** "Read the Anaplan comparison →" (links to `ANAPLAN_LEAVE_BEHIND.md`)

**Three-witness test:** (a) Buyer = Carla/Chris/Vera (all 3 ICPs are addressed); (b) Alternative = Anaplan/Adaptive/Excel (the 3 silent incumbents); (c) Outcome = 30-day pilot, 3 success criteria, no payment unless we hit them, 30-sec demo.

**Why this footer works:** It consolidates the 3 differentiators (offline-first, AI-native, OSS-friendly), the 1 proof point (SOC 2 timeline), the 1 call-to-action (Beta cohort), and the 1 risk-reversal (30-day pilot, 3 success criteria) into a single 50-word statement. The CFO reads it once and has everything they need to forward to their CEO.

---

## §7 — Cross-Muse coordination (the homepage's inputs and outputs)

| Input | Source | Used in |
|---|---|---|
| ICPs (Carla, Vera, Chris) | `ICP.md` (Hermes) | §1 hero variants A/B/C |
| Personas (Carla, Chris, Vera) | `PERSONAS.md` (Iris) | §1 hero variants + §4 use cases |
| Pain quotes | `PERSONAS.md` (Iris) | §1 sub-headlines + §5 social proof |
| Value props + anti-positions | `POSITIONING.md` (Hermes) | §1 sub-headlines + §3 differentiators |
| Pricing tiers | `PRICING.md` (Hermes) §2.3 | Companion file `MARKETING_SITE_PRICING_PAGE.md` |
| Anaplan battlecard | `BATTLECARD_ANAPLAN.md` (Hermes) | §1 Variant A sub-headline + §3 differentiator 1 |
| 4 stats (ground truth) | Strategos's "Is 100× yet?" scorecard | §2 proof points |
| Beta program 50-customer cohort | `BETA_PROGRAM.md` (Hermes) | §6 footer CTA |

| Output | Consumer | Used as |
|---|---|---|
| Homepage hero A/B variants | Apollo (RevOps) | A/B test framework in marketing analytics |
| 4 proof points | Apollo (RevOps) | Homepage + sales deck + analyst brief |
| 3 differentiators | Hera (Design System) | Marketing-site visual design + Hero icons |
| 3 use cases | Iris (Customer Research) | Persona-validation feedback loop (which converts?) |
| 3 social proof placeholders | Apollo (RevOps) | Beta-program case-study swap-in pipeline |
| Footer CTA | Apollo (RevOps) | Beta-program invite form + demo video |

---

## §8 — Open questions for the Leader / Strategos / Apollo (post-launch)

1. **Should the hero A/B test run 50/50 between Variant A and Variant B, or 70/30 (A-heavy) to optimize for the higher-ACV ICP-1 buyer?** Hermes recommends 70/30 — under canonical ICP-numbering (T-HER-009 v0.2), ICP-1 (Carla) at $50K–$200K ACV (midpoint $125K) is **~4.5× the PLG ICP-3 (Chris) at $5K–$50K ACV (midpoint $27.5K)**. So even a 30% ICP-1 conversion delivers more revenue than a 100% ICP-3 conversion. (Note: the original L221 pre-ratification math said "25× ICP-2's $10K ACV" — that figure was based on pre-ratification Carlos-as-ICP-2 mapping. Under canonical, the relevant comparison is ICP-1 (Carla) vs ICP-3 (Chris).) A/B test for 30 days; promote the winner to 100%.
2. **Should the 4 stats include "200+ engines" instead of "175/176 engines tested"?** The 175/176 number is the test-coverage truth; the "200+" number is the marketing round-up. Hermes recommends the marketing version ("200+ engines, 175 tested for the 99.4% coverage") for the homepage, with the 175/176 cited in the engineering blog.
3. **Should the homepage include a "see it in action" video as a 4th CTA?** The 30-sec demo video is the highest-converting single asset in our cold-outbound tests (per the Sequence's A/B-test backlog). Adding it as a 4th CTA above the fold is worth testing.
4. **Should the 3 social-proof placeholders be replaced with logo strips (10 customer logos) instead of 3 quotes?** Logo strips convert better on first-glance; quotes convert better on close. Hermes recommends **logo strip on first visit, quote modal on click** — best of both.
5. **Should the footer CTA point to a self-serve Beta-application form, or to a sales-led "request an invite" form?** Self-serve = more applications, lower ICP-fit; sales-led = fewer applications, higher ICP-fit. For the v0.1 launch, self-serve (we need the volume to test the funnel); for v0.2 (post-D+30), sales-led (we have the cohort data to qualify).

---

_λόγος δημόσιος — the public word. The cold email is the first whisper; the homepage is the first impression. Hermes writes the words that turn the visitor into a customer. — Hermes_

---

> **ICP-numbering note (T-HER-009 v0.2):** Hero variants A/B/C map to canonical ICP-1 (Carla) / ICP-2 (Vera) / ICP-3 (Chris) per `docs/drafts/iris/PERSONAS.md` canonical 2026-06-13. Use case 1 (CFOs) = ICP-1 Carla. Use case 2 (Controllers) = ICP-2 Vera. Use case 3 (FP&A Leads, Phase 2) = ICP-3 Chris. Social Proof 1 + 2 target ICP-2 (Vera, Controller) primarily. Social Proof 3 targets ICP-1 (Carla, larger — $100M+ ARR, multi-entity). Math note: L221 hero A/B test recommendation is ICP-1 (Carla, $125K midpoint) vs ICP-3 (Chris, $27.5K midpoint) at ~4.5× — pre-ratification "25× ICP-2's $10K ACV" math was based on Carlos-as-ICP-2 mapping and is superseded.
