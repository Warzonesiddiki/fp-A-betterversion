# Step 09 — Create Story: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012  
**Date:** 2026-07-26

## Implementation Focus

This step begins the actual code delivery for the core stories.

### Primary Changes Planned in This Batch

1. **Add running balance computation**
   - New helper in `src/store/glStore.ts` or a small util: `computeRunningBalance(entries, accountId)`

2. **Harden GLTrialBalancePage**
   - Make rows clickable
   - Add "View in Journals" and "Analyze Account" actions using `useNavigate`
   - Improve status banner

3. **Enhance GLAccountAnalysisPage**
   - Compute and display running balance table
   - Improve monthly trend presentation
   - Support being opened with pre-selected account via navigation state

4. **Enhance GLJournalsPage**
   - Add "Analyze" button per row
   - Accept and apply navigation state for account filter

5. **Minor wiring**
   - Update types if needed
   - Ensure analyzeAccount is robust

### Files Expected to Change

- `src/store/glStore.ts` (helper + minor enhancements)
- `src/pages/data/GLTrialBalancePage.tsx`
- `src/pages/data/GLJournalsPage.tsx`
- `src/pages/data/GLAccountAnalysisPage.tsx`
- Possibly `src/pages/data/GLExplorerPage.tsx` (make it route to analysis)
- New/updated tests

### Gates After Every Batch

- tsc
- lint --max-warnings=0
- build
- repo:hygiene
- Targeted GL-related tests

Implementation begins now.
