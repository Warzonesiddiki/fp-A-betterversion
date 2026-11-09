# FinPlan Pro

**Desktop FP&A workspace (Tauri 2 + React 19 + TypeScript).** Budgeting, forecasting, consolidation, period close, reporting and an AI copilot, with an exact-decimal money primitive (`src/utils/money.ts`, `decimal.js`, ROUND_HALF_UP) and staged application adoption; canonical GL ledger fields use `Money`, while engines, services, wire contracts and display surfaces remain in migration.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> **Status rechecked 2026-11-04: pre-release; an owner-validated D365 GL cycle and live-provider verification are not demonstrated.** This README states only what has been measured on a clean checkout; the numbers below are produced by scripts and checked by `npm run docs:verify`, which fails the build when the README and the tree disagree. The code/connector audit is dated 2026-11-02; the proposed product direction and execution approach are in [`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](./docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md).

---

## What is true today

| Area                       | Measured state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Type check / lint / format | `tsc --noEmit`, `eslint src --max-warnings 0`, `prettier --check` are clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Unit tests (frontend)      | **1,461 test files** (Vitest discovery; asserted by `docs:verify`). The fresh `npm run test:sharded` attempt on 2026-11-04 timed out after 1,800 seconds at shard 7/8 and was terminated without a summary; current full-suite status is **inconclusive**. The last completed result is historical: **17,937 passed, 1 skipped; 8/8 shards** on 2026-11-02 (1,105 s). Focused connector/workflow tests passed: 16 files / 188 tests; DataFlowMap suite: 3/3. `main` CI was not freshly queried; the last recorded Actions query returned HTTP 403, so current CI is not claimed green or red. |
| Unit tests (server)        | Fresh 2026-11-04 server suite passed: 32 files / 323 tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Money primitive            | `src/utils/money.ts` provides Decimal/integer-minor-unit primitives. Historical `npm run money:adoption` on 2026-11-02 scanned 1,063 financial modules; 320 used the primitive (30.1%). The 2026-11-04 `money:ast` scan found 0 unsafe operations in its scanned financial paths after explicit suppressions; that ratchet is not an end-to-end proof. Canonical `GLEntry.debit/credit/netChange/amount` are `Money` since Q5 stage 4 (DEC-057); the hydrate gate converts representable rows and quarantines unrepresentable values. Stages 5–6 remain incomplete. |
| Engines                    | 180 engine modules in `src/engines`; **98 shipped engines** reachable from runtime code, **82 orphan engines** with no page/store/service caller (`node scripts/verify-readme-stats.mjs --list`). Unwired engines are labelled EXPERIMENTAL in the catalog (DEC-019) or retired (DEC-023).                                                                                                                                                                                                                                                                                                                                                      |     |
| Stores                     | Zustand Stores (48 stores); persisted subset via `masterStorage`. Financial data is persisted as encrypted JSON blobs in a single key-value table; the 35-table relational schema in `src-tauri/migrations` is not written by the app.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Server (`server/`)         | Express + SQLite with JWT, RBAC, tenancy and period-close routes. The GL store has a commit client (`src/sdk/`), but it is unconfigured by default; the server is not bundled with the desktop app and no other frontend path is wired to it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Runtime                    | Desktop-only: a plain browser is blocked by the Tauri runtime gate (`src/utils/tauriRuntime.ts`). Production blocks mock auth; first online enrollment/login needs the server, while an enrolled desktop can restore a cached profile offline for up to 30 days. Device-profile binding is not yet verified OS-user binding, and external egress is not fully certified absent. |
| Integrations               | `/settings/integrations` reaches the catalog → `integrationStore` → connector → `glStore` import path. Account/transaction pagination, omission reporting, and UI result/skipped-row display are covered by focused tests. Provider tests are mocked, not live. Dynamics is Dataverse CRM (not D365 F&O/Business Central GL) and is not marked ledger-importable; the owner's real D365 GL sample/control totals remain outstanding. See the [2026-11-02 recheck](./docs/discovery/VISION_ALIGNMENT_RECHECK_2026_11_02.md).                                                                                                                                                             |
| Universal import/template | The separate universal template engine has governance tests, while `GLUploadPage` currently uses `parseGLRows` and its own saved header-signature mapping profiles; the engine is not yet the upload UI's single parser. See the master plan for convergence and truthful evidence alignment. |
| Exports                    | Excel (`exceljs`), PDF (`jspdf`) and editable PowerPoint (PPTX) export code are present. `src/services/export/boardPackTieOut.integration.test.ts` exercises XLSX/PPTX tie-out against in-app GL aggregates and mismatch detection. Equivalent PDF tie-out and owner-accepted end-to-end export behavior are not established by that test. |
| Coverage gate              | The coverage thresholds in `vite.config.ts` are 50% (statements/branches/functions/lines) — a floor, not a measured figure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| Dependency advisories      | Latest recorded production audit on 2026-11-04: root 13 advisories (11 moderate, 2 high); server 2 high. Open; no dependency remediation in this audit. |

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

| Script                            | Purpose                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `npm run tsc`                     | TypeScript strict check (`--noEmit`)                                              |
| `npm run lint` / `lint:fix`       | ESLint with `--max-warnings 0` / with `--fix`                                     |
| `npm run format` / `format:check` | Prettier write / check                                                            |
| `npm test`                        | Full Vitest suite in one process (asks for an 8 GB heap)                          |
| `npm run test:sharded`            | Same suite in 8 sequential shards — use this on machines with < 8 GB free         |
| `npm run test:e2e`                | Playwright (shims the Tauri runtime; it does not exercise the real shell)         |
| `npm run money:ast`               | AST money-safety ratchet                                                          |
| `npm run money:adoption`          | Money-primitive adoption (percentage of financial modules on `@/utils/money`)     |
| `npm run determinism:ratchet`     | Wall-clock / `Math.random` call sites in calculation paths must not rise per file |
| `npm run palette:ratchet`         | Raw numbered Tailwind palette utilities under `src/` must not rise per file       |
| `npm run docs:verify`             | README / persistence-map / schema-home truth checks (fails on unmeasured claims)  |
| `npm run engines:verify`          | Engine manifest is current                                                        |
| `npm run check`                   | Everything above plus the sharded suite, with an honest exit code                 |
| `cd server && npm test`           | Server suite (Supertest + SQLite)                                                 |

---

## Repository layout

```
src/
├── engines/        # Financial Engines (180 modules) — 98 shipped, 82 orphans (see audit P1-12)
├── store/          # Store Architecture (48 Stores) — Zustand; 43 persisted via masterStorage
├── pages/          # routed page modules (227 routes: 19 SUPPORTED, 208 EXPERIMENTAL; 25 routes marked RETIRED in the register)
├── components/     # UI, charts, sectors, AI copilot, spreadsheet
├── workers/        # Web Workers (5 active) — consolidation, Monte Carlo, batch calc, storage, GL staging
├── services/       # integration connectors/import path, import/export pipeline, and client-side security modules (some unused)
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

## Product goal and execution plan

- **Product goal / north star:** [`docs/VISION.md`](./docs/VISION.md).
- **Detailed proposal for owner review:** [`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](./docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md) — proposed boundaries, architecture, import/API strategy, delivery work packages, acceptance gates, risks, success measures and review decisions.
- **High-level gated sequence:** [`docs/discovery/roadmap.md`](./docs/discovery/roadmap.md); accepted decisions remain in [`docs/discovery/decision-log.md`](./docs/discovery/decision-log.md).
- **Requirements and evidence:** [`docs/discovery/requirements-register.md`](./docs/discovery/requirements-register.md), [`docs/CAPABILITY_TRUTH_MATRIX.md`](./docs/CAPABILITY_TRUTH_MATRIX.md), [`docs/agent/09_KNOWN_GAPS.md`](./docs/agent/09_KNOWN_GAPS.md).
- **Dated code/connector audit (2026-11-02):** [`docs/discovery/VISION_ALIGNMENT_RECHECK_2026_11_02.md`](./docs/discovery/VISION_ALIGNMENT_RECHECK_2026_11_02.md); see its 2026-11-04 documentation addendum for the template-path reconciliation.
- **Architecture and security:** [`docs/architecture/`](./docs/architecture), [`docs/adr/`](./docs/adr), [`docs/security/`](./docs/security), [`SECURITY.md`](./SECURITY.md).
- [`docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md`](./docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md) is retained as a 2026-10-18 historical audit snapshot, not the current master plan. Other historical plans and handovers remain preserved under DEC-006; accepted decisions are not rewritten by the proposal.

---

## Contributing

1. Branch from `main`. One work item per commit; the commit message says what was measured.
2. Run `npm run check` before pushing. If it is red, fix it or record exactly why in the PR — do not weaken a gate.
3. Touching money: `@/utils/money`, exact-answer tests, falsify against float, keep the ratchets green.
4. Touching time: `@/utils/clock`.
5. New routes, engines or stores need a runtime consumer in the same PR — a file with a unit test is not a feature.

## License

MIT — see [`LICENSE`](./LICENSE).
