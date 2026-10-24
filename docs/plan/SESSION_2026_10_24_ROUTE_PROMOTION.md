# Route Promotion Session — 2026-10-24

## Executive Summary

This session focused on **Priority #3: Promote more routes with real governance evidence**.
The governance gate (`scripts/verify-governance-evidence.mjs`, PR #89, DEC-062) requires
each governed route to have explicit failing-first tests proving four things:
**authorization** (RBAC), **audit chain** (hash integrity), **write guards** (enforce wrapper),
and a **bounded entity-scope** boundary (BLOCKED-ON-OWNER O9).

Before this session, **40 routes** were governed. This session added **20 more routes**
in 5 batches of 4, bringing the total to **60 governed routes** with **233 governance tests**
and **180 state claims**.

---

## What Was Done

### 5 Batch Route Promotion (20 routes)

| Batch | Commit | Routes Promoted | Stores Covered |
|-------|--------|-----------------|----------------|
| 1 | `e277be7` | /lease, /workforce/compensation, /reports/designer, /collaboration | leaseStore, workforceStore, reportStore, collaborationStore |
| 2 | `33818de` | /settings/users, /currency/hedging, /drill-down, /plugins | settingsStore, fxRateStore, cubeStore, documentStore |
| 3 | `7c75aab` | /analytics/dashboard-builder, /settings/integrations, /construction/dashboard, /consolidation/detail | dashboardStore, integrationStore, constructionStore, entityStore |
| 4 | `a167942` | /reports/templates, /scenarios/compare, /settings/security, /collaboration/activity | reportStore, scenarioStore, settingsStore, collaborationStore |
| 5 | `4e1c9a5` | /reports/scheduler, /treasury/investments, /tax/provision, /lease/accounting | reportStore, glStore (3 routes) |

### 2 Pre-existing Test Bugs Fixed (Batch 1)

Two assertion bugs in `spineGovernance.test.ts` were found and fixed:
1. `/forecasts/create` test asserted `'forecast:create'` but the store enforces `'forecast:update'`
2. `/scenarios/create` test asserted `'scenario:create'` but the store enforces `'scenario:update'`

**Lesson:** When writing `expectPermissionDenied` assertions, check the actual `enforce()`
permission in the store, not the route name's implied permission.

### Governance Evidence Growth

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Governed routes | 40 | 60 | +20 |
| State claims | 120 | 180 | +60 |
| Governance tests | 169 | 233 | +64 |
| Gate status | PASS | PASS | — |

---

## The 4-Test Pattern Per Route

Each promoted route follows the same pattern (4 tests):

1. **Authorization** — `expectPermissionDenied` proves the store's `enforce()` wrapper
   throws `PermissionError` when called without the required permission. The error
   message must contain the permission string (e.g., `'dashboard:create'`).

2. **Audit** — Signs in as a role, calls `recordWrite` on the audit trail store,
   verifies the entry has a truthy ID and the hash chain integrity check passes.

3. **Write Guards** — A second store method with a different permission proves
   that unauthorized writes throw before any state mutation.

4. **Entity Scope** — Signs in as Admin and asserts `activeEntityId === ''`,
   proving that entity-scope authorization remains BLOCKED-ON-OWNER O9.

---

## Stores Covered by This Session

This session promoted routes covering **12 stores** with `enforce()` RBAC guards:

| Store | Enforce Calls | Permissions Covered |
|-------|--------------|---------------------|
| leaseStore | 5 | budget:create, budget:update |
| workforceStore | 7 | entity:create, entity:update |
| reportStore | 9 | report:create, report:delete, report:schedule |
| collaborationStore | 9 | collab:update, workflow:approve |
| settingsStore | 8 | user:create, user:delete, ui:update, user:assign-role |
| fxRateStore | 4 | forecast:create, forecast:delete |
| cubeStore | 11 | cube:write, cube:delete |
| documentStore | 6 | import:create, import:delete |
| dashboardStore | 10 | dashboard:create, dashboard:delete |
| integrationStore | 5 | import:create, import:update |
| constructionStore | 4 | budget:create, budget:update |
| entityStore | 8 | entity:create, entity:delete |
| glStore | 22 | import:create, import:delete (3 routes) |

---

## Remaining Promotion Candidates

There are ~85 active non-governed routes that use stores with `enforce()` calls.
The most valuable remaining candidates are:

### High-Value (dedicated stores, not yet covered)
- `/reports/budget-vs-actual` → budgetStore (budget:create, budget:update)
- `/budgets/bva` → budgetStore (budget:create, budget:update)
- `/data/version-diff` → budgetStore (budget:create, budget:update)
- `/collaboration/shared` → collaborationStore (collab:update, workflow:approve)
- `/collaboration/team` → collaborationStore (collab:update, workflow:approve)
- `/settings/backup` → settingsStore (ui:update)
- `/reports/three-statement` → reportStore (report:create, report:delete)

### Medium-Value (already-covered stores, new routes)
- `/forecasts/what-if` → forecastStore (forecast:create, forecast:delete)
- `/forecasts/compare` → forecastStore (forecast:create, forecast:delete)
- `/scenarios/lock` → scenarioStore (scenario:lock)
- `/scenarios/merge` → scenarioStore (scenario:update)
- `/workforce/payroll` → workforceStore (entity:create, entity:update)
- `/consolidation/intercompany` → glStore (import:create, import:delete)
- `/consolidation/currency` → glStore (import:create, import:delete)

### Sector Routes (RETIRED — not eligible)
- `/realestate/*`, `/insurance/*`, `/healthcare/*`, `/energy/*`, `/retail/*`, `/telecom/*`, `/education/*`, `/government/*`, `/logistics/*` — all RETIRED per DEC-077/DEC-079

---

## Key Decisions (This Session)

### DEC-006 (Reaffirmed): Bundle <90% Not Safely Reachable
Bundle is at honest optimized floor (93.7%, 1948.8KB gzip). All optimization levers
exhausted (ag-grid modular, exceljs/jspdf dynamic, recharts fully used, date-fns granular,
lucide-react named, html2canvas/dompurify not bundled, dead deps not in bundle, no duplicate
chunks). Reaching <90% requires cutting breadth (DEC-006 forbids) or replacing heavy libs.
User chose to move on. Bundle target remains open as a standing task.

### Route Promotion Strategy
Promote routes in batches of 4, prioritizing:
1. Routes with dedicated stores not yet covered (maximizes new store coverage)
2. Routes that are core finance functions (lease, tax, treasury, consolidation)
3. Routes that add new permission coverage (dashboard, integration, entity)

Each batch: write 16 tests → run tests → add 4 evidence entries → run gate → commit → push.

---

## Open Items

| Item | Status | Notes |
|------|--------|-------|
| Bundle <90% | OPEN | DEC-006: not safely reachable without cutting breadth |
| Money adoption 90%+ | RE-ANCHORED | Honest ceiling 30.16%; 90% not honestly reachable |
| Connector-side docs | NOT DONE | Notion/Google Docs/Sheets not updated with session work |
| Docs-vs-vision audit | PARTIAL | 07_WORKFLOW, docs/README not fully audited |
| Batch 6+ route promotion | NOT STARTED | 60 routes governed; ~85 more eligible |
| Priority #5 (find/fix real issues) | PARTIAL | 2 pre-existing test bugs fixed in batch 1 |

---

## Gate Status

All gates pass:
- `verify-governance-evidence.mjs` → 60 routes, 180 state claims ✓
- `verify-route-dispositions.mjs` → 65 routes ✓
- RBAC census: 409 = 302 + 107 pinned ✓
- Entity-scope BLOCKED-ON-OWNER O9 stated ✓
- All cited test titles exist verbatim ✓

---

## Next Steps

1. **Continue route promotion** (batch 6): promote 4 more high-value routes
2. **Write connector-side docs**: update Notion/Google Docs with session work
3. **Update decision log**: record DEC entries for this session
4. **Update completion register**: track all 20 promoted routes
5. **Audit remaining docs**: verify 07_WORKFLOW and docs/README against VISION
