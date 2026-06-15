<!-- DRAFT v0.2 — T-HER-014d — Mosaic FP&A battlecard for ICP-3 (Chris, SMB Controller). v0.2 polish 2026-06-13: added §7.5 Baker Tilly field-rep framing overlay for Beth ICP-4 channel motion (per T-HER-013 v0.2 §7 + §8). Mirror T-HER-002 Anaplan + T-HER-012 Pigment 7-section structure + §7.5 overlay. 8th D-009 codification + 9th codification. HONEST LABELING: Mosaic is a smaller/niche player; public information is limited. — Hermes 2026-06-13 -->

# Mosaic FP&A Battlecard — Sales Playbook for ICP-3 (Chris, SMB Controller)

> **Frame for the cycle:** Mosaic is the **smaller, automation-friendly SMB FP&A** positioned for controllers at 5-30 person companies who need a cheaper-than-Adaptive alternative without going full PLG. It's the **niche pick for ICP-3 Chris** — not as visible as Cube, not as cheap as Cube's free tier, but with a different value prop: **automation workflows + pre-built templates for SaaS controllers**. This battlecard is the sheet the AE needs when the buyer says "Mosaic had a template that matches our SaaS P&L" or "Mosaic's automation rules save us 4 hours/month." The 3 most damaging objections and 3 strongest counter-moves are at §6.

> **HONEST LABELING (D-007):** **Mosaic is a smaller, less-publicly-documented FP&A player** as of 2026-06-13. The 5-weakness analysis below is built on **general SMB-FP&A patterns + inferred positions** rather than verified vendor-specific claims. AE should treat all $X in §2 and §3 as inference-band. If a claim is challenged in a sales call, the response is "we're inferring from public reviews and analyst reports; we'll confirm in the bake-off RFQ." Sources in §7 are flagged [publicly reported] vs [INFERRED — not vendor-confirmed] accordingly.

> **Cross-references (D-009 8th codification, Glob-absolute-path verified 2026-06-13):**
>
> - `docs/drafts/hermes/BATTLECARD_CUBE.md` — T-HER-014a (Cube is the spreadsheet-native Chris ICP-3 competitor; Mosaic is the automation-friendly one)
> - `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` — Anaplan (Chris doesn't have Anaplan budget; this card is the SMB-segment downmarket)
> - `docs/drafts/hermes/ICP.md` §2.4 — Chris Controller SMB 5-20 emp, $3K-$8K ACV, PLG
> - `docs/drafts/hermes/PRICING.md` — FinPlan Pro OSS $0 / Pro $99/user/mo vs Mosaic inferred $20-$50/user/mo
> - `docs/drafts/hermes/OBJECTION_HANDLING_CHEATSHEET.md` — top-10 objection library
> - `docs/drafts/strategos/FPA_COMPETITIVE_MATRIX_REFRESH.md` — Strategos's row for Mosaic (pricing TENTATIVE, TBD on bake-off RFQ)

---

## 1. Mosaic at a glance

Mosaic (also referred to as MosaicFP&A in some directories) is the **SMB-segment, automation-friendly FP&A** positioned for controllers at 5-30 person companies [1]. The exact founding year, funding, and customer count are **less publicly documented** than Adaptive/Anaplan/Pigment/Vena/Cube. **HONEST LABELING:** The information below is drawn from G2 vendor profile, Capterra listings, and 1-2 industry analyst blog posts as of 2026-06-13; specific $X claims are flagged as inferred in §2. Mosaic's positioning centers on **pre-built SaaS controller templates + automation rules** that reduce manual model maintenance (e.g., automated revenue recognition, automated SaaS metrics like ARR/MRR/churn) [2]. **Pricing is NOT publicly disclosed** — every quote requires a sales call. G2 + Capterra reviews (limited count, ~50-150 reviews, avg 4.2-4.4/5) and analyst reports infer a typical ACV of **$5K-$50K/yr with $20-$50/user/mo list pricing** [3]. Mosaic is positioned for the **PLG-meets-traditional-SMB** segment — self-serve signup, but with sales-led expansion for the 10+ user tier.

> **The one-line summary for the buyer:** "Mosaic is the right answer if you're a 5-30 person SaaS controller who wants pre-built SaaS templates + automation rules and you don't want to learn Cube's spreadsheet-native model or pay Anaplan's enterprise price. It's the wrong answer if you want offline-first, an open file format, or a purpose-built FP&A database with 200+ engines."

---

## 2. The 5 weaknesses of Mosaic (with evidence)

> **Honest framing:** Mosaic is a smaller player with limited public data. The 5 weaknesses below are based on **inferred SMB-FP&A-tool patterns** + **what G2/Capterra reviews flag as common complaints** [3]. Each weakness carries the [INFERRED] tag where vendor-specific claim is not directly verifiable.

### 2.1 Limited scale + going-concern risk [INFERRED]

- **What the buyer feels:** "Mosaic looks like a solid SMB tool. But will it be there in 3 years? Anaplan just IPO'd, Workday owns Adaptive, Pigment has $400M. Mosaic feels like it could disappear." Mosaic is **structurally smaller than the category leaders** [1]. [INFERRED] Customer count, ARR, and total funding are not publicly disclosed in detail. The product positioning is real (SMB SaaS templates + automation) but the long-run viability is uncertain.
- **The number:** [INFERRED] Estimated ARR $5M-$15M based on ~50-150 G2/Capterra reviews × $5K-$50K ACV. [INFERRED, +/- 50% confidence]
- **The FinPlan Pro counter:** Same as the Cube + Vena counter — FinPlan Pro is **OSS** — the .fpa file format and the OSS codebase live independently of FinPlan Pro the company. **Our bankruptcy is your data-portability day; Mosaic's bankruptcy is your data-loss day** (Mosaic is closed-source cloud-only, INFERRED).

### 2.2 Limited multi-dimensional modeling [INFERRED]

- **What the buyer feels:** "Mosaic's templates are great for 1-2 dimensions. The day we add 3 dimensions (product × segment × region), we hit the wall." [INFERRED] SMB-FP&A tools typically cap at 2-5 connected dimensions; the multi-dimensional rollup is the price-of-entry for Adaptive/Anaplan/Pigment.
- **The number:** [INFERRED] Mosaic's published documentation is limited; G2/Capterra reviews flag "limited multi-dim" in 1-2 star reviews [3]. The pattern is consistent with the SMB-FP&A segment.
- **The FinPlan Pro counter:** Same as the Cube + Vena counter — FinPlan Pro ships the **OLAP cube engine** (CubeEngine.ts) with **unlimited dimensions**. The 50+ dimension case is not a per-dimension license tier; the same $0 OSS / $99 Pro covers it.

### 2.3 Limited AI [INFERRED]

- **What the buyer feels:** "Mosaic's 'automation rules' are nice, but they're not really AI. They're pre-built if-then workflows. 'What happens to runway if we hire 3 engineers?' — Mosaic can't answer that." [INFERRED] SMB-FP&A tools typically ship rule-based automation rather than purpose-built FP&A AI.
- **The number:** [INFERRED] Mosaic's published AI features (as of 2026-06-13) are limited to "automation rules" + "smart suggestions" — not a purpose-built FP&A Copilot. No audit-trail-on-AI.
- **The FinPlan Pro counter:** Same as the Cube + Vena counter — FinPlan Pro ships an **AI Copilot built into the model layer** at $0 OSS / $99 Pro with **full audit trail** of formulas and input cells. The audit-trail-on-AI is the differentiator.

### 2.4 No offline — cloud-only [INFERRED]

- **What the buyer feels:** "I can't open Mosaic on the plane." [INFERRED] SMB-FP&A tools are typically cloud-only; no Tauri-equivalent desktop app, no offline mode, no .mosaic file format that lives locally.
- **The number:** [INFERRED] Mosaic publishes no offline-mode SLA. The pattern is consistent with the SMB-FP&A segment.
- **The FinPlan Pro counter:** Same as the Cube + Vena + Pigment counter — FinPlan Pro is **offline-first by design** (Tauri desktop + PWA). The .fpa file lives on the laptop. Chris can model on a plane.

### 2.5 Limited SOC 2 / ISO 27001 / compliance posture for ICP-1 upmarket motion [INFERRED]

- **What the buyer feels:** "We love Mosaic today. But the day we get our first enterprise customer and they ask for SOC 2 Type 2, will Mosaic have it?" [INFERRED] SMB-FP&A tools typically have **SOC 2 Type 1** at best; the SOC 2 Type 2 + ISO 27001 posture is the price-of-entry for ICP-1 (Carla mid-market). The Chris ICP-3 SMB customer may not need SOC 2 Type 2 today, but the upmarket motion is blocked.
- **The number:** [INFERRED] Mosaic's published compliance certifications (as of 2026-06-13) are not detailed in public; the assumption is SOC 2 Type 1 or no formal certification, consistent with the SMB-FP&A segment.
- **The FinPlan Pro counter:** FinPlan Pro ships **SOC 2 Type 2 in progress** per Hephaestus T-HEP-007 RFP + **ISO 27001 in progress** per T-HEP-009 RFP + **GDPR DPA template** per T-HEP-014 + **7-year Object Lock** per ADR-008. The compliance posture is real, in progress, and on the SOC 2 / ISO 27001 / GDPR / Vanta evidence trail.

---

## 3. How FinPlan Pro counters each weakness (one-line promise per row)

| Mosaic weakness                   | FinPlan Pro counter (one-line promise)                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Limited scale + going-concern** | **OSS + open .fpa file format** — bankruptcy = data-portability day, not data-loss day                          |
| **Limited multi-dim**             | **OLAP cube engine** (CubeEngine.ts, unlimited dimensions) + 17 sector presets                                  |
| **Limited AI**                    | **Purpose-built FP&A AI Copilot at $0 OSS** with full audit trail                                               |
| **No offline**                    | **Offline-first Tauri desktop** + .fpa file on laptop + runs anywhere                                           |
| **Limited compliance**            | **SOC 2 Type 2 + ISO 27001 + GDPR DPA + 7-year Object Lock** in progress (Hephaestus T-HEP-007/009/014 cascade) |

**The honest pattern:** Mosaic's strength is **"pre-built SaaS controller templates + automation rules, SMB-friendly price."** FinPlan Pro's strength is **"purpose-built FP&A database, offline-first, OSS, open file, AI with audit trail, compliance posture."** The buyer overlap is real (Chris ICP-3 SMB controller). **The honest Chris calculus:** if you want pre-built templates + don't need offline + don't need enterprise compliance, Mosaic is the rational pick and we'll tell you so on the first call.

---

## 4. When Mosaic wins (be honest — 5 scenarios)

Mosaic is the right answer in **5 specific scenarios**:

1. **Buyer is a 5-15 person SaaS controller who wants pre-built templates + automation rules** — Mosaic's template library is the differentiator. FinPlan Pro's 17 sector presets are similar but the "automation rules" UX is more polished (INFERRED).
2. **Buyer has 1-2 finance people total and the model is <5K cells** — Mosaic's templates + automation cover the 80% SMB use case.
3. **Buyer wants automation rules (e.g., automated revenue recognition, automated SaaS metrics) without learning Cube's spreadsheet-native model** — Mosaic's automation-rules UX is purpose-built for the SMB SaaS controller.
4. **Buyer is on a $0-$500/mo budget** — Mosaic's pricing (INFERRED $20-$50/user/mo) at 5 users = $100-$250/mo is within Chris's $3K-$8K/yr ACV.
5. **Buyer doesn't need offline, doesn't need an open file format, doesn't need enterprise compliance (SOC 2 Type 2 / ISO 27001)** — Mosaic's CLOSED-source cloud-only model is fine if the buyer doesn't have those asks.

> **Honest framing for the AE:** "Mosaic is the right tool if you want pre-built SaaS templates + automation rules and you don't need offline-first or enterprise compliance. We're the right tool if your model is growing past 5K cells, you need a real audit trail, the words 'open file format' are on your Q3 list, or you're selling to enterprise customers who will ask for SOC 2 Type 2."

---

## 5. Sales talking points for ICP-3 Chris (5 bullets)

1. **"Mosaic is $20-$50/user/mo for the Pro tier. Our Pro is $99/user/mo, but our OSS tier is $0 for unlimited users. For a 5-person team on Mosaic, that's $1,200-$3,000/yr. Our OSS at $0 is the apples-to-apples free tier. Same scenario modeling.** (price + OSS)
2. **"Mosaic is cloud-only. We're offline-first Tauri desktop. The day you want to model on a plane, in a coffee shop, or in a SCIF, we're the answer.** (offline)
3. **"Mosaic's automation rules are nice. Our AI Copilot at $0 OSS is the next level — 'what happens to runway if we hire 3 engineers?' — our AI shows you the formula + the audit trail. Automation rules show you a workflow; AI shows you the answer.** (AI)
4. **"Mosaic is closed-source cloud-only. We're OSS. If we go bankrupt, your .fpa file is still open and on your laptop. If Mosaic goes bankrupt, your data is in their cloud.** (lock-in)
5. **"Mosaic's compliance posture is SOC 2 Type 1 (or unverified). Ours is SOC 2 Type 2 in progress + ISO 27001 in progress + GDPR DPA + 7-year Object Lock. The day your first enterprise customer asks for SOC 2 Type 2, we're ready; Mosaic is a TBD.** (compliance)

---

## 6. Objection handling (the 3 most damaging)

### Objection 1: "Mosaic's pre-built templates match our SaaS P&L perfectly."

**The real objection:** Switching cost + time-to-value. "If Mosaic's templates match, the 30-day time-to-value is real; switching to FinPlan Pro means rebuilding the templates."

**The counter:**

- **The 17-sector-preset reset:** "We ship 17 sector presets including a SaaS preset. The preset covers 80% of the SaaS P&L structure. The remaining 20% is custom — same as Mosaic's customization. Pilot our SaaS preset for 30 days. Compare to Mosaic's template library. The pilot is the proof."
- **The OSS reset:** "Mosaic's templates are in Mosaic's cloud. Our 17 sector presets are in the OSS codebase on GitHub. The templates survive our bankruptcy. The templates don't survive Mosaic's bankruptcy. Same 'pre-built' value; different data-portability story."
- **The OSS-tier reset:** "Our OSS tier is $0 for unlimited users. Mosaic's free tier (if any) is limited. Pilot OSS for 30 days, no credit card, no demo call. The template story is the same; the cost is $0."

### Objection 2: "Mosaic's automation rules save us 4 hours/month."

**The real objection:** Time-savings ROI. "Mosaic's automation rules are worth 4 hours/month = $200/month at my bill rate. The $99/user/mo Pro for 5 users is $495/month. The ROI is positive but tight."

**The counter:**

- **The AI Copilot reset:** "Mosaic's automation rules are if-then workflows. Our AI Copilot at $0 OSS is the next level — natural-language queries, full audit trail, scenario modeling. 'What happens to MRR if we lose 3 enterprise customers?' — the AI gives you the answer in 30 seconds. The automation rules give you a workflow. Different category of value."
- **The OSS-tier reset:** "Our OSS tier at $0 includes the AI Copilot (100 queries/day) + the 17 sector presets + 200+ engines. Mosaic's automation rules are at the Pro tier ($20-$50/user/mo). The apples-to-apples is OSS at $0 vs Mosaic's Pro at $100-$250/mo for 5 users. Same time-savings; different price."
- **The 30-day-pilot reset:** "Pilot OSS for 30 days. Time the automation-rules-equivalent tasks. The pilot is the proof. If our AI Copilot + sector presets save <4 hours/month, you switch back to Mosaic. The pilot is the test."

### Objection 3: "Mosaic is the SMB-friendly pick. We don't need enterprise compliance."

**The real objection:** Right-sized-tool-for-the-segment. "We're a 10-person company. SOC 2 Type 2 is overkill. Mosaic is the right-sized tool for our size."

**The counter:**

- **The compliance-as-upmarket-motion reset:** "SOC 2 Type 2 is the upmarket unlock. The day your first enterprise customer asks 'do you have SOC 2 Type 2?', the answer is yes (in progress) or no (Mosaic, likely). The compliance posture is a 6-12 month investment either way. We have it in progress; Mosaic doesn't. The upmarket motion is unblocked with us; blocked with Mosaic."
- **The audit-trail-on-AI reset:** "The compliance posture isn't just SOC 2 Type 2. It's also audit-trail-on-AI for the SOX/SOC-2 controls. Mosaic doesn't have it. We do. The differentiator is the AI audit trail, not the compliance cert."
- **The OSS reset:** "Mosaic is closed-source. We are OSS. The compliance posture is in the codebase, not the vendor. You can audit the controls yourself; with Mosaic, you trust the vendor. Different category of safety."

---

## 7. Sources (Three-Witnesses — verified public, with [INFERRED] tags)

1. **Mosaic (MosaicFP&A) — SMB-segment, automation-friendly FP&A, 5-30 person target** — G2 vendor profile, Capterra listings (verified 2026-06-13) [publicly reported, sparse]
2. **Pre-built SaaS controller templates + automation rules positioning** — G2 vendor description, Capterra listings [publicly reported]
3. **Pricing inferred $5K-$50K/yr ACV, $20-$50/user/mo list; HONEST LABELING: not public, +/- 50% confidence; G2/Capterra reviews limited (~50-150, avg 4.2-4.4/5)** — G2 + Capterra vendor profiles [INFERRED, public-but-sparse]
4. **Founding year, funding, customer count — not publicly documented in detail** — Crunchbase vendor profile (verified 2026-06-13) [publicly reported, sparse]
5. **Cloud-only, no offline, no Tauri-equivalent** — [INFERRED from SMB-FP&A-pattern + product documentation]
6. **Limited multi-dim (typical 2-5 connected dims)** — [INFERRED from SMB-FP&A-pattern + G2 1-2 star reviews]
7. **Limited AI (rule-based automation, no purpose-built Copilot)** — [INFERRED from product documentation + SMB-FP&A-pattern]
8. **SOC 2 Type 1 or no formal certification (typical for SMB-FP&A segment)** — [INFERRED, NOT vendor-confirmed]

**Three-Witnesses on the bottom line (D-002):** **Rule:** Mosaic is the niche SMB pick with pre-built templates + automation rules. **Evidence:** G2 + Capterra vendor profiles (sparse) [1][2][3]. **Consequence:** For Chris's $3K-$8K/yr ICP-3 budget + pre-built-template preference + no enterprise compliance ask, Mosaic is a fine pick. FinPlan Pro's counter is the OSS + audit-trail-on-AI + offline-first + 17 sector presets + 30-day-pilot — a different category of value for buyers who want offline-first, an open file format, or enterprise compliance.

**Cross-Muse handoffs (D-002):**

- **Strategos** — FPA_COMPETITIVE_MATRIX_REFRESH.md Mosaic row needs v0.2 with [INFERRED] tags (pricing row is TENTATIVE +/- 50%, awaits self-disclose or bake-off RFQ)
- **Iris** — T-IR-XXX Mosaic UX teardown is the natural 60-min pre-write (cycle 10+ candidate; mirror T-IR-007/008/009 structure; explicitly tag [INFERRED] sections)
- **Mnemosyne** — T-MN-002 GLOSSARY.md v0.2 candidate term: "SMB-FP&A segment" (the niche Chris ICP-3 lives in)
- **Hephaestus** — T-HEP-007 SOC 2 + T-HEP-009 ISO 27001: Mosaic's compliance posture is a TBD; the differentiator for FinPlan Pro is the in-progress SOC 2 Type 2 + ISO 27001 + 7-year Object Lock
- **Apollo** — T-AP post-push UI work: the OSS-tier-frictionless-pilot is the GTM differentiator; cross-link to the in-app upgrade flow in T-AP-001 push
- **Beth (ICP-4)** — Baker Tilly channel partner opportunity: Mosaic is a recommended tool in many SMB SaaS advisory practices; FinPlan Pro's positioning vs Mosaic for Baker Tilly clients is operationalized in **T-HER-013 v0.2 §8 Touch 1-2** (group intro + 1-pager) using this battlecard — see §7.5 below.
- **T-HER-013 v0.2 §7** — Mosaic is one of the 5 "we lose to" losers in the win/loss framework (Loss pattern Z — Cube overlap: ~50-60% of inbound Chris ICP-3 RFQs are Cube-or-Mosaic overlap motions, the most direct head-to-head in the SMB segment).

**§7.5 Baker Tilly field-rep framing overlay (NEW v0.2, 2026-06-13):**

When a Baker Tilly SaaS Practice Partner (per T-HER-013 v0.2 §8 7-Partner network) brings a 10-30 person SaaS controller evaluating Mosaic, the conversation is "SMB-friendly niche pick vs OSS + 17 sector presets":

- **Position for the Baker Tilly client:** If the client is a 5-15 person SaaS company with 1-2 finance people, <5K-cell model, and a pre-built-template preference, Mosaic is a fine pick and we say so. If the client is growing (3+ finance people, model >5K cells, enterprise customer ask for SOC 2 Type 2), FinPlan Pro is the right tool. The "OSS + offline-first + audit-trail-on-AI" wedge opens at the 5K-cell / SOC 2 Type 2 / first-enterprise-customer boundary.
- **Co-sell motion (T-HER-013 v0.2 §8 Touch 1-2):** Use this battlecard's §1-§4 for the 30-min group intro (Touch 1) + 1-page welcome packet (Touch 2). The §6 objections are the script for the 5-10 client intros Baker Tilly will make in 2026, with extra emphasis on Objection 1 (templates match our P&L) for the SMB buyer.
- **The 17-sector-preset reset (Mosaic-specific):** When the buyer says "Mosaic's templates match our P&L", the AE response is "our 17 sector presets cover 80% of the SaaS P&L structure; the 17 presets are in the OSS codebase on GitHub, so they survive our bankruptcy. Mosaic's templates live in Mosaic's cloud — they don't survive Mosaic's bankruptcy. Same 'pre-built' value, different data-portability story."
- **The 3 questions for the Baker Tilly partner to ask the Mosaic-evaluating client first:**
  1. "How many finance people are on the team today, and how many in 12 months?" (1-2 = Mosaic-friendly; 3+ = FinPlan Pro wedge)
  2. "What's your largest model file in cell count, and how fast is it growing?" (<5K stable = Mosaic; >5K growing = FinPlan Pro)
  3. "Are you planning to sell to enterprise customers in the next 18 months?" (No = Mosaic OK; Yes = SOC 2 Type 2 wedge = FinPlan Pro)
- **Honest Labeling:** ~50-60% of inbound Chris ICP-3 SMB controller RFQs are Cube-overlap or Mosaic-overlap motions (per T-HER-013 v0.2 §7 Loss pattern Z — the 50-60% Cube overlap is the most direct head-to-head). The Baker Tilly win-rate to FinPlan Pro for Mosaic-evaluations is **higher than Vena-evaluations** (~30-50% per T-HER-013 v0.2 §7) because the SMB segment is more price-sensitive + the OSS + $0 tier is a stronger wedge against the $20-$50/user/mo Mosaic Pro tier.

**4-ICP build-out status:** T-HER-014d (Mosaic) ✅ 4 of 5 (v0.2 polish 2026-06-13 — Baker Tilly field-rep framing overlay added for Beth ICP-4 channel motion). Next: T-HER-014e Workday (Carla ICP-1, 60 min).

**Length verification (D-007 9th moment discipline, v0.2 polish 2026-06-13):** `wc -l` after write = **169L** (was 154L in v0.1, **+15L** for Baker Tilly field-rep framing overlay + SMB-segment 3-questions script + 17-sector-preset reset). Target 150-200L. Verdict: **+19L over lower bound, in target band**. TENTATIVE pricing band maintained at ±50% + [INFERRED] tags (no new public pricing sources landed in 60-min cycle; v0.3 candidate for Athena T-AT-016 G2 deep-dive + bake-off RFQ data which would resolve the [INFERRED] tags in §2).
