# Docs-First Architecture Mission Contract

**Status:** User-requested target scope, captured 2026-11-04. This is not an approved implementation design, a capability claim, or a replacement for accepted decisions in [`docs/discovery/decision-log.md`](../discovery/decision-log.md). The active stage and evidence state live in [`STATE.json`](STATE.json).

## Operating gates

1. Stage 0 establishes persistent state and governing instructions.
2. Stage 1 audits repository topology, every live document, code reality, baseline gates, and the requested module and industry scope.
3. Stage 2 researches product and technical alternatives using available sources; unavailable external evidence is marked `[UNVERIFIED: reason]`.
4. Stage 3 records architecture choices in ADRs after evaluating alternatives and repository compatibility.
5. Stage 4 authors and reconciles product, architecture, schema, calculation, industry, API, AI, security, QA, UX, roadmap, and traceability specifications.
6. Stage 5 checks naming, evidence, financial invariants, traceability, links, and cold-start task readiness. Only a verified pass may set `docs_gate_passed` to true.
7. Stage 6 presents the audit and design results. Stage 7 begins only after the required owner approval unless the owner has explicitly authorized continuous full-auto work.

No further application-source change is authorized by this mission while the docs gate is false. Existing source edits already present in the branch are baseline state, not permission to continue coding.

## Ten financial and evidence invariants

1. **Fixed-precision money:** monetary values, quantities, and rates use an explicitly scaled arbitrary-precision representation and named rounding policy; binary floating-point arithmetic is not an acceptable money authority.
2. **Accounting identity:** assets equal liabilities plus equity at the approved precision; an imbalance is explicit and cannot be hidden by an undocumented plug.
3. **Cash-flow continuity:** beginning cash plus operating, investing, financing, and FX cash effects equals ending cash; ending cash ties to the balance sheet under the approved scope.
4. **Retained earnings roll-forward:** beginning retained earnings plus net income, less dividends, plus or minus approved prior-period adjustments equals ending retained earnings.
5. **Time aggregation and polarity:** each metric declares its time aggregation and account polarity. Flows sum; ending stocks use the last observation; beginning stocks use the first; averages use duration-aware weighting; ratios are recalculated from aggregated numerator and denominator; variance direction is explicit.
6. **Currency translation:** translation rates and treatment are explicit by account class and period; the approved translation difference is traceable through CTA/OCI and the translated statements tie under the selected accounting policy.
7. **Consolidation:** ownership and non-controlling interest are explicit; intercompany eliminations are represented as auditable adjustments and reconcile to zero at the correct common parent.
8. **Allocation conservation:** allocations conserve the source pool exactly at the configured precision, and any remainder is distributed by a deterministic rule.
9. **Bi-temporal lineage:** facts and changes distinguish business-valid time from transaction time and retain available source, actor, formula/configuration, and audit context.
10. **Deterministic AI grounding:** language models do not perform financial arithmetic; numerical statements derive from deterministic calculation tools and cite reproducible coordinates and lineage evidence.

These are target design constraints. Stage 1 must measure current implementation and identify mismatches; it must not describe an unimplemented invariant as enforced.

## Proposed universal core and industry configuration

The requested architecture separates a shared finance core from declarative industry configuration. Candidate core elements for ADR analysis include a transactional source ledger, sparse multidimensional model storage, a typed formula language and dependency graph, incremental calculation, controlled circularity handling, fiscal-calendar semantics, and copy-on-write scenarios. Storage engines, database choices, solver algorithms, latency targets, multi-tenancy, and deployment topology remain unresolved until evidence and ADR review.

Industry-specific behavior is intended to be versioned configuration over the shared money, import, period, security, audit, and calculation contracts. Packs require explicit source prerequisites, definitions, known-answer tests, review, and maturity labels. They are not certifications merely because a schema or code module exists.

## Twelve requested industry scopes

1. SaaS, cloud, and technology: recurring-revenue movement, retention, customer economics, cohort behavior, deferred revenue, hosting and AI-service cost.
2. Manufacturing, industrial, and supply chain: bills of material, standard and actual cost, purchasing and usage variances, labor and overhead, capacity, inventory, and operations-to-finance bridges.
3. Retail, e-commerce, and consumer packaged goods: comparable sales, inventory productivity, item velocity, shrink, promotion, landed cost, channel economics, store contribution, and retail calendars.
4. Healthcare, hospitals, biotech, and life sciences: payer mix, gross-to-net revenue, census and capacity, procedure economics, revenue-cycle measures, clinical-trial spend and runway.
5. Banking, fintech, payments, and lending: interest economics, yield sensitivity, loan cohorts, credit-loss provisioning, deposit behavior, payment economics, and regulatory capital measures.
6. Insurance and InsurTech: premium movement, earned premium, loss and expense ratios, reserve development, reinsurance, and investment yield.
7. Real estate, REITs, property, and construction: rent rolls, lease events, property operating income, valuation, recoveries, project progress, retainage, debt, and covenants.
8. Professional services, agencies, and consulting: utilization, realization, effective rates, engagement margin, backlog, bench cost, and subcontractor pass-through.
9. Energy, utilities, renewables, and mining: production units, capacity, unit costs, contracts, commodity exposure, hedging, depletion, and retirement obligations.
10. Logistics, transportation, aviation, and fleet: unit economics, asset utilization, empty movement, fuel recovery, contract and spot rates, maintenance, and warehouse productivity.
11. Hospitality, hotels, restaurants, and travel: room revenue, occupancy, average rates, food and labor cost, table productivity, channel mix, and seasonal staffing.
12. Non-profit, higher education, and public sector: fund restrictions, grants, endowment policy, tuition and enrollment, encumbrances, and program versus administration expense.

## Eighteen requested platform modules

1. Universal data ingestion, connectors, ETL, mapping, quality checks, and quarantine.
2. Master data, dimensions, hierarchies, effective dating, and cross-system mappings.
3. Multidimensional modeling and formula studio.
4. Integrated three-statement planning and accounting model.
5. Collaborative budgeting and zero-based planning.
6. Rolling forecasts and explainable statistical or machine-learning forecasts.
7. Scenario, sensitivity, goal-seek, and Monte Carlo tooling.
8. Workforce and headcount planning.
9. Revenue, pricing, and cohort planning.
10. Capital, operating, allocation, and short-horizon cash planning.
11. Multi-entity consolidation, currency translation, and intercompany elimination.
12. Variance, flux, decomposition, and source drill-through.
13. Executive reporting and board-pack publication.
14. Deterministic AI copilot and anomaly review.
15. High-performance financial grid and spreadsheet interoperability.
16. Declarative industry-pack marketplace and custom composer.
17. Close/planning calendar, approvals, and contextual collaboration.
18. Enterprise identity, access control, audit, and compliance controls.

## Documentation quality contract

New specifications must have unique identifiers, explicit status, exact acceptance evidence, and no invented metrics, examples, provider claims, or certification. Preserve valid historical evidence while identifying its date and authority. Every decision that changes an accepted product or security boundary requires an owner decision. Research citations must resolve to sources that were actually inspected. The Stage 5 gate is evidence-based and must not be weakened to obtain a pass.
