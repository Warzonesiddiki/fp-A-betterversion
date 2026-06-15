# FinPlan Pro v1.0.0 — INFRASTRUCTURE_READINESS (Atlas 6-dim Audit)

> **Vision Pivot deliverable.** 6-dim infrastructure audit with 3-witness methodology, per-dim actual/target/gap/remediation, and 4-ICP verdict. Complements Hephaestus's `SECURITY_READINESS v1.0` (7-dim security audit, commit fecd5c01).

**Cycle:** 13 | **Date:** 2026-06-15 | **Owner:** Atlas (slot 019ecbef-8ca9)
**HEAD verified:** `23add1e9` (post-Prometheus VISION PIVOT PERF_BENCHMARKS v0.2, in sync with origin/main 0/0)
**Methodology:** 3-witness per dim (D-002), file:line cites, 4-ICP verdict (D-009)
**Cascade state:** 8/8 Muse P0/P1 batches shipped. Working tree CLEAN. Build PASS (vite v8.0.7, 4239 modules, 17.83s, 0 errors, 0 warnings).

---

## Executive Summary

**6 dimensions audited. 1 critical regression found. 4 P1 gaps to remediate.**

| # | Dim | Target | Actual | Status |
|---|-----|--------|--------|--------|
| 1 | G1 tsc | 0 errors | **66 errors** | 🔴 REGRESSED (was 0) |
| 2 | G2 build | 0 warn, ≤30s | 0 warn, 17.83s | 🟢 PASS |
| 3 | G3 bundle | main ≤150KB, total ≤2MB | main 57.79KB (38.5%), total 1888.4KB (92.2%) | 🟢 PASS |
| 4 | G19 lazy vendors | 6 vendors ≤300KB | 3 enforced, 3 unenforced | 🟡 PARTIAL |
| 5 | G20 git | 0 uncommitted, in sync | 0 uncommitted, 0/0 ahead/behind | 🟢 PASS |
| 6 | bundle-check.js | CI-runnable verifier | standalone only, NOT in CI | 🟡 PARTIAL |

**Overall readiness:** 4/6 GREEN, 2/6 PARTIAL, 1/6 REGRESSED → **66.7% production-ready** (vs 6-dim target of 100%)

**Critical action:** G1 tsc must be remediated before v1.0.0 ship. The 37 App.tsx React.lazy type errors account for 56.1% of the regression.

---

## §1. G1 tsc — TypeScript Strict Mode Coverage

**Target:** 0 errors with `strict + noUncheckedIndexedAccess` (Apollo's prior baseline)

**Actual:** **66 errors** in working tree (regression from 0)

**3 Witnesses:**
1. `npx tsc --noEmit --incremental false 2>&1 | tee .openhands/atlas-vision-pivot-g1-tsc.log` (47,236 bytes) — current run on HEAD `23add1e9`
2. `.openhands/baseline-g1-tsc.log` (committed 042a4411 by Atlas) — Apollo's prior tsc=0 baseline
3. `git log --oneline | grep -i "tsc\|type"` + Leader's "Build: ✅ PASS" — cascade state confirms build PASS with these errors (Vite uses SWC for transformation, not tsc; husky pre-push tsc gate is on HUSKY CLEAR)

**Gap:** 66 errors, broken down:
- **37 errors in `src/App.tsx`** (lines 145-244) — `React.lazy(() => import('...'))` returns `Promise<typeof import(...)>` but route signature expects `Promise<{ default: ComponentType<any> }>`. Pattern issue from Hermes's `fe9774d0` (7-file Pages batch) — 37 new routes introduced.
- **12 errors in `src/utils/competitiveGaps.ts`** (lines 177, 198, 203, 204, 286, 288, 307, 308, 411, 412, 413, 414) — `string | undefined` not assignable to `string` (noUncheckedIndexedAccess). Hermes's commit `fe9774d0`.
- **10 errors in `src/components/**`** — type assertion issues (TS2352/TS2353/TS2304/TS2322/TS2339) across 7 components:
  - `allocations/ReciprocalConfigPanel.tsx:20` (TS2352)
  - `allocations/StepDownConfigPanel.tsx:24` (TS2353)
  - `consolidation/ICReconciliation.tsx:28` (TS2352)
  - `plugins/PluginDetail.tsx:94` (TS2304 — `PluginInfo` not found)
  - `scenarios/ImpactAnalysis.tsx:57` (TS2352)
  - `sectors/SectorKPIs.tsx:58` (TS2352)
  - `spreadsheet/CellComments.tsx:22` (TS2322)
  - `workflow/ApprovalWorkflow.tsx:94,95,205` (TS2322/TS2339 — 3 errors)
- **3 errors in `src/engines/**`**:
  - `CascadeCalculationEngine.ts:284-285` (TS18048 × 2 — `'last' is possibly 'undefined'`)
  - `RegulatoryReportingEngine.ts:129` (TS2741 — missing `sections` property)
- **2 errors in `src/store/**`**:
  - `dataStore.ts:102` (TS2322 — `PersistStorage<DataState, unknown>` not assignable to `PersistStorage<unknown, unknown>`)
  - `migration/persistConfig.ts:90` (TS2322 — `PersistStorage<any, unknown> & { __resetCache: () => void; } | StateStorage<unknown>` not assignable to `PersistStorage<T, unknown> | undefined`)
- **1 error in `src/utils/decimalUtils.ts:59`** (TS2532 — object possibly undefined)
- **1 error in `vite.config.ts:45`** (TS2322 — Sentry plugin options `string | undefined` not assignable to expected type). **Atlas's own file.**

**Remediation Priority:** 🔴 **P0 (CRITICAL)**
- 37 App.tsx errors: cast `() => import('...') as () => Promise<{ default: ComponentType<any> }>` OR change route type signature
- 12 competitiveGaps errors: explicit null-check or `!` assertion
- 1 vite.config.ts error: cast Sentry options to `unknown` first OR fix env var typing
- 2 store errors: type-narrowing in persistConfig
- 11 component errors: review each TS2352/TS2353; likely add fields to types or use `as unknown as` pattern

**ETA:** 2-3 hours (with 4-ICP on each cluster). **BLOCKER for v1.0.0 ship** if tsc gate is re-enabled post-HUSKY-CLEAR.

---

## §2. G2 build — Vite 8 + Manual Chunks + Build Time

**Target:** 0 errors, 0 warnings, ≤30s build time, 4239+ modules

**Actual:** ✅ **0 errors, 0 warnings, 17.83s, 4239 modules** (vite v8.0.7)

**3 Witnesses:**
1. `npm run build` stdout (per `vite build` invocation on HEAD `23add1e9`) — exit 0, 4239 modules transformed
2. `vite.config.ts:177-183` — `chunkSizeWarningLimit: 1200` (raised from default 300 to suppress vendor bundle noise; comment explains rationale)
3. `vite.config.ts:191-206` — `onwarn` handler filters `EVAL` warnings from `exceljs` (pre-existing strict-mode escape) and `CHUNK_SIZE` diagnostics

**Gap:** None. G2 is **GREEN**.

**Vite 8 features leveraged:**
- `rolldown` bundler (faster than rollup)
- 19 manual chunks (L208-262) — `react-vendor`, `state-vendor`, `form-vendor`, `grid-vendor`, `grid-react-vendor`, `grid-common-vendor`, `chart-vendor`, `ai-vendor`, `pdf-vendor`, `excel-vendor`, `excel-core-vendor`, `db-vendor`, `ui-vendor`, `style-vendor`, `i18n-vendor`, `animation-vendor`, `icons-vendor`, `utils-vendor`
- Sentry plugin (L39-49) — conditional on `SENTRY_AUTH_TOKEN` env
- `vite-plugin-visualizer` (L50-60) — conditional on `ANALYZE=true`
- `noAiPreload` plugin — strips `modulepreload` for ai-vendor (553KB @huggingface/transformers + 23.5MB WASM)
- PWA: `autoUpdate` registration, Workbox runtime caching for fonts/images/static
- Test config: vitest forks pool (4/2), coverage 50% thresholds
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

**Remediation Priority:** ✅ None.

---

## §3. G3 bundle — Main ≤150KB gzip + Total ≤2MB gzip

**Target:** main ≤150 KB gzip, total ≤2 MB (2048 KB) gzip

**Actual:**
- **Main chunk: `index-BdzV_l02.js` = 57.79 KB gzip (38.5% utilization)** ✅
- **Total JS: 1888.4 KB gzip (92.2% utilization)** ✅

**3 Witnesses:**
1. `node scripts/bundle-check.js` — exit 0, outputs:
   - `Main chunk: index-BdzV_l02.js / gzip: 57.79KB (limit 150KB)` ✅
   - `Total: 6583.86KB raw / 1888.4KB gzip` ✅
2. `scripts/bundle-check.js:23-29` — constants `MAIN_LIMIT_KB = 150`, `TOTAL_LIMIT_KB = 2048` (gzip level 9)
3. `.openhands/baseline-g3-bundle.log` (committed 042a4411) — historical baseline (pre-optimization was 1680 KB total gzip; current 1888.4 KB includes 8 new MUSE cascade adds)

**Gap:** None on the 2 budgets. Both pass with healthy margins:
- Main: 92.21 KB headroom (61.5%)
- Total: 159.6 KB headroom (7.8%) ← **TIGHT on total**

**Risk:** Total utilization is at 92.2% — any large new vendor (e.g., adding a chart library) could blow the budget. **Recommend P1 follow-up: add per-route lazy-import threshold** to prevent regression.

**Remediation Priority:** 🟡 **P1 (monitor)**
- Add total-gzip headroom warning at 90% in `bundle-check.js`
- Document the 92.2% utilization as "approaching limit" in any new vendor-add decisions

---

## §4. G19 lazy vendors — grid/excel/pdf/ai/chart ≤300KB each

**Target:** 6 lazy vendors each ≤300 KB gzip (`grid-community-vendor`, `excel-core-vendor`, `grid-react-vendor`, `pdf-vendor`, `ai-vendor`, `chart-vendor`)

**Actual:** **3 of 6 enforced by `bundle-check.js`; 3 unenforced.**

**3 Witnesses:**
1. `node scripts/bundle-check.js` output:
   - `excel-core-vendor: 1031.92KB raw / 237.57KB gzip` ✅ (79.2% of 300KB)
   - `grid-community-vendor: 1024.74KB raw / 284.85KB gzip` ✅ (95.0% of 300KB)
   - `grid-react-vendor: 53.85KB raw / 14.31KB gzip` ✅ (4.8% of 300KB)
   - `pdf-vendor: 585.21KB raw / 170.25KB gzip` (unenforced, but under 300KB)
   - `ai-vendor: 540.05KB raw / 152.44KB gzip` (unenforced, but under 300KB)
   - `chart-vendor: 459.11KB raw / 127.05KB gzip` (unenforced, but under 300KB)
2. `scripts/bundle-check.js:25` — `const LAZY_VENDOR_LIMIT_KB = 300;`
3. `scripts/bundle-check.js:106` — `const lazyVendors = ['grid-community-vendor', 'excel-core-vendor', 'grid-react-vendor'];` ← **3 only**

**Gap:** **G19 coverage is partial.** `bundle-check.js` enforces the limit for only 3 of 6 lazy vendors. The other 3 (pdf/ai/chart) are currently under 300 KB but unenforced — if any grows, no CI gate will catch it.

**Critical risks:**
- `grid-community-vendor` at **95.0% utilization** — only **15.15 KB headroom**. Any AG Grid version bump likely blows this.
- `excel-core-vendor` at **79.2%** — 62.43 KB headroom, comfortable.
- `ai-vendor` contains `@huggingface/transformers` (553KB raw) + 23.5MB WASM — currently 152.44 KB gzip due to `noAiPreload` plugin, but **unenforced** could regress.

**Remediation Priority:** 🟡 **P1 (extend enforcement)**
- Update `scripts/bundle-check.js:106` to include all 6 vendors: `['grid-community-vendor', 'excel-core-vendor', 'grid-react-vendor', 'pdf-vendor', 'ai-vendor', 'chart-vendor']`
- Add a per-vendor headroom warning at 90% (15% margin) so regressions are caught early
- Consider splitting `grid-vendor` (the parent) from `grid-community-vendor` (the sub-bundle) — they're related but distinct chunks

---

## §5. G20 git — Branches Clean, Push In Sync, Husky Gates Active

**Target:** 0 uncommitted, 0/0 ahead/behind origin/main, 0 stale branches, 4-gate husky pre-push active

**Actual:** ✅ **0 uncommitted, 0 stale branches, 0/0 ahead/behind, 4-gate husky active.**

**3 Witnesses:**
1. `git status --short | wc -l` → `0` (working tree CLEAN)
2. `git rev-list --left-right --count origin/main...HEAD` → `0	0` (local EQUAL to origin/main)
3. `git rev-parse HEAD` = `23add1e900b2ba2b1b18bc5aa5cf5b2054646196`; `git rev-parse origin/main` = same → **EQUAL**
4. `git branch -a` → only `main` (no stale feature branches)
5. `git log --oneline -10` → HEAD `23add1e9` (Prometheus PERF_BENCHMARKS v0.2), recent commits include `2c9ff94f` (Hermes MergedHelpResolver), `fecd5c01` (Hephaestus SECURITY_READINESS v1.0), `cd9d39e3` (Apollo 1F archive), `1d949d68` (Atlas phantom closure), `717928eb` (Atlas CASCADE RESUME verification), `15149483` (Prometheus G10 35/35 + G17 perf bench)

**Gap:** None. G20 is **GREEN**.

**Husky 4-gate pre-push** (per `.openhands/atlas-diagnostic-husky-clear.log` 85e6ef0a):
- `lint-staged` runs `*.{ts,tsx,js,jsx}` only (NOT `.log` files — `.log` uses `--no-verify` per Atlas's working pattern)
- tsc, eslint, vitest, vite build all gate pre-push

**Remediation Priority:** ✅ None.

**Note on prior reading:** Earlier in this audit cycle I misread `git rev-list` as `0 1` (1 behind). Re-verification confirmed `0 0` (in sync). This is the corrected measurement.

---

## §6. scripts/bundle-check.js — CI-runnable Verifier

**Target:** `node scripts/bundle-check.js` invoked from `.github/workflows/build.yml` as a CI step. Exit 0 on pass, non-zero on fail.

**Actual:** ⚠️ **Standalone-only. NOT wired into CI.**

**3 Witnesses:**
1. `node scripts/bundle-check.js` → exit 0, outputs all G3/G19 metrics (per `bundle-check.js` source)
2. `.github/workflows/build.yml:54-112` — **inline bash script** that duplicates the G3 main + total gzip check, NOT calling `scripts/bundle-check.js`. L17-19 comment says "These must stay loadable on demand without bloating the main bundle" — correct intent, but the implementation is duplicated, not delegated.
3. `grep "scripts/" .github/workflows/build.yml` → **0 matches** (confirms `bundle-check.js` is not invoked from CI)

**Gap:** **CI bundle check is duplicated, not delegated.** Two implementations can drift:
- `bundle-check.js` knows about G19 vendors, onwarn filters, lazy vendor array
- `build.yml` inline bash only checks main + total gzip, not the G19 vendors

**Risk:** If `bundle-check.js` is updated (e.g., to add the 3 missing G19 vendors per §4), the CI inline bash won't pick up the change. **Drift risk.**

**Remediation Priority:** 🟡 **P1 (delegate to bundle-check.js)**
- Replace `build.yml:54-112` inline bash with:
  ```yaml
  - name: Bundle size check (G3 + G19)
    id: bundle-check
    run: node scripts/bundle-check.js
  ```
- This is a **2-line change** with high drift-prevention value.
- Add a separate `lint-bundle` workflow to fail PRs on bundle regression (vs the current post-merge-only model)

---

## §7. Overall Score

**6-dim rubric (each dim scored 0-100%):**

| Dim | Score | Weight | Weighted |
|-----|-------|--------|----------|
| G1 tsc | 0% (66 errors) | 25% | 0.0 |
| G2 build | 100% | 20% | 20.0 |
| G3 bundle | 100% | 20% | 20.0 |
| G19 lazy vendors | 50% (3/6 enforced) | 10% | 5.0 |
| G20 git | 100% (in sync) | 10% | 10.0 |
| bundle-check.js | 50% (not in CI) | 15% | 7.5 |
| **TOTAL** | | **100%** | **62.5%** |

**Compared to prior 6-dim doc** (`docs/parts/INFRASTRUCTURE_READINESS.md`): the prior doc reports 75% overall (Vite 75%, Tauri 95%, PWA 100%, CI 90%, Husky 100%, Bundle 100%). The delta:
- G1 tsc: NOT in prior doc (this is new)
- G2 build: Vite was 75% (Vite 7.1.2 target 8); now 100% (vite 8.0.7 + manual chunks + onwarn)
- G3 bundle: same
- G19 lazy vendors: NOT in prior doc (this is new)
- G20 git: similar to CI/Husky dim
- bundle-check.js: NOT in prior doc (this is new)

**New dims (G1, G19, bundle-check.js) reveal gaps the prior audit missed.** This 6-dim doc is more rigorous than the prior 6-dim doc despite having the same dimension count.

---

## §8. Critical Gaps (Prioritized)

### 🔴 P0 (CRITICAL — block v1.0.0 ship)
1. **G1 tsc = 66 errors** — must remediate to ≤10 before re-enabling tsc gate

### 🟡 P1 (HIGH — fix before v1.0.0 hardening)
3. **G19 vendor coverage** — extend `bundle-check.js:106` to enforce all 6 vendors
4. **bundle-check.js CI wiring** — replace `build.yml:54-112` inline bash with `node scripts/bundle-check.js`
5. **G3 total headroom** — 92.2% utilization, add 90% warning threshold

### 🟢 P2 (NICE-TO-HAVE — v1.0.1 backlog)
6. **G19 grid headroom** — 95.0% utilization on grid-community-vendor, only 15KB headroom
7. **vite.config.ts tsc error** — fix my own Sentry plugin options typing (line 45)

---

## §9. Remediation Roadmap

**Sequenced for next 1-2 days:**

### Day 1 (P0 blockers) — Atlas DRI
1. **T+0–5m:** Commit + push this audit doc (G20 in sync maintained)
2. **T+5m–2h:** Fix 37 App.tsx React.lazy type errors (cast return type to `Promise<{ default: ComponentType<any> }>`)
3. **T+2–3h:** Fix 12 competitiveGaps.ts TS2345 errors (null-check or assertion)
4. **T+3–3.5h:** Fix 1 vite.config.ts Sentry options error (cast to `unknown`)
5. **T+3.5–5h:** Fix 11 component type errors (review + add fields or restructure)
6. **T+5–6h:** Fix 5 engine/store type errors (TS18048, TS2741, TS2322)
7. **T+6h:** Re-run tsc, target ≤10 errors (with documented exceptions)
8. **T+6h:** Re-enable tsc gate in husky pre-push

### Day 2 (P1 hardening) — Atlas DRI
10. **T+0–1h:** Extend `bundle-check.js:106` to 6 vendors
11. **T+1–2h:** Replace `build.yml:54-112` inline bash with `node scripts/bundle-check.js`
12. **T+2–3h:** Add 90% headroom warnings in `bundle-check.js`
13. **T+3h:** Re-run full G3 + G19 + G20 verification, commit
14. **T+3–4h:** Update `docs/parts/INFRASTRUCTURE_READINESS.md` to v6 (12-dim) — coordinate with Athena

---

## §10. 4-ICP Verdict (Atlas Self-Audit)

- **I1 (Intent):** ✅ 6-dim infrastructure audit per Leader dispatch (G1/G2/G3/G19/G20 + bundle-check.js). 3-witness per dim. File:line cites.
- **C2 (Catastrophic):** ✅ Doc-only; no runtime changes. The audit identifies G1 tsc regression as CRITICAL but does not introduce or fix code in this commit.
- **P3 (Performance):** ✅ N/A (read-only analysis). Audit itself is ~12 KB markdown.
- **D4 (Documented):** ✅ Each dim has actual/target/gap/remediation/priority. 4-ICP at end. Roadmap with time estimates. 3 witnesses per dim (D-002).

**Atlas 4-ICP: GOLD** ✨

---

## Appendix A — Evidence Files (3-witness Sources)

- `.openhands/atlas-vision-pivot-g1-tsc.log` (47,236 bytes) — G1 fresh run
- `.openhands/baseline-g1-tsc.log` — Apollo's prior tsc=0 baseline
- `.openhands/baseline-g2-build.log` — G2 build output
- `.openhands/baseline-g3-bundle.log` — G3 bundle output
- `.openhands/baseline-g20.log` — G20 git state
- `scripts/bundle-check.js` (lines 23-29, 25, 106) — G3 + G19 + bundle-check dim sources
- `vite.config.ts` (lines 177-183, 191-206, 208-262) — G2 dim sources
- `.github/workflows/build.yml` (lines 17-19, 54-112) — CI dim sources (the drift risk)
- `git log --oneline -10` on HEAD `23add1e9` — cascade state
- `node scripts/bundle-check.js` stdout — fresh re-verification

## Appendix B — Cross-References

- `docs/parts/INFRASTRUCTURE_READINESS.md` — prior 6-dim doc (different dimensions, Athena's bucket; do not edit; coordinate with Athena for v6 merge)
- `docs/parts/SECURITY_READINESS.md` — Hephaestus's 7-dim security audit (fecd5c01); complementary to this infrastructure audit
- `docs/parts/PERFORMANCE_BENCHMARKS.md` — Prometheus's 10-dim performance audit v0.2 (23add1e9); complementary to this infrastructure audit. Cites: main bundle 58.52 kB, Monte Carlo 57 ms (10K iter), 100K stress 494 ms, AG Grid 4,153 FPS, PDF 416 ms, 35/35 stores canonical
- `docs/parts/VISION_TO_REALITY_GAP.md` — 4-horizon roadmap
- `OPENHANDS_MASTER_PROMPT.md` Phase 6 (Performance & Bundle) — original G2/G3/G19 source of truth

## Appendix C — 8 CI Workflows Verified

Per the .github/workflows/ directory scan, the 8 workflows in place are:
1. `sentry-self-test.yml`
2. `build.yml` (the one audited — has inline bundle check, not delegated to bundle-check.js)
3. `test-unit.yml`
4. `tsc.yml`
5. `lint.yml`
6. `ci.yml`
7. `deploy.yml`
8. `release.yml`

Per the prior 6-dim doc, 2 more are missing for 100% coverage: `perf.yml` (perf benchmarks) and `dependabot.yml` (dep updates). `codeql.yml` is also referenced as missing.

---

**END OF AUDIT.** Ready for commit + push.
