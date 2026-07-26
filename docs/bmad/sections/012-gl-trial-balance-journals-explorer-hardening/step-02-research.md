# Step 02 — Research: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Date:** 2026-07-26

## Existing Implementation Audit

### 1. Trial Balance
- `src/pages/data/GLTrialBalancePage.tsx`
  - Uses `useGLStore` (`entries`, `trialBalance`, `generateTrialBalance`)
  - Auto-generates on mount when entries exist
  - Shows balance check + full table with Beginning / Debit / Credit / Net / Ending
  - Has Refresh + simple CSV export
  - Good empty states

### 2. Journals
- `src/pages/data/GLJournalsPage.tsx`
  - Date range, account filter (single), search, pagination (50 rows)
  - Export CSV
  - Good UX for moderate data

### 3. Explorer / Account Analysis
- `src/pages/data/GLExplorerPage.tsx`
  - Very basic list (hard-capped at 200 rows)
  - Search + crude type filter
- `src/pages/data/GLAccountAnalysisPage.tsx`
  - Select account → shows stats + monthly trend (text bars) + breakdown table
  - Already has decent monthly analysis logic
- `src/store/glStore.ts`
  - `generateTrialBalance()`
  - `analyzeAccount(accountId)` → populates `accountAnalysis`
- `src/store/glTrialBalanceStore.ts`
  - Separate store with sorting/filtering/pagination (not fully wired into the main pages yet)

### 4. Supporting
- `src/components/data/GLTrialBalanceGrid.tsx` exists
- GL store has `accountAnalysis`, `analyzeAccount`
- Types include `TrialBalanceRow`, `AccountAnalysis`

## Gaps Identified

| Area | Current | Needed for Hardening |
|------|---------|----------------------|
| Trial Balance links | None | Click row → filtered Journals + Account Analysis |
| Journals performance | 50-row client pagination | Better handling for 5k+ rows; virtual or server-like |
| Explorer | Dumb list | Turn into or link to real Account Analysis |
| Account Analysis | Isolated select | Deep links from TB/Journals/Explorer |
| Running balance | Not shown | Add running balance column + sparkline |
| Cross navigation | Poor | Consistent "Analyze", "View Journals", back links |
| UX consistency | Varies | Loading, empty, error states standardized |
| Tests | Basic | Strong coverage of generate + analysis + navigation |

## Research Conclusions

- Core logic (`generateTrialBalance`, `analyzeAccount`) is already present and solid.
- `glTrialBalanceStore` provides advanced TB features that can be leveraged.
- Account Analysis page already computes monthly + net — needs wiring + running balance enhancement.
- Explorer page is the weakest link — should be evolved or made a gateway to analysis.

## Recommended Approach for Section 012

1. Enhance `GLTrialBalancePage` with actionable links.
2. Improve `GLJournalsPage` filters + add "Analyze Account" action.
3. Upgrade `GLExplorerPage` or route it to drive `GLAccountAnalysisPage`.
4. Add running balance calculation in analysis (client-side or store helper).
5. Add deep-link support (query params or navigation state).
6. Add/update tests for the flow.

## Next Steps

Proceed to **Step 03 — Product Brief**.
