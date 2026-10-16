# FinPlan Pro — Asset Acquisition & Transplant Protocol

Recorded 2026-10-16 from the owner's acquisition directive. This is a backlog and
acceptance contract, **not evidence that the named assets exist or are shipped**.
Evolve the existing TypeScript application; do not rewrite its chassis.

## Source verification and adaptation

Read actual sibling directories or GitHub repositories before transplanting:

- `fpa` (OneFP&A): TypeScript quant algorithms, iterative solvers, industry packs.
- `finalFPA`: accounting exception rules, proposed journals, deck formatting.
- `FPA-modular`: sample-data contracts, audit chaining, presentation tie-outs.

For every acquisition record source repository, commit, path, license, original
behavior/tests and any deliberate adaptation. Verify rights before copying. Do
not treat a prompt's API examples or accounting rules as verified source code.
Use `@/utils/money` and injected clocks. Preserve provenance, source prerequisites,
and tests. Algorithms must be pure; storage belongs at the service/store boundary.

## Harvest backlog (requested order)

1. **Iterative circular solver**
   - Source: `fpa/src/model/cycleSolver.ts` and `cycleSolver.test.ts`.
   - Target: `src/engines/CycleRelaxationEngine.ts` and paired tests.
   - Verify Tarjan SCC / damped Gauss-Seidel, damping 0.5, at most 100 iterations;
     use exact Decimal operations, convergent debt/interest and divergent-loop oracles.
   - Integrate with `ThreeStatementEngine` behind `enableIterativeCalculation`.
2. **Largest-remainder presentation rounding**
   - Source: `fpa/src/model/largestRemainder.ts` and paired tests.
   - Target: `src/utils/largestRemainder.ts`; integrate statement/export consumers.
   - Displayed parts must sum exactly to displayed total, including negative values,
     deterministic ties and thousands/millions presentation units.
3. **24 close exception rules and suggested journals**
   - Source: `finalFPA/app/engine/rules/rules_01_08.py`, `rules_09_16.py`,
     `rules_17_24.py`; target `src/engines/CloseExceptionEngine.ts`.
   - Requested inventory: EXC-001 unmapped accounts; 002 potential duplicates;
     003 control totals; 004 inactive/locked accounts; 005 cutoff; 006 z-score;
     007 manual/system accounts; 008 abnormal balances; 009 round numbers;
     010 weekends/holidays; 011 post-close changes; 012 suspense; 013 split
     invoices/DOA; 014 vendor velocity; 015 recurring contracts; 016 accruals;
     017 unbudgeted spend; 018 material variance; 019 YTD overrun; 020 dormant
     accounts; 021 payment thresholds; 022 unbalanced vouchers; 023 subledger
     tie-out; 024 intercompany differences.
   - Verify source definitions before assigning rule IDs. Missing prerequisites
     must be explicit. Findings are potential exceptions, not proven errors.
   - Journal suggestions require known accounts, amounts and accounting context;
     do not fabricate an offset account or auto-post a suspected anomaly. Require
     human approval; support waive-with-reason and escalation with audit evidence.
4. **13-week cash and debt**
   - Source: `fpa/src/model/week13Cash.ts`, `debtSchedule.ts`, `capital.ts`.
   - Target: `Treasury13WeekEngine`, treasury page, exact-answer tests.
   - Cash floor, covenant weeks and additional borrowing must be exact and traceable.
5. **Industry packs**
   - Source: `fpa/packs/`; target `src/config/industryPacks/` and templates/pages.
   - Verify all twelve packs and COA/driver/formula metadata. Priority metrics:
     SaaS ARR/NRR/GRR/CAC/Rule of 40/LTV; manufacturing OEE/scrap/cost/yield;
     retail 4-5-4/SSS/GMROI/shrinkage; healthcare patient days/ALOS/payer mix;
     construction WIP/retainage/backlog. Never infer non-GL inputs from generic totals.
6. **Audit chaining**
   - Source: `FPA-modular/app/core/audit.py` and `hashing.py`.
   - Target: `src/utils/auditChain.ts`, SQLite audit persistence, SOX page badge.
   - Verify canonical payload encoding and SHA-256 previous-hash chaining; add
     tampering tests. A locally rewritable hash chain alone does not establish
     immutability or SOX 404 compliance.

## Product mission backlog

1. Connect SaaS, banking, construction and manufacturing dashboards to dedicated
   engines using the sector-driver pattern; supply honest missing-input states.
2. Verify/port close exception rules and actionable human review.
3. Worker/chunk-based CSV/XLSX ingestion, transactional SQLite persistence and
   250k+ row performance evidence; exact voucher/trial-balance controls.
4. Formula-preserving XLSX, editable eight-slide PPTX, PDF and UI tie-outs using
   one calculation result and largest-remainder presentation rounding.

## Active execution precedence

The owner's final pipeline directive starts with **SmartImportMapper ingestion**,
then consolidation/FX/IC verification, export integration and the real
`src/test/e2eMonthEndHarness.test.ts`. Harvest 1 and SaaS are queued rather than
started concurrently. This explicitly supersedes the earlier feature-expansion
freeze for these requested missions; existing financial safety decisions remain.
Quarantine retains raw rows, source identity/line and typed reasons; posting stays
atomic and blocked when invalid rows or unbalanced vouchers remain unresolved.

## Evidence gates

- Inspect module, store and tests; specify contract and independent oracles first.
- Write regression tests before changing implementation. No skipped tests, weaker
  assertions, lower coverage or lint bypasses.
- `npm run money:ast`
- `npm run tsc -- --noEmit`
- `npm test -- <changed-test-paths>` (literal output in `GAP_LEDGER.md`)
- `npx vitest run src/engines/ThreeStatementEngine.test.ts src/engines/ConsolidationEngine.test.ts`
- Full pipeline acceptance target: messy USD/EUR imports, exactly specified
  quarantine fixtures, verified CTA/IC, convergent statements, exception review,
  13-week liquidity and parsed XLSX/PPTX/PDF content matching UI cents, under
  twenty seconds. Do not add a mock-only harness or claim coverage for absent APIs.
- Commit surgical changes and update `GAP_LEDGER.md` with scope, command output,
  limitations and next target.
