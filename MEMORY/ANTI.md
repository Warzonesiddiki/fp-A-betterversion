---
id: MEMORY/ANTI.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# ANTI — hallucination vaccine (known falsehoods, dead ends, do-not-repeat)

```
[DO-NOT] Treat "0 unsafe ops" or "0 fabrication findings" as certification.
  seen: agents declare a file correct because a detector stopped flagging it.
  instead: say plainly whether a number moved because the product got safer or
           because measurement got more accurate. Add a per-module source guard.
  evidence: every fabrication bug found in sessions 007-016 was hand-typed
           literals containing no arithmetic at all.

[DO-NOT] Use src/utils/decimalUtils.ts for money.
  seen: it looks money-safe because of the name.
  instead: src/utils/money.ts is the ONLY money-safe primitive.
  evidence: money-AST detector treats only money.ts helpers as safe.

[DO-NOT] vi.mock the whole engine and assert against your own fixture.
  seen: both board-pack test files asserted "$4.2M", a number that existed
        nowhere in the product, while "$12.4M" shipped into a CONFIDENTIAL PDF.
  instead: importOriginal + DOM assertions against the real engine.

[DO-NOT] Wrap layout / index / geometry arithmetic in money helpers.
  seen: page millimetres and `array.length` ratios flagged by the money-AST
        detector get "fixed" with decimal.js.
  instead: only currency values are money. Ratios are dimensionless; page
           geometry is millimetres; index math is integers.
  evidence: 37 export-engine findings were all page-geometry false positives.

[DO-NOT] Call a correct engine with invented inputs.
  seen: TaxEngine.computeProvision is money-safe; feeding it taxRate 0.21 that
        the GL does not carry launders a fabrication through a trusted API.
  instead: empty-state, or disclose the figure as unavailable.

[DO-NOT] Write a source guard that matches the prose describing the defect.
  seen: session 011's first guard matched the sentence naming the invented
        jurisdictions, so it failed on its own disclosure comment.
  instead: strip comments first, then match assignment patterns
           (`jurisdiction: '...'`, `.times(0.7)`), not words.

[DO-NOT] Trust an "oracle" test name.
  seen: VDB(10000,1000,5,2,4) === 4704 was encoded as an oracle. Correct: 2304.
  instead: an oracle is only an oracle if the expected value came from the
           vendor's published output.

[DO-NOT] Assume a large green suite means coverage.
  seen: 381 SafeMathParser tests missed five zeroed defaults because every test
        passed optional args explicitly.
  instead: probe by execution with arguments omitted.

[DO-NOT] Destructure with `x = 0` when a downstream `x ?? N` must fire.
  seen: default-in-destructuring silently kills the nullish fallback.
  instead: `args[i]! ?? N`.

[DO-NOT] Add the residual as a third waterfall step.
  seen: pretax - tax IS the bridge; also adding net income double-counts.

[DO-NOT] Push .github/workflows/**.
  seen: agents keep trying; the GitHub App lacks the `workflows` permission.
  instead: ci-patches/*.patch for a human `git apply`.
  evidence: ci-patches/0005-*.patch is still pending.

[DO-NOT] Use `--reporter=basic` with vitest 4.1.7.
  seen: the reporter does not exist. Use default or --reporter=dot.
  also: a run reporting "0 tests" means a parse error, not an empty file.

[DO-NOT] Run `npm audit fix --omit=dev` in server/.
  seen: it prunes devDependencies, removing @types/express -> 12 TS7016 errors
        and 8 failing test files.
  instead: patch-level `overrides` in server/package.json (ADR-001).

[DO-NOT] Interpret the GL as carrying jurisdiction, D&A, or cash-flow activity.
  seen: invented ASC 740 four-jurisdiction provisions and activity-split cash
        flow statements.
  instead: prefixes are 1 Asset, 2 Liability, 3 Equity, 4 Revenue, 5 COGS,
           6 OpEx, 7 Interest, 8 Income tax. Nothing else is inferable.

[DO-NOT] Math.abs a GL entry amount.
  seen: RealEstate/Retail/Construction/Insurance engines and DashboardPage all
        did it; a contra entry then INCREASES the balance it should reduce.
  instead: natural balance -> revenue = credit - debit; cost = debit - credit.

[DO-NOT] Let a chart and its KPI tile derive the same figure separately.
  seen: DashboardPage's tile used `credit - debit` for revenue while the trend
        chart used `debit - credit`, so revenue was plotted negative for
        months on end and nothing failed.
  instead: one derivation module per surface; the chart and the tile read it.
  evidence: session 017, src/pages/dashboard/dashboardModel.ts.

[DO-NOT] vi.mock a barrel the page does not import.
  seen: PatientRevenuePage.test.tsx mocked '@/engines' while the page imports
        '@/engines/HealthcareEngine'. The mock silently never applied.
  instead: mock the exact specifier, or better, run the real engine.

[DO-NOT] Render 0 or 0.0% for a metric whose denominator does not exist.
  seen: budget utilization showed a green "0.0%" bar with no budget posted.
  instead: null -> '—' plus a sentence saying what is missing.

[DO-NOT] Treat every GL entry as cash.
  seen: CashForecastPage summed debit - credit over the whole ledger and called
        the positive half "inflows", so an expense debit was cash received.
  instead: cash is accounts with prefix 10 / 11. Receipts are debits to those.
  evidence: session 018, src/pages/cash/cashForecastModel.ts.

[DO-NOT] Split a total with typed weights (70/30, 40/35/15, residual).
  seen: the cash category table and the tax provision jurisdictions.
  instead: derive the split from double entry (journal counter-lines) or
           disclose it as unavailable. Weights that look reasonable are still
           invented.

[DO-NOT] Decide variance favourability from words in a label.
  seen: `category.includes('Revenue') ? v > 0 : v < 0` on a hand-typed label.
  instead: natural balance of the account code decides it.

[DO-NOT] Assume a sectors/* page reads a store.
  seen: EducationDashboardPage imported no store and rendered a fictional
        university; a data-driven twin was already routed at /sector/education.
  instead: check both `src/pages/sector/` and `src/pages/sectors/` before
           rewriting, and grep the page for `useGLStore` first.

[DO-NOT] Ship a "demo default" fallback on a routed page.
  seen: GovernmentDashboardPage rendered mockDepartmentBudget /
        mockRevenueByCategory whenever its store was empty -- i.e. for every
        new tenant -- with only a code comment saying they were demo data.
  instead: empty-state. A user cannot see your comment.

[DO-NOT] Name a metric "accuracy" unless it compares a prediction to an actual.
  seen: forecastAccuracy = share of months whose ACTUAL moved <10% from the
        prior month. It never looked at a forecast and shipped as a KPI.
  instead: walk-forward backtest, or null + a disclosure.
  evidence: session 019, rollingForecastModel.backtestRevenue.

[DO-NOT] Round before you average.
  seen: roundTo(sumMoney(growthRates), 2) / n quantised the growth rate.
  instead: keep decimals through the aggregation; round at the edge only.

[DO-NOT] Publish a confidence interval you did not compute.
  seen: `confidenceInterval: 8.5` rendered as "+/-8.5%, 95% CI", with help text
        describing it as the historical error distribution.

[DO-NOT] Stamp one aggregate onto every row of a per-row column.
  seen: ValuationPage put the PORTFOLIO cap rate in each property's "Implied
        Cap Rate" cell, then value-weighted that constant and called the result
        a weighted cap rate.
  instead: derive per row from that row's own inputs, or leave the cell blank.

[DO-NOT] Average percentages when you mean a ratio of totals.
  seen: "Avg. Appreciation" was the mean of per-property percentages (17.5%)
        where portfolio gain / portfolio cost is 20.0%.
  instead: ratio of sums for portfolio figures; say "mean" only if you mean it.

[DO-NOT] Let a guard read the page's own disclosure copy.
  seen: TWICE in session 020 -- assertions matched 94.8 and FTL inside the
        "not derivable" text that deliberately names them.
  instead: assert on the derived data (arrays, series, object keys), not on
           container.textContent, whenever the forbidden token also appears in
           prose. And do not leak internal placeholder constants into UI copy.

[DO-NOT] Read a store and discard it while fixtures render.
  seen: PromoAnalysisPage opened with `const { entries: _entries } =
        useGLStore();` and rendered five hardcoded campaigns, exporting them.
  instead: an underscore-prefixed store read is a red flag, not a lint fix.
           grep for `: _entries` and `_navigate` when auditing a page.

[DO-NOT] Call incremental revenue a return.
  seen: promo "ROI" was (revenue - baseline - cost) / cost, treating every
        incremental dollar of revenue as profit.
  instead: compute on margin, and print the basis next to the number.

[DO-NOT] Hardcode a sign on a variance, lift or change.
  seen: `+{formatPercent(lift)}` rendered "+-12%" for a campaign that lost
        money.

[DO-NOT] Publish a model statistic you did not compute.
  seen: MAPE 4.2%, RMSE $182K, R-Squared 0.94, Bias -1.8% as literals in an
        array under the heading "Forecast Accuracy"; a fixed 6% + 1.5%/period
        confidence band; a synthesised past forecast line
        (actual + 2% - 50,000) that made the model look prescient.
  instead: walk-forward backtest on the user's own history, residual-based
           bands, actuals only over past periods.

[DO-NOT] Leave an unused engine armed with inventions.
  seen: InsuranceEngine was called by no product code, and still carried
        net-written = gross * 0.85, policyCount = gross / 360, and a
        getCombinedRatioTrend that ignored its argument and returned
        sin()-seeded noise. "Nothing calls it" is not a defence: the next
        session wires it up.

[DO-NOT] Trust your OWN rewrite without re-running the detector.
  seen: session 022's replacement page introduced 5 fresh unsafe ops (inline
        phase grouping with float + and toFixed).
  instead: run `--file` on every file you write, not just the one you fixed.

[DO-NOT] Re-fight pre-push gate 10 on a fresh branch.
  seen: with no @{u} it falls back to `git log -10` and flags already-merged
        squashes 5078e01 and 646bdf4.
  instead: acknowledge in docs/security/CASCADE_HOLD_LEDGER.md and move on.

[DO-NOT] Assume node_modules survives a sandbox restore.
  seen: first symptom is `Cannot find module 'typescript'` from the detectors.
  instead: git fetch origin <session-branch> -> reset to FETCH_HEAD -> npm install.
```
