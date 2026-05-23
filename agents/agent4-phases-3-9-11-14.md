# Agent 4 (Architect): Remaining Tasks — FIX YOUR MISTAKES FIRST

## YOUR FILES ONLY
- `src/pages/settings/SettingsPage.tsx` — FIX (broken imports from your Phase 14 template)
- `src/pages/_docs.ts` — FILL WITH CONTENT (currently empty)
- `src/pages/currency/` — REWRITE (A5 wrote stubs, need full FX CRUD)
- `src/pages/audit/AuditTrailPage.tsx` — VERIFY (A5 wrote this, check it's correct)
- `src/hooks/useFirstRun.ts` — VERIFY
- `reports/agent4-complete.md` — CREATE

## DO NOT TOUCH
`src/utils/`, `src/components/analytics/`, `src/store/`, `src-tauri/`, `src/pages/` (except settings, currency, audit)

---

## ❌ CRITICAL BUG: Phase 14 (Docs Injection) — BROKE SettingsPage.tsx
Your docs template injected `HelpPanel` and `PAGE_HELP` imports into ALL pages via a script. It left `SettingsPage.tsx` BROKEN:

### File: src/pages/settings/SettingsPage.tsx — REMOVE these 3 lines
```
Line 5: import { HelpPanel } from '@/components/ui/HelpPanel';
Line 6: import { PAGE_HELP } from '../_docs';
Lines 97-101: <HelpPanel title={...} sections={...} isOpen={...} onClose={...} />
```

After removing, this page must compile clean. Verify: `npm run build` succeeds.

### File: src/pages/_docs.ts — FILL WITH REAL CONTENT
Currently contains only `export const PAGE_HELP: Record<string, ...> = {};`
Replace with actual help content for at least 5 key pages:
```typescript
export const PAGE_HELP: Record<string, { title: string; sections: { title: string; content: string }[] }> = {
  '/data/gl-upload': {
    title: 'Importing GL Data',
    sections: [
      { title: 'Supported Formats', content: 'Upload CSV or Excel files (.csv, .xlsx, .xls) up to 50MB.' },
      { title: 'Required Columns', content: 'Your file must include at minimum: account code, date, and amount columns.' },
      { title: 'Auto-Mapping', content: 'Column headers are automatically matched. Review the mapping before importing.' },
    ],
  },
  '/budgets': {
    title: 'Working with Budgets',
    sections: [
      { title: 'Creating Budgets', content: 'Click "Create Budget" to start a 4-step wizard. Name your budget, select accounts, set monthly amounts.' },
      { title: 'Approval Workflow', content: 'Draft → Submit for Review → Approve/Reject. Only approved budgets appear in reports.' },
    ],
  },
  '/reports/profit-loss': {
    title: 'Profit & Loss Report',
    sections: [
      { title: 'How It Works', content: 'Revenue (4xxx accounts) minus COGS (5xxx) minus Expenses (6xxx) equals Net Income.' },
      { title: 'Period Selection', content: 'Use the month picker to select a reporting period.' },
    ],
  },
  '/': {
    title: 'Executive Dashboard',
    sections: [
      { title: 'KPIs', content: 'Key metrics are calculated from your GL data automatically.' },
      { title: 'Getting Started', content: 'Import data first, then create budgets to enable variance analysis.' },
    ],
  },
};
```

---

## Phase 9: FX/Currency Pages — ADD FULL CRUD TO EXISTING PAGES
A5 wrote basic stubs. You need to add real functionality:

### File: src/pages/currency/FXRatesPage.tsx
Replace the hardcoded rates array with a full CRUD table:
- Add rate form: From Currency, To Currency, Rate, Date
- State: `useState<ExchangeRate[]>(initialRates)`
- Validation: rate > 0, from !== to, no duplicate pairs
- Delete confirmation
- Empty: "No exchange rates configured. Add rates to enable multi-currency translation."

### File: src/pages/currency/HedgeManagementPage.tsx
Replace A5 stub with:
- Hedge table: ID, Instrument, Notional Amount, Rate, Maturity Date, Status
- Add/Edit form in Modal
- Status badges: Active/Expired/Settled
- Empty: "No hedging positions."

### File: src/pages/currency/TranslationResultPage.tsx
Replace A5 stub with:
- Table showing entries before/after translation
- Select source currency and target currency
- Computed translation gain/loss
- Empty: "No data to translate."

---

## Phase 11: Compliance/Audit (1 hr)
### File: src/pages/audit/AuditTrailPage.tsx — VERIFY
A5 wrote this with CellAuditTrailEngine integration. Check it has:
- [ ] Date range filter
- [ ] User filter
- [ ] Action filter
- [ ] Sort by timestamp/user
- [ ] Auto-refresh every 5 seconds
- [ ] 4 states: loading/empty/error/data
- [ ] Export button
If missing, add functionality.

---

## Quality Gate
`npm run build` passes. SettingsPage no longer has broken imports. _docs.ts has real content. 
FX pages have CRUD. Audit trail has live feed.
Write `reports/agent4-complete.md`.
