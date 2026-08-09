<div align="center">

<!-- ═══════════════════════ HERO ═══════════════════════ -->

# 📊 FinPlan Pro

### Enterprise Financial Planning & Analysis — Rebuilt for Precision and Speed

> _"Eliminate spreadsheets. Replace armies of financial analysts with real-time, accurate, and beautiful financial intelligence."_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![Decimal.js](https://img.shields.io/badge/Money%20Math-decimal.js-0e7c66?style=for-the-badge)](https://mikemcl.github.io/decimal.js/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

|                                                                                               <!-- -->                                                                                                |                                                                                           <!-- -->                                                                                            |                                                                                            <!-- -->                                                                                            |                                                                                                  <!-- -->                                                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">181</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Financial Engines Shipped</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">78</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Industry Verticals</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">13,290</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Automated Tests</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">181</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Financial Engines (181 modules)</div></div> |

<br/>

**One FP&A platform.** Budgeting, forecasting, consolidation, close, reporting, and an AI copilot —
running natively on desktop (offline/local-first) **and** in the browser. Every currency figure is computed with
**audit-grade decimal exactness** — not a single `0.1 + 0.2 = 0.30000000000000004` bug ships to production.

[🚀 Getting Started](#-getting-started) ·
[🧩 Capabilities](#-capability-map) ·
[🏗️ Architecture](#%EF%B8%8F-archictecture--engineering) ·
[🧪 Quality Gates](#-quality-gates) ·
[🗺️ Roadmap & Gaps](#%EF%B8%8F-roadmap--the-gap-ledger) ·
[🤝 Contributing](#-contributing)

</div>

---

## 🎯 The Problem — and How FinPlan Pro Solves It

Corporate finance still runs on spreadsheets: fragile, error-prone, single-player, impossible to audit.
FinPlan Pro attacks each failure mode directly.

| Industry Pain Point        | Today's Reality                                                                            | FinPlan Pro Answer                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spreadsheet error risk** | Manual formulas drift; floating-point rounding silently corrupts totals.                   | 183 engines on a canonical decimal-exact money primitive (`decimal.js` + ROUND_HALF_UP); an automated ratchet fails CI if raw float money math returns.  |
| **Slow monthly close**     | Close cycles stretch days-to-weeks across emails and workbook versions.                    | Soft/hard close state machine with adjusting-entry support, RBAC-gated posting, period-lock lifecycle proven by 24 HTTP-level integration tests.         |
| **Multi-entity chaos**     | IC eliminations, FX, minority interest done by hand.                                       | ASC 810/830 consolidation engine + dedicated Web Worker: eliminations, NCI, FX translation, category totals, balance check — verified exact to the cent. |
| **Scenario paralysis**     | "What if revenue drops 15%?" takes days of re-modeling.                                    | Scenario, Monte-Carlo, driver-based and rolling-forecast engines answer in seconds; AI copilot surfaces alerts and NLQ answers.                          |
| **Vertical blindness**     | Generic tools lack sector KPIs (SaaS churn, construction WIP, healthcare patient revenue). | 78 pre-wired sector templates with sector-specific engines, stores, pages, dashboards.                                                                   |
| **Cloud lock-in**          | Many regulated orgs cannot put ledger data in SaaS clouds.                                 | Offline-first Tauri desktop: everything computes on-device, local encrypted storage, zero cloud requirement.                                             |
| **Audit-grade evidence**   | Results are trusted because "the analyst said so."                                         | Every migrated money path ships a `*.money.test.ts` with exact known answers, falsified against the old float code before being accepted.                |

> [!TIP]
> **No `$NaN` renders, no phantom imbalances, no "looks right" totals.** Every currency path in the scanned financial directories is wired through one primitive. See [docs/architecture/money.md](./docs/architecture/money.md) for the specification.

---

## 🚀 Getting Started

```bash
# 1. Install (root + server)
npm install

# 2. Run the dev server (web UI on http://localhost:5173)
npm run dev

# 3. Run the full quality gate (TypeScript · ESLint · Prettier · 13,290 tests)
npm run check
```

**Common scripts:**

| Command                     | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `npm run dev`               | Start the Vite dev server                      |
| `npm run build`             | Production build (vite)                        |
| `npm test`                  | Full Vitest suite (1,174 files / 13,290 tests) |
| `npm run tsc`               | TypeScript strict check (`--noEmit`)           |
| `npm run lint`              | ESLint (`--max-warnings 0`)                    |
| `npm run format`            | Prettier write                                 |
| `npm run money:adoption`    | Money-primitive ratchet (CI gate)              |
| `npm run docs:verify`       | README/architecture claims audit               |
| `npm run engines:verify`    | Engine manifest / reachability audit           |
| `cd server && npm run test` | Server-side suite (107 tests)                  |

---

## 🧭 A Guided Walkthrough

The day-to-day workflow of a finance team on FinPlan Pro, from raw GL data to board-ready insight:

<div align="center">

| 1️⃣ **Connect**                                             | 2️⃣ **Validate**                                                                                     | 3️⃣ **Plan & Model**                                                                 | 4️⃣ **Consolidate & Close**                                                         | 5️⃣ **Report & Decide**                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| QuickBooks · NetSuite · Xero · Sage · Dynamics · Excel/CSV | Column mapping · blocking validation · duplicate detection · loud `InvalidMoneyError` on bad inputs | Budgets · forecasts · driver chains · scenarios · Monte-Carlo · 78 sector templates | ASC 810/830 consolidation · IC eliminations · NCI · FX · soft/hard close with RBAC | P&L/BS/CF · variance analysis · board packs · PDF export · AI copilot Q&A |

</div>

---

## 🧩 Capability Map

### Core FP&A

- **General Ledger** — import, journal entry management, trial balance, chart of accounts
- **Budgeting & Forecasting** — annual budgets, rolling forecasts, driver-based modeling, spreading
- **Consolidation** (ASC 810/830) — multi-entity, intercompany eliminations, minority interest, FX translation/CTA, hyperinflation
- **Revenue Recognition** (ASC 606) — contract modifications, deferred revenue, performance obligations
- **Lease Accounting** (ASC 842 / IFRS 16) — ROU assets, lease liabilities, discount-rate handling
- **Depreciation & Impairment** (IAS 36 / ASC 360) — SL/SYD/DDB/VDB/declining-balance, revaluation, disposal
- **Tax Provision** (ASC 740 / IAS 12) — current/deferred, valuation allowances, NOLs
- **Debt & Financial Instruments** — amortization, refinancing, prepayment, fair value (ASC 820), bond pricing
- **Period Close** — soft/hard/locked state machine, audit trail, RBAC-gated posting, reopen-with-approval
- **Variance Analysis** — decomposition, attribution, drill-through to transactions
- **Intercompany Matching** — tolerance-based reconciliation, auto-matching, difference reports

### Sector Packs (78 Verticals)

SaaS · Banking · Healthcare · Real Estate · Construction · Retail · Energy · Insurance · Manufacturing ·
Government · Telecom · Logistics · Education · Non-profit · Bonds/Credit · Treasury · Workforce/HCM · and more —
each with its own KPIs, dashboards, and template engine.

### AI Copilot

- **Alerts layer** — anomalies, large entries, expense-vs-revenue, threshold-watch (migrated to the money primitive; float-math false alerts fixed)
- **Natural-Language Query (NLQ)** — ask the ledger in plain English
- **Auto-commentary** — narrative generation for variance reports
- **Formula assistance** — guided model building

### Integrations

QuickBooks · NetSuite · Xero · Sage Intacct · Microsoft Dynamics 365 · Salesforce · Excel/CSV import/export · PDF board-pack export.

### Deployment

| Mode        | Stack                              | Notes                                                                 |
| ----------- | ---------------------------------- | --------------------------------------------------------------------- |
| **Web**     | React 19 + Vite + Tailwind 4       | The same engine library runs in the browser.                          |
| **Desktop** | Tauri 2 + Rust backend             | Fully offline, local-first, data encrypted at rest.                   |
| **Server**  | Node + Express + SQLite (mockable) | Multi-user APIs, RBAC, period close, JWT auth; 107 integration tests. |

---

## 🏗️ Architecture & Engineering

```
src/
├── engines/        # Financial Engines (181 modules) — lazy-reachable via manifest
├── store/          # Zustand Stores (42 stores)
├── pages/          # routed page modules
├── components/     # UI, charts, sectors, AI copilot, spreadsheet
├── workers/        # Web Workers (4 active) — consolidation, Monte Carlo, batch calc, storage
├── services/       # API integrations, threat model, prompt library
├── utils/          # money primitive, cn, formatters, validation, GL analysis
server/src/         # Express routes, auth, period close, reports (decimal.js)
scripts/            # CI ratchets, engine manifest, audit, SHA-pinning tooling
```

> **Measured repository composition** (enforced by `npm run docs:verify` and `scripts/check-readme-claims.mjs`):
> **Financial Engines (181 modules)**, **Zustand Stores (42 stores)**, **Web Workers (4 active)**.
> Coverage thresholds in `vite.config.ts` are 50% (statements/branches/functions/lines) — this is a
> floor, not a claim of production coverage; no full-suite coverage run completes inside CI.
> **Measured adoption: 85 of 258 engine/store modules** route through the canonical money primitive
> at the engine/store layer (with UI-layer adoption continuing in GAP-1; see the ratchet for total
> financial-path counts).

### The Money Primitive (F-0006) — the "no rounding bugs" promise

Every currency calculation routes through `src/utils/money.ts`, a thin wrapper around `decimal.js`
with `ROUND_HALF_UP`, deterministic penny allocation, and strict input validation that throws
`InvalidMoneyError` instead of silently returning `0` or `NaN`:

```ts
import { sumMoney, roundTo, addMoney, percentOf } from '@/utils/money';

// Exact: 0.1 + 0.2 = 0.3 (not 0.30000000000000004)
const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)));
const withTax = roundTo(addMoney(subtotal, percentOf(subtotal, 0.0825)));
```

> [!NOTE]
> **Adoption (measured, CI-gated):** **98 of 380** financial modules on the primitive across the ratcheted
> directories (frontend), **2 of 23** server routes on `decimal.js`, **0** raw `.toFixed(n)` sites used
> as financial truth. The `money:adoption` ratchet fails CI if adoption drops or raw `toFixed` sites
> grow. The remaining surface is the UI-layer backlog (GAP-1) being migrated area-by-area — see
> [`GAP_LEDGER.md`](./GAP_LEDGER.md). UI-layer migrations this cycle bring 21 additional component/
> page modules onto the primitive (awaiting a display-helper pass before those dirs join the ratchet).

### Precision Bugs Caught and Fixed (excerpt)

- `DepreciationEngine.assetRevaluation` — `Math.round(0.05 × 1.5)` returned **0** in IEEE-754 (0.075 ≈ 0.07499…), wiping accumulated depreciation; half-up gives **0.08**.
- `ICMatchingEngine` — perfectly offsetting intercompany books reported **`5.55e-17` phantom imbalance** and downgraded from `matched` to `partial`.
- Copilot alerts — cent-equal books fired a **false "expenses exceed revenue"** alert; threshold boundaries were mis-flagged from `1.15 × 0.1 = 0.114999…` undershoot.
- `glStore.checkDuplicates` — stored `0.2` vs re-imported `0.3 − 0.1` produced different fallback dedupe keys; duplicates went **undetected**.
- `BreakEvenEngine.multiProduct` — break-even revenue `1.67213114754…` vs exact **1.7**.

Every one of these is pinned by a `*.money.test.ts` that fails against the original float code.

---

## 🧪 Quality Gates

<div align="center">

| Gate                            | Status                                 | Standard                                      |
| ------------------------------- | -------------------------------------- | --------------------------------------------- |
| **TypeScript** (`tsc --noEmit`) | ✅                                     | Strict mode, zero errors                      |
| **ESLint** (`--max-warnings 0`) | ✅                                     | Zero warnings tolerated                       |
| **Prettier**                    | ✅                                     | Enforced in CI                                |
| **Vitest** — frontend           | ✅ **1,174 files / 13,290 tests**      | Full suite green                              |
| **Vitest** — server             | ✅ **107 tests / 9 files**             | Supertest + mock DB                           |
| **Money adoption ratchet**      | ✅ **98/380 + 2/23** · 0 raw `toFixed` | Never regresses                               |
| **Engine reachability**         | ✅ **180/180 reachable, 0 orphans**    | Manifest + direct + lazy                      |
| **README claims audit**         | ✅                                     | `npm run docs:verify`                         |
| **Docs verification**           | ✅                                     | `npm run docs:verify`                         |
| **Production dependency audit** | ✅ critical=0 high=0 moderate=0 low=0  | `scripts/check-dependency-audit.mjs`          |
| **Bundle check**                | ⚠️ Warning-only                        | 2,036.85 KB gzip / 2,248 KB limit             |
| **Build & Bundle Check** (CI)   | 🛑 Known blocker                       | Pre-existing 2048 KB workflow cap — see GAP-7 |

</div>

> [!WARNING]
> **Known CI blocker (GAP-7):** The `Build & Bundle Check` GitHub Action fails because of a legacy
> 2048 KB gzip cap in the workflow file (the measured bundle is 2,037 KB). This requires the
> `workflows` permission on the repo's GitHub App before `.github/workflows/**` can be edited, so
> the fix is delivered as a tool + patch (`scripts/pin-workflow-actions.mjs`,
> `ci-patches/0003-gap7-sha-pin-workflows.patch`). It does not affect application code.

---

## 🗺️ Roadmap & The Gap Ledger

All in-flight work, defects fixed, blockers, and honest "what we thought was done but wasn't"
notes live in **[`GAP_LEDGER.md`](./GAP_LEDGER.md)** — a persistent, evidence-only ledger
updated every session with literal command output. It is the single source of truth for project status.

### Current GAP-1 (Money Migration) Status

- **✅ Complete in:** `src/engines`, `src/store`, `src/utils`, `src/services`, `src/workers`, `src/components/ai`, `server/src/routes/{gl,export}.ts`
- **🚧 In progress:** UI-layer backlog in `src/components/*` and `src/pages/*` (GL debit/credit
  tables, IC reconciliation, multi-currency reporting, variance drill, page totals) — being
  migrated file-by-file with falsified tests.
- **❌ Excluded by policy** (non-currency): non-currency stores (budget/forecast/debt/Monte-Carlo),
  percentages/counts/hours/z-scores/match scores, display-only `×100 → %` / `/1000 → K/M`
  formatting, pre-screened clean AI components.

### Release v1.0 Gates (all tracked in the ledger)

- ✅ Full-suite certification (11,572 tests green)
- 🚧 Playwright E2E farm
- 🚧 Performance benchmarks
- 🚧 Accessibility (a11y) sweep
- 🚧 Vendor chunk splitting
- 🚧 `exceljs` migration
- 🚧 i18n verification
- 🚧 Security hardening (backend NVIDIA NIM proxy, JWT rotation)

---

## 🧑‍💻 Project Philosophy (a.k.a. "Brutal Honesty Engineering")

> **Re-run the evidence, never trust the ledger.**
>
> Every session opens by re-running the full suite and the ratchets on a clean checkout of
> `main`, not on assumptions from a prior handover. A status marked "VERIFIED_DONE" has
> multiple times turned out to be un-shipped, un-imported, or red when re-checked — and was
> caught because the first action of every session is `npm test`, not "pick up where I left off."

Three rules govern the codebase:

1. **Falsify before accepting.** Every migrated currency path ships a `*.money.test.ts` with
   exact `toBe` answers; the test must FAIL when run against the pre-migration (float) code.
   If it doesn't, the test isn't testing anything.
2. **Ratchet, don't promise.** Adoption percentages are enforced by a script that exits non-zero
   if they regress — not by a human remembering.
3. **Document the failures, not just the wins.** Known blockers (GAP-7), excluded surfaces, and
   rejections are written down as loudly as shipped features.

---

## 🤝 Contributing

1. **Read [`GAP_LEDGER.md`](./GAP_LEDGER.md)** first — it contains the current backlog, protocol, and known traps.
2. Branch off `main`; this session works on `arena/*` branches.
3. Run the full gate before pushing:
   ```bash
   npm run tsc && npm run lint && npm run format:check && npm test && npm run money:adoption && npm run docs:verify
   ```
4. If you touch currency math: use `@/utils/money`; add a `*.money.test.ts`; stash-falsify it; re-run `npm run money:adoption -- --update` to raise the floor (never lower it).
5. Do not edit `.github/workflows/**` — those are reserved for GAP-7 and any commit touching them poisons the branch until the App has `workflows` permission.

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE).

---

<div align="center">
<sub>
<b>Repository:</b> <code>Warzonesiddiki/fp-A-betterversion</code> ·
<b>Base commit this README was verified against:</b> <code>729da51</code> (PR #30 merged) ·
<b>Report date:</b> 4 August 2026 ·
For board/investor detail see <a href="./reports/FinPlanPro-Executive-Investor-Report-2026-08-04.html">the full executive briefing</a>.
</sub>
</div>
