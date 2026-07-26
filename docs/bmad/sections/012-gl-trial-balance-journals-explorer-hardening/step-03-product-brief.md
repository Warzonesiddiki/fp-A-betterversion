# Step 03 — Product Brief: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Date:** 2026-07-26

## 1. Problem

The core General Ledger workflow in FinPlan Pro is functional after import but not production-hardened:

- Trial Balance generates but lacks deep navigation to journals or account analysis.
- Journals page provides filtering but is limited for large datasets and lacks account drill-down.
- GL Explorer is a basic capped list; Account Analysis exists in isolation.
- No consistent "analyze this account" experience across TB → Journals → Explorer.
- Running balance and monthly trend views are incomplete or missing in context.
- UX inconsistencies (loading/empty states) reduce trust for FP&A users.

This is the final critical piece of P1-A "General Ledger Workflow".

## 2. Opportunity

Hardening these three interconnected views (Trial Balance, Journals, Explorer/Analysis) delivers the first truly usable end-to-end GL experience:

- Import → instantly see balanced Trial Balance
- Click any account → see journals filtered + rich account analysis (trend + running balance)
- Fast, reliable exploration even with thousands of entries

This directly enables downstream financial statements, variance analysis, and board reporting.

## 3. Target Users

- FP&A analysts importing and reviewing GL data daily
- Controllers reconciling trial balances
- Finance managers drilling from summary to detail accounts
- Users preparing budgets/forecasts from actuals

## 4. Success Metrics (for this section)

- 100% of imported GL data produces a correct, balanced Trial Balance
- Account Analysis shows monthly trend + running balance for any account
- Navigation between TB → Journals → Account Analysis works in < 2 clicks
- Pages handle 5,000+ entries without noticeable lag in filters/pagination
- All three pages have consistent, accessible empty/loading states
- Targeted tests for the flow pass

## 5. Non-Goals (this section)

- Full Profit & Loss / Balance Sheet / Cash Flow statements (future section)
- Board pack PDF generation
- Multi-entity consolidation or FX
- E2E Playwright automation for this flow (document for later)
- Real-time collaboration on GL

## 6. Key User Stories

**US-012-01**  
As an analyst, after importing GL data I want the Trial Balance to auto-generate and clearly show whether it is balanced, so I can immediately trust the data.

**US-012-02**  
As a user viewing the Trial Balance, I want to click any account row and jump to filtered journals + account analysis, so I can investigate quickly.

**US-012-03**  
As a user on the Journals page, I want powerful date/account/search filters + pagination that performs well at scale, plus the ability to drill into any account's analysis.

**US-012-04**  
As a user, when I select an account in Explorer or from TB/Journals, I want to see monthly trend bars + a running balance table, so I understand movement over time.

**US-012-05**  
As any user, I expect consistent empty states, loading indicators, and error handling across the GL data pages.

## 7. Constraints

- Must work with existing `glStore` + `generateTrialBalance` / `analyzeAccount`
- Must reuse current UI primitives (Card, Button, tables, lucide icons)
- Must not significantly increase bundle size
- Must pass all existing targeted storage/GL tests + new hardening tests

## 8. MVP Definition for Section 012

A hardened, interconnected GL exploration experience:
1. Reliable auto Trial Balance with balance indicator + export
2. Clickable accounts from TB → filtered Journals + Account Analysis
3. Journals with improved filters + account drill action
4. Account Analysis with monthly trend + running balance
5. Consistent UX across the three pages
6. Tests + gates green

## 9. Dependencies

- Prior sections 007–011 (import, persistence, storage migration)
- Existing `glStore`, `glTrialBalanceStore`, account analysis logic
- Current data pages and components

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large GL performance | Leverage existing chunked workers + client pagination + memoization |
| Chart/visual bloat | Use simple CSS bars + existing patterns (no new heavy chart lib) |
| Test flakiness | Focus on targeted GL tests; isolate from known audit failures |
| Navigation complexity | Use simple React Router state + URL params where needed |

## 11. Post-Section Value

Completes the foundational GL data loop, enabling:
- Variance analysis
- Budget vs Actual
- Financial statement generation (next major area)
- Real user confidence in the product

This brief is approved as the guiding document for Section 012.
