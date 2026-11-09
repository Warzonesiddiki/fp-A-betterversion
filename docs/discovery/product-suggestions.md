# Product and Feature Suggestions

**Status:** Historical brainstorming; options remain unapproved unless recorded in the decision log. DEC-104 and the 2026-11-04 owner direction now set a broader target. Follow [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md) for the current proposed strategy and staged review; do not read the older D365-first sequence below as a scope ceiling.

## Product direction

Aim for an integrated **all-in-one FP&A workspace**: the user can bring finance data from accounting/ERP systems through a user-customizable mapping/template or a validated provider connector, validate/reconcile it, analyze, plan, investigate exceptions, document decisions and produce reviewable outputs in one coherent experience. DEC-104 accepts the universal template direction; Dynamics 365 is the first owner-specific proof, not the source boundary. The ERP remains the system of record unless a later decision explicitly approves write-back.

“One-stop” means no mandatory external FP&A app or spreadsheet hop for the supported journey. The all-industry aspiration should use a shared FP&A core plus reviewed, configurable industry packs; it is not a claim that every vertical is currently supported.

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

### 7. ERP/finance data intake — staged hybrid strategy
- First: converge the existing CSV/XLSX upload profiles and universal template engine into one user-facing mapping/validation path and canonical financial contract.
- Then: validate D365 export shapes the owner uses against anonymized samples and source control totals; generic user-mapped exports remain the broad baseline for other ERP/accounting tools.
- Later: add native APIs only for prioritized providers, with official versioned API research, least privilege, secure token lifecycle, pagination/update/delete behavior and source reconciliation. Do not interpret an API connector or catalog badge as complete GL support.

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

**Foundation:** approved source/template contract, the owner-used D365 shapes, reconciliation, close and traceable calculations.
**Review:** the J2/J3/J4 in-app journey with owner/account-team acceptance; exports are optional.
**Expand:** prioritized provider APIs and broader FP&A pillars on the trusted spine; measure real outcomes.
**Industry:** versioned configurable packs chosen with the owner and domain reviewers; no certification without representative evidence.
**Deployment:** resolve local single-user vs team/shared access, data egress, secrets, backup and recovery before shipping that operating model.

## Ideas to resist until proven

- “AI detects all wrong entries.” Detection requires a defined error taxonomy, sufficient data, validation, and human review.
- “All metrics from GL.” Many operational ratios need payroll, sales quantity, inventory, headcount, or other feeds.
- Full ERP replacement or journal posting in the first release.
- Large configurable rule engines before a small set of useful rules is validated.
- Multi-tenant/RBAC complexity without a real user/deployment model (while still protecting sensitive local data appropriately).
- Polishing dashboard visuals before import truth, calculations, and error states are trustworthy.
