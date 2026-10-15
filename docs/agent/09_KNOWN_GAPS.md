# 09 — Known gaps and truth matrix

Last verified 2026-10-15 at tip `6777ce7`. When you change a row, change it
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
| Trial balance, account analysis from GL                                                                                                                             | `glStore.test.ts`, `glStore.money.test.ts`                 |
| Decimal money primitive, money AST ratchet at 0                                                                                                                     | `money.test.ts`, `npm run money:ast`                       |
| Injectable clock                                                                                                                                                    | `clock.test.ts`                                            |
| RBAC enforcement on store actions                                                                                                                                   | `rbacEnforcer*.test.ts`, store tests                       |
| Client audit trail chain                                                                                                                                            | `auditTrailStore*.test.ts`                                 |
| Server: auth, GL commit, audit routes, idempotency key                                                                                                              | `server` 323 tests                                         |
| Statement oracles                                                                                                                                                   | `financialStatementOracles.test.ts`                        |
| Full suite green, prod advisories 0/0                                                                                                                               | `test:sharded` 8/8; `audit:prod`                           |

## Unwired (exists, unreachable)

| Item                                                                                                                                                                                                    | Where                                         | Note                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 87 of 182 engine modules                                                                                                                                                                                | `node scripts/verify-readme-stats.mjs --list` | no page/store/worker imports them; many have unit tests, so they look "done"                                                                                                                                                                                                                                                              |
| `GLImportService`, `ImportPipeline` (services), `SmartImportMapper`, `ImportEngine` (engines)                                                                                                           | `src/services/`, `src/engines/`               | `GLUploadPage` parses and calls the store directly; these are only referenced by tests and a lineage page string                                                                                                                                                                                                                          |
| `AnomalyDetectionEngine` and exception logic                                                                                                                                                            | `src/engines/AnomalyDetectionEngine.ts`       | no oracle corpus, no page consumer beyond the barrel                                                                                                                                                                                                                                                                                      |
| Most of `src/services/` (SecretsVault, IncidentResponse, ThreatModel, SecureStorage, KeyManager, PIIRedactor, RateLimiter, CircuitBreaker, PresenceService, crdtSync, writeback, mockData generators …) | `src/services/`                               | no import from pages/stores/hooks/components; only `llm/llmEgress`, `api-integration` (via `src/config/integrations.ts`, SDK), `WebSocketManager`, `ChangeBroadcaster`, `BenchmarkService` are referenced. 166 of the remaining 518 determinism sites sit in this unreachable code — delete or wire (owner scope decision), do not polish |
| All ERP connectors (`ConnectorRegistry`, QuickBooks, NetSuite, Xero, Sage, Dynamics)                                                                                                                    | `src/services/api-integration/`               | 0 UI consumers; `DynamicsConnector` targets **Dataverse CRM**, not F&O / BC GL                                                                                                                                                                                                                                                            |
| Server (`server/`) from the desktop build                                                                                                                                                               | `src/sdk`, `src/api/commandClient.ts`         | inert without `VITE_API_URL`; not bundled with Tauri                                                                                                                                                                                                                                                                                      |
| 35-table SQLite schema on the client                                                                                                                                                                    | `src-tauri/migrations/`                       | created by the shell, never queried by the client (blobs only); only the optional server uses it                                                                                                                                                                                                                                          |
| Period-close lock vs GL writes                                                                                                                                                                          | `period-close-store`, `glStore.ts`            | GL store does not check lock state before import                                                                                                                                                                                                                                                                                          |
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

## Ratchet baselines (direction: down only)

| Ratchet                   | Value at tip                | File                                   |
| ------------------------- | --------------------------- | -------------------------------------- |
| determinism sites / files | 518 / 131                   | `scripts/determinism-baseline.json`    |
| type-safety escapes       | 116                         | `scripts/type-safety-baseline.json`    |
| money AST violations      | 0                           | `scripts/money-ast-baseline.json`      |
| money adoption            | 28.89 % (floor)             | `scripts/money-adoption-baseline.json` |
| eslint-disable ledger     | see `npm run escape:ledger` | —                                      |

## Decision-neutral work that is always welcome

- Lower a ratchet. Determinism sites left (2026-10-15): `src/engines` 352, of which **178 in 54 reachable engines** (worst: WorkflowEngine 21, SOXComplianceEngine 15, ReportBookEngine 11, ReportBuilderEngine 10, CellAuditTrailEngine 9, AuditLogEngine 7, MultiBookEngine 6, IntercompanyMatchingEngine 6, FinancialCloseEngine 5, PeriodCloseEngine 2, ImportEngine 4, CubeEngine 4, AnomalyDetectionEngine 3) and 174 in orphans; `src/services` 166, almost all in unreachable modules. Work the reachable engines; prefer deletion to polishing for orphans (needs the scope decision). Recompute with `node scripts/determinism-ratchet.mjs --list` against `node scripts/verify-readme-stats.mjs --list`.
- Add an oracle/contract test to an engine already reachable.
- Delete a route that renders only mock data **and** has no requirement id
  (ask first if > 5 routes).
- Convert a documented claim into a script-checked number.
- Fix a real bug with a failing-first test.
