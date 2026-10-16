# UI/UX Discovery Brief

**Status:** Proposed design direction for brainstorming and validation.

## UX objective

Help a finance user complete a monthly review with confidence and low friction. The interface should make it easy to answer: **What data is this? Is it complete? What changed? What needs my attention? Why is this flagged? What evidence supports this number? What should I do next?**

## Proposed information architecture

- **Periods** — monthly workspaces and completion state.
- **Import & data quality** — source file, mapping, validation, control totals, reconciliation.
- **Overview** — period summary and only the most decision-useful indicators.
- **Financials** — agreed statements/variance views with drill-down.
- **Exceptions** — review queue, filters, evidence, notes, dispositions.
- **Reports & exports** — reproducible outputs and scope metadata.
- **Settings** — mappings, policy, users, integrations as supported by product scope.

Validate these labels and navigation against user language; they are not settled.

## Priority screen concepts

### A. Period home
- Period, entity, currency, and data source visible.
- Progress/status with meaningful blockers and next action.
- Import/reconciliation timestamp and comparison basis.
- Key summary only when underlying data is verified.
- Prominent “needs attention” count that links to actionable detail, not a decorative KPI.

### B. Import review
- Drag/drop or file selection only if supported by implementation/security design.
- Filename, period, sheet/table, detected headers, and mapping preview.
- Validation summary: accepted, rejected, duplicate candidates, warnings.
- Row-level error list with source row/field and correction guidance.
- Clear distinction between blocked import and accepted-with-warnings.
- No silent truncation or ambiguous “success” when reconciliation fails.

### C. Financial analysis
- Explicit entity, period, currency, and comparison context.
- Account hierarchy and totals with consistent sign conventions.
- Drill from summary to contributing accounts/transactions.
- Show formula/definition and “data as of” context for derived values.
- Avoid excessive charting; tables should support scanning, sorting, filtering, and keyboard access.

### D. Exception investigation
- Queue with reason, amount/context, account, period, source reference, and status.
- Filters for severity/materiality only where a policy defines them.
- Detail panel with the source transaction, rule explanation, comparable history if valid, and relevant notes.
- Actions such as mark expected, confirm issue, request follow-up, or defer—only after user workflow is agreed.
- Never style an automated flag as a confirmed accounting error.

### E. Report/export
- Show exactly what is included, filter/scope, period, currency, data version, and unresolved items.
- Preview before export; record export generation time and applied definitions where appropriate.

## Interaction and visual principles

- Calm, focused visual hierarchy; reserve strong color for meaningful status and exceptions.
- Use labels and icons in addition to color; support keyboard navigation and screen readers.
- Keep financial tables legible: alignment, totals, negative values, precision, and units must be unambiguous.
- Preserve filters and context when moving from a summary to details and back.
- Provide undo/recovery for user edits where feasible; require confirmation for destructive actions.
- Explain technical validation failures in user language, with actionable resolution steps.
- Use progressive disclosure for advanced detail without hiding provenance or warnings.

## Required states for every key screen

- Initial/empty state with the next action.
- Loading state with no false completion claim.
- Success state that says what was actually completed.
- Warning state for accepted data with known limitations.
- Blocking error with recovery path.
- No results state that distinguishes “none found” from “not calculated.”
- Permission or unavailable-data state where relevant.

## UX research and validation plan

1. Observe the owner complete a representative month-end workflow using a synthetic/anonymized file.
2. Capture current steps, time, rework, decision points, and artifacts—not just stated preferences.
3. Create low-fidelity wireframes for Period Home, Import Review, Analysis, and Exception Investigation.
4. Test task completion: import, resolve a validation issue, trace a value, investigate a flag, record a disposition, export a review.
5. Record confusion, errors, time, and trust questions; revise before high-fidelity implementation.
6. Validate accessibility basics: keyboard-only operation, focus order, contrast, semantic labels, zoom/responsive layouts.

## Decisions still needed

- Primary user role and whether others review/approve.
- Desktop-only versus responsive use.
- Currency and number-format preferences.
- Preferred action/disposition vocabulary.
- Whether to prioritize exception review or financial statement analysis as the first landing experience.
- Export format and required handoff evidence.
