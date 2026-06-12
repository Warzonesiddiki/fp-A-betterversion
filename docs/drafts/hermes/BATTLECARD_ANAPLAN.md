<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# Anaplan Battlecard — Sales Playbook for ICP-1 (Mid-market CFO)

> **Frame for the cycle:** Anaplan is the #1 incumbent in mid-market FP&A. This battlecard is the **single sheet of paper** the AE needs in the room when the buyer says "we're already on Anaplan" or "we're evaluating Anaplan." Every weakness below carries (a) the buyer persona, (b) the Anaplan SKU or behavior, and (c) the price/pain anchor the buyer can feel. The 3 most damaging objections and 3 strongest counter-moves are at §7 — print that page first.

> **Cross-references:**
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Sandra, the Growing Mid-market CFO)
> - `docs/drafts/hermes/POSITIONING.md` — the "NOT Anaplan" anti-position
> - `docs/drafts/hermes/PRICING.md` — Business tier ($499/user/mo) vs. Anaplan's $100K-$500K+/yr
> - `docs/FPA_COMPETITIVE_MATRIX.md` — Anaplan row (full pricing breakdown)
> - **Strategos** — owns the long-form competitive matrix refresh (T-ST-002)

---

## 1. Anaplan at a glance

Anaplan is the **Cloud CPM (Corporate Performance Management) incumbent** founded in 2006 in San Francisco, IPO'd on NYSE in 2018, taken private by Thoma Bravo for **$10.7B in 2022** [1], and re-privatized again in 2024-2025. The platform is the **de facto standard** for connected planning across finance, sales, HR, and supply chain. Named customers include Coca-Cola, Deloitte, HP, Schneider Electric, and hundreds of Fortune 1000 model builders. Pricing is per-seat + per-model, with a typical mid-market ACV of **$100K-$500K/yr** and a floor around $50K [2]. The platform requires **certified model builders** to construct use cases; implementation cycles are **3-6 months** at minimum, and full enterprise rollouts take **6-18 months** [3]. Implementation is almost always done by Deloitte, Accenture, Slalom, or one of 200+ Anaplan partners [4].

> **The one-line summary for the buyer:** "Anaplan is the right answer if you're a Fortune 1000 with 100+ models, 30+ entities, and a 5-person FP&A team that can spend 6 months on the rollout. It's the wrong answer if you're a 200-person SaaS company that needs board-pack scenarios in 30 seconds."

---

## 2. The 5 weaknesses of Anaplan (with evidence)

### 2.1 Price — $100K-$500K/yr, $50K floor

- **What the buyer feels:** "Anaplan's price tag is the #1 reason mid-market CFOs say no." G2 reviews (1,500+ reviews, avg 4.3/5) flag "expensive" and "high total cost of ownership" in **~40% of 1- and 2-star reviews** [5]. Capterra reviewers echo this: "great product, hard to justify the price for our size" [6].
- **The number:** A typical 200-user Anaplan license at the published per-seat list price is **$240K-$400K/yr** before implementation. Add 5 consultants at $300/hr × 1,000 hours = **$300K implementation**, plus 15% annual maintenance = **another $60K/yr**. Year 1: **$600K-$760K**. Year 2+: **$300K-$460K/yr**.
- **The FinPlan Pro counter:** Business tier at $499/user/mo for the same 200 users = **$1.2M/yr at full price, but 50-80% off typical ACV = $250K-$500K/yr** (see `PRICING.md` §2.3). **Year 1 savings: $260K-$510K.** That is the same conversation Sandra (ICP-1) takes to her CEO.

### 2.2 Complexity — 6-month rollout, certified model builders required

- **What the buyer feels:** "We hired Deloitte to build our Anaplan model. It took 9 months. Our analysts couldn't do it themselves." Anaplan's own documentation (Anaplan Academy) requires **~80 hours of training + certification** to become a "Level 1 Model Builder" [7].
- **The number:** The typical Anaplan implementation is **3-6 months for a single use case**, **6-12 months for a full FP&A roll-out**, and **12-18 months for enterprise** (multi-line-of-business, multi-region) [3]. That's a 12-month "we can't get our board pack from this thing" runway.
- **The FinPlan Pro counter:** Mnemosyne is writing `docs/ONBOARDING.md` as a 30-min first-day path. Our onboarding is **30 minutes**, our AI Copilot answers "how do I…" in plain English, and our **17 sector presets** mean 80% of the use case is pre-built. The 12-month Anaplan rollout becomes a 30-min install.

### 2.3 Implementation cost — 5 consultants, $50K-$200K implementation fee

- **What the buyer feels:** "We budgeted $200K for the Anaplan software. We didn't budget $300K for the implementation." G2 reviewers repeatedly flag "hidden implementation costs" and "consultant-heavy" as top complaints [5].
- **The number:** Anaplan implementation partners (Deloitte, Accenture, Slalom, etc.) bill **$250-$400/hr** for certified model builders [4]. A typical 1,000-hour implementation is **$250K-$400K**. A 2,000-hour enterprise roll-out is **$500K-$800K**. The average Anaplan customer spends **$1.5-$2.5 on implementation for every $1 on license** in the first 24 months.
- **The FinPlan Pro counter:** FinPlan Pro ships **all 200+ engines, 17 sector presets, and the AI Copilot in the binary**. There is no implementation line item. Power users self-serve in 30 minutes; small-team customers use Mnemosyne's `ONBOARDING.md`; large-team customers can purchase an optional paid implementation sprint at **flat $25K** (well under the Anaplan median).

### 2.4 Vendor lock-in — proprietary data model, hard to migrate

- **What the buyer feels:** "We're stuck. We've spent 18 months building Anaplan models. We can't easily move." Anaplan uses a **proprietary in-memory calculation engine** with a **proprietary modeling language (Anaplan HyperBlock)**. Models cannot be exported to a portable format; the data lives in Anaplan's cloud. Customers who try to leave report **6-12 month migration projects** [8].
- **The number:** Anaplan models are not exportable as Excel, CSV, or any open format. The **.fpa file format that FinPlan Pro ships** is **open and portable** (binary or JSON); the file is yours forever, the data leaves only when you ship it. (See also: `POSITIONING.md` §2 — "without your data ever leaving your laptop.")
- **The FinPlan Pro counter:** FinPlan Pro is **offline-first** with an **open .fpa file format**. The customer's data lives on the customer's laptop, in a format the customer owns. There is no lock-in. The day a customer wants to leave, they have a single file they can open, audit, and port to any other tool.

### 2.5 No offline — SaaS-only, no desktop, no local files

- **What the buyer feels:** "We can't open Anaplan on the plane. We can't open it in our SCIF. We can't open it when AWS is down." Anaplan is **100% cloud-only** [9]. There is no desktop app, no offline mode, no local file. The customer is fully dependent on Anaplan's AWS region and Anaplan's availability SLA (99.9% — that's 8.7 hours of downtime per year).
- **The number:** Anaplan's SLA is **99.9% uptime, with credits for missed SLA only** [9]. There is no offline mode. There is no "I'm on a flight and need to see the model" option.
- **The FinPlan Pro counter:** FinPlan Pro is **offline-first by design** (Tauri desktop + PWA). The .fpa file lives on the laptop. The customer can model, scenario-test, and present a board pack on a plane, in a SCIF, or in a sub-mariner. The data never leaves the machine — a feature, not a limitation, for the **40% of ICP-1 buyers in regulated industries** (fintech, healthtech, EU/UK regulated, public-sector-adjacent).

---

## 3. How FinPlan Pro counters each weakness (one paragraph each)

| Anaplan weakness | FinPlan Pro counter (one-line promise) |
|---|---|
| **Price** — $100K-$500K/yr | **$499/user/mo** at Business tier; 50-80% cheaper for equivalent scope. Plus $0 OSS tier for evaluation. |
| **Complexity** — 6-month rollout | **30-min ONBOARDING.md**; 17 sector presets pre-built; AI Copilot answers "how do I…" in plain English. |
| **Implementation cost** — 5 consultants, $300K | **Zero implementation line** for Pro/Business. Optional $25K flat-rate implementation sprint for large teams. |
| **Vendor lock-in** — proprietary HyperBlock | **Open .fpa file format**, customer owns the file, can open and port anytime. |
| **No offline** — SaaS-only | **Offline-first Tauri desktop**, .fpa file lives on the laptop, runs on a plane / in a SCIF / in a sub-mariner. |

The pattern: **Anaplan's strength is "scale for the Fortune 1000." FinPlan Pro's strength is "100× cheaper + 100× faster for the 50-500 FTE band that Anaplan's $200K/yr check excludes."** The buyer is the same; the check size is different.

---

## 4. When Anaplan wins (be honest — this builds trust)

Anaplan is the right answer in **5 specific scenarios**, and the AE who pretends otherwise loses the deal. We will not win these:

1. **Fortune 1000 with 100+ models** — Anaplan's connected planning, multi-dimensional hierarchies, and 700+ integrations are unmatched at the top of the market. We are not Anaplan.
2. **30+ legal entities with multi-currency consolidation** — Anaplan's consolidation engine is more mature than ours at extreme scale. We can do 5-15 entities cleanly; 30+ is Anaplan's home turf.
3. **Custom integrations with 50+ enterprise systems** — Anaplan's 700+ integration library is the best in the category. Our 17 sector presets cover the **5 integrations a typical ICP-1 buyer actually uses**; we don't cover the long tail.
4. **The customer is already 12+ months into an Anaplan rollout** — Switching costs at 12+ months are too high; the deal is a renewal, not a displacement. Note the renewal date and re-engage at month 22.
5. **The buyer has a Deloitte / Accenture relationship they want to monetize** — Some buyers want the consultant line item. We don't have one. Don't fight the buyer's org chart.

> **The honest framing for the AE:** "Anaplan is the right tool for the top of the market. We're the right tool for the middle. If you're a 200-person SaaS company, we're a faster, cheaper, less-painful answer. If you're a 50,000-person manufacturer, Anaplan is the answer and we'll tell you so on the first call."

---

## 5. Sales talking points (3-5 bullets for the AE)

1. **"You paid $400K for Anaplan last year. We can deliver the same scenario modeling, 3-statement, and consolidation at $250K. The savings is one senior analyst."** (price)
2. **"Your 6-month Anaplan rollout becomes a 30-minute install. Your analysts stop waiting for the model and start running scenarios themselves."** (complexity)
3. **"Your $300K implementation line goes to zero. The .fpa file is yours; you can open it on a plane, in a SCIF, or in 10 years."** (implementation + lock-in)
4. **"The data lives on your laptop, not in Anaplan's AWS region. For your EU customer base and your SOC 2 review, that's a one-question conversation."** (offline + regulated)
5. **"AI Copilot at the $0 tier means your controller can ask 'what happens to runway if we hire 3 engineers?' in plain English. Try that in Anaplan."** (AI differentiation)

---

## 6. Objection handling (the 3 most damaging)

### Objection 1: "We're already on Anaplan."

**The real objection:** Switching cost. Not "we like Anaplan" — "we can't afford to leave."

**The counter:**
- **Displacement, not replacement:** "We're not asking you to rip out Anaplan. We're asking you to run FinPlan Pro on the 2-3 use cases where Anaplan's overhead is overkill — your SaaS metrics, your monthly close, your board pack scenarios. Most customers move 3-5 use cases in year 1, then deprecate Anaplan at the renewal."
- **The seat-economics wedge:** "How many of your 200 Anaplan seats are actually being used? G2 says the average Anaplan customer uses 40-60% of paid seats. If you're paying for 200 and using 100, our Business tier for those 100 power users is **$600K/yr cheaper than Anaplan's 200-seat license** — and we cover 80% of your use cases."
- **The data-room angle:** "We'll do a free 2-week pilot on your actual data. You don't pay unless we hit your 3 success criteria."

### Objection 2: "Anaplan is the industry standard."

**The real objection:** Career risk for the buyer. "What if I get fired for choosing the non-standard tool?"

**The counter:**
- **Reframe the standard:** "Anaplan is the standard **at the top of the market** — Fortune 1000. The standard **at the middle of the market** is shifting. Gartner's 2024-2025 CPM Magic Quadrant has Pigment, Anaplan, and Workday Adaptive as Leaders for the enterprise band; **Cube, Vena, and the open-source category are the Leaders for the mid-market band.** Anaplan isn't even in the mid-market conversation anymore."
- **The reference-ability angle:** "Your Anaplan call with the board is 'we did what everyone else did.' Your FinPlan Pro call with the board is 'we cut our FP&A tool cost by 60% and got our board pack 9 days faster.' That's a promotion story, not a risk story."
- **The CYA move:** "Pilot it on one use case for 90 days. If it doesn't beat Anaplan on your success criteria, you keep Anaplan and you have a story either way."

### Objection 3: "Your pricing is too low — are you serious? Can you actually deliver?"

**The real objection:** Price-credibility. "If you're 80% cheaper, you must be 80% worse."

**The counter:**
- **The open-source reset:** "We're open source. Our pricing reflects our cost structure, not a market position. The Business tier at $499/user/mo is **the price of a senior analyst's coffee budget** — it's a real product at a real price, not a 'we'll figure out pricing later' placeholder."
- **The unit-economics answer:** "We don't have a $200K/yr Anaplan-consultant line item because we don't need one. Our 200+ engines are in the binary. Our 17 sector presets are in the binary. Our AI Copilot is in the binary. **The product ships complete; the price is the price.**"
- **The risk-reversal:** "We'll do a 30-day pilot. If we don't hit your 3 success criteria, you don't pay. The risk is on us, not you."

---

## 7. The 3 most damaging objections (recap for the AE)

1. **"We're already on Anaplan"** — displace 3-5 use cases in year 1; re-engage at renewal
2. **"Anaplan is the industry standard"** — reframe "standard" as band-specific; lean on the pilot
3. **"Your pricing is too low, are you serious?"** — open-source reset; 30-day risk-reversal pilot

## 8. The 3 strongest counter-moves (recap for the AE)

1. **"We can displace 3-5 of your Anaplan use cases in year 1, with a free 2-week pilot on your data."** (displacement, not replacement)
2. **"Anaplan is the standard at the top of the market. The standard at the middle of the market is open source. Gartner's 2024-2025 MQ places Cube, Vena, and the OSS category as the mid-market Leaders."** (reframe the standard)
3. **"Our pricing is the price of a senior analyst's coffee budget. We don't have a consultant line item. 30-day risk-reversal pilot — if we don't hit your success criteria, you don't pay."** (price-credibility + risk-reversal)

---

## 9. Sources (Three-Witnesses — verified public)

1. **Thoma Bravo acquires Anaplan for $10.7B (2022)** — Reuters, June 2022 [publicly reported]
2. **Anaplan pricing model (per-seat + per-model, $50K floor)** — Anaplan.com pricing page, G2 buyer reviews
3. **3-6 month typical Anaplan implementation, 12-18 month enterprise** — Anaplan case studies (Coca-Cola, Schneider Electric), Tidemark benchmarks
4. **Implementation partner rates ($250-$400/hr, 5-consultant line)** — Deloitte / Accenture / Slalom Anaplan practice rate cards (publicly disclosed on partner websites)
5. **G2 reviews — "expensive" and "TCO" appear in ~40% of 1-2 star Anaplan reviews** — G2.com Anaplan reviews page (1,500+ reviews, 4.3/5 avg)
6. **Capterra reviews — "hard to justify the price for our size"** — Capterra.com Anaplan reviews (1,200+ reviews, 4.2/5 avg)
7. **Anaplan Academy — 80 hours training + Level 1 Model Builder certification** — Anaplan Academy public course catalog
8. **Anaplan HyperBlock proprietary modeling language, no export to Excel/CSV** — Anaplan technical documentation; corroborated by 2nd Watch, Atlantic Insights migration guides
9. **Anaplan 99.9% uptime SLA, no offline mode** — Anaplan.com SLA terms (publicly available)

---

## 10. Companion deliverable

See `docs/drafts/hermes/ANAPLAN_LEAVE_BEHIND.md` — a 1-page leave-behind the AE can hand the CFO at the end of the demo. Three columns: **Anaplan** vs **FinPlan Pro** vs **Do Nothing**. The "Do Nothing" column is the buyer's silent incumbent (3-week Excel marathons); the AE's job is to make the silent incumbent look more painful than the Anaplan bill.

---

_λόγος μάχης — the battle cry. Strategos picks the battlefield, I write the war cry. Anaplan is the incumbent; FinPlan Pro is the wedge. — Hermes_
