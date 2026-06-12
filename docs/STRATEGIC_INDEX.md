<!-- v2.0 — 2026-06-13 — adds 4 new Muses, MUSE_LINEUP_v2 cross-ref, TASKBOARD cross-ref, D-NNN namespace note. v1 was 202L, 2026-05-16. -->

# 📚 FinPlan Pro — Strategic Documentation Index (v2)

> **Date:** 2026-05-16 (v1) · **2026-06-13 (v2 — 11 Muses, MUSE_LINEUP_v2 cross-ref, TASKBOARD cross-ref, D-NNN namespace note)**
> **Owner:** Strategos (7th of 11 Muses) + Leader
> **Companion:** [`docs/MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) (187L, the 11-Muse roster) · [`docs/drafts/TASKBOARD.md`](drafts/TASKBOARD.md) (164L, the work-protocol source of truth)
> **v2 changelog:** [`docs/drafts/strategos/strategic-index-v2-changelog.md`](drafts/strategos/strategic-index-v2-changelog.md)
> **Total docs indexed:** 60+ files, ~7,500+ lines of strategic prose

---

## ⚠️ D-NNN namespace collision (Strategos's first major call-out)

**There are 2 different D-001 to D-009 schemes in the cycle.**

| ID | Cycle Protocol (`docs/drafts/TASKBOARD.md`) | Strategic Decision (`docs/STRATEGIC_DECISIONS_LOG.md`) | Aligned? |
|----|--------------------------------------------|------------------------------------------------------|----------|
| D-001 | Founder commit 553de19a (11/14 role="alert" sed-fix) accepted | Phase 0 is the "perfection cycle" | ❌ |
| D-002 | Test gate refined (8,334+ tests / 70 pre-existing fails) | Three Witnesses verification rule | ❌ |
| D-003 | 5 dead workers + 5 test files (PascalCase legacy) to be deleted | P0 #0 (test setup mock + dead workers) takes priority | 🟡 related |
| D-004 | SOXComplianceEngine 1,354 LOC test gap = P0 | Hephaestus's P0 #1 (".env not gitignored") is a false positive | ❌ |
| D-005 | Muse delivery reports get ≤2 sentence reply or silence | Strategos's 4-pillar mandate ratified | ❌ |
| D-006 | Cross-Muse file-system visibility — persona files in workspace | Security-deferral discipline | ❌ |
| D-007 | No-idle-agents — 5 patterns (now 7) | 7-phase audit pattern (A-G) | ❌ |
| D-008 | Push-now-fix-tests-post-push | Muse team may expand to 11 (Hermes, Iris, Atlas proposed) | ❌ |
| D-009 | Triangulation discipline (verify state changes) | Triangulation discipline | ✅ aligned |

**3 of 9 IDs are aligned (D-003 🟡, D-009 ✅); 6 of 9 are misaligned.**

**Strategos recommendation:** Renumber strategic decisions to **D-010 through D-019** to free D-001 to D-009 for the cycle protocols (which are referenced more often — every task uses them). **DECISION NEEDED from Leader by 2026-06-15.** Full analysis: `docs/MUSE_LINEUP_v2.md §3`.

> **Witness (D-002):** *Source:* `STRATEGIC_DECISIONS_LOG.md` L22-30 + `TASKBOARD.md` L146-158 compliance table. *Data:* 9 IDs in 2 namespaces; 6 misaligned. *Competitive context:* Internal process discipline. Git branch naming analogue — must be unambiguous or PRs collide. Same risk for D-NNN in cross-Muse handoffs.

---

## I Want to Understand the Vision

| Question                          | Read this                                  |
| --------------------------------- | ------------------------------------------ |
| What's the one-sentence vision?   | `PRODUCT_VISION.md` §1                     |
| How do we define "100× better"?   | `PRODUCT_VISION.md` §2                     |
| What are the 6 strategic pillars? | `PRODUCT_VISION.md` §3                     |
| What's the 4-year roadmap?        | `PRODUCT_VISION.md` §4, `ROADMAP.md`       |
| What capabilities are missing?    | `PRODUCT_VISION.md` §5 (capability matrix) |
| What are the success metrics?     | `PRODUCT_VISION.md` §6                     |
| What does "all-in-one" mean?      | `PRODUCT_VISION.md` §5                     |
| **What are the 11 Muses?**        | **`PRODUCT_VISION.md` §9, [`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md)** |

## I Want to Understand the Competitive Landscape

| Question                                  | Read this                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who are the 20 competitors?               | `FPA_COMPETITIVE_MATRIX.md` (821 lines, v2 with phase-target column)                                                                                                   |
| Anaplan, Adaptive, Pigment, etc. profiles | `FPA_COMPETITIVE_MATRIX.md` §2                                                                                                                                         |
| Feature-by-feature comparison             | `FPA_COMPETITIVE_MATRIX.md` §3                                                                                                                                         |
| Where are the gaps vs. competitors?       | `COMPETITOR_GAP_ANALYSIS_25.md`, `GAP_ANALYSIS_LIVE.md`                                                                                                                |
| 259 specific gaps                         | `MASTER_PLAN_259_GAPS.md` (320 lines)                                                                                                                                  |
| Tier 1 / Tier 2 / Tier 3 prioritization   | `1000X_ADVANTAGE_ROADMAP.md`, `ADVANCED_FEATURES_ROADMAP.md`, `TIER1_FEATURES_PLAN.md`                                                                                 |
| Deep gap analysis                         | `GAP_DEEP_ANALYSIS_PART1_8.md`, `GAP_DEEP_ANALYSIS_PART9_15.md`, `GAP_PART4_FINANCIAL_DOMAIN.md`, `GAP_PART5_DEEP_GAPS.md`, `GAP_PART6_COMPETITIVE_DIFFERENTIATION.md` |
| "IMP" question/answer transcripts         | `IMP_ANSWERS.md`, `IMP_ANSWERS_PART2-5.md`, `IMP_QA_SUMMARY.md`, `IMP_ANSWERS_Q*.md` (1-2200)                                                                          |
| **Anaplan battlecard (v2)**               | **`docs/drafts/hermes/BATTLECARD_ANAPLAN.md`**                                                                                                                          |
| **8 Q2 2026 competitor moves**            | **`FPA_COMPETITIVE_MATRIX.md` §4** (Anaplan AI, Pigment $145M, Drivetrain Connect, Prophix/Signals, Cube v2, Abacum $50M ARR, Vena×MS, Workday Adaptive free)             |

## I Want to Understand the Architecture

| Question                           | Read this                                            |
| ---------------------------------- | ---------------------------------------------------- |
| What's the layered architecture?   | `MERGED_MASTER_PLAN.md` Part 1-2 (1,049 lines)       |
| How does the cube data model work? | `ARCHITECTURE.md`, `MERGED_MASTER_PLAN.md` LAYER 2   |
| How do engines relate to stores?   | `ARCHITECTURE.md`, `MERGED_MASTER_PLAN.md` LAYER 4-5 |
| Desktop-first design               | `DESKTOP_FIRST_ARCHITECTURE.md`                      |
| Performance architecture           | `PERFORMANCE_ARCHITECTURE.md`                        |
| Complete project specification     | `COMPLETE_PROJECT_SPEC.md` (681 lines)               |
| Formula engine details             | `ARCHITECTURE.md` LAYER 3                            |
| MCP server research                | `MCP_SERVERS_RESEARCH.md`                            |

## I Want to Build a Specific Feature

| Feature                          | Plan                                  |
| -------------------------------- | ------------------------------------- |
| NLQ (natural language queries)   | `NLQ_IMPLEMENTATION_PLAN.md`          |
| Three-statement model            | `THREE_STATEMENT_PLAN.md`             |
| Template library                 | `TEMPLATE_LIBRARY_PLAN.md`            |
| Tool stack decisions             | `TOOL_STACK_PLAN.md`                  |
| Chart integration                | `CHART_INTEGRATION_PLAN.md`           |
| Tier 1 features (top 10)         | `TIER1_FEATURES_PLAN.md`              |
| Master plan (all 259 gaps)       | `MASTER_PLAN_259_GAPS.md`             |
| Merged engineering + vision plan | `MERGED_MASTER_PLAN.md` (1,049 lines) |
| The original perfection plan     | `PERFECTION_PLAN.md`                  |

## I Want to Understand the UI/UX

| Question                  | Read this                                    |
| ------------------------- | -------------------------------------------- |
| What components exist?    | `COMPONENT_PATTERNS.md`                      |
| What's the design system? | `DESIGN_SYSTEM_ANALYSIS.md`                  |
| What's the user guide?    | `FINPLAN_PRO_USER_GUIDE.md`, `USER_GUIDE.md` |
| What's the UX flow?       | `UX_FLOW_ANALYSIS.md`                        |
| UI component brainstorm   | `UI_COMPONENT_BRAINSTORM.md`                 |

## I Want to Understand the Muse System (Multi-Agent) — **v2: 7 → 11 Muses**

| Question                                | Read this                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| What is a Muse?                         | `PRODUCT_VISION.md` §9, `memory/persona-*.md`                                                                          |
| What does each Muse do?                 | `PRODUCT_VISION.md` §9, **[`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) §1** (full 11-Muse roster)                          |
| **The 4 new Muses (joined 2026-06-13)** | **[`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) §2** (Iris, Hermes, Atlas, Themis — each with 3-witness verification)        |
| **The D-NNN namespace collision**       | **[`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) §3** (Strategos's first major call-out)                                      |
| **Muse-to-roadmap mapping**             | **[`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) §5** (which Muse owns which Phase deliverable)                              |
| **How Muses invoke each other**        | **[`MUSE_LINEUP_v2.md`](MUSE_LINEUP_v2.md) §6** (slot-ID-based messaging table)                                         |
| What audits have they delivered?        | `memory/project-*-audit-2026-06-12.md`                                                                                 |
| What docs have they drafted?            | `docs/drafts/{apollo,athena,prometheus,hera,hephaestus,mnemosyne,strategos,iris,hermes,atlas,themis}/` (11 directories) |
| How do the Muses coordinate?            | **`docs/drafts/TASKBOARD.md`** (the work-protocol source of truth, owned by Leader + Themis)                           |
| The "three witnesses" verification rule | `memory/feedback-verify-before-claiming.md`                                                                            |
| **The "no idle agents" discipline (D-007)** | **`docs/drafts/TASKBOARD.md` §Work Protocol** (7 patterns, Themis enforces)                                         |

## I Want to Find the Current Task Board **(NEW IN v2)**

| If you need to...                        | Read this                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| See what's ready to work on              | `docs/drafts/TASKBOARD.md` §Ready Queue                                                    |
| See what's in flight                     | `docs/drafts/TASKBOARD.md` §In Progress                                                    |
| See the Q2 2026 scorecard                | `docs/STRATEGIC_REVIEW_Q2_2026.md` §9 ("Is 100× yet?" 10-dimension weighted score)        |
| See strategic decisions                  | `docs/STRATEGIC_DECISIONS_LOG.md` (D-000 through D-009)                                   |
| See security deferrals (D-006 sister)    | `docs/security-deferrals.md` (DEFER-2026-001/002/003)                                      |
| See the 4 strategic bets                 | `ROADMAP.md` §Strategic bets                                                               |
| **Submit a deliverable for review**      | **`docs/drafts/TASKBOARD.md` §Delivery Report Template** (≤2 sentence reply or silence, D-005) |

## I Want to Understand What's Built **(v2: counts updated to Q2 2026 ground truth)**

| Asset                        | File                             |
| ---------------------------- | -------------------------------- |
| **202 financial engines**    | **`src/engines/`** (was 178 in v1; 175/176 have tests, 99.4%) |
| **35 zustand stores**        | **`src/store/`** (was 36 in v1; 35/36 have immer wrapper, 100%) |
| **82 pages across 50+ domains** | **`src/pages/`** (was 192 in v1) |
| 274 components               | `src/components/`                |
| 17 sector configurations     | `src/config/sectors/`            |
| 14 industry templates        | `src/engines/templates/`         |
| 245+ formula functions       | `src/engines/formula-functions/` |
| 17 sector dashboards         | `src/pages/sector/`              |
| 6 plugin system files        | `src/plugins/`                   |
| **8,334+ tests, 16 failing** | **`npm test` output (Prometheus P0 #0 blocker)** |
| **0 CVEs across 1,111 deps** | **`npm audit` output**           |
| Master test config           | `PERFECTION_PLAN.md`             |

## I Want to Find a Specific Doc by Topic

### Architecture & Design

- `ARCHITECTURE.md` — high-level system architecture (578L, refreshed 2026-06-13; 5 ASCII→Mermaid diagrams, Mnemosyne T-MN-005)
- `DESKTOP_FIRST_ARCHITECTURE.md` — desktop-native patterns
- `PERFORMANCE_ARCHITECTURE.md` — performance engineering
- `DESIGN_SYSTEM_ANALYSIS.md` — design tokens, components
- `COMPONENT_PATTERNS.md` — React component patterns
- `CHART_INTEGRATION_PLAN.md` — chart library decisions
- `MCP_SERVERS_RESEARCH.md` — MCP server research

### Strategic & Competitive

- `PRODUCT_VISION.md` ← **READ FIRST** (the North Star)
- `STRATEGIC_INDEX.md` ← **THIS FILE** (the doc-of-docs, v2)
- `MERGED_MASTER_PLAN.md` — vision × engineering synthesis
- `MASTER_PLAN.md` — original master plan
- `MASTER_PLAN_259_GAPS.md` — 259 specific gaps
- `COMPLETE_PROJECT_SPEC.md` — full project spec
- `1000X_ADVANTAGE_ROADMAP.md` — 1000x advantage roadmap
- `ADVANCED_FEATURES_ROADMAP.md` — 3-tier feature roadmap
- `TIER1_FEATURES_PLAN.md` — top 10 features detailed
- **`STRATEGIC_REVIEW_Q2_2026.md`** — Q2 2026 review (Strategos-owned, "Is 100× yet?" 58.7%/42% scorecard)
- **`ROADMAP.md`** — 5-phase quarterly roadmap (Strategos-owned, 4 strategic bets)
- **`STRATEGIC_DECISIONS_LOG.md`** — D-000 to D-009 (Strategos-owned)
- **`MUSE_LINEUP_v2.md`** — 11-Muse roster (Strategos-owned, NEW IN V2)

### Competitive Analysis

- `FPA_COMPETITIVE_MATRIX.md` — 20 platforms × all features (v2, 821L, phase-target column)
- `COMPETITOR_ANALYSIS.md` — top-tier competitors
- `COMPETITOR_GAP_ANALYSIS_25.md` — 25 specific gaps
- `GAP_ANALYSIS_LIVE.md` — live gap analysis
- `GAP_DEEP_ANALYSIS_PART1_8.md` — deep gaps 1-8
- `GAP_DEEP_ANALYSIS_PART9_15.md` — deep gaps 9-15
- `GAP_PART4_FINANCIAL_DOMAIN.md` — financial domain gaps
- `GAP_PART5_DEEP_GAPS.md` — deeper gaps
- `GAP_PART6_COMPETITIVE_DIFFERENTIATION.md` — differentiation opportunities

### Implementation Plans

- `NLQ_IMPLEMENTATION_PLAN.md`
- `THREE_STATEMENT_PLAN.md`
- `TEMPLATE_LIBRARY_PLAN.md`
- `TOOL_STACK_PLAN.md`
- `TIER1_FEATURES_PLAN.md`

### Q&A Transcripts (1,800+ answered questions)

- `IMP_QA_SUMMARY.md`
- `IMP_ANSWERS.md` through `IMP_ANSWERS_PART5.md`
- `IMP_ANSWERS_Q1_600.md`, `IMP_ANSWERS_Q601_1200.md`, `IMP_ANSWERS_Q1201_1800.md`, `IMP_ANSWERS_Q1801_2200.md`

### UX & User-Facing

- `FINPLAN_PRO_USER_GUIDE.md`
- `USER_GUIDE.md`
- `UX_FLOW_ANALYSIS.md`
- `UI_COMPONENT_BRAINSTORM.md`

### Operational

- `PERFECTION_PLAN.md` — the current perfection cycle plan
- `MISTAKES.md` — lessons learned
- `ACQUIRED_SKILLS.md`, `ACTIVE_SKILLS.md`, `COMPOUND_SKILLS.md` — skill inventory
- `TAURI_PUBKEY_ROTATION.md` — security operations
- `OPENCODE_SYNC.md` — sync procedures
- **`security-deferrals.md`** — DEFER-2026-001/002/003 (Hephaestus + Athena, D-006 sister log)

### Strategos's Drafts (in `docs/drafts/strategos/`, v2)

- `STRATEGIC_INDEX_REFRESH.md` (158L) — v2 refresh spec for THIS file
- `strategic-index-v2-changelog.md` (58L) — v2 changelog (NEW IN V2)
- `FPA_COMPETITIVE_MATRIX_REFRESH.md` (208L) — v2 matrix deliverable
- `competitive-matrix-v2-changelog.md` (81L) — v2 matrix changelog
- `PHASE_1_GTM.md` (316L) — Phase 1 GTM strategy (T-ST-003)

### Mnemosyne's Drafts (in `docs/drafts/mnemosyne/`)

- `GLOSSARY.md` — 21 FP&A terms
- `adr/ADR-002-006-*.md` — 5 architectural decisions
- `jsdoc/*.ts.md` — 5 JSDoc patches (CubeEngine, CapExEngine, MonteCarloEngine, masterStorage, useAuth)
- `ONBOARDING.md` — 30-min first-day path
- `TESTING.md` — Vitest guide
- `diagrams/01-05.mmd` + `ARCHITECTURE.md` — 5 mermaid + combined view (T-MN-005 shipped 2026-06-13)
- `CHANGELOG.md` — conventional-changelog skeleton

### Other Muses' Pre-Staged Work (in `docs/drafts/{apollo,athena,prometheus,hera,hephaestus,iris,hermes,atlas,themis}/`)

- **Iris:** PERSONAS.md, INTERVIEW_SCRIPT.md, JOURNEY_MAP_CARLA.md, CHURN_FRAMEWORK.md, NPS_SURVEY_DESIGN.md, BETA_FEEDBACK_PLAN.md
- **Hermes:** ICP.md, POSITIONING.md, PRICING.md, BATTLECARD_ANAPLAN.md, BETA_PROGRAM.md, DISCOVERY_CALL_PLAYBOOK.md, OBJECTION_HANDLING_CHEATSHEET.md, MARKETING_SITE_HOME.md
- **Atlas:** DOCKER_TAURI.md, ON_CALL_RUNBOOK.md, CI_MATRIX.md, OBSERVABILITY_STACK.md, ci/{lint,tsc,test-unit,build}.yml
- **Themis:** STATE_DIAGNOSTIC_2026-06-13.md
- **Apollo, Athena, Prometheus, Hera, Hephaestus, Mnemosyne:** audit deliverables + 38 post-push queue items

## Search Shortcuts

| If you're looking for...  | Try this Grep pattern                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mention of a competitor   | `grep -l -i "anaplan\|pigment\|adaptive\|cubi" docs/*.md`                                                                                                      |
| A specific feature gap    | `grep -B2 -A5 "TODO\|missing\|gap" docs/GAP_*.md`                                                                                                              |
| A specific engine mention | `grep -l "MonteCarlo\|CapEx\|Cube" docs/*.md`                                                                                                                  |
| Roadmap priority          | `grep -B1 -A2 "TIER 1\|Tier 1\|P0" docs/*ROADMAP*.md docs/*PLAN*.md`                                                                                           |
| The 11 Muses              | `grep -l "Muse\|Apollo\|Athena\|Prometheus\|Hera\|Hephaestus\|Mnemosyne\|Strategos\|Iris\|Hermes\|Atlas\|Themis" docs/PRODUCT_VISION.md docs/MUSE_LINEUP_v2.md` |
| A D-NNN decision          | `grep -B1 -A3 "^### D-0" docs/STRATEGIC_DECISIONS_LOG.md` (D-000 to D-009) **OR** `grep -B1 -A3 "^| D-0" docs/drafts/TASKBOARD.md` (cycle protocols)           |
| A specific Muse's lane    | `grep -l "Muse name" docs/MUSE_LINEUP_v2.md`                                                                                                                   |

## How to Add a New Strategic Doc

1. Write the doc as `docs/<NAME>.md`
2. Add it to the appropriate section of THIS index
3. If it changes the vision, update `PRODUCT_VISION.md` too
4. Commit with message: `docs(strategy): <one-line summary> (Strategos)`
5. Notify Leader so the 10 other Muses can reference it
6. **If the doc introduces a new decision (D-NNN), log it in `STRATEGIC_DECISIONS_LOG.md` AND check the cycle-protocol namespace in `TASKBOARD.md` (D-006 collision-prevention discipline, NEW IN V2)**

## Maintenance Cadence

- **Weekly (by Strategos):** Verify all doc cross-references are valid; remove dead links
- **Weekly (by Strategos + Themis):** Verify all 11 Muse `memory/persona-*.md` files are up to date
- **Monthly:** Update §6 success metrics in `PRODUCT_VISION.md`
- **Monthly (NEW IN V2):** Verify D-NNN namespace uniqueness against `TASKBOARD.md` (D-006 collision-prevention)
- **Quarterly:** Refresh `FPA_COMPETITIVE_MATRIX.md` (competitor moves)
- **Per-release:** Update `COMPLETE_PROJECT_SPEC.md` with the new build state
- **Per-audit:** Add a `memory/project-*-audit-<date>.md` file
- **Per-quarter:** Write `STRATEGIC_REVIEW_Q[1-4]_YYYY.md` and update the "Is 100× yet?" scorecard

---

_This index is a living document. If you read a doc and it has a broken link, fix the index. If you read a doc and find it outdated, fix the doc. — Strategos_

<!-- v2.0 finalized 2026-06-13 by Strategos. 11-Muse roster + TASKBOARD cross-ref + D-NNN namespace note. -->
