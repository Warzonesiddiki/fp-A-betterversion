# Current Workflow and Discovery

**Status:** Owner-stated D365 workflow plus broader product direction; detailed operating facts remain pending interview and artifact review. The 2026-11-04 master execution proposal is [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md).

## Known monthly pattern

1. The user exports a GL dump from Dynamics 365 each month.
2. The user performs FP&A-related work using/around the export.
3. The user highlights abnormalities and entries they believe may be wrong.
4. **The user guides the accounts team to fix those entries.** (Owner-stated
   2026-10-18: *"i have to identify the wrong entries and guide accounts team to
   fix it"* — the output of the review is a correction the accounting team acts
   on, not a private note.)
5. **The comparison work is day-over-day, month-over-month and year-over-year,
   in extreme detail.** (Owner-stated 2026-10-18: *"as i compare day by day,
   month by month, year on year compariosion where i compare and check each and
   everything in extreme detail"* — all three grains matter, and the review is
   exhaustive rather than a top-line scan.)

Recorded as FR-010 (correction hand-off with owner and due date) and FR-011
(day / month / year comparison at account level) in
[`requirements-register.md`](requirements-register.md); the working order for
building them is [`../agent/WORKING_AGREEMENT.md`](../agent/WORKING_AGREEMENT.md) §4.

**Broader owner direction (2026-11-04):** one-stop FP&A with no mandatory
other app for supported work; accounting/ERP data usable through the product's
own user-customizable format; extensibility to every industry. DEC-033 records
all FP&A as the ultimate scope and DEC-104 accepts universal import through user
templates. This expands the product goal, not the known monthly D365 workflow
facts. D365 remains the first owner-specific real-source proof; provider and
industry support are not yet certified. See the detailed proposal in
[`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md).

Still not documented, and not to be assumed:

- what "extreme detail" is scoped to (which accounts, entities and periods),
- the materiality threshold that decides which differences are worth surfacing,
- how the accounts team receives and closes a correction today (email, a
  spreadsheet, an ERP note?), and what proves it was fixed,
- the exact analyses performed between export and review.

Do not assume the user imports into the target application today.

## Workflow map to validate

| Stage | User goal | Questions/evidence needed | Product opportunity (proposed) |
|---|---|---|---|
| Prepare period | Define period, entity, currency, and close context | Fiscal calendar? Entity structure? Comparison periods? | Period workspace with explicit scope |
| Export | Obtain the correct Dynamics 365 data for the first real-source proof; later accept other accounting/ERP exports | Which D365 product/version/report? Which other ERPs are used? Export steps, file, columns and source controls? | Guided export checklist; user-mappable CSV/XLSX templates as baseline; optional validated API connector |
| Import | Bring data into analysis safely through one user-facing template path | File size/encoding/locale, headers, custom fields, repeated exports, mapping version and permissions? | Template selection/create/preview/version, row reasons, source controls, duplicate policy and atomic validation |
| Validate | Establish completeness and correctness | Control totals? Row count? Missing account/dimensions? | Validation report with row-level errors and reconciliation status |
| Analyze | Perform FP&A analysis | Which exact reports, budgets, forecasts, dimensions? | Agreed actuals and variance views with drill-down |
| Investigate | Understand abnormal or suspected wrong entries | Current heuristics? Materiality? Who confirms? | Explainable flag queue; source-row evidence; human disposition |
| Document | Preserve review rationale | Notes, evidence, ownership, due dates, approvals? | Case-style exception record and audit history |
| Report/hand off | Share final output | Excel, PDF, BI, email, review package? | Reproducible export with scope and provenance |

## Discovery questions (prioritize with owner)

### Workflow and users
1. What are the top three tasks you do after downloading the monthly GL?
2. Which task is most time-consuming, repetitive, or error-prone?
3. Who else uses or reviews the analysis? What does each person need to do?
4. What must be completed before you consider the month-end review done?
5. Which spreadsheets, BI tools, close tools, or finance apps are used today, and what should remain in them?

### Data and Dynamics 365
6. Which Dynamics 365 product and version/configuration is in use?
7. Can you share a synthetic or anonymized sample export plus a column dictionary? Do not share confidential production data.
8. Is the export journal-level, trial balance, or both? Which fields identify journal, voucher, account, entity, date, currency, dimensions, debit, and credit?
9. How are fiscal periods, posting dates, reversals, opening balances, intercompany, and foreign currency handled?
10. What control totals or reports from Dynamics 365 can independently validate an import?

### Abnormality and review
11. What specific patterns do you flag (unusual amount, account, timing, description, duplicate, unexpected dimension, variance, etc.)?
12. Which flags are useful versus noisy? How do you decide an entry is actually wrong?
13. What is material, and does materiality vary by account/entity/period?
14. What action follows a flag—comment, ask an owner, adjust a forecast, request correction, or escalate?
15. Do you need evidence, assignment, status, due date, resolution reason, or approval history?

### Output and experience
16. What do you need to present: management P&L, balance sheet, variance commentary, exception list, forecast, or another deliverable?
17. What output format and level of detail are required?
18. Which information must be visible without clicking? What should be drillable?
19. What would make you trust or distrust a displayed number?
20. What device, accessibility, language, and performance expectations matter?

### Security and deployment
21. Is this currently a personal tool or intended for a team/company?
22. Where may finance data be stored and processed? Is cloud processing permitted?
23. Are AI services allowed to receive any part of the data? What redaction or no-egress requirement applies?
24. What retention, deletion, backup, and access expectations apply?

## Safe sample-data request

Prefer a fully synthetic export that preserves realistic structure and edge cases. If using anonymized data, remove names, email addresses, customer/vendor identifiers, free-text sensitive content, and any business-sensitive amounts unless explicitly authorized. Preserve only the fields needed to test behavior.
