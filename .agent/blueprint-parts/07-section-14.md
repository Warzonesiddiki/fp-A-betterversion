# SECTION 14 — REPORTING & EXPORT ENGINE

## 14.1 Reporting philosophy

> A report is a **claim about the business**. A claim needs provenance, a version,
> and an owner. Reports in OmniPlan are reproducible artefacts, not screenshots.

Every rendered report captures a **snapshot** (`report_snapshots`) recording: the metric
versions used, the FX rate set, the scenario and period, the filter state, a content hash,
and the renderer version. Re-running the same snapshot id must produce byte-identical
numbers forever. If it cannot, the report was not reproducible and that is a defect.

## 14.2 Report catalogue

**Statutory / core financial**
Trial Balance · Profit & Loss (by entity, consolidated, by dimension) · Balance Sheet ·
Cash Flow (direct and indirect) · Statement of Changes in Equity · Consolidation
worksheet with eliminations · Intercompany matching report · FX translation and CTA
reconciliation.

**Management**
Budget vs Actual with variance and commentary · Rolling forecast vs plan · Departmental
P&L · Profitability by product/customer/channel/region · KPI scorecard · Headcount and
compensation analysis · CapEx schedule and depreciation roll-forward · Working capital
and DSO/DPO/DIO · Cohort analysis · Contribution margin waterfall.

**Board & external**
Board pack (Part XLVIII) · Investor update · Lender covenant compliance certificate ·
Audit evidence pack · Close package.

**Operational**
Data quality report · Unmapped accounts · Integration sync and reconciliation status ·
Lineage report for a selected figure · Access review export · Change log for a scenario.

## 14.3 Report builder

Drag-and-drop rows (accounts, hierarchies, metrics), columns (periods, scenarios,
entities, books, variance pairs), and filters (any dimension). Supports: nested grouping,
calculated rows and columns defined as metric expressions, conditional formatting rules,
custom headers/footers, page setup for print, and saved layouts shareable by permission.
A report definition is JSON and is versionable, diffable, and exportable between
environments (Part XL).

## 14.4 Board pack generator (Part XLVIII)

A board pack is a **compiled document**, not a folder of exports:

```
BP1  Sections are ordered, templated, and per-tenant configurable.
BP2  Every figure in the narrative is a live binding to a metric + period + scenario,
     not typed text. Regenerating the pack updates the prose figures.
BP3  Charts are rendered server-side for deterministic output.
BP4  AI may DRAFT commentary (Tier 2); a human must accept every paragraph before
     the pack can be marked FINAL. Unaccepted AI text is watermarked DRAFT.
BP5  The pack records the snapshot id of every underlying report. An auditor can
     open the pack and drill from any number to its lineage.
BP6  Version history with side-by-side diff between board meetings — including
     "what changed and why" derived from the audit log.
BP7  A pack cannot be marked FINAL while any underlying period is open or any
     included metric is uncertified.
```

## 14.5 Export formats

| Format | Fidelity requirement                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XLSX   | Live formulas preserved where the source was a formula; number formats, frozen panes, grouping, and tab structure retained. Not a CSV in a spreadsheet costume. |
| PDF    | Print-quality, paginated, headers/footers, page numbers, embedded fonts, deterministic pagination.                                                              |
| CSV    | RFC 4180, UTF-8 BOM optional, explicit decimal and thousands convention, currency column always present.                                                        |
| JSON   | Canonical schema, decimal amounts as strings (never JS numbers — RULE D1), lineage ids included.                                                                |
| PPTX   | Board-deck export of charts and tables (Phase 3).                                                                                                               |
| XBRL   | Statutory tagging (Phase 3, jurisdiction-scoped).                                                                                                               |

**Export integrity rules:** every export carries a footer/metadata block with tenant,
scenario, period, FX rate set, generation timestamp, generating user, snapshot id, and a
content hash. Exports of restricted fields respect field masking (Section 10.3) — an
export is not an escape hatch around permissions. Every export is an audited event
recording who exported what, when, and how many rows.

## 14.6 Scheduling & distribution

Reports can be scheduled (cron-like, fiscal-calendar-aware — "3rd business day after
period close" is expressible), delivered by email or webhook or to a storage target, with
recipient lists resolved from roles rather than hardcoded addresses, and with delivery
failures surfaced and retried. A scheduled report that fails silently is a defect.

## 14.7 Drill-through contract

From any number in any report, in one click: the contributing facts, their source
(manual/import/calculated/allocated), the formula or metric definition that produced it,
the lineage path back to the source system record, the audit trail of changes, and the
approval state. **This is the auditor's promise from Section 0 and it is testable:**
`tests/e2e/auditor-drill-through.spec.ts` asserts one click from a board-pack figure to a
source system record id.

## 14.8 Print & pixel fidelity

Print stylesheets are first-class, not an afterthought: page breaks respect logical group
boundaries, headers repeat on every page, wide reports scale or split predictably, and the
printed output matches the PDF byte-for-byte in layout. Finance still prints board packs;
pretending otherwise is not a strategy.
