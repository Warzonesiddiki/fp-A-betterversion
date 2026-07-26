# Step 01 — Brainstorming: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Date:** 2026-07-26

## Problem Statement

The GL data workflow (import → trial balance → journals → explorer) is functional but not hardened for production use:

- Trial Balance works but lacks deep links and polished UX.
- Journals is usable but struggles with scale and lacks account analysis integration.
- Explorer is a limited list view, not a true analysis tool.
- No consistent account drill-down experience.
- Missing running balance + trend views critical for FP&A.

This is the last major piece of P1-A "General Ledger Workflow".

## Brainstorming Areas

### 1. Trial Balance Hardening
- Ensure auto-generation is reliable and idempotent.
- Add account row click → open filtered Journals + Account Analysis.
- Improve balance indicator and diff display.
- Add "Reconcile" quick actions.

### 2. Journals Hardening
- Performance for 5k–20k rows (virtualization or better pagination + worker).
- Better account multi-select or quick filter.
- Click account code → Account Analysis page with pre-filter.
- Running totals per page or overall.
- Export enhancements (include filters in filename).

### 3. Explorer → Full Account Analysis
- Rename/enhance GLExplorer into a true explorer with account focus.
- For selected account:
  - Monthly trend (bar or line)
  - Running balance table + chart
  - Period breakdown
  - Links back to journals for specific periods
- Integrate with existing `GLAccountAnalysisPage.tsx`

### 4. Cross-Navigation & UX Consistency
- Consistent empty states, loading skeletons, error handling.
- "Back to Trial Balance", "View in Journals", "Analyze Account" actions.
- Keyboard accessibility for tables.
- URL state for filters (shareable links).

### 5. Data & Store Considerations
- Leverage existing `glStore` + `generateTrialBalance`.
- Consider adding `getAccountAnalysis(accountId, range)` helper.
- Ensure large imports don't freeze UI (use existing workers).

### 6. Testing Strategy
- Unit tests for trial balance generation edge cases.
- Component tests for the three pages.
- Integration smoke: import → TB → journals filter → account analysis.
- Performance smoke for large datasets.

### 7. Out of Scope for this Section
- Full financial statements
- PDF exports / board packs
- Multi-currency
- E2E Playwright (document for later)

## Decisions Made

- Primary focus: Make the three pages (TB, Journals, Explorer/Analysis) feel complete and interconnected.
- Prioritize account analysis as the "killer feature" of this section.
- Reuse existing components (Card, Button, Badge, tables).
- Keep bundle impact minimal.

## Risks

- Large dataset performance
- Chart library consistency
- Pre-existing test flakiness

## Next

Proceed to **Step 02 — Research** (existing stores, components, test patterns, account analysis page).
