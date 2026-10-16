# FinPlan Pro — Master Completion Plan (All-in-One FP&A · ZohoBooks-grade UX)

> **Version:** 1.0 · **Date:** 2026-08-12 · **Owner direction:** "all-in-one FP&A tool… user should not need any other tool… all-in-one solution for all industries… extremely perfect UI/UX (similar to ZohoBooks)… highly optimized and extremely perfect… free to do everything" (`_bmad/research/owner-direction-record-2026-08-12-all-in-one.md`, ledger #34)
> **Method:** BMAD v5.0 ULTRA-YOLO — every task below carries an evidence/honesty rule; no assumption is validated by this plan.
> **North star:** one workspace where a finance function runs the whole loop — actuals → reconcile/close → plan/forecast → decide → publish — plus adjacent finance workflows (accounting, treasury, revenue, tax, capex, workforce, cash), with ZohoBooks-grade polish and extreme optimization. No second tool required.

---

## 0. Baseline (ground truth, 2026-08-12)

| Dimension     | Current state                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Routes        | 200+ lazy routes across 40+ domain dirs (budgets, forecasts, scenarios, consolidation, treasury, revenue, lease, tax, capex, cash, accounting, banking, credit, bonds, insurance, healthcare, energy, government, manufacturing, retail, saas, realestate, education, construction, logistics, telecom, workforce, esg, collaboration, plugins…) |
| Engines       | 193 (182 reachable, `engines:verify` green)                                                                                                                                                                                                                                                                                                      |
| Stores        | 44 Zustand stores (persist via masterStorage, hydration regression-pinned)                                                                                                                                                                                                                                                                       |
| UI primitives | 263 in `src/components/ui/`                                                                                                                                                                                                                                                                                                                      |
| Tests         | 13,438 derived (1,195 files; exact count needs full-suite run — see T-PLAN-01)                                                                                                                                                                                                                                                                   |
| e2e           | Playwright atlas-visual 5/5 (11 PNG baselines byte-stable)                                                                                                                                                                                                                                                                                       |
| Theme         | Dark-first Bloomberg-inspired + light theme (ThemeContext: dark/light/system)                                                                                                                                                                                                                                                                    |
| CI            | RED — GitHub billing block (E-005, owner-side); workflows landed via platform commit b23e41a (T-13 closed)                                                                                                                                                                                                                                       |
| Assumptions   | A-01…A-14 all **UNVALIDATED** (unchanged — this plan validates nothing)                                                                                                                                                                                                                                                                          |

**What "done" means (definition of completion):** every task below carries an explicit acceptance gate; the project is "complete" when the North Star loop + adjacent finance workflows are demonstrably usable end-to-end with ZohoBooks-grade UI/UX, all gates green (tsc 0, lint 0, tests green, bundle limits met, a11y AA, money discipline), CI green once billing clears, and every market assumption honestly labeled.

---

## 1. Track UI — ZohoBooks-grade UI/UX (flagship)

> Goal: professional, dense, learnable finance SaaS feel. ZohoBooks benchmark = clean hierarchy, high information density, predictable forms/tables, fast scanning, no visual noise. Current system is Bloomberg-dark-first — direction is a **polish pass on both themes with a light-professional-first posture**, not a theme flip without review.

| #     | Task                                                                                                     | Acceptance                                                                  | Status  |
| ----- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| UI-01 | Design-system audit vs ZohoBooks benchmark (type scale, spacing, color, density, component inventory)    | Written audit + gap list, owner-visible                                     | PENDING |
| UI-02 | Typography & density pass (tables, forms, lists) — AG Grid row density, cell padding, form field heights | Consistent 8px grid, denser tables, no cramped/loose outliers               | PENDING |
| UI-03 | Navigation/IA polish for 200+ routes: pillar nav grouping, search, recent items, breadcrumbs             | A user reaches any workflow in ≤3 clicks; command palette covers all routes | PENDING |
| UI-04 | Table excellence: sortable headers, column persistence, sticky header/footer, export, virtualized rows   | AG Grid config audit + defaults on all list pages                           | PENDING |
| UI-05 | Form patterns: consistent labels/validation/errors/save states across create/edit flows                  | Form system audit; no ad-hoc form layouts                                   | PENDING |
| UI-06 | Empty states, loading skeletons, error states on every list/detail page                                  | Full sweep; no raw "No data" text                                           | PENDING |
| UI-07 | Light-theme professional pass (ZohoBooks-like clean light)                                               | Light theme screenshot baseline + e2e                                       | PENDING |
| UI-08 | Focus states, keyboard navigation, shortcut consistency                                                  | a11y gate (WCAG 2.1 AA) + keyboard runbook                                  | PENDING |
| UI-09 | Onboarding wizard + first-run experience polish                                                          | New user completes setup < 3 min, tested                                    | PENDING |
| UI-10 | Micro-interactions (hover, transitions, toasts, notifications) consistency                               | No jarring/divergent motion                                                 | PENDING |

## 2. Track D — Product depth (all-in-one FP&A)

> The breadth exists (200+ routes); the work is depth + end-to-end coherence of the North Star loop.

| #    | Task                                                                                                                                                                   | Acceptance                                                            | Status  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| D-01 | End-to-end loop audit: import actuals → reconcile/close → plan/forecast → decide → publish board pack, on real data                                                    | Walkthrough of every step with the real stores/engines; document gaps | PENDING |
| D-02 | GL/data depth: journals, trial balance, account analysis, reporting — parity of calculations with engines                                                              | Engine outputs reconcile with expected values (money tests)           | PENDING |
| D-03 | Consolidation + FX depth: ownership tree, IC eliminations, FX rates, translation                                                                                       | Multi-entity consolidation walkthrough on sample data                 | PENDING |
| D-04 | Budgets/forecasts/scenarios depth: versioning, approvals, variance, what-if, goal-seek                                                                                 | Analyst workflow walkthrough (A-03-relevant, honest label)            | PENDING |
| D-05 | Treasury/cash depth: cash forecast, debt schedule, working capital, investments, FX exposure                                                                           | Cash-planning walkthrough                                             | PENDING |
| D-06 | Revenue/lease/tax/capex depth: schedules, dashboards, provisions, depreciation                                                                                         | Sub-ledger workflows usable with sample data                          | PENDING |
| D-07 | Reporting & board pack: report list, segment reporting, variance dashboard, publish/drill-to-evidence                                                                  | Board-pack output drills to source (P-06 pre-work, not claim)         | PENDING |
| D-08 | Integrations hub depth: 9 real connectors (QB, Xero, NetSuite, Sage, Dynamics, Salesforce, Stripe, Plaid, Slack) — connect/test/sync/import all verified per connector | Per-connector connect/test/sync/import e2e on sandbox credentials     | PENDING |
| D-09 | Sector pages depth audit (healthcare, energy, government, manufacturing, retail, saas, etc.): real metrics engines vs placeholder copy                                 | Every sector page has ≥1 real engine + tests; no shell pages          | PENDING |
| D-10 | Collaboration + plugins depth: audit vs claimed capabilities                                                                                                           | Feature-flag truth matrix; no fake affordances                        | PENDING |
| D-11 | P-track story gating: P-01…P-07 stay BLOCKED pending R-04 evidence (owner direction does not unblock)                                                                  | Stories remain honest; pilot slice selected only from evidence        | PENDING |
| D-12 | Offline/local-first behavior verification (Tauri)                                                                                                                      | Tauri smoke + persistence across restarts                             | PENDING |

## 3. Track P — Performance & optimization (extreme)

| #    | Task                                                                                          | Acceptance                                          | Status  |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- |
| P-01 | Full-suite run to confirm exact test/file count (derived 13,438/1,195)                        | Exact counts recorded in README + evidence log      | PENDING |
| P-02 | Bundle budget audit: `npm run build` + bundle-check (main <150KB gzip, total <2MB gzip)       | Gates green; manual chunks verified                 | PENDING |
| P-03 | Cold-start audit: route chunk sizes, eager imports, Sentry/PWA init cost                      | Time-to-interactive baseline recorded               | PENDING |
| P-04 | Render performance: React.memo/selector discipline audit across heavy pages (AG Grid, charts) | No obvious re-render hotspots (React Profiler pass) | PENDING |
| P-05 | Virtualization audit: long lists/tables use react-window/AG Grid virtualization               | No 1,000+ row DOM lists                             | PENDING |
| P-06 | Worker usage: Monte Carlo/consolidation/formula workers correctly pooled                      | Worker-pool integration verified                    | PENDING |
| P-07 | Memory: store subscription leaks, event listener cleanup audit                                | No leaks on 10-min session (devtools heap)          | PENDING |
| P-08 | Money/format perf: decimal.js hot paths, formatter caches                                     | Ratchet green; no hot-path allocation spikes        | PENDING |

## 4. Track E — Engineering excellence (quality gates)

| #    | Task                                                                            | Acceptance                                        | Status        |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------- | ------------- |
| E-01 | Type safety ratchet + no-any audit                                              | `type-safety-ratchet` green                       | PENDING       |
| E-02 | A11y gate on top-20 routes (vitest-axe)                                         | WCAG 2.1 AA                                       | PENDING       |
| E-03 | Security audit sweep (CSP, secrets, XSS surfaces, dep audit)                    | `audit:prod` green; CSP hash check green          | PENDING       |
| E-04 | Docs ground truth: README claims, capability matrix, engine manifest, docs-link | All governance scripts green                      | PENDING       |
| E-05 | CI green on GitHub once owner resolves billing (E-005)                          | Workflow jobs execute and pass                    | OWNER-BLOCKED |
| E-06 | e2e suite expansion beyond atlas (auth, budgets, integrations hub, close loop)  | New specs in `tests/`, chromium-only, stable      | PENDING       |
| E-07 | Server suite (Express + SQLite) kept green on real SQLite                       | 207/207 native                                    | PENDING       |
| E-08 | Tauri shell verification (build + smoke)                                        | `tauri:build` + smoke pass in a Tauri-capable env | PENDING       |
| E-09 | Mock-data audit (no fabricated financials presented as real)                    | `mock-data:audit` green; labels honest            | PENDING       |

## 5. Track R — Research & evidence (BMAD discipline, solo-dev)

| #    | Task                                                                                     | Acceptance                                        | Status                     |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------- |
| R-01 | Desktop-channel Tier-2 evidence kit (waitlist / direct Tauri installs / community posts) | Drafts ready, owner decides execution (T-06/T-07) | IN PROGRESS (this session) |
| R-02 | Waitlist/landing mechanism decision (owner)                                              | Channel chosen; honest signup flow                | OWNER-BLOCKED              |
| R-03 | Community engagement drafts (r/FPandA, Indie Hackers, HN) — desktop-first variant        | Drafts ready, owner posts                         | IN PROGRESS                |
| R-04 | Unsolicited demand tracking: ≥3 "I'd pay" signals → PARTIAL A-01 signal                  | Tracker rows, real signals only                   | PENDING                    |
| R-05 | R-04 pilot selection framework executed once Tier-2 evidence exists                      | Pilot slice selected from evidence, not vibes     | PENDING                    |
| R-06 | Assumption registry weekly refresh with evidence (statuses stay UNVALIDATED)             | Registry updated with evidence links              | PENDING                    |

## 6. Track G — Governance & delivery

| #    | Task                                                                          | Acceptance                                    | Status                                                                 |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| G-01 | Land working tree changes (F-02 baseline + hydration fix + docs)              | Freebuff Changes panel save; verified at HEAD | READY (owner saves)                                                    |
| G-02 | T-13 status correction: 9 hardened workflows LANDED via b23e41a               | Docs updated (this session)                   | DONE-TO-DOC                                                            |
| G-03 | CI billing block resolution (owner, E-005)                                    | Jobs execute                                  | OWNER-BLOCKED                                                          |
| G-04 | `.env.example` dead `VITE_BETA_WEB` key removal (env-file guard blocks edits) | Key removed                                   | OWNER-BLOCKED                                                          |
| G-05 | `agents/` A1–A5 multi-agent task-assignment roadmap                           | File in `agents/` (this session)              | IN PROGRESS                                                            |
| G-06 | Ledger + project-context + evidence-log updated for every meaningful decision | Entries #34+                                  | DONE — ledger #35+#36 cover the 2026-08-23 wave (Lead-authorized flip) |

---

## 7. Execution order (phased)

1. **Phase 1 — Governance & evidence prep (this session):** record direction (ledger #34, E-019), master plan, agents/ roadmap, desktop Tier-2 evidence kit, T-13 doc correction, verification battery.
2. **Phase 2 — Engineering gates:** full-suite count (P-01), bundle audit (P-02), a11y sweep (E-02), mock-data audit — close all open verification items.
3. **Phase 3 — UI/UX flagship:** design-system audit (UI-01) → typography/density (UI-02) → navigation (UI-03) → tables/forms/empty-states sweep (UI-04…06) → light-theme pass (UI-07) → a11y/keyboard (UI-08).
4. **Phase 4 — Depth:** end-to-end loop audit (D-01) → sub-ledger depth (D-02…07) → integrations verification (D-08) → sector-page audit (D-09).
5. **Phase 5 — Performance:** cold-start, render, virtualization, memory (P-03…08).
6. **Phase 6 — Evidence:** execute desktop Tier-2 loop (R-02…04) as owner decides; feed R-04 pilot selection.

## 8. Honesty appendix (non-negotiable)

- All 14 assumptions remain **UNVALIDATED**. Building breadth ≠ validating A-03/A-09.
- Sector pages are breadth, not certified vertical depth, until evidence exists.
- No fabricated waitlist/users/testimonials; counters are real counters.
- Capability Truth Matrix maturity columns stay UNVERIFIED without evidence.
- Every claim in docs links to evidence (D-002 three-witnesses discipline).
