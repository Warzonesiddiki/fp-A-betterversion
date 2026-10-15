# Current Workflow and Discovery

**Status:** Initial owner-stated baseline; details pending interview and artifact review.

## Known monthly pattern

1. The user exports a GL dump from Dynamics 365 each month.
2. The user performs FP&A-related work using/around the export.
3. The user highlights abnormalities and entries they believe may be wrong.

The steps between export and review, the exact analyses, and the resolution process are not yet documented. Do not assume the user imports into the target application today.

## Workflow map to validate

| Stage | User goal | Questions/evidence needed | Product opportunity (proposed) |
|---|---|---|---|
| Prepare period | Define period, entity, currency, and close context | Fiscal calendar? Entity structure? Comparison periods? | Period workspace with explicit scope |
| Export | Obtain the correct Dynamics 365 data | Which D365 product/version? Export steps? File and columns? | Guided export checklist; later evaluate connector/API |
| Import | Bring data into analysis safely | File size, encoding, headers, repeated exports, permissions? | Preview, schema mapping, duplicate detection, atomic validation |
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
