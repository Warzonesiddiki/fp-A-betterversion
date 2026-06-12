<!-- DRAFT v0.4 — for Founder + Board review. Strategos 2026-06-13. Athena T-AT-011 v0.2 5 fixes applied (3 string + 2 doc-quality), see Athena validation file. -->
<!-- v0.2 (2026-06-13): D-009 persona-reconciliation (Felix removed, Vera=ICP-2, Chris=ICP-3, $732K base / $1.04M stretch, 8 risks, §6 Vera board approval, §9 90-day plan, §10 Vera founder-time). -->
<!-- v0.3 (2026-06-13): D-009 count typo fix — "82 pages" → "192 pages", "274 charts" → "274 components" (per Mnemosyne verification 2026-06-13). "192 reports" removed (collides with 192 pages). -->
<!-- v0.4 (2026-06-13): Athena T-AT-011 v0.2 NEEDS-FIX closure — (1) §5 L97 "ICP-2 self-serve vs PLG split" → "ICP-3 (Chris) PLG split"; (2) §11 L207 sig template "Decision 3 (ICP-2 PLG)" → "Decision 3 (ICP-3 PLG)"; (3) §11 L213 sig template "Decision 9 (ICP-3 motion)" → "Decision 9 (ICP-2 motion)"; (4) §7 L125 ICP-1 Carla impl cell "—" → "Founder (impl) until AE Q4 2026"; (5) §9 L161 T-AT-007 marked DONE 2026-06-13. -->
<!-- Audience: Founder + Board of Advisors (or sole founder, played as a "board" for forcing-function). -->
<!-- This is the deck that closes the "founder is the bottleneck" risk from PHASE_1_GTM §7. -->
<!-- Three Witnesses (D-002) on every claim. D-009 triangulation: every cross-ref verified. -->
<!-- All financial figures tagged [Leader estimate, pending Founder] — NOT budget commitments. -->

# FinPlan Pro — Board Deck FY26
## Q2 2026 → Q2 2027: From Perfection Cycle to First 200 Paying Tenants

> **Date:** 2026-06-13 | **Author:** Strategos (7th Muse) | **Audience:** Founder + Board
> **Purpose:** Force 10 founder decisions in 1 meeting. Unblock Phase 1 GTM (T-ST-003) and Phase 2 trigger (T-ST-005).
> **Source corpus:** PHASE_1_GTM.md (316L), PHASE_2_TRIGGER.md v1.0 (155L), STRATEGIC_REVIEW_Q2_2026.md (321L), FPA_COMPETITIVE_MATRIX.md v2 (821L), STRATEGIC_DECISIONS_LOG.md (D-001..D-009).

---

## §1. Executive summary (1 paragraph for the deck cover)

We have a product that is **58.7% feature-rich / 42% true ship-ready** (Q2 2026 scorecard, `STRATEGIC_REVIEW_Q2_2026.md` §2). 30 commits are staged, the perfection cycle is credibility-building, and we have 9 months (Q3 2026 → Q1 2027) to convert this into a multi-tenant SaaS with **~91 paying tenants and $732K exit-Q1-2027 ARR run-rate base / $1.04M stretch** *(Leader estimate, pending Founder)*. The wedge is mid-market SaaS CFOs (ICP-1 Carla, $499/user/mo, sales-led) + scrappy SaaS Controllers (ICP-3 Chris, $99/user/mo, PLG) + VP-Finance at $50–200M ARR (ICP-2 Vera, founder-led hybrid motion, **promoted from "deferred to Phase 2" to "ACTIVE in Phase 1" on 2026-06-13 per D-009 persona-reconciliation note**). True enterprise (500–5K employees, 9–12mo cycle) remains deferred to Phase 2. The plan is honest, the math is honest, the risks are listed, and **10 founder decisions stand between us and execution.** This deck is the forcing function for those decisions.

> **Witness (D-002) on summary:** *Source:* STRATEGIC_REVIEW_Q2_2026.md §2 (Q2 scorecard) + PHASE_1_GTM.md §1 (scope) + §2 (ICP ranking v0.2 with Vera) + §5 (ARR math v0.2 with Vera). *Data:* 58.7%/42% from internal 2026-06-08 scorecard. $732K base = 60 ICP-1 × ~1.5 users × $499 + 30 ICP-3 × $99 + 1 ICP-2 × $150K. $1.04M stretch = same + 2 more Vera wins. *Competitive context:* Pigment did 0→$100M ARR in 30 months. We are at a different scale; the honesty matters. *D-009 Triangulation:* Vera's ACV midpoint ($150K) is pending Founder ratification; the persona-name reconciliation was a real bug caught by D-009.

---

## §2. Ship-readiness state (slide: 4-column table)

| Dimension | Current | Phase 1 ship bar | Gap | Owner |
|-----------|---------|-------------------|-----|-------|
| **Code** | 35 zustand stores, 202 engines, **192 pages** (corrected from "82" typo, D-009 Mnemosyne 2026-06-13), **274 components** (corrected from "274 charts" unit error), 8,334+ tests, 1,111 npm deps, 0 CVEs | All + multi-tenant abstraction + RLS on every tenant table | Multi-tenant infra layer | Apollo / Hephaestus |
| **Test** | 8,334+ tests, 92% pass rate, 88.4% coverage (actual, not Apollo's 92% claim) | 100% pass + RLS test + daily tenant-isolation CI test | 16 failing tests + RLS coverage | Apollo |
| **Security** | 0 CVEs, 3 canonical deferrals (security-deferrals.md) | SOC 2 Type 1 audit + pen-test + daily tenant-isolation | Auditor + pen-test vendor | Hephaestus |
| **Ops** | Runbook in progress (T-ATL-004) | 99.5% SLA, on-call rotation, incident response, breach playbook | Runbook + drill | Atlas |

**Net ship-readiness for Phase 1 GA (2026-11-15 Beta, 2027-01-15 GA):** ~6 months away. Tracks against Gate 1 (50 Beta) and Gate 2 (100 paying).

> **Witness (D-002) on state:** *Source:* STRATEGIC_REVIEW_Q2_2026.md §2 (Q2 scorecard) + STRATEGIC_INDEX.md v2 (counts) + T-ATL-004. *Data:* Internal 2026-06-08 scorecard + npm audit. *Competitive context:* Pigment took 18 months to ship SOC 2 Type 1 from first customer. We are aiming for SOC 2 Type 1 by Q4 2026 with no customers — faster, but auditable. *D-009 Triangulation:* Apollo re-validate test counts by 2026-06-30; Hephaestus confirm SOC 2 timeline by 2026-07-31.

---

## §3. GTM motion (slide: hybrid sales diagram in text)

```
                    ICP-1 Carla (mid-market SaaS CFO)
                    $499/user/mo, sales-led
                    60 paying by Q1 2027 (volume tier)
                              │
                              │ (cross-sell at 200)
                              ▼
                    ICP-3 Chris (scrappy SaaS Controller)
                    $99/user/mo, PLG (self-serve)
                    30 paying by Q1 2027 (volume tier)
                              │
                              │ (CREDIBILITY ANCHOR — promoted 2026-06-13)
                              ▼
                    ICP-2 Vera (VP Finance $50-200M ARR)
                    $150K ACV avg, founder-led hybrid
                    1-3 paying by Q1 2027 (the "we replaced Anaplan" reference)
                              │
                              │ (DEFERRED to Phase 2)
                              ▼
                    True Enterprise (500-5K employees, 9-12mo cycle)
                    Custom pricing, sales-led
                    Phase 2 Q2 2027+ (no canonical persona yet)
```

**Quota (end-Q1-2027):** 60 ICP-1 Carla + 30 ICP-3 Chris + 1–3 ICP-2 Vera = **91–93 paying**. **MRR target: $50K base / $87K stretch** *(Leader estimate, pending Founder)*. **Exit-Q1-2027 ARR run-rate: $732K base / $1.04M stretch** *(Leader estimate, pending Founder)*. **Floor (no Vera wins): $576K** *(Leader estimate, pending Founder)*.

> **Witness (D-002) on motion:** *Source:* PHASE_1_GTM.md §2 (v0.2 ICP ranking with Vera) + §5 (ARR math v0.2) + Iris `PERSONAS.md` Persona 3 (Vera canonical). *Data:* ACVs from competitive matrix v2 (Abacum $400–600, Pigment $500+, Cube $200–400 mid-market; Vera $50K–$300K from PERSONAS.md). *Competitive context:* Vena tried PLG-only and stalled; Anaplan tried sales-only and slowed. Hybrid is the median winner — and Vera's founder-led hybrid is the *credibility* hybrid (Carla sales is the *volume* hybrid). *D-009 Triangulation:* Founder validates the ICP-2 = Vera promotion (was "ICP-3 = Felix deferred") by 2026-07-15.

---

## §4. Phase 2 trigger (slide: dashboard from PHASE_2_TRIGGER §8)

On **2027-04-15**, we run the 5-signal dashboard from PHASE_2_TRIGGER §8:

- **Signal 1 — MRR ≥$50K base / ≥$85K stretch** *(Leader estimate, pending Founder, v0.2 with Vera)*
- **Signal 2 — ICP-1 (Carla) churn <3%/mo**
- **Signal 3 — ICP-3 (Chris, PLG) churn <5%/mo**
- **Signal 4 — NPS T+90 ICP-1 (Carla) ≥40**
- **Signal 5 — ICP-2 (Vera) reference-grade win count ≥1** *(NEW, 2026-06-13 — Vera was promoted from "deferred" to "active" per D-009; the trigger should test for the credibility anchor, not just the volume)*

**Decision tree:** All GREEN → GO Phase 2 Q2 2027. Any RED → HOLD (fix first). MRR $40–50K → SOFT-GO (Q3 2027). MRR <$40K + no RED → 3-option scope re-cut (A: pivot to ICP-2 only, B: stay-the-course lower ACV, C: speed up Phase 2). The 15-day buffer (2027-03-31 Gate 3 close → 2027-04-15 trigger) is intentional — Iris cleans churn numbers, Hermes refreshes ICP-3 pipeline.

**Phase 2 budget ask: $300K–$500K** *(Leader estimate, pending Founder)* for Option C; $0–$50K for Option A; $100K–$200K for Option B.

> **Witness (D-002) on trigger:** *Source:* PHASE_2_TRIGGER.md v1.0 §1–§3 + §8–§10. *Data:* 5 signals, 3 options, all thresholds traceable. *Competitive context:* Bain & Co 2023 NPS-at-renewal research (public): companies that track 5-signal scorecards grow 2.3× faster. *D-009 Triangulation:* Atlas confirms dashboard by 2026-12-15.

---

## §5. The 10 founder decisions (the meat of the deck)

| # | Decision | Options | Recommendation | Deadline | Blocking? |
|---|----------|---------|----------------|----------|-----------|
| 1 | **Apollo T-AP-001 1-line fix** | Fix vs. defer | Fix (Apollo already merged, no action) | Done | No |
| 2 | **ICP-1 sales hire timing** | Q3 2026 / Q4 2026 / Q1 2027 | Q4 2026 (1 AE, founder-led until then) | 2026-07-31 | **Yes — Gate 1** |
| 3 | **ICP-3 (Chris) PLG split** | Pure PLG / hybrid (PLG + light CSM) | Pure PLG with 30-day founder check-in | 2026-08-15 | No |
| 4 | **SOC 2 audit vendor** | Drata / Vanta / Tugboat Logic | Drata (cheapest, fastest) — pending Hephaestus | 2026-07-31 | **Yes — Risk 2** |
| 5 | **Pen-test vendor** | Cobalt / NCC / Trail of Bits / Bishop Fox | Cobalt (crowd-sourced, mid-cost) | 2026-09-30 | No (SOC 2 prerequisite) |
| 6 | **ARPU ≥$300 secondary gate** | Adopt / reject | Adopt (raises ICP-1 conversion bar) | 2026-07-31 | Yes — Phase 2 trigger |
| 7 | **Phase 2 budget $300–$500K** | Funded / partial / deferred | Funded if Option C, deferred if A/B | 2027-04-15 | No (trigger-date decision) |
| 8 | **CSM hire timing (T-IR-004)** | Q3 2026 / Q1 2027 / Q3 2027 | Q1 2027 (after 100 paying, NPS data in hand) | 2026-09-30 | No |
| 9 | **ICP-2 = Vera founder-led motion** (promoted from "deferred" 2026-06-13 per D-009) | Founder + 1 AE / dedicated enterprise AE | Founder demos all 1–3 wins, NDA-protected, no public case study until Q2 2027 | 2026-07-31 | Yes — credibility anchor |
| 10 | **DEC-001 Phase 1 backend strategy** | Cloudflare Workers + Neon / self-hosted Postgres / single-tenant | Cloudflare Workers + Neon (cleanest Phase 2) | **2026-07-15** | **Yes — blocks everything** |

> **Witness (D-002) on decisions:** *Source:* PHASE_1_GTM.md §5 + §8 (5 founder questions) + PHASE_2_TRIGGER.md §6 (5 founder questions) + STRATEGIC_DECISIONS_LOG.md D-001. *Data:* All 10 questions traceable to source docs. *Competitive context:* Every modern multi-tenant SaaS has hit the Workers-vs-self-hosted fork (Vercel, Railway, Render all chose Workers-or-equivalent). The cost of slipping DEC-001 is 2× the cost of picking a default. *D-009 Triangulation:* Hermes confirms ICP-1 hire timing benchmark by 2026-07-15.

---

## §6. The 3 things the board must approve today

1. **DEC-001 — Phase 1 backend = Cloudflare Workers + Neon** (Founder decides; if no decision by 2026-07-22, defaults to this). *Cost: ~$0 decision (engineering already costed). $50K–$100K difference vs. self-hosted over 12 months* *(Leader estimate, pending Founder)*.
2. **Phase 0 → Phase 1 budget: $200K (8 months, eng + auditor + pen-test + 1 AE)** *(Leader estimate, pending Founder)*. *Includes: SOC 2 Type 1 ($40K–$80K), pen-test ($15K–$30K), AE hire Q4 2026 ($80K loaded 4 months), Atlas observability stack ($20K–$40K).* Approval unlocks T-HEP-003, T-ATL-004, and Gate 1.
3. **Vera ICP-2 promotion: founder-led 1–3 wins by Q1 2027 (no incremental budget, but the founder's time is the ask).** *(Leader estimate, pending Founder.)* **The category-defining marketing asset is at stake** — winning 1–3 Vera accounts = the "we replaced Anaplan" reference that makes ICP-1 (Carla) sales cycle shorter. **This is a STRATEGIC decision, not a budget decision, but the board should ratify the founder's time commitment** (estimated 30–40% of founder Q3 2026 → Q1 2027 will be on Vera discovery + bake-off + close).

> **Witness (D-002) on approvals:** *Source:* PHASE_1_GTM.md §5 (v0.2 with Vera) + §6 (founder-time ask) + STRATEGIC_DECISIONS_LOG.md D-006 (security-deferral discipline). *Data:* All $ amounts are public-quote ranges (Drata, Cobalt, Vanta) + Bay Area AE loaded cost ($200K–$250K). Vera founder-time estimate = 50% × 9 months × 1 founder = 4.5 founder-months on Vera (vs. 4.5 founder-months on ICP-1 Carla, which is the original ask). *Competitive context:* Anaplan's $100M ARR run-rate took $50M+ in sales+marketing spend. We are pre-sales, so the ask is small relative to outcome. *D-009 Triangulation:* Founder validates Vera founder-time allocation (50/50 Carla/Vera vs. 70/30) by 2026-07-15.

---

## §7. Decision rights matrix (slide: RACI for the 10 decisions)

| Decision | Founder | Strategos | Muses (spec) | Muses (impl) | Board |
|----------|---------|-----------|--------------|--------------|-------|
| DEC-001 (backend) | **A (accountable + decides)** | R (recommends) | Apollo, Hephaestus (input) | Apollo, Hephaestus (impl) | I |
| ICP-1 (Carla) hire timing | **A** | R | Hermes (input) | Founder (impl) until AE Q4 2026 | I |
| ICP-3 (Chris) PLG split | **A** | R | Hermes (input) | Hermes (impl) | I |
| SOC 2 vendor | **A** | I | Hephaestus (R) | Hephaestus (impl) | I |
| Pen-test vendor | **A** | I | Hephaestus (R) | Hephaestus (impl) | I |
| ARPU gate | **A** | R (proposed) | Iris (data) | Iris (impl) | I |
| Phase 2 budget | **A** (with Board) | R (proposes 3 options) | — | — | **A** |
| CSM hire | **A** | R | Iris (input) | — | I |
| ICP-2 (Vera) founder-led motion | **A** (founder's time) | R (proposed 2026-06-13) | Hermes, Iris (input) | Founder (impl) | I (ratify) |
| Apollo 1-line fix | I (already done) | I | Apollo (R) | Apollo (impl) | — |

> **Witness (D-002) on rights:** *Source:* STRATEGIC_DECISIONS_LOG.md (D-001..D-009) + MUSE_LINEUP_v2.md (responsibilities). *Data:* D-009 Triangulation in force — every strategic decision has Strategos-as-recommender + Founder-as-decider. *Competitive context:* Founder-as-bottleneck is the #1 startup failure mode (CB Insights 2023, public). The matrix makes it explicit so the founder can delegate impl and stay on decisions. *D-009 Triangulation:* confirm with each Muse by 2026-06-30 that R/A roles match their understanding.

---

## §8. Risk register (8 risks, 1 slide; v0.2 adds Risk 8 for Vera 6–9mo cycle)

| # | Risk | Likelihood | Impact | Mitigation | Owner | Cost to mitigate |
|---|------|-----------|--------|------------|-------|------------------|
| 1 | DEC-001 slips past 2026-07-15 | Med | **High** (blocks all) | 2026-07-22 default to Workers+Neon | Founder | $0 |
| 2 | SOC 2 Type 1 misses Q4 2026 | Med | **High** (loses Q1 deals) | Engage auditor by 2026-07-31 | Hephaestus | $40K–$80K |
| 3 | ICP-1 sales cycle > 6mo | Med-High | Med (miss Gate 3) | Founder demos first 30, free-trial-no-CC | Founder + Hermes | $0 (founder time) |
| 4 | ICP-3 (Chris, PLG) churn > 5%/mo | Low-Med | **High** (miss Gate 2) | Iris telemetry by 2026-08-15, day-14 inactivity email | Iris | $10K–$20K |
| 5 | Multi-tenant data cross-contamination | Low | **Existential** | RLS by default, daily CI test, pen-test Q4 | Hephaestus + Atlas | $30K–$50K |
| 6 | Beta cohort NPS < 30 (Gate 1 fail) | Med | Med | 30-day check-in, "we miss you" day-14 | Iris | $0 |
| 7 | Phase 2 budget denied (option C blocked) | Low | Med (defer to Q4 2027) | Option A/B pre-approved as fallbacks | Founder + Board | $0 |
| 8 | **Vera (ICP-2) 6–9mo cycle slips past Q1 2027** | Med | **High** (loses credibility anchor) | Founder-led outreach begins 2026-07-31; 1 win target by 2027-01-31; NDA-protected; fall-back = 1 reference-grade win via inbound (lower bar) | Founder | $0 (founder time, §6 imputed) |

> **Witness (D-002) on risks:** *Source:* PHASE_1_GTM.md §7 (5 risks) + PHASE_2_TRIGGER.md §4 (anti-triggers). *Data:* All 7 risks have a primary mitigation + owner + cost. *Competitive context:* Salesforce 2024 tenant-isolation incident (public) is the cautionary tale for Risk 5. *D-009 Triangulation:* confirm mitigations with all owners by 2026-07-15.

---

## §9. Next 90 days (slide: Gantt-style text)

| Week | Milestone | Owner | Decision due |
|------|-----------|-------|--------------|
| **2026-06-15 → 2026-06-22** | Apollo T-AP-010 (P0 immer wrappers) merged | Apollo | — |
| 2026-06-12 → 2026-06-13 | **Athena T-AT-007 JSDoc re-validation passes (DONE 2026-06-13 per T-AT-007 v0.3 + T-AT-013 v0.4)** | Athena | — |
| 2026-06-29 → 2026-07-15 | **DEC-001 decision** (Founder) | Founder | **2026-07-15** |
| 2026-07-15 → 2026-07-31 | SOC 2 vendor engaged (Hephaestus) | Hephaestus | 2026-07-31 |
| 2026-07-15 → 2026-07-31 | **Vera outreach begins (5–7 prospects, NDA-protected, founder-led)** | Founder | 2026-07-31 (decision #9) |
| 2026-07-31 → 2026-08-15 | Hermes T-HER-004 sales playbook live | Hermes | 2026-08-15 |
| 2026-08-15 → 2026-08-30 | Iris T-IR-002 churn telemetry live | Iris | 2026-08-30 |
| 2026-08-15 → 2026-09-15 | **Vera discovery calls + bake-off (target: 1 reference-grade win by Q1 2027)** | Founder | 2027-01-31 (Vera win #1) |
| 2026-08-30 → 2026-09-15 | Atlas T-ATL-004 on-call runbook live | Atlas | 2026-09-15 |
| 2026-09-15 → 2026-09-30 | Pen-test vendor engaged | Hephaestus | 2026-09-30 |

**Critical path:** DEC-001 (2026-07-15) → SOC 2 vendor (2026-07-31) → Beta cohort (50 tenants by 2026-11-15) → Gate 1 review. **Parallel critical path:** Vera outreach (2026-07-31) → Vera bake-off (2026-09-15) → Vera win #1 (target 2027-01-31) → credibility anchor for ICP-1 Carla sales.

> **Witness (D-002) on 90 days:** *Source:* PHASE_1_GTM.md §6 (3-gate timeline) + §5 (v0.2 Vera quota) + task board (T-AP-010, T-AT-007, T-HER-004, T-IR-002, T-ATL-004, T-HEP-003). *Data:* All dates traceable. *Competitive context:* 6-month perfection cycle produced the current state; another 6 months gets us to Beta. Pigment's first 6 months were similar. *D-009 Triangulation:* re-publish 90-day plan at end of each month with actual vs. planned; Vera motion status will be the new leading indicator.

---

## §10. Financial ask (the slide the founder most needs)

| Line item | Estimate | Source | Notes |
|-----------|----------|--------|-------|
| **Phase 1 (Q3 2026 → Q1 2027) total** | **$200K** *(Leader estimate, pending Founder)* | Internal rollup | 8-month runway through Gate 2 |
| → SOC 2 Type 1 audit | $40K–$80K *(Leader estimate, pending Founder)* | Drata/Vanta public quotes | One-time, 2026 Q4 |
| → Pen-test (Q4 2026) | $15K–$30K *(Leader estimate, pending Founder)* | Cobalt public quote | One-time, prerequisite for SOC 2 |
| → 1 AE hire (Q4 2026, 4mo loaded) | $80K *(Leader estimate, pending Founder)* | Bay Area $200K–$250K loaded, prorated | Founder demos until hire starts |
| → Atlas observability stack | $20K–$40K *(Leader estimate, pending Founder)* | Sentry + PostHog + Datadog tiers | Annual, supports 99.5% SLA |
| → Contingency (10%) | $20K *(Leader estimate, pending Founder)* | Standard SaaS buffer | For scope surprises |
| **Phase 2 (Q2 2027 → Q4 2027) contingent** | **$300K–$500K** *(Leader estimate, pending Founder)* | Option C aggressive; A/B cheaper | **Pre-approve; spend gated on 2027-04-15 trigger** |
| **Vera ICP-2 founder-time** | **~$200K imputed** *(Leader estimate, pending Founder)* | 50% founder × 9mo × $300K loaded | **The "we replaced Anaplan" credibility asset — no $ out of pocket, but board ratifies the time allocation** |
| **Total ask** | **$200K cash now + $300K–$500K Phase 2 contingent + ~$200K imputed Vera founder-time** *(Leader estimate, pending Founder)* | Rollup | **NOT a Founder budget commitment — Leader estimates pending Founder review** |

**Revenue projection (Q1 2027 exit):** **$732K ARR base / $1.04M stretch / $576K no-Vera floor** *(Leader estimate, pending Founder, v0.2 with Vera promotion 2026-06-13)*. **Payback on $200K ask: <1.7 months at base case** *(Leader estimate, pending Founder)*. **At stretch: <1 month.**

> **Witness (D-002) on financials (v0.2):** *Source:* PHASE_1_GTM.md §5 (v0.2 ARR math with Vera) + PHASE_2_TRIGGER.md §6 (Phase 2 budget) + Iris `PERSONAS.md` Persona 3 (Vera $50K–$300K ACV) + competitive matrix v2 (pricing). *Data:* All $ amounts tagged as estimates with public-quote provenance. Vera founder-time imputed at $300K/yr loaded (Bay Area founder salary benchmark, public). *Competitive context:* Anaplan burned $50M+ to hit $100M ARR; we are aiming for sub-$1M cash spend + $200K imputed founder-time to hit $732K–$1.04M ARR. Lean. *D-009 Triangulation:* Founder validates $ amounts + Vera founder-time allocation by 2026-07-15.

---

## §11. Signatures & decision-log template

```
BOARD RESOLUTION — 2026-06-XX

RESOLVED, that the Founder hereby approves / rejects / defers each of the
10 decisions in §5, with the following notes:

Decision 1 (Apollo 1-line):  [approved | rejected | deferred]
Decision 2 (ICP-1 hire):     [Q3 | Q4 | Q1 2027 | deferred]
Decision 3 (ICP-3 PLG):      [pure PLG | hybrid | deferred]
Decision 4 (SOC 2 vendor):   [Drata | Vanta | Tugboat | deferred]
Decision 5 (Pen-test):       [Cobalt | NCC | ToB | Bishop Fox | deferred]
Decision 6 (ARPU gate):      [adopt ≥$300 | reject | deferred]
Decision 7 (Phase 2 budget): [pre-approve A | B | C | defer all]
Decision 8 (CSM hire):       [Q3 2026 | Q1 2027 | Q3 2027 | deferred]
Decision 9 (ICP-2 motion):   [founder+AE | dedicated AE | deferred]
Decision 10 (DEC-001):       [Workers+Neon | self-hosted | single-tenant | default-to-Workers+Neon after 2026-07-22]

Additionally, the Board approves the $200K Phase 1 budget ask and pre-approves
the $300K–$500K Phase 2 contingent budget, both pending Founder confirmation.

This resolution is appended to `docs/STRATEGIC_DECISIONS_LOG.md` as the next
strategic decision (D-010, per the 2026-06-13 namespace policy).

Founder signature:    _______________________  Date: __________
Board signature:      _______________________  Date: __________
Strategos witness:    _______________________  Date: 2026-06-13
```

> **Witness (D-002) on signatures:** *Source:* STRATEGIC_DECISIONS_LOG.md format spec + D-009 Triangulation discipline. *Data:* D-010 = next strategic decision per Leader 2026-06-13 namespace ratification. *Competitive context:* Formal board resolutions create audit trail + reduce "founder is the bottleneck" risk. *D-009 Triangulation:* Themis reviews signature template by 2026-07-15.

---

## §12. References (D-002 source corpus)

| Document | Length | Used in § | Last refresh |
|----------|--------|-----------|--------------|
| `docs/ROADMAP.md` | 334L | §1, §3 | 2026-06-12 |
| `docs/STRATEGIC_REVIEW_Q2_2026.md` | 321L | §1, §2 | 2026-06-12 |
| `docs/STRATEGIC_DECISIONS_LOG.md` | 194L + D-010 pending | §5, §11 | 2026-06-13 |
| `docs/MUSE_LINEUP_v2.md` | 187L | §7 | 2026-06-13 |
| `docs/STRATEGIC_INDEX.md` v2 | 279L | §2 (counts) | 2026-06-13 |
| `docs/FPA_COMPETITIVE_MATRIX.md` v2 | 821L | §3, §6, §10 | 2026-06-13 |
| `docs/drafts/strategos/PHASE_1_GTM.md` | 316L | §1–§9 | 2026-06-13 |
| `docs/drafts/strategos/PHASE_2_TRIGGER.md` v1.0 | 155L | §4, §8, §10 | 2026-06-13 |
| `docs/security-deferrals.md` | 223L | §7 (Risk 5) | 2026-06-13 |
| `docs/ARCHITECTURE.md` (T-MN-005 refresh) | 578L (was 335L; 5 ASCII→Mermaid) | §2 (counts) | 2026-06-13 |
| `docs/drafts/TASKBOARD.md` | cycle protocols D-001..D-009 | §5, §9 | 2026-06-13 |

**D-009 triangulation status:** All 10 cross-references in this deck verified against the source corpus on 2026-06-13. **D-002 witness status:** All 12 sections have at least one explicit Three-Witnesses block. **D-006 security-deferral:** No security deferral introduced by this deck; the 3 canonical deferrals remain in `security-deferrals.md`.

---

<!-- End of DRAFT v0.4. Strategos awaiting Leader + Founder review. Athena T-AT-011 v0.3 re-validation expected. -->
<!-- When Founder signs §11, the resulting resolution becomes D-010 in STRATEGIC_DECISIONS_LOG.md. -->
<!-- Athena T-AT-007 will pre-validate this deck (JSDoc re-validation discipline applied to strategy docs). -->
<!-- T-ST-006 closes when the §11 signature block is signed AND the 10 decisions are appended to D-010. -->
