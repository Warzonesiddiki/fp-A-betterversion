---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-20
verified_by: arena-agent/session-027
confidence: high
---

# TASKS/NOW — the single current critical path

**T-028 · session-027 wave pair done; push + PR, then the next pair.**

State: PR #67 is already on `main` @ `8ea4c2f`. This session landed money-AST 390 → **376**
(`LeaseEngine` 7→0, `LeaseDetailPage` 7→0) and fabrication 13 → **10** (`BoardPackPage`
3→0). Full suite 1257 / 14,373 / 1 skipped / 0 failed.

Do this in order:

1. Push this branch and open the PR against `main`. Merge ONLY when `test-unit` passes.
2. `node scripts/money-ast-detector.mjs --list` — next ranked module.
   **Skip `src/services/mockData/*`**. Candidates: `SankeyChart` (6 — confirm not layout),
   `WorkingCapitalPage` (6), `HealthcareDashboardPage` (6), `CashFlowPage` (6),
   `StoreDashboardPage` (6), `DeferredSchedulePage` (6), `ARRDashboard` (6).
3. **Class-wide candidate, still open.** `existing.debit += e.debit` in 16 non-test files
   (enumerated previous NOW). Skip `glData.ts`.
4. Fabrication worklist: twos — `energy/EmissionsTradingPage`, `energy/EnergyDashboardPage`,
   `insurance/ClaimsAnalyticsPage`, `realestate/FacilityManagementPage` — then
   `energy/RenewableEnergyPage` and `components/ui/ICReconciliationReport`.

Ratchets: money **376** / 156 modules / 82.39%; fabrication **10** / 6 files.

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
