# Section 012 — GL Trial Balance, Journals and Explorer Hardening

**Status:** ACTIVE

**Started:** 2026-07-26

## Objective

Harden the core General Ledger data exploration workflow so that:

- Importing GL data reliably produces a complete, balanced Trial Balance
- Journals page provides robust filtering, pagination, export, and account drill-down
- GL Explorer provides fast search + account analysis with monthly trend + running balance
- End-to-end flow (import → TB auto-generate → journals → explorer/account analysis) is solid, tested, and production-ready

This completes the P1-A Data Foundation for reporting and statements.

## Current State Audit (Pre-Section 012)

**Pages:**
- `src/pages/data/GLTrialBalancePage.tsx` — Functional, auto-generates, balance check, export. Needs polish (loading states, empty handling, account links).
- `src/pages/data/GLJournalsPage.tsx` — Good filters + pagination + export. Needs account drill-down and better performance for 10k+ rows.
- `src/pages/data/GLExplorerPage.tsx` — Basic list limited to 200 rows. Missing account analysis, trend, running balance.
- `src/pages/data/GLAccountAnalysisPage.tsx` — Exists (from earlier ls), needs integration.
- `src/store/glStore.ts` + `glTrialBalanceStore.ts` — Core logic exists.
- `src/components/data/GLTrialBalanceGrid.tsx` — Reusable grid.

**Gaps identified:**
- No automatic "account analysis" deep link from TB/Journals.
- Explorer is a dumb list (not analysis-focused).
- Limited performance testing for large GL imports.
- Missing monthly trend + running balance visualization in account view.
- Inconsistent "no data" + loading UX across the three pages.
- Export is CSV only; no PDF summary for board packs yet (defer some).

## Scope for Section 012 (Locked)

**In Scope:**
- Trial Balance: auto-generate reliability, better UX, links to journals/explorer
- Journals: improve filtering/pagination performance, account filter UX, drill to account analysis
- Explorer → Account Analysis: implement proper monthly trend chart + running balance table
- Cross-page navigation (TB → account → journals filtered)
- Add unit/integration tests for the flow
- Update targeted test list to include new hardening tests
- All gates + hygiene

**Out of Scope (later sections):**
- Full financial statements (P&L, BS, CF)
- Board pack PDF generation
- Multi-entity / FX
- E2E Playwright for this flow (will be added when P1 is fully locked)

## Acceptance Criteria (DoD for Section 012)

1. Import GL → Trial Balance auto-generates and shows balanced state.
2. Trial Balance rows link to filtered Journals and Account Analysis.
3. Journals supports date range + account + search + pagination + export with 5k+ rows performing well.
4. Account Analysis page renders:
   - Monthly trend (sparkline or small chart)
   - Running balance over time
   - Drill from TB/Journals/Explorer
5. All three pages have consistent, accessible empty/loading/error states.
6. New tests added and passing (targeted run green).
7. TypeScript + lint + build + repo:hygiene all pass.
8. `PROJECT_TASK_BOARD` and section-index updated.
9. Section marked `COMPLETE: 100% READY` only after full 11-step BMAD + code review.

## Deliverables

- Full 11-step BMAD docs under `docs/bmad/sections/012-gl-trial-balance-journals-explorer-hardening/`
- Hardening work on the three pages + supporting components/stores
- New tests: `GLTrialBalancePage.test.tsx`, `GLJournalsPage.test.tsx`, account analysis tests
- Evidence report: `reports/section-012-gl-hardening-evidence-2026-07-26.md`

## Known Risks / Caveats

- Large GL (10k+ rows) performance (use existing workers where possible)
- Chart library already in bundle (recharts or existing)
- Pre-existing test fragility in other suites

Proceed with BMAD workflow for Section 012.
