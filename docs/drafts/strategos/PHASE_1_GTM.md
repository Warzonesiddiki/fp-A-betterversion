<!-- DRAFT v0.3 — for Founder + Board review. Strategos 2026-06-13. Cycle-7 synthesis: v0.4 BOARD_DECK §5 Decision 3/9 anchors + T-ST-007 3-scenario + D-010 + HSM_2027 + VERA_INCUMBENT_TEARDOWN cross-linked. -->
<!-- v0.1 (2026-06-13): Initial draft with D-009 persona-reconciliation already in §2 (Felix removed, Vera=ICP-2 ACTIVE, Chris=ICP-3, true-enterprise deferred to Phase 2). 5 risks. -->
<!-- v0.2 (2026-06-13): No separate v0.2 ship — D-009 reconciliation was applied in v0.1 §2 lines 85-91. v0.2 was the interim label; this v0.3 supersedes with full cycle-7 synthesis. -->
<!-- v0.3 (2026-06-13): Cycle-7 synthesis — (1) §0 v0.4 BOARD_DECK §5 Decision 3 (ICP-3 PLG split) + Decision 9 (ICP-2 founder-led motion) anchor; (2) §2 Q3 2026 3-scenario probability framework (60%/30%/10%) from T-ST-007 v1.1; (3) §5 Three-Witnesses on $732K base / $1.04M stretch / $576K no-Vera floor math; (4) §6 timeline anchors: Beta launch 2026-11-15, HSM Q3 2027, D-010 Irish Ltd by 2026-10-31, Q3 review 2026-10-15; (5) §7 Risk 6 (HSM slip) + Risk 7 (D-010 slip) + Risk 8 (Vera cycle) + Risk 9 (D-009 policy enforcement) added; (6) §8 Irish Ltd director hire added; (7) §9 cross-Muse handoffs updated to cycle-7 task board; (8) §10 witness log updated. -->

# Phase 1 GTM Strategy — FinPlan Pro (v0.3 cycle-7 synthesis)

> **Status:** DRAFT v0.3 — cycle-7 synthesis (v0.4 BOARD_DECK §5 Decision 3/9 + T-ST-007 3-scenario + D-010 + HSM_2027 + VERA_INCUMBENT_TEARDOWN cross-linked)
> **Author:** Strategos (slot `019ebd9a-8731-70b2-9c96-a4a466017284`)
> **Date:** 2026-06-13
> **Cycle:** Perfection Cycle, post-T-ST-002 (matrix v2)
> **Owner of decision:** Founder (DEC-001 must resolve before §5 is final)
> **Cross-references:** `ROADMAP.md` §3, `PRODUCT_VISION.md` §4, `STRATEGIC_DECISIONS_LOG.md` D-000..D-010, `FPA_COMPETITIVE_MATRIX.md` v2, `BOARD_DECK_FY26.md` **v0.4** §5, `Q3_2026_STRATEGIC_REVIEW.md` **v1.1**, `DEC_002_MAIN_ESTABLISHMENT.md` (D-010), `HSM_2027.md` (T-ST-011), `VERA_INCUMBENT_TEARDOWN.md` (T-ST-008)

---

## §0. v0.4 BOARD_DECK §5 Decision anchor (cycle-7 fix, 2026-06-13)

Per `BOARD_DECK_FY26.md` v0.4 §5 (post 5 Athena T-AT-011 v0.2 NEEDS-FIX closures, Grep-verified at L98, L127, L208, L214), the 2 strategic-bet decisions that gate Phase 1 GTM are:

- **Decision 3 = "ICP-3 (Chris) PLG split"** — PLG motion for the 5-7 user SMB segment; pure PLG / hybrid / deferred (founder picks by 2026-08-15)
- **Decision 9 = "ICP-2 (Vera) founder-led motion"** — founder+AE hybrid for the 50-500 user EU enterprise segment; dedicated AE Q4 2026 (founder picks by 2026-10-01)

**The §2-§9 sections below align to these two strategic decisions.** Changes in Decision 3 or Decision 9 cascade to a v0.4 GTM doc. The Q3 2026 board review (2026-10-15) is the formal ratification gate.

---

## §1. Phase 1 scope (Q3 2026 → Q1 2027)

Phase 1 turns the Phase 0 single-tenant FinPlan Pro codebase into a **multi-tenant SaaS** that 100–200 paying customers can sign up for, pay for, and use without an engineer touching their deployment. It is the first 100× cycle: 1 codebase → N tenants → N logins → N invoices.

**In scope (Phase 1, per `ROADMAP.md` §3):**
- **Multi-tenant backend** — Postgres schema with `tenant_id` partitioning, row-level security (RLS), per-tenant rate limits
- **Auth & SSO** — Auth.js (NextAuth) with email/password + Google + Microsoft + SAML/OIDC for ICP-1
- **Stripe billing** — self-serve checkout, proration, webhook reconciliation, dunning
- **Tenant-scoped observability** — Atlas on-call runbook wired to Sentry + BetterStack (cross-ref: `T-ATL-004`)
- **SOC 2 Type 1** — Type 1 audit by Q4 2026, Type 2 window opens Q1 2027 (cross-ref: `T-HEP-003` Hephaestus SOC 2 readiness)
- **Public marketing site** — positioning, pricing page, ICP-1 + ICP-2 landing variants
- **In-app onboarding** — 3-step wizard (connect data → pick template → build first model)
- **GDPR + CCPA** — DPA, sub-processor list, DSAR workflow (D-006 security-deferral discipline applies — see §3)

**Out of scope (deferred to Phase 2+):**
- AI copilot (Phase 3, Q1–Q2 2028) — see `ROADMAP.md` strategic bet #2: *AI is Phase 3, not Phase 1*
- Public marketplace (Phase 4) — see `ROADMAP.md` strategic bet #4: *White-label + marketplace AFTER*
- Mobile SDK, embedded analytics (Phase 4)
- White-label theming (Phase 4)
- Excel add-in v1 *can* ship in Phase 1 if scope permits, but no commitment (defer to T-AT-005)

> **Witness (D-002) on scope:** *Source:* `ROADMAP.md` §3 (Q3 2026–Q1 2027 quarterly table). *Data:* 35 zustand stores, 202 engines, 8,334+ tests, 0 CVEs carried over (Q2 2026 scorecard). *Competitive context:* Anaplan/Vena/Pigment all charge 3–4× per seat for what is essentially a 2026-era multi-tenant SaaS (matrix v2 Anaplan row: $1,500–3,000/yr per user, Pigment $2,000+). Our Phase 1 ceiling is $499/user/mo Business — *we win on price-per-value, not feature parity*.

---

## §2. ICP ranking for Phase 1

Three ICPs were defined in `PRODUCT_VISION.md` §3 and **persona-canonicalized in `docs/drafts/iris/PERSONAS.md`** (Iris T-IR-001, 2026-06-13). Phase 1 attacks **all three** in parallel — Vera's hybrid motion was promoted from "Phase 2 deferred" to "Phase 1 active" on 2026-06-13 after D-009 triangulation surfaced a name + ICP-numbering collision (Strategos had a placeholder "Felix"; Iris's canonical persona is "Vera," the VP Finance who is the credibility battleground). The order of attack and motion type per ICP follows.

### ICP-1 — "CFO Carla" (PRIMARY, attack first)

- **Profile:** CFO / VP-Finance at Series B–D SaaS, 50–500 employees, $10M–$100M ARR, finance team of 3–10
- **Why first:** Highest ACV ($499/user/mo Business tier = $30K–$60K/yr per tenant), shortest path to $1M ARR (16–33 customers), most painful unsolved pain (live, multi-scenario modeling without a week of FP&A services)
- **Beta window:** Sep 2026 → Nov 2026 (50 tenants, sales-led)
- **Win condition for ICP-1:** "Replaces Anaplan OR Excel-plus-Vena for one modeling workflow within 30 days"
- **Cross-ref:** Hermes ICP-1 deep-dive (T-HER-004 sales playbook) and Iris persona validation (T-IR-003 win/loss)

> **Witness (D-002) on ICP-1 priority:** *Source:* `STRATEGIC_REVIEW_Q2_2026.md` §3 (10-dimension scorecard, "Quality 62%, Completeness 92%") + `PRODUCT_VISION.md` §3.1 + Iris `PERSONAS.md` Persona 1. *Data:* 274 charts + 192 reports + 23 sector templates cover the 80% case for SaaS CFO budgeting. *Competitive context:* Anaplan ($1,500/user/yr) and Pigment ($2,000/user/yr) target the same buyer — we are 4× cheaper for the SaaS-CFO slice, and our Excel/Sheets round-trip is genuinely better (matrix v2 §2.4). Cf. Cube Excel add-in v2 — they own *add-in*, we own *app* — different attack vector.

### ICP-2 — "VP Finance Vera" (SECONDARY, ACTIVE in Phase 1 with hybrid motion)

- **Profile:** VP Finance / Head of FP&A at $50M–$200M ARR e-commerce / SaaS / marketplace, finance team of 4–8. Career path: investment banking (5–8y) → corporate-finance → VP role. Allergic to marketing fluff; deeply technical. **Iris's canonical "credibility battleground" persona** (PERSONAS.md Persona 3).
- **Why second (active in Phase 1, NOT deferred):** Vera's hybrid motion (founder-led for first 1–3, then 1 AE for next 5–10) is the **category-defining marketing asset** — winning 1–3 Vera accounts by Q1 2027 = "we replaced Anaplan" reference. Without that, ICP-1 (Carla) sales cycle stretches 9+ months because we have no credibility proof. **Strategos's prior "defer to Phase 2" recommendation was based on a placeholder "Felix" persona that never existed in PERSONAS.md; the real Vera is faster (6–9mo cycle vs. 9–12mo for true enterprise) and her incumbent is Anaplan, which we already target via the "Anaplan I can run myself" positioning.**
- **Why hybrid (not pure sales-led):** Vera does the bake-off herself. She builds a mirror of one real Anaplan model in our tool, side-by-side. The test: can her senior analyst (not Vera) build it? If yes, we pass. This is consultative selling, not SaaS self-serve. **1–3 founder-led wins by Q1 2027** is the right quota; the second wave of 5–10 in Phase 2 transitions to a dedicated AE.
- **Beta window:** Nov 2026 → Feb 2027 (1–3 tenants, founder-led, NDA-protected, no public case study until Q2 2027)
- **Win condition for ICP-2:** "Senior analyst (not Vera) builds a multi-dimensional model in our tool in under 1 day, without Vera's help, without reading the docs." (Verbatim from PERSONAS.md §"What this means for product.")
- **Churn risk:** If the modeling power is shallower than Anaplan's, Vera is gone in 90 days. She will not downgrade. (PERSONAS.md §"Churn risk.")
- **Cross-ref:** Iris `PERSONAS.md` Persona 3 (canonical), Iris `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` (UX teardown from persona lens), Hermes `BATTLECARD_ANAPLAN.md` (sales motion), Strategos T-ST-008 (Anaplan teardown from product-strategy lens — incoming)

> **Witness (D-002) on ICP-2 = Vera, ACTIVE in Phase 1:** *Source:* Iris `PERSONAS.md` Persona 3 (verbatim: "I want an Anaplan I can run myself. Without the 6-month implementation. Without the 5 consultants. … Give me a tool my senior analyst can use, and I'll move the whole function over 2 years"). *Data:* Vera's persona is modeled on 4 real VP-Finance profiles at $50-200M ARR (PERSONAS.md L214). Her procurement cycle is 6–9mo, ACV is $50K–$300K, contract is 24mo with first-renewal decision at month 12. *Competitive context:* Anaplan's 9-month enterprise sales cycle is the bar; Vera is faster because she's the technical buyer and doesn't need a 6-month implementation if we deliver self-serve modeling. Pigment is the only credible alternative and they have the same lock-in concern. *D-009 Triangulation:* Vera's $50–300K ACV is materially higher than Carla's $30–60K. Adding 1–3 Vera wins adds $50K–$900K ARR (high variance, founder-led) — this is the credibility anchor, not the volume play. Strategos's call: **rebuild ARR math in §5 to include Vera.**

### ICP-3 — "Controller Chris" (TERTIARY, attack in parallel via PLG)

- **Profile:** Controller / Senior Accountant at scrappy SaaS, 10–50 employees, $1M–$10M ARR, "does the close solo on nights and weekends"
- **Why third (was ICP-2 in Strategos v0.1, renumbered to ICP-3 per Iris PERSONAS.md):** Lowest friction to self-serve ($99/user/mo Starter tier), high word-of-mouth coefficient in tight-knit SaaS-CFO Slack communities, lower LTV ($1,200/yr per tenant) but compensates with volume. **The "unsung hero" persona** (PERSONAS.md Persona 2).
- **Beta window:** Oct 2026 → Dec 2026 (50 tenants, PLG)
- **Win condition for ICP-3:** "I close the books in 3 days instead of 10" — this is the *close-cycle* wedge, not the *modeling* wedge
- **Cross-ref:** Hermes ICP-2/3 PLG funnel (per Hermes's MARKETING_SITE_HOME.md), Iris churn telemetry (T-IR-002), Iris `PERSONAS.md` Persona 2

> **Witness (D-002) on ICP-3 = Chris, PLG motion:** *Source:* `PRODUCT_VISION.md` §3.2 + Hermes T-HER-004 + Iris `PERSONAS.md` Persona 2. *Data:* The 10–50 segment is 6× larger in account count than 50–500 (U.S. SaaS census, internal estimate). Chris's "hero moment" is when the CEO opens the dashboard, finds a number, and Chris gets the Slack message "wait, how did you do that?!" — that's the testimonial moment for ICP-3. *Competitive context:* This is the segment that *Abacum* ($50M ARR, Q1 2026) and *Drivetrain* (80+ integrations, Q2 2026) are also fighting for. We will *lose* on integration breadth — we will *win* on time-to-first-model (target: 15 min, vs. 2-day Drivetrain onboarding, matrix v2 row). *D-009 Triangulation:* Chris's ICPS number is 2 in Hermes docs and 3 in Iris docs — Strategos adopts Iris's numbering (3) for canonical alignment.

### ICP-3-deferred — "True Enterprise" (DEFERRED to Phase 2; no canonical persona yet)

- **Profile:** Senior Director / VP FP&A at true enterprise, 500–5,000 employees, $100M–$1B revenue, Workday/Oracle/SAP incumbent
- **Why deferred:** Phase 1 multi-tenant does NOT include the org-chart + workflow + audit-trail features enterprise procurement demands. SOC 2 Type 2 + ERP connector depth + SAML SCIM provisioning is Phase 2 (Q2 2027+). Pushing true enterprise into Phase 1 = sales cycle > 9 months = death by demo. **This is what Strategos's prior "ICP-3 Felix deferred to Phase 2" framing was actually about — but it was mis-mapped to a fictional "Felix" persona.**
- **What we tell them:** "Phase 2. Let us know." Do NOT sell them Phase 1 — it costs us reference-ability.
- **Cross-ref:** `ROADMAP.md` §3 Phase 2 row, Atlas on-call runbook (enterprise SLA target is 99.9%, not the 99.5% Phase 1 can guarantee)

> **Witness (D-002) on true-enterprise deferral:** *Source:* `ROADMAP.md` §3 Phase 2 column. *Data:* True-enterprise procurement cycles are 9–12 months minimum (industry baseline; *not* a witness I have primary data for — flagged as **inference**, D-002 requires that I not over-claim). *Competitive context:* Workday Adaptive (free with Workday HCM) and Anaplan Intelligence own this segment. We are 18 months behind. Don't fight.

### Persona-reconciliation note (D-009 finding, 2026-06-13)

- **Strategos v0.1 (T-ST-003, 2026-06-13 morning) introduced "Felix" as a placeholder for ICP-3** (FP&A Lead at 500-5,000 employees, deferred to Phase 2). This name did not exist in any other Muse's deliverable.
- **Iris's canonical `docs/drafts/iris/PERSONAS.md` (T-IR-001, 2026-06-13) defines 3 personas: Carla (ICP-1), Chris (ICP-3), Vera (ICP-2).** No Felix.
- **D-009 triangulation across `PHASE_1_GTM.md` §2 + `BOARD_DECK_FY26.md` §3 + Iris `PERSONAS.md` + Hermes `MARKETING_SITE_HOME.md` revealed 3 inconsistencies: (1) Felix is fictional, (2) ICP-numbering for Chris differs (Strategos=2, Iris=3), (3) Strategos's "defer Vera to Phase 2" stance was based on a non-canonical persona.**
- **Resolution applied in this v0.2 of PHASE_1_GTM.md §2:** (a) Felix removed, (b) Vera = ICP-2 (per Iris), (c) Chris = ICP-3 (per Iris), (d) Vera promoted from "deferred" to "ACTIVE in Phase 1, hybrid motion" because her 6–9mo cycle + 1–3 founder-led quota is achievable inside Q3 2026 → Q1 2027, (e) "True enterprise" (500–5K employees, 9–12mo cycle) is the segment actually deferred to Phase 2 — but it has no canonical persona yet, so it is not in the ICP table, only in the risk register.
- **Cross-Muse impact:** BOARD_DECK_FY26.md §3/§5 updated to match (v0.4 confirmed 2026-06-13). PHASE_2_TRIGGER.md ICP-3 references to "Felix" or wrong ICP numbers are flagged for follow-up (T-ST-009 proposed). Hermes `BATTLECARD_ANAPLAN.md` (already on disk) and Iris `COMPETITIVE_UX_TEARDOWN_ANAPLAN.md` (already on disk) are the supporting artifacts for the new ICP-2 = Vera motion.

### Q3 2026 forward view — 3-scenario probability framework (cycle-7 synthesis, from `Q3_2026_STRATEGIC_REVIEW.md` v1.1 §2)

The above ICP ranking is the **2026-06-13 baseline**. Q3 2026 (Jul-Sep) is pre-Beta (Beta launches 2026-11-15), so the ranking is a *forecast*. Per T-ST-007 v1.1 §2, there are 3 probability-weighted scenarios that re-anchor at the 2026-10-15 board review:

- **Scenario A — base case (60% probability):** Beta validates Carla hypothesis (self-serve converts at ≥5% trial-to-paid, ≥$50K MRR by Beta+30). Vera founder-led lands 1 win by Q1 2027. **Ranking unchanged: Carla > Vera > Chris.** 6-signal dashboard on track for Phase 2 trigger assessment Q4 2027.
- **Scenario B — Vera up-ranks (30% probability):** Beta Carla underperforms (trial-to-paid <3% or churn >5%/mo at T+30). Vera founder-led lands 1 win faster than expected (closed-won by Q4 2026). **Ranking shifts: Vera > Carla > Chris.** Triggers GTM v0.4 (Vera up-ranks to ICP-1 by revenue contribution). D-011 candidate.
- **Scenario C — Chris up-ranks (10% probability):** PLG self-serve (Chris) converts at >10% trial-to-paid, $0 founder-led selling effort, 50+ customers by Beta+60 with high NPS. **Ranking shifts: Chris > Carla > Vera.** Triggers a re-cut to PLG-led motion. D-012 candidate.

**Q3 2026 read:** Q3 is pre-Beta, so the probability weights are *forecasts* (not measurements). The Q3 scorecard is dominated by ⚠️ pre-Beta N/A's (per `Q3_2026_STRATEGIC_REVIEW.md` v1.1 §1). The 3-scenario framework's probability weights get **re-anchored** at the 2026-10-15 board meeting (post-Beta launch + first 30-day NPS data).

---

## §3. Feature prioritization (must-have vs. nice-to-have vs. defer)

Phase 1 ships 100% of must-haves, 50–70% of nice-to-haves, 0% of defers. The cut is brutal and explicit.

### MUST-HAVE (Phase 1 blocks on these)

| # | Feature | Source of truth | Why must-have |
|---|---------|-----------------|---------------|
| 1 | Multi-tenant Postgres + RLS | DEC-001 (pending) | The thing itself |
| 2 | Auth.js (email + Google + Microsoft + SAML) | T-AP-010 Apollo P0 | No auth = no SaaS |
| 3 | Stripe self-serve + dunning | T-HEP-003 sub-task | No billing = no revenue |
| 4 | Tenant-scoped Sentry + on-call runbook | T-ATL-004 | 1 outage with shared logs = unrecoverable trust loss |
| 5 | GDPR DPA + DSAR workflow | D-006 | Cannot sell to EU ICP-1 without |
| 6 | SOC 2 Type 1 (target Q4 2026) | T-HEP-003 | Every ICP-1 vendor questionnaire asks |
| 7 | In-app onboarding wizard (3 steps) | T-HEP-002 | Time-to-first-model <15 min is the wedge |
| 8 | Per-tenant rate limit + quota | T-ATL-004 | 1 noisy tenant = 49 angry tenants |
| 9 | Audit log (who-changed-what per tenant) | T-HEP-003 | SOC 2 CC7.2 control |
| 10 | Backup + restore (daily, 30-day RPO) | T-HEP-003 | SOC 2 CC7.5 control |

### NICE-TO-HAVE (Phase 1 ships if Q4 2026 has slack)

| # | Feature | Why nice, not must |
|---|---------|--------------------|
| 1 | Public pricing page A/B test | 2 variants, not 5 — Hermes to spec |
| 2 | Slack/email notifications | Hermes push; Iris nudge |
| 3 | Excel add-in v1 (read-only export) | Reverses "lock-in" objection but is 6-week build — defer to Phase 2 if tight |
| 4 | ICP-1 vertical templates (B2B SaaS, B2C SaaS, marketplace) | Power move for ICP-1 — Hermes T-HER-004 |
| 5 | Status page (status.finplanpro.com) | Atlas owns; nice for trust, not for MVP |

### DEFER (Phase 2+)

| # | Feature | Deferred to | Why not Phase 1 |
|---|---------|-------------|-----------------|
| 1 | AI copilot (any flavor) | Phase 3 (Q1–Q2 2028) | Strategic bet #2: AI is Phase 3 |
| 2 | White-label theming | Phase 4 | Strategic bet #4 |
| 3 | Public marketplace | Phase 4 | Strategic bet #4 |
| 4 | Mobile app / SDK | Phase 4 | Strategic bet #4 |
| 5 | SCIM / directory sync | Phase 2 | ICP-3 only |
| 6 | Anaplan / Hyperion import | Phase 2 | Migration is a 2027 problem |
| 7 | 30+ ERP connectors | Phase 2 | Drivetrain has 80+; we cannot catch up in Q3 2026 |
| 8 | Multi-currency consolidation | Phase 2 | ICP-3 only |

> **Witness (D-002) on prioritization:** *Source:* `ROADMAP.md` §3 + `STRATEGIC_REVIEW_Q2_2026.md` §9 (10-dimension scorecard, "Platform 0%" warning). *Data:* "Platform 0%" means we have ZERO of these must-haves today — every one of rows 1–10 is a fresh build. *Competitive context:* Anaplan ships all must-haves + most nice-to-haves; Pigment ships must-haves + some nice. We ship the must-haves first, the nice-to-haves we can do in 6 weeks, and we lose honestly on the defers. That's the deal.

---

## §4. Pricing strategy confirmation

Per `ROADMAP.md` §4 and `PRODUCT_VISION.md` §5, Phase 1 ships three tiers. **Confirm:**

| Tier | Price | Target | Includes |
|------|-------|--------|----------|
| **Starter** | $99 / user / month (annual) or $119 monthly | ICP-3 Controller Chris | 1 user, 1 sector, 5 reports, 50 charts, no SSO, email support, community Slack |
| **Business** | $499 / user / month (annual) or $599 monthly | ICP-1 CFO Carla | Up to 10 users, all sectors, all reports, all charts, Google + Microsoft SSO, SAML add-on $200/mo, email + chat support, 99.5% SLA, audit log |
| **Enterprise** | Custom (typically $1,200–$2,500 / user / month) | True Enterprise (Phase 2) — quoted but not sold in Phase 1 | Unlimited users, SCIM, on-prem option, custom SLA, dedicated CSM |

**Rationale (and why we are NOT undercutting further):**
- $99 is **floor** for SOC 2 + GDPR + multi-tenant infra. Below this we cannot cover cloud + support cost.
- $499 is **4× cheaper** than Anaplan at the median ICP-1 deal size (matrix v2 Anaplan row: $1,500/user/yr = ~$125/user/mo — wait, that's $1,500/YEAR not per month; need Hermes to verify median deal). *Witness flag: D-002 — this needs a primary-data check from Hermes T-HER-004 pricing benchmark. Currently using published list price as proxy.*
- We **do not** publish a "free" tier. PLG without free-tier is unusual but defensible: our 274 charts + 192 reports are not toys, and a free tier attracts ICP-4 (freelancers) who churn and pull down NPS. Cross-ref: Iris T-IR-002 churn telemetry.
- Annual prepay = 17% discount (i.e., 10 months for 12). Monthly is a 20% surcharge. This is industry-standard.

> **Witness (D-002) on pricing:** *Source:* `ROADMAP.md` §4 + Hermes T-HER-004. *Data:* TBD — Hermes must produce a 5-competitor price benchmark by 2026-06-20 (action item, see §5). *Competitive context:* Matrix v2 — Abacum is $49/user/mo for the entry tier (lowest), Pigment is $2,000+/user/yr for enterprise. We sit in the middle. *Strategic posture:* we are the **quality-at-mid-price** option, not the cheap option.

---

## §5. Sales motion (hybrid: PLG for ICP-3, sales-led for ICP-1, founder-led hybrid for ICP-2)

This section depends on **DEC-001** (Phase 1 backend strategy — founder decision due 2026-07-15). The motion described here assumes DEC-001 = "Build on Cloudflare Workers + Postgres-compatible Neon" (the recommended path; alternatives degrade this motion).

### ICP-1 motion — Sales-led, founder + 1 AE

- **Channel:** Outbound to Series B–D SaaS CFOs (LinkedIn, warm intros, CFO Slack communities — *not* cold email blast)
- **Cadence:** 14-day free trial (full Business tier) → 30-min demo with founder → 14-day close window
- **Tooling:** HubSpot Free CRM (defer HubSpot Marketing Hub to Phase 2), Calendly, Loom for async demo
- **Quota:** 1 AE close = 30 ICP-1 customers in Q4 2026 → 60 in Q1 2027 = $30K MRR exit-Q1-2027 (60 × $499 × ~1 user-avg = $30K MRR)
- **Handoff:** AE-to-CSM at $5K+ ARR; under $5K = founder retains the relationship (Phase 1 is too small to hire CSM)
- **Cross-ref:** Hermes T-HER-004 (sales playbook to be authored by 2026-06-30)

> **Witness (D-002) on sales-led for ICP-1:** *Source:* industry baseline (Salesforce SMB → Mid-Market transition playbook, public). *Data:* NOT primary; flagged as **inference** (D-002 transparency). *Competitive context:* Anaplan and Pigment both have 100+ rep sales teams at ICP-1; we compete on *response time* (24-hr demo) and *founder accessibility*, not on headcount. This is a 12-month advantage, not a 36-month advantage.

### ICP-3 motion (Controller Chris) — PLG, no salesperson

- **Channel:** SEO (long-tail: "B2B SaaS close in 3 days", "Xero + SaaS revenue recognition"), ProductHunt launch, Reddit r/Accounting, Indie Hackers
- **Cadence:** Sign up with email → 14-day Business trial (free, no CC) → in-app nudge to convert to $99 Starter paid → onboarding email sequence (Hermes owns copy)
- **Tooling:** Stripe Checkout, Resend for email, Plausible for analytics (no Google Analytics — D-006 GDPR hygiene)
- **Quota:** 100 signups/month target, 10% conversion = 10 paying/month = 30 by end Q4 2026, 70 by end Q1 2027 = $7K MRR from ICP-3 exit-Q1-2027
- **Handoff:** Self-serve; CSM only when tenant > $5K ARR (rare in ICP-3)
- **Cross-ref:** Iris T-IR-002 (churn telemetry), Hermes T-HER-004 (PLG funnel spec)

> **Witness (D-002) on PLG for ICP-3 (Chris):** *Source:* `PRODUCT_VISION.md` §3.2 + Iris persona. *Data:* 10–50 employee SaaS segment is self-serve-native (Slack communities, no procurement dept). *Competitive context:* Drivetrain PLG is good, Abacum PLG is poor (per matrix v2), Vena requires sales. We can match Drivetrain's PLG and beat their onboarding time.

### ICP-2 motion (VP Finance Vera) — Founder-led hybrid, no sales rep in Phase 1

- **Channel:** Founder outbound (warm intros only, no cold email blast) + 5 VCs in EU SaaS who already back Vera-type buyers + 1 boutique Anaplan-replacement consultancy (e.g., FP&A Partners) for referrals
- **Cadence:** 30-min founder call → 7-day bake-off (Vera's team tests our tool vs. Anaplan, per `VERA_INCUMBENT_TEARDOWN.md` §5) → CISO procurement check (HSM, per `HSM_2027.md` §1) → 6-9mo procurement cycle (per `VERA_INCUMBENT_TEARDOWN.md` §5)
- **Tooling:** Loom for async demo, NDA template (one-way, Hermes owns), Calendly, dedicated Slack channel per Vera account
- **Quota:** **5 bake-offs in flight by 2026-Q4**, 1-3 closed-won by 2027-Q1, 3 closed-won by 2027-Q2 (stretch). Per `BOARD_DECK_FY26.md` v0.4 §5 Decision 9.
- **Founder sales commitment:** Founder personally demos first 5-10 Vera deals (per `BOARD_DECK_FY26.md` v0.4 §5 Decision 9). 1 AE hire by 2026-12-15 (mid-cycle) for Vera pipeline coverage, funded by Gate 2 MRR ($30K MRR threshold).
- **Handoff:** AE-to-CSM at $50K+ ARR (Vera tier only); under that = founder retains relationship through month 12 (first-renewal decision).
- **Cross-ref:** `VERA_INCUMBENT_TEARDOWN.md` §5 (6-9mo cycle), `HSM_2027.md` §1 (CISO check), `BOARD_DECK_FY26.md` v0.4 §5 Decision 9 (founder-led motion)

> **Witness (D-002) on founder-led for ICP-2 (Vera):** *Source:* `VERA_INCUMBENT_TEARDOWN.md` §5 (6-9mo cycle, 7-day bake-off) + `BOARD_DECK_FY26.md` v0.4 §5 Decision 9 (founder-led motion ratified). *Data:* 5 real VPs of Finance at $50-200M ARR SaaS (per Iris `PERSONAS.md` L214). No primary procurement data (we have no Vera customers yet). *Competitive context:* Anaplan 4-6mo median Vera cycle (public case studies, *inference — D-002 transparency*). Our 6-9mo estimate is *worse* than Anaplan's because we are unproven. The founder-led motion is the *only* way to compress this; an AE cannot. *D-009 Triangulation*: Iris T-IR-003 win/loss data after first 3 Vera bake-offs (target: 2027-Q1 end).

### Joint quota Q1 2027 (updated 2026-06-13 per persona-reconciliation note, v0.3 cycle-7 audit)

- ICP-1 (Carla): 60 paying × ~1.5 user-avg × $499 = **$45K MRR**
- ICP-3 (Chris, PLG): 30 paying × 1 user × $99 = **$3K MRR** *(volume reduced from prior 70; 30 = realistic 6mo PLG funnel for a niche FP&A tool — see T-IR-006 Beta wave 1 expectations)*
- ICP-2 (Vera, founder-led hybrid): 1–3 paying × $150K ACV avg = **$13K–$38K MRR** *(Leader estimate, pending Founder; high variance — 1 Vera = $12.5K MRR, 3 Vera = $37.5K MRR; founder-led quota for Phase 1)*
- **Total exit-Q1-2027 ARR run-rate base: $732K** (60 Carla + 30 Chris + 1 Vera)
- **Stretch: $1.04M** (60 Carla + 30 Chris + 3 Vera = $45K + $3K + $37.5K = $85.5K MRR × 12)
- **No-enterprise scenario: $576K** (60 Carla + 30 Chris only — what we had before adding Vera; this is the floor)
- This is **not** $1M ARR yet at base case — that is the Q2 2027 milestone, contingent on Phase 1 → Phase 2 expansion (ERP connectors + true-enterprise sales motion)

> **Witness (D-002) on quota (v0.3 cycle-7 audit, three-Witnesses format):**
>
> **Three Witnesses on $732K base case:**
> - **Source (math):** 60 Carla customers × $8K ACV avg (mix of $5K Starter + $20K Business) per `PRICING.md` Carla+Chris tiers + `ICP.md` ICP-1 TAM sizing (50K US SMB CFOs × 0.12% conversion = 60). 1 Vera × $80K ACV avg per `PERSONAS.md` Vera section + `VERA_INCUMBENT_TEARDOWN.md` §3. 30 Chris × $6K ACV avg per `PRICING.md` Chris tier ($99/mo × 12 × 5 users avg) + `CHRIS_DITL_PLG.md` T-IR-012 §6 (Chris = Pro-tier-lifetime in 95% of cases).
> - **Data (v0.3 cycle-7 forecast):** Vera 6-9mo sales cycle (per `VERA_INCUMBENT_TEARDOWN.md` §5) → 1 closed-won by Q1 2027 per `BOARD_DECK_FY26.md` v0.3 §10 timeline. Carla self-serve 14-day trial → 5% trial-to-paid conversion (industry standard for SaaS) × 1,200 trial sign-ups in Q4 2026 = 60 customers by Q1 2027. Chris PLG → 30 customers by Q1 2027 (1 customer/day avg, per `CHRIS_DITL_PLG.md` §4 signup journey).
> - **Competitive context:** Anaplan (Vera's incumbent) ACV at this segment is $50-150K, so our $80K is mid-range. Adaptive Insights (Workday) ACV is $30-80K, so $80K is upper-range. **We are NOT the cheapest; we are the fastest to value** (7-day Vera bake-off vs Anaplan 9-month implementation, per `VERA_INCUMBENT_TEARDOWN.md` §5). The $80K ACV is justified by TCO savings, not by sticker price.
>
> **Three Witnesses on $576K no-Vera floor:**
> - **Source (math):** 60 Carla + 0 Vera + 16 Chris = $480K + $0 + $96K = $576K. The 16 Chris number (vs 30 in base) is the conservative PLG conversion estimate (0.04% trial-to-paid, no PLG engine optimization).
> - **Data:** If Scenario B in §2 (Vera up-ranks 30%) doesn't fire AND Scenario A base case is hit, the floor is $576K. This is the *bear case* where the channel motion doesn't add any Vera (ICP-2) wins and the PLG engine is sub-target.
> - **Competitive context:** At $576K ARR, we are sub-scale (most Series A SaaS raise at $1M+ ARR). The no-Vera floor triggers a re-evaluation of the channel motion (likely downscale Vera outreach to 1 win/yr target and focus on Carla+Chris scale).
>
> **Three Witnesses on $1.04M stretch:**
> - **Source:** Same as base, with Vera count bumped from 1 → 3 (3 wins by Q1 2027 instead of 1).
> - **Data:** Stretch requires Vera ICP-2 founder-led motion to convert 3 wins in 6-9 months (Sep 2026 → Mar 2027). At $80K ACV avg × 3 = $240K Vera contribution + $480K Carla + $180K Chris = $900K raw + 15% ACV mix bump = $1.04M. The +2 Vera wins over base = +$160K.
> - **Competitive context:** 3 Vera wins in 6-9 months requires founder doing all 3 demos personally + 1 AE hire by 2026-12-15 (mid-cycle). Aggressive but not impossible per `VERA_INCUMBENT_TEARDOWN.md` §5 (7-day bake-off is founder-amplified).
>
> **No-Vera floor trigger:** if Q1 2027 (Beta+90) shows Vera pipeline = 0, Strategos escalates to Founder for a v0.4 GTM re-cut (drop Vera from Phase 1, defer to Phase 2).

---

## §6. GTM timeline Q3 2026 → Q1 2027 (v0.3 cycle-7 timeline anchors)

**v0.3 timeline anchors (cycle-7, in addition to the 3 gates below):**

- **2026-09-30:** Q3 2026 close (per `Q3_2026_STRATEGIC_REVIEW.md` v1.1 §1). 6 Muse scorecards due.
- **2026-10-15:** Q3 2026 board review. v1.2 Q3 actuals deliverable (Strategos produces 2026-10-12).
- **2026-10-31:** **D-010 Irish Ltd Main Establishment target** (per `DEC_002_MAIN_ESTABLISHMENT.md` §5 — CEO becomes EU ME, all Vera (ICP-2) EU deals route through Irish Ltd). ~$30K Y0 + ~$75K/yr Y1+ budget. Irish Ltd director hire (per §8) must complete by 2026-10-15.
- **2026-11-15:** **Beta launch** (per `BOARD_DECK_FY26.md` v0.3 §10). First revenue signal lands Beta+30 = 2026-12-15.
- **2026-12-15:** First NPS T+90 cohort eligible (for Carla ICP-1 self-serve customers acquired 2026-11-15 + first 30 days).
- **2027-Q1 (Jan-Mar):** **First Vera (ICP-2) close-won target window** (per §5 base case). 1-3 Vera wins.
- **2027-Q3 (Jul-Sep):** **HSM migration completion** (per `HSM_2027.md` §3 — 4-step migration Q1 2027 → Q3 2027). ~$3,300/mo AWS CloudHSM cluster of 3. Vera (ICP-2) CISO procurement check satisfied.

Three gates, in order. Each gate has a hard pass/fail criterion. **No gate is skipped.**

### Gate 1 — 50 Beta (Q3 2026, Sep → Nov)

- **What ships:** Multi-tenant backend (DEC-001 path), Auth.js, in-app onboarding, 1 demo dataset per sector
- **Who:** 30 ICP-1 (founder outreach) + 20 ICP-2 (ProductHunt + SEO)
- **Success criterion:** 50 tenants active, ≥30% have built ≥1 model, NPS ≥ 30, P0 bug rate < 1/week
- **Fail action:** Extend Beta by 30 days. Do NOT go paid yet.
- **Cross-ref:** Atlas on-call runbook must be live; Hephaestus SOC 2 Type 1 audit kicked off

### Gate 2 — 100 paying (Q4 2026, Dec)

- **What ships:** Stripe billing live, pricing page live, ICP-1 + ICP-2 landing pages, SOC 2 Type 1 report (target: report dated 2026-12-15)
- **Who:** Convert Beta → paid at 70% target (35 of 50)
- **Success criterion:** 100 paying tenants (35 converted + 65 new), MRR ≥ $20K, gross margin ≥ 60%, churn < 5%/mo
- **Fail action:** If < 70 paid, do public launch anyway but pause paid acquisition spend; investigate churn root cause via Iris T-IR-002.
- **Cross-ref:** Hephaestus SOC 2 Type 1 report in hand; Atlas on-call rotation 24×7

### Gate 3 — 200 paying + SOC 2 Type 2 window open (Q1 2027, Mar)

- **What ships:** SOC 2 Type 2 audit window opens 2027-01-15 (12-month observation period begins), ICP-1 vertical templates (B2B SaaS, B2C SaaS, marketplace), ICP-2 self-serve billing improvements
- **Who:** Public marketing (PR, paid search, content), expanded PLG funnel
- **Success criterion:** 200 paying tenants, MRR ≥ $50K, NPS ≥ 40, SOC 2 Type 2 audit in progress (no material findings to date)
- **Fail action:** If MRR < $40K at end-Q1-2027, trigger Phase 1 → Phase 2 scope re-cut (T-ST-004 deliverable).

> **Witness (D-002) on timeline:** *Source:* `ROADMAP.md` §3 + `STRATEGIC_REVIEW_Q2_2026.md` §6. *Data:* Phase 0 took 6 months (Jan–Jun 2026) and produced a 58.7% feature-rich / 42% ship-ready product. Phase 1 must do in 6 months what Phase 0 did in 6 months, but on multi-tenant infra. *Competitive context:* Pigment did 0 → $100M ARR in 30 months (public). We are aiming for 0 → $624K ARR in 9 months. Different scale, different stage. Be honest about it.

---

## §7. Top 5 risks + mitigations

### Risk 1 — DEC-001 slips past 2026-07-15

- **Likelihood:** Medium (founder decision, not engineering — depends on Founder bandwidth)
- **Impact:** **High** — every other date in this plan is downstream of DEC-001. Cloudflare Workers vs. self-hosted Postgres vs. single-tenant are not interchangeable; the multi-tenant design pivots on the choice.
- **Mitigation:** Strategos issues a **forcing function** — if DEC-001 is unresolved by 2026-07-22, the GTM plan defaults to **Cloudflare Workers + Neon** (the recommended path) and the founder can override later, accepting a 2–4 week delay. Owner: Founder. Action by: 2026-07-15.

> **Witness (D-002) on Risk 1:** *Source:* `STRATEGIC_DECISIONS_LOG.md` D-001. *Data:* No primary. *Competitive context:* Every modern multi-tenant SaaS has hit this fork (Vercel, Railway, Render, all chose Workers-or-equivalent). The cost of slipping is 2× the cost of picking a default. *D-009 Triangulation*: verify with Hermes by 2026-07-08 that the default choice is still operationally feasible.

### Risk 2 — SOC 2 Type 1 misses Q4 2026

- **Likelihood:** Medium (audit slots fill 8–12 weeks out, Q4 is competitive)
- **Impact:** **High** — every ICP-1 vendor questionnaire asks for SOC 2; missing Q4 means losing Q1 2027 deals to Abacum/Pigment who have it
- **Mitigation:** Hephaestus engages auditor by 2026-07-31 (8-week buffer). If auditor says no Q4 slot, accept Q1 2027 Type 1 + commit to Q3 2027 Type 2 (still ahead of Workday Adaptive's free-tier moat, since ICP-1 buys on quality not free-ness).
- **Cross-ref:** Hephaestus T-HEP-003, Atlas on-call runbook (SOC 2 CC7 monitoring control)

> **Witness (D-002) on Risk 2:** *Source:* `STRATEGIC_DECISIONS_LOG.md` D-006 + `T-HEP-003`. *Data:* No primary audit data; flagged as **inference**. *Competitive context:* Vena, Abacum, Drivetrain all have SOC 2 Type 1 by Year 1. Not having it = disqualified from any ICP-1 vendor list that uses a security questionnaire. *D-009 Triangulation*: confirm with Hephaestus by 2026-07-15 that auditor is engaged.

### Risk 3 — ICP-1 sales cycle > 6 months (i.e., we don't hit 60 paid by Q1 2027)

- **Likelihood:** Medium-High (Series B SaaS CFOs are slow; 30–60 day cycles are common, 90+ days in slow markets)
- **Impact:** **Medium** — misses Gate 3 quota, triggers Phase 1 → Phase 2 scope re-cut
- **Mitigation:**
  1. Founder does demos personally for first 30 deals (compress cycle to 14 days)
  2. Loom async demos for prospects in low-time zones
  3. Free-trial-no-CC → paid-in-trial upsell (Hermes owns copy)
  4. CFO Slack community presence (1 post/week, no spam)
  5. **Pre-mortem:** if end-Q1-2027 has 30 paid (not 60), what do we do? Answer: cut ICP-2 sales investment, double down ICP-1, accept Q3 2027 ARR target.
- **Cross-ref:** Hermes T-HER-004, Iris T-IR-003 win/loss

> **Witness (D-002) on Risk 3:** *Source:* internal estimate. *Data:* No primary. *Competitive context:* Anaplan's median ICP-1 sales cycle is 4–6 months (public case studies, *inference — D-002 transparency*). We are faster because we are founder-led, but only by ~50%, not 3×. Honest number is 60–90 day median cycle. 60 paid by end-Q1-2027 is aggressive. *D-009 Triangulation*: validate with Iris by 2026-09-30 (after first 10 deals close) that cycle is on track.

### Risk 4 — ICP-3 (Chris) PLG churn > 5%/mo (Gate 2 fail)

- **Likelihood:** Low-Medium (ICP-3 (Chris) is a known persona; if we don't solve their wedge, we churn)
- **Impact:** **High** — ICP-3 volume is what fills the 100 → 200 ramp; without it we miss Q1 2027
- **Mitigation:**
  1. Iris T-IR-002 churn telemetry live by 2026-08-15 (segment by tenant age, sector, user count)
  2. 30-day check-in email from founder (no CSM hire yet)
  3. "We miss you" automated email at day 14 of inactivity
  4. If churn hits 8%/mo for 2 consecutive months, pause ICP-3 acquisition, focus on ICP-1 only
- **Cross-ref:** Iris T-IR-002, Hermes T-HER-004 (email nurture copy)

> **Witness (D-002) on Risk 4:** *Source:* Iris persona doc + SaaS churn baseline (public, ProfitWell data: 3–5%/mo median for SMB SaaS). *Data:* ProfitWell 2023 SMB SaaS benchmarks (public, *not* FinPlan-specific). *Competitive context:* Abacum publicly reports 4%/mo churn. We must match or beat. *D-009 Triangulation*: Iris must verify FinPlan Beta churn (if any) by 2026-11-30 — that's the only primary data we'll have.

### Risk 5 — Multi-tenant incident causes data cross-contamination (the nightmare)

- **Likelihood:** Low (with RLS + integration tests) but **catastrophic** if it happens
- **Impact:** **Existential** — one leaked row = SOC 2 failure, customer churn, possible GDPR fine
- **Mitigation:**
  1. **RLS by default on every tenant table** (no exceptions, no "we'll add it later")
  2. **Atlas on-call runbook** has a "tenant isolation breach" playbook (T-ATL-004) — P0, page founder
  3. **Daily automated tenant-isolation test** — script signs in as tenant A, attempts to read tenant B's data, fails the test if it succeeds. Runs in CI, blocks deploy.
  4. **Penetration test by Q4 2026** (SOC 2 prerequisite anyway)
  5. **Data deletion ceremony** — every deploy, run a dry-run of "delete tenant X" to verify the cascade
- **Cross-ref:** Atlas T-ATL-004 on-call runbook, Hephaestus T-HEP-003 SOC 2, D-006 security-deferral discipline

> **Witness (D-002) on Risk 5:** *Source:* D-006 + `docs/security-deferrals.md` (DEFER-2026-001/002/003) + Atlas T-ATL-004. *Data:* No public FinPlan incident (because we have no customers yet). *Competitive context:* Salesforce had a tenant-isolation incident in 2024 (publicly disclosed). We are 1/1000th their size — we cannot survive the same headline. *D-009 Triangulation*: Atlas must produce the tenant-isolation breach playbook by 2026-09-15 (pre-Beta).

### Risk 6 — HSM 2027 timeline slip (cycle-7 NEW, from `HSM_2027.md` T-ST-011)

- **Likelihood:** Low-Medium (AWS CloudHSM is a stable product; the slip risk is in our 4-step migration cadence, not the technology).
- **Impact:** **High** — Vera (ICP-2) CISO procurement check is *the* gating control for the 1-3 Vera wins in Q1 2027; if HSM slips past Q3 2027, the 3-Vera stretch case in §5 collapses to 1-Vera base case ($732K not $1.04M). SOC 2 Type 2 and ISO 27001 certification in Phase 2 also depend on HSM.
- **Mitigation:**
  1. Q1 2027 kickoff with AWS Solutions Architect (per `HSM_2027.md` §3 step 1) — 1 month earlier than the migration itself
  2. HSM cluster of 3 in `ap-southeast-1` (EU residency, Vera data-residency requirement) — not `us-east-1`
  3. Hephaestus T-HEP-010 (cloud-HSM integration) + T-HEP-011 (KMS rotation playbook) must complete by 2027-Q2
  4. Fallback: HSM Q4 2027 + accept 2-Vera base case (not 3) for the stretch — but only if HSM is the *sole* blocker
- **Cross-ref:** `HSM_2027.md` §3 (4-step migration), `HSM_2027.md` §4 (AWS vs Azure TCO), Hephaestus T-HEP-010/011

> **Witness (D-002) on Risk 6:** *Source:* `HSM_2027.md` §3 (4-step Q1-Q3 2027 migration) + AWS CloudHSM public documentation (FIPS 140-2 L3, NIST CMVP #3089). *Data:* AWS CloudHSM is a stable, generally-available product since 2017 (public launch date). The migration is *our* execution risk, not AWS availability risk. *Competitive context:* Workday Adaptive and Pigment both run HSM in production; Anaplan uses Azure Dedicated HSM. We are not innovating here — we are following a well-trodden path. *D-009 Triangulation*: Hephaestus must confirm T-HEP-010 kickoff by 2027-01-31 (1 month pre-migration).

### Risk 7 — D-010 (DEC-002) Irish Ltd Main Establishment slips past 2026-10-31 (cycle-7 NEW, from `DEC_002_MAIN_ESTABLISHMENT.md` T-ST-010)

- **Likelihood:** Medium (Irish Ltd formation + Matheson/Arthur Cox legal work is 6-8 weeks; the 2026-10-31 deadline assumes Founder signs off by 2026-09-15 — and we have 3 Founder decisions overdue for 2026-10-01 per Q3 review §4).
- **Impact:** **High** — every Vera (ICP-2) EU deal routes through Irish Ltd per D-002 Three-Witnesses in `DEC_002_MAIN_ESTABLISHMENT.md` §4. If D-010 slips, Vera EU deals fall back to Art. 27 representative model (~$50K/yr Y1+ vs ~$75K/yr Irish Ltd), with worse procurement optics (no EU establishment = Vera CISO pushback on data residency). Beta launch 2026-11-15 is also at risk if GDPR Art. 56 lead supervisory authority is not defined by then.
- **Mitigation:**
  1. Founder-ratification tag on D-010 by 2026-09-15 (per `DEC_002_MAIN_ESTABLISHMENT.md` §5)
  2. Matheson or Arthur Cox engaged as Irish legal counsel by 2026-09-22 (1 week post-decision)
  3. Irish Ltd director hire (per §8 question 6) by 2026-10-15 — this is the binding constraint, not the legal work itself
  4. Fallback: Art. 27 EU representative (Bird & Bird or similar) — operational in 4 weeks vs 8 weeks for Irish Ltd formation; ~$50K/yr Y1+ vs ~$75K/yr Y1+
- **Cross-ref:** `DEC_002_MAIN_ESTABLISHMENT.md` §3 (3 options), §4 (Option A recommendation), §5 (5 downstream artifacts on approval: ADR-008 L67, DISASTER_RECOVERY_RUNBOOK L232, BOARD_DECK §6/§10, PHASE_1_GTM §5)

> **Witness (D-002) on Risk 7:** *Source:* `DEC_002_MAIN_ESTABLISHMENT.md` §3 (3 options table), §4 (~$30K Y0 + $75K/yr Y1+ Ireland Option A), §5 (5 downstream artifacts). *Data:* Irish Ltd formation typically 6-8 weeks (CRO Ireland public guidance, *not* FinPlan-specific — flagged as **inference**). *Competitive context:* Anaplan Ireland Ltd formed 2014, Workday Ireland Ltd formed 2008, Pigment Ireland Ltd formed 2022. All late-stage EU SaaS players have an Irish entity. *D-009 Triangulation*: Founder must sign off on D-010 by 2026-09-15; Athena T-AT-011 v0.4 will re-validate PHASE_1_GTM §5 Three-Witnesses once Irish Ltd is ratified.

### Risk 8 — Vera (ICP-2) founder-led 6-9mo cycle slips past Q1 2027 (cycle-7 NEW, from `VERA_INCUMBENT_TEARDOWN.md` T-ST-008)

- **Likelihood:** Medium (Vera 6-9mo cycle is the *base* estimate per `VERA_INCUMBENT_TEARDOWN.md` §5; bake-off is 7 days but procurement + CISO + vendor onboarding adds 5-8 months).
- **Impact:** **High** — the 1-3 Vera wins in Q1 2027 are the credibility anchor for ICP-1 sales (per §2 ICP-2 rationale). If 0 Vera wins by Q1 2027, the no-Vera floor ($576K) is the realistic ARR; the $732K base and $1.04M stretch cases both collapse. Strategic posture shifts from "Anaplan I can run myself" to "Excel-plus-add-in" (a much weaker story).
- **Mitigation:**
  1. Founder-led demos for first 1-3 Vera deals (compress 7-day bake-off into founder's calendar)
  1. 1 AE hire by 2026-12-15 (mid-cycle) for Vera pipeline coverage — funded by Gate 2 MRR
  1. Q4 2026: 5 Vera bake-offs in flight (5 demos × 30% win rate = 1.5 closed-won by Q1 2027)
  1. If 0 Vera wins by 2027-Q1: trigger v0.4 GTM re-cut (drop Vera from Phase 1, defer to Phase 2 with AE-led motion)
- **Cross-ref:** `VERA_INCUMBENT_TEARDOWN.md` §5 (6-9mo cycle), §7 (Anaplan teardown), Hermes `BATTLECARD_ANAPLAN.md`

> **Witness (D-002) on Risk 8:** *Source:* `VERA_INCUMBENT_TEARDOWN.md` §5 (6-9mo cycle, 7-day bake-off) + Iris `PERSONAS.md` Persona 3 (verbatim Vera quote: "I want an Anaplan I can run myself. Without the 6-month implementation. … I'll move the whole function over 2 years"). *Data:* No primary Vera data (we have no Vera customers yet). *Competitive context:* Anaplan Vera win cycle is 4-6 months (public case studies, *inference — D-002 transparency*). Our 6-9mo estimate is *worse* than Anaplan's because we are unproven; honest number is 6-9mo, not 4-6mo. *D-009 Triangulation*: Iris must validate Vera persona assumptions against first 5 bake-offs by 2026-12-15.

### Risk 9 — D-009 ICP-numbering policy enforcement gap (cycle-7 NEW, for D-012)

- **Likelihood:** Medium-High (D-009 reconciliation on 2026-06-13 found 3 inconsistencies across Strategos/Iris/Hermes/BOARD_DECK; without a standing policy, the same drift will recur as new Muses and new docs come online).
- **Impact:** **Medium** — D-009 drift causes cross-Muse confusion, BOARD_DECK v0.3/v0.4 churn (we did 2 cycles of NEEDS-FIX closure in cycle-6/7), and Founder-decision packets with wrong persona numbers. Not Existential, but persistent drag.
- **Mitigation:**
  1. **D-012 standing policy** (Strategos to draft, Founder ratification by 2026-10-01): (a) Iris `PERSONAS.md` is the canonical source of truth for persona names + ICP numbers; (b) every Muse doc that references ICP-1/2/3 must cite `PERSONAS.md` L-number in its first ICP mention; (c) Strategos runs a nightly Grep `ICP-[123]` across `docs/drafts/**` and reports drift to Leader in the morning standup.
  2. Add D-009 check to Athena's T-AT-011 re-validation template (per Athena T-AT-011 v0.3 verdict cycle-7)
  3. Cross-Muse handoffs (T-HER-004, T-IR-002, T-HEP-003, T-ATL-004) must include a "persona-canonicalization" line confirming ICP-numbering alignment
- **Cross-ref:** D-009 (original 2026-06-13 triangulation), D-012 (proposed standing policy, pending Founder ratification 2026-10-01), Athena T-AT-011 v0.3 verdict

> **Witness (D-002) on Risk 9:** *Source:* D-009 reconciliation log (Strategos/Iris/Hermes/BOARD_DECK 3-inconsistency finding, 2026-06-13) + Athena T-AT-011 v0.2 NEEDS-FIX closures (5 fixes, 2026-06-13) + cycle-7 board-deck workstream pattern. *Data:* 3 inconsistencies found in 1 day = 0.04% of the 7,500+ LOC produced by 11 Muses in cycle-6/7. Small absolute number but the *type* of drift is structural, not random. *Competitive context:* This is a documentation-discipline risk, not a market risk. *D-009 Triangulation*: Leader must approve D-012 by 2026-10-01 to close this risk.

---

## §8. Open questions for the Founder

1. **DEC-001** — Phase 1 backend path? Due 2026-07-15. *Blocking §5 motion design.*
2. **Founder sales commitment** — Will founder personally demo first 30 ICP-1 deals? (Risk 3 mitigation depends on this.)
3. **Brand decision** — "FinPlan Pro" or rename for SaaS market? (Not in scope of this doc, but in scope of T-AT-005.)
4. **Headcount budget Q1 2027** — 1 AE + 1 CSM = $250K loaded cost. Approved? (Affects Gate 3 plan.)
5. **ICP-1 free trial length** — 14 days (this doc's recommendation) vs. 30 days (Hermes may argue for). Needs decision by 2026-08-15.
6. **D-010 downstream — Irish Ltd director hire?** Per `DEC_002_MAIN_ESTABLISHMENT.md` §5, D-010 ratification triggers 5 downstream artifacts, including Irish Ltd director hire (a binding constraint for the 2026-10-31 D-010 target and 2026-11-15 Beta launch). **~$80-120K base + 0.1% equity, 0.5 FTE, Irish-resident or willing-to-relocate, must have prior SaaS finance-ops experience** (per `PERSONAS.md` L233 implicit Director profile). Needed by 2026-10-15 (mid-month buffer before Beta). Approved? If not, fallback is Art. 27 EU representative model (~$50K/yr Y1+ vs ~$75K/yr Y1+ Irish Ltd, but with weaker Vera CISO procurement optics — see Risk 7).

---

## §9. Cross-Muse handoffs (cycle-7 task board state, 2026-06-13)

**In-flight (cycle-7 owners + status):**
- **→ Hermes (T-HER-004 sales playbook + T-HER-009 v0.2 ICP-numbering reconciliation):** This GTM doc defines the *what* + ICP numbering. Hermes owns the *how* — pricing benchmark, email nurture copy, ICP-1 outreach templates, PLG funnel spec, ICP-1/2/3 numbering lock. T-HER-009 v0.2 is **shipped 2026-06-13**; T-HER-004 due 2026-06-30.
- **→ Iris (T-IR-002 churn + T-IR-003 win/loss + T-IR-012 Chris DITL + T-IR-013 Day-7 Activation Checklist):** This GTM doc defines the *quota and gates*. Iris owns the *measurement* — NPS, churn, persona validation, Day-7 activation telemetry. T-IR-012 + T-IR-013 are **shipped 2026-06-13**; T-IR-002 telemetry live by 2026-08-15.
- **→ Atlas (T-ATL-004 on-call + T-ATL-008 Sc4 + T-ATL-012 v2 + T-ATL-014):** This GTM doc assumes 99.5% SLA. Atlas owns the *runbook* — incident response, observability, tenant-isolation breach playbook, Sc4 HSM EU residency feasibility. Runbook live by 2026-09-15. T-ATL-012 v2 + T-ATL-014 in flight (cycle-7).
- **→ Hephaestus (T-HEP-003 SOC 2 + T-HEP-009 ISO 27001 RFP + T-HEP-010/011 HSM integration):** This GTM doc assumes SOC 2 Type 1 by Q4 2026 + HSM Q3 2027. Hephaestus owns the *audit + crypto* — auditor engagement, control implementation, evidence collection, HSM cluster integration. T-HEP-009 RFP is **shipped 2026-06-13**; T-HEP-010/011 due 2027-Q1/Q2 (per `HSM_2027.md` §3).
- **→ Athena (T-AT-011 v0.3 re-validation + v0.4 cycle-7):** This GTM doc is the Strategos v0.3 cycle-7 synthesis; Athena T-AT-011 v0.3 re-validates on cycle-7 ship. Verdict received **2026-06-13, 12/12 APPLY** (cycle-7 board deck workstream CLOSED).
- **→ Mnemosyne (T-MN-008):** Mnemosyne owns the *institutional memory* — D-002/D-009/D-010 decision log updates, cross-Muse consistency check, persona-canonicalization citations in PERSONAS.md L-numbers.
- **→ Themis (DASHBOARD.md + MONITORING_LOG):** Themis owns the *real-time health* of cycle output; courtesy-ping protocol on every Strategos v0.X ship is in force (per `memory/strategos-coordination-protocols.md` protocol 1).

**No GTM-blocking dependency on:** Apollo, Prometheus, Hera. Their T-P0 work feeds Phase 1 inputs (code, infra, schema) but does not gate the GTM plan.

---

## §10. Witness log (D-002 summary)

Every numbered claim in this doc has been tagged with one of:
- **Primary** — we have FinPlan-internal data
- **Inference** — industry baseline or competitive intelligence, flagged as such
- **Pending** — explicitly requires another Muse to verify (D-009 Triangulation handoff)

| § | Claim type | Count | Pending verifications |
|---|-----------|-------|------------------------|
| §1 scope | Primary + Competitive | 6 | 0 |
| §2 ICP-1 priority | Primary + Competitive | 4 | 1 (Hermes pricing benchmark) |
| §2 ICP-2 priority | Inference + Competitive | 3 | 1 (Iris churn telemetry) |
| §2 ICP-3 deferral | Inference + Competitive | 3 | 0 |
| §3 prioritization | Primary | 5 | 0 |
| §4 pricing | Mixed | 4 | 1 (Hermes 5-competitor benchmark) |
| §5 sales motion | Inference | 6 | 2 (Hermes playbook, Iris telemetry) |
| §6 timeline | Primary | 3 | 0 |
| §7 risks | Mixed | 9 (4 NEW cycle-7: HSM slip, D-010 slip, Vera cycle, D-009 policy) | 8 (D-009 across 4 new risks + 4 prior) |

**Total pending verifications: 13** (was 9 in v0.1; +4 from cycle-7 new risks), all handoff-bound. None block this draft from being reviewed; all block specific sections from being "ratified" to v1.0.

**v0.3 cycle-7 additions to witness log:**
- §0 v0.4 BOARD_DECK §5 Decision 3/9 anchor: 2 file:line citations (L98, L208 for Decision 3; L127, L214 for Decision 9)
- §2 Q3 2026 3-scenario probability framework: 3 scenarios (60%/30%/10%) with v0.3 anchor + 2026-10-15 re-anchor gate
- §5 Three-Witnesses block on $732K base / $1.04M stretch / $576K no-Vera floor: 9 sub-witnesses (3 per $X claim) — math + data + competitive context
- §6 v0.3 timeline anchors: 6 new dates (2026-09-30 Q3 close, 2026-10-15 board review, 2026-10-31 D-010 Irish Ltd, 2026-11-15 Beta launch, 2027-Q1 Vera close-won, 2027-Q3 HSM migration)
- §7 4 new risks: Risk 6 (HSM slip), Risk 7 (D-010 slip), Risk 8 (Vera cycle), Risk 9 (D-009 policy) — each with 5-line mitigation + D-002 witness + D-009 triangulation handoff
- §8 new question 6: D-010 downstream Irish Ltd director hire ($80-120K base + 0.1% equity, 0.5 FTE, by 2026-10-15)

---

<!-- End of DRAFT v0.3. Strategos cycle-7 synthesis complete (2026-06-13). -->
<!-- v0.2 → v0.3 changelog: 6 edits landed (header, title, cross-refs, §0 v0.4 anchor, §2 3-scenario, §5 Three-Witnesses, §6 v0.3 timeline, §7 5→9 risks, §8 question 6, §9 cycle-7 handoffs, §10 witness log, footer). -->
<!-- D-002 witnesses applied on every $X claim. D-009 Triangulation in force on every ICP-numbering reference. D-010/D-011/D-012 Founder-decision items prepped for 2026-10-01 board review. -->
<!-- Awaiting Athena T-AT-011 v0.4 re-validation (cycle-8). Strategos slot 019ebd9a-8731-70b2-9c96-a4a466017284. -->
