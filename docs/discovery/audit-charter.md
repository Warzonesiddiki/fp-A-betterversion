# Audit Charter and Evidence Plan

**Status:** Draft  
**Purpose:** Establish what exists, what is safe to trust, and what should be built next—without confusing assumptions with findings.

## 1. Audit objectives

1. Verify the current state of `fp-A-betterversion` from source, tests, documentation, and repository history.
2. Review `FPA-modular` for relevant, evidenced lessons; do not treat it as an automatic design template.
3. Trace a representative Dynamics 365 GL export through the current or proposed product flow.
4. Assess financial correctness, data lineage, exception handling, UI/UX, security, and delivery readiness.
5. Convert verified findings and user decisions into requirements, documentation, and a prioritized implementation backlog.

## 2. Scope

### In scope
- Repository architecture, module boundaries, build/run instructions, dependency health, tests, CI, and milestone claims.
- Monthly GL export acquisition, file formats, mapping, validation, duplicate handling, period/account/entity interpretation, and reconciliation.
- FP&A calculations, variance analysis, abnormality detection, journal-entry review support, commentary, and reporting—where implemented or proposed.
- Data provenance: source row → normalized record → calculation/flag → UI/export.
- UI task flow and usability for importing, reviewing, investigating, documenting, and closing exceptions.
- Privacy, access control, audit evidence, retention, and LLM data boundaries, sized to the real deployment model.

### Out of scope until explicitly agreed
- Posting journals or changing records in Dynamics 365.
- Claiming autonomous accounting decisions or guaranteed error detection.
- Universal integrations with every ERP or replacement of every specialist finance tool.
- Regulatory certification claims (including SOX compliance) without a defined control scope and independent validation.

## 3. Evidence rules

Every material finding must be labeled:
- **Verified:** directly supported by inspected source, test, configuration, user-provided artifact, or reproducible behavior.
- **Inferred:** plausible conclusion with cited basis, but not directly proven.
- **Unknown:** evidence was unavailable or insufficient.
- **Owner-stated:** supplied by the project owner, pending independent verification.

For repository review, record date, branch, commit SHA, commands run, and limitations. Cite file paths and symbols. Do not infer security from a README, correctness from test count, or absence from a partial search.

For financial outputs, seek an independent oracle (e.g., a separately computed control total) rather than testing a function only against itself.

## 4. Review method

1. Inventory repository and establish reproducible setup.
2. Read specifications, task board, and milestone artifacts; compare them with shipped code.
3. Run available tests and record exact outcomes; do not modify first to make tests pass.
4. Trace one synthetic GL file end to end, including rejected and corrected rows.
5. Recalculate selected totals independently and reconcile to source.
6. Review UI states and user journey, including empty, warning, error, and recovery states.
7. Threat-model data access, export, logging, AI use, and deployment.
8. Compare findings to reference-project evidence only where relevant.
9. Create findings, decisions, requirements, tickets, and a small first vertical slice.

## 5. Severity rubric

- **Critical:** Credible path to materially wrong financial output, unauthorized disclosure/action, or irrecoverable loss with no effective control.
- **High:** Serious likelihood or impact on correctness, traceability, or secure operation; must block affected release scope.
- **Medium:** Meaningful usability, reliability, or maintainability risk with a practical workaround.
- **Low:** Limited impact or quality improvement; schedule when justified.

Severity describes risk, not blame. Each finding requires impact, evidence, owner, remediation, and an acceptance test.

## 6. Required audit outputs

- Repository and runtime baseline.
- Claim verification table for prior audit statements.
- Architecture/data-flow map.
- Financial calculation and data-quality assessment.
- UI/UX workflow findings and priority usability risks.
- Security and privacy assumptions, threats, and controls.
- Findings register and deferred-risk list.
- Open questions that affect product or architecture.
- Updated requirements and decision log.
- Prioritized remediation backlog with testable exit criteria.

## 7. Audit questions to resolve

- Which Dynamics 365 product and export mechanism are used (Finance, Business Central, another configuration)?
- What file format, columns, account structure, dimensions, currencies, entities, and fiscal calendar are present?
- Are exports raw GL entries, trial balance, or both? Are corrections, reversals, and opening balances included?
- What does “abnormality” mean in the user's work today, and how is a suspected wrong entry confirmed?
- Who reviews and approves findings? Is there a formal close calendar or sign-off?
- Where will data be stored and processed, by whom, and can it leave the user's environment?
- Is the app personal/local, single-company, or intended for multiple users/tenants?
