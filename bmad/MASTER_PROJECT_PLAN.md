# FinPlan Pro — BMAD Master Project Plan

**Role:** Lead Orchestrator Agent
**Methodology:** BMAD (Breakthrough Method of Agile AI-Driven Development) — full 11-step workflow per section
**Standard:** 100% completion, zero compromises, zero technical debt, production-ready
**Branch:** `arena/019f9914-fp-a-betterversion`
**Created:** 2026-07-25

---

## 0. Acknowledgement of Framework

I acknowledge the framework and accept the role of **Lead Orchestrator Agent**.

- We will divide the project into **exactly 100 discrete sections**.
- We focus on **one section at a time**. A section is `COMPLETE: 100% READY` only after it passes all 11 BMAD steps, including an **adversarial Senior Developer code review** that finds and gets fixed specific problems.
- **No skipping, no merging, no partial completions, no undocumented assumptions.**
- Every step produces a markdown artifact in the document repository.
- The 100 concrete sections will be generated **after** the project parameters (Name, Core Idea, Tech Stack) are confirmed by the user.

---

## 1. Vision (expanded)

**FinPlan Pro** is an **all-in-one FP&A platform** — the single application a finance team needs. The user should *never have to leave it or use another tool*. It must cover, end to end:

- General Ledger ingestion → Chart of Accounts → Trial Balance / Journals
- Budgeting (build, approve, lock) → Forecasting → Scenario / Monte Carlo
- Financial Statements (P&L, Balance Sheet, Cash Flow) → Variance → Board Packs
- Multi-entity Consolidation + Multi-currency FX
- 40+ industry sector verticals with real KPIs
- Governance (audit, approvals, collaboration, RBAC, period close)
- Enterprise polish (dark/light, WCAG 2.2 AA, help, command palette)
- Performance, security, and a first-class native desktop (Tauri) build

**Repo hygiene rule:** The repository must contain **no junk or useless files**. Stray logs, superseded roadmaps, duplicate state snapshots, and scratch dumps will be removed/quarantined into `bmad/archive/` as part of Section 1.

---

## 2. The 100 Sections — Lifecycle Categorization

The 100 sections are grouped into **19 lifecycle bands**. Counts sum to exactly 100. The *exact* `S01..S100` list (with slugs and one-line scopes) will be produced after parameters are confirmed; the band allocation below is the contract for how they are distributed.

| Band | Theme | Sections | Count |
|------|-------|----------|------:|
| 1 | Repo Hygiene & Foundation (cleanup, ADR ratification, doc reconciliation) | S01–S06 | 6 |
| 2 | Environment, Build & CI/CD (install fix, tsc/lint/build gates, CI) | S07–S11 | 5 |
| 3 | Data & GL Pipeline (upload, CoA, trial balance, journals, reconciliation) | S12–S20 | 9 |
| 4 | Persistence, Backup & Migration (IndexedDB→SQLite, backup/restore) | S21–S25 | 5 |
| 5 | Core Financial Engines (pure TS calc library) | S26–S33 | 8 |
| 6 | Budgeting System (list, wizard, grid editor, approval/lock) | S34–S42 | 9 |
| 7 | Forecasting & Driver Planning (drivers, rolling, what-if) | S43–S49 | 7 |
| 8 | Scenario Modeling & Monte Carlo (builder, compare, sim) | S50–S55 | 6 |
| 9 | Financial Statements & Reporting (P&L, BS, CF, designer) | S56–S64 | 9 |
| 10 | Variance, Board Pack & Analytics (waterfall, board pack, dashboards) | S65–S69 | 5 |
| 11 | Consolidation & Multi-Currency FX (IC elim, NCI, FX translation, hedging) | S70–S75 | 6 |
| 12 | Sector Verticals (SaaS, Mfg, Banking, RE, Retail, Energy/ESG, …) | S76–S82 | 7 |
| 13 | Enterprise Governance (audit, approval queue, collaboration, RBAC, period close) | S83–S87 | 5 |
| 14 | UX, Accessibility & Help (dark/light, WCAG AA, F1 help, command palette) | S88–S90 | 3 |
| 15 | Performance & Architecture (workers, virtualization, bundle) | S91–S92 | 2 |
| 16 | Testing & Quality (≥95% pass, E2E, coverage) | S93–S94 | 2 |
| 17 | Security & Compliance (CSP, secrets, auth, GDPR) | S95–S96 | 2 |
| 18 | Tauri Desktop & Native (build, SQLite, dialogs, updater) | S97–S98 | 2 |
| 19 | Onboarding, Docs & Release (wizard, README, v1.0.0) | S99–S100 | 2 |
| | **TOTAL** | | **100** |

**Pacing rule:** Section N cannot start until Section N−1 is marked `COMPLETE: 100% READY` in `bmad/SECTION_INDEX.md`.

---

## 3. Document Repository Structure (11-step workflow)

Each section lives in its own folder under `bmad/sections/`. The folder name is `Sxx-<slug>/`.

```
bmad/
├── MASTER_PROJECT_PLAN.md        # this file
├── SECTION_INDEX.md              # status board: S01..S100 + COMPLETE flags
├── archive/                      # quarantined junk / superseded docs
├── templates/                    # 11 reusable step templates
│   ├── 01-brainstorm.md
│   ├── 02-research.md
│   ├── 03-product-brief.md
│   ├── 04-prd.md
│   ├── 05-ux-design.md
│   ├── 06-architecture.md
│   ├── 07-epics-stories.md
│   ├── 08-sprint-status.md
│   ├── 09-story-prep.md
│   ├── 10-dev-story.md
│   └── 11-code-review.md
└── sections/
    ├── S01-<slug>/
    │   ├── 01-brainstorm.md
    │   ├── 02-research.md
    │   ├── 03-product-brief.md
    │   ├── 04-prd.md
    │   ├── 05-ux-design.md
    │   ├── 06-architecture.md
    │   ├── 07-epics-stories.md
    │   ├── 08-sprint-status.md
    │   ├── 09-story-prep.md
    │   ├── 10-dev-story.md      # implementation notes + tests + validation
    │   └── 11-code-review.md    # adversarial review + fixes + approval
    ├── S02-<slug>/
    └── … (through S100)
```

### The 11 steps (per section, in order)
1. **Brainstorming** — First Principles, SCAMPER, ideation map for the section.
2. **Research** — current web data / verified sources relevant to the section.
3. **Product Brief** — vision + target users for the section.
4. **PRD** — requirements, scope, out-of-scope, acceptance criteria.
5. **UX Design** — interface/flow design as it relates to the section.
6. **Architecture** — technical design, data flow, files touched.
7. **Epics & Stories** — breakdown into implementation-ready stories.
8. **Sprint Planning** — sprint status tracking file for the section.
9. **Story Prep** — guided dev prep (checklist before coding).
10. **Dev Story** — implementation: tasks/subtasks, tests, validation, story update.
11. **Code Review** — adversarial Senior Dev review; specific problems found; fixes required before `COMPLETE: 100% READY`.

---

## 4. Section Status Board

`bmad/SECTION_INDEX.md` tracks every section with: band, slug, status (`TODO | IN_PROGRESS | IN_REVIEW | COMPLETE: 100% READY`), and the 11 artifacts' completion.

---

## 5. Next Immediate Action

Per the framework, I will **not** generate the 100 sections yet. I require the following project parameters from you:

1. **Project Name**
2. **Core Idea** (central scope statement / what "everything in one app" means for us)
3. **Tech Stack** (recommended: keep the existing React 19 + TS 5.9 + Vite 8 + Tauri 2 + Zustand 5 + AG Grid + Recharts stack; alternatives available)

Once you confirm these, I will generate the exact `S01..S100` list (with slugs + one-line scopes) and begin **Section 1** through all 11 steps.
