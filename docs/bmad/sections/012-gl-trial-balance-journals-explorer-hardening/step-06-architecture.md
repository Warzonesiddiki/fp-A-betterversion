# Step 06 — Architecture: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Date:** 2026-07-26

## 1. High-Level Architecture

```
GL Data Flow (Hardened)

Import (GLUpload / glStore.importGLData)
          │
          ▼
   useGLStore.setEntries / addEntries
          │
          ▼
   generateTrialBalance()  ← called automatically or on demand
          │
          ├──────▶ GLTrialBalancePage  (interactive rows)
          │              │
          │              ├─ "View in Journals" → GLJournalsPage (pre-filtered)
          │              └─ "Analyze Account" → GLAccountAnalysisPage (pre-selected)
          │
          ▼
   GLJournalsPage
          │
          └─ "Analyze" per row → GLAccountAnalysisPage
                    │
                    ▼
             Account Analysis
             - KPIs
             - Monthly Trend (bars)
             - Running Balance Table
             - "View Journals" back-link
```

## 2. Key Components & Responsibilities

### Stores
- `useGLStore` (existing)
  - `entries`, `accounts`, `trialBalance`, `accountAnalysis`
  - `generateTrialBalance()`
  - `analyzeAccount(accountId)`
  - `importGLData(...)`

- `useGLTrialBalanceStore` (existing, can be leveraged for advanced TB UI)
  - Sorting, filtering, pagination for TB view

### Pages (to be hardened)
1. `GLTrialBalancePage.tsx`
2. `GLJournalsPage.tsx`
3. `GLExplorerPage.tsx` (can become thin wrapper or redirect to analysis)
4. `GLAccountAnalysisPage.tsx` (primary analysis surface)

### New / Enhanced Helpers (in glStore or utils)
- `getRunningBalance(entries, accountId)` → array of {month, runningNet}
- `getAccountMonthlyTrend(...)` (already partially exists)
- Navigation helpers or use of `useNavigate` + state

## 3. Data Flow for Account Analysis + Running Balance

1. User selects or navigates with `accountId`
2. `analyzeAccount(accountId)` is called (existing)
3. Additionally compute running balance:
   ```ts
   const running = [];
   let balance = 0;
   for (const m of monthly) {
     balance += m.net;
     running.push({ ...m, runningBalance: balance });
   }
   ```
4. Store or derive in component (prefer derivation for simplicity)

## 4. Navigation Strategy

- Use `navigate('/data/gl-journals', { state: { accountId, ...filters } })`
- Or query params: `?account=1000&start=2026-01-01`
- On mount of target page, read state/params and apply filters

## 5. Performance Considerations

- Memoize filtered lists (already done in pages)
- Keep pagination client-side for now (5k–10k rows is acceptable)
- For very large sets later: virtualized tables or move filtering to worker

## 6. State Management

- Primary source of truth remains `glStore`
- Local UI state for filters/pagination on each page (current pattern)
- `glTrialBalanceStore` can be optionally wired into TB page for richer controls

## 7. Error & Loading Strategy

- `isLoading` from store for generation/analysis
- Local pending states for filter changes (useTransition already used in Journals)

## 8. Testing Architecture

- Unit: `generateTrialBalance`, `analyzeAccount`, new running balance helper
- Component: render + interaction for the three main pages
- Integration smoke: import → TB → click analyze → see trend + running balance

## 9. Risks & Mitigations (Architecture Level)

- Duplicate account analysis logic → centralize computation in store or a small `glAnalysis.ts` util
- Navigation state loss on refresh → use URL params for critical filters where possible

This architecture is approved.
