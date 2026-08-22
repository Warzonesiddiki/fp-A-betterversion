All evidence gathered. Here is the audit report.

---

# Audit: SectorDriverDashboard.tsx shared-model fabrication risk (W-FAB-002)

**Scope:** all 12 branches of `computeSectorDriverModel` (`src/pages/sector/SectorDriverDashboard.tsx`, 806 ln), both test files, routing (`SectorPage.tsx:69` renders this component for **every** sector), and the W-FAB-001 precedent (`InsuranceDashboardPage.tsx`). Read-only — nothing modified.

## Verdict

**66/66 sector KPI metrics are class C (FABRICATED). Zero A, zero B.** Every branch metric rests on at least one of: regex text bucketing (`textOf` L113–115), the `Math.abs` magnitude trick (`absEntryAmount` L117–124 takes max(|d−c|, |net|)), invented bases (L226–235), or pure driver-slider arithmetic with magic coefficients. The page compounds this with false disclosure: header claims _"KPIs are recomputed from imported GL entries"_ (L681–683), and a **"Data lineage"** card (L762–781) presents invented bases as account signals. Only the 3 headline cards explicitly labeled "Modeled" qualify as B.

## Per-sector table

All cites `SectorDriverDashboard.tsx` unless prefixed. Class: **C** = fabricated (regex bucket / abs-magnitude / invented constant / target-anchored), **B\*** = would be legitimate Disclosed-Scenario if moved to a labeled simulator panel.

| Branch (lines)                     | Metric                      | Class | Evidence                                                                                                                                      |
| ---------------------------------- | --------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **technology** (251–278)           | arr                         | C     | L252 `modeledRevenue×12` — arbitrary annualization of regex+abs revenue                                                                       |
|                                    | nrr                         | C     | L253–259 `100+growth−risk/2` — slider math, hardcoded 100 anchor                                                                              |
|                                    | churn                       | C     | L260–266 magic coefs 0.72 / 0.08                                                                                                              |
|                                    | quick_ratio                 | C     | L268–271 `(gF+eF)/max(rF×4,.01)` — no GL input at all                                                                                         |
|                                    | gross_margin                | C     | L267 + `modelledCogs` L582–584 magic 1.18/0.35 on regex+abs totals                                                                            |
| **manufacturing** (279–295)        | oee                         | C     | L280–284 availability=capacity%, performance=eff% — OEE factors are driver relabels, not telemetry                                            |
|                                    | scrap_rate                  | C     | L285 `risk×60`                                                                                                                                |
|                                    | inventory_turnover          | C     | L288–291 expenses ÷ `assetBase×0.22` (invented base × magic slice)                                                                            |
|                                    | unit_cost                   | C     | L292 expenses ÷ `productionBase` (=rev/100, L233–235)                                                                                         |
|                                    | yield_rate                  | C     | L293 = OEE quality term                                                                                                                       |
| **banking** (296–327)              | nim                         | C     | L297–306 regex income/expense buckets; fallback `totalRevenue×0.62`; ÷ invented `assetBase`                                                   |
|                                    | cet1                        | C     | L310–312 `(equityBase×eff)/(assetBase×0.72)` — regulatory capital ratio from two invented bases                                               |
|                                    | npl_ratio                   | C     | L313 `risk×40`                                                                                                                                |
|                                    | efficiency_ratio            | C     | L316–319 ratio of two driver-inflated fabrications                                                                                            |
|                                    | loan_deposit_ratio          | C     | L320–325 `assetBase×0.68 ÷ debtBase`                                                                                                          |
| **retail** (328–351)               | sss                         | C→B\* | L330 `growthPct×capFactor` — pure slider                                                                                                      |
|                                    | conversion_rate             | C     | L334–336 magic 4.2 / 2                                                                                                                        |
|                                    | atv                         | C     | L337 modeledRev ÷ invented transactions                                                                                                       |
|                                    | gmroi                       | C     | L341–343 grossProfit ÷ `assetBase×0.28`                                                                                                       |
|                                    | inventory_turnover          | C     | L347–349 `assetBase×0.32`                                                                                                                     |
| **energy** (352–371)               | production_volume           | C     | L353–354 `productionBase×capFactor`; base = rev/100 (L233–235)                                                                                |
|                                    | boe_per_day                 | C     | L355 **same number re-displayed under a second label**                                                                                        |
|                                    | lifting_cost                | C     | L359–361                                                                                                                                      |
|                                    | carbon_intensity            | C     | L365–367 magic 240 / 0.35                                                                                                                     |
|                                    | availability_factor         | C     | L368 capacity passthrough                                                                                                                     |
|                                    | renewable_mix               | C     | L369 `eff×45`                                                                                                                                 |
| **construction** (372–391)         | backlog                     | C     | L373–374 `modeledRevenue×(1+risk)`                                                                                                            |
|                                    | completion_percent          | C     | L375 capacity passthrough                                                                                                                     |
|                                    | gross_margin_per_project    | C     | L379–381 no project dimension exists                                                                                                          |
|                                    | change_order_ratio          | C     | L382 `risk×140`                                                                                                                               |
|                                    | utilization                 | C     | L383 efficiency passthrough                                                                                                                   |
|                                    | wip                         | C     | L384–389 backlog × (100−capacity)%                                                                                                            |
| **logistics** (392–414)            | cost_per_mile               | C     | L393–394 "miles" = rev/100                                                                                                                    |
|                                    | on_time_delivery            | C→B\* | L397–400 slider clamp                                                                                                                         |
|                                    | fleet_utilization           | C→B\* | L401                                                                                                                                          |
|                                    | warehousing_cost_pct        | C     | L404–407 `modeledExpenses×0.22`                                                                                                               |
|                                    | empty_miles_pct             | C     | L410–413 `(100−cap)×0.55`                                                                                                                     |
| **healthcare** (416–435)           | occupancy                   | C→B\* | L418                                                                                                                                          |
|                                    | denial_rate                 | C     | L419 `risk×55`                                                                                                                                |
|                                    | ar_days                     | C     | L421–425 hardcoded 45-day anchor × (2−eff)                                                                                                    |
|                                    | ebitdar                     | C     | L426 EBITDA mislabeled EBITDAR (no rent addback)                                                                                              |
|                                    | readmission_rate            | C     | L427 `risk×120`                                                                                                                               |
|                                    | case_mix_index              | C     | L429–433 rev÷(patients×10000) magic normalizer                                                                                                |
| **government** (436–458)           | budget_utilization          | C→B\* | L437                                                                                                                                          |
|                                    | service_efficiency          | C     | L438 `eff×10`                                                                                                                                 |
|                                    | grant_disbursement_rate     | C     | L441–444 `growth×cap×82`                                                                                                                      |
|                                    | compliance_audit_score      | C     | L447–450 `100−risk×40`                                                                                                                        |
|                                    | cost_per_citizen            | C     | L453–456 citizens = rev/100 (circular)                                                                                                        |
|                                    | revenue_collection_gap      | C     | L457 `risk×50`                                                                                                                                |
| **education** (460–487)            | student_retention_rate      | C→B\* | L464–467                                                                                                                                      |
|                                    | revenue_per_student         | C     | L468 students = rev/100 → metric ≈ 100 by construction                                                                                        |
|                                    | faculty_to_student_ratio    | C     | L471–474 faculty := expenses/90000 salary guess                                                                                               |
|                                    | research_grant_win_rate     | C     | L477–480 `growth×eff×24`                                                                                                                      |
|                                    | endowment_growth_rate       | C     | L483–486 `growth×0.85`                                                                                                                        |
| **insurance** (489–527)            | combined/loss/expense_ratio | C     | L498–507 claims fallback `modeledExpenses×0.62` (+risk inflation); regex buckets otherwise — the flagged x0.62                                |
|                                    | gwp                         | C     | L511–513 `modeledRevenue×(1+risk×0.1)` — GWP ≠ revenue×1.1                                                                                    |
|                                    | retention_ratio             | C     | L517–519 `100−risk×30`                                                                                                                        |
|                                    | solvency_ratio              | C     | L523–525 hardcoded `180×(2−eff+risk)` — regulatory ratio from a constant; leaks into `InsuranceDashboardPage.tsx:107–108` (`?? 180`, `?? 90`) |
| **realestate + default** (528–539) | noi                         | C     | L530 `modeledRevenue − modeledExpenses×0.72` magic                                                                                            |
|                                    | cap_rate                    | C     | L531–533 ÷ `max(assetBase, noi×16)` — portfolio invented, cap rate circular                                                                   |
|                                    | occupancy                   | C→B\* | L534                                                                                                                                          |
|                                    | ltv                         | C     | L535 invented debtBase ÷ invented portfolio                                                                                                   |
|                                    | ffo                         | C     | L536 `noi − expenses×0.08`                                                                                                                    |
|                                    | dscr                        | C     | L537 `noi ÷ debtBase×0.08`                                                                                                                    |

**Cross-sector surfaces:** Actual Revenue Signal L727–730 = regex+abs aggregate (**C**, mislabeled "Actual"); Modeled Revenue L731–735, Modeled EBITDA L736–740, Driver Net Impact L742–744 = **B\*** (correctly framed as modeled, sliders user-controlled). Account signals L569–578 incl. invented `assetBase` shown under "Data lineage" = **C**. Systemic: `DEFAULT_DRIVERS {8,92,86,5}` L85–90; invented bases L226–235; `filledMetrics` fallback `value = kpi.target × growthFactor × efficiencyFactor` **L542–557** — fabricates an entire KPI set anchored to config targets whenever a branch yields <5 metrics. Signed fallbacks `positiveCredit/positiveDebit` L133–143 are the only un-fabricated aggregators, yet are demoted behind the regex path (L224–225).

## Counts

- Branches audited: 12 · KPI metrics: **66 C / 0 A / 0 B** (100%)
- Headline cards: 3 B\*, 1 C · Lineage signals: 4 C · Shared foundations (6 regex buckets, 4 invented bases, DEFAULT_DRIVERS, modelledCogs, filledMetrics fallback): all C

## 5 worst offenders (by display prominence)

1. **Banking CET1** L310–312 — regulatory capital adequacy from two invented bases; indistinguishable from a real figure.
2. **Insurance solvency_ratio** L523–525 — constant-anchored 180%; propagates to the dedicated Insurance page via `InsuranceDashboardPage.tsx:108`.
3. **Insurance combined/loss ratio chain** L498–507 — x0.62 claims fallback feeding the sector's signature KPI on its own dashboard.
4. **Technology ARR** L252 — first card in the default sector's grid, `rev×12` vs a $50M config target.
5. **`filledMetrics` target×factor fallback** L542–557 — silently fabricates whole KPI sets for _any_ branch/config mismatch, and launders config targets into "measured" values.

## Pinning-test audit (K5)

- `SectorDriverDashboard.money.test.ts`: **no fabricated numeric values pinned as truth** (asserts IDs L164–166, finiteness L168–171, real-sum totals L74–75/L162–163). However its title _"computes data-driven KPI set"_ (L153) blesses the fabricated pipeline, and the L162–163 fixtures carry matching `netChange`, so they cannot detect the `absEntryAmount` sign-flip defect — laundering, not pinning.
- `__tests__/sector/SectorDriverDashboard.test.tsx`: mocks the store empty (L28–33) so only the No-Data branch renders — pins nothing.

## Recommended remediation (mirrors W-FAB-001 precedent)

- **Derive properly** (~15 metrics): adopt the Insurance precedent's chart-of-accounts prefix classification (see `InsuranceDashboardPage.tsx:59–83`, session-030 comment L9–16) + signed sums for revenue, expenses, interest income/expense, premiums, claims, NOI inputs, production counts; delete `absEntryAmount` and promote `positiveCredit/positiveDebit`; null-with-disclosure for any ratio whose denominator account class is absent.
- **Relabel as simulator** (~20 metrics, the C→B\* rows): move all driver-arithmetic KPIs (nrr, churn, sss, conversion, occupancy/utilization passthroughs, on_time_delivery, retention, carbon intensity…) into an explicitly labeled "Scenario simulator" section declaring slider inputs — never merged into the KPI/actuals grid; fix the false header copy L681–683.
- **Remove** (~30 metrics + plumbing): all invented bases (L226–235), x0.62 claims fallback, ×12 ARR, boe_per_day duplicate, magic-coefficient ratios with no accounting identity (banking cet1/npl/loan_deposit, retail gmroi slices, faculty 90000, case_mix 10000, solvency 180, portfolio ×16, ar_days 45, endowment 0.85, grant 82…), and the L542–557 target-anchored filler.
- **Rewrite tests**: rename the "data-driven" suite; assert exact values against code-prefix-classified fixtures; add sign-sensitivity fixtures (debit>credit reversals) to kill the abs trick; add negative tests asserting disclosure-not-number for non-derivable ratios.

**Issues encountered:** none blocking — `src/config/sectors.ts` is a directory (`sectors/*.ts`), resolved on second probe. No files created or modified (read-only mandate honored).
