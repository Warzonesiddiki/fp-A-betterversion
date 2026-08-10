# Consolidation, Ownership, Elimination & FX Policy Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Define the minimum reproducibility/control required for multi-entity financial consolidation.

## Scope rule

Consolidation is a governed run over frozen inputs; it is not a mutable dashboard calculation. GAAP/IFRS/local statutory claims remain out of scope until jurisdiction-specific policy and expert validation exist.

## Required policy/version objects

- Entity/ownership hierarchy with effective dates, ownership %, method, parent, eliminating entity.
- Consolidation scope and period/calendar policy.
- Account mapping and dimensional rules.
- FX rate source/type/effective-date/translation/remeasurement policy.
- Intercompany matching and elimination rules/tolerances.
- Minority interest, allocation, adjustment and manual journal policy where applicable.

## Reproducible run contract

Each run records scope, frozen ledger/import versions, ownership/rule/FX versions, engine version, actor/job/time, eliminations, validation outcomes, errors, output snapshot, and certification state. Re-run creates a new version; it never overwrites certified output.

## Required validations

Balance, entity inclusion, ownership effective date, FX completeness/freshness, mapped/unmapped account, intercompany match, elimination balance, translation reasonableness, prior-run variance, manual adjustment approval, and report reconciliation.

## UX

Users see run status, input versions, included/excluded entities, blockers, unmatched IC, FX exceptions, elimination evidence, validation results, and authorized drill-through. “Completed” differs from “completed with approved exceptions.”

## Validation

Use customer-shaped multi-entity golden data including ownership changes, multiple currencies/rate types, IC mismatch, partial ownership, adjustment period, failure/retry, and restatement. A qualified consolidation domain expert must approve policy semantics before customer claim.