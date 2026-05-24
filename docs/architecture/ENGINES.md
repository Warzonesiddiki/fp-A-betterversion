# FinPlan Pro — Financial Engines Directory

FinPlan Pro utilizes 156+ specialized pure TypeScript engines for financial logic. All engines are located in `src/engines/` and follow the `*.ts` (implementation) and `*.test.ts` (unit tests) pattern.

## Core Engines
| Engine | Responsibility |
|--------|----------------|
| `FormulaEngine` | High-performance DAG-based Excel-compatible formula evaluator. |
| `SafeMathParser` | Precision-safe arithmetic parser (resolves floating point issues). |
| `CalculationGraph` | Manages dependencies between cells and engines. |
| `CubeEngine` | Multi-dimensional OLAP data structure for real-time slicing. |

## Financial Statement Engines
| Engine | Responsibility |
|--------|----------------|
| `ThreeStatementEngine` | Fully integrated P&L, Balance Sheet, and Cash Flow models. |
| `CashFlowWaterfallEngine` | Generates sources and uses of cash visualizations. |
| `ConsolidationEngine` | Multi-entity currency translation and IC eliminations. |
| `VarianceDecompositionEngine`| Identifies root causes of BVA variances. |

## AI & Advanced Analytics
| Engine | Responsibility |
|--------|----------------|
| `AIEngine` | Local Transformers.js bridge for sentiment and anomaly detection. |
| `AnomalyDetectionEngine` | Statistical and AI-driven outlier identification. |
| `MonteCarloEngine` | Risk simulation with probabilistic output ranges. |
| `GoalSeekEngine` | Backwards-solving for driver variables. |

## Data & Infrastructure
| Engine | Responsibility |
|--------|----------------|
| `ExcelImportEngine` | Secure (exceljs) parser for CSV/XLSX with auto-mapping. |
| `AuditLogEngine` | Comprehensive cell-level and system action history. |
| `EncryptionEngine` | Local-first data protection and key management. |
| `SyncEngine` | Coordinates delta-sync between Web and Desktop layers. |

## Specialized Industry Engines
- **SaaS**: `SaaSMetricsEngine` (ARR, Churn, LTV).
- **Banking**: `BankingEngine`, `CreditRiskEngine`, `YieldCurveEngine`.
- **Manufacturing**: `ManufacturingEngine`, `InventoryEngine`.
- **Real Estate**: `RealEstateEngine`, `LeaseEngine`.
- **Healthcare**: `HealthcareEngine`.
- **Energy**: `EnergyEngine`.
- **ESG**: `ESGEngine` (Carbon footprint and sustainability).

## Performance Standards
- **Stateless**: Engines must not hold internal side effects.
- **Worker-Ready**: Complex engines (Monte Carlo, Consolidation) run in Web Workers.
- **TDD-Gated**: 100% test coverage required for all math logic.
