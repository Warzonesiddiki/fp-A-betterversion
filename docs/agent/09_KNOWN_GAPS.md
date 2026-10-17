# 09 — Known gaps and truth matrix

Last verified 2026-10-16. When you change a row, change it
here in the same commit. Source audit: `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`;
evidence per requirement: `docs/discovery/requirements-register.md`.

Legend: **WORKS** = exercised by tests in this tree · **UNWIRED** = code
exists, nothing reachable calls it · **FALSE** = a doc/UI claim contradicted
by code · **DECIDED** = owner decision recorded · **OPEN** = needs owner.

## What works (do not break)

| Capability                                                                                                                                                          | Evidence                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| CSV/XLSX GL upload → validation → balanced commit                                                                                                                   | `GLUploadPage.deep.test.tsx`, `glStore.provenance.test.ts` |
| Import provenance (batch id, file hash, source row), file + row idempotency, atomic commit, row quarantine with reasons, control totals, scope with `'unavailable'` | same + `importProvenance.test.ts`                          |
| Preview gate and import validate through one parser (`parseGLRows`): every row checked (not just the 20-row table window), rejected rows named by source-file row with the importer's reason, confirmation blocked, corrected file reprocesses | `GLDataPreview.test.tsx` (26), `GLUploadPage.interop.test.tsx` (7) |
| Trial balance, account analysis from GL                                                                                                                             | `glStore.test.ts`, `glStore.money.test.ts`                 |
| Decimal money primitive, money AST ratchet at 0                                                                                                                     | `money.test.ts`, `npm run money:ast`                       |
| Injectable clock                                                                                                                                                    | `clock.test.ts`                                            |
| RBAC enforcement on store actions                                                                                                                                   | `rbacEnforcer*.test.ts`, store tests                       |
| Client audit trail chain                                                                                                                                            | `auditTrailStore*.test.ts`                                 |
| Server: auth, GL commit, audit routes, idempotency key                                                                                                              | `server` 323 tests                                         |
| Statement oracles                                                                                                                                                   | `financialStatementOracles.test.ts`                        |
| Full suite green, prod advisories 0/0                                                                                                                               | `test:sharded` 8/8; `audit:prod`                           |
| Period-close write guards on every local GL write path (import, add/replace, accounts, undo/redo, clear, undo-import, server publish, server-to-local hydrate)       | `glStore.periodClose.test.ts` (17 tests, DEC-008); `glPeriodWriteGuard.test.ts` (17); `monthEndClosePipeline.integration.test.ts` |

## Unwired (exists, unreachable)

| Item                                                                                                                                                                                                    | Where                                         | Note                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 87 of 182 engine modules                                                                                                                                                                                | `node scripts/verify-readme-stats.mjs --list` | no page/store/worker imports them; many have unit tests, so they look "done"                                                                                                                                                                                                                                                              |
| `GLImportService`, `ImportPipeline` (services), `SmartImportMapper`, `ImportEngine` (engines)                                                                                                           | `src/services/`, `src/engines/`               | `GLUploadPage` parses and calls the store directly; these are only referenced by tests and a lineage page string                                                                                                                                                                                                                          || `AnomalyDetectionEngine` and exception logic                                                                                                                                                            | `src/engines/AnomalyDetectionEngine.ts`       | no oracle corpus, no page consumer beyond the barrel                                                                                                                                                                                                                                                                                                                                                      |
| Exact GL staging/promotion pipeline (`stageGLImport`, `stageGLCsvImport`, `stageGLXlsxImport`, `promoteStagingBatch`, `gl-ledger-exact:v1:*`)                                                          | `src/services/import/glStaging*.ts`, `glCsvTokenizer.ts`, `glXlsxTokenizer.ts` | built and tested (34 guard tests + the month-end pipeline integration test) but **0 non-test readers and 0 UI consumers** — verified by grep over `src` excluding tests. `GLUploadPage` still commits through `importGLData`. Wiring the upload wizard to it is **blocked (DEC-012)**: promoting without a reader makes the import invisible, a dual-write into `glStore` is forbidden by DEC-005, and migrating every downstream reader (TB, GL Explorer, statements) is not delivered |
| Most of `src/services/` (SecretsVault, IncidentResponse, ThreatModel, SecureStorage, KeyManager, PIIRedactor, RateLimiter, CircuitBreaker, PresenceService, crdtSync, writeback, mockData generators …) | `src/services/`                               | no import from pages/stores/hooks/components; only `llm/llmEgress`, `api-integration` (via `src/config/integrations.ts`, SDK), `WebSocketManager`, `ChangeBroadcaster`, `BenchmarkService` are referenced. 166 of the remaining 345 determinism sites sit in this unreachable code — delete or wire (owner scope decision), do not polish |
| All ERP connectors (`ConnectorRegistry`, QuickBooks, NetSuite, Xero, Sage, Dynamics)                                                                                                                    | `src/services/api-integration/`               | 0 UI consumers; `DynamicsConnector` targets **Dataverse CRM**, not F&O / BC GL                                                                                                                                                                                                                                                            |
| Server (`server/`) from the desktop build                                                                                                                                                               | `src/sdk`, `src/api/commandClient.ts`         | inert without `VITE_API_URL`; not bundled with Tauri                                                                                                                                                                                                                                                                                      |
| 35-table SQLite schema on the client                                                                                                                                                                    | `src-tauri/migrations/`                       | created by the shell, never queried by the client (blobs only); only the optional server uses it                                                                                                                                                                                                                                          |
| ~120 non-data routes (industries, AI, ML, simulation…)                                                                                                                                                  | `docs/CAPABILITY_TRUTH_MATRIX.md`             | render, but compute on empty or mock state; matrix marks `UNVERIFIED`                                                                                                                                                                                                                                                                     |

## False or formerly false claims

| Claim                                             | Status                                                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Fully offline desktop app"                       | FALSE until DEC-004: production desktop build cannot sign in without the server; Sentry/PWA egress exists (DEC-003). README corrected on `1fc7127`. |
| "N engines" headline                              | corrected to measured numbers; `docs:verify` enforces                                                                                               |
| "Feature complete" / phase badges in legacy plans | not true; legacy plans are superseded (see `00_INDEX.md`)                                                                                           |
| Tauri native layer verified                       | NOT VERIFIABLE here — no Rust toolchain in the sandbox; label `NATIVE-UNVERIFIED`                                                                   |
| CI green                                          | FALSE: `main` CI red since 2026-08-20; patches in `ci-patches/` not yet applied                                                                     |

## Decisions still open (do not resolve in code)

| Id      | Question                                             | Blocking                                     |
| ------- | ---------------------------------------------------- | -------------------------------------------- |
| DEC-001 | First supported Dynamics 365 export and data scope   | any connector / mapping work                 |
| DEC-002 | First FP&A view and exception-review use case        | which engines to wire first                  |
| DEC-003 | Data storage and external-service/AI policy          | Sentry, PWA update, any LLM call             |
| DEC-004 | Authentication and offline model for the desktop app | login flow, server bundling                  |
| DEC-005 | Store of record for financial data                   | relational tables vs blobs; server authority |
| DEC-006 | Plan-of-record documents (archive or keep 478 md)    | moving any legacy doc                        |

Open questions Q7, Q10, Q11–Q14 in `docs/discovery/current-workflow.md`.

## Environment caveats

Measured 2026-10-16 on this sandbox (Node **26.10.0**). The project targets Node
22 (`docs/agent/02_ARCHITECTURE.md`, no `engines` field to enforce it).

| Symptom | Where | Cause | Action |
| --- | --- | --- | --- |
| 3 failures: 2 in `src/utils/sqlJsStorage.test.ts`, 1 in `src/utils/backupRestore.test.ts` (quota/permission paths resolve instead of rejecting) | `test:sharded` shard 1 | These tests mock `Storage.prototype`. On Node 26 a native `localStorage` accessor shadows it, so the spy never intercepts and the real write succeeds. They were last touched by PR #72 and fail in isolation, before any 2026-10-16 change. | **Do not weaken the tests.** Run the suite on Node 22, or fix the proxy target deliberately. Recorded so they are not misread as regressions. |

Full-suite evidence for this environment: `npm run test:sharded` → 7/8 shards
PASS, 15,597 tests, 3 failed — all three being the rows above.

## Ratchet baselines (direction: down only)

| Ratchet                   | Value at tip                | File                                   |
| ------------------------- | --------------------------- | -------------------------------------- |
| determinism sites / files | 345 / 80                    | `scripts/determinism-baseline.json`    |
| type-safety escapes       | 116                         | `scripts/type-safety-baseline.json`    |
| money AST violations      | 0                           | `scripts/money-ast-baseline.json`      |
| money adoption            | 28.89 % (floor)             | `scripts/money-adoption-baseline.json` |
| eslint-disable ledger     | see `npm run escape:ledger` | —                                      |

## Decision-neutral work that is always welcome

- Lower a ratchet. Determinism sites left (2026-10-16): `src/store` and `src/utils` 0; `src/engines` 179, all in orphan modules except the 5 spreadsheet `RAND`/`RANDBETWEEN` implementations in `SafeMathParser` and `formula-functions/{math,lookup}` (seeded RNG is a design choice — propose, don't pick); `src/services` 166, almost all in unreachable modules. Prefer deletion to polishing for orphans (needs the scope decision). Recompute with `node scripts/determinism-ratchet.mjs --list` against `node scripts/verify-readme-stats.mjs --list`.
- Add an oracle/contract test to an engine already reachable.
- Delete a route that renders only mock data **and** has no requirement id
  (ask first if > 5 routes).
- Convert a documented claim into a script-checked number.
- Fix a real bug with a failing-first test.
