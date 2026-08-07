## MISSION D — docs triage (audit §8) + engines coverage 75%+ + 6 real defect fixes

Closes the last non-env-bound residual from the ZCFA-2026-08-07 audit (§8 docs cleanup, RELEASE_CHECKLIST "145 codif docs" box) and pushes the measured coverage gap — **and the new oracle tests exposed 6 real defects in shipped formula functions, all fixed with regression guards.**

### Wave D-1 — Docs triage (audit §8 → CLOSED)

| | Before | After |
|---|---|---|
| docs/ files | 321 | **112** |
| docs/ size | 5.8 MB | **1.7 MB** |
| Broken docs refs (links + citations) | **4 hard + 651 soft** | **0 + 0 (strict)** |

- Deleted 209 ritual/process files: `docs/_archive/codif/` (146 — the RELEASE_CHECKLIST item), `docs/strategy/` (30), `IMP_ANSWERS*` (8), MUSE_LINEUP_v2, STRATEGIC_INDEX, VIBE_CODING×2, RATIFICATION_GATE×2, task-board×2, PERFECTION_PLAN, skills×3, leader/, personas/, never_again_rules/, specs/, husky-gates, 2026-06-12 audit drafts×2, tests/e2e process docs×5. Git history retains everything.
- **New enforcement:** `scripts/docs-link-check.mjs` + `docs-link-allowlist.json` (`npm run docs:links`) — hard-fail on broken links, strict-fail on broken citations. Deliberate dated exemptions only for historical records (STRATEGIC_DECISIONS_LOG, GLOSSARY, reports/**, handovers, forward-refs).
- Fixed 81 stale citations in kept docs (ARCHITECTURE, ONBOARDING, 5 ADRs, 13 a11y specs, 7 security docs, PRODUCT_VISION, ROADMAP, CONTRIBUTING, AGENTS, GAP_LEDGER, sdk/perf/cli/e2e READMEs).

### Wave D-2 — Engines coverage 71.32/73.44 → 73.30/75.41 (stmts/lines); 4,940 → 5,030 tests

- Deleted dead `src/engines/shared/` (6 files: 0 importers / 0 tests / 0 manifest entries; reachability still 181/181, 0 orphans).
- New oracle test files: `helpers.test.ts` (30), `statistical.dist.test.ts`, `text.date.test.ts`, `math.ext.test.ts` — exact known-answer oracles (chi-square even-df Poisson survival, Gamma integer-alpha CDF, statistical tables, Excel serial dates).

### 6 real defects found by the new tests and FIXED

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `tDistCDF` ignored sign of t | F(-1.812,10) = 0.95 (true 0.05) | symmetry branch |
| 2 | `CHIDIST` wrong tail probabilities | CHIDIST(18.307,10) = 0.9984 (true 0.05) | exact `gammq(df/2, x/2)` (NR series + Lentz CF) |
| 3 | `GAMMADIST` cumulative wrong | GAMMADIST(1,2,1,true) = 1.0 (true 0.2642) | `gammp(alpha, x/beta)` |
| 4 | `CHIINV` bisected to 100 ceiling | CHIINV(0.05,10) = 100 (true 18.307) | fixed via #2 |
| 5 | `WEEKDAY` returnType 2 mis-mapped | Sunday→1 / Monday→2 (true 7 / 1) | corrected mapping |
| 6 | `EDATE` day overflow + hex partial-parse | 2024-01-31+1M = Mar 2 (Excel: Feb 29); parseInt("1f")===1 | day-clamp; honest NaN |

### Gate evidence (all measured locally, 2026-08-07)

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src --max-warnings 0` | 0 errors / 0 warnings |
| `money-adoption.mjs` | ratchet holds (231/906, 0 raw toFixed; server 2/23) |
| `mock-data-audit.mjs` | ✓ (wired=7, disclosed=16) |
| `verify-readme-stats.mjs` | ✓ |
| `docs-link-check.mjs --strict` | **0 broken links / 0 broken citations** |
| Engines suite + coverage | **5,030 passed / 274 files; 73.30% stmts / 75.41% lines** |
| formula-functions | 196 passed |
| Close stack (S5) | 120 passed (unchanged) |
| periods/audit/sox pages | 59 passed |
| a11y spot | 419 passed / 1 skipped |
| help + sdk | 74/74 |
| engine-reachability | 181/181, 0 orphans |

### Honest notes

- **F-02 E2E stays UNVERIFIED_BLOCKED** (Chrome for Testing CDN egress; re-tried this session). Box unchecked, not faked.
- **Flakes:** `DataGrid.keyboardPerf` (documented) and `FormulaEngine.performance` "extract dependencies < 5ms" (flaked once at 13ms under coverage load; passes 23/23 isolated). Both env-noise, both unweakened.
- Coverage 75.41% lines is the `src/engines/**` layer only; CI threshold unchanged at 50%.
- Deploy workflow failure pre-dates this PR (env-bound; GAP-7 forbids workflow edits).
