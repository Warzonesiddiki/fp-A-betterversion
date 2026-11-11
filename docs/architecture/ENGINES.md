# FinPlan Pro — Financial Engines Directory

**Status:** short directory index, rechecked 2026-11-11. The authoritative,
machine-checked inventory is `src/engines/engineManifest.generated.ts`, verified by
`npm run engines:verify`. Measured counts come from
`node scripts/verify-readme-stats.mjs` and must not be restated by hand here.

## Measured inventory (2026-11-11)

- **180 engine modules** in `src/engines/`, of which **98 have at least one runtime
  consumer** (a page, store or service outside `src/engines/`) and **82 are orphaned**
  — exported by the barrel/manifest but never called by product code.
- Orphan status is not a defect claim by itself, but it means presence in this
  directory is **not** evidence that a capability is reachable by a user. A module
  existing here says nothing about product support.

## Core engines

| Engine             | Responsibility                                                    |
| ------------------ | ----------------------------------------------------------------- |
| `FormulaEngine`    | DAG-based spreadsheet-style formula evaluation.                   |
| `SafeMathParser`   | Arithmetic parser routed through the exact-money primitive.       |
| `CalculationGraph` | Dependency tracking between cells and computations.               |
| `CubeEngine`       | Multidimensional cube structure for slicing and aggregation.      |

## Financial statement engines

| Engine                        | Responsibility                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| `ThreeStatementEngine`        | Integrated P&L, balance sheet and cash-flow modelling.            |
| `CashFlowWaterfallEngine`     | Sources-and-uses cash waterfall construction.                     |
| `ConsolidationEngine`         | Multi-entity aggregation with translation and eliminations.       |
| `VarianceDecompositionEngine` | Decomposes budget-versus-actual variance into contributing causes.|

The runtime write-path enforcement for these identities is documented separately in
[`THREE_STATEMENT_GATE.md`](THREE_STATEMENT_GATE.md) and applies to the optional
server, not the local client.

## AI and advanced analytics

| Engine                   | Responsibility                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| `AIEngine`               | Bridge to `@huggingface/transformers`, which is an **optional peer dependency** loaded lazily on first use; no model is bundled. |
| `AnomalyDetectionEngine` | Statistical outlier detection.                                              |
| `MonteCarloEngine`       | Seeded risk simulation with output ranges.                                  |
| `GoalSeekEngine`         | Backwards solving for driver values.                                        |

AI narrative surfaces are gated by the verified-facts gate and the AI census
(`npm run docs:verify` reports 0 ungated narrative surfaces). Engines computing
numbers do not imply an AI capability is enabled for the user.

## Data and infrastructure

| Engine              | Responsibility                                                     |
| ------------------- | ------------------------------------------------------------------ |
| `ExcelImportEngine` | Parser for CSV/XLSX import with mapping support.                   |
| `AuditLogEngine`    | In-memory audit logging helper. **Not** a product audit authority: its only current consumers are `SOXComplianceEngine` and its own tests, with no persistence adapter or page consumer. Durable audit history is `src/store/auditTrailStore.ts` (see [`security.md`](security.md) §5). |
| `EncryptionEngine`  | Local encryption helpers used with the storage-key path.           |
| `SyncEngine`        | Queues local collaboration changes for sync. Requires a collaboration endpoint; the client defaults to a placeholder WebSocket URL and no sync server is evidenced in this tree. |

## Industry engines

`sector`-specific engines exist for SaaS (`SaaSMetricsEngine`), banking and credit
(`BankingEngine`, `CreditRiskEngine`, `YieldCurveEngine`), manufacturing and inventory,
real estate and leasing, healthcare, energy and ESG. **Module presence is not industry
support or certification.** No sector or jurisdiction is certified (O5 open), and the
18 sector dashboards were retired per DEC-079. See the industry matrix in
[`../03_CURRENT_STATUS_AND_AUDIT.md`](../03_CURRENT_STATUS_AND_AUDIT.md) §6.

## Engineering standards

- **Stateless where practical.** Engines should avoid hidden internal side effects and
  take time from `src/utils/clock.ts` rather than `Date`.
- **Determinism.** Randomness is injected and seeded; `npm run determinism:ratchet`
  must not rise for any file.
- **Worker-ready.** Heavy workloads (Monte Carlo, consolidation, batch calculation,
  GL ingestion, storage) can run in web workers; see
  [`../audit/worker-contracts.md`](../audit/worker-contracts.md) for a dated worker
  inventory that no longer matches the current five modules.
- **Money through one primitive.** Monetary arithmetic goes through
  `src/utils/money.ts`; `npm run money:ast` must stay at 0 unsafe operations.
- **Test-gated, not 100%-covered.** The earlier "100% test coverage required for all
  math logic" claim was not true and is not enforced: the configured global coverage
  threshold is **50%** per metric (`vite.config.ts:245-250`) and it is currently not
  met (see [`../testing/strategy.md`](../testing/strategy.md)).
