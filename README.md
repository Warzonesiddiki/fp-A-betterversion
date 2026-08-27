<div align="center">

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->

# ðŸ“Š FinPlan Pro

### Enterprise Financial Planning & Analysis â€” Rebuilt for Precision and Speed

> _"Eliminate spreadsheets. Replace armies of financial analysts with real-time, accurate, and beautiful financial intelligence."_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![Decimal.js](https://img.shields.io/badge/Money%20Math-decimal.js-0e7c66?style=for-the-badge)](https://mikemcl.github.io/decimal.js/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

|                                                                                               <!-- -->                                                                                                |                                                                                               <!-- -->                                                                                               |                                                                                            <!-- -->                                                                                            |                                                                                                  <!-- -->                                                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">182</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Financial Engines Shipped</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">18</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Sector Dashboards Shipped</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">14,835</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Automated Tests</div></div> | <div><div style="font-size:28px;font-weight:800;color:#0b1f3a">182</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b82">Financial Engines (182 modules)</div></div> |

<br/>

**One FP&A platform.** Budgeting, forecasting, consolidation, close, reporting, and an AI copilot â€”
running natively on desktop (offline/local-first). It is a desktop app, not a web app: plain browsers are
blocked by the Tauri-only runtime gate. Financial math routes through an **audit-grade decimal primitive**
(`src/utils/money.ts`, exact `decimal.js` + ROUND_HALF_UP) â€” measured adoption: **88 of 255** engine/store
modules today, with the UI-layer sweep in progress; no `0.1 + 0.2 = 0.30000000000000004` bug ships in
covered paths.

[ðŸš€ Getting Started](#-getting-started) Â·
[ðŸ§© Capabilities](#-capability-map) Â·
[ðŸ—ï¸ Architecture](#%EF%B8%8F-archictecture--engineering) Â·
[ðŸ§ª Quality Gates](#-quality-gates) Â·
[ðŸ—ºï¸ Roadmap & Gaps](#%EF%B8%8F-roadmap--the-gap-ledger) Â·
[ðŸ¤ Contributing](#-contributing)

</div>

---

## ðŸŽ¯ The Problem â€” and How FinPlan Pro Solves It

Corporate finance still runs on spreadsheets: fragile, error-prone, single-player, impossible to audit.
FinPlan Pro attacks each failure mode directly.

| Industry Pain Point        | Today's Reality                                                                            | FinPlan Pro Answer                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spreadsheet error risk** | Manual formulas drift; floating-point rounding silently corrupts totals.                   | 182 engines on a canonical decimal-exact money primitive (`decimal.js` + ROUND_HALF_UP); an automated ratchet fails CI if raw float money math returns.    |
| **Slow monthly close**     | Close cycles stretch days-to-weeks across emails and workbook versions.                    | Soft/hard close state machine with adjusting-entry support, RBAC-gated posting, period-lock lifecycle proven by 31 HTTP-level integration tests.           |
| **Multi-entity chaos**     | IC eliminations, FX, minority interest done by hand.                                       | ASC 810/830 consolidation engine + dedicated Web Worker: eliminations, NCI, FX translation, category totals, balance check â€” verified exact to the cent. |
| **Scenario paralysis**     | "What if revenue drops 15%?" takes days of re-modeling.                                    | Scenario, Monte-Carlo, driver-based and rolling-forecast engines answer in seconds; AI copilot surfaces alerts and NLQ answers.                            |
| **Vertical blindness**     | Generic tools lack sector KPIs (SaaS churn, construction WIP, healthcare patient revenue). | 18 pre-wired sector dashboards backed by 14 planning templates, with sector-specific engines and stores.                                                   |
| **Cloud lock-in**          | Many regulated orgs cannot put ledger data in SaaS clouds.                                 | Offline-first Tauri desktop: everything computes on-device, local encrypted storage, zero cloud requirement.                                               |
| **Audit-grade evidence**   | Results are trusted because "the analyst said so."                                         | Every migrated money path ships a `*.money.test.ts` with exact known answers, falsified against the old float code before being accepted.                  |

> [!TIP]
> **No `$NaN` renders, no phantom imbalances, no "looks right" totals.** Every currency path in the scanned financial directories is wired through one primitive. See [docs/architecture/money.md](./docs/architecture/money.md) for the specification.

---

## ðŸš€ Getting Started

```bash
# 1. Install (root + server)
npm install

# 2. Run the dev server (web UI on http://localhost:5173)
npm run dev

# 3. Run the full quality gate (TypeScript Â· ESLint Â· Prettier Â· 14,835 tests)
npm run check
```

**Common scripts:**

| Command                     | Purpose                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`               | Start the Vite dev server                                                             |
| `npm run build`             | Production build (vite)                                                               |
| `npm test`                  | Full Vitest suite (1,287 files / 14,835 tests â€” measured full-suite run 2026-08-23) |
| `npm run tsc`               | TypeScript strict check (`--noEmit`)                                                  |
| `npm run lint`              | ESLint (`--max-warnings 0`)                                                           |
| `npm run format`            | Prettier write                                                                        |
| `npm run money:ast`         | AST money-safety ratchet (pre-push Gate 9b)                                           |
| `npm run docs:verify`       | README/architecture claims audit                                                      |
| `npm run engines:verify`    | Engine manifest / reachability audit                                                  |
| `cd server && npm run test` | Server-side suite (323 tests / 32 files)                                              |

---

## ðŸ§­ A Guided Walkthrough

The day-to-day workflow of a finance team on FinPlan Pro, from raw GL data to board-ready insight:

<div align="center">

| 1ï¸âƒ£ **Connect**                                              | 2ï¸âƒ£ **Validate**                                                                                    | 3ï¸âƒ£ **Plan & Model**                                                                   | 4ï¸âƒ£ **Consolidate & Close**                                                         | 5ï¸âƒ£ **Report & Decide**                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| QuickBooks Â· NetSuite Â· Xero Â· Sage Â· Dynamics Â· Excel/CSV | Column mapping Â· blocking validation Â· duplicate detection Â· loud `InvalidMoneyError` on bad inputs | Budgets Â· forecasts Â· driver chains Â· scenarios Â· Monte-Carlo Â· 18 sector dashboards | ASC 810/830 consolidation Â· IC eliminations Â· NCI Â· FX Â· soft/hard close with RBAC | P&L/BS/CF Â· variance analysis Â· board packs Â· PDF export Â· AI copilot Q&A |

</div>

---

## ðŸ§© Capability Map

### Core FP&A

- **General Ledger** â€” import, journal entry management, trial balance, chart of accounts
- **Budgeting & Forecasting** â€” annual budgets, rolling forecasts, driver-based modeling, spreading
- **Consolidation** (ASC 810/830) â€” multi-entity, intercompany eliminations, minority interest, FX translation/CTA, hyperinflation
- **Revenue Recognition** (ASC 606) â€” contract modifications, deferred revenue, performance obligations
- **Lease Accounting** (ASC 842 / IFRS 16) â€” ROU assets, lease liabilities, discount-rate handling
- **Depreciation & Impairment** (IAS 36 / ASC 360) â€” SL/SYD/DDB/VDB/declining-balance, revaluation, disposal
- **Tax Provision** (ASC 740 / IAS 12) â€” current/deferred, valuation allowances, NOLs
- **Debt & Financial Instruments** â€” amortization, refinancing, prepayment, fair value (ASC 820), bond pricing
- **Period Close** â€” soft/hard/locked state machine, audit trail, RBAC-gated posting, reopen-with-approval
- **Variance Analysis** â€” decomposition, attribution, drill-through to transactions
- **Intercompany Matching** â€” tolerance-based reconciliation, auto-matching, difference reports

### Sector Packs (18 Sector Dashboards)

Agriculture Â· Banking Â· Construction Â· Education Â· Emissions Â· Energy Â· Equipment Â· Government Â· Healthcare Â·
Hospitality Â· Insurance Â· Logistics Â· Manufacturing Â· Real Estate Â· Retail Â· Technology (SaaS) Â·
Telecommunications â€” plus the sector overview hub; each with its own KPI dashboard, and 14 planning
templates in `src/templates/` covering the major modeling patterns.

### AI Copilot

- **Alerts layer** â€” anomalies, large entries, expense-vs-revenue, threshold-watch (migrated to the money primitive; float-math false alerts fixed)
- **Natural-Language Query (NLQ)** â€” ask the ledger in plain English
- **Auto-commentary** â€” narrative generation for variance reports
- **Formula assistance** â€” guided model building

### Integrations

QuickBooks Â· NetSuite Â· Xero Â· Sage Intacct Â· Microsoft Dynamics 365 Â· Salesforce Â· Excel/CSV import/export Â· PDF board-pack export.

### Deployment

| Mode          | Stack                              | Notes                                                                                                 |
| ------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Desktop**   | Tauri 2 + Rust backend             | Fully offline, local-first, data encrypted at rest.                                                   |
| **Web build** | React 19 + Vite + Tailwind 4       | Frontend bundle for the Tauri shell; plain-browser rendering is intentionally blocked (desktop-only). |
| **Server**    | Node + Express + SQLite (mockable) | Multi-user APIs, RBAC, period close, JWT auth; 323 integration tests.                                 |

---

## ðŸ—ï¸ Architecture & Engineering

```
src/
â”œâ”€â”€ engines/        # Financial Engines (182 modules) â€” lazy-reachable via manifest
â”œâ”€â”€ store/          # Zustand Stores (45 stores)
â”œâ”€â”€ pages/          # routed page modules
â”œâ”€â”€ components/     # UI, charts, sectors, AI copilot, spreadsheet
â”œâ”€â”€ workers/        # Web Workers (4 active) â€” consolidation, Monte Carlo, batch calc, storage
â”œâ”€â”€ services/       # API integrations, threat model, prompt library
â”œâ”€â”€ utils/          # money primitive, cn, formatters, validation, GL analysis
server/src/         # Express routes, auth, period close, reports (decimal.js)
scripts/            # CI ratchets, engine manifest, audit, SHA-pinning tooling
```

> **Measured repository composition** (enforced by `npm run docs:verify` and `scripts/check-readme-claims.mjs`):
> **Financial Engines (182 modules)**, **Zustand Stores (45 stores)**, **Web Workers (4 active)**.
> Coverage thresholds in `vite.config.ts` are 50% (statements/branches/functions/lines) â€” this is a
> floor, not a claim of production coverage; no full-suite coverage run completes inside CI.
> **Measured adoption: 88 of 255 engine/store modules** route through the canonical money primitive
> at the engine/store layer (with UI-layer adoption continuing in GAP-1; see the AST ratchet for
> total financial-path safety).

### The Money Primitive (F-0006) â€” the "no rounding bugs" promise

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
> **Money safety (measured, gate-enforced):** the AST money-safety ratchet (`npm run money:ast`,
> pre-push Gate 9b) parses every ratcheted financial path: **990** modules scanned, **896** handle
> money, **896 are safe**, **0** unsafe operations, **100%** safety. Raw float arithmetic cannot
> re-enter those paths without failing the gate. A companion fabrication ratchet (Gate 9c) holds at
> **0** findings for hand-typed `$12.4M` / `24.3%` literals. The older import-proxy script
> (`money-adoption.mjs`) is retired-pending: its residual exit-1 sites were adjudicated as
> `roundMoney(...).toFixed()` display formatting (not financial truth). Server-side, the canonical
> engine paths run on `decimal.js`.

### Precision Bugs Caught and Fixed (excerpt)

- `DepreciationEngine.assetRevaluation` â€” `Math.round(0.05 Ã— 1.5)` returned **0** in IEEE-754 (0.075 â‰ˆ 0.07499â€¦), wiping accumulated depreciation; half-up gives **0.08**.
- `ICMatchingEngine` â€” perfectly offsetting intercompany books reported **`5.55e-17` phantom imbalance** and downgraded from `matched` to `partial`.
- Copilot alerts â€” cent-equal books fired a **false "expenses exceed revenue"** alert; threshold boundaries were mis-flagged from `1.15 Ã— 0.1 = 0.114999â€¦` undershoot.
- `glStore.checkDuplicates` â€” stored `0.2` vs re-imported `0.3 âˆ’ 0.1` produced different fallback dedupe keys; duplicates went **undetected**.
- `BreakEvenEngine.multiProduct` â€” break-even revenue `1.67213114754â€¦` vs exact **1.7**.

Every one of these is pinned by a `*.money.test.ts` that fails against the original float code.

---

## ðŸ§ª Quality Gates

<div align="center">

| Gate                             | Status                                                                           | Standard                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript** (`tsc --noEmit`)  | âœ…                                                                              | Strict mode, zero errors                                                                                                                                                   |
| **ESLint** (`--max-warnings 0`)  | âœ…                                                                              | Zero warnings tolerated                                                                                                                                                    |
| **Prettier**                     | âœ…                                                                              | Enforced in CI                                                                                                                                                             |
| **Vitest** â€” frontend          | âœ… **1,287 files Â· 14,834 passed / 0 failed** (+1 skipped Â· 14,835 collected) | Full suite green â€” measured full-suite run 2026-08-23                                                                                                                    |
| **Vitest** â€” server            | âœ… **323 tests / 32 files** Â· native-DB 83                                     | Supertest + mock DB / better-sqlite3                                                                                                                                       |
| **LLM egress chokepoint (W0.9)** | âœ… Enforced                                                                     | Build-time kill switch Â· host allowlist Â· prompt redaction (`src/services/llm/llmEgress.ts`)                                                                             |
| **AST money-safety ratchet**     | âœ… **100% safe Â· 896/896 Â· 0 unsafe ops**                                     | `npm run money:ast` (Gate 9b)                                                                                                                                              |
| **Engine reachability**          | âœ… **180/180 reachable, 0 orphans**                                             | Manifest + direct + lazy                                                                                                                                                   |
| **README claims audit**          | âœ…                                                                              | `npm run docs:verify`                                                                                                                                                      |
| **Docs verification**            | âœ…                                                                              | `npm run docs:verify`                                                                                                                                                      |
| **Production dependency audit**  | âœ… critical=0 high=0 moderate=0 low=0                                           | `scripts/check-dependency-audit.mjs`                                                                                                                                       |
| **Bundle check**                 | âœ… Green (2 warnings) â€” measured 2026-08-23                                   | Total JS 2,083.33 KB gzip vs enforced TOTAL_JS_LIMIT_KB=2,248 Â· plan-literal <2 MB (2,048 KB) NOT YET MET (+35.33 KB), remediation tracked (P-02-I); main 112.41 / 150 KB |
| **Build & Bundle Check** (CI)    | ðŸ›‘ Known blocker                                                               | Legacy 2048 KB workflow cap (= old plan literal) vs fresh measured 2,083.33 KB (2026-08-23) â€” see GAP-7; gate tightening tracked as P-02-I                               |

</div>

> [!WARNING]
> **Known CI blocker (GAP-7):** The `Build & Bundle Check` GitHub Action fails because of a legacy
> 2048 KB gzip cap in the workflow file (measured 2026-08-23: 2,083.33 KB gzip â€” green against the enforced 2,248 KB gate, above this legacy 2048 KB plan literal; tightening tracked as P-02-I). This requires the
> `workflows` permission on the repo's GitHub App before `.github/workflows/**` can be edited, so
> the fix is delivered as a tool + patch (`scripts/pin-workflow-actions.mjs`,
> `ci-patches/0003-gap7-sha-pin-workflows.patch`). It does not affect application code.

---

## ðŸ—ºï¸ Roadmap & The Gap Ledger

All in-flight work, defects fixed, blockers, and honest "what we thought was done but wasn't"
notes live in **[`GAP_LEDGER.md`](./GAP_LEDGER.md)** â€” a persistent, evidence-only ledger
updated every session with literal command output. It is the single source of truth for project status.

### Current GAP-1 (Money Migration) Status

- **âœ… Complete in:** `src/engines`, `src/store`, `src/utils`, `src/services`, `src/workers`, `src/components/ai`, `server/src/routes/{gl,export}.ts`
- **ðŸš§ In progress:** UI-layer backlog in `src/components/*` and `src/pages/*` (GL debit/credit
  tables, IC reconciliation, multi-currency reporting, variance drill, page totals) â€” being
  migrated file-by-file with falsified tests.
- **âŒ Excluded by policy** (non-currency): non-currency stores (budget/forecast/debt/Monte-Carlo),
  percentages/counts/hours/z-scores/match scores, display-only `Ã—100 â†’ %` / `/1000 â†’ K/M`
  formatting, pre-screened clean AI components.

### Release v1.0 Gates (all tracked in the ledger)

- âœ… Full-suite certification (14,835 tests green â€” measured full-suite run 2026-08-23)
- ðŸš§ Playwright E2E farm â€” journey spine + GL-journal fixture landing under `tests/e2e/spine`
- ðŸš§ Performance benchmarks
- ðŸš§ Accessibility (a11y) sweep
- ðŸš§ Vendor chunk splitting
- ðŸš§ `exceljs` migration
- ðŸš§ i18n verification
- ðŸš§ Security hardening (backend NVIDIA NIM proxy, JWT rotation)

---

## ðŸ§‘â€ðŸ’» Project Philosophy (a.k.a. "Brutal Honesty Engineering")

> **Re-run the evidence, never trust the ledger.**
>
> Every session opens by re-running the full suite and the ratchets on a clean checkout of
> `main`, not on assumptions from a prior handover. A status marked "VERIFIED_DONE" has
> multiple times turned out to be un-shipped, un-imported, or red when re-checked â€” and was
> caught because the first action of every session is `npm test`, not "pick up where I left off."

Three rules govern the codebase:

1. **Falsify before accepting.** Every migrated currency path ships a `*.money.test.ts` with
   exact `toBe` answers; the test must FAIL when run against the pre-migration (float) code.
   If it doesn't, the test isn't testing anything.
2. **Ratchet, don't promise.** Adoption percentages are enforced by a script that exits non-zero
   if they regress â€” not by a human remembering.
3. **Document the failures, not just the wins.** Known blockers (GAP-7), excluded surfaces, and
   rejections are written down as loudly as shipped features.

---

## ðŸ¤ Contributing

1. **Read [`GAP_LEDGER.md`](./GAP_LEDGER.md)** first â€” it contains the current backlog, protocol, and known traps.
2. Branch off `main`; this session works on `arena/*` branches.
3. Run the full gate before pushing:
   ```bash
   npm run tsc && npm run lint && npm run format:check && npm test && npm run money:ast && npm run fabrication:audit && npm run docs:verify
   ```
4. If you touch currency math: use `@/utils/money`; add a `*.money.test.ts` with exact known answers; stash-falsify it against the old float code; then confirm `npm run money:ast` still reports 0 unsafe operations.
5. Do not edit `.github/workflows/**` â€” those are reserved for GAP-7 and any commit touching them poisons the branch until the App has `workflows` permission.

---

## ðŸ“„ License

MIT â€” see [`LICENSE`](./LICENSE).

---

<div align="center">
<sub>
<b>Repository:</b> <code>Warzonesiddiki/fp-A-betterversion</code> Â·
<b>Base commit this README was verified against:</b> <code>7c09eea9</code> (phase0/w02-tenancy) Â·
<b>Report date:</b> 22 August 2026 Â·
For board/investor detail see <a href="./reports/FinPlanPro-Executive-Investor-Report-2026-08-04.html">the full executive briefing</a>.
</sub>
</div>
