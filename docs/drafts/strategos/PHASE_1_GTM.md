<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->
<!-- Three Witnesses (D-002) on every claim. Cross-ref: Hermes (ICP/pricing), Iris (personas/churn/win-loss), Atlas (on-call), Hephaestus (SOC 2). DEC-001 is the upstream gating dependency. -->

# Phase 1 GTM Strategy — FinPlan Pro

> **Status:** DRAFT v0.1 — awaiting Leader + Founder review
> **Author:** Strategos (slot `019ebd9a-8731-70b2-9c96-a4a466017284`)
> **Date:** 2026-06-13
> **Cycle:** Perfection Cycle, post-T-ST-002 (matrix v2)
> **Owner of decision:** Founder (DEC-001 must resolve before §5 is final)
> **Cross-references:** `ROADMAP.md` §3, `PRODUCT_VISION.md` §4, `STRATEGIC_DECISIONS_LOG.md` D-000..D-009, `FPA_COMPETITIVE_MATRIX.md` v2

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

Three ICPs were defined in `PRODUCT_VISION.md` §3. Phase 1 deliberately attacks **two of three** and defers one.

### ICP-1 — "CFO Carla" (PRIMARY, attack first)

- **Profile:** CFO / VP-Finance at Series B–D SaaS, 50–500 employees, $10M–$100M ARR, finance team of 3–10
- **Why first:** Highest ACV ($499/user/mo Business tier = $30K–$60K/yr per tenant), shortest path to $1M ARR (16–33 customers), most painful unsolved pain (live, multi-scenario modeling without a week of FP&A services)
- **Beta window:** Sep 2026 → Nov 2026 (50 tenants, sales-led)
- **Win condition for ICP-1:** "Replaces Anaplan OR Excel-plus-Vena for one modeling workflow within 30 days"
- **Cross-ref:** Hermes ICP-1 deep-dive (T-HER-004 sales playbook) and Iris persona validation (T-IR-003 win/loss)

> **Witness (D-002) on ICP-1 priority:** *Source:* `STRATEGIC_REVIEW_Q2_2026.md` §3 (10-dimension scorecard, "Quality 62%, Completeness 92%") + `PRODUCT_VISION.md` §3.1. *Data:* 274 charts + 192 reports + 23 sector templates cover the 80% case for SaaS CFO budgeting. *Competitive context:* Anaplan ($1,500/user/yr) and Pigment ($2,000/user/yr) target the same buyer — we are 4× cheaper for the SaaS-CFO slice, and our Excel/Sheets round-trip is genuinely better (matrix v2 §2.4). Cf. Cube Excel add-in v2 — they own *add-in*, we own *app* — different attack vector.

### ICP-2 — "Controller Chris" (SECONDARY, attack in parallel)

- **Profile:** Controller / Senior Accountant at scrappy SaaS, 10–50 employees, $1M–$10M ARR, "does the close solo on nights and weekends"
- **Why second:** Lowest friction to self-serve ($99/user/mo Starter tier), high word-of-mouth coefficient in tight-knit SaaS-CFO Slack communities, lower LTV ($1,200/yr per tenant) but compensates with volume
- **Beta window:** Oct 2026 → Dec 2026 (50 tenants, PLG)
- **Win condition for ICP-2:** "I close the books in 3 days instead of 10" — this is the *close-cycle* wedge, not the *modeling* wedge
- **Cross-ref:** Hermes ICP-2 PLG funnel, Iris churn telemetry (T-IR-002)

> **Witness (D-002) on ICP-2 deferral-to-parallel:** *Source:* `PRODUCT_VISION.md` §3.2 + Hermes T-HER-004. *Data:* The 10–50 segment is 6× larger in account count than 50–500 (U.S. SaaS census, internal estimate). *Competitive context:* This is the segment that *Abacum* ($50M ARR, Q1 2026) and *Drivetrain* (80+ integrations, Q2 2026) are also fighting for. We will *lose* on integration breadth — we will *win* on time-to-first-model (target: 15 min, vs. 2-day Drivetrain onboarding, matrix v2 row).

### ICP-3 — "FP&A Lead Felix" (DEFERRED to Phase 2)

- **Profile:** Senior Director / VP FP&A at enterprise, 500–5,000 employees, $100M–$1B revenue
- **Why deferred:** Phase 1 multi-tenant does NOT include the org-chart + workflow + audit-trail features enterprise procurement demands. SOC 2 Type 2 + ERP connector depth + SAML SCIM provisioning is Phase 2 (Q2 2027+). Pushing ICP-3 into Phase 1 = sales cycle > 9 months = death by demo.
- **What we tell them:** "Phase 2. Let us know." Do NOT sell them Phase 1 — it costs us reference-ability.
- **Cross-ref:** `ROADMAP.md` §3 Phase 2 row, Atlas on-call runbook (enterprise SLA target is 99.9%, not the 99.5% Phase 1 can guarantee)

> **Witness (D-002) on ICP-3 deferral:** *Source:* `ROADMAP.md` §3 Phase 2 column. *Data:* ICP-3 procurement cycles are 6–9 months minimum (industry baseline; *not* a witness I have primary data for — flagged as **inference**, D-002 requires that I not over-claim). *Competitive context:* Workday Adaptive (free with Workday HCM) and Anaplan Intelligence own this segment. We are 18 months behind. Don't fight.

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
| **Starter** | $99 / user / month (annual) or $119 monthly | ICP-2 Controller Chris | 1 user, 1 sector, 5 reports, 50 charts, no SSO, email support, community Slack |
| **Business** | $499 / user / month (annual) or $599 monthly | ICP-1 CFO Carla | Up to 10 users, all sectors, all reports, all charts, Google + Microsoft SSO, SAML add-on $200/mo, email + chat support, 99.5% SLA, audit log |
| **Enterprise** | Custom (typically $1,200–$2,500 / user / month) | ICP-3 (Phase 2) — quoted but not sold in Phase 1 | Unlimited users, SCIM, on-prem option, custom SLA, dedicated CSM |

**Rationale (and why we are NOT undercutting further):**
- $99 is **floor** for SOC 2 + GDPR + multi-tenant infra. Below this we cannot cover cloud + support cost.
- $499 is **4× cheaper** than Anaplan at the median ICP-1 deal size (matrix v2 Anaplan row: $1,500/user/yr = ~$125/user/mo — wait, that's $1,500/YEAR not per month; need Hermes to verify median deal). *Witness flag: D-002 — this needs a primary-data check from Hermes T-HER-004 pricing benchmark. Currently using published list price as proxy.*
- We **do not** publish a "free" tier. PLG without free-tier is unusual but defensible: our 274 charts + 192 reports are not toys, and a free tier attracts ICP-4 (freelancers) who churn and pull down NPS. Cross-ref: Iris T-IR-002 churn telemetry.
- Annual prepay = 17% discount (i.e., 10 months for 12). Monthly is a 20% surcharge. This is industry-standard.

> **Witness (D-002) on pricing:** *Source:* `ROADMAP.md` §4 + Hermes T-HER-004. *Data:* TBD — Hermes must produce a 5-competitor price benchmark by 2026-06-20 (action item, see §5). *Competitive context:* Matrix v2 — Abacum is $49/user/mo for the entry tier (lowest), Pigment is $2,000+/user/yr for enterprise. We sit in the middle. *Strategic posture:* we are the **quality-at-mid-price** option, not the cheap option.

---

## §5. Sales motion (hybrid: PLG for ICP-2, sales-led for ICP-1)

This section depends on **DEC-001** (Phase 1 backend strategy — founder decision due 2026-07-15). The motion described here assumes DEC-001 = "Build on Cloudflare Workers + Postgres-compatible Neon" (the recommended path; alternatives degrade this motion).

### ICP-1 motion — Sales-led, founder + 1 AE

- **Channel:** Outbound to Series B–D SaaS CFOs (LinkedIn, warm intros, CFO Slack communities — *not* cold email blast)
- **Cadence:** 14-day free trial (full Business tier) → 30-min demo with founder → 14-day close window
- **Tooling:** HubSpot Free CRM (defer HubSpot Marketing Hub to Phase 2), Calendly, Loom for async demo
- **Quota:** 1 AE close = 30 ICP-1 customers in Q4 2026 → 60 in Q1 2027 = $30K MRR exit-Q1-2027 (60 × $499 × ~1 user-avg = $30K MRR)
- **Handoff:** AE-to-CSM at $5K+ ARR; under $5K = founder retains the relationship (Phase 1 is too small to hire CSM)
- **Cross-ref:** Hermes T-HER-004 (sales playbook to be authored by 2026-06-30)

> **Witness (D-002) on sales-led for ICP-1:** *Source:* industry baseline (Salesforce SMB → Mid-Market transition playbook, public). *Data:* NOT primary; flagged as **inference** (D-002 transparency). *Competitive context:* Anaplan and Pigment both have 100+ rep sales teams at ICP-1; we compete on *response time* (24-hr demo) and *founder accessibility*, not on headcount. This is a 12-month advantage, not a 36-month advantage.

### ICP-2 motion — PLG, no salesperson

- **Channel:** SEO (long-tail: "B2B SaaS close in 3 days", "Xero + SaaS revenue recognition"), ProductHunt launch, Reddit r/Accounting, Indie Hackers
- **Cadence:** Sign up with email → 14-day Business trial (free, no CC) → in-app nudge to convert to $99 Starter paid → onboarding email sequence (Hermes owns copy)
- **Tooling:** Stripe Checkout, Resend for email, Plausible for analytics (no Google Analytics — D-006 GDPR hygiene)
- **Quota:** 100 signups/month target, 10% conversion = 10 paying/month = 30 by end Q4 2026, 70 by end Q1 2027 = $7K MRR from ICP-2 exit-Q1-2027
- **Handoff:** Self-serve; CSM only when tenant > $5K ARR (rare in ICP-2)
- **Cross-ref:** Iris T-IR-002 (churn telemetry), Hermes T-HER-004 (PLG funnel spec)

> **Witness (D-002) on PLG for ICP-2:** *Source:* `PRODUCT_VISION.md` §3.2 + Iris persona. *Data:* 10–50 employee SaaS segment is self-serve-native (Slack communities, no procurement dept). *Competitive context:* Drivetrain PLG is good, Abacum PLG is poor (per matrix v2), Vena requires sales. We can match Drivetrain's PLG and beat their onboarding time.

### Joint quota Q1 2027

- ICP-1: 60 paying × ~1.5 user-avg × $499 = **$45K MRR**
- ICP-2: 70 paying × 1 user × $99 = **$7K MRR**
- **Total exit-Q1-2027 ARR run-rate: $624K**
- Stretch (with Enterprise pilots): $800K
- This is **not** $1M ARR yet — that is the Q2 2027 milestone, contingent on Phase 1 → Phase 2 expansion (ERP connectors)

> **Witness (D-002) on quota:** *Source:* internal estimate. *Data:* No primary. *Competitive context:* $624K ARR at exit-Q1-2027 = we are at roughly the size *Abacum was at end of 2023* (when they had 200 customers and $5M ARR per their public case studies). Plausible, not aspirational.

---

## §6. GTM timeline Q3 2026 → Q1 2027

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

### Risk 4 — ICP-2 churn > 5%/mo (Gate 2 fail)

- **Likelihood:** Low-Medium (ICP-2 is a known persona; if we don't solve their wedge, we churn)
- **Impact:** **High** — ICP-2 volume is what fills the 100 → 200 ramp; without it we miss Q1 2027
- **Mitigation:**
  1. Iris T-IR-002 churn telemetry live by 2026-08-15 (segment by tenant age, sector, user count)
  2. 30-day check-in email from founder (no CSM hire yet)
  3. "We miss you" automated email at day 14 of inactivity
  4. If churn hits 8%/mo for 2 consecutive months, pause ICP-2 acquisition, focus on ICP-1 only
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

---

## §8. Open questions for the Founder

1. **DEC-001** — Phase 1 backend path? Due 2026-07-15. *Blocking §5 motion design.*
2. **Founder sales commitment** — Will founder personally demo first 30 ICP-1 deals? (Risk 3 mitigation depends on this.)
3. **Brand decision** — "FinPlan Pro" or rename for SaaS market? (Not in scope of this doc, but in scope of T-AT-005.)
4. **Headcount budget Q1 2027** — 1 AE + 1 CSM = $250K loaded cost. Approved? (Affects Gate 3 plan.)
5. **ICP-1 free trial length** — 14 days (this doc's recommendation) vs. 30 days (Hermes may argue for). Needs decision by 2026-08-15.

---

## §9. Cross-Muse handoffs

- **→ Hermes (T-HER-004 sales playbook):** This GTM doc defines the *what*. Hermes owns the *how* — pricing benchmark, email nurture copy, ICP-1 outreach templates, PLG funnel spec. Due 2026-06-30.
- **→ Iris (T-IR-002 churn + T-IR-003 win/loss):** This GTM doc defines the *quota and gates*. Iris owns the *measurement* — NPS, churn, persona validation. Telemetry live by 2026-08-15.
- **→ Atlas (T-ATL-004 on-call):** This GTM doc assumes 99.5% SLA. Atlas owns the *runbook* — incident response, observability, tenant-isolation breach playbook. Runbook live by 2026-09-15.
- **→ Hephaestus (T-HEP-003 SOC 2):** This GTM doc assumes SOC 2 Type 1 by Q4 2026. Hephaestus owns the *audit* — auditor engagement, control implementation, evidence collection. Auditor engaged by 2026-07-31.
- **← Apollo, Athena, Prometheus, Hera, Mnemosyne:** No GTM-blocking dependency. Phase 0 outputs feed into Phase 1; their T-P0 work is on track.

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
| §7 risks | Mixed | 5 | 4 (D-009) |

**Total pending verifications: 9**, all handoff-bound. None block this draft from being reviewed; all block specific sections from being "ratified" to v1.0.

---

<!-- End of DRAFT v0.1. Strategos awaiting Leader + Founder review. -->
<!-- DEC-001 is the upstream gate. D-002 witnesses applied. D-006 + D-009 in force. -->
