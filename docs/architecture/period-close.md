# Period Close Architecture

## Overview

FinPlan Pro has a local period-close state machine and workflow. This is not a SOX-compliance claim: DEC-102 records the owner's decision that the product is not a SOX compliance system and the local chain is not SOX authority. DEC-008 write-guard coverage remains partial.

## Key Controls

- **Period Locks**: The client state machine locks a period and the current transition tests cover budget-line-item/scenario propagation. DEC-008 still requires guards on every write surface; do not infer GL, forecast, undo/redo, and all actuals are covered.
- **Workflow & Dependencies**: Task dependency graph validation ensures all closing checklist items (reconciliations, adjustments, approvals) are completed before period closure.
- **Close-event history & Reopen**: Reopen transitions require authorization and a meaningful reason, and append to a per-period close-event sequence. Its unkeyed SHA-256 consistency check preserves stored append order and verifies each period separately; it has no external anchor and is not tamper-proof against a full rewrite. This domain journal is separate from `auditTrailStore` and is not SOX evidence.
