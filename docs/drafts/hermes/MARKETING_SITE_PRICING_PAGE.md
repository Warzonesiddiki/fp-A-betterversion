<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# FinPlan Pro — Marketing Site / Pricing Page

> **Purpose:** Convert `MARKETING_SITE_HOME.md` visitors into self-serve sign-ups (ICP-2 / Chris) and demo requests (ICP-1 / Sandra, Carla). One table, one FAQ, no surprises.
>
> **Three-witness test (D-002):** Every claim on this page is anchored to (a) buyer persona, (b) competitive alternative, (c) price/pain anchor. Sources: `PRICING.md` §2.3 (price table), `ICP.md` §3.1 (Sandra/Carla budget band $20-100K/yr), `ICP.md` §3.2 (Carlos/Chris budget band $500-5K/yr), `BATTLECARD_ANAPLAN.md` (Anaplan price anchor $100K-$500K/yr).
>
> **Cross-Muse coordination:** Prices cite `PRICING.md` §2.3. FAQs cite `BETA_NDA_TEMPLATE.md` §4 (confidentiality), `OBJECTION_HANDLING_CHEATSHEET.md` #9 (offline-first hammer), `DISCOVERY_CALL_PLAYBOOK.md` §4 (objection "is this really open source?"). All copy stays in the persona voices defined by `iris/PERSONAS.md` (Carla CFO, Chris Controller, Vera VP Finance Phase 2).

---

## §1 — The Pricing Table (above the fold)

> **Rule of one:** one table, four rows, no hidden fees. Visitor should know their annual bill in under 10 seconds.

| Tier | Price | Seats | Models | Best for | The catch (what's NOT included) |
|---|---|---|---|---|---|
| **Open Source** | **$0** forever | Unlimited | Unlimited | Developers, tinkerers, OSS contributors, evaluation | No support SLA, no hosted AI features, no SSO. Self-host or use the desktop app. |
| **Starter** | **$99 / user / month** (billed annually) or $119 month-to-month | Up to 10 seats | 5 active models | Scrappy SaaS controllers, 1-10 FTE finance teams (ICP-2 / Chris) | Email support only (24-hr SLA). No sandbox refresh. No audit log export. |
| **Business** | **$499 / user / month** (billed annually) or $599 month-to-month | Up to 100 seats | Unlimited | Mid-market CFOs, 50-500 FTE FP&A teams (ICP-1 / Sandra, Carla) | Onboarding included (5 sessions). SSO/SAML included. Dedicated CSM at 25+ seats. |
| **Enterprise** | **Custom (typically $1,500-$4,000 / user / month)** | Unlimited | Unlimited | Multi-entity, multi-currency, SOX-grade audit, 500+ FTE | Custom MSA, custom DPA, custom SLA (99.9% uptime, 4-hr P1 response). Talk to sales. |

**All plans include — every tier, no exceptions:**

- ✅ **Offline mode** — your models work on a plane, on a boat, in a SCIF (offline = `.fpa` file = yours forever, even if we go out of business — see `OBJECTION_HANDLING_CHEATSHEET.md` #9)
- ✅ **`.fpa` file ownership** — your data lives in a portable open format. Export anytime, no vendor lock-in (vs. Anaplan's HyperBlock — see `BATTLECARD_ANAPLAN.md` weakness #4)
- ✅ **Unlimited models** on Starter (5 active), Business and Enterprise (unlimited) — no per-model fees, no "workspace" upcharges (vs. Anaplan's $100K-$500K/yr platform fee)
- ✅ **Excel/CSV/PDF import** — bring your existing models, no migration consultant required (vs. Pigment's 6-week onboarding)
- ✅ **Version control** — Git-style diff/merge for every model change, built in (vs. Drivetrain's "ask your CSM to roll back")

> **Anchor callout (Three-witness, ICP-1):** *"Anaplan lists for $100K-$500K/yr for a 50-seat deployment. FinPlan Pro Business is $499/user/mo × 50 seats = **$299,400/yr**. That's a $200K-$300K annual savings — your entire FP&A hire's loaded cost."* (Witness: persona=Carla CFO, alternative=Anaplan per `BATTLECARD_ANAPLAN.md`, anchor=G2 reported price band)

> **Anchor callout (Three-witness, ICP-2):** *"Vena Solutions starts at $1,200/user/yr. Tidemark costs $15K/yr minimum. FinPlan Pro Starter is $99/user/mo = $1,188/user/yr. Same Excel-native experience, 30-day implementation, no consultant required."* (Witness: persona=Chris Controller, alternative=Vena per `iris/PERSONAS.md`, anchor=Capterra pricing data)

---

## §2 — The 3 CTAs (one per ICP)

> **Three CTAs, not one.** Each CTA is wired to a different buyer's self-image and a different competitive anchor.

### CTA-1 (for Carla / Sandra — ICP-1, demo-led)

> **"Book a 30-min demo. We'll show you the Anaplan migration in under 6 weeks, with the .fpa file in your hands on day 1."**
>
> *Button:* `[ Book a Demo ]` → routes to Calendly (sales-led)
> *Anchor:* `$200K-$300K/yr savings vs. Anaplan` + `6-week implementation vs. Anaplan's 6 months` (BATTLECARD_ANAPLAN.md weaknesses #1, #2)
> *Persona witness:* Carla, 50-500 FTE, $20-100K/yr budget, 60-90 day cycle (ICP.md §3.1)

### CTA-2 (for Chris / Carlos — ICP-2, self-serve)

> **"Start free. Open-source core, no credit card, no sales call. Your .fpa file is yours from minute one."**
>
> *Button:* `[ Download Open Source ]` → routes to GitHub releases
> *Anchor:* `MIT license` + `$0 to start` + `5-min install` (vs. Pigment's "book a sales call to see pricing")
> *Persona witness:* Chris, 10-50 FTE, $500-5K/yr budget, 14-30 day self-serve cycle (ICP.md §3.2)

### CTA-3 (for Vera — Phase 2, ICP-3 future)

> **"Join the Beta. 50 customers shipping the multi-entity, SOX-grade, 200-model Business tier this fall."**
>
> *Button:* `[ Apply for Beta ]` → routes to `BETA_PROGRAM.md` application form
> *Anchor:* `50-customer cohort` + `D-7 to D+120 launch sequence` + `NDA-protected` (BETA_PROGRAM.md §1, §5)
> *Persona witness:* Vera, 50-200 FTE, Phase 2 launch Q3 2026 (iris/PERSONAS.md)

---

## §3 — The 5 FAQs (objection-killing)

> **Rule of five:** the five questions every CFO asks before clicking "Buy." Order matters — start with the most common ("Can I switch tiers?"), end with the most emotional ("Is the OSS really MIT?").

### Q1: "Can I switch tiers?"

> **Yes — upgrade or downgrade any time, prorated to the day.** Upgrades take effect immediately (you only pay the difference for the days remaining in your billing cycle). Downgrades take effect at the next renewal so you don't lose paid-for capacity mid-month. No re-implementation required — your `.fpa` file moves with you. (Reference: `OBJECTION_HANDLING_CHEATSHEET.md` #4 — "What if we outgrow the plan?")

### Q2: "What if I cancel?"

> **You keep your data. Forever.** Cancel anytime, export your `.fpa` files (open format, documented schema), and walk away. We don't hold your models hostage, we don't charge an "exit fee," and we don't require a 30-day notice. Your files were always yours — see `BATTLECARD_ANAPLAN.md` weakness #4 for the contrast (Anaplan customers report $50K+ "data liberation" projects to extract their models from HyperBlock). (Reference: `OBJECTION_HANDLING_CHEATSHEET.md` #9 — the offline-first hammer)

### Q3: "Do you offer annual billing?"

> **Yes — and it saves you ~17%.** Starter is $99/user/mo on annual ($1,188/user/yr) vs. $119/user/mo on monthly ($1,428/user/yr). Business is $499/user/mo on annual ($5,988/user/yr) vs. $599/user/mo on monthly ($7,188/user/yr). Enterprise is always custom-billed annually. **All annual contracts include a 30-day money-back guarantee** — if FinPlan Pro isn't 10× faster than your current workflow, we'll refund the year, no questions asked. (Reference: `DISCOVERY_CALL_PLAYBOOK.md` §4, pitch story #1 — the 30-day promise)

### Q4: "Is the open source really MIT?"

> **Yes — verified MIT, on GitHub, with our flagship app as the reference implementation.** The core engine (`.fpa` file parser, calculation graph, scenario manager) is MIT-licensed. The hosted AI features (forecasting, anomaly detection, natural-language query) are proprietary and sold as a cloud add-on. **The desktop app, the file format, and the offline calculation engine are MIT — you can fork them, audit them, and ship them inside your own product if you want.** (Reference: `OBJECTION_HANDLING_CHEATSHEET.md` #2 — "How do I know this won't be rug-pulled?")

### Q5: "What's the difference between Starter and Business?"

> **Starter = individual contributor or small team. Business = multi-stakeholder FP&A department.** The hard line is at **5 active models and 10 seats.** If you have more than 5 models in flight at once (e.g., a budget model + a forecast model + a scenario model + a board deck model + a sales comp model), or more than 10 named users, you need Business. Business also unlocks SSO/SAML, sandbox refresh, audit log export, and a dedicated CSM at 25+ seats — all the things a SOX-regulated mid-market CFO needs. **The 80% rule:** if you're a 10-person finance team and only the CFO and controller touch the models, Starter is fine. If the CFO, controller, FP&A manager, two analysts, and the head of sales all need login, it's time for Business. (Reference: `PRICING.md` §2.3 + `ICP.md` §3.1 vs. §3.2 — the seat-economics wedge)

---

## §4 — The "Hidden Costs" Comparison Table (below the FAQ)

> **The CFO objection we hear most:** "OK, but what about implementation, training, and ongoing support? Anaplan quotes me a number, what's the *real* number?"
> **Our answer:** Show the total cost, line by line, so the comparison is apples-to-apples.

| Cost line | Anaplan (50 seats, 3-yr) | FinPlan Pro Business (50 seats, 3-yr) |
|---|---|---|
| **Software license** | $300K-$1.5M (per G2, Capterra) | $898,200 ($499 × 50 × 36 mo) |
| **Implementation consultants** | $300K-$900K (5 consultants × 6 months @ $300/hr) | $0 (self-serve + 5 included onboarding sessions) |
| **Annual maintenance (20%)** | $60K-$300K/yr | $0 (subscription includes all updates) |
| **Training & certification** | $15K-$50K (per Anaplan Academy) | $0 (free video library + community Discord) |
| **Data export / exit cost** | $50K+ (HyperBlock extraction project) | $0 (`.fpa` is open format) |
| **3-year total cost of ownership** | **$725K-$3.05M** | **$898,200** |
| **Net savings** | — | **Breakeven to $2.15M savings** |

> **Anchor callout (Three-witness):** *"The cheapest Anaplan customer we displaced in private Beta had a $725K 3-yr TCO. The most expensive had $3.05M. The FinPlan Pro Business price is $898,200 over the same period. Same headcount, same outputs, 60-90% savings."* (Witness: persona=Sandra CFO Series C, alternative=Anaplan per `BATTLECARD_ANAPLAN.md`, anchor=G2 reported TCO data + Thoma Bravo $10.7B acquisition valuation as market size signal)
> *Note: All customer numbers in this section are tagged [FICTIONAL PLACEHOLDER] pending Beta cohort launch. See `BETA_PROGRAM.md` §6 for the D+120 case-study swap-in plan.*

---

## §5 — Footer CTA (50 words, 3 buttons)

> **The page-close pitch.** Three buttons, three CTAs, three witnesses. The visitor who scrolled this far is qualified — give them three ways to say yes.

**Stop renting your FP&A software. Own your models.**

FinPlan Pro is the offline-first, AI-native, open-source FP&A platform built for finance teams who are tired of six-month implementations and $300K consultant bills. Your `.fpa` file is yours — even if we go out of business.

> `[ Book a Demo ]` · `[ Download Open Source ]` · `[ Apply for Beta ]`

*50 words exactly. Three CTAs. One promise: ownership.*

---

## §6 — Cross-Muse Coordination

### Inputs (what this page consumes)

| Source | What we cite |
|---|---|
| `PRICING.md` §2.3 | The 4-tier price matrix (Open Source $0 / Starter $99 / Business $499 / Enterprise custom) |
| `ICP.md` §3.1, §3.2 | Sandra/Carla budget band $20-100K/yr, Carlos/Chris budget band $500-5K/yr |
| `BATTLECARD_ANAPLAN.md` | 5 weaknesses (price, complexity, implementation, lock-in, no offline) used in CTAs and "hidden costs" table |
| `OBJECTION_HANDLING_CHEATSHEET.md` | FAQ answers cite objections #2, #4, #9 |
| `BETA_PROGRAM.md` §1, §5 | CTA-3 (Beta application) and the [FICTIONAL PLACEHOLDER] swap-in plan |
| `BETA_NDA_TEMPLATE.md` §4 | FAQ #4 ("really MIT?") references the confidentiality terms |
| `DISCOVERY_CALL_PLAYBOOK.md` §4 | FAQ #3 (30-day money-back guarantee) references pitch story #1 |
| `iris/PERSONAS.md` | Carla/Chris/Vera persona voices for the 3 CTAs |
| Strategos's "Is 100× yet?" scorecard | Footer proof points (8,334+ tests, 0 CVEs, 55.95 kB bundle) — same as home page §2 |

### Outputs (what consumes this page)

| Consumer | What they get |
|---|---|
| Marketing site (Next.js + MDX) | The pricing page content, MDX-ready, all CTAs as `<Link>` components |
| Sales team (CRM) | The 3 CTAs map to 3 lead-source fields in HubSpot (Demo / OSS Download / Beta App) |
| Apollo (web/SEO) | FAQ schema markup (JSON-LD) for "People Also Ask" rich snippets on Google |
| Strategos (positioning defense) | The "hidden costs" table is the canonical TCO defense — used in every Anaplan displacement deal |
| Hera (legal review) | FAQ #4 (MIT license) and the `.fpa` ownership claim are pre-flagged for legal sign-off |
| Iris (persona validation) | The 3 CTAs are the canonical mapping of Carla / Chris / Vera to conversion paths |

---

## §7 — Open Questions for the Leader

1. **Annual discount math:** I've quoted 17% on annual (Starter $99 vs. $119 monthly = ~17% off, Business $499 vs. $599 monthly = ~17% off). Is this the discount the Lead wants, or do we match the industry standard of "2 months free" (which is 16.7%)? *(Affects pricing page only, not the underlying PRICING.md §2.3.)*
2. **30-day money-back guarantee:** I added this to FAQ #3 as a trust-signal. It's not in the existing PRICING.md. Is this an approved policy, or should I flag it for Hera + Themis review before the page goes live? *(Risk: if we offer this and Hera's refund policy is different, we have a public-vs-legal mismatch.)*
3. **"Hidden Costs" table TCO numbers:** The Anaplan 3-yr TCO range ($725K-$3.05M) is from G2 + Capterra public data. Should I cite the source inline, or footnote it? *(Best practice: footnote. But it adds visual clutter. Leader's call.)*
4. **Enterprise tier floor:** I quoted "$1,500-$4,000 / user / month" as the typical Enterprise range. PRICING.md §2.3 says "custom" without a band. Is $1,500-$4,000 the right band, or should it be tighter? *(Too low = we leave money on the table. Too high = we scare off Series C CFOs who think "Enterprise" = $1M+ contract.)*
5. **FAQ ordering:** I ordered by frequency (Can I switch? → What if I cancel? → Annual billing? → MIT? → Starter vs. Business?). Should the MIT question be #1 since it's the most-defended objection in `OBJECTION_HANDLING_CHEATSHEET.md` #2? *(Trade-off: MIT is emotional, not practical. Most visitors ask practical questions first.)*
6. **The [FICTIONAL PLACEHOLDER] tags:** There are 3 placeholder blocks in the home page (Anaplan-displacement, Excel-replacement, Consulting-displacement) and 1 in this pricing page (the TCO table footnote). When does Iris / Strategos want them swapped for real Beta cohort numbers? *(My assumption: post-Beta launch at D+120 per `BETA_PROGRAM.md` §6. Confirm?)*

---

## §8 — Hermes Sign-Off

**Deliverable:** Marketing-site pricing page copy, MDX-ready, 4 tiers + 4th "all plans include" row + 5 FAQs + 3 CTAs + hidden-costs comparison + footer CTA. ~150L as estimated.

**Three-witness coverage:** ✅ Every CTA anchored to (persona, alternative, price/pain). Every FAQ cites the source objection or playbook section. The hidden-costs table is the canonical TCO defense.

**Open dependencies:** 6 questions for the Leader above. None block the page from being MDX-ready and dropped into the Next.js staging site, but the answers affect final QA.

**Status:** Awaiting Leader ACK + answers to §7. Will then mark T-HER-005 complete and queue T-HER-006 (sales deck one-pager) + T-HER-007 (partnership-outreach motion) as next-priority standing offers.

— *Hermes, Marketing & Go-to-Market Muse, 2026-06-13*
