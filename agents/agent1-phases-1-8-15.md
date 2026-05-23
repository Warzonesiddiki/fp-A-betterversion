# Agent 1 (Calculator): Remaining Tasks

## YOUR FILES ONLY
- `src/pages/consolidation/` — REWRITE (current pages are A5 stubs, need full entity CRUD)
- `src/index.css` — EDIT (dark/light fixes only, this is your SOLE responsibility)
- `reports/agent1-performance.md`, `reports/agent1-complete.md` — CREATE

## DO NOT TOUCH
`src/App.tsx`, `src/utils/`, `src/components/ui/`, `src/pages/` (except consolidation), `src-tauri/`, `src/store/` (already done)

---

## AUDIT FINDING: Phase 1 (Mock Data Strip) — ✅ COMPLETE
All 10 stores have been stripped of mock data. No further action needed.

## AUDIT FINDING: Phase 8 (Multi-Entity Pages) — ❌ REWRITE REQUIRED
A5 wrote simple stub versions of ConsolidationDashboard, OwnershipTreePage, ICEliminationPage. They show basic GL summaries from useGLStore but do NOT have:
- Full entity CRUD (add/edit/delete entities with local state)
- Ownership tree visualization
- Intercompany elimination auto-matching
- ConsolidationEngine integration

### File: src/pages/consolidation/ConsolidationDashboard.tsx (REWRITE)
Replace A5's simple GL summary with:
1. Entity CRUD table at top: Name, Code, Currency, Country, Parent, Ownership %, Actions
2. Local state: `useState<Entity[]>([])` 
3. Add Modal with validation: name required 2+ chars, code 3-8 chars unique, circular parent check, ownership 0-100
4. Delete blocked if entity has children (show error)
5. Consolidated P&L below the table using ConsolidationEngine
6. Account | Entity A | Entity B | Eliminations | Consolidated table layout
7. Period selector with 12 months
8. **4 states**: Loading skeleton → Empty "No entities defined yet" + Add button → Error "Failed to load" + retry → Data table + P&L

### File: src/pages/consolidation/OwnershipTreePage.tsx (REWRITE)
Replace A5's simple stub with:
1. Recursive EntityNode component (inline, no external lib)
2. Color-coded: blue=root, green=has children, yellow=leaf
3. Shows entity name, code, currency, ownership %
4. Empty state: link to consolidation page

### File: src/pages/consolidation/ICEliminationPage.tsx (REWRITE)
Replace A5's simple stub with:
1. Table: From Entity | To Entity | Account | Amount In | Amount Out | Status | Action
2. Auto-match algorithm comparing pairs by from/to entity and amount
3. Status: Matched (green) / Unmatched (red)
4. Empty: "No intercompany transactions to match."

---

## Phase 15a: Dark/Light Audit (1 hr)
Check THESE 5 pages for hardcoded colors WITHOUT dark: prefix:
1. `src/pages/DashboardPage.tsx`
2. `src/pages/budgets/BudgetListPage.tsx`
3. `src/pages/reports/ProfitLossPage.tsx`
4. `src/pages/settings/SettingsPage.tsx`
5. `src/pages/data/DataImportPage.tsx`

**Search for:** `bg-white`, `text-black`, `text-slate-900`, `border-gray-200`
**Fix:** Replace with CSS variables: `var(--bg-surface)`, `var(--text-primary)`, `var(--border-subtle)`

**NOTE:** SettingsPage.tsx currently has BROKEN HelpPanel imports from A4. When fixing its colors, also remove these lines:
```
Line 5: import { HelpPanel } from '@/components/ui/HelpPanel';
Line 6: import { PAGE_HELP } from '../_docs';
Lines 97-101: <HelpPanel ... />
```

## Phase 15c: Performance Check (report only)
Create `reports/agent1-performance.md` with these results:
- 100K rows in DataGrid: smooth/janky
- Import 10K rows via FileDropZone: X seconds
- PDF export 500 rows: X seconds

## Quality Gate
`npm run build` passes. Consolidation pages work end-to-end. Dark/light audit completed.
Write `reports/agent1-complete.md`.
