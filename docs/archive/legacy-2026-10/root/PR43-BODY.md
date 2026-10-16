## MISSION D — docs triage (audit §8) + engines coverage 71.3→83.5% lines + 12 real defect fixes

Closes the last non-env-bound residual from the ZCFA-2026-08-07 audit (§8 docs cleanup, RELEASE_CHECKLIST "145 codif docs" box) and pushes the measured coverage gap — **and the new oracle tests exposed 12 real defects in shipped engines, all fixed with regression guards.**

### Wave 1 — Docs triage (audit §8 → CLOSED)

| | Before | After |
|---|---|---|
| docs/ files | 321 | **112** |
| docs/ size | 5.8 MB | **1.7 MB** |
| Broken docs refs (links + citations) | **4 hard + 651 soft** | **0 + 0 (strict)** |

- Deleted 209 ritual/process files: `docs/_archive/codif/` (146 — the RELEASE_CHECKLIST item), `docs/strategy/` (30), `IMP_ANSWERS*` (8), MUSE_LINEUP_v2, STRATEGIC_INDEX, VIBE_CODING×2, RATIFICATION_GATE×2, task-board×2, PERFECTION_PLAN, skills×3, leader/, personas/, never_again_rules/, specs/, husky-gates, 2026-06-12 audit drafts×2, tests/e2e process docs×5. Git history retains everything.
- **New enforcement:** `scripts/docs-link-check.mjs` + `docs-link-allowlist.json` (`npm run docs:links`) — hard-fail on broken links, strict-fail on broken citations. Deliberate dated exemptions only for historical records (STRATEGIC_DECISIONS_LOG, GLOSSARY, reports/**, handovers, forward-refs).
- Fixed 81 stale citations in kept docs (ARCHITECTURE, ONBOARDING, 5 ADRs, 13 a11y specs, 7 security docs, PRODUCT_VISION, ROADMAP, CONTRIBUTING, AGENTS, GAP_LEDGER, sdk/perf/cli/e2e READMEs).

### Wave 2 — Engines coverage 71.32/73.44 → 81.72/83.54 (stmts/lines); 4,940 → 5,312 tests

- Deleted dead `src/engines/shared/` (6 files: 0 importers / 0 tests / 0 manifest entries; reachability still 181/181, 0 orphans).
- ~250 new known-answer oracle tests across 20+ engines: formula-functions (financial/statistical/lookup/text/math/helpers — Excel-verified PV/FV/PMT/IPMT/PPMT, chi-square/Gamma/F/t distributions, Macaulay duration, matrix algebra), ExportTemplateEngine (full PDF generation via recording jsPDF double), DataRetentionEngine, ReportBookEngine, CreditRiskEngine, AuditLogEngine (SHA-256 chain + HMAC), ArrayFormulaEngine, report-builder formulas + export, YieldCurveEngine, SensitivityEngine, DataMaskingEngine, SyncEngine, TemplateEngine, DataCatalogEngine, CellAuditTrailEngine, ConditionalFormattingEngine, ReportSchedulerEngine, ReportDistributionEngine, WorkflowEngine, IncrementalCalcEngine, IntercompanyMatchingEngine.
- Coverage exclude: `src/**/*.benchmark.ts` (perf drivers run via `test:bench`, not unit targets — same category as the already-excluded `__benchmarks__` dir).

### 12 real defects found by the new tests and FIXED

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `tDistCDF` ignored sign of t | F(-1.812,10) = 0.95 (true 0.05) | symmetry branch |
| 2 | `CHIDIST` wrong tail probabilities | CHIDIST(18.307,10) = 0.9984 (true 0.05) | exact `gammq(df/2, x/2)` (NR series + Lentz CF) |
| 3 | `GAMMADIST` cumulative wrong | GAMMADIST(1,2,1,true) = 1.0 (true 0.2642) | `gammp(alpha, x/beta)` |
| 4 | `CHIINV` bisected to its 100 ceiling | CHIINV(0.05,10) = 100 (true 18.307) | fixed via #2 |
| 5 | `WEEKDAY` returnType 2 mis-mapped | Sunday→1 / Monday→2 (true 7 / 1) | corrected mapping |
| 6 | `EDATE` day overflow | 2024-01-31 + 1M = Mar 2 (Excel: Feb 29) | day-clamp to target month length |
| 7 | `DEC2HEX`/`BIN2HEX` partial-parse garbage | parseInt("1f") === 1 | honest NaN when hex output contains a–f |
| 8 | `IPMT`/`PPMT` dropped the principal term | IPMT(5%,1,10,100k) = 0 (true -5,000); per-2 sign/magnitude wrong | prior-period balance via FV, not PV |
| 9 | `DB` declining-balance double-count | DB(10000,1000,5,2) = 1,361.92 (true 2,328.5) | fixed-rate on remaining book value |
| 10 | `DURATION` omitted the redemption cash flow | par 8%/10y bond = 4.87y (true 7.247y) | redemption PV-weighted term added |
| 11 | `YieldCurveEngine.bootstrap` never filled missing rates | zero rates stayed 0 | interpolate between surrounding known points |
| 12 | `TemplateEngine` % formula case-sensitivity + `safeEvaluate('-(3+5)')` threw | %jan never matched key 'jan'; unary minus before `(` broken | case-insensitive ref lookup; unary-minus parse |

### Gate evidence (all measured locally, 2026-08-08)

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src --max-warnings 0` | 0 errors / 0 warnings |
| `money-adoption.mjs` | ratchet holds (231/906, 0 raw toFixed; server 2/23) |
| `mock-data-audit.mjs` | ✓ (wired=7, disclosed=16) |
| `verify-readme-stats.mjs` | ✓ |
| `docs-link-check.mjs --strict` | **0 broken links / 0 broken citations** |
| Engines suite + coverage | **5,312 passed / 298 files; 81.72% stmts / 83.54% lines** (EXIT 0) |
| formula-functions | 264 passed (was 145) |
| engine-reachability | 181/181, 0 orphans |
| Close stack (S5) | 120 passed (unchanged) |
| a11y spot | 419 passed / 1 skipped |

### Honest notes

- **F-02 E2E stays UNVERIFIED_BLOCKED** (Chrome for Testing CDN egress; env-bound). Box unchecked, not faked.
- **Flakes (documented, unweakened):** `DataGrid.keyboardPerf` (pre-existing) and `FormulaEngine.performance` "extract dependencies < 5ms" — both pass isolated, fail only under CPU/coverage load.
- Coverage 83.54% lines is the `src/engines/**` layer; CI threshold unchanged at 50%.
- Deploy workflow failure pre-dates this PR (env-bound; GAP-7 forbids workflow edits).
- **Process note:** the session branch was snapshot-restored mid-flight (git refs reset to base with the full working tree intact); all work was re-verified gate-clean and re-committed before this PR.
