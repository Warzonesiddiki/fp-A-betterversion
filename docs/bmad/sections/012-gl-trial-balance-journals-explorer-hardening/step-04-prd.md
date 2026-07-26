# Step 04 — PRD: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Version:** 1.0  
**Date:** 2026-07-26

## 1. Overview

Harden and interconnect the three primary GL exploration experiences so that importing data leads to immediate, trustworthy, and navigable views of Trial Balance, Journals, and Account Analysis.

## 2. Goals

- Make Trial Balance the trusted single source of truth after import
- Enable frictionless drill-down from summary (TB) → detail (Journals) → deep analysis (Account)
- Deliver monthly trend + running balance for any account
- Ensure performance and UX consistency at scale

## 3. Non-Goals

- Full financial statements
- PDF / board pack output
- Multi-entity or FX
- Backend changes to persistence

## 4. Functional Requirements

### FR-01 Trial Balance
- Auto-generate on data load (idempotent)
- Clear balanced / unbalanced state with diff
- Clickable rows that navigate to filtered Journals + pre-selected Account Analysis
- Refresh button + CSV export (all columns)

### FR-02 Journals
- Date range, account filter, full-text search
- Pagination (50/100/200) with good performance on 5k+ rows
- "Analyze Account" action on each row
- Totals footer reflecting current filter
- CSV export respecting current filters

### FR-03 Account Analysis (from Explorer + deep links)
- Select or navigate directly to any account
- Summary KPIs (debits, credits, net, tx count, avg monthly)
- Monthly trend visualization (horizontal bars or simple chart)
- Running balance table (cumulative net over time)
- Link back to filtered Journals for the account

### FR-04 Navigation & State
- Deep links between the three pages
- Preserve filter state where reasonable (via navigation state or query params)
- Consistent "Back" actions

### FR-05 UX & Accessibility
- Loading skeletons on all three pages
- Clear empty states with CTAs
- ARIA labels on tables and interactive elements
- Keyboard navigation for primary actions

## 5. Non-Functional Requirements

- NFR-01: Pages remain responsive with ≥5,000 GL entries
- NFR-02: No new heavy dependencies
- NFR-03: All new/modified code covered by tests
- NFR-04: Pass tsc, lint (0 warnings), build, hygiene, targeted tests

## 6. Data & Integration

- Reuse `useGLStore.generateTrialBalance()` and `analyzeAccount()`
- Optionally leverage `glTrialBalanceStore` for advanced TB features
- All navigation uses existing React Router patterns

## 7. Acceptance Criteria

See Section 012 README.md for full list.

## 8. Risks

- Performance on very large datasets (mitigated by pagination + memoization)
- Maintaining running balance accuracy (will be computed client-side from filtered entries)

## 9. Success Definition

After Section 012, a user can:
1. Import GL
2. See balanced Trial Balance instantly
3. Drill to journals for any account
4. View rich monthly trend + running balance analysis
5. All with consistent, fast UX

This PRD is approved.
