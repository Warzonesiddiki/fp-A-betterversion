# QA-BENCH · Characterization-Test Inventory + Flake Watchlist

- **Task:** 01a02fa7-6f2b-7792-9d19-2c28786f6e73 (Track QA, autonomy A4 read-only)
- **Author:** Echo (test & triage support) · 2026-08-23
- **Method:** static analysis + reading existing test/config files ONLY. **Zero test runs executed** (runners owned by concurrent sessions). Zero code edits outside this file.
- **Evidence standard:** every count/citation below witnessed via Read / PowerShell Select-String / Glob on 2026-08-23. "it-counts" are pattern-match counts, not executed-test counts (honesty appendix §8).
- **Context inputs:** AGENTS.md Testing section · reasoning-ledger #34–#36 · Lead flake note (SecretsVault/DataGrid perf files pass in isolation).

---

## Part 1 · Characterization-Test Gap Map — Today's Three Refactors

### 1A. SafeMathParser registry split (E-01-I)

Test assets (all colocated, `src/engines/`):

| File                            | Lines | Role                                                                                                                                                                        |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SafeMathParser.test.ts`        | 1,848 | Main behavioral suite, ~250 `it` blocks (arithmetic, precedence, financial/statistical/logical fns, range refs :512+, division-by-zero :575–587, security, boundary :1526+) |
| `SafeMathParser.branch.test.ts` | 516   | Branch coverage; TEXT fn branches LEN/EXACT/REPLACE/TRIM/VALUE at :271–295                                                                                                  |
| `SafeMathParser.oracle.test.ts` | 519   | Cross-check oracle; text ops :365–403, dates :405+, lookup/array :455+, unknown-fn guard :514                                                                               |

**Direct behavioral coverage: STRONG** for numeric/financial/range dispatch through `evaluate()`; TEXT_FUNCTIONS happy-path exercised across all three files. Ledger #34 records final targeted battery 6 files / 597 tests passing.

**Gaps (ranked):**

1. **Text-result-in-arithmetic boundary pinned NOWHERE (top gap).** The deferred step-5 change ("text-root-through-evaluate() → typed error", ledger #34) migrates exactly the `CONCAT(…)+1` failure mode — yet **zero** `CONCAT` references exist in main or branch suites (Select-String sweep: 0 matches), and the oracle's text block (:365–403) never mixes a text result into arithmetic. When step 5 lands, **no existing test will fail either way** — the transition is unguarded.
2. **Oracle self-casts weaken the contract exemplar.** 23 × `as any` in `SafeMathParser.oracle.test.ts`, ~18 of them in the text block (`toBe('1020' as any)` :366+), written against the pre-split numeric-only signature. Runtime value checks remain real; compile-time protection does not.
3. **Seven text functions asserted `.toBeDefined()` only** — CODE :383, T :390, UNICODE :394, WIDECHAR :396, ASC :397, DOLLAR_DE :400, DOLLAR_FR :401. Any wrong-typed return passes.
4. Deferred-by-design (untested because unimplemented): step-5 typed-error semantics; `safeEvaluateFormula()` opt-in API. Also: E-01-I verified with **targeted suites only**; full-suite confirmation still queued behind the concurrent-session freeze.

### 1B. ExportEngine cast removal + ProfessionalExportEngine geometry made public

Test assets: `ExportEngine.test.ts` (184 ln, 7 tests: CSV escaping/quoting, PDF gen, batch PDF, Excel delegation — direct content assertions) · `ProfessionalExportEngine.test.ts` (577 ln, async PDF content assertions).

**Gaps:**

1. **Newly-public geometry has zero direct characterization.** `pageW/pageH/contentW` made public at `ProfessionalExportEngine.ts` (~:124 derivation, :218 comment "public since E-01-I"); Select-String for `geometry|pageW|pageH|contentW` over the test file: **0 matches**. Layout-option assertions (`startY|margin|cursor|position`): **0 real matches** (only narrative fixtures like "EBITDA margin expanded"). A future page-size/margin regression would pass every test as long as content strings still render.
2. Mitigating honesty label: the E-01-I change was visibility-only (casts 9→0 / 4→0, two identity casts deleted outright — ledger #34), so regression probability is low; the absence is characterization debt, not active exposure.

### 1C. DataTable comparator (UI-HF)

Source witnessed: `compareCellValues` at `src/components/ui/DataTable.tsx:52–63` (nullish-last, Date :59, number :60, bigint :61, locale-string fallback :62); sort wiring :97–103 (nullish-last in BOTH directions, non-empty flips).

**Direct behavioral coverage: STRONGEST of the three.** Dedicated `describe('UI-HF type-aware sorting')` at `DataTable.test.tsx:257–344`: numeric asc proving 3<20<100, desc, nullish-last asc+desc, Date epoch order, locale-aware text collation — plus legacy generic-sort interaction tests :67–76.

**Residual minor gap:** bigint comparator branch (:61) and mixed-type columns have no test case. Effort S when next touched.

**Coverage-quality ranking (best → worst): DataTable > SafeMathParser > Export engines.**

---

## Part 2 · Flake Watchlist

### Gate config first (witnessed `vite.config.ts:283–296`)

Default `npm run test` includes `src/**/*.test.{ts,tsx}` and **excludes** `__benchmarks__/**`, `**/*.benchmark.test.*`, `**/*.bench.test.*`. So the bench/load suites are **opt-in, not default-run flake sources**. Everything below that matters for CI-equivalent runs is a plain `.test.` file.

### Active watchlist — default run (ranked by flake propensity)

| #   | File:lines                                                                        | Pattern                                                                                                                     | Why it flakes                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W1  | `src/engines/FormulaEngine.performance.test.ts` (whole file)                      | 21 hard `toBeLessThan` wall-clock gates; **single-shot**, no median; four `<10ms` + two `<5ms` budgets                      | Tightest single-sample budgets in the suite under 4-worker parallel load                                                                                                 |
| W2  | `src/__tests__/a11y/q5-1-keyboard-nav.test.tsx` (:16–21 helper, :38–47 aggregate) | Synthetic 1000× `document.body.focus()` loops; p95 ≤100ms **plus an aggregate max-gate requiring ALL 140 samples ≤100ms**   | Zero-outlier aggregation is the flakiest possible shape; one slow sample fails the file                                                                                  |
| W3  | `src/services/SecretsVault.test.ts` :1166–1230                                    | 5 single-shot `Date.now()` probes: set `<50ms`, warm avg `<20ms`, get `<100ms`, 100 round-trips `<5000ms`, rotate `<1000ms` | **Historical flake per Lead note** ("passes in isolation") — diagnosis fits single-shot-under-load                                                                       |
| W4  | `src/components/ui/DataGrid.keyboardPerf.test.ts` (:59 `WALL_BUDGET_MS=250`)      | Median-of-5 sampling, 4 tests                                                                                               | Best-engineered wall-clock file in the repo, but still wall-clock; **historical flake counterpart**                                                                      |
| W5  | `src/__tests__/a11y/wcag-aa.test.tsx` :359–363                                    | Modal-open `<50ms`, single-shot via rAF shim                                                                                | jsdom rAF ≈ setTimeout; jitter under load                                                                                                                                |
| W6  | `src/utils/backupRestore.test.ts` :152                                            | Round-trip restore `<15000ms` hang-guard                                                                                    | Generous; low risk                                                                                                                                                       |
| W7  | `src/utils/storageSerialization.test.ts` :185                                     | Serialize `<5000ms` hang-guard                                                                                              | Generous; low risk                                                                                                                                                       |
| W8  | `src/workers/worker-pool.unavailable.test.ts` :22/:35                             | `REJECT_BUDGET_MS = 2000` rejection-contract guard                                                                          | Contract semantics (hang detection), not perf tuning; low risk                                                                                                           |
| W9  | `src/__tests__/a11y/q5-2-focus-restore.test.tsx` :38                              | `test.skip('<50ms perf budget>')` — SKIPPED                                                                                 | Documented JSDOM rationale (focus 10–100× slower than browsers; real gate in Playwright E2E). Note: skipped body contains dead code (useRef inside non-component helper) |

**Watchlist size: 8 active + 1 skipped in the default run; +14 opt-in files excluded by config = 23 total entries.**

Opt-in inventory (excluded at `vite.config.ts:283–296`, run via separate bench script): `src/__benchmarks__/load/01-monte-carlo … 07-chaos-network-partition` (7; **02-data-grid-100k is the "DataGrid perf file"** of the historical note), `src/engines/__benchmarks__/AIEngine.bench` + `IncrementalCalcEngine.bench` (~30 wall-clock measurements), `AIEngine.benchmark.test`, `ArrayFormulaEngine.benchmark.test`, `OnboardingWizard.bench.test.tsx`, `masterStorage.bench.test.ts`, `money.bench.test.ts`.

### Recommended isolation strategy

1. **Config-level (preferred; precedent exists):** carve W1–W5 into a dedicated `test:perf` npm script run with `--no-file-parallelism` (or `maxWorkers:1`), and exclude their globs from the default include — mirroring how `*.bench.test.*` exclusion already works at `vite.config.ts:292–296`. Default suite keeps only generous hang-guards (W6–W8).
2. **In-file (no config change):** convert single-shot budgets to median-of-N using `DataGrid.keyboardPerf.test.ts` as the in-repo pattern; relax W2's all-samples max-gate to its already-computed p95.
3. **Headroom audit:** W3's warm `<20ms` average is the tightest absolute budget in the default run; apply ≥3× headroom or relocate before trusting red/green signals.

The historical note (SecretsVault/DataGrid pass in isolation, flake under parallel load) is structurally consistent with W3/W4 shapes above — single/median wall-clock samples competing with 3 sibling workers.

---

## Part 3 · Stability Backlog (ranked by risk-to-financial-pipeline)

| #   | Priority | Item                                                                                                                                                                                                                                                           | Why / effort                                                                                               |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| B1  | P1       | **Pin the text-arithmetic boundary BEFORE SafeMathParser step 5 lands** — new oracle `describe` snapshotting current `evaluate('CONCAT(1,2)+1')` (and `LEFT(...)+0`) behavior, then deliberately flipped during the typed-error migration                      | Step-5 currently ships with no test net on its exact behavior change. S                                    |
| B2  | P1       | Quarantine/median-convert W1–W3 (perf-gate false-reds)                                                                                                                                                                                                         | Red defaults erode trust in the "local run IS the gate" regime while CI stays blocked (E-005 billing). S–M |
| B3  | P2       | De-cast oracle post-step-5 (23 `as any`) so it exercises the new discriminated types                                                                                                                                                                           | Type-regression blindness. S                                                                               |
| B4  | P2       | Value-assert the 7 `.toBeDefined()`-only text functions (oracle :383/:390/:394/:396/:397/:400/:401)                                                                                                                                                            | Wrong-typed returns pass today. S                                                                          |
| B5  | P3       | Pin ProfessionalExportEngine geometry derivations (`contentW = pageW − margins` etc.) with direct expects                                                                                                                                                      | Board-pack layout regression would ship silently. S                                                        |
| B6  | P3       | Duplicate colocated-vs-`__tests__` test files — verify both actually execute, then merge deliberately: `components/reports/ReportGrid.test.tsx` + `reports/__tests__/ReportGrid.test.tsx`; `utils/performance.test.ts` + `utils/__tests__/performance.test.ts` | Both pairs Glob-witnessed today; duplicates can double-run or silently shadow. S                           |
| B7  | P3       | q5-2-focus-restore skipped block: fix the `useRef`-in-helper misuse or delete; re-document skip rationale                                                                                                                                                      | Dead code inside skip; hygiene. S                                                                          |

All items above are proposals pending Lead authorization (honesty rules — an inventory ≠ approved fixes).

---

_End of inventory. No working-tree edits were made other than this file._
