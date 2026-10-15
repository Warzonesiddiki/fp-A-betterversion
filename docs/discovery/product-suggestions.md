# Product and Feature Suggestions

**Status:** Brainstorming options; not approved scope. Recommendations are conditional on audit evidence and workflow discovery.

## Product direction

Aim for an integrated **FP&A close and review workspace**: the user can import or connect the finance data, validate it, analyze it, investigate exceptions, document decisions, and produce a reviewable output in one coherent experience. Keep Dynamics 365 as the source of accounting records unless a later decision explicitly changes that.

“One-stop” should mean a coherent user journey for the selected use cases—not an attempt to reproduce every adjacent product at once.

## Opportunity map

### 1. Monthly period workspace — recommended foundation
A period has a clear status (not started, importing, needs attention, ready for review, reviewed/exported), data scope, timestamps, and responsible user if applicable.

**Why:** Gives the user a home for the monthly task and prevents orphaned files/results.

### 2. Safe import and reconciliation — release gate
- Import preview and column mapping for the agreed D365 export.
- File/period identity and duplicate-import safeguards.
- Row-level validation with downloadable error detail.
- Atomic acceptance or an explicit partial-import policy; never silently drop malformed rows.
- Control totals and reconciliation status before analysis is labeled ready.

### 3. Explainable exception review — differentiator
Provide a queue of unusual items or movements with reason codes, evidence, and review status. Begin with transparent deterministic rules (e.g., duplicate candidate, unusual period/account movement) only after fields and expected behavior are agreed.

Each flag should show:
- What triggered it and the rule/version used.
- Source transaction details and nearby comparison context.
- Confidence/limitations only when meaningfully calibrated; otherwise do not invent a confidence score.
- User disposition: confirmed issue, expected, needs follow-up, false positive, or other agreed categories.
- Reviewer note and timestamps where required.

A flag is not proof of an error. Never silently change or post a transaction.

### 4. Financial views — prove a small set first
Start with views the user's work actually requires, such as a period P&L or selected account variances. For every metric define inputs, formula, sign convention, currency, period logic, and missing-data behavior. Do not add attractive but unsupported ratios.

### 5. Commentary assistant — later, constrained
Only after deterministic calculations and source traceability are dependable:
- Generate draft wording from approved, structured facts.
- Attach each numerical claim to a verified value ID/source.
- Reject unsupported numerical claims and mark missing context.
- Make the text editable and clearly labeled as a draft.
- Use a deterministic fallback when AI is disabled/unavailable.
- Apply an explicit data-egress policy; never assume a provider is permitted.

### 6. Planning and forecasting — discover before building
Potential future modules: budgets, forecasts, scenario planning, assumptions, department collaboration, and forecast-versus-actual. These require source inputs and workflows beyond a GL export. Confirm current tools and user pain before expanding.

### 7. Integrations — staged strategy
- First: reliable, documented file import for one export format.
- Next: validate repeatability and user value; improve mapping and templates.
- Later: assess a supported Dynamics 365 API/connector with authentication, least privilege, and reconciliation. Do not build a connector before understanding the user's tenant, permissions, environment, licensing, and security constraints.

## Build / buy / integrate questions

For each adjacent capability, ask whether the product should own it, integrate with it, or leave it to the existing system:
- General ledger and journal posting.
- Budget/forecast authoring.
- Consolidation and intercompany.
- BI/dashboarding.
- Close checklist and approvals.
- Spreadsheet collaboration and export.

Evaluate user value, data access, control requirements, implementation cost, and ongoing support—not just feature completeness.

## Suggested product phases

**Foundation:** one user, one agreed export schema, one period workflow, data validation, reconciliation, traceable calculations.  
**Review:** explainable exception queue, notes/disposition, exportable review evidence, usability testing.  
**Team:** roles, assignments, approvals, shared history, deployment/retention controls based on actual threat model.  
**Expansion:** budgets/forecasts, additional D365 configurations, connector/API, constrained AI commentary, additional ERP sources only when justified.

## Ideas to resist until proven

- “AI detects all wrong entries.” Detection requires a defined error taxonomy, sufficient data, validation, and human review.
- “All metrics from GL.” Many operational ratios need payroll, sales quantity, inventory, headcount, or other feeds.
- Full ERP replacement or journal posting in the first release.
- Large configurable rule engines before a small set of useful rules is validated.
- Multi-tenant/RBAC complexity without a real user/deployment model (while still protecting sensitive local data appropriately).
- Polishing dashboard visuals before import truth, calculations, and error states are trustworthy.
