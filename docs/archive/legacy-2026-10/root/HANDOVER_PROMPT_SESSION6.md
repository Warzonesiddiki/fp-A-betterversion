# HANDOVER PROMPT — FinPlan Pro FP&A (Session 6) — POST-MISSION C

> **SUPERSEDED (2026-08-11):** Historical handover. The current authoritative handover is `HANDOVER_PROMPT_SESSION10.md` (plus its addon, `HANDOVER_ADDON_SESSION10.md` if present / the SESSION10 file itself), and live state is in `_bmad/project-context.md` + `_bmad/reasoning-ledger.md`. Do not act on this file's statuses or next-actions.


**Repo:** `Warzonesiddiki/fp-A-betterversion`

**Base:** `main` @ `f5a4844` (PR #41 merge) → **PR #42 OPEN** from `arena/019fdbe0-fp-a-betterversion` ("Month-end close workflow (F-01): period-close UI + pre-close validation + zero-mock-data completion")

**User style:** YOLO autonomous, zero-compromise, aggressive progress. Ship green gates every turn. Persona: ARBITER — every claim needs evidence.

> ⚠️ **SESSION 6 GOAL — do NOT reopen shipped territory; push the remaining measured gaps.** Mission C (F-01 period-close UI + F-04 zero-mock-data) is DONE and PR'd (#42). Remaining per the audit: F-02 (E2E — env-bound), docs cleanup (partial), coverage 71.3%→75%+ (optional push), dep bumps. New surface ideas in §6. A session that ends without a merged wave + green gates is a failed session.

---

## 1. Critical Workflow & Architectural Invariants — NEVER BREAK

1. `node_modules` can vanish mid-session. Always: `cd /home/user/fp-A-betterversion && npm ci --no-audit --no-fund --legacy-peer-deps`. Re-run gates after any npm change.
2. Git refs can silently reset. After npm ci: `git fetch origin && git log --oneline -3 origin/main`. Origin/main is the source of truth.
3. Post-commit hook auto-runs `scripts/update-tracker.mjs` + auto-commits PROGRESS_TRACKER.html. Do not re-break it; eyeball stat-sub diffs.
4. **Ratchet:** `timeout 90 node scripts/money-adoption.mjs` — frontend ≥231/906, rawToFixedSites 0 (frontend AND server). Never raise the baseline file.
5. **GAP-7:** do NOT touch `.github/workflows/**`.
6. No raw `.toFixed()` in financial paths — `formatMoney/formatPercent/formatNumber/formatCompactNumber` + `@/utils/money`.
7. Git: `git commit --no-verify`, `git push origin HEAD --no-verify -u`. ONE PR against `main` per wave-group.
8. CI reality: runner starvation is real; judge on executed jobs + local gates. Missing `PAGE_HELP` in `src/pages/_docs.ts` + `_routeHelpMap.ts` for a new route = #1 CI killer.
9. Money ratchet applies to NEW code.
10. **NEW (S5):** `scripts/mock-data-audit.mjs` is now an ENFORCED gate — any new synthetic array (MOCK/sample/demo-named const) must get a disposition (wire/delete/disclose with `demo defaults` marker) or the script exits 1. Do not add unlabeled mock data.

## 2. Current State After PR #42 (OPEN at handover time, branch `arena/019fdbe0-fp-a-betterversion`)

| Area | State |
|---|---|
| Version | 1.0.0 everywhere |
| Lint / tsc | 0 errors / 0 warnings (local + CI jobs pass: Lint, ESLint zero-warnings, Type Check, tsc, Build ×3 OS, Bundle) |
| Money ratchet | **231/906 (25.5%)**, 0 toFixed; server 2/23, 0 toFixed |
| Close engines + store + page suite | 120 passed (35 new period-close tests: 10 store / 10 page / 9 money-exact / 6 a11y) |
| a11y | **448 passed / 1 skipped** (was 442/1) |
| Smoke suite | 19 files / 290 passed |
| Mock-data | 17 files / 23 synthetic arrays → **7 wired, 16 disclosed, 0 left**; script-enforced (exit 1 on violations) |
| Period close (F-01) | **SHIPPED**: `/periods/close` — grid from real FiscalCalendar, checklist from FinancialCloseEngine, state machine open→soft-close→hard-close→locked, money-exact pre-close validation, SHA-256 chained audit panel, post-close P&L/BS/CF export, lock propagation (budget line items + scenarios frozen) |
| RBAC | `period:read` (all) / `period:close` (Admin+FP&A_Manager) / `period:reopen` (Admin); matrix + negative-auth tests green |
| Audit deliverable | `reports/audit/ZERO_COMPROMISE_FINAL_AUDIT_v1.0.0_2026-08-07.md` updated: F-01 FAIL→FIXED, **114/116 (98.3%)**, verdict-2 row PASS; GAP_LEDGER entry MISSION C |
| Coverage | engine layer unchanged 71.32% stmts / 73.44% lines (4,940 tests); every engine has a direct test file (0 untested) |
| E2E | STILL UNVERIFIED_BLOCKED (playwright install fails; CDN egress) |

## 3. Immediate First Steps

```bash
cd /home/user/fp-A-betterversion && git fetch origin && git status
# if PR #42 merged: git fetch origin main && git checkout <new session branch from main>
npm ci --no-audit --no-fund --legacy-peer-deps
node node_modules/typescript/bin/tsc --noEmit && \
node node_modules/eslint/bin/eslint.js src --cache --max-warnings 0 && \
timeout 90 node scripts/money-adoption.mjs && \
node scripts/mock-data-audit.mjs && \
node scripts/verify-readme-stats.mjs
# then READ §5
```

## 4. Files To Reuse / Study (mission-critical, all SHIPPED + tested)

- **Period close (NEW, S5):** `src/pages/periods/PeriodClosePage.tsx`, `src/store/periodCloseStore.ts` (+ `.test.ts`), `src/utils/periodCloseReadiness.ts`, `src/pages/periods/PeriodClosePage.{test,money.test,a11y.test}.tsx`
- **RBAC:** `src/utils/rbacEnforcer.ts` (Permissions + enforce), `src/store/authStore.ts` (ROLE_PERMISSIONS)
- **Close engines:** `FinancialCloseEngine.ts`, `PeriodCloseStateMachine.ts`, `PeriodLockEngine.ts`, `PeriodCloseEngine.ts`
- **Server API:** `server/src/routes/periods.ts` (POST /:id/transition is the modern path; /close legacy)
- **Audit display:** `src/pages/audit/AuditTrailPage.tsx`, `SOXCompliancePage.tsx` (has the Close-period CTA now)
- **Help infra (CI killer):** `src/pages/_docs.ts`, `_routeHelpMap.ts`, `_docs.test.ts`
- **Gate scripts:** `scripts/money-adoption.mjs`, `mock-data-audit.mjs` (**NEW disposition enforcement**), `verify-readme-stats.mjs`, `update-tracker.mjs`
- **Conventions:** `GAP_LEDGER.md`, `RELEASE_CHECKLIST.md`, `MASTER_ROADMAP.md`

## 5. MISSION D — RESIDUAL GAPS (pick the highest-leverage; do not re-open C territory)

1. **Docs triage (audit §8 partial):** `docs/` = 91 top-level files + subdirs (6.5MB). Keep ARCHITECTURE.md, security/tech specs, a11y specs, `docs/parts/**` (help system), `docs/adr`, `docs/engines`, `docs/audit`, `docs/compliance`, `docs/a11y`. Ritual candidates: `docs/leader/` (ORCHESTRATOR_CYCLE state), `docs/MUSE_LINEUP_v2.md`, `docs/STRATEGIC_INDEX.md` — **they are cross-referenced by ONBOARDING.md / AGENTS.md / GLOSSARY / ARCHITECTURE / ADRs**, so deletion must fix references or the docs-link graph breaks (check `grep -rln "docs/ONBOARDING"` first). Regenerate the junk list under `reports/` (reports/junk was deleted in S3).
2. **Coverage 71.3% → 75%+:** every engine already has a direct test file; raise depth on the lowest dirs (measure with `vitest run src/engines --coverage --coverage.include='src/engines/**'`; ~3.5 min). Record honestly; never re-claim ≥80%.
3. **E2E:** retry `npx playwright install chromium` — if egress opens, run `e2e/smoke.spec.ts` + `e2e/a11y/q5-temporal/*` and update RELEASE_CHECKLIST honestly.
4. **Dep bump PR:** radix/sentry/playwright minor updates — only if audit stays 0 and gates pass.
5. **Server-side period close:** client now calls no server API in offline mode; consider wiring `/periods/:id/transition` sync when the desktop server is present (graceful degradation), and server tests for `POST /:id/transition` already exist — extend if needed.

## 6. OVERFLOW / NEW SURFACE (only after §5 items)

- Period-close companion surfaces: "close calendar" year view, close-task SLA breach surfacing (PeriodCloseEngine.getSLABreaches exists), post-close variance pack.
- Wire the 16 disclosed demo defaults as data sources appear (each is commented with what replaces it).
- a11y deep-dive: axe-core on new pages (CI A11Y job exists).
- Full-suite re-run when CI is green (11,998 baseline; `DataGrid.keyboardPerf` load-flake documented, do not weaken).

## 7. PR / COMMIT STRATEGY

1. Commit per item; gates green every time.
2. ONE PR against `main` per wave. If PR #42 is still open, base new work on the same branch and push (or wait for merge — prefer merge).
3. PR body: before/after evidence table, gate evidence, honest F-02 note.
4. CI: expect starvation; judge per §1.8.
5. Afterwards, write the next handover in this same structure.

## 8. FINAL NOTE

Mission C closed the audit's only FAIL: period close is now a real, routed, tested client workflow, and mock-data residue is zero with script enforcement. The product's all-in-one claim is PASS end-to-end (114/116). Remaining work is polish: docs hygiene, coverage depth, env-bound E2E, dep bumps. Be brutally honest in closeouts — the ARBITER persona rewards measured evidence over plausible claims.
