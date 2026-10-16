# FinPlan Pro

**Desktop FP&A workspace (Tauri 2 + React 19 + TypeScript).** Budgeting, forecasting, consolidation, period close, reporting and an AI copilot, with financial math routed through an exact-decimal money primitive (`src/utils/money.ts`, `decimal.js`, ROUND_HALF_UP).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> **Status (2026-10-15): pre-release, not usable end-to-end.** This README states only what has been
> measured on a clean checkout; the numbers below are produced by scripts and checked by
> `npm run docs:verify`, which fails the build when the README and the tree disagree. The current
> gap analysis and the prioritised work list live in
> [`docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`](./docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md).
> Read that before the capability list.

---

## What is true today

| Area                       | Measured state                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type check / lint / format | `tsc --noEmit`, `eslint src --max-warnings 0`, `prettier --check` are clean.                                                                                                                                                                                                                                             |
| Unit tests (frontend)      | ~1,315 files · ~13,350 tests via `npm run test:sharded`. Green on this branch after the 2026-10-15 fixes (clock-dependent period-close suites, stale icon mock). `main` CI has been red since 2026-08-20 — see the audit.                                                                                                |
| Unit tests (server)        | 32 files, green after the 2026-10-15 fix (clock-relative audit-prune fixture).                                                                                                                                                                                                                                           |
| Money primitive            | `src/utils/money.ts` is correct and tested. **Adoption is 28.9 %** of financial modules (`npm run money:adoption`). The AST ratchet (`npm run money:ast`) reports 0 _detected_ unsafe ops in scanned paths; that is a ratchet floor, not proof. Core domain types (`GLEntry.debit/credit/amount`) are still JS `number`. |
| Engines                    | 182 engine modules in `src/engines`; **95 reachable engines** from runtime code, **87 orphan engines** with no page/store/service caller (`node scripts/verify-readme-stats.mjs --list`).                                                                                                                                |
| Stores                     | 46 Zustand store modules; 42 persisted. Financial data is persisted as encrypted JSON blobs in a single key-value table; the 35-table relational schema in `src-tauri/migrations` is not written by the app.                                                                                                             |
| Server (`server/`)         | Express + SQLite with JWT, RBAC, tenancy and period-close routes. **No frontend module calls it.** It is not bundled with the desktop app.                                                                                                                                                                               |
| Runtime                    | Desktop-only: a plain browser is blocked by the Tauri runtime gate (`src/utils/tauriRuntime.ts`). Production builds refuse mock auth; real auth needs a running server — so an offline desktop build cannot currently sign in. Decision pending (audit §8, P0-3).                                                        |
| Integrations               | Connector classes for QuickBooks, NetSuite, Xero, Sage, Dynamics (Dataverse), Salesforce, Stripe, Plaid, Slack exist with OAuth/HTTP code and tests, but **none is wired to a page**. CSV/Excel GL import is wired.                                                                                                      |
| Exports                    | Excel (`exceljs`) and PDF (`jspdf`). No PowerPoint. No cross-artifact tie-out test.                                                                                                                                                                                                                                      |
| Coverage gate              | 50 % statements/branches/functions/lines in `vite.config.ts` (a floor, not a measured figure).                                                                                                                                                                                                                           |
| Dependency advisories      | `npm audit --omit=dev` on 2026-10-15: root 3 high / 1 moderate / 1 low; server 1 critical / 4 moderate. Open.                                                                                                                                                                                                            |

---

## Getting started

Requirements: Node 22, npm 10+. Rust toolchain only if you build the desktop shell.

```bash
npm install                      # root
(cd server && npm install)       # optional: the Express API

npm run dev                      # Vite on :5173 — NOTE: the app blocks plain browsers (desktop-only gate)
npm run tauri:dev                # desktop shell (requires Rust + Tauri prerequisites)

npm run check                    # the whole gate: tsc · eslint · prettier · docs · engines · money · determinism · fabrication · sharded tests
```

| Script                            | Purpose                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run tsc`                     | TypeScript strict check (`--noEmit`)                                             |
| `npm run lint` / `lint:fix`       | ESLint with `--max-warnings 0` / with `--fix`                                    |
| `npm run format` / `format:check` | Prettier write / check                                                           |
| `npm test`                        | Full Vitest suite in one process (asks for an 8 GB heap)                         |
| `npm run test:sharded`            | Same suite in 8 sequential shards — use this on machines with < 8 GB free        |
| `npm run test:e2e`                | Playwright (shims the Tauri runtime; it does not exercise the real shell)        |
| `npm run money:ast`               | AST money-safety ratchet                                                         |
| `npm run money:adoption`          | Money-primitive adoption (percentage of financial modules on `@/utils/money`)    |
| `npm run determinism:ratchet`     | Wall-clock / `Math.random` call sites in calculation paths must not rise per file |
| `npm run docs:verify`             | README / persistence-map / schema-home truth checks (fails on unmeasured claims) |
| `npm run engines:verify`          | Engine manifest is current                                                       |
| `npm run check`                   | Everything above plus the sharded suite, with an honest exit code                |
| `cd server && npm test`           | Server suite (Supertest + SQLite)                                                |

---

## Repository layout

```
src/
├── engines/        # Financial Engines (182 modules) — 95 reachable, 87 orphans (see audit P1-12)
├── store/          # Store Architecture (48 Stores) — Zustand; 44 persisted via masterStorage
├── pages/          # routed page modules (242 <Route>s — scope reduction is audit P1-6)
├── components/     # UI, charts, sectors, AI copilot, spreadsheet
├── workers/        # Active Workers (5) — consolidation, Monte Carlo, batch calc, storage, GL staging
├── services/       # connectors (unwired), import pipeline, client-side security modules (several unused)
├── utils/          # money primitive, clock, formatters, validation, storage
server/src/         # Express routes, auth, tenancy, period close (not called by the client)
src-tauri/          # Tauri 2 shell (Rust, 3 modules), capabilities, SQL migrations (unused tables)
scripts/            # ratchets, manifests, truth checks
docs/               # architecture, ADRs, security, audits
```

---

## Engineering rules that are actually enforced

1. **Measured, or not stated.** Any number in this README must come from a script. `npm run docs:verify` rejects "100 %" style claims that no script produces and rejects engine/store/worker counts that disagree with the tree.
2. **Money through one primitive.** New or touched financial code uses `@/utils/money` and ships a `*.money.test.ts` with exact expected values that fail against float arithmetic. `npm run money:ast` must stay at 0 unsafe ops; `npm run money:adoption` must not regress.
3. **Deterministic code.** Pages, stores and engines read time through `src/utils/clock.ts` (`now()`, `todayISO()`), never `new Date()` directly, so tests can pin the clock. Random sources are seeded. `npm run determinism:ratchet` fails if any calculation-path file gains a `new Date()` / `Date.now()` / `Math.random()` site (baseline recorded 2026-10-15 in `scripts/determinism-baseline.json`, 684 → 638 so far; the goal is to drive it to zero).
4. **Tests use the shared mocks.** `lucide-react` is mocked globally in `src/test/setup.ts`; do not hand-mock it per file (partial mocks rot when a page adopts a new icon).
5. **Do not edit `.github/workflows/**`from an agent session.** The GitHub App lacks the`workflows` permission; CI changes must be applied by a human (`ci-patches/README.md`).
6. **Imports are idempotent and traceable.** `importGLData` rejects a file whose content hash was already imported, commits a batch all-or-nothing on validation errors, reports every rejected source row with a reason, and stamps `provenance {batchId, fileHash, sourceFile, sourceRow}` on every entry. Contract tests: `src/store/glStore.provenance.test.ts`.

---

## Where the plan lives

- **Discovery & governance pack (plan of record, proposed):** [`docs/discovery/`](./docs/discovery) — charter, requirements register (FR/UX/NFR/AI), risk register, decision log (DEC-001…006, all awaiting owner), gated roadmap, and the executed audit-progress record.
- **Gap analysis and prioritised work list:** [`docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`](./docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md) §8 (P0 → P2).
- **Architecture notes and ADRs:** [`docs/architecture/`](./docs/architecture), [`docs/adr/`](./docs/adr).
- **Security policies:** [`docs/security/`](./docs/security), [`SECURITY.md`](./SECURITY.md).
- Historical plans, handovers and prior audits are numerous and partly contradictory; the discovery pack and the audit above supersede them until they are consolidated (audit P0-4 / DEC-006).

---

## Contributing

1. Branch from `main`. One work item per commit; the commit message says what was measured.
2. Run `npm run check` before pushing. If it is red, fix it or record exactly why in the PR — do not weaken a gate.
3. Touching money: `@/utils/money`, exact-answer tests, falsify against float, keep the ratchets green.
4. Touching time: `@/utils/clock`.
5. New routes, engines or stores need a runtime consumer in the same PR — a file with a unit test is not a feature.

## License

MIT — see [`LICENSE`](./LICENSE).
