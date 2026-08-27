# Governed Reporting & Board-Pack Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Ensure reports are reproducible communication artifacts, not mutable dashboard exports.

## Core rule

A published report is an immutable snapshot of a defined metric set, financial context, input versions, policy state, and distribution decision. A report viewer may show live analysis separately, but never silently substitute current data for a published result.

## Authoritative objects

| Object            | Required versioned evidence                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Metric Definition | owner, business definition, formula/calculation version, dimensions, currency/rounding, certification state |
| Report Definition | layout, metric references, filters, formatting, zero suppression, author/reviewer, lifecycle                |
| Report Run        | input-set IDs, fiscal/as-of context, run time, validation status, job/correlation ID                        |
| Snapshot          | report/run versions, frozen data/FX/context, publisher, certification/watermark, artifact hash              |
| Distribution      | recipient/group, entitlement policy, channel, expiry, access/export event                                   |
| Narrative Block   | author/AI source, citations, review state, factual claim links                                              |

## Lifecycle

`Draft → In Review → Approved for Publication → Published → Superseded / Retained`

A change to a definition, metric, layout, filter, recipient, or source after publication creates a new version/snapshot. Published artifacts cannot be overwritten.

## Required report capabilities

- P&L, balance sheet, cash flow, BvA, variance, management pack and board-pack patterns share metric/lineage contracts.
- Every displayed figure exposes authorized definition, context, source lineage, calculation/FX/rounding, freshness, and drill path.
- Report context names organization/entity scope, periods, comparison basis, scenario/version, currency and as-of time.
- Draft/preliminary/management-review/certified labels and export watermarks are explicit.
- PDF/XLSX/CSV exports contain report/snapshot ID, context, status, generation time, and audit event.
- Board narratives distinguish approved human content from AI-generated draft and link every factual claim to sources.

## Distribution and permission rules

Recipient access is intersected with tenant, entity, classification, snapshot sharing, expiration, and export policy. A shared board pack must not reveal restricted facts through drill-through, hidden worksheets, formulas, comments, metadata, or filename.

## Board-pack UX

```text
[Snapshot identity | status | as-of context | certification]
[Section outline] [print-aware report canvas] [evidence/comments inspector]
[Snapshot history] [distribution / export / access history]
```

A board-pack viewer prioritizes readability, stable hierarchy, and exact finance labels over interactive dashboard chrome.

## Acceptance evidence

- Reproduce a published number from frozen versions.
- Verify unauthorized recipient cannot infer restricted detail in UI/export.
- Test draft/certified watermark and export audit path.
- CFO/board-prep users retrieve source evidence for a material claim without engineering support.
- Validate narrative citations and AI/human review state.
