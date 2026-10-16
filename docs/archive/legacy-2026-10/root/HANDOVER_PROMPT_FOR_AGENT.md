# HANDOVER PROMPT — FinPlan Pro FP&A (Session 4)

> **SUPERSEDED (2026-08-11):** Historical handover. The current authoritative handover is `HANDOVER_PROMPT_SESSION10.md` (plus its addon, `HANDOVER_ADDON_SESSION10.md` if present / the SESSION10 file itself), and live state is in `_bmad/project-context.md` + `_bmad/reasoning-ledger.md`. Do not act on this file's statuses or next-actions.


**Repo:** `Warzonesiddiki/fp-A-betterversion`
**Previous working branch (PR #41, OPEN):** `arena/019fdb06-fp-a-betterversion` — **PR #41** "Forensic audit v1.0.0 (20-section): residual leftovers + P0/P1 remediations"
**Base:** `main` @ `b426149` (PR #40 merge). **Working dir:** `/home/user/fp-A-betterversion`
**User style:** YOLO autonomous, zero-compromise, ship green gates every turn. Persona: ARBITER — every claim needs evidence.

---

## 1. WORKFLOW INVARIANTS — NEVER BREAK (unchanged)

1. `node_modules` disappears between sandbox restarts — always `npm ci --no-audit --no-fund --legacy-peer-deps` first. It can also vanish **mid-session** (happened in S3 after adding a devDep) — rerun `npm ci` and re-run gates.
2. Git refs can silently reset — after npm ci, `git fetch origin && git log --oneline -3`; if session commits are missing locally but exist on origin, `git fetch origin <branch> && git reset --hard FETCH_HEAD`.
3. Post-commit hook auto-runs `scripts/update-tracker.mjs` + auto-commits PROGRESS_TRACKER.html. The tracker is now **fixed** (see §2) — do not re-break it: `countFiles` excludes tests, stat-sub regex consumes the whole div, delta pattern tolerates `+-`.
4. Ratchet: `timeout 90 node scripts/money-adoption.mjs` — frontend ≥229/910, rawToFixedSites 0 (frontend AND server).
5. GAP-7: do NOT touch `.github/workflows/**`.
6. No raw `.toFixed()` in financial paths; exact math via `@/utils/money`.
7. Git: `git commit --no-verify`, `git push origin HEAD --no-verify -u`. Work ONLY on the session branch.
8. CI runner starvation: judge on jobs that executed + local gates (PR #40/#41 precedent).

## 2. WHAT PR #41 SHIPPED (verify before building on it)

| Area | State |
|---|---|
| **P0 fake report data** | `ReportBookEngine.generateMockData` (hardcoded rows) + `ReportGenerator`/`BookBurstBuilder` (setTimeout fakes) GONE. New `src/engines/reportDataBuilder.ts` computes P&L/BS/CF/BvA from real GL+budget (money-exact). `/reports/book-builder` wired to glStore/budgetStore/entityStore. Dead components deleted (BookBurst*, ReportGenerator, BoardPackGenerator). |
| **P0 CSPRNG sweep (CWE-338)** | 80+ `Math.random()` security IDs → `src/utils/cryptoId.ts` (`crypto.randomUUID`, throws rather than degrade). Remaining Math.random = spreadsheet RAND, MC RNGs, jitter, demo seeding. |
| **P0 fake preview** | ReportDesigner now resolves metric cells from cube store (was `Math.random()*100000`). |
| **P1 skipped tests** | 8 unit + 1 a11y remediated (CopilotSidebar tracking, masterStorage.stress ×3 rewritten on sqlJsStorage mock, indexedDB via `fake-indexeddb` devDep, ScenarioBuilder **real worker-backed Monte Carlo** added, OnboardingWizard a11y-07). Remaining skip: q5-2 perf (E2E-covered). |
| **P2 claims truth** | Engines **181/181/0 orphans** (was 190/183/7 — benchmark fixtures + type-only miscounted). Coverage claim corrected (≥80% → 50 floor; **measured engine layer 71.3% stmts / 73.4% lines**). `verify-readme-stats.mjs` hardened (kebab-insensitive, excludes `.benchmark.`). |
| **P2 tracker heal** | `update-tracker.mjs`: test files excluded from source breakdown; stat-sub whole-div replacement (corruption healed, idempotent). |
| **P2 fiscal periods** | 22 sector dashboards now use `src/utils/fiscalPeriods.ts` (`buildFiscalPeriods` from real `FiscalCalendar` + org settings) — no more hardcoded demo lists. |
| **P2 hygiene** | Deleted BMAD tree (`_bmad/`, `_bmad-output/`), `agents/`, `plan and advice/`, `scripts/perf/*.txt`, stale MEASURED_RESULTS.md, `reports/junk/`. |
| **Deliverable** | `reports/audit/ZERO_COMPROMISE_FINAL_AUDIT_v1.0.0_2026-08-07.md` — 20-section audit: **113/116 (97.4%), Risk 🟢**; GAP_LEDGER updated. |

**Gate state on PR #41:** tsc 0 · eslint 0 · ratchet holds · docs:verify pass · a11y 442/1 · build+bundle pass · **full suite 11,998 passed / 1 skipped / 1 load-flake** (`DataGrid.keyboardPerf` 109.9ms vs 100ms under load; passes 3/3 isolated — do NOT weaken; same disposition as PR #40).

## 3. FIRST STEPS (Session 4)

```bash
cd /home/user/fp-A-betterversion && git status && git branch --show-current && git log --oneline -5
# if PR #41 not yet merged: work continues on arena/019fdb06-fp-a-betterversion (or fetch origin/main after merge)
npm ci --no-audit --no-fund --legacy-peer-deps
node node_modules/typescript/bin/tsc --noEmit && \
node node_modules/eslint/bin/eslint.js src --cache --max-warnings 0 && \
timeout 90 node scripts/money-adoption.mjs && node scripts/verify-readme-stats.mjs
git fetch origin && git log --oneline -3 origin/main
```

## 4. RESIDUAL LEFT-OVERS (verified open — work these next)

1. **F-01 (P2): Period close has NO client UI.** Server API complete (`server/src/routes/periods.ts`: open/close/reopen/audit, `requireRole('Admin')`) + engines (`PeriodCloseStateMachine`, `PeriodLockEngine`) + tests — but no route/page. Build the client page (the single FAIL in the all-in-one verdict). Logged in GAP_LEDGER + audit report.
2. **F-02 (P2, ENV-BOUND): Playwright E2E** unexecutable in sandbox (browser CDN egress blocked). If egress opens, run `npx playwright install chromium` + at least `e2e/smoke.spec.ts` + `e2e/a11y/q5-temporal/*`. Keep RELEASE_CHECKLIST box unchecked until executed.
3. **145 codif/endorsement docs cleanup** — PARTIAL. Deleted BMAD/agents/plan-and-advice; `docs/` still ~6.5MB / 300+ files of process artifacts. Sweep per `reports/junk/junk_files_list.md` was deleted — regenerate the list or triage `docs/` (keep ARCHITECTURE.md, security/tech docs, a11y specs; delete muse-scratch/cycle/leader/turn-* ritual docs).
4. **RELEASE_CHECKLIST unchecked boxes** (be honest): Full E2E execution, SQLite persistence E2E (Tauri), full axe-core audit on all pages (browser), final user-guide review, Tauri build/NSIS/auto-update (env-bound — keep documented).
5. **Mock-data-audit remainder:** `mock-data-audit.mjs` still lists 39 files / 45 synthetic arrays (DashboardTemplate mockKPIs, FXPositionGrid SAMPLE_POSITIONS, HedgeManager SAMPLE, sector mockPeriods now real — verify the rest are documented demo defaults, not fake features). Each remaining site needs a demo-vs-fake disposition in the audit report.
6. **`DataGrid.keyboardPerf` 100ms gate**: only if you want — percentile-of-samples assertion or budget raise, but NOT without evidence (passes 3/3 isolated; it's load noise).
7. **Coverage**: engine layer measured 71.3%/73.4% (recorded). If you want to push toward the corrected claim, add coverage for the lowest engine dirs — but do NOT re-claim ≥80% unless measured.
8. **Dependency hygiene**: `npm outdated` shows routine updates (radix 1.1.x→1.2.x, sentry, playwright) — bump in a dedicated PR if desired; audit gate must stay 0.

## 5. PR / COMMIT STRATEGY

- PR #41 is the single PR for this session's work. If it merges, base new work on the merge commit.
- Any F-01 period-close UI = a NEW PR (feature). Residual docs/cleanup can ride along or be its own PR.
- CI: expect starvation; judge per §1.8.

## 6. KEY FILES (updated this session)

- `src/utils/cryptoId.ts` (randomId — CSPRNG ids)
- `src/engines/reportDataBuilder.ts` + `reportDataBuilder.test.ts` (real report rows)
- `src/utils/fiscalPeriods.ts` + test (real fiscal periods)
- `src/components/reports/ReportBookBuilder.tsx` (real-data report book)
- `scripts/verify-readme-stats.mjs`, `scripts/update-tracker.mjs` (hardened)
- `reports/audit/ZERO_COMPROMISE_FINAL_AUDIT_v1.0.0_2026-08-07.md` (THE audit deliverable)
- GAP_LEDGER.md (latest entry = ZCFA-2026-08-07-003)

## 7. FINAL NOTE

PR #41 proved the audit method works: the "190/183/7" headline, the "≥80% coverage" claim, and 22 demo period pickers were all real findings hiding behind plausible-looking numbers — plus one more fake-data surface (BoardPackGenerator) found on the way out. F-01 (period-close UI) is the last genuine gap between the product and its "all-in-one" claim. Be honest where things are env-bound (E2E, Tauri). Keep the ratchet ≥229/0, never touch workflows, ship green gates every turn.
