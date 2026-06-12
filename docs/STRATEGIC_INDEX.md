# 📚 FinPlan Pro — Strategic Documentation Index

> **Purpose:** Tells anyone (new contributor, Muse, AI agent, founder) exactly which file to read for which question.
> **Maintained by:** Strategos (the 7th Muse).
> **Total docs indexed:** 50+ files, ~6,500+ lines of strategic prose.

---

## I Want to Understand the Vision

| Question                          | Read this                                  |
| --------------------------------- | ------------------------------------------ |
| What's the one-sentence vision?   | `PRODUCT_VISION.md` §1                     |
| How do we define "100× better"?   | `PRODUCT_VISION.md` §2                     |
| What are the 6 strategic pillars? | `PRODUCT_VISION.md` §3                     |
| What's the 4-year roadmap?        | `PRODUCT_VISION.md` §4                     |
| What capabilities are missing?    | `PRODUCT_VISION.md` §5 (capability matrix) |
| What are the success metrics?     | `PRODUCT_VISION.md` §6                     |
| What does "all-in-one" mean?      | `PRODUCT_VISION.md` §5                     |
| What are the 7 Muses?             | `PRODUCT_VISION.md` §9                     |

## I Want to Understand the Competitive Landscape

| Question                                  | Read this                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who are the 20 competitors?               | `FPA_COMPETITIVE_MATRIX.md` (817 lines)                                                                                                                                |
| Anaplan, Adaptive, Pigment, etc. profiles | `FPA_COMPETITIVE_MATRIX.md` §2                                                                                                                                         |
| Feature-by-feature comparison             | `FPA_COMPETITIVE_MATRIX.md` §3                                                                                                                                         |
| Where are the gaps vs. competitors?       | `COMPETITOR_GAP_ANALYSIS_25.md`, `GAP_ANALYSIS_LIVE.md`                                                                                                                |
| 259 specific gaps                         | `MASTER_PLAN_259_GAPS.md` (320 lines)                                                                                                                                  |
| Tier 1 / Tier 2 / Tier 3 prioritization   | `1000X_ADVANTAGE_ROADMAP.md`, `ADVANCED_FEATURES_ROADMAP.md`, `TIER1_FEATURES_PLAN.md`                                                                                 |
| Deep gap analysis                         | `GAP_DEEP_ANALYSIS_PART1_8.md`, `GAP_DEEP_ANALYSIS_PART9_15.md`, `GAP_PART4_FINANCIAL_DOMAIN.md`, `GAP_PART5_DEEP_GAPS.md`, `GAP_PART6_COMPETITIVE_DIFFERENTIATION.md` |
| "IMP" question/answer transcripts         | `IMP_ANSWERS.md`, `IMP_ANSWERS_PART2-5.md`, `IMP_QA_SUMMARY.md`, `IMP_ANSWERS_Q*.md` (1-2200)                                                                          |

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

## I Want to Understand the Muse System (Multi-Agent)

| Question                                | Read this                                            |
| --------------------------------------- | ---------------------------------------------------- |
| What is a Muse?                         | `PRODUCT_VISION.md` §9, `memory/persona-*.md`        |
| What does each Muse do?                 | `PRODUCT_VISION.md` §9                               |
| What audits have they delivered?        | `memory/project-*-audit-2026-06-12.md`               |
| What docs have they drafted?            | `docs/drafts/` (4,122 lines, 20 files)               |
| How do the Muses coordinate?            | `memory/feedback-parallel-pre-staging-2026-06-12.md` |
| The "three witnesses" verification rule | `memory/feedback-verify-before-claiming.md`          |

## I Want to Understand What's Built

| Asset                        | File                             |
| ---------------------------- | -------------------------------- |
| 178 engines                  | `src/engines/`                   |
| 36 zustand stores            | `src/store/`                     |
| 192 pages across 50+ domains | `src/pages/`                     |
| 274 components               | `src/components/`                |
| 17 sector configurations     | `src/config/sectors/`            |
| 14 industry templates        | `src/engines/templates/`         |
| 245+ formula functions       | `src/engines/formula-functions/` |
| 17 sector dashboards         | `src/pages/sector/`              |
| 6 plugin system files        | `src/plugins/`                   |
| Master test config           | `PERFECTION_PLAN.md`             |

## I Want to Find a Specific Doc by Topic

### Architecture & Design

- `ARCHITECTURE.md` — high-level system architecture
- `DESKTOP_FIRST_ARCHITECTURE.md` — desktop-native patterns
- `PERFORMANCE_ARCHITECTURE.md` — performance engineering
- `DESIGN_SYSTEM_ANALYSIS.md` — design tokens, components
- `COMPONENT_PATTERNS.md` — React component patterns
- `CHART_INTEGRATION_PLAN.md` — chart library decisions
- `MCP_SERVERS_RESEARCH.md` — MCP server research

### Strategic & Competitive

- `PRODUCT_VISION.md` ← **READ FIRST** (the North Star)
- `STRATEGIC_INDEX.md` ← **THIS FILE** (the doc-of-docs)
- `MERGED_MASTER_PLAN.md` — vision × engineering synthesis
- `MASTER_PLAN.md` — original master plan
- `MASTER_PLAN_259_GAPS.md` — 259 specific gaps
- `COMPLETE_PROJECT_SPEC.md` — full project spec
- `1000X_ADVANTAGE_ROADMAP.md` — 1000x advantage roadmap
- `ADVANCED_FEATURES_ROADMAP.md` — 3-tier feature roadmap
- `TIER1_FEATURES_PLAN.md` — top 10 features detailed

### Competitive Analysis

- `FPA_COMPETITIVE_MATRIX.md` — 20 platforms × all features
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

### Mnemosyne's Drafts (in `docs/drafts/`, 4,122 lines / 20 files)

- `GLOSSARY.md` — 21 FP&A terms
- `adr/ADR-002-006-*.md` — 5 architectural decisions
- `jsdoc/*.ts.md` — 5 JSDoc patches (CubeEngine, CapExEngine, MonteCarloEngine, masterStorage, useAuth)
- `ONBOARDING.md` — 30-min first-day path
- `TESTING.md` — Vitest guide
- `diagrams/01-05.mmd` + `ARCHITECTURE.md` — 5 mermaid + combined view
- `CHANGELOG.md` — conventional-changelog skeleton
- Plus Muses' pre-staged work-in-progress in `docs/drafts/{athena,hera,hephaestus,prometheus}/`

## Search Shortcuts

| If you're looking for...  | Try this Grep pattern                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mention of a competitor   | `grep -l -i "anaplan\|pigment\|adaptive\|cubi" docs/*.md`                                                   |
| A specific feature gap    | `grep -B2 -A5 "TODO\|missing\|gap" docs/GAP_*.md`                                                           |
| A specific engine mention | `grep -l "MonteCarlo\|CapEx\|Cube" docs/*.md`                                                               |
| Roadmap priority          | `grep -B1 -A2 "TIER 1\|Tier 1\|P0" docs/*ROADMAP*.md docs/*PLAN*.md`                                        |
| The 7 Muses               | `grep -l "Muse\|Apollo\|Athena\|Prometheus\|Hera\|Hephaestus\|Mnemosyne\|Strategos" docs/PRODUCT_VISION.md` |

## How to Add a New Strategic Doc

1. Write the doc as `docs/<NAME>.md`
2. Add it to the appropriate section of THIS index
3. If it changes the vision, update `PRODUCT_VISION.md` too
4. Commit with message: `docs(strategy): <one-line summary> (Strategos)`
5. Notify Leader so the 6 other Muses can reference it

## Maintenance Cadence

- **Weekly (by Strategos):** Verify all doc cross-references are valid; remove dead links
- **Monthly:** Update §6 success metrics in PRODUCT_VISION.md
- **Quarterly:** Refresh FPA_COMPETITIVE_MATRIX.md (competitor moves)
- **Per-release:** Update COMPLETE_PROJECT_SPEC.md with the new build state
- **Per-audit:** Add a `memory/project-*-audit-<date>.md` file

---

_This index is a living document. If you read a doc and it has a broken link, fix the index. If you read a doc and find it outdated, fix the doc. — Strategos_
