# HANDOVER PROMPT — FinPlan Pro FP&A (Session 9) — POST-MISSION E

> **SUPERSEDED (2026-08-11):** Historical handover. The current authoritative handover is `HANDOVER_PROMPT_SESSION10.md` (plus its addon, `HANDOVER_ADDON_SESSION10.md` if present / the SESSION10 file itself), and live state is in `_bmad/project-context.md` + `_bmad/reasoning-ledger.md`. Do not act on this file's statuses or next-actions.


**Repo:** `Warzonesiddiki/fp-A-betterversion`

**Base:** `main` @ current PR merge / `411ee82`

**Base State (MISSION E complete):**
- Engines coverage: **89.69% statements / 91.25% lines / 94.59% functions / 74.69% branches** (20,610/22,977 stmts; 18,435/20,201 lines)
- All bottom-24 engines elevated to **81.57% – 100.00% statements**
- SafeMathParser (target #1, ~1,729 stmts) elevated to **92.36% statements** (+524 covered stmts, +23 deep oracles)
- AdvancedPDFEngine (0% → **98.62%**), ExportEngine (40.8% → **100%**), exportExcel (52.9% → **100%**), StreamImportEngine (44.9% → **95.50%**)
- Performance & Cache layer: CubePartitioner (**97.59%**), ReportCacheEngine (**88.04%**), QueryCache (**83.82%**)
- Formula Function Registry: math (**97.89%**), logical (**100%**), statistical (**95.97%**), financial (**96.31%**), lookup (**95.94%**), text (**87.62%**)
- Domain Engines: SolverEngine (**100%**), InsuranceEngine (**100%**), XBRLEngine (**97.61%**), WorkflowBuilderEngine (**98.08%**), PivotTableEngine (**96.29%**), VisualWorkflowEngine (**95.40%**), WorkflowActionEngine (**96.61%**), WorkflowTriggerEngine (**90.19%**), WorkflowSchedulerEngine (**94.11%**), MultiCurrencyEngine (**97.59%**), PluginEngine (**86.51%**), SmartImportMapper (**83.47%**), DrillThroughEngine (**81.57%**), EngineRegistry (**88.70%**)
- Server-side period close synchronization: client store sync wired to `POST /api/periods/:id/transition` with graceful offline fallback; server lifecycle suite green (**25/25 tests passing**)
- Lint / TypeScript / Build: **0 errors / 0 warnings** with exact CI command (`npx eslint src --max-warnings 0` without `--cache`), `tsc --noEmit` exit 0, `npm run build` exit 0
- Quality gates: Money ratchet holds (**231/900 modules, 0 toFixed sites**; server 2/23, 0); mock-data audit clean (**wired=7, disclosed=16, 0 left**); docs-link graph clean (**0 broken links, 0 broken citations strict**)

---

## 1. Critical Workflow & Architectural Invariants — NEVER BREAK

1. `node_modules` can vanish mid-session. Always: `cd /home/user/fp-A-betterversion && npm ci --no-audit --no-fund --legacy-peer-deps`. Re-run gates after any npm change.

2. **Git refs can silently reset (SNAPSHOT-RESTORE):** the sandbox restored the workspace to base with the working tree intact but reflog empty. Recovery: (a) `git status --short` count; (b) verify deliverables against checklist; (c) re-run ALL gates on the restored tree; (d) re-commit as one wave. When remote is up: `git fetch origin && git log --oneline -3 origin/main`.

3. Post-commit hook auto-runs `scripts/update-tracker.mjs` + auto-commits PROGRESS_TRACKER.html (runs even with `--no-verify`).

4. **Ratchet:** `timeout 90 node scripts/money-adoption.mjs` — frontend ≥231/900 (25.67%), rawToFixedSites 0 (frontend AND server). Never raise the baseline file.

5. **GAP-7:** do NOT touch `.github/workflows/**`.

6. No raw `.toFixed()` in financial paths — `formatMoney/formatPercent/formatNumber/formatCompactNumber` + `@/utils/money`.

7. Git: `git commit --no-verify`, `git push origin HEAD --no-verify -u`. ONE PR against `main` per wave-group.

8. CI reality: runner starvation is real; judge on executed jobs + local gates. Missing `PAGE_HELP` in `src/pages/_docs.ts` + `_routeHelpMap.ts` for a new route = #1 CI killer.

9. Money ratchet applies to NEW code.

10. **`scripts/mock-data-audit.mjs` DISPOSITIONS** — any new synthetic array needs a disposition (wire / delete / disclose with `demo defaults` marker) or the script exits 1.

11. **CI catches & Auth fallbacks:**
    - `eslint --cache` MASKS PRETTIER ERRORS in new files. CI runs `npx eslint src --max-warnings 0` WITHOUT `--cache`. Always verify with the exact no-cache command before pushing. `npm run build` runs tsc + eslint + vite build.
    - `gh pr merge` can 401 while the REST path works. If the subcommand 401s, probe `gh api user` and fall back to: `gh api -X PUT repos/{owner}/{repo}/pulls/{n}/merge -f merge_method=merge`.
    - GH_TOKEN rotates/expires mid-session. Push early and often; probe with `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user` (401 = dead).

12. **Persisted stores:** any NEW zustand store MUST be in `PERSISTED_STORE_KEYS` (`src/utils/persistedStores.ts`) in the SAME commit (`backupRestore.test.ts` scans src/store).

---

## 2. Current State After MISSION E

| Area | State |
|---|---|
| Version | 1.0.0 everywhere |
| Lint / tsc | 0 errors / 0 warnings — verified with `npx eslint src --max-warnings 0` (NO `--cache`) + `npm run build` exit 0 |
| Money ratchet | 231/900, 0 toFixed; server 2/23, 0 toFixed |
| Docs corpus | 112 files / 1.7MB; `docs-link-check.mjs --strict` = **0/0** (clean graph) |
| **Engines coverage** | **89.69% stmts / 91.25% lines / 94.59% funcs / 74.69% branches** (20,610/22,977 stmts; 18,435/20,201 lines) |
| **Bottom-24 Engines** | All elevated to **81.57% – 100.00%** coverage |
| SafeMathParser | **92.36%** stmts (was 62.05%), 404 tests passing |
| PDF & Export Layer | AdvancedPDFEngine (**98.62%**), ExportEngine (**100%**), exportExcel (**100%**) |
| Streaming Import | StreamImportEngine (**95.50%**), SmartImportMapper (**83.47%**) |
| Performance & Cache | CubePartitioner (**97.59%**), ReportCacheEngine (**88.04%**), QueryCache (**83.82%**) |
| Formula Functions | math (**97.89%**), logical (**100%**), statistical (**95.97%**), financial (**96.31%**), lookup (**95.94%**), text (**87.62%**) |
| Period Close Sync | Client store sync wired to `POST /api/periods/:id/transition` with graceful offline fallback; server suite **25/25 passed** |
| Mock-data | 10 files / 16 arrays → 7 wired, 16 disclosed, 0 left; script-enforced |
| E2E | STILL UNVERIFIED_BLOCKED (Chrome for Testing CDN egress in sandbox) |

---

## 3. Immediate First Steps

```bash
cd /home/user/fp-A-betterversion && git fetch origin && git log --oneline -3 origin/main
npm ci --no-audit --no-fund --legacy-peer-deps
node node_modules/typescript/bin/tsc --noEmit && \
npx eslint src --max-warnings 0 && \
timeout 90 node scripts/money-adoption.mjs && \
node scripts/mock-data-audit.mjs && \
node scripts/verify-readme-stats.mjs && \
node scripts/docs-link-check.mjs --strict
```

---

## 4. Next Priorities (Session 9 Mission)

1. **Full-Suite Test Execution & Stability:**
   Run full-suite sweeps with memory flags: `node --max-old-space-size=81920 node_modules/vitest/vitest.mjs run`.
2. **Page & Store Coverage Push:**
   With engines at 89.69% / 91.25%, elevate remaining page and store layers towards 85%+.
3. **E2E & Desktop Validation:**
   Re-attempt Playwright download (`npx playwright install chromium`) if network sandbox opens.
4. **Final Packaging & Release Dry Run:**
   Run `npm run release:dry-run`, verify SBOM, license checks, and architecture guardrails.
