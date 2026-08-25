# ALL-IN-ONE Distance Report — FinPlan Pro @ phase0/w02-tenancy

> **Date:** 2026-08-25 · **Author:** ox-alpha Lead via research subagent (zero-edit lane)
> **Method:** docs baseline + 14 page spot-checks across 13 industries + cross-cutting greps.
> Evidence discipline D-002/D-009: every grade carries file:line witnesses.

## Verdict

Exceptional chassis (214 engines, 47 fail-closed stores, real connector code) wrapped around ~19 industry pages that are ONE generic GL template, 2 contaminated screens, and 3 missing one-stop pillars. Honest label: **BUILT-wide, CONNECTED-thin**.

## Vertical coverage (spot-check grades)

DEEP=engine-wired+store+export · FUNCTIONAL=basic flows wired · SHALLOW=generic shell with icon swap.

| Industry      | Page                       | Grade                         | Key evidence                                                                   |
| ------------- | -------------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| Manufacturing | /manufacturing/overview    | SHALLOW                       | GL-reskin compute L14-51; ManufacturingEngine exists but NOT imported          |
| Healthcare    | /healthcare/overview       | SHALLOW                       | identical clone L15-52                                                         |
| Retail        | /retail/stores             | FUNCTIONAL(high)              | RetailEngine.getStoreBreakdown L38,78; ExportEngine L37                        |
| SaaS          | /saas/overview             | SHALLOW                       | clone L14-51; churn/cohort pages TEST-NOT-FOUND (matrix L175-177)              |
| Banking       | /banking/banking           | FUNCTIONAL(high)              | BankingEngine stats L58-68; PDF export L70-90                                  |
| Energy        | /energy/sector             | SHALLOW                       | clone; energyStore persisted but unused by page                                |
| ESG           | /esg/overview              | SHALLOW                       | clone L15-52                                                                   |
| Construction  | /construction/dashboard    | FUNCTIONAL                    | own store fields; exemplary missing-data disclosure L62-66                     |
| Education     | /education hub             | SHALLOW hub/FUNCTIONAL leaves | money-tested leaf pages exist                                                  |
| Government    | /government hub            | SHALLOW hub/FUNCTIONAL leaves | GrantDisbursement tested                                                       |
| Hospitality   | /sector/hospitality        | FUNCTIONAL                    | truthfulness sweep documented L22-37; room-night denominator disclosed missing |
| Logistics     | /logistics hub             | SHALLOW hub/FUNCTIONAL leaves | FleetCost money tests exist                                                    |
| Real estate   | /realestate/dashboard      | FUNCTIONAL(high)              | W-FAB header L1-12 removed mocked occupancy/pie                                |
| Telecom       | /sector/telecommunications | FUNCTIONAL                    | remediated L22-35; professional-services vertical MISSING                      |

**Template-clone census:** 19 pages share byte-identical `compute*Stats` GL body (grep list incl. collaboration trio ActivityFeed.tsx:15, SharedReports.tsx:28, TeamWorkspace.tsx:83, plus ConsolidationPage.tsx:14, LeaseAccountingPage.tsx:47, BudgetApproval.tsx:38, ChartOfAccountsPage.tsx:14, BankStatements.tsx:40, BankReconciliation.tsx:43).

## Cross-cutting one-stop gaps

| Capability          | Status                           | Evidence                                                                  |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Invoicing / AR-AP   | MISSING native                   | cashForecastModel.ts:313 self-disclosure; WorkingCapitalEngine scalar AR  |
| Payroll             | PARTIAL contaminated             | PayrollForecastPage.tsx:48-70 hardcoded fabricated arrays                 |
| Tax filing          | PARTIAL                          | provision real (TaxProvisionPage L34,52); transfer pricing TEST-NOT-FOUND |
| Banking feeds       | code EXISTS / UNVERIFIED runtime | PlaidConnector.ts:1-17; D-08 pending                                      |
| Document management | MISSING unwired                  | DocumentEngine.ts:25 zero consumers                                       |
| Collaboration       | PARTIAL single-user              | collaborationStore wired; flagship pages pad with GL stats                |
| Mobile/offline      | PARTIAL desktop-local-first      | App gate contractual; sync semantics undefined (blueprint P1)             |

## Ranked backlog (top 15 → Wave-C+ program)

1. Reskin purge: engine wiring for 19 clone pages (L)
2. W-FAB wave 3: purge demo constants inside engines + extend fabrication ratchet to src/engines (M)
3. Native AR/AP sub-ledger feeding CashForecast + WorkingCapital (L)
4. Payroll de-contamination + payroll calendar (M)
5. Connector certification program D-08 (L)
6. Board-pack publish w/ drill-to-evidence D-07 (L)
7. Consolidation close-loop hardening incl. ConsolidationPage reskill replacement (L)
8. SectorDriverDashboard as THE vertical pattern + metric configs (M)
9. Wire DocumentEngine: library store + attachments (M)
10. Tax hub completion: transfer-pricing rebuild + jurisdiction rates store (M)
11. Operational input adapters (POS/PMS/subscriber CSV templates) (L)
12. Collaboration realism pass (M)
13. Route consolidation 228→≤40 (M)
14. Offline draft-vs-official boundary spec (L)
15. Truth Matrix Pass B: journey-level evidence on 41 canonical routes (M)
