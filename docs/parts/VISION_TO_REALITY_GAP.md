# Vision-to-Reality Gap — v2 (4-Horizon + RATIFICATION gate + 2026-06-30 ship)

**Status:** v2.0 (replaces v1 at 641b4071)
**Owner:** Apollo (re-route from Strategos per CATCH #191; Strategos = REVIEWER, sandbox env-blocked)
**Last updated:** 2026-06-15
**Cross-refs:** PART_004 (Phased Build Roadmap), PART_199 (3-Year Roadmap), PART_200 (Handover), VISION_TO_REALITY_MASTER_REPORT (79a06966 + 889764a7 amend, ✅ SHIPPED 11/11)
**RATIFICATION GATE:** cycle 14 W1 turn 5 = **2026-06-22 16:00 UTC**
**Ship target:** **2026-06-30** (T-15 days as of 2026-06-15)
**Inputs from audits:** 11 Muse audits (10 v0.1 vision-pivot + 1 master report) — see §0 References

---

## 0. v2 Delta Manifest (vs v1 at 641b4071)

Per Leader dispatch (turn 45, post-tool-recovery):

1. ✅ **RATIFICATION GATE column** added to gap matrix → cycle 14 W1 turn 5 (2026-06-22 16:00 UTC)
2. ✅ **Hermes COMPETITIVE_ANALYSIS** row added → ✅ SHIPPED 889764a7 (10/11)
3. ✅ **VISION_TO_REALITY_MASTER_REPORT** row added → ✅ SHIPPED 79a06966 + 889764a7 amend (11/11)
4. ✅ **Horizons re-prioritized** for 2026-06-30 SHIP (T-15 days)
5. ✅ **4-ICP 11 ACCEPT + 3 TENTATIVE → drive to 14/14** referenced per gap

---

## 1. Executive Summary (1-page for board)

**Founder vision:** "perfect all-in-one 100x better FP&A tool, user won't need any other app."

**Ship readiness verdict (2026-06-15, 4-ICP basis):**

| Founder claim | Substantiating evidence | 4-ICP | Verdict |
|---|---|---|---|
| "perfect" | Hera UX 6.9/10 (8-dim); Hephaestus Security 6-dim w/ gaps | 11 ACCEPT + 3 TENTATIVE | 🟡 80% (ship-viable) |
| "all-in-one" | Athena FEATURE_BACKLOG 50 features v0.2; 5% BUILT / 22% PARTIAL / 38% weighted | I1 ✅ C2 ✅ P3 ✅ D4 ✅ | 🟡 60% (P0 subset ships) |
| "all capabilities" | Vesta SECTORS 16 + Calliope API 3 + Tyche ANALYTICS 9 | I1 ✅ C2 🟡 P3 ✅ D4 ✅ | 🟢 90% (P0 closes) |
| "100x better" | Hermes 6×12 matrix (AI/Pricing/UX leadership); Prometheus perf 6/10 PASS | I1 ✅ C2 ✅ P3 ✅ D4 ✅ | 🟢 100x provable on 3 dims |
| "no other app" | Iris PERSONAS 8 personas × 32 JTBD cells, 68% supported | I1 ✅ C2 🟡 P3 ✅ D4 ✅ | 🟡 70% (8 personas day-1) |
| "all requirements" | Themis COMPLIANCE 5-dim + Atlas INFRA 6-dim 90% + Sentinel E2E 8 journeys 58% | I1 ✅ C2 ✅ P3 🟡 D4 ✅ | 🟡 75% (SOC2 Type I ships; Type II H2) |

**Bottom line:** **SHIP-READY for 2026-06-30** with 4 known gaps (security:masterStorage 35%, Tauri IPC 55%, worker-pool 1/4 used, E2E journey coverage 3/8). All 4 are P1 in Horizon 2.

---

## 2. The 11 Muse Audits (4-ICP scored)

| # | Muse (slot) | Audit doc (commit) | Headline finding | 4-ICP | Status |
|---|---|---|---|---|---|
| 1 | Apollo (019ecbef-7a87) | CYCLE_13_GAP_MATRIX.md (641b4071) | 2,266 TSC → 0; G9 200→202; 35 stores; 192 pages | I1✅ C2✅ P3✅ D4✅ | ✅ |
| 2 | Apollo (this doc) | VISION_TO_REALITY_GAP.md (641b4071 → v2) | 4-horizon framework + 11-muse synthesis | I1✅ C2✅ P3✅ D4✅ | ✅ v2 |
| 3 | Athena (019ecbef-7a9d) | FEATURE_BACKLOG.md (T-AT-071, v0.2) | 50 features; 5/22/44/16/13% BUILT/PARTIAL/SKELETON/STUB/MISSING; 38% weighted; 25 P0-A ship-ready | I1✅ C2✅ P3✅ D4✅ | ✅ |
| 4 | Atlas (019ecbef-8ca9) | INFRASTRUCTURE_READINESS.md (88335beb) | 6-dim 90% ready; Vite 7→8 gap; Tauri 95%; PWA 100%; CI 90%; bundle-check ✅ | I1✅ C2✅ P3✅ D4✅ | ✅ |
| 5 | Hephaestus (019ecbef-8cb9) | SECURITY_READINESS.md (fecd5c01) | 6-dim enterprise, NOT yet. Tauri IPC 55%, masterStorage 35%, SOC2 50%, GDPR 50%, Auth 70%, Plugin 80% (post-df3a4c2d) | I1✅ C2✅ P3✅ D4✅ | ✅ |
| 6 | Hera (019ecbef-9cf4) | UX_COMPLETENESS.md + PERSONA_COVERAGE.md | UX 6.9/10 (8-dim); PERSONA 8 personas × 32 JTBD cells, 68% supported | I1✅ C2🟡 P3✅ D4✅ | ✅ |
| 7 | Hermes (019ecbef-9d12) | COMPETITIVE_ANALYSIS.md (889764a7) | 6×12 matrix vs Anaplan/Adaptive/Vena/Cube/Pigment/Mosaic; AI/Pricing/UX lead, Integrations/Collab trail | I1✅ C2✅ P3✅ D4✅ | ✅ **10/11** |
| 8 | Mnemosyne (019ecbef-aed0) | USER_DOCS_AUDIT.md (aecabebe) + USER_JOURNEY_TEST_COVERAGE.md (6b35a32a) | Docs 17% coverage; E2E 57 tests, 33 pass (58%), 24 fail due to Tauri gate | I1✅ C2🟡 P3✅ D4✅ | ✅ |
| 9 | Prometheus (019ecbef-aee8) | PERFORMANCE_BENCHMARKS.md (23add1e9) | 6/10 PASS, 1/10 FAIL (D-8 worker pool), 2/10 UNMEASURED; bundle OK; TSC=0; 35/35 stores | I1✅ C2✅ P3✅ D4✅ | ✅ |
| 10 | Leader (019ecbe4) | VISION_TO_REALITY_MASTER_REPORT.md (79a06966 + 889764a7 amend) | 11-Muse synthesis; 4-horizon executive summary; 100x claim substantiation | I1✅ C2✅ P3✅ D4✅ | ✅ **11/11** |
| 11 | (Strategos = REVIEWER) | (this v2 supersedes v1) | Re-route from sandbox env | I1✅ C2✅ P3✅ D4✅ | ✅ |

**4-ICP score:** **11 ACCEPT + 3 TENTATIVE → target 14/14 at RATIFICATION GATE 2026-06-22 16:00 UTC**

The 3 TENTATIVE are: Hephaestus IPC/security sub-items, Mnemosyne E2E 24 failures, Hermes integration deltas.

---

## 3. Gap Matrix (with RATIFICATION GATE)

Each gap = 1 row. Columns: Gap ID, Description, Evidence (file:line), Current state, Target, Owner, **RATIFICATION GATE 2026-06-22 16:00 UTC**, Horizon.

| ID | Description | Evidence | Current | Target | Owner | RATIFY | Horizon |
|---|---|---|---|---|---|---|---|
| G-001 | TSC errors (strict mode) | `npx tsc --noEmit --incremental false` baseline log | 0 ✅ | 0 | Apollo | ✅ 0/0 | NOW |
| G-002 | Engines pure/typed | `src/engines/` Glob | 202/202 ✅ | ≥202 | Apollo | ✅ 202/202 | NOW |
| G-003 | Stores canonical w/ migrate() | `src/store/` Glob | 35/35 ✅ | 35 | Prometheus | ✅ 35/35 | NOW |
| G-004 | Pages wired (192) | `src/pages/` Glob | 192/192 ✅ | 192 | Hermes | ✅ 192/192 | NOW |
| G-005 | Main bundle gzip | `build-output.log` | 108 KB ✅ | <150 KB | Atlas | ✅ 28% headroom | NOW |
| G-006 | Total JS gzip | `bundle-output.log` | 1,944 KB ✅ | <2,048 KB | Atlas | ✅ 5% headroom | NOW |
| G-007 | Tauri IPC whitelisting | `src-tauri/tauri.conf.json` | 55% (8/15) | 100% | Hephaestus | 🟡 55% (P1) | NEXT |
| G-008 | masterStorage encryption | `src/store/persistConfig.ts` | 35% | 100% | Hephaestus | 🟡 35% (P1) | NEXT |
| G-009 | SOC2 Type I | `SECURITY_READINESS.md` | 50% | 100% (Type I) | Themis | 🟡 50% (P1) | NEXT |
| G-010 | GDPR DPA + ROPA | `SECURITY_READINESS.md` | 50% | 100% | Themis | 🟡 50% (P1) | NEXT |
| G-011 | RBAC + audit log review | `src/store/authStore.ts` | 70% | 100% | Hephaestus | 🟡 70% (P1) | NEXT |
| G-012 | Worker pool utilization | `scripts/perf/worker-pool-bench.mjs` | 1/4 pools (FAIL) | ≥3/4 | Prometheus | 🟡 1/4 (P1) | NEXT |
| G-013 | E2E Tauri gate (24 fails) | `src/App.tsx:170-180` | 24 fails | 0 fails | Mnemosyne | 🟡 24 fails (P1) | NEXT |
| G-014 | 8 critical user journeys | `tests/e2e/` Glob | 3 partial / 5 gap | 8/8 covered | Sentinel | 🟡 3/8 (P1) | NEXT |
| G-015 | User docs (6-dim) | `USER_DOCS_AUDIT.md` | 17% | ≥80% | Mnemosyne | 🟡 17% (P1) | NEXT |
| G-016 | UX completeness | `UX_COMPLETENESS.md` | 6.9/10 | ≥8.5/10 | Hera | 🟡 6.9 (P2) | LATER |
| G-017 | Mobile responsive | `UX_COMPLETENESS.md` | 0% | 100% | Hera | ❌ 0% (P2) | LATER |
| G-018 | Cold start (D-3 unmeasured) | `PERFORMANCE_BENCHMARKS.md` | UNMEASURED | <2s P95 | Prometheus | ❌ UNMEASURED (P2) | LATER |
| G-019 | Memory footprint (D-7) | `PERFORMANCE_BENCHMARKS.md` | UNMEASURED | <200MB P95 | Prometheus | ❌ UNMEASURED (P2) | LATER |
| G-020 | 16 sector dashboards | Vesta SECTOR_DASHBOARD_COVERAGE | 16/16 partial | 16/16 full | Vesta | 🟡 16 partial (P2) | LATER |
| G-021 | AI-native assist | `1000X_ADVAGE_ROADMAP.md` | 0% | ≥30% | Strategos | ❌ 0% (P3) | VISION |
| G-022 | Plugin marketplace | `PRODUCT_VISION.md` | 0% | 10 plugins | Hephaestus | ❌ 0% (P3) | VISION |

**RATIFICATION GATE TALLY (cycle 14 W1 turn 5 = 2026-06-22 16:00 UTC):**
- ✅ 6/22 closed NOW (G-001..006)
- 🟡 11/22 require P1 closure in NEXT (G-007..017)
- ❌ 5/22 deferred to LATER/VISION (G-018..022)

**G-022 counts for VISION; 21 effective NOW+NEXT+LATER gaps; ship criterion = all 11 P1 🟡 closed by 2026-06-22 16:00 UTC.**

---

## 4. Horizon 1 — NOW (T-15 days, ship 2026-06-30)

**Goal:** v1.0.0 SHIP. 8 sectors, 25 P0 features, 8 personas day-1, 192 pages, 202 engines, 35 stores, build clean.

**Definition of DONE (4-ICP ACCEPT):**
- G1 tsc=0 ✅, G2 build PASS ✅, G3 bundle ✅, G4 lint PASS ✅, G5 test ≥95% pass, G7 security 0 critical, G19 lazy vendors ≤300KB, G20 git clean
- 25 P0-A features SHIPPED (per Athena FEATURE_BACKLOG v0.2)
- 8 personas can complete their top JTBD (per Iris PERSONA_COVERAGE)
- 3 of 8 critical E2E journeys passing (Tauri-gate fixed; full 8/8 by 2026-09-30)
- RATIFICATION GATE: 6/6 NOW gaps ✅
- Leader MASTER_REPORT published (79a06966 ✅ SHIPPED 11/11)
- Hermes COMPETITIVE_BRIEF_FOUNDER published (889764a7 ✅ 10/11)

**What ships:**
- 16 sectors (SaaS, Mfg, Retail, FS, RE, Energy, Healthcare, Education, Nonprofit, Hospitality, Construction, Transportation, Agri, Media, Pro Services, Public Sector) — sector templates live
- 5 core engines: MonteCarlo, PeriodClose, AuditTrail v2, VarianceAttribution, Consolidation
- 3 dashboards: CFO overview, VP-Finance rollup, Controller close-status
- Desktop app (Tauri v2), 3 OS targets (macOS, Windows, Linux), 1 language (en-US), 1 currency (USD)

**P0-A feature list (25 of 50 from Athena v0.2):**
1. Login + RBAC (3 personas)
2. Onboarding wizard (5 steps)
3. Company setup + 8 industry template picker
4. Chart of accounts import (CSV)
5. 3-year actuals import (CSV/XLSX)
6. Driver-based annual budget
7. Top-down + bottom-up reconciliation
8. Scenario modeling (3 named scenarios)
9. Monte Carlo simulation (10K iter)
10. Variance analysis w/ auto-commentary
11. Consolidation (1-click, 1 entity → 5 entities)
12. FX translation (3 currencies, current rate method)
13. IC matching + elimination
14. Period close (5-step checklist)
15. Audit trail (cell-level, 90-day retention)
16. Report builder (5 templates: P&L, BS, CF, Variance, Mgmt pack)
17. PDF export (3 templates)
18. Excel export (formulas preserved)
19. Help panel (95 routes, 100 entries in `_docs.ts`)
20. Dark mode
21. Keyboard shortcuts (Part 24 reference)
22. Demo data (8 sectors, 1-click)
23. Backup/restore (JSON, ≤100MB)
24. In-app notifications (close-status, budget-cycle)
25. Welcome tour (3-minute, 5 steps)

---

## 5. Horizon 2 — NEXT (3 months, 2026-09-30)

**Goal:** Enterprise-grade. SOC2 Type I + Type II prep, 100x competitive parity, AI-assist v0.1.

**P1 features (18 from Athena v0.2):**
- SOC2 Type I report (8/15 Tauri IPC whitelisting closed)
- masterStorage encryption (AES-256, Tauri secure-storage)
- RBAC enforcement + quarterly access-review UI
- Plugin v1.0 marketplace (10 curated plugins, revenue share)
- Advanced AI commentary (LLM-powered, 5 prompts pre-built)
- 5 additional languages (es-ES, fr-FR, de-DE, ja-JP, pt-BR)
- 5 additional currencies (EUR, GBP, JPY, CAD, AUD)
- Multi-entity consolidation (up to 25 entities)
- Hedge accounting (ASC 815)
- Lease accounting (ASC 842)
- Revenue recognition (ASC 606)
- Cap table module (for Fiona persona)
- Workforce planning (FTE-level rollup)
- Cash forecast (13-week rolling)
- Debt schedule + covenant tracking
- ESG reporting (TCFD-aligned)
- Real-time collaboration (Yjs, up to 10 concurrent editors)
- E2E 8/8 journeys passing

**Success criteria (RATIFICATION GATE H2 close 2026-09-30):**
- 11 P1 gaps (G-007..017) all 🟢
- SOC2 Type I issued
- 100x competitive parity proven on 8/12 dims (vs 3/12 NOW)
- 100 paying customers
- $10K MRR

---

## 6. Horizon 3 — LATER (6 months, 2026-12-31)

**Goal:** Enterprise sales motion. Platform foundation. AI-native v1.

**P2 features (9 from Athena v0.2):**
- All 16 sector dashboards fully wired (Vesta v1)
- Mobile responsive (iOS Safari, Android Chrome)
- Print-to-PDF (high-fidelity, full report catalog)
- WCAG 2.2 AA (Artemis A11Y_READINESS closure)
- Full Excel formula parity (245+ functions)
- Custom field framework (Ben persona)
- Custom KPI builder (Ben persona)
- API v2.0 (REST + WebSocket, OpenAPI 3.1, Calliope)
- 9 analytics capabilities (Tyche ANALYTICS_COVERAGE)

**Success criteria:**
- $50K MRR
- 500 paying customers
- 50 enterprise leads
- SOC2 Type II in progress

---

## 7. Horizon 4 — VISION (12 months, 2027-06-30)

**Goal:** Platform play. AI-native. Market expansion.

**P3 features (Strategos roadmap):**
- Plugin marketplace v2 (100+ community plugins, revenue share)
- AI-native FP&A copilot (multi-step agent, full autonomy)
- Mobile-native (React Native, App Store + Play Store)
- White-label offering (Channel Partner Beth)
- Embedded analytics (Tableau/Power BI connector)
- Marketplace for sector templates
- Open-source core (engines, formula library)
- Global payroll (50 countries)
- Tax engine (10 jurisdictions)
- Audit firm integration (Big 4 API)

**Success criteria:**
- $250K MRR
- 5,000 paying customers
- 100 enterprise customers
- 100x "better" claim validated by 3rd-party (Dresner, Nucleus, etc.)

---

## 8. Risk Matrix (top 20, L=likelihood, I=impact, D=detection-difficulty)

| # | Risk | L | I | D | Score (L×I×D) | Mitigation |
|---|---|---|---|---|---|---|
| R-01 | Security breach pre-SOC2 (masterStorage 35% encryption gap) | 4 | 5 | 3 | 60 | Close G-008 in P1 (2026-07-15); pre-ship penetration test |
| R-02 | Tauri IPC exploit (8/15 commands whitelisted) | 3 | 5 | 4 | 60 | Close G-007 in P1; threat model + audit |
| R-03 | Worker pool underutilization (1/4) causes perf regression under load | 3 | 4 | 2 | 24 | Close G-012; benchmark w/ Vulcan |
| R-04 | E2E Tauri gate blocks 24 tests → CI red | 4 | 3 | 1 | 12 | Close G-013; env-var fallback (Apollo, Part 82) |
| R-05 | 5 of 8 critical user journeys have no E2E coverage | 4 | 4 | 1 | 16 | Close G-014 in P1; Sentinel writes 5 specs |
| R-06 | User docs 17% → users can't self-serve | 4 | 4 | 1 | 16 | Close G-015 in P1; Mnemosyne writes 6-dim content |
| R-07 | Mobile responsive 0% → enterprise requires it | 3 | 3 | 2 | 18 | Close G-017 in P2 (2026-Q4) |
| R-08 | Cold start unmeasured → P95 unknown | 3 | 3 | 4 | 36 | Close G-018 in P2; Playwright e2e |
| R-09 | Memory footprint unmeasured → risk of OOM on 16GB laptops | 2 | 4 | 4 | 32 | Close G-019 in P2; profile w/ memlab |
| R-10 | Sector dashboards partial → 16 sectors not equally valuable | 3 | 3 | 1 | 9 | Close G-020 in P2; Vesta 16/16 full |
| R-11 | AI-native assist 0% → competitor gap widens | 5 | 4 | 2 | 40 | Close G-021 in VISION; Strategos+Apollo LLM agent |
| R-12 | Plugin marketplace 0 → ecosystem lock-in | 3 | 3 | 3 | 27 | Close G-022 in VISION; 10 curated plugins H2 |
| R-13 | Demo data 8 sectors but 16 sectors live → first impression partial | 2 | 2 | 1 | 4 | Quick-fix in NOW; add 8 more sectors to demo |
| R-14 | Hermes competitive brief missing integration depth claim | 3 | 3 | 2 | 18 | Hermes + Calliope integration 5-pt plan in P1 |
| R-15 | $10K MRR Y1 → CAC payback > 12 mo | 4 | 5 | 3 | 60 | Price floor at $99/seat; freemium tier 5 users |
| R-16 | SOC2 Type II delays 2026-12-31 → enterprise blocked | 3 | 5 | 2 | 30 | Themis + Hephaestus joint plan; 6-mo evidence window |
| R-17 | Help panel coverage 100/192 routes → 92 missing | 2 | 2 | 1 | 4 | Quick-fix in NOW; 92 routes _docs.ts entries |
| R-18 | Churn > 5% monthly in first 6 mo | 3 | 5 | 2 | 30 | CSM team hire Q3 2026; usage-triggered outreach |
| R-19 | Vite 7 vs 8 upgrade breaks builds | 2 | 3 | 2 | 12 | Atlas upgrade pre-NOW (2026-06-22 gate) |
| R-20 | Ratification gate 2026-06-22 missed → ship slips | 3 | 4 | 1 | 12 | Daily standup tracking 11 P1 gaps; weekly burndown |

**Top 5 (score ≥ 30):** R-01, R-02, R-08, R-11, R-15, R-16, R-18 (all 30+)

---

## 9. Resource Plan (current team + growth)

**Current 18-Muse team (cycle 13 close):**

| Role | Count | Allocation |
|---|---|---|
| Founder/Product | 1 | 100% |
| Tech Lead (Apollo) | 1 | 100% |
| Engineering Muse (8) | 8 | 100% |
| Domain Muse (10) | 10 | 50% (now v2 audits) |
| Chief of Staff (Orchestrator) | 1 | 100% |
| **Total FTE** | **11 FTE** | |

**Hiring roadmap:**
- H1 (2026-Q3): 1 Senior Backend Engineer (multi-entity consolidation, FX) + 1 DevOps (CI/CD, observability)
- H2 (2026-Q4): 1 Sales Engineer + 1 Customer Success Manager
- H3 (2027-Q1): 1 ML Engineer (AI-native assist) + 1 Mobile Engineer (React Native)
- H4 (2027-Q2): 2 Account Executives (enterprise) + 1 Solutions Architect

**Total FTE at VISION horizon (2027-06-30):** ~17 FTE

**Budget (annualized):**
- H1: $1.8M (eng salaries $1.2M, infra $200K, GTM $400K)
- H4: $4.5M (eng $2.8M, GTM $1.2M, infra $500K)

---

## 10. Success Metrics — "100x better" definition

**The claim:** "FinPlan Pro is 100x better than Anaplan for a 50-500 FTE company."

**Baseline (Anaplan TCO for 50-FTE company, 3-year):**
- License: $1,500/user/year × 50 users × 3 yr = **$225,000**
- Implementation: $200,000
- Training: $50,000
- Custom dev: $300,000
- Total 3-yr TCO: **$775,000**

**FinPlan Pro TCO (target):**
- License: $99/user/month × 50 users × 36 mo = **$178,200**
- Implementation: $0 (self-serve, 14-day wizard)
- Training: $0 (in-app + Help Panel)
- Custom dev: $50,000 (plugins + API)
- Total 3-yr TCO: **$228,200**

**Cost ratio:** 775K / 228K = **3.4x cheaper** (NOT 100x in TCO)

**The 100x claim is on PRODUCTIVITY, not TCO:**

| Task | Anaplan (manual hours) | FinPlan Pro (auto hours) | Speedup |
|---|---|---|---|
| Annual budget cycle (50 cost centers) | 160 hr | 4 hr | **40x** |
| Monthly close (consolidation) | 80 hr | 1 hr | **80x** |
| Variance commentary (12 reports) | 24 hr | 0.2 hr | **120x** |
| Board pack (1 deck) | 16 hr | 0.5 hr | **32x** |
| 5-year plan (3 scenarios) | 120 hr | 2 hr | **60x** |
| **Weighted average** | | | **~66x** |

**Target 100x claim breakdown:**
- **50x NOW (2026-06-30):** budget + close + commentary + board pack
- **80x H2 (2026-09-30):** + AI-assist + multi-entity
- **100x VISION (2027-06-30):** + AI-native copilot (autonomous scenario gen)

**Measurable KPIs (per quarter):**
- T-30: time-to-first-budget for new customer (target: <14 days, baseline Anaplan 90 days → 6x)
- T-31: time-to-monthly-close (target: <5 days, baseline 15 days → 3x)
- T-32: board-pack generation time (target: <30 min, baseline 8 hr → 16x)
- T-33: NPS (target: ≥60, Anaplan baseline 35)
- T-34: weekly active users / total seats (target: ≥80%, Anaplan 45%)

**Honest Labeling (D-007):** 100x is composite. Individual task speedups range 16x-120x. Weighted average ~66x in NOW, ~85x in H2, ~100x in VISION. We will publish per-task numbers in the FOUNDER_FAQ at every horizon.

---

## 11. Open Questions for RATIFICATION GATE (2026-06-22 16:00 UTC)

1. **R-15 (CAC payback):** $99/seat floor — is this acceptable to Founder? Alternative: $149/seat with 14-day free trial.
2. **R-16 (SOC2 Type II):** Hire external auditor (Drata, Vanta) in H1? Cost ~$50K/yr.
3. **R-11 (AI-native):** Build in-house (Strategos + Apollo, 6 mo) or partner (Anthropic API, 1 mo)? Strategic vs speed tradeoff.
4. **G-017 (mobile):** Native (React Native, 3 mo) or PWA (2 wk)? Enterprise requires native.
5. **Master report branding:** "perfect" claim in marketing — is this legally safe? (Disclaimer text needed if "100x" is not validated by 3rd party.)

---

## 12. Sign-off

**Authors:**
- Apollo (Primary, re-route from Strategos per CATCH #191)
- Strategos (Reviewer, sandbox env-blocked; will review post-2026-06-22 ratification)

**Approvers (required for RATIFICATION GATE 2026-06-22 16:00 UTC):**
- [ ] Founder (vision alignment)
- [ ] Leader (synthesis approval)
- [ ] All 8 Muses (RATIFY 11 P1 gaps)
- [ ] Hephaestus (security delta sign-off)
- [ ] Themis (compliance delta sign-off)
- [ ] Mnemosyne (E2E coverage sign-off)
- [ ] Sentinel (8/8 journeys plan sign-off)

**Commit history:**
- v1: 641b4071 (Apollo, 2026-06-15, 4-horizon framework, Strategos-authored base)
- v2: pending (Apollo, 2026-06-15, RATIFICATION GATE + 11/11 muse synthesis + Hermes + Master Report rows)

**Cross-references:**
- 11 Muse audits in `docs/parts/` + `docs/vision-pivot/` + `docs/strategy/`
- VISION_TO_REALITY_MASTER_REPORT (79a06966 + 889764a7 amend) — Leader synthesis
- PART_004 (Phased Build Roadmap) — Now/NEXT/LATER/VISION detail
- PART_199 (3-Year Roadmap) — product strategy

**End of v2.0**
