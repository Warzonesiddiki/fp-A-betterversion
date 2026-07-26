# FinPlan Pro — Project Status Analysis & Pending Work

**Date:** 2026-07-25
**Branch analysed:** `arena/019f9914-fp-a-betterversion`
**Goal (as stated):** Build an all‑in‑one FP&A application with "zero compromises" — everything in one place, so the user never needs another app.

> **Headline verdict:** The project is **NOT production‑ready** and is **far from "zero‑compromise."** A large, partially‑real codebase exists (1,876 source files, 193 pages, 186 engines, 40 stores, 885 test files), but the authoritative completion list shows only the *environment* phase done. The actual product work — core financial features, sector depth, governance, polish, performance, testing, security, desktop, onboarding/release — is **almost entirely pending**. Documentation is internally contradictory and inflated.

---

## 1. What actually exists today (measured, not claimed)

| Area | Measured reality | Doc claim |
|------|------------------|-----------|
| Source files | 1,876 `.ts`/`.tsx` in `src/` | README: "1,874" ✅ roughly matches |
| Pages/routes | 193 page `.tsx` (lazy‑loaded in `App.tsx`) | "192 pages" ✅ |
| Engines | 186 non‑test engine files (`src/engines`) | "202+ engines" ❌ inflated |
| Stores | 40 Zustand stores | "35"/"73" ❌ inconsistent |
| Tests | 885 test files | "8,334+ tests, 95% pass" ❌ unverified/likely false |
| Workers | 14 worker files (`src/workers`) | "7"/"14" ⚠️ |
| Sectors | ~18 dedicated sector dashboards + aliases | "40+ sectors" ❌ inflated |
| Build | `npm run build` claimed PASS (per 2026‑07‑23 report) | "🟢 Production‑Ready" ❌ overstated |
| Desktop | Tauri shell exists (`src-tauri`, Rust) | Partial — needs build to verify |

**Important nuance:** Many pages exist as *files* but depth varies wildly. Dashboard/GL/Budget/Reports pages are real, substantial implementations; many sector dashboards and admin pages appear thin. The presence of a file is not proof of a finished feature.

---

## 2. Critical blockers found (ground truth, verified in this workspace)

### BLOCKER 1 — Fresh install fails
A clean `npm install --legacy-peer-deps` **failed** in this environment:
```
npm error path .../node_modules/onnxruntime-node
npm error command failed: node ./script/install
npm error ECONNRESET ... host: 'api.nuget.org'
```
`@huggingface/transformers` pulls `onnxruntime-node`, whose post‑install downloads a native binary from `api.nuget.org` and the connection resets. The 2026‑07‑23 "Phase 0 complete" report only worked because it used `npm ci --ignore-scripts --prefer-offline` (skips the broken script, relies on a pre‑warmed cache). **A truly reproducible fresh environment does NOT currently install.**
→ **Implication:** Task 0.1 ("clean reproducible environment, `npm ci` succeeds") is **not actually met** in a clean sandbox.

### BLOCKER 2 — App is Tauri‑only at runtime (contradicts "Desktop & Web")
`src/App.tsx` (lines 351–358):
```ts
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
if (!isTauri) {
  alert('This application is designed to run exclusively as a desktop app via Tauri...');
  return null;
}
```
In a browser the app **renders nothing**. This directly contradicts the README claim *"Desktop & Web — native desktop app via Tauri + responsive web interface."* The "all‑in‑one, never use another app" promise is currently *desktop‑only*, and even the desktop build is unverified here.

### BLOCKER 3 — Architecture ADRs are unratified
`AGENTS.md` states the 5 P0 architecture decisions (Zustand, OLAP cube, Decimal.js, masterStorage, schema migration) are at **0 of 4 ICPs** and **TENTATIVE**. Core technical foundations are not signed off.

### BLOCKER 4 — Documentation is contradictory and inflated
- README header: *"🟢 Production‑Ready"* + *"8,334+ tests, 80%+ coverage."*
- Master tasklist (COMPLETION_TASKLIST_ZERO_COMPROMISE.md): *"Test suite historically ~48% pass rate (needs full recovery),"* Phases 2–11 unchecked.
- `FINPLAN_CURRENT_STATE.md` (older): *"2,266 TSC errors remaining."*
- `reports/phase0-baseline-2026-07-23.md`: *"tsc → 0 errors, build success."*
- These snapshots conflict on TSC errors, test pass rate, store/engine counts, and even Vite version (README says Vite 7, package.json says 8).

### BLOCKER 5 — "Zero server / zero cloud" claim is false
A separate `server/` Express backend exists (`express`, `better-sqlite3`, `helmet`, `bcryptjs`, rate‑limiting). PLAN.md says *"No cloud. No internet. No external dependencies"* — contradicted by the real server plus Sentry, HuggingFace, Playwright, and i18n remote concerns.

---

## 3. Status by phase (from COMPLETION_TASKLIST_ZERO_COMPROMISE.md — the single source of truth)

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | Environment & baseline | ⚠️ Claimed done, but BLOCKER 1 proves not reproducible; test baseline (0.4) still open |
| **1** | Data foundation & persistence | 🟡 Partial — GL store, Chart of Accounts CRUD+CSV, Reconciliation done; Trial Balance/Journals enhancements, global Backup/Restore UI pending |
| **2** | Core financial features | 🔴 ~0 done — Budget CRUD/approve/lock, Forecasting, Scenarios, P&L/BS/CF, Variance, Board Pack, Consolidation, FX all unchecked |
| **3** | Sector depth (40+ industries) | 🔴 Pending — coverage + KPI wiring + sector‑driven UI all unchecked |
| **4** | Enterprise governance | 🔴 Pending — Audit, Approval queue, Collaboration, Period close, Settings, RBAC all unchecked |
| **5** | UI/UX, a11y, help | 🔴 Pending — dark/light audit, WCAG 2.2 AA, help on every page, command palette |
| **6** | Performance & architecture | 🔴 Pending — workers in prod, 100k‑row grid, bundle checks |
| **7** | Testing (≥95% pass) | 🔴 Pending — recovery from ~48% historical, E2E, coverage ≥80% |
| **8** | Security & hardening | 🔴 Pending — security.ts, CSP, secrets, auth, GDPR hooks |
| **9** | Tauri desktop (1st‑class) | 🔴 Pending — `tauri:dev`/`tauri:build`, SQLite persistence, native dialogs, updater |
| **10** | Onboarding, docs, release | 🔴 Pending — onboarding wizard, accurate README, CHANGELOG, v1.0.0 tag |
| **11** | Final zero‑compromise gates | 🔴 All 12 gates unchecked |

**Bottom line:** Of 11 phases, 0 are fully complete; ~9 are essentially unstarted; 1 (environment) is claimed complete but fails reproduction; 1 (data foundation) is partially done.

---

## 4. PENDING WORK — consolidated list

### P0 — Make the project real & reproducible (do first)
1. **Fix dependency install** — remove or make optional `@huggingface/transformers`→`onnxruntime-node` (post‑install fails on nuget.org); add an `.npmrc`/install flag so a fresh `npm ci` works without `--ignore-scripts`. (BLOCKER 1)
2. **Decide & fix the runtime target** — either support web *and* desktop (remove the `return null` Tauri gate) **or** update all docs to say "desktop‑only" and verify the Tauri build. Currently docs and code disagree. (BLOCKER 2)
3. **Ratify the 5 P0 ADRs** (Zustand, OLAP cube, Decimal.js, masterStorage, schema migration) — get the 4‑ICP sign‑off or formally change them. (BLOCKER 3)
4. **Reconcile the documentation** — one truthful README; archive/retract the inflated "Production‑Ready" banner; delete or date‑stamp conflicting state snapshots (FINPLAN_CURRENT_STATE, multiple ROADMAPs). (BLOCKER 4)
5. **Establish a single ground‑truth status file** and a real CI that runs `tsc → lint → test → build` on every push.

### P1 — Data foundation (finish)
6. Trial Balance auto‑calc + "Balanced / Off by $X" indicator; Journals filter/paginate; per‑account trend + running balance (1.1.4)
7. Global Backup/Restore UI in Settings + toolbar, with full export→import round‑trip (1.2.3)
8. Verify IndexedDB→SQLite migration end‑to‑end across a real app restart (1.2.2)

### P2 — Core financial features (the heart of "all‑in‑one")
9. Budget system: List (status workflow), Create wizard, Detail grid editor (AG Grid, undo/redo, versions), Locking/Approval (2.1.1–2.1.4)
10. Forecasting & Scenario modeling: driver tree, rolling forecast, scenario builder, tornado/comparison, probability weighting (2.2.1–2.2.2)
11. Advanced analytics: Goal Seek, Monte Carlo (worker), Break‑even (2.2.3)
12. Financial statements: P&L, Balance Sheet (balanced check), Cash Flow (reconciles to BS), with PDF/Excel export (2.3.1–2.3.2)
13. Budget vs Actual + Variance analysis (waterfall, Fav/Unfav, rate/volume/mix) (2.3.3)
14. Board Pack generator (multi‑section PDF, templates) (2.3.4)
15. Multi‑entity Consolidation + IC elimination + NCI (2.4.1)
16. FX rates CRUD/history + translation (average/closing/historical) + hedging (2.4.2)
17. **End‑to‑end flow gate:** Import GL → Budget → Edit → Approve → P&L + Board Pack → Export PDF, all persisted.

### P3 — Sector depth
18. ≥8 representative sectors with working, data‑driven dashboards (SaaS ARR/NRR/GRR/Churn, Manufacturing OEE/Scrap, Banking NIM/CET1, RE NOI/Cap Rate, Retail same‑store/ATV, Energy/ESG emissions, etc.) (3.1–3.2)
19. `useSector()` + config drives visible KPIs & sidebar instantly (3.3)

### P4 — Enterprise governance
20. Live Audit Trail + export (4.1); Approval Queue batch approve/reject (4.2); Collaboration (threaded comments, @mentions, tasks, activity log) (4.3); Period Close checklist + locks (4.4); full Settings tabs (4.5); basic RBAC (Viewer/Editor/Admin) (4.6)

### P5 — UI/UX, accessibility, help
21. 100% dark+light audit (no raw colors without dark variants) (5.1); WCAG 2.2 AA (0 critical/serious, axe in tests) (5.2); `?`/F1 help on **every** route (5.3); command palette (Ctrl/Cmd+K), loading/empty/error states, transitions (5.4); responsive ≥1024×600 (5.5)

### P6 — Performance & architecture
22. Wire workers into real UI (consolidation, monte‑carlo, formula, export, batch) (6.1); meet 100k‑row grid ≥30fps, 10k GL import <30s, 500‑row PDF <3s (6.2); lazy‑load `grid-vendor`/`excel-vendor` + routes; `bundle-check` passes (6.3); memoization/render audit (6.4)

### P7 — Testing (zero tolerance)
23. Unit/component pass ≥95%, fix all historically failing suites (7.1); engine coverage edge cases (7.2); service + plugin tests (7.3); Playwright E2E smoke + full workflow (7.4); coverage ≥80% (7.5); benchmarks clean (7.6)

### P8 — Security & hardening
24. `src/utils/security.ts` 100% (8.1); production CSP no `unsafe-inline`/`eval` (8.2); zero secrets in bundle, AI via proxy/Tauri (8.3); strong JWT + Zod validation (8.4); GDPR events/retention (8.5)

### P9 — Tauri desktop (first‑class)
25. `tauri:dev` real window + `tauri:build` installer (9.1); SQLite persistence survives close/reopen (9.2); native file dialogs, OS notifications, global shortcuts (9.3); version + auto‑updater (9.4); full desktop E2E doc (9.5)

### P10 — Onboarding, docs, release
26. Onboarding wizard (first‑run detect, company/sector/import) (10.1); accurate README + Mermaid diagrams + sector KPI guides + archive old ROADMAPs (10.2); v1.0.0, CHANGELOG, `PROJECT_COMPLETE` report, git tag (10.3)

### P11 — Final zero‑compromise gates
27. All 12 gates: fresh‑clone build+test, lint clean, ≥95% tests, Tauri build, manual E2E, a11y 0 serious, dark‑mode audit, help on 100% routes, no console errors, perf benchmarks, security review, all 192 pages load.

---

## 5. Recommended sequence to reach the "zero‑compromise" goal
1. **Stabilise (P0 blockers)** — make it install, decide web‑vs‑desktop, ratify ADRs, fix docs. *Without this, nothing else is trustworthy.*
2. **Prove the spine (P1 + P2 end‑to‑end gate)** — GL import → budget → approve → P&L/Board Pack → export, persisted. This is the minimum credible "all‑in‑one" demo.
3. **Breadth (P3, P4)** — sectors + governance so it serves real orgs.
4. **Quality (P5–P8)** — a11y, performance, tests, security.
5. **Ship (P9–P11)** — desktop build, onboarding, v1.0.0.

---

## 6. Honest assessment of "zero compromises / never use another app"
Today the app cannot even be installed cleanly or run in a browser, core FP&A workflows (budgeting, forecasting, consolidation, statements) are not verified complete, and the security/perf/test gates are unmet. The vision is ambitious and the scaffolding is large, but **calling it "zero compromise" or "production ready" today is not supported by the evidence.** Treat the completion tasklist phases 2–11 as the real remaining programme of work.
