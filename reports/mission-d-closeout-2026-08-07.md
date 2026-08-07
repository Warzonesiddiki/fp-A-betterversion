# MISSION D CLOSEOUT — Docs Triage (audit §8) + Coverage Depth + Real Defect Fixes

**Session:** 6 (branch `arena/019fdccc-fp-a-betterversion`, base `main` @ `60e0d4a` — PR #42 MERGED)
**Date:** 2026-08-07 · **Persona:** ARBITER — every claim below carries measured evidence.

---

## 1. The mission

Mission C (PR #42) closed the audit's only FAIL (F-01 period-close UI) and zeroed mock
data (F-04). What remained per the audit §8 and RELEASE_CHECKLIST:

- **Docs cleanup — PARTIAL**: "145 codif/endorsement process docs" box unchecked;
  `docs/` held 321 files / 5.8MB, most of it process/ritual artifacts; the docs-link
  graph was badly broken (the S3-era `docs/drafts/` deletion left ~600 dangling citations).
- **Coverage 71.3% → 75%+** (optional push; every engine already had a direct test file).
- **E2E** — env-bound (Playwright browser CDN egress still blocked; re-tried, re-recorded).

## 2. Wave D-1 — Docs triage (audit §8, RELEASE_CHECKLIST box)

**Deleted 209 files / ~4.1MB** (git history retains everything):

| Group | Count | Examples |
|---|---|---|
| `docs/_archive/codif/` | 146 | the 145 endorsement/codif process files + CATCH catalog (the RELEASE_CHECKLIST item) |
| `docs/strategy/` | 30 | SKEPTIC_VERDICT / sentinel cross-witness / artemis readiness process artifacts |
| `docs/IMP_ANSWERS*` | 8 | Q&A process dumps |
| ritual top-level | 25 | MUSE_LINEUP_v2, STRATEGIC_INDEX, V1_SESSION_STATUS, VIBE_CODING×2, RATIFICATION_GATE×2, task-board×2, PERFECTION_PLAN, skills×3, BMAD_INTEGRATION, OPENCODE_SYNC, MISTAKES, husky-gates, never_again_rules/, leader/, personas/, specs/, 2026-06-12 audit drafts×2 |
| `tests/e2e` process docs | 5 | RATIFICATION walkthrough, USER_JOURNEY docs, personas/README (spec files untouched) |

**Reference fixing (the "don't break the graph" discipline):** before deletion the graph was
measured at **4 broken markdown links + 651 broken backtick citations** (dominated by
`docs/drafts/*` refs from GLOSSARY/ARCHITECTURE/ONBOARDING/AGENTS that were never fixed when
S3 deleted `docs/drafts/`). After triage + 81 citation fixes in kept docs:

```
$ node scripts/docs-link-check.mjs --strict
✓ docs-link graph clean: 0 broken links, 0 broken citations (strict)
```

**New enforcement:** `scripts/docs-link-check.mjs` + `scripts/docs-link-allowlist.json`
(`npm run docs:links`). Scans every `.md` in the repo; hard-fails on broken markdown links,
strict-fails on broken citations. Deliberate, dated exemptions only: historical logs
(STRATEGIC_DECISIONS_LOG — a decision record, rewriting it would be dishonest), GLOSSARY
(its rows already document the draft-source drift), `reports/**` (dated historical evidence),
session handovers, and forward-reference placeholders (e.g. WAIVERS' `docs/codif/RULE_50.md`
"when codif lands"). Kept files whose citations pointed at deleted artifacts were fixed, not
allowlisted: ARCHITECTURE, ONBOARDING, all 5 ADRs, 13 a11y specs, 7 security docs,
PRODUCT_VISION, ROADMAP, FPA_COMPETITIVE_MATRIX, STRATEGIC_REVIEW_Q2, CONTRIBUTING, AGENTS,
GAP_LEDGER, knowledge.md, src/sdk + scripts/cli + scripts/perf + e2e READMEs.

**Result:** docs/ = **112 files / 1.7MB** — canonical product/engineering corpus only
(architecture, security, a11y, ADRs, engines, audit, compliance, onboarding, planning).

## 3. Wave D-2 — Coverage depth + real defect fixes

`src/engines` layer, exact CI measurement (`vitest run src/engines --coverage --include='src/engines/**'`):

| Metric | Before (PR #42) | After (MISSION D) |
|---|---|---|
| Statements | 71.32% | **73.30%** |
| Lines | 73.44% | **75.41%** |
| Test files / tests | 4,940 | **5,030 (274 files)** |

What was added:
- **Deleted dead code:** `src/engines/shared/` (6 files: datetime/ids/math/serialization/validation/index) —
  **0 importers, 0 tests, 0 manifest entries** (reachability still 181/181, 0 orphans after deletion).
  This was the 0%-coverage block dragging the layer down.
- **New oracle test files** (~117 tests): `helpers.test.ts`, `statistical.dist.test.ts`,
  `text.date.test.ts`, `math.ext.test.ts` — exact known-answer oracles (chi-square even-df
  Poisson-sum survival, Gamma integer-alpha CDF, standard statistical tables, Excel serial
  dates, combinatorial identities).

**The tests immediately exposed 6 real defects in the shipped implementations** (all fixed in
the same commit, with the failing test now the regression guard):

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `tDistCDF` ignored sign of t | F(-1.812, 10) = 0.94996 (true 0.05); F(-t)=1-F(t) violated | lower-tail branch added |
| 2 | `CHIDIST` wrong tail probabilities | CHIDIST(18.307,10)=0.9984 (true 0.05) | exact `gammq(df/2, x/2)` (Numerical Recipes series + Lentz CF) |
| 3 | `GAMMADIST` cumulative wrong | GAMMADIST(1,2,1,true)=1.0 (true 0.2642) | `gammp(alpha, x/beta)` |
| 4 | `CHIINV` bisected to its 100 ceiling | CHIINV(0.05,10)=100 (true 18.307) | fixed automatically once CHIDIST was exact |
| 5 | `WEEKDAY` returnType 2 mis-mapped | Sunday→1, Monday→2 (true: 7, 1) | corrected mapping |
| 6 | `EDATE` day overflow | 2024-01-31 + 1M = Mar 2 (Excel clamps to Feb 29) | day-clamp to target month length |
| 7 | `DEC2HEX`/`BIN2HEX` partial-parse garbage | parseInt("1f") === 1 | honest NaN when hex output contains a–f |

Also verified correct by the oracles (not "fixed" — confirmed): FDIST/FINV right-tail
convention (MC P(F≤1)=0.5373 vs 1−FDIST=0.5349), BETADIST, NORMDIST family, TDIST/TINV,
EXPONDIST, WEIBULL, BINOMDIST, POISSON, CONFIDENCE, FISHER, base conversions.
(One FormulaEngine perf test flaked at 13ms vs 5ms budget under coverage load; passes isolated —
same class as the documented `keyboardPerf` load-flake.)

## 4. Gate evidence (all measured locally, 2026-08-07)

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src --max-warnings 0` | 0 errors / 0 warnings |
| `money-adoption.mjs` | ratchet holds (231/906 frontend, server 2/23, 0 raw toFixed) |
| `mock-data-audit.mjs` | ✓ (wired=7, disclosed=16) |
| `verify-readme-stats.mjs` | ✓ |
| `docs-link-check.mjs --strict` | **0 broken links / 0 broken citations** (was 4 + 651) |
| Engines suite + coverage | **5,030 passed / 274 files; 73.30% stmts / 75.41% lines** |
| formula-functions suite | 196 passed (was 145) |
| engine-reachability | 181/181 reachable, 0 orphans |
| `_docs.test.ts` (help infra) | 7/7 |
| help + sdk tests | 74/74 |

## 5. Honest failure notes

1. **F-02 E2E remains UNVERIFIED_BLOCKED** — re-tried `npx playwright install chromium`
   (2026-08-07): Chrome for Testing download fails (CDN egress). Not faked; RELEASE_CHECKLIST
   box stays unchecked.
2. **Coverage is 75.41% lines on the engines layer, not the whole repo** — the CI threshold
   stays 50%; we report 75.41% for `src/engines/**` only and never re-claim ≥80% anywhere.
3. **GLOSSARY + STRATEGIC_DECISIONS_LOG + reports/** carry allowlisted stale citations by
   design** (historical records; documented in `docs-link-allowlist.json` with per-entry reasons).
4. **The deploy workflow** still fails on merges (pre-existing, env-bound, GAP-7 forbids
   workflow edits) — unchanged by this session.

## 6. Audit deliverable delta

- `reports/audit/ZERO_COMPROMISE_FINAL_AUDIT_v1.0.0_2026-08-07.md`: §8 row updated —
  "145-docs cleanup partially done" → **DONE** (with link-gate enforcement); coverage row
  updated to 73.30/75.41 with the 6 defect fixes as §5/§9 evidence.
- `GAP_LEDGER.md`: MISSION D entry added.
- `RELEASE_CHECKLIST.md`: docs box checked + MISSION D status block.
- `HANDOVER_PROMPT_SESSION7.md`: next-session handover.
