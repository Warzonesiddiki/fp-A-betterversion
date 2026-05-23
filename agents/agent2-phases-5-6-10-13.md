# Agent 2 (Designer): Remaining Tasks

## YOUR FILES ONLY
- `src/pages/reports/` all 5 reports — VERIFY (export buttons wired? 4-state rendering?)
- `src/index.css` — EDIT (your sole responsibility for a11y CSS)
- `src/components/ui/DataGrid.tsx` — VERIFY keyboard navigation
- `reports/accessibility-audit.md`, `reports/agent2-complete.md` — CREATE

## DO NOT TOUCH
`src/App.tsx`, `src/store/`, `src/utils/`, `src-tauri/`, `src/pages/` (except reports)

---

## AUDIT FINDING: Phase 5 (ExportEngine + Reports) — PARTIAL
ExportEngine.ts EXISTS and has exportToPDF/exportToExcel methods. 
Report pages (ProfitLoss, BalanceSheet, CashFlow, BudgetVsActual, BoardPack) were rewritten by A5 with full content.

### Task: Verify export buttons on all 5 report pages
Check each page has an Export button calling ExportEngine. If missing, add:
```typescript
import { ExportEngine } from '@/engines/ExportEngine';
```
And wire export buttons:
```typescript
<Button onClick={() => ExportEngine.exportToPDF({ headers: [...], rows: [...] }, { title: 'Report Name' })}>
  Export PDF
</Button>
```

### File: src/pages/reports/BoardPackPage.tsx — Verify multi-section layout
Should have: Cover (title + date), Exec Summary (4 KPIs), P&L, BS, CF, Top Variances.
A5 wrote a simplified version — if it's missing sections, add them.

---

## AUDIT FINDING: Phase 6 (Keyboard Navigation) — ✅ VERIFIED
DataGrid.tsx already has `handleKeyDown` with ExcelKeyboardEngine integration, `tabIndex={0}`, `onKeyDown` handler.
No action needed unless grid navigation is broken.

---

## AUDIT FINDING: Phase 10 (Sectors, 15 config files) — ✅ COMPLETE
16 files exist (15 sectors + agriculture). `sectors/index.ts` has proper registry.
No further action needed.

---

## Phase 13a: Accessibility Audit (1.5 hr)
### Already done (verify exists in src/index.css):
- `@media (prefers-reduced-motion: reduce)` — check it's at the end of index.css
- `@media (prefers-contrast: more)` — check it's at the end of index.css

### Add to ALL 5 report pages:
- Add `role="grid"` and `aria-label="Report data"` to data table containers
- Add `aria-label="Export PDF"` and `aria-label="Export Excel"` to export buttons

### Add to DataGrid.tsx:
- `role="grid"` and `aria-label="Data grid"` on the container div
- `aria-label` on sortable column headers
- Verify keyboard navigation: Tab into grid, Arrow keys move, Enter edits

### Run audit:
Open Chrome DevTools → Lighthouse → Accessibility on 3 pages:
1. DashboardPage
2. BudgetListPage
3. ProfitLossPage

## Quality Gate
`npm run build` passes. Export buttons work on all 5 reports. a11y audit report created.
Write `reports/agent2-complete.md` and `reports/accessibility-audit.md`.
