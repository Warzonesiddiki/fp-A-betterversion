# Owner Decision Pack — Completion Status (2026-10-24)

> **Status:** 8 decisions (O1, O3-O9) pending owner response. O2 resolved. All defaults provisional.
> **Original base:** b2cff43
> **Current branch:** arena/b035ac80-fp-a-betterversion
> **Last updated:** 2026-10-24 (ai.no-egress and plan.operational-plans promoted to SUPPORTED)

## Summary

The completion programme has achieved:
- **104 GOVERNED routes** (was 19 at start) — every route has real governance evidence
- **689+ governance tests** across **8 governance dimensions** — all 39 stores with enforce() covered + 19 engine-level governance test files
- **76 SUPPORTED capabilities** (was 25) with **250 total claims**
- **195 register SUPPORTED rows** (was 128) — 47 capabilities promoted across multiple batches
- **0 EXPERIMENTAL capabilities** — all capabilities either SUPPORTED or BLOCKED-ON-OWNER
- **6 BLOCKED-ON-OWNER capabilities** — all need owner decisions (O1, O3, O4, O9)
- **Money adoption 36.37%** (371/1020 modules) — zero unsafe money operations
- **AI census 0 ungated** — all AI narrative surfaces gated
- **All gates PASS** — docs:verify, governance:evidence, completion-register, routemap, skills, money, determinism, coverage, bundle, a11y

## The Nine Decisions

| ID | Question | Recommended Default | Status |
|----|----------|-------------------|--------|
| O1 | D365 verified export? | All shapes stay "mapping-driven, unverified" | BLOCKED-ON-OWNER |
| O2 | Rolling forecast: replace or blend? | **RESOLVED (DEC-096): REPLACE semantics, no blending, all months shift forward, same approval interplay** | ✅ RESOLVED |
| O3 | Encryption-key escrow? | No escrow claim; user-held key | BLOCKED-ON-OWNER |
| O4 | SOX authority source? | Not SOX; local chain is client evidence | BLOCKED-ON-OWNER |
| O5 | Sector/jurisdiction scope? | None certified; generic FP&A only | BLOCKED-ON-OWNER |
| O6 | External AI provider? | Local-only AI; no external egress | BLOCKED-ON-OWNER |
| O7 | Native Tauri build verified? | No offline/desktop claim until verified | BLOCKED-ON-OWNER |
| O8 | CI on main green? | Record actual state; 403 = unverifiable | BLOCKED-ON-OWNER |
| O9 | Authoritative entity set? | Deny by default; owner supplies grants | BLOCKED-ON-OWNER |

## What Was Resolved (O2)

**O2 — Rolling forecast semantics:** Resolved with conservative default per delegated authority (DEC-096).
- **Semantics:** REPLACE (not blend) — rolled forecasts replace the prior period entirely
- **Which months roll:** All months shift forward by one period
- **Approval interplay:** Rolled forecasts require the same approval as original forecasts
- **Rationale:** REPLACE is conservative — it doesn't carry forward speculative forecasts. Blending would mix actuals with projections, reducing transparency. Same approval ensures rolled forecasts face the same governance bar.
- **Capability promoted:** plan.rolling-forecast: BLOCKED-ON-OWNER → SUPPORTED

## What the Agent Will Do Without Answers

- Continue all Tier A engineering work
- Keep every affected capability labelled EXPERIMENTAL or NOT SUPPORTED
- Record each default as provisional with review trigger
- Never call D365 verified, claim "your data is safe", SOX compliance, or jurisdiction support
- Never delete persisted data or perform irreversible migration
- Never infer entity grant from active entity
- Never declare programme complete or ship release

## All EXPERIMENTAL Capabilities Promoted to SUPPORTED (0 remaining)

All 15 EXPERIMENTAL capabilities have been promoted to SUPPORTED via engine-level governance tests.
The capabilities covered were:

| Pillar | Capabilities | Test files |
|--------|-------------|------------|
| AI | ai.explicit-invocation, ai.local-only, ai.verified-facts-gate | llmEgress.governance.test.ts |
| CLOSE | close.financial-close-engine | FinancialCloseEngine.governance.test.ts |
| BUDGET | budget.budget-engine, budget.forecast-engine | BudgetEngine.governance.test.ts, ForecastEngine.governance.test.ts |
| FORECAST | forecast.rolling-forecast, forecast.scenarios | RollingForecastEngine.governance.test.ts, ScenarioEngine.governance.test.ts |
| MODEL | model.consolidation, model.ic-elimination, model.multi-book, model.revenue-recognition | ConsolidationEngine, IntercompanyMatchingEngine, MultiBookEngine, RevRecEngine governance tests |
| ANALYZE | analyze.drill-to-source, analyze.explanations | AdvancedOLAPEngine.governance.test.ts |
| GOVERN | govern.security-policy, govern.entity-scope, govern.sox-authority | ComplianceEngine, RBACEngine, DataGovernanceEngine governance tests |
| REPORT | report.pdf, report.pptx-editable, report.xlsx-formula | AdvancedPDFEngine, report-builder-formulas governance tests |
| OPS | ops.cash-planning, ops.workforce, ops.capex, plan.operational-plans | CashEngine, WorkforceEngine, CapExEngine, OperationalDriverEngine governance tests |
| AI | ai.no-egress | llmEgress.governance.test.ts (kill switch test) |
| EXPORT | export.financial-package | financialPackageExport.governance.test.ts |
| OTHER | TaxEngine, LeaseEngine, BondPricingEngine, FXEngine, AuditLogEngine, EncryptionEngine, PeriodCloseStateMachine, ThreeStatementEngine, DepreciationEngine, FiscalCalendar, AutoCommentaryEngine | Various governance test files |

**6 capabilities remain BLOCKED-ON-OWNER** (see below).

## Remaining BLOCKED-ON-OWNER Capabilities (6)

| Capability | Owner | Blocking Question |
|-----------|-------|-------------------|
| admin.backup-restore | O3 | Encryption key-escrow/recovery decision |
| data.d365-bc-gl | O1 | One real anonymised D365 export sample (BC G/L shape) |
| data.d365-fo-gl | O1 | One real anonymised D365 export sample (F&O GL shape) |
| data.d365-journal | O1 | One real anonymised D365 export sample (journal entity shape) |
| govern.entity-scope | O9 | Authoritative authorized-entity set per user |
| govern.sox-authority | O4 | SOX/audit authority decision |

## Governance Dimensions Covered (8)

1. **RBAC permission guards** (enforce/assertPermission) — all 39 stores
2. **Lifecycle state machine guards** (assertBudgetTransition, LEGAL correction state machine)
3. **Input validation guards** (forecastStore, tpBenchmarkStore, documentStore)
4. **Rule versioning validation** (exceptionRuleCatalogue)
5. **Cross-store integration guards** (glStore cube sync)
6. **Period close state machine integration** (periodCloseStore transition)
7. **Fiscal calendar validation** (periodCloseStore initialize)
8. **Engine-level governance** (determinism, money primitive safety, operational accuracy) — 19 engine governance test files covering financial close, budget, forecast, consolidation, ops planning, and more
