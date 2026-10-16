---
id: MEMORY/SESSIONS/sess_026.md
status: active
last_verified: 2026-08-19
verified_by: arena-agent/session-026
confidence: high
---

# Session 026 — 2026-08-19

## Goal

T-026 wave pair on a fresh branch off merged `main` (`ec7a66a`, PR #66 landed):
money-AST `BalanceSheetPage` (7) → 0 — chosen over LeaseEngine/LeaseDetailPage because it is
K18-core — and fabrication `src/pages/insurance/InsuranceDashboardPage.tsx` (3) → 0.

## Read

Boot chain (INDEX → STATE → TRUTH → NOW → ANTI → PROTOCOL/LENS), `.agent/HANDOVER.md`,
journal 024–025. Then: `BalanceSheetPage.tsx` + its three test files,
`src/pages/reports/threeStatementData.ts` (the equity precedent),
`InsuranceDashboardPage.tsx`, `src/engines/InsuranceEngine.ts` (de-fabricated s022),
`src/store/insuranceStore.ts` persist seeds (already empty, v2), the `sector/` twin at
`/sector/insurance`, and every describe block of `smoke-sectors.test.tsx`.

## Changed (paths)

- **NEW** `src/pages/reports/balanceSheetData.ts` (+ `.test.ts`, 24 known-answer cases and
  6 source guards) — the balance sheet's only derivation.
- `src/pages/reports/BalanceSheetPage.tsx` — consumes it; 7 unsafe ops → 0; empty-state
  heading `<h2>` → `<h1>` (UI-07); dead help button removed; export rows now carry the
  equity breakdown and the signed imbalance.
- `src/pages/reports/BalanceSheetPage.deep.test.tsx` — new DOM probes for the traded-books
  case and the unmapped-account note.
- **NEW** `src/pages/insurance/insuranceDashboardData.ts` (+ `.test.ts`, 13 known-answer
  cases and 6 source guards) — wraps the real `InsuranceEngine`.
- `src/pages/insurance/InsuranceDashboardPage.tsx` — reads `glStore`, derives everything;
  fabrication 3 → 0.
- `src/pages/insurance/InsuranceDashboardPage.test.tsx` — rewritten: real engine, real
  store, 11 DOM probes (was 2 vacuous smoke assertions behind a dead barrel mock).
- `src/pages/smoke-sectors.test.tsx` — the Insurance heading assertion tightened from
  `/Insurance/i` to an exact level-1 heading match.
- Both baselines: money 397 → **390** (158 modules, 82.13%); fabrication 16 → **13**
  (7 files).

## Facts added

- **Severity-0, invisible to both detectors:** `computeBalanceSheet` rolled up prefixes
  1/2/3 only and then asserted `Assets = Liabilities + Equity`. In double entry
  `Assets − Liabilities − PostedEquity ≡ Revenue − Expenses`, so the page reported
  "Off by *net income*" on any perfectly balanced ledger that had traded, and the figure
  labelled "Total Equity" excluded current-period earnings. `threeStatementData.ts` had
  derived equity correctly since session 008 — the two surfaces disagreed on the same GL.
- The balance test was `Math.abs(diff) < 0.01`: a real one-cent imbalance passed silently.
  It is now exact zero on a single rounding of the unrounded difference.
- The as-of filter compared raw `e.date` strings, so an entry stamped
  `2026-06-30T09:15:00Z` was dropped from the 2026-06-30 report.
- Entries whose account code has no 1–8 class prefix were silently excluded from every
  total; the sheet then could not balance and the page could not say why. Now counted and
  disclosed.
- `InsuranceDashboardPage` read no store and called no engine. Beyond the three detected
  literals it shipped a policy count of `142,800`, six months of typed loss/expense ratios,
  five premium lines, a five-row underwriting table with typed per-line loss and combined
  ratios and `Improving`/`Stable`/`Worsening` trend words, and three invented KPI deltas
  (`change={-6.2}`, `change={14.2}`, `changeLabel="YTD growth 12%"`). The detector sees
  none of the deltas.
- Its own test file `vi.mock`-ed `@/engines` — a barrel the page did not import — so the
  mock never applied and the two assertions never touched a number.
- Per-file `--json` diff (HEAD worktree vs working tree): exactly one file moved on each
  ratchet. Money `BalanceSheetPage.tsx` 7→0, 158/159 untouched. Fabrication
  `InsuranceDashboardPage.tsx` 3→0, 7/8 untouched. Both moves are product safety.
- Teeth: with both new derivation modules in place and only the two pages reverted to HEAD,
  **21** new assertions fail. Separately, changing one line
  (`totalEquity = postedEquity.plus(currentPeriodEarnings)` → `postedEquity`) fails **8**.

## Assumptions added / killed

- Killed: "a per-line loss ratio is derivable for insurance". The engine's line split reads
  the last two digits of 41xx/42xx premium codes; 51xx–53xx carry no line dimension, so a
  per-line loss ratio would need an allocation nobody posted. The table publishes written,
  earned and written − earned only, and says so.
- Confirmed: `insuranceStore` persist seeds are already clean (v2, empty arrays) — the
  session-024 "page and store carry the same fabrication" trap did not apply here, but was
  checked before rewriting.

## Errors + fixes

- `getByText(/Insurance/i)` in `smoke-sectors` matched twice once the empty state existed:
  the substring also occurs in "reinsurance". Fixed the copy *and* tightened the matcher.
- The recharts stub collided with `Sparkline` (which renders its own `AreaChart`), so
  `getByTestId('area-chart')` found several. Stubbed `Sparkline` separately and turned it
  into an assertion that the sparkline carries the derived series.
- A source guard `/lossRatio:/` matched the module's own `TrendPoint` interface. Narrowed
  to the `UnderwritingLineRow` shape plus a "no division in this module" guard.
- `DataTable` renders `role="grid"`, not `role="table"`.

## Boot-state defect found and repaired

`.agent/state.json` was **0 bytes** in the working tree and on `main`. It held 12,028 bytes
at `646bdf4` (PR #64), was truncated at `082e70c` (PR #65) and shipped empty again in
`ec7a66a` (PR #66). Codex boot step **B8** reads `blueprint_status` from that file, so two
merges shipped with the Article XVIII gate state destroyed — a strict boot would have halted
product code. Restored from `646bdf4`, brought forward (session id, ratchets 390 / 13,
W0.1.1 completed modules, the balance-sheet Severity-0 entry) and re-verified:
`blueprint_status` is `LOCKED`. `wc -c .agent/state.json` added to ANTI as a boot check.

## Next agent should

Open the PR for this branch and merge only when `test-unit` is green. Then T-027:
money-AST next ranked — `LeaseEngine` (7), `LeaseDetailPage` (7), or the class-wide
`existing.debit += e.debit` grouping idiom (16 non-test files, listed in NOW.md);
fabrication — `src/pages/reports/BoardPackPage.tsx` (3), then the twos.
