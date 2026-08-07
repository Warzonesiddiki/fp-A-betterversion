# HANDOVER PROMPT — FinPlan Pro FP&A (Session 7) — POST-MISSION D

**Repo:** `Warzonesiddiki/fp-A-betterversion`

**Base:** `main` @ `60e0d4a` (PR #42 MERGED) + MISSION D branch `arena/019fdccc-fp-a-betterversion` → **PR #43 OPEN** (docs triage + coverage + defect fixes).

**User style:** YOLO autonomous, zero-compromise, aggressive progress. Ship green gates every turn. Persona: ARBITER — every claim needs evidence.

> ⚠️ **SESSION 7 GOAL — do NOT reopen shipped territory; push the remaining measured gaps.** Mission D (docs triage + coverage depth + 6 real defect fixes) is DONE and sitting in PR #43. Remaining per the audit: F-02 E2E (env-bound), coverage can go deeper (75.41% lines on engines only), dep bumps (radix/sentry/playwright), server-side period-close sync (client currently never calls the desktop server). New surface ideas in §6. A session that ends without a merged wave + green gates is a failed session.

---

## 1. Critical Workflow & Architectural Invariants — NEVER BREAK

1. `node_modules` can vanish mid-session. Always: `cd /home/user/fp-A-betterversion && npm ci --no-audit --no-fund --legacy-peer-deps`. Re-run gates after any npm change.

2. Git refs can silently reset. After npm ci: `git fetch origin && git log --oneline -3 origin/main`. **Origin/main is the source of truth.** If local history looks wrong, `git diff <commit> FETCH_HEAD --stat`; if the working tree equals FETCH_HEAD + your change, `git reset --soft FETCH_HEAD` and recommit (this exact reset happened in S5).

3. Post-commit hook auto-runs `scripts/update-tracker.mjs` + auto-commits PROGRESS_TRACKER.html (it ran in S6 even with `--no-verify` — expected, eyeball the diff).

4. **Ratchet:** `timeout 90 node scripts/money-adoption.mjs` — frontend ≥231/906 (25.5%), rawToFixedSites 0 (frontend AND server). Never raise the baseline file. S6 deleted `src/engines/shared/` (0 adopters) — ratio still holds (231/900).

5. **GAP-7:** do NOT touch `.github/workflows/**`.

6. No raw `.toFixed()` in financial paths — `formatMoney/formatPercent/formatNumber/formatCompactNumber` + `@/utils/money`.

7. Git: `git commit --no-verify`, `git push origin HEAD --no-verify -u`. ONE PR against `main` per wave-group.

8. CI reality: runner starvation is real; judge on executed jobs + local gates. Missing `PAGE_HELP` in `src/pages/_docs.ts` + `_routeHelpMap.ts` for a new route = #1 CI killer.

9. Money ratchet applies to NEW code.

10. **NEW (S6, ENFORCED):** `scripts/docs-link-check.mjs --strict` (`npm run docs:links`) — **0 broken links / 0 broken citations** required. Any new `.md` must have resolvable links/citations. Deliberate exceptions go in `scripts/docs-link-allowlist.json` WITH a dated reason (historical logs, `reports/**`, forward-refs). Do NOT allowlist your way out of fixing a kept doc.

11. **Persisted stores:** any NEW zustand store MUST be in `PERSISTED_STORE_KEYS` (`src/utils/persistedStores.ts`) in the SAME commit (`backupRestore.test.ts` scans src/store).

## 2. Current State After MISSION D (PR #43 OPEN, branch `arena/019fdccc-fp-a-betterversion`)

| Area | State |
|---|---|
| Version | 1.0.0 everywhere |
| Lint / tsc | 0 errors / 0 warnings (local; CI pending on PR #43) |
| Money ratchet | 231/906, 0 toFixed; server 2/23, 0 toFixed |
| **Docs corpus** | **112 files / 1.7MB** (was 321 / 5.8MB); `docs-link-check.mjs --strict` = **0/0** (was 4 hard + 651 soft); allowlist = historical logs (STRATEGIC_DECISIONS_LOG, GLOSSARY), reports/**, handovers, forward-refs |
| **Engines coverage** | **73.30% stmts / 75.41% lines** (was 71.32/73.44); **5,030 tests / 274 files** (was 4,940) |
| **Real defects fixed** | 6: tDistCDF sign symmetry; CHIDIST/GAMMADIST(cum) tail probabilities (now exact gammp/gammq — NR series + Lentz CF); CHIINV (was bisecting to 100); WEEKDAY returnType-2 mapping; EDATE day-clamp (Jan 31 + 1M = Feb 29); DEC2HEX/BIN2HEX honest NaN (was parseInt("1f")===1 partial garbage) |
| Dead code removed | `src/engines/shared/` (6 files, 0 importers/0 tests/0 manifest) — reachability still 181/181, 0 orphans |
| formula-functions suite | 196 passed (was 145) |
| Help infra | `_docs.test.ts` 7/7; help + sdk 74/74 |
| Close engines + store + page (S5) | unchanged, still green (120 tests) |
| a11y | 448 passed / 1 skipped (S5 state) |
| Mock-data | 17 files / 23 arrays → 7 wired, 16 disclosed, 0 left; script-enforced |
| Period close (F-01) | SHIPPED + MERGED (PR #42) — do not reopen |
| E2E | STILL UNVERIFIED_BLOCKED (Chrome for Testing CDN download fails; re-tried 2026-08-07) |
| Deploy workflow | fails on every merge since PR #37 (pre-existing env-bound; GAP-7 forbids editing workflows) |

### CI notes for PR #43 (read before panicking about red checks)
- `test-unit.yml` has `timeout-minutes: 15` but the suite takes ~22 min → cancelled at 15:00 (config issue; GAP-7 — record, don't fix).
- `ci.yml` Unit Tests can flake under runner contention: `DataGrid.keyboardPerf` (documented load-flake, pass 4/4 isolated) AND `FormulaEngine.performance` "extract dependencies < 5ms" (flaked at 13ms under coverage load in S6, passes isolated). Both are env noise, both documented — **do NOT weaken the tests**.
- PR #40/#41 precedent: merged with red unit-test jobs. Judge per §1.8.

## 3. Immediate First Steps

```bash
cd /home/user/fp-A-betterversion && git fetch origin && git log --oneline -3 origin/main

# if PR #43 is merged, start a FRESH session branch from main:
npm ci --no-audit --no-fund --legacy-peer-deps
node node_modules/typescript/bin/tsc --noEmit && \
node node_modules/eslint/bin/eslint.js src --cache --max-warnings 0 && \
timeout 90 node scripts/money-adoption.mjs && \
node scripts/mock-data-audit.mjs && \
node scripts/verify-readme-stats.mjs && \
node scripts/docs-link-check.mjs --strict

# then READ §5
```

## 4. Files To Reuse / Study (mission-critical, all SHIPPED + tested)

- **Docs-link gate (NEW, S6):** `scripts/docs-link-check.mjs` + `scripts/docs-link-allowlist.json` (`npm run docs:links`)
- **Coverage + defect fixes (NEW, S6):** `src/engines/formula-functions/helpers.ts` (gammp/gammq, tDistCDF), `statistical.ts` (CHIDIST/GAMMADIST), `text.ts` (EDATE/WEEKDAY), `math.ts` (hex); oracle tests: `helpers.test.ts`, `statistical.dist.test.ts`, `text.date.test.ts`, `math.ext.test.ts`
- **Period close (S5):** `src/pages/periods/PeriodClosePage.tsx`, `src/store/periodCloseStore.ts`, `src/utils/periodCloseReadiness.ts`
- **RBAC:** `src/utils/rbacEnforcer.ts`, `src/store/authStore.ts`
- **Close engines:** `FinancialCloseEngine.ts`, `PeriodCloseStateMachine.ts`, `PeriodLockEngine.ts`, `PeriodCloseEngine.ts`
- **Server API:** `server/src/routes/periods.ts` (POST /:id/transition modern path; /close legacy)
- **Help infra (CI killer):** `src/pages/_docs.ts`, `_routeHelpMap.ts`, `_docs.test.ts`
- **Gate scripts:** `scripts/money-adoption.mjs`, `mock-data-audit.mjs`, `verify-readme-stats.mjs`, `update-tracker.mjs`, `docs-link-check.mjs`
- **Closeout evidence:** `reports/mission-d-closeout-2026-08-07.md` (triage manifest + defect table + gate evidence)
- **Conventions:** `GAP_LEDGER.md` (MISSION D entry at bottom), `RELEASE_CHECKLIST.md` (MISSION D status block), `MASTER_ROADMAP.md`

## 5. MISSION E — RESIDUAL GAPS (pick the highest-leverage; do not re-open D or C territory)

1. **PR #43 merge watch** — the S6 wave is ONE PR against main: docs triage + coverage + defect fixes + closeouts. If it isn't merged by session start, verify CI, merge, rebase the fresh branch.
2. **Coverage deeper:** 75.41% lines is engines-only. Next drags: `src/engines/formula-functions/financial.ts` (21.65% in-dir), `lookup.ts` (29.56% in-dir), `logical.ts` (20.89% in-dir — has 18 tests but 359-line file), `math.ts` (4.8% in-dir → 34.93% engines-wide). A financial.ts oracle pass (PV/FV/NPV/IRR known-answers) is the single biggest remaining line bank. Record honestly; never re-claim ≥80%.
3. **E2E:** retry `npx playwright install chromium` — if egress opens, run `e2e/smoke.spec.ts` + `e2e/a11y/q5-temporal/*` (the q5-temporal README was ref-fixed in S6) and update RELEASE_CHECKLIST honestly.
4. **Dep bump PR:** radix/sentry/playwright minor updates — only if audit stays 0 and gates pass.
5. **Server-side period close:** client calls no server API in offline mode; wire `/periods/:id/transition` sync when the desktop server is present (graceful degradation); extend `server/src/routes/periodCloseLifecycle.test.ts`.
6. **Docs hygiene remainder (small):** root-level process files (AUDIT_REPORT_V3*, OMEGA_DEEP_AUDIT_PASS, PLAN, PROJECT_BACKLOG, PROJECT_INDEX, REMEDIATION_REPORT, COMPLETION_TASKLIST) are allowlisted historical records; a future cleanup could move them under `reports/archive/` — LOW priority, they're root-level not docs/.

## 6. OVERFLOW / NEW SURFACE (only after §5 items)

- Period-close companion surfaces: "close calendar" year view, SLA breach surfacing (`PeriodCloseEngine.getSLABreaches`), post-close variance pack.
- Wire the 16 disclosed demo defaults as data sources appear.
- a11y deep-dive: axe-core on new pages (CI A11Y job exists).
- Full-suite re-run when CI is green (12,023+ baseline; `DataGrid.keyboardPerf` + `FormulaEngine.performance` load-flakes documented, do not weaken).

## 7. PR / COMMIT STRATEGY

1. Commit per item; gates green every time. New persisted stores → `PERSISTED_STORE_KEYS` in the SAME commit.
2. ONE PR against `main` per wave-group, from the fresh session branch.
3. PR body: before/after evidence table, gate evidence, honest F-02 note.
4. CI: expect starvation + documented flakes/timeouts; judge per §1.8 — but if CI flags a NEW failure, reproduce locally before dismissing.
5. Afterwards, write the next handover in this same structure.

## 8. FINAL NOTE

Mission D took the audit's last non-env-bound open item (docs cleanup) to CLOSED with a
*new enforcement gate* (docs-link-check, 651→0 broken refs), pushed engines coverage past
75% lines, and — the highest-value outcome — the new oracle tests exposed **6 real defects**
in shipped formula functions (statistical tail probabilities, date clamping, weekday
mapping, hex parsing), all fixed with the failing tests as regression guards. PR #43 carries
the evidence. Remaining is polish: deeper coverage, env-bound E2E, dep bumps, server sync.
Be brutally honest in closeouts — the ARBITER persona rewards measured evidence over plausible claims.
