# FinPlan Pro — Cycle Taskboard 2026-06-13

**Owner:** Leader (with Themis as orchestrator, slot `019ebda3-cbaa-7282-9a87-aedf8eecb72e`)
**Last updated:** 2026-06-13 05:45 IST (cycle refresh — 11 new completions this turn, 8 4th-wave tasks assigned, 1 backlog task auto-promoted)
**Source of truth:** This file (human-readable) + system task board (`team_task_list` for state)

---

## WORK PROTOCOL (LEADER DIRECTIVE 2026-06-13)

**No agent is ever idle. All Muses keep working non-stop.**

When you finish a task and become idle:
1. **READ** this file (`docs/drafts/TASKBOARD.md`) for the current state
2. **CHECK** `team_task_list` for tasks with `status=pending` and `owner=null`
3. **PICK** the highest-priority task matching YOUR lane (P0 first, then P1/P2/P3)
4. **CLAIM** via `team_task_update(task_id, owner=your_slot_id, status=in_progress)`
5. **WORK** — write deliverable to `docs/drafts/<your-name>/`
6. **COMPLETE** via `team_task_update(task_id, status=completed)` + send Leader a 2-sentence report
7. **LEADER REVIEWS** within 5 min — ACCEPT or send back for REVISION

If no task matches your lane:
- Send Leader `READY_FOR_NEW_TASK` ping with your lane
- Leader (or Themis) will add a new task within 10 min

**Themis monitors this loop** — if a Muse is idle > 5 min without claiming a task, Themis pings Leader and the Muse.

---

## ROSTER (11 agents, all working)

| # | Muse | Slot ID | Lane | Persona file |
|---|------|---------|------|--------------|
| 0 | Leader | 019ebcaa-...a39 | Coordination & Strategy | (this file) |
| 1 | Apollo | 019ebcc3-...dca | Build & Ship | memory/persona-apollo.md |
| 2 | Athena | 019ebcc3-...1de | Code Perfectionist | memory/persona-athena.md |
| 3 | Prometheus | 019ebcc7-...cf07 | Performance & Test | memory/persona-prometheus.md |
| 4 | Hera | 019ebcc7-...58c8 | UX, A11y | memory/persona-hera.md |
| 5 | Hephaestus | 019ebcd6-...20a0 | Security & Data Integrity | memory/persona-hephaestus.md |
| 6 | Mnemosyne | 019ebcd6-...5bed | Documentation & Architecture | memory/persona-mnemosyne.md |
| 7 | Strategos | 019ebd9a-...7284 | Product Strategy & Competitive Intelligence | memory/persona-strategos.md |
| 8 | Iris | 019ebd9c-...161e | Customer & User Research | memory/persona-iris.md |
| 9 | Hermes | 019ebd9c-...6e18 | Marketing & Go-to-Market | memory/persona-hermes.md |
| 10 | Atlas | 019ebd9c-...33ba | DevOps & Infrastructure | memory/persona-atlas.md |
| 11 | Themis | 019ebda3-...b72e | Orchestration & Work Protocol | memory/persona-themis.md |

---

## READY QUEUE (claim these — P0 first)

### P0 — Critical (claim first)
| Task ID | Muse | Description | Est. | Status |
|---------|------|-------------|------|--------|
| T-AP-010 | Apollo | Apply 13-store immer wrappers (P0 from Athena audit) | 45 min | **WAITING ON PUSH** (pre-stage in `docs/drafts/apollo/` if Apollo wants) |
| T-PR-002 | Prometheus | react-virtual patch for 5 non-virtualized lists | 60 min | ✅ CLAIMED 05:45 (in progress) |
| T-HEP-003 | Hephaestus | SOC 2 CC6/CC7 readiness audit + 4 ADRs (Path C: 006-009 new, 010-012 renumbered) | 105 min | ✅ CLAIMED 05:15 (in progress) |
| T-HE-004 | Hera | Keyboard navigation audit + i18n key inventory | 60 min | ✅ CLAIMED 05:15 (in progress) |
| T-AT-005 | Athena | Pre-launch readiness checklist — 30 items × 7 domains | 60 min | ✅ CLAIMED 05:20 (in progress) |
| T-ST-003 | Strategos | Phase 1 GTM strategy (ICP ranking, feature prioritization, Q3 2026 → Q1 2027) | 60 min | ✅ CLAIMED 05:20 (in progress) |
| T-IR-003 | Iris | Win/loss analysis framework (definitions, interview script, cadence) | 60 min | ✅ CLAIMED 05:20 (in progress, pipeline 3→4→5→6) |
| T-ATL-004 | Atlas | Observability stack (Sentry + OpenTelemetry + 4 dashboards) | 60 min | ✅ COMPLETED 05:00 |
| T-HER-004 | Hermes | Sales playbook (discovery call + objection cheatsheet) | 60 min | ✅ COMPLETED 05:35 |
| T-MN-003 | Mnemosyne | ONBOARDING.md + TESTING.md | 60 min | ✅ CLAIMED 05:25 (in progress) |
| T-TH-002 | Themis | Continuous monitoring loop (10-min ping, 30-min drift fix, hourly log) | ongoing | ✅ CLAIMED 05:15 (in progress) |
| T-IR-004 | Iris | CSM playbook (3 highest-leverage churn interventions operationalized) | 60 min | ✅ CREATED 05:45 (queued after T-IR-003) |
| T-IR-005 | Iris | NPS survey design (3 questions, 4 cadences, per-persona interpretation) | 60 min | ✅ CREATED 05:45 (queued after T-IR-004) |
| T-IR-006 | Iris | Beta-customer feedback plan (5 waves, 5-way routing, 90-day cadence) | 60 min | ✅ CREATED 05:45 (queued after T-IR-005) |
| T-ATL-005 | Atlas | CI matrix adoption — 4 GHA workflows (lint, tsc, test-unit, build) | 60 min | ✅ CREATED 05:45 (in progress) |
| T-HER-005 | Hermes | Marketing-site home copy + pricing page (3 hero variants, 3 use cases, 3 pricing tiers) | 60 min | ✅ CREATED 05:45 (in progress) |
| T-ST-004 | Strategos | Formalize MUSE_LINEUP_v2 + STRATEGIC_INDEX_REFRESH (retroactive) | 30 min | ✅ CREATED 05:45 (queued after T-ST-003) |

### P1 — High (backlog for next cycle)
| Task ID | Muse | Description | Est. |
|---------|------|-------------|------|
| T-PR-001 | Prometheus | React.memo 10-component patch (after T-PR-002 ships) | 45 min |
| T-PR-003 | Prometheus | Wire runMonteCarlo into GoalSeekPage.tsx:38-46 (have the wire-up) | 30 min |
| T-PR-004 | Prometheus | SOXComplianceEngine.test.ts (1,354 LOC, biggest test gap) | 90 min |
| T-PR-005 | Prometheus | Per-namespace i18n dynamic import (~48 kB gzip savings) | 45 min |
| T-MN-004 | Mnemosyne | JSDoc P0 patches cascade (after Athena validates in T-AT-003) | 60 min |
| T-MN-005 | Mnemosyne | ARCHITECTURE.md refresh with phase 1 backend context | 45 min |
| T-HEP-004 | Hephaestus | 3 missing ADRs (006 data retention, 007 encryption finalize, 008 audit log finalize) — subset of T-HEP-003 if separated | 60 min |
| T-HE-005 | Hera | Design system contribution guide (post-keyboard-nav) | 60 min |

### P2 — Medium (Phase 1 launch prep)
| Task ID | Muse | Description | Est. |
|---------|------|-------------|------|
| T-ST-004 | Strategos | Formalize MUSE_LINEUP_v2 + STRATEGIC_INDEX_REFRESH (retroactive) | 30 min |
| T-AT-006 | Athena | Post-launch regression suite design (10 critical user paths) | 60 min |
| T-HER-005 | Hermes | Marketing-site home copy + pricing page (3 hero variants, 3 use cases, 3 pricing tiers) — **CONFIRMED in flight** | 60 min |
| T-IR-004 | Iris | CSM playbook (3 highest-leverage churn interventions operationalized) — **CONFIRMED in flight** | 60 min |
| T-ATL-005 | Atlas | husky pre-push `timeout 240` upper bound (1-line infra fix, prevents IC-1 124-timeout) | 15 min |
| T-HEP-005 | Hephaestus | Penetration test plan + vendor selection (NCC, Trail of Bits, Cobalt) | 60 min |
| T-ATL-006 | Atlas | Pre-commit secret scanner (Hephaestus's deliverable 019ebd1b wire-up) | 45 min |
| T-ATL-007 | Atlas | Sentry self-hosted deployment (operationalizes T-ATL-004) | 90 min |
| T-ATL-008 | Atlas | Disaster recovery runbook (3 scenarios: data loss, region down, dependency outage) | 60 min |
| T-ATL-009 | Atlas | Bundle-size check script (`scripts/bundle-check.mjs`) | 30 min |
| T-HEP-006 | Hephaestus | 4 logic-gap security test files (PluginSandbox execute, ScenarioLocking behavioral, safeJSONStorage zustand, mock-auth runtime) | 60 min |

### P3 — Low (backlog)
*To be populated as backlog grows. Total P3 backlog post-push: 38+ tasks from initial delivery cycle.*

---

## IN PROGRESS (currently being worked on)

| Muse | Task | Started | Status |
|------|------|---------|--------|
| Apollo | T-AP-001 (push sequence) | 2026-06-13 01:31 IST | **IDLE — push blocker (1-line fix path provided, awaiting human git push)** |
| Athena | T-AT-005 (pre-launch readiness) | 2026-06-13 05:20 IST | New task — 30 items × 7 domains (closes 42% ship-readiness gap) |
| Prometheus | T-PR-002 (react-virtual) | 2026-06-13 05:00 IST | In progress (7 artifacts in `docs/drafts/prometheus/`, pinged to claim + sync state) |
| Hera | T-HE-004 (keyboard nav + i18n) | 2026-06-13 05:15 IST | New task — 10 components, 6 criteria + i18n key inventory |
| Hephaestus | T-HEP-003 (SOC 2 readiness) | 2026-06-13 05:15 IST | New task — CC6/CC7 audit + 3 missing ADRs (data retention, encryption finalize, audit log finalize, incident response) |
| Mnemosyne | T-MN-003 (onboarding + testing) | 2026-06-13 05:25 IST | New task — 2 P0 docs (ONBOARDING.md 200L + TESTING.md 150L) |
| Strategos | T-ST-003 (Phase 1 GTM) | 2026-06-13 05:20 IST | New task — 7 sections × Q3 2026 → Q1 2027 (ICP ranking, feature prioritization, sales motion, timeline, risks) |
| Iris | T-IR-003 (win/loss framework) | 2026-06-13 05:20 IST | New task — definitions + 6-question interview script + weekly/monthly/quarterly cadence + 5-metric dashboard |
| Hermes | T-HER-004 (sales playbook) | 2026-06-13 05:25 IST | New task — 5-section discovery call playbook + 10-objection cheatsheet |
| Atlas | T-ATL-004 (observability) | 2026-06-13 05:20 IST | New task — Sentry + OpenTelemetry + 4 dashboards (closes "can't see production" gap) |
| Themis | T-TH-002 (continuous monitoring) | 2026-06-13 05:15 IST | New task — ongoing (10-min status ping, 30-min TASKBOARD drift fix, hourly log, idle patrol) |

---

## RECENTLY COMPLETED (last 24h, awaiting Leader review)

| Time (IST) | Muse | Task | Deliverable | Leader review |
|------------|------|------|-------------|---------------|
| 2026-06-13 04:50 | Strategos | T-ST-001 → v0.2 (strategic corpus) | 964L: ROADMAP.md, STRATEGIC_REVIEW_Q2_2026.md, STRATEGIC_DECISIONS_LOG.md (6 decisions D-001–D-009, 58.7%/42% scorecard) | ✅ ACCEPTED |
| 2026-06-13 04:50 | Strategos | T-ST-002 (matrix refresh) | `docs/FPA_COMPETITIVE_MATRIX.md` + `competitive-matrix-v2-changelog.md` | ✅ ACCEPTED |
| 2026-06-13 04:50 | Hermes | T-HER-002 (Anaplan battlecard) | `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` 161L + `ANAPLAN_LEAVE_BEHIND.md` 42L | ✅ ACCEPTED (T-HER-003 created) |
| 2026-06-13 04:50 | Atlas | T-ATL-002 (Docker for Tauri) | `docs/drafts/atlas/DOCKER_TAURI.md` 451L + `Dockerfile.tauri` 122L | ✅ ACCEPTED |
| 2026-06-13 04:50 | Themis | T-TH-001 (state diagnostic) | `docs/drafts/themis/STATE_DIAGNOSTIC_2026-06-13.md` 178L (5 bullets) | ✅ ACCEPTED |
| 2026-06-13 04:55 | Hephaestus | T-HEP-002 (ADR validation) | `docs/drafts/hephaestus/adr-validation.md` — 4 ADRs reviewed | ✅ ACCEPTED |
| 2026-06-13 04:55 | Hera | T-HE-003 (dark variants) | `docs/drafts/hera/dark-variants-7-components.patch` + `dark-variants-README.md` (7 components) | ✅ ACCEPTED |
| 2026-06-13 05:00 | Mnemosyne | T-MN-002 (glossary) | `docs/GLOSSARY.md` (20+ FP&A terms) + `docs/drafts/mnemosyne/jsdoc-p0/` cascade | ✅ ACCEPTED (T-MN-003 queued) |
| 2026-06-13 05:20 | Iris | T-IR-002 (churn framework) | `docs/drafts/iris/CHURN_FRAMEWORK.md` 24KB + `CHURN_EVENTS_TAXONOMY.md` 8KB (5 reasons × detect × prevent) | ✅ ACCEPTED (T-IR-003 created) |
| 2026-06-13 05:20 | Athena | T-AT-003 (JSDoc pre-validation) | `docs/drafts/athena/jsdoc-validation.md` 22KB (5 P0 JSDoc patches reviewed) | ✅ ACCEPTED |
| 2026-06-13 05:20 | Athena | T-AT-004 (security tests validation) | `docs/drafts/athena/security-tests-validation.md` 18KB (4 Hephaestus patches reviewed) | ✅ ACCEPTED (T-AT-005 created) |
| 2026-06-13 05:20 | Atlas | T-ATL-003 (on-call runbook) | `docs/drafts/atlas/ON_CALL_RUNBOOK.md` 19KB (7 sections, 7 incidents, MTTA/MTTR targets) | ✅ ACCEPTED (T-ATL-004 created) |
| 2026-06-13 05:20 | Hermes | T-HER-003 (Beta program) | `docs/drafts/hermes/BETA_PROGRAM.md` 28KB (50-customer cohort, scoring rubric, D-7 to D+90 launch sequence) | ✅ ACCEPTED (T-HER-004 created) |
| 2026-06-13 05:25 | Strategos | (bonus) STRATEGIC_INDEX_REFRESH | `docs/drafts/strategos/STRATEGIC_INDEX_REFRESH.md` 13KB + changelog | ✅ ACKNOWLEDGED |
| 2026-06-13 05:25 | Hermes | (bonus) COLD_OUTBOUND_SEQUENCE | `docs/drafts/hermes/COLD_OUTBOUND_SEQUENCE.md` 20KB (5-touch outbound) | ✅ ACKNOWLEDGED |
| 2026-06-13 05:45 | Atlas | T-ATL-004 (observability stack) | `docs/drafts/atlas/OBSERVABILITY_STACK.md` 457L, 8 sections (Sentry + OTel + 4 dashboards) | ✅ ACCEPTED (T-ATL-005 created) |
| 2026-06-13 05:45 | Hermes | T-HER-004 (sales playbook) | `docs/drafts/hermes/DISCOVERY_CALL_PLAYBOOK.md` 388L + `OBJECTION_HANDLING_CHEATSHEET.md` 210L = 598 LOC | ✅ ACCEPTED (T-HER-005 created) |
| 2026-06-13 05:45 | Strategos | (bonus) MUSE_LINEUP_v2 | `docs/MUSE_LINEUP_v2.md` 187L (D-NNN namespace collision flagged) | ✅ ACCEPTED — T-ST-004 formalized retroactively |
| 2026-06-13 05:45 | Iris | (pre-write) NPS_SURVEY_DESIGN | `docs/drafts/iris/NPS_SURVEY_DESIGN.md` 294L (3 questions, 4 cadences, per-persona interpretation) | ✅ ACCEPTED — T-IR-005 formalized retroactively |
| 2026-06-13 05:45 | Iris | (pre-write) BETA_FEEDBACK_PLAN | `docs/drafts/iris/BETA_FEEDBACK_PLAN.md` 308L (5 waves, 5-way routing) | ✅ ACCEPTED — T-IR-006 formalized retroactively |

---

## REVIEW STATUS

- ✅ ACCEPTED (16 + 5 bonus = 21): T-ST-001 v0.2, T-ST-002, T-HER-002, T-ATL-002, T-TH-001, T-HEP-002, T-HE-003, T-MN-002, T-IR-002, T-AT-003, T-AT-004, T-ATL-003, T-HER-003, T-ATL-004, T-HER-004 + 5 bonus
- 🔄 REVISION: (none yet)
- ⏳ AWAITING REVIEW: (none — see above)

---

## BACKLOG (deferred / future)

### Q3 sprint (2026-Q3-W1/W2)
- DEFER-2026-001: AnomalyDetectionEngine.percentile (Athena + Hephaestus, Q3-W2)
- DEFER-2026-002: decimalUtils float-drift (Hephaestus + Athena, Q3-W1)
- DEFER-2026-003: chunkedStorage races (Hephaestus + Prometheus, Q3-W2)

### Phase 1 (Q3 2026 - Q1 2027)
- Backend service (Node/Express or Cloudflare Workers)
- Identity (SSO, OAuth, RBAC)
- Multi-tenant data isolation
- Public API (REST + GraphQL)
- Real-time collaboration (Yjs federated)
- SOC 2 Type II audit (target: 2026-Q4)

### Phase 2 (Q2-Q4 2027)
- 50+ integrations (Stripe, Plaid, NetSuite, Salesforce, etc.)
- Data warehouse sync (Snowflake, BigQuery)
- Excel/Google Sheets live link

### Phase 3 (Q1-Q2 2028)
- AI Copilot (NIM proxy)
- ML forecasting
- Document AI (parse 10-Q, 10-K)
- Sector AI (vertical packs: SaaS metrics, retail, manufacturing)

### Phase 4 (Q3 2028 - 2029)
- Mobile (Tauri iOS/Android)
- Public SDK
- Marketplace
- White-label
- PE/VC modules
- Embedded FP&A

---

## PROTOCOL COMPLIANCE (D-001 through D-009)

| ID | Rule | Status |
|----|------|--------|
| D-001 | Founder commit 553de19a (sed-fixed 11/14 role="alert") accepted; 3 remaining = Option B | ✅ COMPLIED |
| D-002 | Test gate refined: 8,334+ tests / 70 pre-existing fails | ✅ COMPLIED |
| D-003 | 5 dead workers + 5 test files (PascalCase legacy) to be deleted | ⏳ POST-PUSH |
| D-004 | SOXComplianceEngine 1,354 LOC test gap = P0 | ⏳ POST-PUSH |
| D-005 | Muse delivery reports get ≤2 sentence reply or silence | ✅ COMPLIED |
| D-006 | Cross-Muse file-system visibility — persona files in workspace | ✅ COMPLIED |
| D-007 | No-idle-agents — 5 patterns (pre-stage, cross-Muse pickup, pre-write next, verification, domain deepening) | ✅ ACTIVE (7 patterns now, Themis to enforce) |
| D-008 | Push-now-fix-tests-post-push (D-002 → D-008 decision flip) | ✅ COMPLIED |
| D-009 | Triangulation discipline (verify against source-of-truth doc when a Muse reports state change) | ✅ COMPLIED |

---

## FOUNDER ADVISORIES (still active)

1. **Rotate `VITE_NIM_API_KEY_1` and `VITE_NIM_API_KEY_2`** in NVIDIA NIM dashboard (post-push hygiene, not blocker)
