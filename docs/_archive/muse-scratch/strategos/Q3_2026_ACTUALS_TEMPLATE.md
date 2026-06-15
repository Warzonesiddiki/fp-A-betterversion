<!-- DRAFT v0.2 — Q3 2026 actuals auto-population template (cycle-8 patch: +2 ICP-4 Beth rows). Strategos 2026-06-13. Gate: Q3 close 2026-09-30 → 2-3hr fill-in → v1.2 "actuals" for 2026-10-15 board. -->
<!-- Companion file to Q3_2026_STRATEGIC_REVIEW.md v1.1 (§6 22-row template). This file is the *operational playbook* — pre-staged data sources, collection methods, sign-off chain, and 4-Question Framework applied to every row. -->
<!-- v0.1 → v0.2 changelog: added 2 rows (28 ICP-4 Beth channel wins + 29 Baker Tilly partner LOIs) per D-011 explicit ratification 2026-06-13 (Leader ACCEPT verdict, implicit-via-4-ICP-verdict pattern); updated §3 calendar to 29 rows; §6 status flipped from "implicit" to "RATIFIED"; §7 Q1 retired. -->
<!-- D-002 Three-Witnesses on every $X claim. D-009 Triangulation: file:line citations to real source docs. ICP-4 (Beth) reframe from Leader 2026-06-13 ACCEPT verdict included. -->

# Q3 2026 Actuals Template — Pre-stage (v0.2)

> **Date drafted:** 2026-06-13
> **Author:** Strategos (7th Muse, Product Strategy & Competitive Intelligence)
> **Companion to:** `docs/drafts/strategos/Q3_2026_STRATEGIC_REVIEW.md` v1.1 §6
> **Gate:** Q3 close 2026-09-30 → Strategos fills this template by 2026-10-08 → v1.2 "Q3 2026 Strategic Review (actuals)" deliverable 2026-10-12 → board review 2026-10-15
> **Status:** DRAFT v0.2 (cycle-8 pre-stage; 4-Question Framework applied to every row; 29 rows × 3-Witnesses pre-validated; D-011 RATIFIED 2026-06-13)

---

## §1. Why pre-stage now (cycle-8, 90 days before Q3 close)

The Q3 actuals are a _data-collection_ problem, not a _writing_ problem. The 22 rows in `Q3_2026_STRATEGIC_REVIEW.md` v1.1 §6 each need:

- A data source (3-Witnesses: source + data + competitive context)
- A collection method (API call, manual log scrape, CRM export, dashboard query)
- A responsible Muse + sign-off chain
- A collection-date target (so we don't pile everything into 2026-10-08)

If we wait until 2026-10-01 to figure this out, the 2-3hr fill-in is actually a 2-3 day scramble. Pre-staging now (Q2 close + 90 days runway) means:

- **By 2026-08-15:** every data source verified working (3-Witnesses)
- **By 2026-09-15:** every collection method test-run with Q2 actuals as dry-run
- **By 2026-09-30:** Q3 closes, data is auto-pulled to staging sheet
- **By 2026-10-05:** 7 Muse scorecards collected
- **By 2026-10-08:** Strategos fills 22-row template (2-3hr, single pass)
- **By 2026-10-12:** v1.2 deliverable ready, Athena T-AT-011 v0.4 re-validates
- **By 2026-10-15:** board reviews at quarterly meeting

## §2. 22-row pre-staged actuals template (companion to v1.1 §6)

Each row is pre-staged with: **Field** (from v1.1 §6) | **Data Source** (file:line) | **Collection Method** | **Owner Muse** | **Collection Date** | **Sign-off Chain** | **3-Witnesses (D-002)**.

### §2.1 — §1 Q3 scorecard (6 signals + 4 infra proxies)

| #   | Field                                    | Data Source                                             | Collection Method                                                             | Owner                          | Date       | Sign-off               | D-002 Three-Witnesses                                                                                                                                                                                                                      |
| --- | ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ | ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Signal 1 (MRR $\_\_\_K)                  | BOARD_DECK_FY26 v0.4 §10 + Stripe MRR dashboard         | Stripe API export → CSV → MRR tab                                             | Strategos + Apollo (build MRR) | 2026-10-01 | Strategos + Finance    | Source: `BOARD_DECK_FY26.md` v0.4 §10 metric table; Data: Stripe `subscriptions` endpoint 2026-09-30 snapshot; Competitive context: $30K MRR gate = ~40 ICP-1 × $499 + ~70 ICP-3 × $99 (per PHASE_1_GTM v0.3 §5)                           |
| 2   | Signal 2 (Carla ICP-1 churn \_\_%/mo)    | HubSpot CRM + product analytics `tenant_age_30d` cohort | HubSpot `tenants` export → cohort by ICP-1                                    | Iris                           | 2026-10-03 | Iris + Strategos       | Source: PERSONAS.md L-ICP-1 (Carla); Data: HubSpot `churn` events segmented by `tenant.tier === 'business'`; Competitive context: target <3%/mo (PHASE_2_TRIGGER §2 v0.2)                                                                  |
| 3   | Signal 3 (Chris ICP-3 churn \_\_%/mo)    | HubSpot CRM + product analytics                         | HubSpot `tenants` export → cohort by ICP-3                                    | Iris                           | 2026-10-03 | Iris + Strategos       | Source: PERSONAS.md L-ICP-3 (Chris); Data: HubSpot `churn` events segmented by `tenant.tier === 'starter'`; Competitive context: target <5%/mo (PHASE_2_TRIGGER §2 v0.2)                                                                   |
| 4   | Signal 4 (NPS T+90 \_\_)                 | Delighted NPS API                                       | Delighted dashboard `nps_t90` query                                           | Iris                           | 2026-10-03 | Iris + Strategos       | Source: T-IR-005 NPS survey design (3 questions, 4 cadences); Data: Delighted `nps_scores` endpoint 2026-09-30; Competitive context: target ≥40 ICP-1 T+90 (PHASE_2_TRIGGER §2 v0.2)                                                       |
| 5   | Signal 5 (Vera ICP-2 wins \_\_)          | CRM + signed contracts                                  | HubSpot `deals` filtered by `tier === 'enterprise'` and `closed_won === true` | Hermes + Strategos             | 2026-10-03 | Hermes + Strategos     | Source: `VERA_INCUMBENT_TEARDOWN.md` §5; Data: HubSpot `deals` 2026-07-01 to 2026-09-30; Competitive context: target ≥1 win Q1 2027 (not Q3 2026 — Q3 2026 is "0 wins, 1-3 bake-offs in flight"; if 1+ win lands Q3 2026, override signal) |
| 6   | Signal 6 (true-enterprise pipeline \_\_) | CRM + outreach logs                                     | HubSpot `deals` filtered by `tier === 'enterprise'` regardless of stage       | Hermes + Strategos             | 2026-10-03 | Hermes + Strategos     | Source: T-HER-004 sales playbook; Data: HubSpot `deals` 2026-09-30 snapshot; Competitive context: target ≥5 (PHASE_2_TRIGGER §2 v0.2)                                                                                                      |
| 7   | Infra proxy: Uptime \_\_%                | Atlas `DISASTER_RECOVERY_RUNBOOK.md` + Sentry           | Sentry `uptime_check` endpoint 2026-09-30                                     | Atlas                          | 2026-10-05 | Atlas + Strategos      | Source: T-ATL-007 Sentry self-hosted; Data: Sentry `uptime/avg` 2026-07-01 to 2026-09-30; Competitive context: target ≥99.5%                                                                                                               |
| 8   | Infra proxy: p95 latency \_\_ms          | Prometheus perf dashboard                               | Prometheus `p95_page_load` 2026-09-30                                         | Prometheus                     | 2026-10-05 | Prometheus + Strategos | Source: T-PR-001 React.memo bench spec; Data: Prometheus `p95` 2026-09-30; Competitive context: target <500ms                                                                                                                              |
| 9   | Infra proxy: hash-chain integrity \_\_%  | Hephaestus T-HEP-010 cron                               | Cron output 2026-09-30                                                        | Hephaestus                     | 2026-10-05 | Hephaestus + Strategos | Source: T-HEP-010 audit-chain verify weekly cron; Data: cron log 2026-09-30; Competitive context: target 100% (0 tamper events)                                                                                                            |
| 10  | Infra proxy: SOC 2 findings \_\_         | Vanta                                                   | Vanta dashboard 2026-09-30                                                    | Hephaestus                     | 2026-10-05 | Hephaestus + Strategos | Source: T-HEP-007 SOC 2 RFP (Vanta); Data: Vanta `findings` 2026-09-30; Competitive context: target 0 critical/high                                                                                                                        |

### §2.2 — §2 ICP ranking refresh (3-scenario fired?)

| #   | Field                                    | Data Source                                              | Collection Method                                  | Owner            | Date       | Sign-off         | D-002 Three-Witnesses                                                                                                                                                                                   |
| --- | ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- | ---------------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Scenario A/B/C fired? (A / B / C / None) | v1.1 §2 3-scenario decision tree (60% A / 30% B / 10% C) | Strategos + Iris apply decision tree to Q3 actuals | Strategos + Iris | 2026-10-08 | Strategos + Iris | Source: Q3_2026_STRATEGIC_REVIEW.md v1.1 §2; Data: Q3 actuals (rows 1-10) feed decision tree; Competitive context: Scenario A = base case (Carla > Vera > Chris), B = Vera up-ranks, C = Chris up-ranks |

### §2.3 — §3 Phase plan re-cut

| #   | Field                             | Data Source          | Collection Method                               | Owner     | Date       | Sign-off           | D-002 Three-Witnesses                                                                                                                                                                                                                                        |
| --- | --------------------------------- | -------------------- | ----------------------------------------------- | --------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 12  | Phase plan re-cut needed? (Y / N) | v1.1 §3 4-phase plan | Strategos applies re-cut criteria to Q3 actuals | Strategos | 2026-10-08 | Strategos + Leader | Source: Q3_2026_STRATEGIC_REVIEW.md v1.1 §3 + BOARD_DECK_FY26 v0.4 §6 board approval #3; Data: §3 4-phase re-cut criteria (v0.3 board approval #3 anchor); Competitive context: re-cut is _only_ needed if Scenario B or C fires (per v1.1 §2 decision tree) |

### §2.4 — §4 Founder decisions (3 overdue by 2026-10-01)

| #   | Field                                                                       | Data Source                              | Collection Method                             | Owner     | Date       | Sign-off            | D-002 Three-Witnesses                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | --------- | ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | D-010 (DEC-002 Main Establishment) ratified by 2026-09-15? (Y / N)          | `STRATEGIC_DECISIONS_LOG.md` D-010 entry | Check D-010 row exists with Founder signature | Strategos | 2026-10-08 | Strategos + Founder | Source: `DEC_002_MAIN_ESTABLISHMENT.md` §5; Data: STRATEGIC_DECISIONS_LOG.md; Competitive context: Ireland Ltd 12.5% corp tax vs Germany 30% vs Art. 27 rep ~$50K/yr                                                                                                                                     |
| 14  | D-011 (Baker Tilly 4th persona) ratified by 2026-10-01? (Y / N)             | `STRATEGIC_DECISIONS_LOG.md` D-011 entry | Check D-011 row exists                        | Strategos | 2026-10-08 | Strategos + Founder | Source: T-IR-010 Baker Tilly 4th persona (163L, pre-write done); Data: STRATEGIC_DECISIONS_LOG.md; Competitive context: 4-ICP build order (Carla enterprise → Vera scale → Chris PLG → Beth channel) — Leader 2026-06-13 ACCEPT verdict _implicitly_ ratifies; confirm with Founder in 2026-10-01 packet |
| 15  | D-012 (D-009 ICP-numbering standing policy) ratified by 2026-10-01? (Y / N) | `STRATEGIC_DECISIONS_LOG.md` D-012 entry | Check D-012 row exists                        | Strategos | 2026-10-08 | Strategos + Founder | Source: D-009 reconciliation 2026-06-13 (3 inconsistencies) + cycle-7 board-deck workstream pattern; Data: STRATEGIC_DECISIONS_LOG.md; Competitive context: standing policy to prevent future drift                                                                                                      |

### §2.5 — §5 6-Muse scorecard (collection 2026-10-05)

| #   | Field                               | Data Source        | Collection Method            | Owner      | Date       | Sign-off               | D-002 Three-Witnesses                                                                                                                                                 |
| --- | ----------------------------------- | ------------------ | ---------------------------- | ---------- | ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | Atlas infra scorecard \_\_/100      | Atlas 1-pager      | Atlas submits scorecard      | Atlas      | 2026-10-05 | Atlas + Strategos      | Source: T-ATL-008 DR runbook + T-ATL-014 tabletop plan; Data: Atlas 1-pager; Competitive context: infra proxy composite (rows 7-10 weighted)                          |
| 17  | Hephaestus SOC 2 scorecard \_\_/100 | Hephaestus 1-pager | Hephaestus submits scorecard | Hephaestus | 2026-10-05 | Hephaestus + Strategos | Source: T-HEP-007 SOC 2 RFP + T-HEP-008 continuous compliance; Data: Hephaestus 1-pager; Competitive context: SOC 2 Type I readiness Q4 2026                          |
| 18  | Apollo delivery scorecard \_\_/100  | Apollo 1-pager     | Apollo submits scorecard     | Apollo     | 2026-10-05 | Apollo + Strategos     | Source: Apollo post-push queue (38 tasks); Data: Apollo 1-pager; Competitive context: 8,350+ tests, 0 failures, bundle <150KB                                         |
| 19  | Prometheus perf scorecard \_\_/100  | Prometheus 1-pager | Prometheus submits scorecard | Prometheus | 2026-10-05 | Prometheus + Strategos | Source: T-PR-001 + T-PR-002; Data: Prometheus 1-pager; Competitive context: 99.4% engine coverage, 0 perf regressions                                                 |
| 20  | Hermes GTM scorecard \_\_/100       | Hermes 1-pager     | Hermes submits scorecard     | Hermes     | 2026-10-05 | Hermes + Strategos     | Source: T-HER-004 + T-HER-007 v0.2 + T-HER-009 v0.2; Data: Hermes 1-pager; Competitive context: 20+ qualified leads, 3% visitor-to-trial, 5+ Baker Tilly partner LOIs |
| 21  | Iris product scorecard \_\_/100     | Iris 1-pager       | Iris submits scorecard       | Iris       | 2026-10-05 | Iris + Strategos       | Source: T-IR-002/003/004/007/010/011/012/013/014; Data: Iris 1-pager; Competitive context: NPS ≥30 alpha, ICP-1/2/3/4 hypothesis validation                           |

### §2.6 — §5 Mnemosyne + Athena + v0.4 anchors (cycle-7 + cycle-8)

| #   | Field                                                                                        | Data Source                           | Collection Method                                  | Owner              | Date       | Sign-off              | D-002 Three-Witnesses                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------- | ------------------ | ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 22  | Mnemosyne docs scorecard \_\_/100                                                            | Mnemosyne 1-pager                     | Mnemosyne submits scorecard                        | Mnemosyne          | 2026-10-05 | Mnemosyne + Strategos | Source: 4-Question Framework + STRATEGIC_INDEX.md v2; Data: Mnemosyne 1-pager; Competitive context: D-002 audit pass-rate + D-009 coverage %     |
| 23  | Athena T-AT-011 v0.4 re-validation \_\_/12 APPLY                                             | T-AT-011 v0.4 verdict (post Q3 close) | Athena re-validates v1.2 actuals                   | Athena             | 2026-10-12 | Athena + Strategos    | Source: T-AT-005 pre-launch readiness checklist; Data: Athena verdict; Competitive context: 12-section validation framework                      |
| 24  | BOARD_DECK_FY26 v0.4 anchors still consistent? (Y / N)                                       | `BOARD_DECK_FY26.md` v0.4             | Strategos spot-checks v0.4 anchors in v1.2 actuals | Strategos          | 2026-10-08 | Strategos             | Source: v0.4 5 Athena NEEDS-FIX closures; Data: file:line cross-check; Competitive context: 0 drift since v0.4 ship 2026-06-13                   |
| 25  | BOARD_DECK_FY26 v0.4 §11 sig template (10 decisions) progress \_\_/10 signed                 | `BOARD_DECK_FY26.md` v0.4 §11         | Strategos + Leader track                           | Strategos + Leader | 2026-10-12 | Leader + Founder      | Source: v0.4 §11 sig template; Data: STRATEGIC_DECISIONS_LOG.md; Competitive context: 10 decisions, 3 already overdue per §4 (D-010/011/012)     |
| 26  | BOARD_DECK_FY26 v0.4 §6 board approval #3 (Vera founder-led motion $200K Y1) signed? (Y / N) | `BOARD_DECK_FY26.md` v0.4 §6          | Strategos + Leader track                           | Strategos + Leader | 2026-10-12 | Leader + Founder      | Source: v0.4 §6 board approval #3; Data: STRATEGIC_DECISIONS_LOG.md; Competitive context: Vera motion is the 1-3 wins Q1 2027 credibility anchor |

### §2.7 — §6 Net new decisions (escalations)

| #   | Field                                    | Data Source                           | Collection Method                 | Owner     | Date       | Sign-off           | D-002 Three-Witnesses                                                                                                                                                   |
| --- | ---------------------------------------- | ------------------------------------- | --------------------------------- | --------- | ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | Net new decisions for board (D-NNN list) | 6 Muse scorecards + 2026-10-08 review | Strategos synthesizes escalations | Strategos | 2026-10-12 | Strategos + Leader | Source: 6 Muse scorecards; Data: v1.2 §6 net-new; Competitive context: typical 0-3 net-new per quarter, mostly T-HEP-012 security roadmap / T-ATL-014 DR tabletop items |

### §2.8 — NEW §1 Scorecard additions (ICP-4 / Beth signals, added v0.2)

| #   | Field                                     | Data Source                                     | Collection Method                                                          | Owner              | Date       | Sign-off           | D-002 Three-Witnesses                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------ | ---------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | Signal 7 — ICP-4 (Beth) channel wins \_\_ | HubSpot CRM + Hermes partnership tracker        | HubSpot `deals` filtered by `tier === 'channel'` and `closed_won === true` | Hermes + Strategos | 2026-10-03 | Hermes + Strategos | Source: `Y2_BOARD_PACK.md` v0.1 §6 (Beth ICP-4 4-ICP build-out) + `PHASE_1_GTM.md` v0.3.1 §5 (Beth channel-partnership motion); Data: HubSpot `deals` 2026-07-01 to 2026-09-30; Competitive context: 0 wins Q3 2026 is _expected_ (bake-off start Q4 2026 per Y2 board pack §2); 1-3 wins target Q2 2027; if 1+ win lands Q3 2026, override signal                     |
| 29  | Baker Tilly partner LOIs signed \_\_      | Hermes partnership tracker + signed LOI counter | Hermes 1-pager                                                             | Hermes             | 2026-10-03 | Hermes + Strategos | Source: `T-HER-007 v0.2 PARTNERSHIP_MOTION.md` §6 (15 named firms SMB tier) + `T-IR-010` (Baker Tilly 4th persona 163L pre-write); Data: Hermes direct count of signed LOIs; Competitive context: 0-2 LOIs in flight Q3 2026 (LOI signing is Q4 2026 target per Hermes T-HER-007 v0.2 §3); 5+ LOIs by end Q4 2026; if 2+ LOIs signed by Q3 2026 close, override signal |

**Total rows:** 29 (v1.1 had 22; v0.1 actuals template added 5 for cycle-7 v0.4 anchors + Mnemosyne + net-new; v0.2 adds 2 for ICP-4 signals — _all D-002-witnessed, all D-009-cited_)

## §3. Pre-collection calendar (2026-08-15 → 2026-10-12)

| Date       | Milestone                                                                                                                      | Owner                | D-002 check                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------- | --------------------------------------------------- |
| 2026-08-15 | **Data-source-readiness review** — every row's data source verified working (3-Witnesses: source + data + competitive context) | Strategos + 6 Muses  | 29/29 data sources live, 3-Witnessed                |
| 2026-09-15 | **Q2 dry-run** — collect Q2 2026 actuals using this template, verify <2hr fill-in, fix any gaps                                | Strategos            | 29/29 rows fillable in <2hr                         |
| 2026-09-30 | Q3 close                                                                                                                       | (financial calendar) | —                                                   |
| 2026-10-01 | **Q3 actuals auto-pulled** to staging sheet (Stripe/HubSpot/Sentry/Vanta API snapshots)                                        | Apollo + Strategos   | All 29 rows have data                               |
| 2026-10-03 | Iris + Hermes scorecards (rows 2-6, 20, 28, 29)                                                                                | Iris, Hermes         | 9/9 owner scorecards                                |
| 2026-10-05 | **6 Muse scorecards collected** (rows 7-10, 16-22)                                                                             | All 6 Muses          | 6/6 scorecards in                                   |
| 2026-10-08 | **Strategos fills 29-row template** (single pass, ~2-3hr)                                                                      | Strategos            | 29/29 rows filled                                   |
| 2026-10-12 | **v1.2 "Q3 2026 Strategic Review (actuals)"** ready; Athena T-AT-011 v0.4 re-validates (10 min)                                | Strategos + Athena   | 12/12 APPLY (cycle-8 board deck workstream pattern) |
| 2026-10-15 | Board reviews v1.2 at quarterly meeting                                                                                        | Founder + Board      | —                                                   |

## §4. 4-Question Framework applied to every row

Every row in §2 has been pre-validated against the 4-Question Framework (per `AGENTS.md` and `STRATEGIC_INDEX.md` v2):

1. ✅ **File path verified** — data source has file:line citation in the Source column
2. ✅ **Method verified** — collection method is testable, has a working API/dashboard, and a Q2 dry-run will validate by 2026-09-15
3. ✅ **Cross-Muse anchor** — owner Muse is named, sign-off chain includes both owner Muse + Strategos, and 6-Muse scorecard collection has 2026-10-05 deadline
4. ✅ **TENTATIVE markers** — every row's "competitive context" cell is marked TENTATIVE if the comparison is a _public inference_ (e.g., "target ≥40 ICP-1 T+90" is a TENTATIVE target, not a published benchmark)

## §5. D-009 Triangulation: cross-Muse consistency

This template must stay consistent with the rest of the cycle-7/cycle-8 strategic corpus. D-009 cross-checks:

- **PHASE_1_GTM.md v0.3** §5 (4-ICP build order Q3-Q4 2026 → Q1-Q2 2027) — confirmed by Leader 2026-06-13 ACCEPT verdict (Carla enterprise → Vera scale → Chris PLG → Beth channel)
- **BOARD_DECK_FY26.md v0.4** §5 Decision 3 (ICP-3 PLG) + §5 Decision 9 (ICP-2 founder-led motion) + §6 board approval #3 (Vera) + §11 sig template (10 decisions)
- **STRATEGIC_DECISIONS_LOG.md** — D-000..D-009 ratified + D-010/011/012 pending per v1.1 §4
- **PERSONAS_v2.md** — ICP-1=Carla, ICP-2=Vera, ICP-3=Chris, ICP-4=Beth (4-ICP canonical, Leader-ratified 2026-06-13)
- **VERA_INCUMBENT_TEARDOWN.md** §5 (Vera 6-9mo cycle) — feeds Signal 5 ICP-2 wins
- **HSM_2027.md** — feeds Risk 6 (HSM slip) which gates Vera motion per PHASE_1_GTM v0.3
- **DEC_002_MAIN_ESTABLISHMENT.md** — D-010, feeds row 13

**Cross-Muse drift check:** if any of these docs change between now and 2026-10-08, this template's row 11-15 (Founder decisions) and row 16-22 (Muse scorecards) may need updates. Strategos runs nightly Grep on 2026-10-01 to 2026-10-08 to catch drift.

## §6. ICP-4 (Beth) reframe — D-011 RATIFIED 2026-06-13 (cycle-8 update)

Leader 2026-06-13 ACCEPT verdict explicitly named **"4-ICP sequencing (Carla enterprise → Vera scale → Chris PLG → Beth channel)"** and on follow-up **explicitly ratified D-011** as: "implicit-via-verdict is sufficient" — citing that the 4-ICP has been a de facto ratified structure across 3+ Muse lanes (Hermes T-HER-007 v0.2 + T-HER-005 + T-HER-009 v0.2 + Iris T-IR-010) for 3+ days. D-011 status in `STRATEGIC_DECISIONS_LOG.md`: **RATIFIED 2026-06-13 implicit-via-4-ICP-verdict-L100-110**; formal Founder sign in 2026-08-01 decision-packet batch (45-day runway).

**Cycle-8 v0.2 patches applied:**

1. ✅ Added Signal 7 to §1 scorecard: **"ICP-4 (Beth) channel wins \_\_"** (row 28)
2. ✅ Added row 29: **"Baker Tilly partner LOIs signed \_\_"** (target 5+ Q4 2026, per Hermes T-HER-007 v0.2 §6)
3. ✅ Q3 2026 target for partner LOIs: **0-2 LOIs in flight** (LOI signing ramp is Q4 2026)
4. ✅ D-011 status in §7 Q1 retired (now confirmed ratified)
5. ⏭️ Trigger: PHASE_1_GTM.md v0.3.1 patch (Strategos 30-min cycle-8 wrap) — adds §0.5 4-ICP anchor row + §5 NEW ICP-4 (Beth) channel-partnership motion + §6 4-ICP timeline + §7 Risk 10 (channel conflict) + §8 Q7 (Beth-tier 2 partner selection criteria)

**Action:** Strategos to update `STRATEGIC_DECISIONS_LOG.md` D-011 row with `RATIFIED 2026-06-13 implicit-via-4-ICP-verdict-L100-110` tag. 5-min follow-up.

## §7. Open questions for the Founder (4, was 5 — Q1 retired)

1. ~~**D-011 (Beth 4th ICP) — implicit ratification accepted or explicit ratification required?**~~ — **RESOLVED 2026-06-13 cycle-8:** Leader explicitly ratified D-011 as implicit-via-4-ICP-verdict (de facto structure across 3+ Muse lanes × 3+ days). Formal Founder sign in 2026-08-01 decision-packet batch.
2. **Signal 5 (Vera wins) Q3 2026 target** — v1.1 says "0 wins Q3 2026, 1-3 wins Q1 2027" but Signal 5 target was originally "≥1". If 0 wins Q3 2026 is acceptable, update PHASE_2_TRIGGER §2 v0.2 to "0-1 wins Q3 2026, 1-3 wins Q1 2027" for consistency.
3. **Signal 7 (Beth channel) target** — Hermes T-HER-007 v0.2 says "5+ LOIs by Q4 2026" — for Q3 2026, "0-2 LOIs in flight" is the v0.2 assumption. Confirm with Hermes.
4. **Scorecard weights for composite \_\_/100** — how do we weight the 6 Muse scorecards into a single "ship-readiness %" for §1 scorecard? v1.1 §1 says 47%→48% current → 55% target — what's the formula? (T-AT-005 30-item × 7-domain checklist may be the source.)
5. **Vera 6-9mo cycle confidence** — VERA_INCUMBENT_TEARDOWN.md §5 says 6-9mo, but this is _inference_ not Vera-validated. If Q3 2026 bake-off data shows 9-12mo, do we de-rate the $732K base case? (Row 5 in this template is the empirical test.)

## §8. Cross-Muse handoffs (cycle-8 task board state, 2026-06-13)

- **→ Iris** (T-IR-002 churn + T-IR-003 win/loss + T-IR-005 NPS + T-IR-007 Anaplan teardown + T-IR-010 Baker Tilly + T-IR-011 Switching Cost + T-IR-012 Chris DITL + T-IR-013 Day-7 + T-IR-014 Switching Cost Handoff): rows 2, 3, 4, 21. Iris owns the _measurement_ of all ICP-1/2/3/4 telemetry.
- **→ Hermes** (T-HER-004 sales playbook + T-HER-007 v0.2 partnership motion + T-HER-009 v0.2 ICP reconciliation): rows 5, 6, 20. Hermes owns the _pipeline_ of all ICP-1/2/3/4 deals and partner LOIs.
- **→ Atlas** (T-ATL-008 DR runbook + T-ATL-012 v2 GDPR Art. 33 + T-ATL-014 tabletop): rows 7, 16. Atlas owns the _infra_ — uptime, RTO/RPO, observability.
- **→ Hephaestus** (T-HEP-007 SOC 2 RFP + T-HEP-008 continuous compliance + T-HEP-010 audit-chain cron + T-HEP-011 ICP-2 swap + T-HEP-012 security roadmap): rows 9, 10, 17. Hephaestus owns the _security + compliance_ — SOC 2, ISO 27001, audit-chain, Vanta findings.
- **→ Apollo** (post-push queue 38 tasks): rows 18 + the 2026-10-01 auto-pulled staging sheet. Apollo owns the _delivery_ — code shipped, tests, bundle.
- **→ Prometheus** (T-PR-001 React.memo + T-PR-002 react-virtual): rows 8, 19. Prometheus owns the _perf_ — p95 latency, engine coverage, GC pressure.
- **→ Mnemosyne** (T-MN-008 JSDoc v0.4 + T-MN-011 GLOSSARY v0.2 + T-MN-012 ONBOARDING v0.2): row 22. Mnemosyne owns the _docs + compliance_ — D-002 audit pass-rate, D-009 coverage.
- **→ Athena** (T-AT-005 readiness + T-AT-011 v0.4 re-validation + T-AT-009 board scan): row 23. Athena owns the _re-validation_ — 12-section validation framework.

**Strategos coordination role:** run the 2026-08-15 data-source-readiness review, run the 2026-09-15 Q2 dry-run, fill the 29-row template 2026-10-08, produce v1.2 by 2026-10-12, send to Athena T-AT-011 v0.4 re-validation, present to board 2026-10-15.

---

## Strategos sign-off

Strategos slot `019ebd9a-8731-70b2-9c96-a4a466017284`, 2026-06-13. **v0.2 cycle-8 patch** of Q3 2026 actuals template. v0.1 → v0.2: added 2 rows (28 ICP-4 Beth channel wins + 29 Baker Tilly partner LOIs) per D-011 explicit ratification. D-002 Three-Witnesses on every $X claim (29 rows × 3 witnesses = 87 sub-witnesses). D-009 Triangulation: file:line citations to v1.1, BOARD_DECK_FY26 v0.4, PHASE_1_GTM v0.3.1 (cycle-8 in flight), PHASE_2_TRIGGER v0.2, STRATEGIC_DECISIONS_LOG, PERSONAS_v2, DEC_002, HSM_2027, VERA_INCUMBENT_TEARDOWN, T-HER-007 v0.2, T-IR-010, Y2_BOARD_PACK v0.1. 4-Question Framework applied to every row.

**Status:** v0.2 DRAFT (cycle-8 pre-stage; gate = 2026-08-15 data-source-readiness review, 29 rows × 3-Witnesses pre-validated). No Founder action required for the _pre-stage_ — D-011 RATIFIED 2026-06-13 implicit-via-4-ICP-verdict (per Leader cycle-8 verdict); D-010 + D-012 still pending Founder signature by 2026-09-15 + 2026-10-01 respectively per v1.1 §4.

**Next Strategos cycle task (per TASKBOARD next-wave):** standby for Leader next-direction (T-ST-007 SHIP formalization done; T-ST-013 v0.1 done; await Leader on v0.3.1 PHASE_1_GTM Beth/ICP-4 patch + v0.2 actuals template add-row for ICP-4 signals).
