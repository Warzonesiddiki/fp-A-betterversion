# Step 07 — Epics & Stories: GL Trial Balance, Journals and Explorer Hardening

**Section:** 012

## Epic 012: GL Trial Balance / Journals / Explorer Hardening

**Goal:** Deliver a complete, interconnected, production-grade GL exploration experience.

### Story 012-01 — Trial Balance Polish + Navigation
**As** a user  
**I want** the Trial Balance to be clearly balanced or show the exact difference, and clicking a row to take me to journals or account analysis  
**So that** I can trust the data and investigate immediately.

**AC:**
- Status banner shows Balanced / Off-by-X with color
- Rows are clickable with hover affordance
- "View in Journals" and "Analyze Account" actions
- Export includes all visible columns

### Story 012-02 — Journals Enhancements
**As** a user reviewing journals  
**I want** strong filters, fast pagination, and direct access to account analysis  
**So that** I can efficiently explore large datasets.

**AC:**
- Date + account + search filters work together
- "Analyze" action on every journal row
- Pagination controls clear and performant
- Export respects current filter set

### Story 012-03 — Account Analysis Hardening (Monthly Trend + Running Balance)
**As** an analyst  
**I want** rich monthly trend visualization and a running balance view for any account  
**So that** I understand movement and position over time.

**AC:**
- KPI cards (Debits, Credits, Net, Tx Count, Avg)
- Monthly trend with positive/negative bars
- Running balance table (cumulative)
- Can be reached from TB and Journals

### Story 012-04 — Cross-Page Navigation & State
**As** a user  
**I want** to move seamlessly between Trial Balance, Journals, and Account Analysis  
**So that** exploration feels connected.

**AC:**
- Deep links from TB → Journals (pre-filtered)
- Deep links from TB/Journals → Account Analysis (pre-selected)
- "View Journals for this account" from Analysis
- Reasonable filter preservation

### Story 012-05 — Consistent UX & Accessibility
**As** any user  
**I want** the same high-quality empty/loading/error states across all three GL pages  
**So that** the experience feels polished.

**AC:**
- Standardized empty states with CTAs
- Loading skeletons
- Proper ARIA on tables and controls
- Keyboard support for primary actions

### Story 012-06 — Tests & Validation
**As** the team  
**I want** solid automated coverage of the hardened GL flow  
**So that** regressions are caught early.

**AC:**
- New or updated tests for:
  - Trial balance generation + balance check
  - Account analysis (trend + running balance)
  - Navigation flows (component level)
- Targeted test suite run passes

## Priority Order

1. 012-01 (TB as foundation)
2. 012-03 (Account Analysis value)
3. 012-02 + 012-04 (navigation glue)
4. 012-05 (polish)
5. 012-06 (tests)

All stories must be complete before marking the section COMPLETE.
