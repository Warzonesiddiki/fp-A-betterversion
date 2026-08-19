---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-19
verified_by: arena-agent/session-026
confidence: high
---

# TASKS/NOW — the single current critical path

**T-027 · session-026 wave pair done; open the PR, then take the next pair.**

State: PR #66 **MERGED** into `main` @ `ec7a66a`. This session branched from it and landed
the T-026 pair: money-AST 397 → **390** (`BalanceSheetPage` 7→0, plus the K18 fix that
closes current-period earnings into equity) and fabrication 16 → **13**
(`InsuranceDashboardPage` 3→0, now derived from the real `InsuranceEngine`). Per-file
`--json` diffs confined to exactly one file each; teeth verified (21 assertions fail on a
two-page revert; 8 more on a one-line equity revert).

Do this in order:

1. Push this branch and open the PR against `main`. `gh pr checks <n>` — merge ONLY when
   `test-unit` passes. Never merge red. Full suite before the PR, always.
2. `node scripts/money-ast-detector.mjs --list` — next ranked module.
   **Skip `src/services/mockData/*`** (fixture factories: `index.ts` 13,
   `generators.ts` 7, `glData.ts` 5). Real candidates: `LeaseEngine` (7),
   `LeaseDetailPage` (7), `SankeyChart` (6, check it is not layout geometry),
   `WorkingCapitalPage` (6), `HealthcareDashboardPage` (6), `CashFlowPage` (6),
   `StoreDashboardPage` (6), `DeferredSchedulePage` (6), `ARRDashboard` (6).
3. **Class-wide candidate, still open.** The grouping idiom `existing.debit += e.debit`
   recurs in 16 non-test files — one fix pattern moves several toward the ≥90% gate:
   `pages/charts/ChartOfAccountsPage`, `pages/collaboration/{ActivityFeed,SharedReports,TeamWorkspace}`,
   `pages/consolidation/ConsolidationPage`, `pages/education/EducationPage`,
   `pages/energy/EnergySectorPage`, `pages/esg/ESGPage`, `pages/government/GovernmentPage`,
   `pages/healthcare/HealthcarePage`, `pages/insurance/InsurancePage`,
   `pages/lease/LeaseAccountingPage`, `pages/logistics/LogisticsPage`,
   `pages/manufacturing/ManufacturingPage`, `pages/saas/SaaSPage`,
   `pages/telecom/TelecomPage`, `services/mockData/glData.ts` (skip the last).
4. Fabrication worklist (worst first): `src/pages/reports/BoardPackPage.tsx` (3), then the
   twos — `energy/EmissionsTradingPage`, `energy/EnergyDashboardPage`,
   `insurance/ClaimsAnalyticsPage`, `realestate/FacilityManagementPage` — then the ones,
   `energy/RenewableEnergyPage` and `components/ui/ICReconciliationReport`.
   Check BOTH `src/pages/sector/` and `src/pages/sectors/` twins first, grep each page for
   its store, and read the store's persist seeds before rewriting.

Ratchets: money **390** / 158 modules / 82.13%; fabrication **13** / 7 files. Both
baselines updated in session 026. CHB-008 acknowledges gate 10's fresh-branch squash flags.

**Carried debt found this session (not yet fixed):** `src/pages/sector/InsuranceDashboardPage.tsx`
(routed at `/sector/insurance`) derives "revenue" as `entries.filter(e => e.credit > e.debit)`
and "claims" from `accountName.toLowerCase().includes('claim')` — a per-entry sign filter and
a free-text account-name match, neither of which is a chart-of-accounts rule. Neither detector
flags it. Queue it as a money/semantics fix, not a fabrication one.

**Standing rules (do not drop):** run the FULL suite before opening a PR; after any page
rewrite also run `src/pages/smoke*.test.tsx`, `src/pages/__tests__/**` for that area, and
`src/theme/buttonContrast.contract.test.ts`. Run both detectors on every file you WRITE.
Verify teeth via /tmp revert. `npx prettier --write` before `git add` on generated JSON/MD.
Push via `start_process` (pre-push exceeds the bash timeout).
