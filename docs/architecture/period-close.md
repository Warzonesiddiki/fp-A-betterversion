# Period Close Architecture

## Overview

FinPlan Pro implements SOX-compliant period locking via `PeriodCloseEngine`.

## Key Controls

- **Period Locks**: Prevents back-posting or mutations to closed fiscal periods in GL entries, budgets, forecasts, and actuals.
- **Workflow & Dependencies**: Task dependency graph validation ensures all closing checklist items (reconciliations, adjustments, approvals) are completed before period closure.
- **Audit & Reopen**: Reopening a closed period requires administrative permission, a mandatory justification reason, and triggers an immutable audit log entry.
