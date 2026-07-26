# Step 05 — UX Design: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012

## 1. Current Pain Points

- Trial Balance is a static table with no actions
- Journals has filters but no account-level actions
- Explorer is a dead-end list
- Account Analysis is only reachable via Settings-like select (isolated)
- No visual "running balance" or trend context

## 2. Target Experience

### Trial Balance Page
- Top status banner: "Balanced" (green) or "Off by $X" (red)
- Table rows are clickable (hover lift + pointer)
- On click row → two quick actions:
  - "View in Journals" (navigates with filters pre-applied)
  - "Analyze Account" (opens Account Analysis with account pre-selected)
- Refresh + Export remain prominent

### Journals Page
- Filters stay powerful
- Every row has an "Analyze" icon/button next to Account
- Clicking Analyze → Account Analysis page (account pre-selected)
- "View full account history" link

### Account Analysis Page (enhanced Explorer)
- Prominent account selector (or pre-filled from navigation)
- KPI cards row (Debits, Credits, Net, Tx Count, Avg/Month)
- **Monthly Trend** section: horizontal bars (green/red) + values
- **Running Balance** table below trend:
  - Month | Debits | Credits | Net | Running Balance
- "View Journals for this account" button (pre-filters Journals)
- Breadcrumb / back links: "← Back to Trial Balance"

## 3. Consistent Patterns Across Pages

- Same empty state component (icon + message + primary CTA)
- Same loading skeleton pattern
- Same table caption + aria-label discipline
- Same toast usage for actions

## 4. Accessibility

- All interactive rows have proper role and keyboard support (Enter/Space)
- Filter controls have associated labels
- Color is never the only indicator (icons + text used)

## 5. Mobile / Responsive

- Tables become horizontally scrollable
- KPI cards wrap nicely
- Action buttons stack on small screens

## 6. States

| State | Trial Balance | Journals | Account Analysis |
|-------|---------------|----------|------------------|
| No data | Big empty with "Import" CTA | Same | "Import data first" |
| Loading | Skeleton table | Skeleton rows | Skeleton cards + bars |
| Error | Error banner + retry | Same | Same |
| Success with data | Full interactive table | Full filtered list | Full KPIs + trend + table |

## 7. Navigation Model (Simple)

- TB row click → Account Analysis (default) or Journals (secondary action)
- From Analysis → "View in Journals"
- From Journals → "Analyze Account"

This UX design is approved for implementation.
